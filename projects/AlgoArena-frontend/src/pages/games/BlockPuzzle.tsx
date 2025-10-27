import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trophy, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePeraWallet } from "@/hooks/usePeraWallet";
import { claimReward } from "@/utils/algoReward";

type Board = (boolean | null)[][];

const shapes = [
  [[true, true, true, true]], // I
  [[true, true], [true, true]], // O
  [[false, true], [true, true], [true, false]], // S
  [[true, false], [true, true], [false, true]], // Z
  [[true], [true], [true]], // L piece
];

export default function BlockPuzzle() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { accountAddress } = usePeraWallet();
  const [board, setBoard] = useState<Board>(
    Array(10).fill(null).map(() => Array(10).fill(null))
  );
  const [score, setScore] = useState(0);
  const [currentShapes, setCurrentShapes] = useState<boolean[][][]>([]);
  const [selectedShape, setSelectedShape] = useState<number | null>(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  useEffect(() => {
    generateNewShapes();
  }, []);

  const generateNewShapes = () => {
    const newShapes = [
      shapes[Math.floor(Math.random() * shapes.length)],
      shapes[Math.floor(Math.random() * shapes.length)],
      shapes[Math.floor(Math.random() * shapes.length)],
    ];
    setCurrentShapes(newShapes);
  };

  const canPlaceShape = (shape: boolean[][], row: number, col: number) => {
    for (let i = 0; i < shape.length; i++) {
      for (let j = 0; j < shape[i].length; j++) {
        if (shape[i][j]) {
          const newRow = row + i;
          const newCol = col + j;
          if (
            newRow >= 10 ||
            newCol >= 10 ||
            board[newRow]?.[newCol] === true
          ) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const placeShape = (shape: boolean[][], row: number, col: number) => {
    const newBoard = board.map(r => [...r]);
    for (let i = 0; i < shape.length; i++) {
      for (let j = 0; j < shape[i].length; j++) {
        if (shape[i][j]) {
          newBoard[row + i][col + j] = true;
        }
      }
    }
    return newBoard;
  };

  const clearLines = (currentBoard: Board) => {
    let newBoard = currentBoard.map(r => [...r]);
    let clearedLines = 0;

    // Clear full rows
    for (let i = 0; i < 10; i++) {
      if (newBoard[i].every(cell => cell === true)) {
        newBoard[i] = Array(10).fill(null);
        clearedLines++;
      }
    }

    // Clear full columns
    for (let j = 0; j < 10; j++) {
      if (newBoard.every(row => row[j] === true)) {
        for (let i = 0; i < 10; i++) {
          newBoard[i][j] = null;
        }
        clearedLines++;
      }
    }

    return { newBoard, clearedLines };
  };

  const handleCellClick = (row: number, col: number) => {
    if (selectedShape === null) return;

    const shape = currentShapes[selectedShape];
    if (!canPlaceShape(shape, row, col)) {
      toast({ title: "Can't place here!", variant: "destructive" });
      return;
    }

    let newBoard = placeShape(shape, row, col);
    const { newBoard: clearedBoard, clearedLines } = clearLines(newBoard);
    
    setBoard(clearedBoard);
    setScore(score + 10 + clearedLines * 50);

    const newShapes = [...currentShapes];
    newShapes.splice(selectedShape, 1);
    setCurrentShapes(newShapes);
    setSelectedShape(null);

    if (newShapes.length === 0) {
      generateNewShapes();
      toast({ title: "New shapes generated!" });
    }

    if (clearedLines > 0) {
      toast({ title: `Cleared ${clearedLines} lines! +${clearedLines * 50} points` });
    }
  };

  const resetGame = () => {
    setBoard(Array(10).fill(null).map(() => Array(10).fill(null)));
    setScore(0);
    generateNewShapes();
    setSelectedShape(null);
    setRewardClaimed(false);
  };

  useEffect(() => {
    if (score >= 500 && !rewardClaimed && accountAddress) {
      const rewardAmount = 9;
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
  }, [score, accountAddress, rewardClaimed, toast]);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Button variant="outline" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>

        <Card className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Block Puzzle</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="text-xl font-bold">{score}</span>
              </div>
              <Button variant="outline" size="icon" onClick={resetGame}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {score >= 500 && (
            <div className="mb-4 p-4 bg-primary/20 rounded-lg text-center">
              <p className="text-xl font-bold text-primary">You Won 9 ALGO! 🎉</p>
            </div>
          )}

          <div className="mb-6">
            <div className="grid grid-cols-10 gap-1 bg-muted p-2 rounded-lg">
              {board.map((row, i) =>
                row.map((cell, j) => (
                  <button
                    key={`${i}-${j}`}
                    onClick={() => handleCellClick(i, j)}
                    className={`aspect-square rounded transition-all ${
                      cell === true
                        ? "bg-primary"
                        : "bg-background hover:bg-primary/20"
                    }`}
                  />
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {currentShapes.map((shape, index) => (
              <button
                key={index}
                onClick={() => setSelectedShape(index)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedShape === index
                    ? "border-primary bg-primary/10 scale-105"
                    : "border-muted hover:border-primary/50"
                }`}
              >
                <div className="flex flex-col gap-1">
                  {shape.map((row, i) => (
                    <div key={i} className="flex gap-1 justify-center">
                      {row.map((cell, j) => (
                        <div
                          key={j}
                          className={`w-6 h-6 rounded ${
                            cell ? "bg-primary" : "bg-transparent"
                          }`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
