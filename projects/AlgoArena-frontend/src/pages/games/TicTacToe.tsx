import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Home, RotateCcw } from "lucide-react";
import { usePeraWallet } from "@/hooks/usePeraWallet";
import { useToast } from "@/hooks/use-toast";
import { claimReward } from "@/utils/algoReward";

type Player = 'X' | 'O' | null;

const TicTacToe = () => {
  const navigate = useNavigate();
  const { accountAddress } = usePeraWallet();
  const { toast } = useToast();
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<Player | 'Draw'>(null);
  const [score, setScore] = useState(0);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
  ];

  const checkWinner = (currentBoard: Player[]) => {
    for (const combo of winningCombinations) {
      const [a, b, c] = combo;
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return currentBoard[a];
      }
    }
    if (currentBoard.every(cell => cell !== null)) {
      return 'Draw';
    }
    return null;
  };

  const handleClick = (index: number) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const gameWinner = checkWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
      if (gameWinner === 'X') {
        const points = 100;
        setScore(prev => prev + points);
      }
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
      
      // AI move
      if (currentPlayer === 'X') {
        setTimeout(() => makeAIMove(newBoard), 500);
      }
    }
  };

  const makeAIMove = (currentBoard: Player[]) => {
    const emptyIndices = currentBoard
      .map((cell, idx) => cell === null ? idx : null)
      .filter(idx => idx !== null) as number[];
    
    if (emptyIndices.length > 0) {
      const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      const newBoard = [...currentBoard];
      newBoard[randomIndex] = 'O';
      setBoard(newBoard);

      const gameWinner = checkWinner(newBoard);
      if (gameWinner) {
        setWinner(gameWinner);
      } else {
        setCurrentPlayer('X');
      }
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
  };

  useEffect(() => {
    if (winner === 'X' && !rewardClaimed && accountAddress) {
      const rewardAmount = 6;
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
  }, [winner, accountAddress, rewardClaimed, toast]);

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
              Tic Tac Toe
            </h1>
            <p className="text-muted-foreground">Score: {score}</p>
          </div>
          <Button variant="outline" onClick={resetGame}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        <Card className="p-8 glass-effect">
          <div className="text-center mb-6">
            {!winner && (
              <p className="text-xl">Current Player: <span className="font-bold text-primary">{currentPlayer}</span></p>
            )}
            {winner && winner !== 'Draw' && (
              <div className="space-y-2">
                <p className="text-2xl font-bold text-primary">
                  {winner === 'X' ? '🎉 You Won!' : 'AI Won!'}
                </p>
                {winner === 'X' && (
                  <p className="text-lg text-secondary">+10 ALGO Reward!</p>
                )}
              </div>
            )}
            {winner === 'Draw' && (
              <p className="text-2xl font-bold text-muted-foreground">It's a Draw!</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
            {board.map((cell, index) => (
              <button
                key={index}
                onClick={() => handleClick(index)}
                className={`aspect-square text-5xl font-bold rounded-lg transition-all ${
                  cell 
                    ? 'bg-primary/20 cursor-not-allowed' 
                    : 'bg-card hover:bg-primary/10 cursor-pointer'
                } ${cell === 'X' ? 'text-primary' : 'text-secondary'}`}
                disabled={!!cell || !!winner}
              >
                {cell}
              </button>
            ))}
          </div>

          {winner && (
            <div className="mt-6 text-center">
              <Button onClick={resetGame} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Play Again
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TicTacToe;
