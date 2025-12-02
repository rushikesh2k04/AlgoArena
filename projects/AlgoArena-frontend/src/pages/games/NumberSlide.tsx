import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trophy, RotateCcw, MoveRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePeraWallet } from "@/hooks/usePeraWallet";
import { claimReward } from "@/utils/algoReward";
import { mintGameNFT, transferNFT } from "@/utils/nftReward";
import { recordGameSession } from "@/utils/gameSession";
import numberSlideIcon from "@/assets/2048-icon.jpg";

type Board = (number | null)[][];

const BOARD_SIZE = 4;
const MAX_MOVES = 200;

const createEmptyBoard = (): Board =>
  Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));

const addNewTile = (board: Board) => {
  const empty: [number, number][] = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] === null) empty.push([i, j]);
    }
  }
  if (empty.length > 0) {
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
  }
};

const initBoard = (): Board => {
  const board = createEmptyBoard();
  addNewTile(board);
  addNewTile(board);
  return board;
};

const getMaxTile = (board: Board): number => {
  let max = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell && cell > max) max = cell;
    }
  }
  return max;
};

export default function NumberSlide() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { accountAddress, optInToAsset } = usePeraWallet();

  const [board, setBoard] = useState<Board>(initBoard());
  const [score, setScore] = useState(0);
  const [movesUsed, setMovesUsed] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [reached2048, setReached2048] = useState(false);

  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [nftAssetId, setNftAssetId] = useState<number | null>(null);
  const [showOptInPrompt, setShowOptInPrompt] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // focus for keyboard arrows
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const isBoardStuck = (b: Board): boolean => {
    // any empty cell?
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (b[i][j] === null) return false;
      }
    }
    // any possible merges horizontally / vertically?
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        const v = b[i][j];
        if (v === null) continue;
        if (i + 1 < BOARD_SIZE && b[i + 1][j] === v) return false;
        if (j + 1 < BOARD_SIZE && b[i][j + 1] === v) return false;
      }
    }
    return true;
  };

  const move = (direction: "up" | "down" | "left" | "right") => {
    if (gameWon || gameOver) return;

    let moved = false;
    let newScore = score;
    const newBoard: Board = board.map((row) => [...row]);

    const moveLine = (line: (number | null)[]) => {
      const filtered = line.filter((x) => x !== null) as number[];
      for (let i = 0; i < filtered.length - 1; i++) {
        if (filtered[i] === filtered[i + 1]) {
          filtered[i] = filtered[i] * 2;
          newScore += filtered[i];

          if (filtered[i] === 2048 && !reached2048) {
            setReached2048(true);
            setGameWon(true);
            toast({
              title: "2048 reached! 🎉",
              description: "You hit 2048 within the move challenge.",
            });
          }

          filtered.splice(i + 1, 1);
        }
      }
      while (filtered.length < BOARD_SIZE) filtered.push(null);
      return filtered as (number | null)[];
    };

    if (direction === "left") {
      for (let i = 0; i < BOARD_SIZE; i++) {
        const newLine = moveLine(newBoard[i]);
        if (JSON.stringify(newLine) !== JSON.stringify(newBoard[i])) moved = true;
        newBoard[i] = newLine;
      }
    } else if (direction === "right") {
      for (let i = 0; i < BOARD_SIZE; i++) {
        const reversed = [...newBoard[i]].reverse();
        const newLine = moveLine(reversed).reverse();
        if (JSON.stringify(newLine) !== JSON.stringify(newBoard[i])) moved = true;
        newBoard[i] = newLine;
      }
    } else if (direction === "up") {
      for (let j = 0; j < BOARD_SIZE; j++) {
        const col = newBoard.map((row) => row[j]);
        const newCol = moveLine(col);
        if (JSON.stringify(newCol) !== JSON.stringify(col)) moved = true;
        for (let i = 0; i < BOARD_SIZE; i++) newBoard[i][j] = newCol[i];
      }
    } else if (direction === "down") {
      for (let j = 0; j < BOARD_SIZE; j++) {
        const col = newBoard.map((row) => row[j]).reverse();
        const newCol = moveLine(col).reverse();
        const oldCol = newBoard.map((row) => row[j]);
        if (JSON.stringify(newCol) !== JSON.stringify(oldCol)) moved = true;
        for (let i = 0; i < BOARD_SIZE; i++) newBoard[i][j] = newCol[i];
      }
    }

    if (moved) {
      addNewTile(newBoard);
      const nextMovesUsed = movesUsed + 1;

      setBoard(newBoard);
      setScore(newScore);
      setMovesUsed(nextMovesUsed);

      const stuck = isBoardStuck(newBoard);
      const outOfMoves = nextMovesUsed >= MAX_MOVES;
      if (!reached2048 && (stuck || outOfMoves)) {
        setGameOver(true);
        toast({
          title: "Challenge over",
          description: "No more moves available. Try again from home.",
        });
      }
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") move("left");
    else if (e.key === "ArrowRight") move("right");
    else if (e.key === "ArrowUp") move("up");
    else if (e.key === "ArrowDown") move("down");
  };

  const resetToHome = () => {
    navigate("/");
  };

  // Reward logic:
  // Only if 2048 reached (reached2048 === true) AND within move limit,
  // the user gets 5 ALGO + NFT. Otherwise: no rewards.
  useEffect(() => {
    if (!reached2048 || rewardClaimed || !accountAddress) return;

    // We already ensure we stop when 2048 is reached; here treat it as "in time"
    // because the mode constraint is moves, not time now.
    const rewardAmount = 5;

    const runRewardFlow = async () => {
      const success = await claimReward(accountAddress, rewardAmount);
      if (success) {
        setRewardClaimed(true);
        toast({
          title: "Reward Claimed! 💰",
          description: `${rewardAmount} ALGO has been credited to your wallet!`,
        });
      } else {
        toast({
          title: "Reward Claim Failed",
          description: "Please try again or check your wallet connection.",
          variant: "destructive",
        });
      }

      const matchId = `2048-${Date.now()}`;
      const bestTile = getMaxTile(board);
      const difficulty =
        bestTile >= 4096
          ? "insane"
          : bestTile >= 2048
          ? "hard"
          : bestTile >= 1024
          ? "medium"
          : "easy";

      const result = await mintGameNFT(
        accountAddress,
        "2048 Move Challenge",
        score,
        numberSlideIcon,
        matchId,
        difficulty
      );

      if (result.success && result.assetId) {
        setNftAssetId(result.assetId);
        setShowOptInPrompt(true);
        toast({
          title: "NFT Achievement Created! 🏆",
          description: "Your 2048 challenge NFT has been created. Please opt-in to receive it.",
        });

        await recordGameSession({
          playerWalletAddress: accountAddress,
          gameName: "2048 Move Challenge",
          score,
          rewardAmount,
          nftAssetId: result.assetId,
          difficulty,
        });
      } else {
        await recordGameSession({
          playerWalletAddress: accountAddress,
          gameName: "2048 Move Challenge",
          score,
          rewardAmount,
          difficulty,
        });
      }
    };

    runRewardFlow();
  }, [reached2048, rewardClaimed, accountAddress, board, score, toast]);

  const handleOptInAndReceiveNFT = async () => {
    if (!nftAssetId || !accountAddress) return;

    const optInSuccess = await optInToAsset(nftAssetId);
    if (optInSuccess) {
      const transferSuccess = await transferNFT(accountAddress, nftAssetId);
      if (transferSuccess) {
        setShowOptInPrompt(false);
        toast({
          title: "NFT Received!",
          description: "Your 2048 challenge NFT has been transferred to your wallet! 🎖️",
        });
      }
    }
  };

  const getTileColor = (value: number | null) => {
    if (!value)
      return "bg-slate-900/50 border-slate-800/60 text-slate-500";

    const colors: { [key: number]: string } = {
      2: "bg-amber-100 text-slate-800",
      4: "bg-amber-200 text-slate-800",
      8: "bg-orange-400 text-white",
      16: "bg-orange-500 text-white",
      32: "bg-red-500 text-white",
      64: "bg-red-600 text-white",
      128: "bg-yellow-400 text-slate-900",
      256: "bg-yellow-500 text-slate-900",
      512: "bg-yellow-600 text-white",
      1024: "bg-yellow-700 text-white",
      2048: "bg-emerald-400 text-slate-900",
    };
    return colors[value] || "bg-emerald-600 text-white";
  };

  const bestTile = getMaxTile(board);
  const movesLeft = MAX_MOVES - movesUsed;
  const movesRatio = Math.min(1, Math.max(0, movesLeft / MAX_MOVES));

  const movesColor =
    movesLeft > MAX_MOVES * 0.6
      ? "bg-emerald-400"
      : movesLeft > MAX_MOVES * 0.3
      ? "bg-amber-400"
      : "bg-rose-500";

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyPress}
      className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-8 px-4 text-slate-50 relative overflow-hidden outline-none"
    >
      {/* background glow */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-24 -left-16 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
      </div>

      <div className="relative container mx-auto max-w-3xl">
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          className="mb-6 border-slate-700 bg-slate-900/70 hover:bg-slate-800/80"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>

        <Card className="p-6 md:p-8 border-slate-800 bg-slate-900/70 backdrop-blur-xl shadow-[0_0_40px_rgba(250,204,21,0.22)]">
          {/* header & HUD */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-amber-300 via-amber-400 to-emerald-300 bg-clip-text text-transparent">
                2048 – Move Challenge
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Reach{" "}
                <span className="font-semibold text-amber-300">2048</span> within{" "}
                <span className="font-semibold text-sky-300">{MAX_MOVES}</span>{" "}
                moves to earn{" "}
                <span className="font-semibold text-emerald-300">
                  5 ALGO + NFT
                </span>
                .
              </p>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="flex gap-3">
                {/* score */}
                <div className="px-3 py-2 rounded-2xl bg-slate-900/80 border border-amber-400/40 text-right">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Score
                  </p>
                  <p className="text-lg font-semibold text-amber-200">
                    {score}
                  </p>
                </div>
                {/* best tile */}
                <div className="px-3 py-2 rounded-2xl bg-slate-900/80 border border-slate-700/60 text-right">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Best Tile
                  </p>
                  <p className="text-lg font-semibold text-emerald-200">
                    {bestTile || 0}
                  </p>
                </div>
              </div>

              {/* moves bar */}
              <div className="w-full min-w-[180px] rounded-2xl bg-slate-900/80 px-4 py-2 border border-slate-700/80">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <MoveRight className="w-4 h-4 text-slate-300" />
                    <span className="text-[11px] uppercase tracking-wide text-slate-400">
                      Moves Left
                    </span>
                  </div>
                  <span className="text-sm font-mono text-slate-100">
                    {movesLeft}/{MAX_MOVES}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full ${movesColor} transition-all duration-300`}
                    style={{ width: `${movesRatio * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* reward state */}
          <div className="mb-4 text-center text-xs">
            {reached2048 ? (
              <span className="text-emerald-300">
                ✅ 2048 reached! 5 ALGO reward and NFT are being processed.
              </span>
            ) : gameOver ? (
              <span className="text-rose-400">
                ❌ Challenge failed – you ran out of moves before 2048.
              </span>
            ) : (
              <span className="text-slate-400">
                Reward:{" "}
                <span className="font-semibold text-emerald-400">
                  5 ALGO
                </span>{" "}
                only if you reach 2048 within the move limit.
              </span>
            )}
          </div>

          {/* win banner + NFT prompt */}
          {reached2048 && (
            <div className="mb-5 rounded-2xl border border-amber-300/40 bg-gradient-to-r from-amber-500/20 via-emerald-400/10 to-amber-500/20 px-4 py-4 text-center shadow-[0_0_30px_rgba(245,158,11,0.35)]">
              <p className="text-lg font-semibold text-amber-100">
                You beat the move challenge! 🎉
              </p>
              <p className="text-sm text-emerald-200 mt-1">
                +5 ALGO & NFT Achievement (if wallet transaction succeeds)
              </p>
              {showOptInPrompt && nftAssetId && (
                <div className="mt-3">
                  <Button
                    onClick={handleOptInAndReceiveNFT}
                    variant="default"
                    size="sm"
                    className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold"
                  >
                    Opt-in & Receive NFT
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* board */}
          <div className="mx-auto max-w-md mb-6">
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800/90 p-3 shadow-[0_24px_50px_rgba(15,23,42,0.95)]">
              <div className="grid grid-cols-4 gap-3">
                {board.map((row, i) =>
                  row.map((cell, j) => (
                    <div
                      key={`${i}-${j}`}
                      className={`
                        aspect-square rounded-2xl flex items-center justify-center
                        font-bold text-2xl md:text-3xl
                        border border-white/5
                        shadow-inner
                        ${getTileColor(cell)}
                        transition-all duration-150
                      `}
                    >
                      {cell}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* controls */}
          <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto mt-2">
            <div />
            <Button
              onClick={() => move("up")}
              variant="outline"
              className="bg-slate-900/80 border-slate-700/80 hover:bg-slate-800/80"
            >
              ↑
            </Button>
            <div />
            <Button
              onClick={() => move("left")}
              variant="outline"
              className="bg-slate-900/80 border-slate-700/80 hover:bg-slate-800/80"
            >
              ←
            </Button>
            <Button
              onClick={() => move("down")}
              variant="outline"
              className="bg-slate-900/80 border-slate-700/80 hover:bg-slate-800/80"
            >
              ↓
            </Button>
            <Button
              onClick={() => move("right")}
              variant="outline"
              className="bg-slate-900/80 border-slate-700/80 hover:bg-slate-800/80"
            >
              →
            </Button>
          </div>

          {/* exit */}
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              className="gap-2 border-slate-700 bg-slate-900/70 hover:bg-slate-800/80"
              onClick={resetToHome}
            >
              <RotateCcw className="w-4 h-4" />
              Exit & Play Again From Home
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
