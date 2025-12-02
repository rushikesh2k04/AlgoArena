import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trophy, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePeraWallet } from "@/hooks/usePeraWallet";
import { claimReward } from "@/utils/algoReward";
import { mintGameNFT, transferNFT } from "@/utils/nftReward";
import { recordGameSession } from "@/utils/gameSession";
import waterSortIcon from "@/assets/water-sort-icon.jpg";

import pourSfx from "@/assets/sounds/pour.wav";
import errorSfx from "@/assets/sounds/error.wav";
import winSfx from "@/assets/sounds/win.wav";

type Tube = string[];
type GameState = Tube[];

const TUBE_CAPACITY = 4;
const NUM_TUBES = 6;
const COLORS = ["red", "blue", "green", "yellow"];

const MAX_REWARD = 7;
const MIN_REWARD = 1;

// ========= GAME HELPERS =========

const isWinState = (tubes: GameState) => {
  for (const tube of tubes) {
    if (tube.length === 0) continue;
    if (tube.length !== TUBE_CAPACITY) return false;
    if (!tube.every((c) => c === tube[0])) return false;
  }
  return true;
};

const cloneState = (state: GameState): GameState => state.map((t) => [...t]);

const serializeState = (state: GameState) =>
  state.map((t) => t.join(",")).join("|");

const canPour = (state: GameState, from: number, to: number): boolean => {
  if (from === to) return false;
  const fromTube = state[from];
  const toTube = state[to];

  if (fromTube.length === 0) return false;
  if (toTube.length === TUBE_CAPACITY) return false;

  const topColor = fromTube[fromTube.length - 1];
  if (toTube.length === 0) return true;
  return toTube[toTube.length - 1] === topColor;
};

// multi-pour: all contiguous same color from top in one move
const applyMove = (state: GameState, from: number, to: number): GameState => {
  const newState = cloneState(state);
  const fromTube = newState[from];
  const toTube = newState[to];

  if (fromTube.length === 0 || toTube.length === TUBE_CAPACITY) return newState;

  const topColor = fromTube[fromTube.length - 1];

  let available = 1;
  for (let i = fromTube.length - 2; i >= 0; i--) {
    if (fromTube[i] === topColor) available++;
    else break;
  }

  const space = TUBE_CAPACITY - toTube.length;
  const pourAmount = Math.min(available, space);

  for (let i = 0; i < pourAmount; i++) {
    toTube.push(fromTube.pop()!);
  }

  return newState;
};

const getAllMoves = (state: GameState): Array<[number, number]> => {
  const moves: Array<[number, number]> = [];
  for (let from = 0; from < NUM_TUBES; from++) {
    for (let to = 0; to < NUM_TUBES; to++) {
      if (canPour(state, from, to)) moves.push([from, to]);
    }
  }
  return moves;
};

const computeMinimalMoves = (initial: GameState): number => {
  if (isWinState(initial)) return 0;

  const startKey = serializeState(initial);
  const visited = new Set<string>([startKey]);

  type Node = { state: GameState; depth: number };
  const queue: Node[] = [{ state: initial, depth: 0 }];

  while (queue.length > 0) {
    const { state, depth } = queue.shift()!;
    const moves = getAllMoves(state);

    for (const [from, to] of moves) {
      const nextState = applyMove(state, from, to);
      const key = serializeState(nextState);
      if (visited.has(key)) continue;
      if (isWinState(nextState)) return depth + 1;
      visited.add(key);
      queue.push({ state: nextState, depth: depth + 1 });
    }
  }

  return 0;
};

const randomInitialState = (): GameState => {
  while (true) {
    const pool: string[] = [];
    COLORS.forEach((c) => {
      for (let i = 0; i < TUBE_CAPACITY; i++) pool.push(c);
    });

    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const tubes: GameState = [[], [], [], [], [], []];

    let idx = 0;
    for (let t = 0; t < 4; t++) {
      for (let s = 0; s < 4; s++) {
        tubes[t].push(pool[idx++]);
      }
    }

    if (!isWinState(tubes)) return tubes;
  }
};

// ========= REWARD (7 ALGO only at optimal moves) =========

