import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePeraWallet } from "@/hooks/usePeraWallet";
import { claimReward } from "@/utils/algoReward";

export default function SpeedRacer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { accountAddress } = usePeraWallet();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  
  const carPositionRef = useRef(150);
  const obstaclesRef = useRef<{ x: number; y: number; width: number }[]>([]);
  const gameLoopRef = useRef<number>();

  useEffect(() => {
    if (!gameStarted || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && carPositionRef.current > 50) {
        carPositionRef.current -= 100;
      } else if (e.key === "ArrowRight" && carPositionRef.current < 250) {
        carPositionRef.current += 100;
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    let frameCount = 0;
    const gameLoop = () => {
      if (!ctx) return;
      
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, 400, 600);

      // Draw lanes
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 100, 0);
        ctx.lineTo(i * 100, 600);
        ctx.stroke();
      }

      // Draw car
      ctx.fillStyle = "#0EA5E9";
      ctx.fillRect(carPositionRef.current - 25, 500, 50, 80);

      // Update and draw obstacles
      if (frameCount % 60 === 0) {
        const lane = Math.floor(Math.random() * 3);
        obstaclesRef.current.push({
          x: 50 + lane * 100,
          y: -50,
          width: 50,
        });
      }

      obstaclesRef.current = obstaclesRef.current.filter((obs) => {
        obs.y += 5;
        
        // Draw obstacle
        ctx.fillStyle = "#EF4444";
        ctx.fillRect(obs.x - 25, obs.y, obs.width, 50);

        // Check collision
        if (
          obs.y > 480 &&
          obs.y < 580 &&
          Math.abs(obs.x - carPositionRef.current) < 40
        ) {
          setGameOver(true);
          setGameStarted(false);
          toast({
            title: "Game Over!",
            description: `Final Score: ${Math.floor(frameCount / 10)}`,
          });
          return false;
        }

        return obs.y < 600;
      });

      setScore(Math.floor(frameCount / 10));
      frameCount++;

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameStarted, toast]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setRewardClaimed(false);
    carPositionRef.current = 150;
    obstaclesRef.current = [];
  };

  useEffect(() => {
    if (gameOver && score >= 100 && !rewardClaimed && accountAddress) {
      const rewardAmount = 25;
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
  }, [gameOver, score, accountAddress, rewardClaimed, toast]);

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

          {!gameStarted && !gameOver && (
            <div className="text-center py-12">
              <p className="mb-6 text-muted-foreground">
                Use Arrow Keys (← →) to move your car and avoid obstacles!
              </p>
              <Button onClick={startGame} size="lg">
                Start Game
              </Button>
            </div>
          )}

          {gameOver && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
              <p className="text-xl mb-2">Final Score: {score}</p>
              <p className="text-muted-foreground mb-6">
                {score >= 100 ? "You won 25 ALGO!" : "Try again!"}
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={startGame}>Play Again</Button>
                <Button variant="outline" onClick={() => navigate("/")}>
                  Return to Games
                </Button>
              </div>
            </div>
          )}

          {gameStarted && (
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                width={400}
                height={600}
                className="border-2 border-primary rounded-lg"
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
