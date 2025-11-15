import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Home, RotateCcw } from "lucide-react";
import { usePeraWallet } from "@/hooks/useMultiWallet";
import { useToast } from "@/hooks/use-toast";
import { claimReward } from "@/utils/algoReward";

type Cell = { color: string; connected: boolean } | null;

const ColorConnect = () => {
  const navigate = useNavigate();
  const { accountAddress } = usePeraWallet();
  const { toast } = useToast();
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(20);
  const [targetScore, setTargetScore] = useState(500);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

  const createGrid = () => {
    const newGrid: Cell[][] = [];
    for (let i = 0; i < 8; i++) {
      const row: Cell[] = [];
      for (let j = 0; j < 8; j++) {
        row.push({
          color: colors[Math.floor(Math.random() * colors.length)],
          connected: false,
        });
      }
      newGrid.push(row);
    }
    return newGrid;
  };

  useEffect(() => {
    setGrid(createGrid());
  }, []);

  const checkConnections = (currentGrid: Cell[][]) => {
    const newGrid = currentGrid.map(row => row.map(cell => cell ? { ...cell, connected: false } : null));
    let connectionsFound = false;
    let points = 0;

    // Check horizontal connections
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 6; j++) {
        const cell = newGrid[i][j];
        if (cell && cell.color === newGrid[i][j + 1]?.color && cell.color === newGrid[i][j + 2]?.color) {
          newGrid[i][j]!.connected = true;
          newGrid[i][j + 1]!.connected = true;
          newGrid[i][j + 2]!.connected = true;
          connectionsFound = true;
          points += 50;
        }
      }
    }

    // Check vertical connections
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 8; j++) {
        const cell = newGrid[i][j];
        if (cell && cell.color === newGrid[i + 1][j]?.color && cell.color === newGrid[i + 2][j]?.color) {
          newGrid[i][j]!.connected = true;
          newGrid[i + 1][j]!.connected = true;
          newGrid[i + 2][j]!.connected = true;
          connectionsFound = true;
          points += 50;
        }
      }
    }

    if (connectionsFound) {
      setScore(prev => prev + points);
      // Remove connected cells and drop down
      setTimeout(() => {
        const clearedGrid = newGrid.map(row => 
          row.map(cell => cell && cell.connected ? null : cell)
        );
        
        // Drop cells down
        for (let j = 0; j < 8; j++) {
          for (let i = 7; i >= 0; i--) {
            if (clearedGrid[i][j] === null) {
              for (let k = i - 1; k >= 0; k--) {
                if (clearedGrid[k][j] !== null) {
                  clearedGrid[i][j] = clearedGrid[k][j];
                  clearedGrid[k][j] = null;
                  break;
                }
              }
              if (clearedGrid[i][j] === null) {
                clearedGrid[i][j] = {
                  color: colors[Math.floor(Math.random() * colors.length)],
                  connected: false,
                };
              }
            }
          }
        }
        setGrid(clearedGrid);
        setTimeout(() => checkConnections(clearedGrid), 300);
      }, 500);
    } else {
      setGrid(newGrid);
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (moves === 0 || !grid[row][col]) return;

    if (!selectedCell) {
      setSelectedCell([row, col]);
    } else {
      const [selectedRow, selectedCol] = selectedCell;
      const isAdjacent = 
        (Math.abs(row - selectedRow) === 1 && col === selectedCol) ||
        (Math.abs(col - selectedCol) === 1 && row === selectedRow);

      if (isAdjacent) {
        const newGrid = grid.map(r => r.map(cell => cell ? { ...cell } : null));
        [newGrid[row][col], newGrid[selectedRow][selectedCol]] = 
          [newGrid[selectedRow][selectedCol], newGrid[row][col]];
        
        setGrid(newGrid);
        setMoves(prev => prev - 1);
        setTimeout(() => checkConnections(newGrid), 100);
      }
      
      setSelectedCell(null);
    }
  };

  const resetGame = () => {
    setGrid(createGrid());
    setScore(0);
    setMoves(20);
    setTargetScore(500);
    setRewardClaimed(false);
  };

  useEffect(() => {
    if (score >= targetScore && !rewardClaimed && accountAddress) {
      const rewardAmount = 11;
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
  }, [score, targetScore, accountAddress, rewardClaimed, toast]);

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
              Color Connect
            </h1>
            <p className="text-muted-foreground">Score: {score}/{targetScore}</p>
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
              row.map((cell, j) => (
                <button
                  key={`${i}-${j}`}
                  onClick={() => handleCellClick(i, j)}
                  className={`aspect-square rounded-lg transition-all ${
                    selectedCell?.[0] === i && selectedCell?.[1] === j
                      ? 'scale-110 ring-2 ring-primary'
                      : 'hover:scale-105'
                  } ${cell?.connected ? 'animate-glow' : ''}`}
                  style={{
                    backgroundColor: cell?.color || '#333',
                  }}
                />
              ))
            )}
          </div>

          {score >= targetScore && (
            <div className="text-center space-y-4">
              <p className="text-2xl font-bold text-primary">🎉 You Won!</p>
              <p className="text-lg text-secondary">+11 ALGO Reward!</p>
              <Button onClick={resetGame} className="gap-2">
                Play Again
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

export default ColorConnect;
