import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trophy, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePeraWallet } from "@/hooks/usePeraWallet";
import { claimReward } from "@/utils/algoReward";

// Simple sudoku puzzle generator
const generateSudoku = (): number[][] => {
  const base = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ];
  return base;
};

const solution = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

export default function SudokuMaster() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { accountAddress } = usePeraWallet();
  const [board, setBoard] = useState<number[][]>(generateSudoku());
  const [initial, setInitial] = useState<number[][]>(generateSudoku());
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const checkWin = (currentBoard: number[][]) => {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (currentBoard[i][j] !== solution[i][j]) return false;
      }
    }
    return true;
  };

  const handleCellClick = (row: number, col: number) => {
    if (initial[row][col] !== 0) return;
    setSelected({ row, col });
  };

  const handleNumberClick = (num: number) => {
    if (!selected) return;
    const newBoard = board.map(row => [...row]);
    newBoard[selected.row][selected.col] = num;
    setBoard(newBoard);

    if (checkWin(newBoard)) {
      setGameWon(true);
      toast({
        title: "Puzzle Solved!",
        description: "You won 10 ALGO!",
      });
    }
  };

  const resetGame = () => {
    const puzzle = generateSudoku();
    setBoard(puzzle);
    setInitial(puzzle);
    setSelected(null);
    setGameWon(false);
    setRewardClaimed(false);
  };

  useEffect(() => {
    if (gameWon && !rewardClaimed && accountAddress) {
      const rewardAmount = 12;
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
  }, [gameWon, accountAddress, rewardClaimed, toast]);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Button variant="outline" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>

        <Card className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Sudoku Master</h1>
            <Button variant="outline" size="icon" onClick={resetGame}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {gameWon && (
            <div className="mb-6 p-4 bg-primary/20 rounded-lg text-center">
              <Trophy className="w-12 h-12 mx-auto mb-2 text-primary" />
              <p className="text-xl font-bold text-primary">You Won 10 ALGO! 🎉</p>
            </div>
          )}

          <div className="mb-6 grid grid-cols-9 gap-0 border-2 border-primary">
            {board.map((row, i) =>
              row.map((cell, j) => (
                <button
                  key={`${i}-${j}`}
                  onClick={() => handleCellClick(i, j)}
                  className={`aspect-square flex items-center justify-center text-lg font-bold
                    ${initial[i][j] !== 0 ? "bg-muted" : "bg-background"}
                    ${selected?.row === i && selected?.col === j ? "bg-primary/30" : ""}
                    ${j % 3 === 2 && j < 8 ? "border-r-2 border-primary" : "border-r border-border"}
                    ${i % 3 === 2 && i < 8 ? "border-b-2 border-primary" : "border-b border-border"}
                    hover:bg-primary/10 transition-colors
                  `}
                >
                  {cell || ""}
                </button>
              ))
            )}
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <Button
                key={num}
                onClick={() => handleNumberClick(num)}
                variant="outline"
                size="lg"
                disabled={!selected}
              >
                {num}
              </Button>
            ))}
            <Button
              onClick={() => handleNumberClick(0)}
              variant="outline"
              size="lg"
              disabled={!selected}
            >
              Clear
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
