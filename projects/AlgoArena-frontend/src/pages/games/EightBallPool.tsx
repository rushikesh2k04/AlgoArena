import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePeraWallet } from "@/hooks/usePeraWallet";
import { claimReward } from "@/utils/algoReward";
import { recordGameSession } from "@/utils/gameSession";
import { mintGameNFT, transferNFT } from "@/utils/nftReward";

// sounds
import cueHitSfx from "@/assets/sounds/pool_cue_hit.wav";
import pocketSfx from "@/assets/sounds/pool_pocket.wav";
import railSfx from "@/assets/sounds/pool_rail.wav";
import winSfx from "@/assets/sounds/pool_win.wav";

// icon for the NFT
import poolIcon from "@/assets/pool-icon.jpg";

type Ball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  number: number;
  potted: boolean;
};

type PlayerId = "player" | "ai";

export default function EightBallPool() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { accountAddress, optInToAsset } = usePeraWallet();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<PlayerId | null>(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerId>("player");

  const [nftAssetId, setNftAssetId] = useState<number | null>(null);
  const [showOptInPrompt, setShowOptInPrompt] = useState(false);

  const ballsRef = useRef<Ball[]>([]);
  const shotInProgressRef = useRef(false);
  const currentPlayerRef = useRef<PlayerId>("player");
  const gameOverRef = useRef(false);

  const playerScoreRef = useRef(0);
  const aiScoreRef = useRef(0);

  const isAimingRef = useRef(false);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // sounds
  const cueHitAudioRef = useRef<HTMLAudioElement | null>(null);
  const pocketAudioRef = useRef<HTMLAudioElement | null>(null);
  const railAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    cueHitAudioRef.current = new Audio(cueHitSfx);
    pocketAudioRef.current = new Audio(pocketSfx);
    railAudioRef.current = new Audio(railSfx);
    winAudioRef.current = new Audio(winSfx);
  }, []);

  const playSound = (type: "cue" | "pocket" | "rail" | "win") => {
    const map = {
      cue: cueHitAudioRef.current,
      pocket: pocketAudioRef.current,
      rail: railAudioRef.current,
      win: winAudioRef.current,
    } as const;
    const audio = map[type];
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  };

  const initBalls = () => {
    const balls: Ball[] = [
      { x: 260, y: 225, vx: 0, vy: 0, color: "#ffffff", number: 0, potted: false }, // cue
    ];

    const startX = 540;
    const startY = 225;
    const radius = 14;
    const colors = ["#f3b700", "#0059d6", "#f24b3f", "#6a1b9a", "#0d9436", "#ff7f00"];

    let ballNum = 1;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col <= row; col++) {
        if (ballNum > 6) break;
        balls.push({
          x: startX + row * radius * 2,
          y: startY + (col - row / 2) * radius * 2,
          vx: 0,
          vy: 0,
          color: colors[ballNum - 1] || "#ffffff",
          number: ballNum,
          potted: false,
        });
        ballNum++;
      }
    }

    ballsRef.current = balls;
  };

  const startGame = () => {
    setPlayerScore(0);
    setAiScore(0);
    playerScoreRef.current = 0;
    aiScoreRef.current = 0;

    setWinner(null);
    setGameOver(false);
    gameOverRef.current = false;
    setRewardClaimed(false);
    setNftAssetId(null);
    setShowOptInPrompt(false);

    setCurrentPlayer("player");
    currentPlayerRef.current = "player";

    shotInProgressRef.current = false;
    isAimingRef.current = false;

    initBalls();
    setGameStarted(true);
  };

  // main render / physics
  useEffect(() => {
    if (!gameStarted || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const tableMargin = 30;
    const pocketRadius = 26;
    const ballRadius = 14;
    const friction = 0.985;

    const pockets = [
      { x: tableMargin, y: tableMargin },
      { x: width / 2, y: tableMargin },
      { x: width - tableMargin, y: tableMargin },
      { x: tableMargin, y: height - tableMargin },
      { x: width / 2, y: height - tableMargin },
      { x: width - tableMargin, y: height - tableMargin },
    ];

    let animationId: number;

    const drawTable = () => {
      ctx.fillStyle = "#001a33";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#3a1d0d";
      ctx.fillRect(
        tableMargin - 20,
        tableMargin - 20,
        width - (tableMargin - 20) * 2,
        height - (tableMargin - 20) * 2
      );

      ctx.strokeStyle = "#d2a15e";
      ctx.lineWidth = 4;
      ctx.strokeRect(
        tableMargin - 10,
        tableMargin - 10,
        width - (tableMargin - 10) * 2,
        height - (tableMargin - 10) * 2
      );

      ctx.fillStyle = "#b32121";
      ctx.fillRect(
        tableMargin,
        tableMargin,
        width - tableMargin * 2,
        height - tableMargin * 2
      );

      pockets.forEach((p) => {
        const grd = ctx.createRadialGradient(
          p.x - 5,
          p.y - 5,
          5,
          p.x,
          p.y,
          pocketRadius
        );
        grd.addColorStop(0, "#444");
        grd.addColorStop(1, "#000");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pocketRadius, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const loop = () => {
      const balls = ballsRef.current;
      drawTable();

      let allStopped = true;

      balls.forEach((ball, i) => {
        if (ball.potted) return;

        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vx *= friction;
        ball.vy *= friction;

        if (Math.abs(ball.vx) > 0.05 || Math.abs(ball.vy) > 0.05) {
          allStopped = false;
        } else {
          ball.vx = 0;
          ball.vy = 0;
        }

        const left = tableMargin + ballRadius;
        const right = width - tableMargin - ballRadius;
        const top = tableMargin + ballRadius;
        const bottom = height - tableMargin - ballRadius;
        let hitRail = false;

        if (ball.x < left) {
          ball.x = left;
          ball.vx *= -0.9;
          hitRail = true;
        } else if (ball.x > right) {
          ball.x = right;
          ball.vx *= -0.9;
          hitRail = true;
        }
        if (ball.y < top) {
          ball.y = top;
          ball.vy *= -0.9;
          hitRail = true;
        } else if (ball.y > bottom) {
          ball.y = bottom;
          ball.vy *= -0.9;
          hitRail = true;
        }
        if (hitRail) playSound("rail");

        // pockets
        pockets.forEach((pocket) => {
          const dx = ball.x - pocket.x;
          const dy = ball.y - pocket.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (!ball.potted && dist < pocketRadius - 4) {
            if (ball.number === 0) {
              ball.x = width * 0.25;
              ball.y = height / 2;
              ball.vx = ball.vy = 0;
            } else {
              ball.potted = true;
              ball.vx = ball.vy = 0;
              playSound("pocket");
              if (currentPlayerRef.current === "player") {
                setPlayerScore((prev) => {
                  const next = prev + 10;
                  playerScoreRef.current = next;
                  return next;
                });
                toast({
                  title: `You potted ball ${ball.number}!`,
                  description: "+10 points",
                });
              } else {
                setAiScore((prev) => {
                  const next = prev + 10;
                  aiScoreRef.current = next;
                  return next;
                });
                toast({ title: `AI potted ball ${ball.number}` });
              }
            }
          }
        });

        // collisions
        balls.forEach((other, j) => {
          if (i >= j || ball.potted || other.potted) return;
          const dx = other.x - ball.x;
          const dy = other.y - ball.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0 && dist < ballRadius * 2) {
            const nx = dx / dist;
            const ny = dy / dist;
            const p =
              ball.vx * nx +
              ball.vy * ny -
              (other.vx * nx + other.vy * ny);
            ball.vx -= p * nx;
            ball.vy -= p * ny;
            other.vx += p * nx;
            other.vy += p * ny;

            const overlap = ballRadius * 2 - dist;
            ball.x -= (overlap / 2) * nx;
            ball.y -= (overlap / 2) * ny;
            other.x += (overlap / 2) * nx;
            other.y += (overlap / 2) * ny;
          }
        });

        // draw ball
        if (!ball.potted) {
          const grd = ctx.createRadialGradient(
            ball.x - ballRadius / 3,
            ball.y - ballRadius / 3,
            4,
            ball.x,
            ball.y,
            ballRadius
          );
          grd.addColorStop(0, "#ffffff");
          grd.addColorStop(0.25, ball.color);
          grd.addColorStop(1, "#000000");
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#000";
          ctx.lineWidth = 2;
          ctx.stroke();

          if (ball.number !== 0) {
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ballRadius * 0.45, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#000";
            ctx.font = "12px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(ball.number.toString(), ball.x, ball.y);
          }
        }
      });

      // cue + guideline
      if (currentPlayerRef.current === "player" && !shotInProgressRef.current && gameStarted) {
        const balls = ballsRef.current;
        const cueBall = balls.find((b) => b.number === 0 && !b.potted);
        if (cueBall) {
          let { x: mx, y: my } = mousePosRef.current;
          if (mx === 0 && my === 0) {
            mx = cueBall.x + 80;
            my = cueBall.y;
          }
          const dx = mx - cueBall.x;
          const dy = my - cueBall.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const ux = dx / dist;
          const uy = dy / dist;

          const guideLen = 260;
          ctx.strokeStyle = "rgba(255,255,255,0.45)";
          ctx.lineWidth = 2;
          ctx.setLineDash([10, 6]);
          ctx.beginPath();
          ctx.moveTo(cueBall.x, cueBall.y);
          ctx.lineTo(cueBall.x + ux * guideLen, cueBall.y + uy * guideLen);
          ctx.stroke();
          ctx.setLineDash([]);

          const cueLen = 140;
          const tipX = cueBall.x - ux * ballRadius;
          const tipY = cueBall.y - uy * ballRadius;
          const buttX = tipX - ux * cueLen;
          const buttY = tipY - uy * cueLen;

          ctx.strokeStyle = "#cfa26b";
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(buttX, buttY);
          ctx.lineTo(tipX, tipY);
          ctx.stroke();

          ctx.strokeStyle = "#fdfdfd";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(tipX, tipY);
          ctx.lineTo(tipX - ux * 10, tipY - uy * 10);
          ctx.stroke();
        }
      }

      // end of shot
      if (allStopped && shotInProgressRef.current && !gameOverRef.current) {
        shotInProgressRef.current = false;
        const balls = ballsRef.current;
        const remaining = balls.filter((b) => !b.potted && b.number !== 0);
        if (remaining.length === 0) {
          gameOverRef.current = true;
          setGameStarted(false);
          const winnerFinal =
            playerScoreRef.current >= aiScoreRef.current ? "player" : "ai";
          setWinner(winnerFinal);
          setGameOver(true);
          if (winnerFinal === "player") {
            playSound("win");
            toast({
              title: "You win the match! 🏆",
              description: `Final score: You ${playerScoreRef.current} - AI ${aiScoreRef.current}`,
            });
          } else {
            toast({
              title: "AI wins this match.",
              description: `Final score: You ${playerScoreRef.current} - AI ${aiScoreRef.current}`,
              variant: "destructive",
            });
          }
        } else {
          const next =
            currentPlayerRef.current === "player" ? "ai" : "player";
          currentPlayerRef.current = next;
          setCurrentPlayer(next);
        }
      }

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [gameStarted, toast]);

  // AI turn
  useEffect(() => {
    if (!gameStarted || currentPlayer !== "ai" || gameOver) return;

    const timeout = setTimeout(() => {
      const balls = ballsRef.current;
      const cueBall = balls.find((b) => b.number === 0 && !b.potted);
      const targets = balls.filter((b) => !b.potted && b.number !== 0);
      if (!cueBall || targets.length === 0) return;

      const target = targets[Math.floor(Math.random() * targets.length)];
      const dx = target.x - cueBall.x;
      const dy = target.y - cueBall.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const power = 10 + Math.random() * 6;

      cueBall.vx = (dx / dist) * power;
      cueBall.vy = (dy / dist) * power;

      shotInProgressRef.current = true;
      playSound("cue");
    }, 900);

    return () => clearTimeout(timeout);
  }, [currentPlayer, gameStarted, gameOver]);

  // mouse aiming
  const updateMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mousePosRef.current = { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentPlayerRef.current !== "player" || shotInProgressRef.current)
      return;
    isAimingRef.current = true;
    updateMousePos(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameStarted) return;
    updateMousePos(e);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isAimingRef.current) return;
    isAimingRef.current = false;
    if (currentPlayerRef.current !== "player" || shotInProgressRef.current)
      return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cueBall = ballsRef.current.find((b) => b.number === 0 && !b.potted);
    if (!cueBall) return;

    const dx = x - cueBall.x;
    const dy = y - cueBall.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    const power = Math.min(20, dist * 0.08);
    cueBall.vx = (dx / dist) * power;
    cueBall.vy = (dy / dist) * power;

    shotInProgressRef.current = true;
    playSound("cue");
  };

  // reward + NFT when player wins
  useEffect(() => {
    if (!gameOver || winner !== "player" || rewardClaimed || !accountAddress)
      return;

    const rewardAmount = 15;
    const gameName = "8 Ball Pool";

    const run = async () => {
      // ALGO reward
      const success = await claimReward(accountAddress, rewardAmount);
      if (success) {
        setRewardClaimed(true);
        toast({
          title: "Reward Claimed!",
          description: `${rewardAmount} ALGO has been credited to your wallet!`,
        });
      } else {
        toast({
          title: "Reward Claim Failed",
          description: "Please try again or check your wallet connection.",
          variant: "destructive",
        });
      }

      // NFT mint
      const matchId = `8ball-${Date.now()}`;
      const difficulty = "medium";

      const result = await mintGameNFT(
        accountAddress,
        gameName,
        playerScoreRef.current,
        poolIcon,
        matchId,
        difficulty
      );

      if (result.success && result.assetId) {
        setNftAssetId(result.assetId);
        setShowOptInPrompt(true);
        toast({
          title: "NFT Achievement Created! 🎱",
          description:
            "Your 8 Ball Pool achievement NFT has been created. Please opt-in to receive it.",
        });

        await recordGameSession({
          playerWalletAddress: accountAddress,
          gameName,
          score: playerScoreRef.current,
          rewardAmount,
          nftAssetId: result.assetId,
          difficulty,
        });
      } else {
        await recordGameSession({
          playerWalletAddress: accountAddress,
          gameName,
          score: playerScoreRef.current,
          rewardAmount,
          difficulty,
        });
      }
    };

    run();
  }, [gameOver, winner, rewardClaimed, accountAddress, toast]);

  const handleOptInAndReceiveNFT = async () => {
    if (!nftAssetId || !accountAddress) return;
    const optInSuccess = await optInToAsset(nftAssetId);
    if (optInSuccess) {
      const transferSuccess = await transferNFT(accountAddress, nftAssetId);
      if (transferSuccess) {
        setShowOptInPrompt(false);
        toast({
          title: "NFT Received!",
          description: "Your 8 Ball Pool NFT has been transferred to your wallet!",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          className="mb-4 border-slate-700 bg-slate-900/70 hover:bg-slate-800/80 text-slate-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>

        <Card className="p-4 md:p-6 border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-[0_0_40px_rgba(15,23,42,0.9)] text-slate-50">
          {/* HUD */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-sky-500/40 flex items-center justify-center border border-sky-400/60">
                <span className="text-xs font-semibold">YOU</span>
              </div>
              <div>
                <p className="text-sm font-semibold">You</p>
                <p className="text-[11px] text-slate-400 uppercase tracking-wide">
                  Score: {playerScore}
                </p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-slate-400">
                8 Ball Pool
              </p>
              <h1 className="text-xl md:text-2xl font-bold flex items-center justify-center gap-2">
                <Trophy className="w-4 h-4 text-amber-300" />
                vs AI
              </h1>
              <p className="text-[11px] text-slate-400 mt-1">
                Current turn:{" "}
                <span
                  className={
                    currentPlayer === "player"
                      ? "text-emerald-400 font-semibold"
                      : "text-amber-300 font-semibold"
                  }
                >
                  {currentPlayer === "player" ? "You" : "AI"}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold">AI</p>
                <p className="text-[11px] text-slate-400 uppercase tracking-wide">
                  Score: {aiScore}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-500/40 flex items-center justify-center border border-amber-400/60">
                <span className="text-xs font-semibold">AI</span>
              </div>
            </div>
          </div>

          {/* status */}
          {!gameStarted && !gameOver && (
            <div className="mb-4 text-center text-sm text-slate-300">
              Click and drag on the table to aim your shot. Release to shoot.
              Pot more balls than the AI to win and earn rewards.
            </div>
          )}

          {gameOver && winner && (
            <div
              className={`mb-4 rounded-xl px-4 py-3 text-center text-sm ${
                winner === "player"
                  ? "bg-emerald-500/15 border border-emerald-400/40"
                  : "bg-rose-500/15 border border-rose-400/40"
              }`}
            >
              {winner === "player" ? (
                <>
                  <p className="font-semibold text-emerald-200">
                    You won the match! 🏆
                  </p>
                  <p className="text-xs text-emerald-100/80 mt-1">
                    Final: You {playerScore} – AI {aiScore}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-rose-200">
                    AI won this match.
                  </p>
                  <p className="text-xs text-rose-100/80 mt-1">
                    Final: You {playerScore} – AI {aiScore}
                  </p>
                </>
              )}
            </div>
          )}

          {/* NFT opt-in prompt (after win) */}
          {winner === "player" && showOptInPrompt && nftAssetId && (
            <Card className="mb-4 p-4 bg-emerald-500/10 border-emerald-400/40">
              <p className="text-sm mb-3">
                🏆 Your 8 Ball Pool achievement NFT is ready. Opt-in to receive
                it in your wallet.
              </p>
              <Button
                size="sm"
                onClick={handleOptInAndReceiveNFT}
                className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-semibold"
              >
                Opt-in & Receive NFT
              </Button>
            </Card>
          )}

          {/* table */}
          <div className="w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-[0_18px_40px_rgba(0,0,0,0.85)]">
            <canvas
              ref={canvasRef}
              width={900}
              height={450}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="block w-full cursor-crosshair"
            />
          </div>

          {/* controls */}
          <div className="mt-6 flex justify-center gap-4">
            {!gameStarted && !gameOver && (
              <Button size="lg" onClick={startGame}>
                Start Match
              </Button>
            )}

            {gameOver && (
              <>

                <Button variant="outline" onClick={() => navigate("/")}>
                  Play Again
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
