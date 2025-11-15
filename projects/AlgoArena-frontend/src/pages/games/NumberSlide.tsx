import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trophy, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePeraWallet } from "@/hooks/usePeraWallet";
import { claimReward } from "@/utils/algoReward";

type Board = (number | null)[][];

const initBoard = (): Board => {
  const board: Board = Array(4).fill(null).map(() => Array(4).fill(null));
  addNewTile(board);
  addNewTile(board);
  return board;
};

const addNewTile = (board: Board) => {
  const empty: [number, number][] = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (board[i][j] === null) empty.push([i, j]);
    }
  }
  if (empty.length > 0) {
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
  }
};

export default function NumberSlide() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { accountAddress } = usePeraWallet();
  const [board, setBoard] = useState<Board>(initBoard());
  const [score, setScore] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const move = (direction: "up" | "down" | "left" | "right") => {
    const newBoard: Board = board.map(row => [...row]);
    let moved = false;
    let newScore = score;

    const moveLine = (line: (number | null)[]) => {
      const filtered = line.filter(x => x !== null);
      for (let i = 0; i < filtered.length - 1; i++) {
        if (filtered[i] === filtered[i + 1]) {
          filtered[i] = (filtered[i] as number) * 2;
          newScore += filtered[i] as number;
          if (filtered[i] === 2048) setGameWon(true);
          filtered.splice(i + 1, 1);
        }
      }
      while (filtered.length < 4) filtered.push(null);
      return filtered;
    };

    if (direction === "left") {
      for (let i = 0; i < 4; i++) {
        const newLine = moveLine(newBoard[i]);
        if (JSON.stringify(newLine) !== JSON.stringify(newBoard[i])) moved = true;
        newBoard[i] = newLine;
      }
    } else if (direction === "right") {
      for (let i = 0; i < 4; i++) {
        const reversed = [...newBoard[i]].reverse();
        const newLine = moveLine(reversed).reverse();
        if (JSON.stringify(newLine) !== JSON.stringify(newBoard[i])) moved = true;
        newBoard[i] = newLine;
      }
    } else if (direction === "up") {
      for (let j = 0; j < 4; j++) {
        const col = newBoard.map(row => row[j]);
        const newCol = moveLine(col);
        if (JSON.stringify(newCol) !== JSON.stringify(col)) moved = true;
        for (let i = 0; i < 4; i++) newBoard[i][j] = newCol[i];
      }
    } else if (direction === "down") {
      for (let j = 0; j < 4; j++) {
        const col = newBoard.map(row => row[j]).reverse();
        const newCol = moveLine(col).reverse();
        const oldCol = newBoard.map(row => row[j]);
        if (JSON.stringify(newCol) !== JSON.stringify(oldCol)) moved = true;
        for (let i = 0; i < 4; i++) newBoard[i][j] = newCol[i];
      }
    }

    if (moved) {
      addNewTile(newBoard);
      setBoard(newBoard);
      setScore(newScore);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") move("left");
    else if (e.key === "ArrowRight") move("right");
    else if (e.key === "ArrowUp") move("up");
    else if (e.key === "ArrowDown") move("down");
  };

  const resetGame = () => {
    setBoard(initBoard());
    setScore(0);
    setGameWon(false);
    setRewardClaimed(false);
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

  const getTileColor = (value: number | null) => {
    if (!value) return "bg-muted";
    const colors: { [key: number]: string } = {
      2: "bg-yellow-200 text-gray-800",
      4: "bg-yellow-300 text-gray-800",
      8: "bg-orange-400 text-white",
      16: "bg-orange-500 text-white",
      32: "bg-red-500 text-white",
      64: "bg-red-600 text-white",
      128: "bg-yellow-500 text-white",
      256: "bg-yellow-600 text-white",
      512: "bg-yellow-700 text-white",
      1024: "bg-yellow-800 text-white",
      2048: "bg-yellow-900 text-white",
    };
    return colors[value] || "bg-primary text-white";
  };

  return (
    <div className="min-h-screen bg-background py-8" onKeyDown={handleKeyPress} tabIndex={0}>
      <div className="container mx-auto px-4 max-w-2xl">
        <Button variant="outline" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>

        <Card className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">2048</h1>
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

          {gameWon && (
            <div className="mb-4 p-4 bg-primary/20 rounded-lg text-center">
              <p className="text-xl font-bold text-primary">You Won 10 ALGO! 🎉</p>
            </div>
          )}

          <div className="mb-6 text-center text-muted-foreground">
            Use arrow keys or buttons to play
          </div>

          <div className="grid grid-cols-4 gap-2 mb-6 bg-muted p-2 rounded-lg">
            {board.map((row, i) =>
              row.map((cell, j) => (
                <div
                  key={`${i}-${j}`}
                  className={`aspect-square flex items-center justify-center rounded-lg font-bold text-2xl ${getTileColor(cell)}`}
                >
                  {cell}
                </div>
              ))
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div></div>
            <Button onClick={() => move("up")} variant="outline">↑</Button>
            <div></div>
            <Button onClick={() => move("left")} variant="outline">←</Button>
            <div></div>
            <Button onClick={() => move("right")} variant="outline">→</Button>
            <div></div>
            <Button onClick={() => move("down")} variant="outline">↓</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