const calculateReward = (moves: number, minMoves: number): number => {
  if (moves === minMoves) {
    return MAX_REWARD;
  }

  if (moves < minMoves) {
    // Just in case BFS underestimates; treat as max too.
    return MAX_REWARD;
  }

  const extra = moves - minMoves;
  const MAX_EXTRA = minMoves * 2 || 10;
  const clamped = Math.min(extra, MAX_EXTRA);
  const ratio = clamped / MAX_EXTRA; // 0 → 1
  const rewardFloat = MAX_REWARD - ratio * (MAX_REWARD - MIN_REWARD);

  const reward = Math.max(MIN_REWARD, Math.round(rewardFloat));
  // moves > minMoves ⇒ force < 7
  return Math.min(reward, MAX_REWARD - 1);
};

// ========= COMPONENT =========

export default function WaterSort() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { accountAddress, optInToAsset } = usePeraWallet();

  const [tubes, setTubes] = useState<GameState>([]);
  const [minMoves, setMinMoves] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [rewardAmount, setRewardAmount] = useState<number | null>(null);
  const [nftAssetId, setNftAssetId] = useState<number | null>(null);
  const [showOptInPrompt, setShowOptInPrompt] = useState(false);

  const [isPouring, setIsPouring] = useState(false);
  const [pourInfo, setPourInfo] = useState<{ from: number; to: number; color: string } | null>(null);

  const pourSoundRef = useRef<HTMLAudioElement | null>(null);
  const errorSoundRef = useRef<HTMLAudioElement | null>(null);
  const winSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    pourSoundRef.current = new Audio(pourSfx);
    errorSoundRef.current = new Audio(errorSfx);
    winSoundRef.current = new Audio(winSfx);
  }, []);

  const playSound = (type: "pour" | "error" | "win") => {
    const map = {
      pour: pourSoundRef.current,
      error: errorSoundRef.current,
      win: winSoundRef.current,
    };
    const audio = map[type];
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  };

  const setupNewGame = () => {
    let puzzle: GameState | null = null;
    let optimal = 0;

    for (let attempt = 0; attempt < 6; attempt++) {
      const candidate = randomInitialState();
      const opt = computeMinimalMoves(candidate);
      if (opt > 0 && opt <= 40) {
        puzzle = candidate;
        optimal = opt;
        break;
      }
    }

    if (!puzzle) {
      puzzle = randomInitialState();
      optimal = computeMinimalMoves(puzzle) || 20;
    }

    setTubes(puzzle);
    setMinMoves(optimal || 20);
    setSelected(null);
    setMoves(0);
    setGameWon(false);
    setRewardClaimed(false);
    setRewardAmount(null);
    setNftAssetId(null);
    setShowOptInPrompt(false);
    setIsPouring(false);
    setPourInfo(null);
  };

  useEffect(() => {
    setupNewGame();
  }, []);

  const handleTubeClick = (index: number) => {
    if (gameWon || isPouring) return;

    if (selected === null) {
      if (tubes[index].length > 0) setSelected(index);
      return;
    }

    if (selected === index) {
      setSelected(null);
      return;
    }

    const from = selected;
    const to = index;
    const fromTube = tubes[from];
    const toTube = tubes[to];

    if (fromTube.length === 0) {
      setSelected(null);
      return;
    }
    if (toTube.length === TUBE_CAPACITY) {
      toast({ title: "Tube is full!", variant: "destructive" });
      playSound("error");
      setSelected(null);
      return;
    }

    const topColor = fromTube[fromTube.length - 1];
    if (toTube.length > 0 && toTube[toTube.length - 1] !== topColor) {
      toast({ title: "Colors don't match!", variant: "destructive" });
      playSound("error");
      setSelected(null);
      return;
    }

    playSound("pour");
    setIsPouring(true);
    setPourInfo({ from, to, color: topColor });

    setTimeout(() => {
      // use current tubes/moves snapshot (we disabled input while pouring)
      const newState = applyMove(tubes, from, to);
      const newMoves = moves + 1;

      setTubes(newState);
      setMoves(newMoves);

      if (!gameWon && minMoves !== null && isWinState(newState)) {
        const reward = calculateReward(newMoves, minMoves);
        setRewardAmount(reward);
        setGameWon(true);
        playSound("win");
        toast({
          title: "Puzzle Solved!",
          description: `Optimal: ${minMoves} moves • You: ${newMoves} moves • Reward: ${reward} ALGO`,
        });
      }

      setSelected(null);
      setIsPouring(false);
      setPourInfo(null);
    }, 350);
  };

  const resetGame = () => {
    setupNewGame();
  };

  useEffect(() => {
    if (gameWon && !rewardClaimed && accountAddress && rewardAmount !== null) {
      const reward = rewardAmount;

      claimReward(accountAddress, reward).then((success) => {
        if (success) {
          setRewardClaimed(true);
          toast({
            title: "Reward Claimed!",
            description: `${reward} ALGO has been credited to your wallet!`,
          });
        } else {
          toast({
            title: "Reward Claim Failed",
            description: "Please try again or check your wallet connection.",
            variant: "destructive",
          });
        }
      });

      const matchId = `watersort-${Date.now()}`;
      const difficulty =
        moves === (minMoves ?? moves)
          ? "perfect"
          : moves < 50
          ? "easy"
          : moves < 100
          ? "medium"
          : "hard";

      mintGameNFT(
        accountAddress,
        "Water Sort",
        moves,
        waterSortIcon,
        matchId,
        difficulty
      ).then((result) => {
        if (result.success && result.assetId) {
          setNftAssetId(result.assetId);
          setShowOptInPrompt(true);
          toast({
            title: "NFT Achievement Created!",
            description: "Your game achievement NFT has been created. Please opt-in to receive it.",
          });

          recordGameSession({
            playerWalletAddress: accountAddress,
            gameName: "Water Sort",
            score: 100,
            rewardAmount: reward,
            nftAssetId: result.assetId,
            difficulty,
          });
        } else {
          recordGameSession({
            playerWalletAddress: accountAddress,
            gameName: "Water Sort",
            score: 100,
            rewardAmount: reward,
            difficulty,
          });
        }
      });
    }
  }, [gameWon, rewardClaimed, accountAddress, rewardAmount, toast, moves, minMoves]);

  const handleOptInAndReceiveNFT = async () => {
    if (!nftAssetId || !accountAddress) return;

    const optInSuccess = await optInToAsset(nftAssetId);
    if (optInSuccess) {
      const transferSuccess = await transferNFT(accountAddress, nftAssetId);
      if (transferSuccess) {
        setShowOptInPrompt(false);
        toast({
          title: "NFT Received!",
          description: "Your achievement NFT has been transferred to your wallet!",
        });
      }
    }
  };

  const colorMap: { [key: string]: string } = {
    red: "#EF4444",
    blue: "#3B82F6",
    green: "#10B981",
    yellow: "#F59E0B",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50 relative overflow-hidden">
      {/* background glows */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-32 -left-32 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 max-w-4xl py-10">
        {/* top bar */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="mb-2 border-slate-700 bg-slate-900/60 hover:bg-slate-800/80"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Games
          </Button>

          <div className="flex items-center gap-6">
            {minMoves !== null && (
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                  Optimal
                </p>
                <p className="text-sm font-semibold text-emerald-400">
                  {minMoves}
                </p>
              </div>
            )}
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                Moves
              </p>
              <p className="text-2xl font-semibold text-sky-400">
                {moves}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={resetGame}
              className="border-slate-700 bg-slate-900/60 hover:bg-slate-800/80"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Card className="relative overflow-hidden border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-[0_0_40px_rgba(56,189,248,0.12)] p-6 md:p-8">
          {/* header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full bg-slate-900/80 px-4 py-1 border border-sky-500/30 shadow-inner">
                <div className="h-7 w-7 rounded-full bg-sky-500/20 flex items-center justify-center">
                  <span className="text-sky-300 text-sm">💧</span>
                </div>
                <span className="text-xs uppercase tracking-[0.15em] text-slate-400">
                  On-chain Water Sort
                </span>
              </div>
              <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
                Water Sort
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Pour and sort the colored water into glasses so each glass
                holds a single color. Smooth pours, real rewards.
              </p>
            </div>
          </div>

          {/* win banner */}
          {gameWon && rewardAmount !== null && (
            <div className="mb-6 rounded-2xl border border-amber-300/30 bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-500/15 px-4 py-4 text-center shadow-[0_0_30px_rgba(251,191,36,0.2)]">
              <Trophy className="w-10 h-10 mx-auto mb-2 text-amber-300 drop-shadow" />
              <p className="text-lg font-semibold text-amber-100">
                Optimal: {minMoves} • You: {moves} • Reward: {rewardAmount} ALGO 🎉
              </p>
              <p className="text-xs text-amber-200/80 mt-1">
                + NFT Achievement Badge
              </p>
              {showOptInPrompt && nftAssetId && (
                <div className="mt-3">
                  <Button
                    onClick={handleOptInAndReceiveNFT}
                    variant="default"
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold shadow-md"
                  >
                    Opt-in & Receive NFT
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="mb-6 text-center text-slate-400 text-sm">
            Tap a glass to select, then tap another to pour. All same-color
            water on top flows together in a single smooth pour.
          </div>

          {/* TUBES GRID (realistic glass, fixed-size water blocks) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5 mt-4">
            {tubes.map((tube, index) => {
              const isSelected = selected === index;
              const isFromPour = pourInfo && pourInfo.from === index && isPouring;
              const isToPour = pourInfo && pourInfo.to === index && isPouring;

              return (
                <button
                  key={index}
                  onClick={() => handleTubeClick(index)}
                  className={`
                    relative h-72 flex items-end justify-center
                    transition-all duration-200
                    hover:-translate-y-1
                    ${isSelected ? "scale-[1.03]" : "scale-100"}
                  `}
                  disabled={isPouring && !isSelected && !isFromPour && !isToPour}
                >
                  {/* Glass outer */}
                  <div
                    className={`
                      absolute inset-x-3 bottom-3 top-1
                      rounded-[999px]
                      bg-gradient-to-b from-slate-200/10 via-slate-100/8 to-slate-50/5
                      border border-white/10
                      shadow-[0_18px_45px_rgba(15,23,42,0.9)]
                      backdrop-blur-xl
                      ${isSelected ? "ring-2 ring-sky-400/70 border-sky-300/60" : ""}
                    `}
                  />

                  {/* Glass inner wall */}
                  <div className="absolute inset-x-5 bottom-4 top-2 rounded-[999px] border border-white/10 bg-gradient-to-b from-white/8 via-transparent to-black/20" />

                  {/* Rim ellipse */}
                  <div className="absolute inset-x-6 top-1 h-4 rounded-full bg-gradient-to-b from-white/70 via-white/20 to-transparent border border-white/50 shadow-[0_6px_12px_rgba(15,23,42,0.6)]" />

                  {/* Inner content area with fixed-size water blocks */}
                  <div className="relative z-10 flex flex-col-reverse w-[70%] h-[78%] mb-4 gap-1">
                    {tube.map((color, i) => {
                      const base = colorMap[color] ?? "#38bdf8";
                      return (
                        <div
                          key={i}
                          className="h-10 rounded-[10px] shadow-inner border border-white/18 overflow-hidden relative"
                          style={{
                            backgroundColor: base,
                            backgroundImage:
                              "radial-gradient(circle at 10% 0%, rgba(255,255,255,0.65), transparent 55%), linear-gradient(to top, rgba(15,23,42,0.5), rgba(15,23,42,0.1))",
                            backgroundBlendMode: "screen, soft-light",
                          }}
                        >
                          {/* water surface shine */}
                          <div className="absolute inset-x-[-2px] top-[-3px] h-2 rounded-full bg-white/45 blur-[1px] opacity-80" />
                          {/* side highlight */}
                          <div className="absolute inset-y-1 left-1 w-1 rounded-full bg-white/30 opacity-70" />
                          {/* soft bottom gradient */}
                          <div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
                        </div>
                      );
                    })}
                  </div>

                  {/* Pour hints */}
                  {isFromPour && pourInfo && (
                    <div className="pointer-events-none absolute -right-2 top-10 w-3 h-24 rounded-full bg-gradient-to-b from-white/70 via-sky-300/80 to-sky-500/80 opacity-90 animate-pulse" />
                  )}
                  {isToPour && pourInfo && (
                    <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-4 w-10 h-6 rounded-full bg-sky-300/40 blur-md" />
                  )}

                  {/* Base */}
                  <div className="absolute bottom-0 left-6 right-6 h-4 rounded-full bg-slate-900/90 border border-slate-700/90 shadow-[0_10px_25px_rgba(15,23,42,1)]" />
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
