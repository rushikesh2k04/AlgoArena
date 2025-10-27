import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePeraWallet } from "@/hooks/usePeraWallet";
import { claimReward } from "@/utils/algoReward";

type Fruit = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: number;
  radius: number;
};

const fruitEmojis = ["🍒", "🍓", "🍊", "🍋", "🍎", "🍉", "🍇", "🍌"];
const fruitSizes = [15, 20, 25, 30, 35, 40, 45, 50];

export default function FruitMerge() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { accountAddress } = usePeraWallet();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [nextFruit, setNextFruit] = useState(Math.floor(Math.random() * 3));
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const fruitsRef = useRef<Fruit[]>([]);
  const mouseXRef = useRef(200);

  useEffect(() => {
    if (!gameStarted || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gravity = 0.3;
    const friction = 0.99;

    const gameLoop = () => {
      if (!ctx) return;

      ctx.fillStyle = "#FFF8DC";
      ctx.fillRect(0, 0, 400, 600);

      // Draw container
      ctx.strokeStyle = "#8B4513";
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, 400, 600);

      fruitsRef.current.forEach((fruit, i) => {
        fruit.vy += gravity;
        fruit.x += fruit.vx;
        fruit.y += fruit.vy;
        fruit.vx *= friction;
        fruit.vy *= friction;

        // Wall collisions
        if (fruit.x - fruit.radius < 0) {
          fruit.x = fruit.radius;
          fruit.vx *= -0.5;
        }
        if (fruit.x + fruit.radius > 400) {
          fruit.x = 400 - fruit.radius;
          fruit.vx *= -0.5;
        }
        if (fruit.y + fruit.radius > 600) {
          fruit.y = 600 - fruit.radius;
          fruit.vy *= -0.5;
        }

        // Check game over
        if (fruit.y - fruit.radius < 50 && Math.abs(fruit.vy) < 0.5) {
          setGameOver(true);
          setGameStarted(false);
          toast({
            title: "Game Over!",
            description: `Final Score: ${score}`,
          });
        }

        // Collision with other fruits
        fruitsRef.current.forEach((other, j) => {
          if (i >= j) return;
          const dx = other.x - fruit.x;
          const dy = other.y - fruit.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = fruit.radius + other.radius;

          if (dist < minDist && fruit.type === other.type && fruit.type < 7) {
            // Merge fruits
            const newType = fruit.type + 1;
            const newRadius = fruitSizes[newType];
            fruitsRef.current.push({
              x: (fruit.x + other.x) / 2,
              y: (fruit.y + other.y) / 2,
              vx: 0,
              vy: 0,
              type: newType,
              radius: newRadius,
            });
            fruitsRef.current.splice(j, 1);
            fruitsRef.current.splice(i, 1);
            setScore(s => s + (newType + 1) * 10);
            return;
          } else if (dist < minDist) {
            // Bounce
            const angle = Math.atan2(dy, dx);
            const sin = Math.sin(angle);
            const cos = Math.cos(angle);

            const vx1 = fruit.vx * cos + fruit.vy * sin;
            const vy1 = fruit.vy * cos - fruit.vx * sin;
            const vx2 = other.vx * cos + other.vy * sin;
            const vy2 = other.vy * cos - other.vx * sin;

            fruit.vx = vx2 * cos - vy1 * sin;
            fruit.vy = vy1 * cos + vx2 * sin;
            other.vx = vx1 * cos - vy2 * sin;
            other.vy = vy2 * cos + vx1 * sin;

            const overlap = minDist - dist;
            fruit.x -= (overlap / 2) * cos;
            fruit.y -= (overlap / 2) * sin;
            other.x += (overlap / 2) * cos;
            other.y += (overlap / 2) * sin;
          }
        });

        // Draw fruit
        ctx.font = `${fruit.radius * 2}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(fruitEmojis[fruit.type], fruit.x, fruit.y);
      });

      requestAnimationFrame(gameLoop);
    };

    gameLoop();
  }, [gameStarted, score, toast]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseXRef.current = e.clientX - rect.left;
  };

  const handleClick = () => {
    if (!gameStarted) return;
    
    const radius = fruitSizes[nextFruit];
    fruitsRef.current.push({
      x: Math.max(radius, Math.min(400 - radius, mouseXRef.current)),
      y: 50,
      vx: 0,
      vy: 0,
      type: nextFruit,
      radius,
    });
    setNextFruit(Math.floor(Math.random() * 3));
  };

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    fruitsRef.current = [];
    setNextFruit(Math.floor(Math.random() * 3));
    setRewardClaimed(false);
  };

  useEffect(() => {
    if (gameOver && score >= 300 && !rewardClaimed && accountAddress) {
      const rewardAmount = 11;
      claimReward(accountAddress, rewardAmount).then(success => {
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
            variant: "destructive"
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
            <h1 className="text-3xl font-bold">Fruit Merge</h1>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="text-xl font-bold">Score: {score}</span>
            </div>
          </div>

          {!gameStarted && !gameOver && (
            <div className="text-center py-12">
              <p className="mb-6 text-muted-foreground">
                Click to drop fruits. Merge same fruits to create bigger ones!
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
                {score >= 300 ? "You won 11 ALGO!" : "Try again!"}
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
            <>
              <div className="text-center mb-4">
                <span className="text-lg">Next: {fruitEmojis[nextFruit]}</span>
              </div>
              <canvas
                ref={canvasRef}
                width={400}
                height={600}
                onMouseMove={handleMouseMove}
                onClick={handleClick}
                className="border-2 border-primary rounded-lg w-full cursor-pointer"
              />
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
