import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Bomb, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePeraWallet } from "@/hooks/usePeraWallet";
import { claimReward } from "@/utils/algoReward";
import { mintGameNFT, transferNFT } from "@/utils/nftReward";
import { recordGameSession } from "@/utils/gameSession";
import minesIcon from "@/assets/mines-icon.jpg";

type Cell = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
};

const ROWS = 5;
const COLS = 5;
const MINES_COUNT = 10;
const TOTAL_CELLS = ROWS * COLS;
const SAFE_CELLS = TOTAL_CELLS - MINES_COUNT;

const CELL_SIZE = 72;
const GAP = 10;

export default function Mines() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { accountAddress, optInToAsset } = usePeraWallet();

  const [grid, setGrid] = useState<Cell[][]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [flagMode, setFlagMode] = useState(false);

  const [revealedCount, setRevealedCount] = useState(0);

  // reward
  const [correctClicks, setCorrectClicks] = useState(0);
  const correctClicksRef = useRef(0);
  const [rewardPool, setRewardPool] = useState(0);
  const [withdrawEnabled, setWithdrawEnabled] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  // visuals & UX
  const [explosionCell, setExplosionCell] = useState<{ r: number; c: number } | null>(null);
  const [confetti, setConfetti] = useState(false);
  const [nftAssetId, setNftAssetId] = useState<number | null>(null);
  const [showOptInPrompt, setShowOptInPrompt] = useState(false);
  const [score, setScore] = useState(0);

  // mine-hit modal
  const [showMineModal, setShowMineModal] = useState(false);

  const boardRef = useRef<HTMLDivElement | null>(null);

  const initializeGame = () => {
    const empty: Cell[][] = Array.from({ length: ROWS }).map(() =>
      Array.from({ length: COLS }).map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0,
      }))
    );

    let placed = 0;
    while (placed < MINES_COUNT) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      if (!empty[r][c].isMine) {
        empty[r][c].isMine = true;
        placed++;
      }
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (empty[r][c].isMine) continue;
        let n = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && empty[nr][nc].isMine) n++;
          }
        }
        empty[r][c].neighborMines = n;
      }
    }

    setGrid(empty);
    setGameStarted(true);
    setGameOver(false);
    setGameWon(false);
    setFlagMode(false);
    setRevealedCount(0);
    setCorrectClicks(0);
    correctClicksRef.current = 0;
    setRewardPool(0);
    setWithdrawEnabled(false);
    setRewardClaimed(false);
    setExplosionCell(null);
    setConfetti(false);
    setNftAssetId(null);
    setShowOptInPrompt(false);
    setScore(0);
    setShowMineModal(false);

    setTimeout(() => boardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };

  // auto init so board is visible right away
  useEffect(() => {
    if (!grid || grid.length === 0) initializeGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const revealCell = (r: number, c: number) => {
    if (!gameStarted || gameOver || gameWon) return;
    const copy = grid.map((row) => row.map((cell) => ({ ...cell })));
    const cell = copy[r][c];
    if (!cell || cell.isFlagged || cell.isRevealed) return;

    if (cell.isMine) {
      cell.isRevealed = true;
      setGrid(copy);
      setGameOver(true);
      setGameStarted(false);
      setExplosionCell({ r, c });
      setShowMineModal(true); // show modal on mine hit
      toast({ title: "Blast!", description: "You hit a mine.", variant: "destructive" });

      setTimeout(() => {
        const all = copy.map((row) => row.map((ce) => ({ ...ce, isRevealed: ce.isMine ? true : ce.isRevealed })));
        setGrid(all);
      }, 500);

      return;
    }

    cell.isRevealed = true;
    setGrid(copy);
    setRevealedCount((p) => p + 1);
    setScore((p) => p + 10);

    const newCorrect = correctClicksRef.current + 1;
    if (correctClicksRef.current < 3) {
      if (newCorrect >= 3) {
        const extra = newCorrect - 3;
        setRewardPool(3 + extra);
      } else {
        setRewardPool(0);
      }
    } else {
      setRewardPool((p) => p + 1);
    }
    correctClicksRef.current = newCorrect;
    setCorrectClicks(newCorrect);

    if (newCorrect >= 3) setWithdrawEnabled(true);

    if (revealedCount + 1 >= SAFE_CELLS) {
      setGameWon(true);
      setGameStarted(false);
      setConfetti(true);
      toast({ title: "Victory!", description: "All diamonds revealed!" });
      handleMintNFTAndRecord(score + 10);
    }
  };

  const toggleFlag = (r: number, c: number) => {
    if (!gameStarted || gameOver || gameWon) return;
    const copy = grid.map((row) => row.map((cell) => ({ ...cell })));
    const cell = copy[r][c];
    if (!cell || cell.isRevealed) return;
    cell.isFlagged = !cell.isFlagged;
    setGrid(copy);
  };

  const withdrawReward = async () => {
    if (!accountAddress) {
      toast({ title: "Connect", description: "Connect wallet before withdrawing.", variant: "destructive" });
      return;
    }
    if (!withdrawEnabled || rewardPool <= 0) {
      toast({ title: "No rewards", description: "Reach at least 3 correct reveals." });
      return;
    }
    const amount = rewardPool;
    const ok = await claimReward(accountAddress, amount);
    if (ok) {
      setRewardClaimed(true);
      setRewardPool(0);
      setWithdrawEnabled(false);
      setConfetti(true);
      toast({ title: "Success", description: `${amount} ALGO credited.` });
      await handleMintNFTAndRecord(score);
    } else {
      toast({ title: "Withdraw failed", description: "Try again.", variant: "destructive" });
    }
  };

  const handleMintNFTAndRecord = async (finalScore: number) => {
    if (!accountAddress) return;
    const matchId = `mines-${Date.now()}`;
    const difficulty = correctClicksRef.current >= 12 ? "hard" : correctClicksRef.current >= 6 ? "medium" : "easy";
    try {
      const res = await mintGameNFT(accountAddress, "Mines", finalScore, minesIcon, matchId, difficulty);
      if (res.success && res.assetId) {
        setNftAssetId(res.assetId);
        setShowOptInPrompt(true);
        toast({ title: "NFT Minted", description: "Opt-in to receive it." });
        recordGameSession({
          playerWalletAddress: accountAddress,
          gameName: "Mines",
          score: finalScore,
          rewardAmount: rewardPool,
          nftAssetId: res.assetId,
          difficulty,
        });
        return;
      }
    } catch (err) {
      console.error(err);
    }

    recordGameSession({
      playerWalletAddress: accountAddress,
      gameName: "Mines",
      score: finalScore,
      rewardAmount: rewardPool,
      difficulty,
    });
  };

  const handleOptInAndReceiveNFT = async (): Promise<void> => {
    if (!nftAssetId || !accountAddress) {
      toast({ title: "Missing", description: "Connect wallet & ensure NFT minted.", variant: "destructive" });
      return;
    }
    try {
      const opt = await optInToAsset(nftAssetId);
      if (!opt) {
        toast({ title: "Opt-in failed", description: "Please opt-in from wallet." });
        return;
      }
      const t = await transferNFT(accountAddress, nftAssetId);
      if (t) {
        setShowOptInPrompt(false);
        toast({ title: "NFT Received", description: "Check your wallet." });
      } else {
        toast({ title: "Transfer failed", description: "Try again.", variant: "destructive" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Unexpected error.", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!explosionCell) return;
    const t = setTimeout(() => setExplosionCell(null), 700);
    return () => clearTimeout(t);
  }, [explosionCell]);

  useEffect(() => {
    if (!confetti) return;
    const t = setTimeout(() => setConfetti(false), 2000);
    return () => clearTimeout(t);
  }, [confetti]);

  const numberColor = (n: number) => {
    const mapping: Record<number, string> = {
      1: "color: #2563eb",
      2: "color: #16a34a",
      3: "color: #ef4444",
      4: "color: #7c3aed",
      5: "color: #ea580c",
    };
    return mapping[n] || "color: #111827";
  };

  function parseStyle(s: string): React.CSSProperties {
    const obj: Record<string, string> = {};
    s.split(";").forEach((part) => {
      const [k, v] = part.split(":").map((t) => (t ? t.trim() : ""));
      if (k && v) {
        const jsKey = k.replace(/-([a-z])/g, (_, g) => g.toUpperCase());
        obj[jsKey] = v;
      }
    });
    return obj as React.CSSProperties;
  }

  return (
    <div style={{ minHeight: "100vh", padding: 28, color: "white", position: "relative", overflowX: "hidden" }}>
      <style>{`
        body { background: unset !important; }
        .game-background {
          position: absolute; inset: 0; z-index: 0;
          background:
            radial-gradient(800px 400px at 10% 15%, rgba(167,139,250,0.06), transparent 8%),
            radial-gradient(900px 500px at 90% 85%, rgba(6,182,212,0.04), transparent 8%),
            linear-gradient(180deg, #0b0710 0%, #09121a 40%, #071018 100%);
          filter: contrast(1.02) saturate(1.05);
        }
        .vignette {
          position: absolute; inset: 0; pointer-events: none; z-index: 1;
          background: radial-gradient(1200px 600px at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%);
          mix-blend-mode: multiply;
        }
        .noise {
          position: absolute; inset: 0; z-index: 2; pointer-events: none;
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="n"><feTurbulence baseFrequency="0.9" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)" opacity="0.05"/></svg>');
          opacity: 0.06;
        }

        .hud {
          background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
          border: 1px solid rgba(255,255,255,0.03);
          box-shadow: 0 6px 30px rgba(2,6,23,0.6), inset 0 1px 0 rgba(255,255,255,0.02);
          border-radius: 12px;
          padding: 14px;
          z-index: 6;
        }
        .board-card {
          background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 12px 40px rgba(2,6,23,0.7);
          backdrop-filter: blur(6px) saturate(120%);
          z-index: 6;
        }
        .cell { width: ${CELL_SIZE}px; height: ${CELL_SIZE}px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin: ${GAP/2}px; user-select: none; position: relative; transition: transform 180ms ease, box-shadow 180ms ease, background 160ms ease; cursor: pointer; }
        .cell-hidden { background: linear-gradient(180deg,#07101a,#0d1622); border: 1px solid rgba(255,255,255,0.03); box-shadow: inset 0 -8px 20px rgba(0,0,0,0.55); }
        .cell-hidden:hover { transform: translateY(-6px) rotateX(4deg); box-shadow: 0 18px 40px rgba(2,6,23,0.6); }
        .cell-revealed { background: #fff; color: #111827; box-shadow: 0 18px 36px rgba(2,6,23,0.6); }
        .cell-mine { background: linear-gradient(180deg,#7a1515,#b22b2b); color: white; box-shadow: 0 20px 46px rgba(162,42,42,0.32); }

        .diamond { width: 22px; height: 22px; transform: rotate(45deg); background: linear-gradient(180deg,#fff7ed,#06b6d4); border: 2px solid rgba(255,255,255,0.7); box-shadow: 0 10px 30px rgba(6,182,212,0.12) }
        .burst { position: absolute; width: ${CELL_SIZE}px; height: ${CELL_SIZE}px; pointer-events: none; z-index: 80; }
        .particle { position: absolute; width: 6px; height: 6px; border-radius: 50%; opacity: 0.95; transform-origin: center; animation: fly 600ms ease-out forwards; }
        @keyframes fly { 0% { transform: translate(0,0) scale(1); opacity: 1 } 100% { transform: translate(var(--dx), var(--dy)) scale(0.9); opacity: 0 } }

        .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 120; display: flex; align-items: center; justify-content: center; }
        .modal-card { background: rgba(22, 25, 30, 0.75); border: 1px solid rgba(255,255,255,0.06); padding: 28px; border-radius: 12px; width: 420px; text-align: center; box-shadow: 0 20px 60px rgba(2,6,23,0.7); backdrop-filter: blur(6px); color: #fff; }
        .modal-title { font-size: 22px; font-weight: 800; margin-bottom: 8px; }
        .modal-desc { color: rgba(255,255,255,0.75); margin-bottom: 18px; }
        .btn-ghost { background: transparent; border: 1px solid rgba(255,255,255,0.06); color: #fff; padding: 10px 14px; border-radius: 8px; }
      `}</style>

      <div className="game-background" />
      <div className="vignette" />
      <div className="noise" />

      <div style={{ position: "relative", zIndex: 6, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>Mines — Diamond Rush</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>5×5 · 10 Mines · 15 Diamonds</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ textAlign: "right", marginRight: 6 }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Reward Pool</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{rewardPool} ALGO</div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Button size="sm" onClick={withdrawReward} disabled={!withdrawEnabled || rewardClaimed}>
              Withdraw
            </Button>
            <Button size="sm" variant={flagMode ? "default" : "outline"} onClick={() => setFlagMode((v) => !v)}>
              <Flag className="w-4 h-4 mr-2" /> {flagMode ? "Flag Mode" : "Reveal"}
            </Button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18, position: "relative", zIndex: 6 }}>
        <Card className="hud" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Safe Reveals</div>
              <div style={{ fontWeight: 800, fontSize: 20 }}>{correctClicks}/{SAFE_CELLS}</div>
            </div>

            <div style={{ width: 420 }}>
              <div style={{ height: 8, background: "rgba(255,255,255,0.04)", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.round((correctClicks / SAFE_CELLS) * 100)}%`, background: "linear-gradient(90deg,#06b6d4,#a78bfa)", transition: "width 300ms ease" }} />
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>Reveal diamonds to earn ALGO</div>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Score</div>
            <div style={{ fontWeight: 700, fontSize: 20 }}>{score}</div>
          </div>
        </Card>
      </div>

      <div ref={boardRef} style={{ marginTop: 28, display: "flex", justifyContent: "center", position: "relative", zIndex: 6 }}>
        <Card className="board-card" style={{ width: COLS * (CELL_SIZE + GAP) + 48, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: COLS * (CELL_SIZE + GAP), display: "flex", flexDirection: "column", alignItems: "center", padding: 16 }}>
            {(!grid || grid.length === 0) ? (
              <div style={{ width: "100%", height: CELL_SIZE * ROWS + GAP * (ROWS - 1), display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                <div style={{ marginBottom: 12 }}>Board not initialized</div>
                <Button onClick={initializeGame} size="lg">Start Game</Button>
              </div>
            ) : (
              <>
                {confetti && (
                  <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 80 }}>
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div key={i} style={{ position: "absolute", left: `${Math.random() * 100}%`, width: 10, height: 14, background: ["#f97316", "#06b6d4", "#a78bfa", "#fb7185", "#facc15"][i % 5], animationDelay: `${Math.random() * 400}ms`, transform: `rotate(${Math.random() * 360}deg)` }} />
                    ))}
                  </div>
                )}

                {explosionCell && (
                  <div className="burst" style={{ left: explosionCell.c * (CELL_SIZE + GAP), top: explosionCell.r * (CELL_SIZE + GAP) }}>
                    {Array.from({ length: 12 }).map((_, i) => {
                      const angle = (i / 12) * Math.PI * 2;
                      const dx = Math.cos(angle) * (20 + Math.random() * 80);
                      const dy = Math.sin(angle) * (20 + Math.random() * 80);
                      const particleStyle: React.CSSProperties & { [key: `--${string}`]: string } = {
                        left: `${CELL_SIZE / 2}px`,
                        top: `${CELL_SIZE / 2}px`,
                        background: ["#fff4e6", "#ffcc00", "#ff6b6b", "#ffbb88"][i % 4],
                        transform: `translate(-50%,-50%)`,
                        ["--dx" as `--${string}`]: `${dx}px`,
                        ["--dy" as `--${string}`]: `${dy}px`,
                      };
                      return <div key={i} className="particle" style={particleStyle} />;
                    })}
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, ${CELL_SIZE}px)`, gap: GAP }}>
                  {grid.map((row, rIdx) =>
                    row.map((cell, cIdx) => {
                      const cls = cell.isRevealed ? (cell.isMine ? "cell cell-revealed cell-mine" : "cell cell-revealed") : "cell cell-hidden";
                      return (
                        <div
                          key={`${rIdx}-${cIdx}`}
                          className={cls}
                          onClick={() => {
                            if (flagMode) toggleFlag(rIdx, cIdx);
                            else revealCell(rIdx, cIdx);
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            toggleFlag(rIdx, cIdx);
                          }}
                          style={{
                            ...(cell.isRevealed
                              ? cell.isMine
                                ? { background: "linear-gradient(180deg,#6b1010,#a72020)", color: "#fff" }
                                : { background: "#fff", color: "#111827" }
                              : { background: "linear-gradient(180deg,#07101a,#0b1622)", color: "#9ca3af" }),
                            borderRadius: 12,
                            boxShadow: cell.isRevealed ? "0 12px 30px rgba(2,6,23,0.6)" : "inset 0 -8px 20px rgba(0,0,0,0.5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: 18,
                            position: "relative",
                            cursor: "pointer",
                          }}
                        >
                          {!cell.isRevealed && cell.isFlagged && <Flag className="w-6 h-6" style={{ color: "#fb7185" }} />}
                          {cell.isRevealed && cell.isMine && <Bomb className="w-7 h-7" style={{ color: "white" }} />}
                          {cell.isRevealed && !cell.isMine && cell.neighborMines > 0 && (
                            <span style={parseStyle(numberColor(cell.neighborMines))}>{cell.neighborMines}</span>
                          )}
                          {cell.isRevealed && !cell.isMine && (
                            <div style={{ position: "absolute", right: 8, top: 8 }}>
                              <div className="diamond" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

          <div style={{ marginTop: 14, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
            Tip: Right-click (or toggle Flag Mode) to flag. Each diamond after the third increases pool by 1 ALGO.
          </div>
        </Card>
      </div>

      {/* Mine modal: only one button 'Play Again' that navigates home */}
      {showMineModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-title">Oops — you hit a mine</div>
            <div className="modal-desc">Better luck next time. Click below to return to the home page.</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8 }}>
              <button
                className="btn-ghost"
                onClick={() => {
                  setShowMineModal(false);
                  // user requested: clicking Play Again should go to home
                  navigate("/");
                }}
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Opt-in prompt */}
      {showOptInPrompt && nftAssetId && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 22, position: "relative", zIndex: 6 }}>
          <Card style={{ padding: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div>🏆 NFT minted — opt-in to receive it</div>
              <div>
                <Button size="sm" onClick={handleOptInAndReceiveNFT}>Opt-in & Receive</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
