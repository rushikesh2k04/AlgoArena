import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePeraWallet } from "@/hooks/usePeraWallet";
import { claimReward } from "@/utils/algoReward";
import { mintGameNFT, transferNFT } from "@/utils/nftReward";
import { recordGameSession } from "@/utils/gameSession";
import racingIcon from "@/assets/racing-icon.jpg";

// Realistic car images (ensure these exist)
import playerCarImg from "@/assets/player-car.png";
import carRed from "@/assets/car-red.png";
import carBlue from "@/assets/car-blue.png";
import carGreen from "@/assets/car-white.png";
import carOrange from "@/assets/car-red.png";
import carYellow from "@/assets/car-yellow.png";

export default function SpeedRacer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { accountAddress, optInToAsset } = usePeraWallet();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // game states
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [nftAssetId, setNftAssetId] = useState<number | null>(null);
  const [showOptInPrompt, setShowOptInPrompt] = useState(false);

  // Timer & distance
  const totalTime = 45; // seconds allowed to reach finish line (tune)
  const finishDistance = 5000; // distance units to reach finish
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const distanceRef = useRef(0); // distance travelled
  const [distanceRemaining, setDistanceRemaining] = useState(finishDistance);

  // canvas/game refs
  // We'll keep canvas size fixed: width=400 height=600 (same as used in <canvas>)
  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 600;

  // lane layout constants (use same values that drawing uses)
  const LEFT_MARGIN = 24;
  const RIGHT_MARGIN = 24;
  const LANE_COUNT = 3;
  const LANE_WIDTH = (CANVAS_WIDTH - LEFT_MARGIN - RIGHT_MARGIN) / LANE_COUNT;
  const LANE_CENTERS = Array.from({ length: LANE_COUNT }).map(
    (_, i) => LEFT_MARGIN + LANE_WIDTH * i + LANE_WIDTH / 2
  );

  // lane index ref (0..LANE_COUNT-1) ensures car always in a lane center
  const laneIndexRef = useRef(1); // default middle lane
  const carPositionRef = useRef(LANE_CENTERS[laneIndexRef.current]); // x center of player (mirrors laneIndex)

  const obstaclesRef = useRef<
    { x: number; y: number; img: HTMLImageElement | null; width: number; height: number; speedOffset?: number }[]
  >([]);
  const gameLoopRef = useRef<number | null>(null);
  const frameRef = useRef(0);

  // images
  const playerImgRef = useRef<HTMLImageElement | null>(null);
  const obstacleImgsRef = useRef<HTMLImageElement[]>([]);

  // preload all images
  useEffect(() => {
    const player = new Image();
    player.src = playerCarImg;
    player.onload = () => {
      playerImgRef.current = player;
    };
    player.onerror = () => {
      playerImgRef.current = null;
    };

    const paths = [carRed, carBlue, carGreen, carOrange, carYellow];
    const imgs: HTMLImageElement[] = [];
    paths.forEach((p) => {
      const img = new Image();
      img.src = p;
      img.onload = () => {
        // loaded
      };
      img.onerror = () => {
        // ignore — fallback will draw rect
      };
      imgs.push(img);
    });
    obstacleImgsRef.current = imgs;
  }, []);

  // helper: move player one lane left / right (snaps to lane centers)
  const moveLeft = () => {
    laneIndexRef.current = Math.max(0, laneIndexRef.current - 1);
    carPositionRef.current = LANE_CENTERS[laneIndexRef.current];
  };
  const moveRight = () => {
    laneIndexRef.current = Math.min(LANE_COUNT - 1, laneIndexRef.current + 1);
    carPositionRef.current = LANE_CENTERS[laneIndexRef.current];
  };

  useEffect(() => {
    if (!gameStarted || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ensure carPositionRef matches laneIndex at start of loop (keeps consistent)
    carPositionRef.current = LANE_CENTERS[laneIndexRef.current];

    // handle left/right keys by changing lane index (snapping)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        moveLeft();
      } else if (e.key === "ArrowRight") {
        moveRight();
      }
    };
    window.addEventListener("keydown", handleKeyPress);

    // spawn params
    let spawnTimer = 0;
    const spawnIntervalFrames = 55; // spawn frequency

    // gameLoop
    const gameLoop = () => {
      if (!ctx) return;

      // clear background
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw side grass
      ctx.fillStyle = "#2f9e44";
      ctx.fillRect(0, 0, LEFT_MARGIN, canvas.height);
      ctx.fillRect(canvas.width - RIGHT_MARGIN, 0, RIGHT_MARGIN, canvas.height);

      // Draw road background
      const roadGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      roadGrad.addColorStop(0, "#2b2b2b");
      roadGrad.addColorStop(1, "#141414");
      ctx.fillStyle = roadGrad;
      ctx.fillRect(LEFT_MARGIN, 0, canvas.width - LEFT_MARGIN - RIGHT_MARGIN, canvas.height);

      // Road borders
      ctx.fillStyle = "#b49f2c";
      ctx.fillRect(LEFT_MARGIN, 0, 6, canvas.height);
      ctx.fillRect(canvas.width - RIGHT_MARGIN - 6, 0, 6, canvas.height);

      // lane dashed lines
      ctx.strokeStyle = "#e6e6e6";
      ctx.lineWidth = 3;
      ctx.setLineDash([20, 20]);
      for (let i = 1; i < LANE_COUNT; i++) {
        const x = LEFT_MARGIN + i * LANE_WIDTH;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw some side trees for realism
      for (let t = 0; t < 6; t++) {
        const ty = (t * 130 + frameRef.current * 0.6) % canvas.height;
        ctx.fillStyle = "#1f7a1f";
        ctx.beginPath();
        ctx.ellipse(12, ty, 16, 24, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(canvas.width - 14, ty + 40, 16, 24, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // finish line rendering depending on progress
      const finishProgress = Math.min(1, distanceRef.current / finishDistance);
      const finishY = -200 + (1 - finishProgress) * (canvas.height + 400);
      if (finishY < 80) {
        const y = Math.max(finishY, 12);
        ctx.fillStyle = "#fff";
        ctx.fillRect(LEFT_MARGIN, y, canvas.width - LEFT_MARGIN - RIGHT_MARGIN, 8);
        ctx.fillStyle = "#000";
        ctx.font = "18px sans-serif";
        ctx.fillText("FINISH", canvas.width / 2 - 36, y - 8);
      }

      // spawn obstacles periodically
      spawnTimer++;
      if (spawnTimer > spawnIntervalFrames) {
        spawnTimer = 0;
        const laneIdx = Math.floor(Math.random() * LANE_COUNT);
        const chosenImg = obstacleImgsRef.current.length
          ? obstacleImgsRef.current[Math.floor(Math.random() * obstacleImgsRef.current.length)]
          : null;

        // approximate width/height of obstacle on canvas (scaled)
        const scale = chosenImg && chosenImg.width ? Math.min(0.45, (LANE_WIDTH * 0.9) / chosenImg.width) : 0.4;
        const imgW = chosenImg && chosenImg.width ? chosenImg.width * scale : 60;
        const imgH = chosenImg && chosenImg.height ? chosenImg.height * scale : 120;

        obstaclesRef.current.push({
          x: LANE_CENTERS[laneIdx],
          y: -imgH - 10,
          img: chosenImg || null,
          width: imgW,
          height: imgH,
          speedOffset: Math.random() * 1.6,
        });
      }

      // increase distance (simulate forward motion)
      const baseScrollPerFrame = finishDistance / (totalTime * 60);
      const scrollThisFrame = baseScrollPerFrame * (1 + Math.min(1, frameRef.current / 300));
      distanceRef.current += scrollThisFrame;

      // draw and update obstacles
      obstaclesRef.current = obstaclesRef.current.filter((obs) => {
        obs.y += 4 + (obs.speedOffset || 0);
        // draw obstacle using image if available
        if (obs.img && obs.img.complete && obs.img.naturalWidth > 0) {
          const img = obs.img;
          const scale = obs.width / img.width;
          ctx.drawImage(img, obs.x - (img.width * scale) / 2, obs.y, img.width * scale, img.height * scale);
        } else {
          ctx.fillStyle = "#EF4444";
          ctx.fillRect(obs.x - obs.width / 2, obs.y, obs.width, obs.height);
        }

        // collision detection (bounding-box)
        const playerY = canvas.height - 180; // player's draw y coordinate
        const playerW = playerImgRef.current && playerImgRef.current.width ? 120 * 0.6 : 50;
        const playerH = playerImgRef.current && playerImgRef.current.height ? 240 * 0.6 : 80;
        const playerLeft = carPositionRef.current - playerW / 2;
        const playerTop = playerY;
        const playerRight = playerLeft + playerW;
        const playerBottom = playerTop + playerH;

        const obsLeft = obs.x - obs.width / 2;
        const obsTop = obs.y;
        const obsRight = obsLeft + obs.width;
        const obsBottom = obsTop + obs.height;

        const overlapX = !(obsRight < playerLeft || obsLeft > playerRight);
        const overlapY = !(obsBottom < playerTop || obsTop > playerBottom);

        if (overlapX && overlapY) {
          // collision: crash
          setGameOver(true);
          setGameStarted(false);
          toast({
            title: "Crashed!",
            description: `You crashed before reaching the finish. Distance: ${Math.floor(distanceRef.current)}`,
          });
          return false;
        }

        return obs.y < canvas.height + 300;
      });

      // Update car x to lane center on each frame (keeps strict lane snap)
      carPositionRef.current = LANE_CENTERS[laneIndexRef.current];

      // draw player's car at bottom center of its lane
      const playerY = canvas.height - 180;
      if (playerImgRef.current && playerImgRef.current.complete && playerImgRef.current.naturalWidth > 0) {
        const img = playerImgRef.current;
        const scale = 0.6;
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, carPositionRef.current - w / 2, playerY, w, h);
      } else {
        ctx.fillStyle = "#0EA5E9";
        ctx.fillRect(carPositionRef.current - 25, playerY, 50, 80);
      }

      // HUD: time left, distance remaining, score
      const distRem = Math.max(0, Math.floor(finishDistance - distanceRef.current));
      setDistanceRemaining(distRem);
      setScore(Math.floor(distanceRef.current / 50));
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(12, 12, 200, 80);
      ctx.fillStyle = "#fff";
      ctx.font = "16px sans-serif";
      ctx.fillText(`Time: ${Math.max(0, Math.ceil(timeLeft))}s`, 22, 36);
      ctx.fillText(`Distance: ${distRem}`, 22, 58);
      ctx.fillText(`Score: ${Math.floor(distanceRef.current / 50)}`, 22, 80);

      // check finish condition
      if (distanceRef.current >= finishDistance && !finished) {
        setFinished(true);
        setGameStarted(false);
        toast({
          title: "Finish Reached!",
          description: `You crossed the finish in time! Score: ${Math.floor(distanceRef.current / 50)}`,
        });
      }

      frameRef.current++;
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted]);

  // timer tick
  useEffect(() => {
    if (!gameStarted) return;
    setTimeLeft(totalTime);
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        const next = t - 1;
        if (next <= 0) {
          clearInterval(timer);
          if (!finished) {
            setGameOver(true);
            setGameStarted(false);
            toast({
              title: "Time's up!",
              description: "You couldn't reach the finish in time.",
            });
          }
        }
        return Math.max(0, next);
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted]);

  // reward logic: only if finished and within time and account present and not claimed
  useEffect(() => {
    if (!finished || rewardClaimed || !accountAddress) return;

    if (timeLeft >= 0) {
      const rewardAmount = 12;
      claimReward(accountAddress, rewardAmount).then((success) => {
        if (success) {
          setRewardClaimed(true);
          toast({
            title: "Reward Claimed!",
            description: `${rewardAmount} ALGO has been credited to your wallet!`,
          });
        } else {
          toast({
            title: "Reward failed",
            description: "Could not credit reward to your wallet.",
          });
        }
      });

      // Mint NFT achievement
      const matchId = `speedracer-${Date.now()}`;
      const difficulty = distanceRef.current > finishDistance * 0.9 ? "hard" : "easy";
      mintGameNFT(accountAddress, "Speed Racer", Math.floor(distanceRef.current / 50), racingIcon, matchId, difficulty).then((result) => {
        if (result.success && result.assetId) {
          setNftAssetId(result.assetId);
          setShowOptInPrompt(true);
          toast({
            title: "NFT Achievement Created!",
            description: "Your game achievement NFT has been created. Please opt-in to receive it.",
          });

          recordGameSession({
            playerWalletAddress: accountAddress,
            gameName: "Speed Racer",
            score: Math.floor(distanceRef.current / 50),
            rewardAmount: rewardAmount,
            nftAssetId: result.assetId,
            difficulty,
          });
        } else {
          recordGameSession({
            playerWalletAddress: accountAddress,
            gameName: "Speed Racer",
            score: Math.floor(distanceRef.current / 50),
            rewardAmount: rewardAmount,
            difficulty,
          });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, accountAddress, rewardClaimed]);

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

  const startGame = () => {
    // put player in middle lane
    laneIndexRef.current = Math.floor(LANE_COUNT / 2);
    carPositionRef.current = LANE_CENTERS[laneIndexRef.current];

    setGameStarted(true);
    setGameOver(false);
    setFinished(false);
    setRewardClaimed(false);
    setNftAssetId(null);
    setShowOptInPrompt(false);
    setScore(0);
    setTimeLeft(totalTime);
    distanceRef.current = 0;
    setDistanceRemaining(finishDistance);
    obstaclesRef.current = [];
    frameRef.current = 0;
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Button variant="outline" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>

        <Card className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Speed Racer</h1>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="text-xl font-bold">Score: {score}</span>
            </div>
          </div>

          {!gameStarted && !gameOver && !finished && (
            <div className="text-center py-12">
              <p className="mb-6 text-muted-foreground">
                Reach the finish line within {totalTime} seconds to win ALGO & NFT. Use ← → to change lanes.
              </p>
              <Button onClick={startGame} size="lg">
                Start Game
              </Button>
            </div>
          )}

          {gameOver && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-destructive" />
              <h2 className="text-3xl font-bold mb-4">Game Over</h2>
              <p className="text-xl mb-2">You couldn't finish the race.</p>
              <p className="text-muted-foreground mb-6">Distance covered: {Math.floor(distanceRef.current)}</p>
              <div className="flex gap-4 justify-center">
                <Button onClick={startGame}>Try Again</Button>
                <Button variant="outline" onClick={() => navigate("/")}>
                  Return to Games
                </Button>
              </div>
            </div>
          )}

          {finished && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-3xl font-bold mb-4">You Finished!</h2>
              <p className="text-xl mb-2">Final Score: {score}</p>
              <p className="text-muted-foreground mb-6">You reached the finish in time — rewards incoming!</p>

              {showOptInPrompt && nftAssetId && (
                <Card className="p-4 bg-primary/10 border-primary/20 mb-4 max-w-sm mx-auto">
                  <p className="text-sm mb-3">🏆 Your achievement NFT is ready! Opt-in to receive it in your wallet.</p>
                  <Button onClick={handleOptInAndReceiveNFT} variant="default" size="sm">
                    Opt-in & Receive NFT
                  </Button>
                </Card>
              )}

              <div className="flex gap-4 justify-center">
                <Button onClick={startGame}>Play Again</Button>
                <Button variant="outline" onClick={() => navigate("/")}>
                  Return to Games
                </Button>
              </div>
            </div>
          )}

          {gameStarted && (
            <div className="flex flex-col items-center">
              <div className="mb-4 flex gap-6">
                <div>Time left: <strong>{Math.max(0, Math.ceil(timeLeft))}s</strong></div>
                <div>Distance remaining: <strong>{distanceRemaining}</strong></div>
                <div>Score: <strong>{score}</strong></div>
              </div>
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="border-2 border-primary rounded-lg"
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
