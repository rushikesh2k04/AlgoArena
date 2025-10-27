import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Home, RotateCcw } from "lucide-react";
import { usePeraWallet } from "@/hooks/usePeraWallet";
import { useToast } from "@/hooks/use-toast";
import { claimReward } from "@/utils/algoReward";

type Bubble = { color: string; x: number; y: number } | null;

const BubbleShooter = () => {
  const navigate = useNavigate();
  const { accountAddress } = usePeraWallet();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[][]>([]);
  const [shooterColor, setShooterColor] = useState('');

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
  const rows = 8;
  const cols = 10;
  const bubbleSize = 40;

  const initializeGame = () => {
    const newBubbles: Bubble[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: Bubble[] = [];
      for (let j = 0; j < cols; j++) {
        if (i < 5) {
          row.push({
            color: colors[Math.floor(Math.random() * colors.length)],
            x: j * bubbleSize + (i % 2 ? bubbleSize / 2 : 0),
            y: i * bubbleSize
          });
        } else {
          row.push(null);
        }
      }
      newBubbles.push(row);
    }
    setBubbles(newBubbles);
    setShooterColor(colors[Math.floor(Math.random() * colors.length)]);
    setScore(0);
    setGameWon(false);
    setRewardClaimed(false);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw bubbles
    bubbles.forEach(row => {
      row.forEach(bubble => {
        if (bubble) {
          ctx.beginPath();
          ctx.arc(bubble.x + bubbleSize / 2, bubble.y + bubbleSize / 2, bubbleSize / 2 - 2, 0, Math.PI * 2);
          ctx.fillStyle = bubble.color;
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
    });

    // Draw shooter
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height - 30, 20, 0, Math.PI * 2);
    ctx.fillStyle = shooterColor;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [bubbles, shooterColor]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Find nearest bubble to click position
    let nearestRow = Math.floor(clickY / bubbleSize);
    let nearestCol = Math.floor((clickX - (nearestRow % 2 ? bubbleSize / 2 : 0)) / bubbleSize);

    nearestRow = Math.max(0, Math.min(rows - 1, nearestRow));
    nearestCol = Math.max(0, Math.min(cols - 1, nearestCol));

    // Check if we can place bubble there
    if (!bubbles[nearestRow][nearestCol]) {
      const newBubbles = bubbles.map(row => [...row]);
      newBubbles[nearestRow][nearestCol] = {
        color: shooterColor,
        x: nearestCol * bubbleSize + (nearestRow % 2 ? bubbleSize / 2 : 0),
        y: nearestRow * bubbleSize
      };

      // Check for matches
      const matches = findMatches(newBubbles, nearestRow, nearestCol, shooterColor);
      if (matches.length >= 3) {
        matches.forEach(([r, c]) => {
          newBubbles[r][c] = null;
        });
        setScore(prev => prev + matches.length * 10);
      }

      setBubbles(newBubbles);
      setShooterColor(colors[Math.floor(Math.random() * colors.length)]);

      // Check win condition
      const hasAnyBubbles = newBubbles.some(row => row.some(bubble => bubble !== null));
      if (!hasAnyBubbles) {
        setGameWon(true);
      }
    }
  };

  const findMatches = (grid: Bubble[][], row: number, col: number, color: string): [number, number][] => {
    const visited = new Set<string>();
    const matches: [number, number][] = [];

    const dfs = (r: number, c: number) => {
      const key = `${r},${c}`;
      if (visited.has(key)) return;
      if (r < 0 || r >= rows || c < 0 || c >= cols) return;
      if (!grid[r][c] || grid[r][c]!.color !== color) return;

      visited.add(key);
      matches.push([r, c]);

      // Check adjacent cells
      dfs(r - 1, c);
      dfs(r + 1, c);
      dfs(r, c - 1);
      dfs(r, c + 1);
    };

    dfs(row, col);
    return matches;
  };

  useEffect(() => {
    if (gameWon && !rewardClaimed && accountAddress) {
      const rewardAmount = 8;
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
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => navigate('/')}>
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
              Bubble Shooter
            </h1>
            <p className="text-muted-foreground">Score: {score}</p>
          </div>
          <Button variant="outline" onClick={initializeGame}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        <Card className="p-8 glass-effect">
          {gameWon ? (
            <div className="text-center space-y-4">
              <p className="text-3xl font-bold text-primary">🎉 You Won!</p>
              <p className="text-xl">Final Score: {score}</p>
              <p className="text-lg text-secondary">+8 ALGO Reward!</p>
              <Button onClick={initializeGame} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Play Again
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                Click where you want to shoot the bubble
              </p>
              <canvas
                ref={canvasRef}
                width={cols * bubbleSize}
                height={rows * bubbleSize}
                onClick={handleCanvasClick}
                className="mx-auto border border-primary/20 rounded-lg cursor-crosshair"
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default BubbleShooter;
