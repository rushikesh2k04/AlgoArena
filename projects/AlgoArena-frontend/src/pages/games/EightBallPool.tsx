import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePeraWallet } from "@/hooks/usePeraWallet";
import { claimReward } from "@/utils/algoReward";

type Ball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  number: number;
  potted: boolean;
};

export default function EightBallPool() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { accountAddress } = usePeraWallet();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const ballsRef = useRef<Ball[]>([]);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const initBalls = () => {
    const balls: Ball[] = [
      { x: 200, y: 300, vx: 0, vy: 0, color: "#fff", number: 0, potted: false }, // Cue ball
    ];
    
    // Rack the balls
    const startX = 500;
    const startY = 300;
    const radius = 15;
    const colors = ["#ff0000", "#0000ff", "#ff8800", "#8800ff", "#00ff00"];
    
    let ballNum = 1;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col <= row; col++) {
        balls.push({
          x: startX + row * radius * 2,
          y: startY + (col - row / 2) * radius * 2,
          vx: 0,
          vy: 0,
          color: colors[ballNum % colors.length],
          number: ballNum++,
          potted: false,
        });
      }
    }
    
    ballsRef.current = balls;
  };

  useEffect(() => {
    if (!gameStarted || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    initBalls();

    const radius = 15;
    const friction = 0.98;
    const pockets = [
      { x: 30, y: 30 },
      { x: 400, y: 30 },
      { x: 770, y: 30 },
      { x: 30, y: 570 },
      { x: 400, y: 570 },
      { x: 770, y: 570 },
    ];

    const gameLoop = () => {
      if (!ctx) return;

      ctx.fillStyle = "#0f5132";
      ctx.fillRect(0, 0, 800, 600);

      // Draw pockets
      pockets.forEach(pocket => {
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, 25, 0, Math.PI * 2);
        ctx.fill();
      });

      let allStopped = true;

      ballsRef.current.forEach((ball, i) => {
        if (ball.potted) return;

        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vx *= friction;
        ball.vy *= friction;

        if (Math.abs(ball.vx) > 0.1 || Math.abs(ball.vy) > 0.1) {
          allStopped = false;
        }

        // Wall collisions
        if (ball.x - radius < 0 || ball.x + radius > 800) {
          ball.vx *= -0.8;
          ball.x = Math.max(radius, Math.min(800 - radius, ball.x));
        }
        if (ball.y - radius < 0 || ball.y + radius > 600) {
          ball.vy *= -0.8;
          ball.y = Math.max(radius, Math.min(600 - radius, ball.y));
        }

        // Check pockets
        pockets.forEach(pocket => {
          const dx = ball.x - pocket.x;
          const dy = ball.y - pocket.y;
          if (Math.sqrt(dx * dx + dy * dy) < 25) {
            ball.potted = true;
            if (ball.number !== 0) {
              setScore(s => s + 10);
              toast({ title: `Ball ${ball.number} potted! +10 points` });
            }
          }
        });

        // Ball collisions
        ballsRef.current.forEach((other, j) => {
          if (i >= j || other.potted || ball.potted) return;
          const dx = other.x - ball.x;
          const dy = other.y - ball.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < radius * 2) {
            const angle = Math.atan2(dy, dx);
            const sin = Math.sin(angle);
            const cos = Math.cos(angle);
            
            const vx1 = ball.vx * cos + ball.vy * sin;
            const vy1 = ball.vy * cos - ball.vx * sin;
            const vx2 = other.vx * cos + other.vy * sin;
            const vy2 = other.vy * cos - other.vx * sin;
            
            ball.vx = vx2 * cos - vy1 * sin;
            ball.vy = vy1 * cos + vx2 * sin;
            other.vx = vx1 * cos - vy2 * sin;
            other.vy = vy2 * cos + vx1 * sin;
            
            const overlap = radius * 2 - dist;
            ball.x -= overlap / 2 * cos;
            ball.y -= overlap / 2 * sin;
            other.x += overlap / 2 * cos;
            other.y += overlap / 2 * sin;
          }
        });

        // Draw ball
        ctx.fillStyle = ball.color;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.stroke();

        if (ball.number !== 0) {
          ctx.fillStyle = "#000";
          ctx.font = "12px bold";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(ball.number.toString(), ball.x, ball.y);
        }
      });

      const activeBalls = ballsRef.current.filter(b => !b.potted && b.number !== 0);
      if (activeBalls.length === 0 && allStopped) {
        setGameWon(true);
        setGameStarted(false);
      }

      requestAnimationFrame(gameLoop);
    };

    gameLoop();
  }, [gameStarted, toast]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cueBall = ballsRef.current[0];
    const dx = x - cueBall.x;
    const dy = y - cueBall.y;
    if (Math.sqrt(dx * dx + dy * dy) < 15) {
      isDraggingRef.current = true;
      dragStartRef.current = { x, y };
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cueBall = ballsRef.current[0];
    const dx = dragStartRef.current.x - x;
    const dy = dragStartRef.current.y - y;
    
    cueBall.vx = dx * 0.2;
    cueBall.vy = dy * 0.2;
  };

  useEffect(() => {
    if (gameWon && !rewardClaimed && accountAddress) {
      const rewardAmount = 15;
      claimReward(accountAddress, rewardAmount).then(success => {
        if (success) {
          setRewardClaimed(true);
          toast({
            title: "Reward Claimed!",
            description: `${rewardAmount} ALGO has been credited to your wallet!`,
          });
        }
      });
    }
  }, [gameWon, accountAddress, rewardClaimed, toast]);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button variant="outline" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>

        <Card className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">8 Ball Pool</h1>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="text-xl font-bold">Score: {score}</span>
            </div>
          </div>

          {!gameStarted && !gameWon && (
            <div className="text-center py-12">
              <p className="mb-6 text-muted-foreground">
                Drag the cue ball to shoot! Pot all balls to win.
              </p>
              <Button onClick={() => setGameStarted(true)} size="lg">
                Start Game
              </Button>
            </div>
          )}

          {gameWon && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-3xl font-bold mb-4">You Won 15 ALGO!</h2>
              <p className="text-xl mb-6">Final Score: {score}</p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => { setGameStarted(true); setGameWon(false); setScore(0); }}>
                  Play Again
                </Button>
                <Button variant="outline" onClick={() => navigate("/")}>
                  Return to Games
                </Button>
              </div>
            </div>
          )}

          {gameStarted && (
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              className="border-2 border-primary rounded-lg w-full cursor-pointer"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
