import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Home, RotateCcw } from "lucide-react";
import { usePeraWallet } from "@/hooks/usePeraWallet";
import { useToast } from "@/hooks/use-toast";
import { claimReward } from "@/utils/algoReward";

type Candy = '🍬' | '🍭' | '🍫' | '🍩' | '🍪' | null;

const CandyCrush = () => {
  const navigate = useNavigate();
  const { accountAddress } = usePeraWallet();
  const { toast } = useToast();
  const [grid, setGrid] = useState<Candy[][]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(30);
  const [level, setLevel] = useState(1);
  const [targetScore, setTargetScore] = useState(500);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const candies: Candy[] = ['🍬', '🍭', '🍫', '🍩', '🍪'];

  const createGrid = () => {
    const newGrid: Candy[][] = [];
    for (let i = 0; i < 8; i++) {
      const row: Candy[] = [];
      for (let j = 0; j < 8; j++) {
        row.push(candies[Math.floor(Math.random() * candies.length)]);
      }
      newGrid.push(row);
    }
    return newGrid;
  };

  useEffect(() => {
    setGrid(createGrid());
  }, []);

  const checkMatches = (currentGrid: Candy[][]) => {
    const newGrid = currentGrid.map(row => [...row]);
    let matchFound = false;
    let points = 0;

    // Check horizontal matches
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 6; j++) {
        const candy = newGrid[i][j];
        if (candy && candy === newGrid[i][j + 1] && candy === newGrid[i][j + 2]) {
          newGrid[i][j] = null;
          newGrid[i][j + 1] = null;
          newGrid[i][j + 2] = null;
          matchFound = true;
          points += 30;
        }
      }
    }

    // Check vertical matches
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 8; j++) {
        const candy = newGrid[i][j];
        if (candy && candy === newGrid[i + 1][j] && candy === newGrid[i + 2][j]) {
          newGrid[i][j] = null;
          newGrid[i + 1][j] = null;
          newGrid[i + 2][j] = null;
          matchFound = true;
          points += 30;
        }
      }
    }

    if (matchFound) {
      setScore(prev => prev + points);
      // Drop candies
      for (let j = 0; j < 8; j++) {
        for (let i = 7; i >= 0; i--) {
          if (newGrid[i][j] === null) {
            for (let k = i - 1; k >= 0; k--) {
              if (newGrid[k][j] !== null) {
                newGrid[i][j] = newGrid[k][j];
                newGrid[k][j] = null;
                break;
              }
            }
            if (newGrid[i][j] === null) {
              newGrid[i][j] = candies[Math.floor(Math.random() * candies.length)];
            }
          }
        }
      }
      setTimeout(() => checkMatches(newGrid), 300);
    }
    
    setGrid(newGrid);
  };

  const handleCellClick = (row: number, col: number) => {
    if (moves === 0) return;

    if (!selectedCell) {
      setSelectedCell([row, col]);
    } else {
      const [selectedRow, selectedCol] = selectedCell;
      const isAdjacent = 
        (Math.abs(row - selectedRow) === 1 && col === selectedCol) ||
        (Math.abs(col - selectedCol) === 1 && row === selectedRow);

      if (isAdjacent) {
        const newGrid = grid.map(r => [...r]);
        [newGrid[row][col], newGrid[selectedRow][selectedCol]] = 
          [newGrid[selectedRow][selectedCol], newGrid[row][col]];
        
        setGrid(newGrid);
        setMoves(prev => prev - 1);
        setTimeout(() => checkMatches(newGrid), 100);
      }
      
      setSelectedCell(null);
    }
  };

  const nextLevel = () => {
    setLevel(prev => prev + 1);
    setMoves(30);
    setTargetScore(prev => prev + 300);
    setGrid(createGrid());
  };

  const resetGame = () => {
    setGrid(createGrid());
    setScore(0);
    setMoves(30);
    setLevel(1);
    setTargetScore(500);
    setRewardClaimed(false);
  };

  useEffect(() => {
    if (score >= targetScore && level >= 3 && !rewardClaimed && accountAddress) {
      const rewardAmount = 20;
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
  }, [score, targetScore, level, accountAddress, rewardClaimed, toast]);

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
              Candy Crush
            </h1>
            <p className="text-muted-foreground">Level {level} • Score: {score}/{targetScore}</p>
          </div>
          <Button variant="outline" onClick={resetGame}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        <Card className="p-8 glass-effect">
          <div className="text-center mb-4">
            <p className="text-lg">Moves Left: <span className="font-bold text-primary">{moves}</span></p>
          </div>

          <div className="grid grid-cols-8 gap-2 max-w-md mx-auto mb-6">
            {grid.map((row, i) =>
              row.map((candy, j) => (
                <button
                  key={`${i}-${j}`}
                  onClick={() => handleCellClick(i, j)}
                  className={`aspect-square text-3xl rounded-lg transition-all ${
                    selectedCell?.[0] === i && selectedCell?.[1] === j
                      ? 'bg-primary/30 scale-110'
                      : 'bg-card hover:bg-primary/10'
                  }`}
                >
                  {candy}
                </button>
              ))
            )}
          </div>

          {score >= targetScore && (
            <div className="text-center space-y-4">
              <p className="text-2xl font-bold text-primary">🎉 Level Complete!</p>
              {level >= 3 && (
                <p className="text-lg text-secondary">+20 ALGO Reward!</p>
              )}
              <Button onClick={nextLevel} className="gap-2">
                Next Level
              </Button>
            </div>
          )}

          {moves === 0 && score < targetScore && (
            <div className="text-center">
              <p className="text-xl font-bold text-destructive mb-4">Game Over!</p>
              <Button onClick={resetGame}>Try Again</Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CandyCrush;
