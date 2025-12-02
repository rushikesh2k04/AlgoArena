import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Home, RotateCcw } from "lucide-react";
import { usePeraWallet } from "@/hooks/usePeraWallet";
import { useToast } from "@/hooks/use-toast";
import { claimReward } from "@/utils/algoReward";
import { mintGameNFT, transferNFT } from "@/utils/nftReward";
import { recordGameSession } from "@/utils/gameSession";
import tictactoeIcon from "@/assets/tictactoe-icon.jpg";

type Player = "X" | "O" | null;

const winningCombinations = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // Rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // Columns
  [0, 4, 8],
  [2, 4, 6], // Diagonals
];

const checkWinner = (currentBoard: Player[]): Player | "Draw" | null => {
  for (const combo of winningCombinations) {
    const [a, b, c] = combo;
    if (
      currentBoard[a] &&
      currentBoard[a] === currentBoard[b] &&
      currentBoard[a] === currentBoard[c]
    ) {
      return currentBoard[a];
    }
  }
  if (currentBoard.every((cell) => cell !== null)) {
    return "Draw";
  }
  return null;
};

const TicTacToe = () => {
  const navigate = useNavigate();
  const { accountAddress, optInToAsset } = usePeraWallet();
  const { toast } = useToast();

  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<"X" | "O">("X");
  const [winner, setWinner] = useState<Player | "Draw">(null);
  const [score, setScore] = useState(0); // total ALGO earned (UI)
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [nftAssetId, setNftAssetId] = useState<number | null>(null);
  const [showOptInPrompt, setShowOptInPrompt] = useState(false);

  const handleClick = (index: number) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const gameWinner = checkWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
      if (gameWinner === "X") {
        setScore((prev) => prev + 3);
      } else if (gameWinner === "Draw") {
        setScore((prev) => prev + 1);
      }
    } else {
      setCurrentPlayer(currentPlayer === "X" ? "O" : "X");

      // AI plays as 'O'
      if (currentPlayer === "X") {
        setTimeout(() => makeAIMove(newBoard), 400);
      }
    }
  };

  const makeAIMove = (currentBoard: Player[]) => {
    const emptyIndices = currentBoard
      .map((cell, idx) => (cell === null ? idx : null))
      .filter((idx) => idx !== null) as number[];

    if (emptyIndices.length > 0 && !winner) {
      const randomIndex =
        emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      const newBoard = [...currentBoard];
      newBoard[randomIndex] = "O";
      setBoard(newBoard);

      const gameWinner = checkWinner(newBoard);
      if (gameWinner) {
        setWinner(gameWinner);
        if (gameWinner === "Draw") {
          setScore((prev) => prev + 1);
        }
      } else {
        setCurrentPlayer("X");
      }
    }
  };

  const resetGame = () => {
    // This "New Game" (top-right) just resets board in-place
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setWinner(null);
    setRewardClaimed(false);
    setNftAssetId(null);
    setShowOptInPrompt(false);
  };

  // NEW: play again should send player to home so they can pay again
  const handlePlayAgain = () => {
    navigate("/"); // go back to home page
  };

  // Reward + NFT logic:
  // - User (X) wins: 3 ALGO + NFT
  // - Draw: 1 ALGO + NFT
  // - AI (O) wins: no ALGO, no NFT
  useEffect(() => {
    if (!winner || rewardClaimed || !accountAddress) return;

    let rewardAmount = 0;
    let shouldMintNFT = false;
    let difficulty = "easy";

    if (winner === "X") {
      rewardAmount = 3;
      shouldMintNFT = true;
      difficulty = "win";
    } else if (winner === "Draw") {
      rewardAmount = 1;
      shouldMintNFT = true;
      difficulty = "draw";
    } else if (winner === "O") {
      rewardAmount = 0;
      shouldMintNFT = false;
      difficulty = "lose";
    }

    const gameName = "Tic Tac Toe";

    const handleRewards = async () => {
      if (rewardAmount > 0) {
        const success = await claimReward(accountAddress, rewardAmount);
        if (success) {
          setRewardClaimed(true);
          toast({
            title: "ALGO Reward Claimed!",
            description: `${rewardAmount} ALGO has been credited to your wallet!`,
          });
        } else {
          toast({
            title: "Reward Failed",
            description:
              "We couldn't send your reward. Please check your wallet connection.",
            variant: "destructive",
          });
        }
      }

      if (shouldMintNFT) {
        const matchId = `tictactoe-${Date.now()}`;
        const result = await mintGameNFT(
          accountAddress,
          gameName,
          score,
          tictactoeIcon,
          matchId,
          difficulty
        );

        if (result.success && result.assetId) {
          setNftAssetId(result.assetId);
          setShowOptInPrompt(true);
          toast({
            title: "NFT Achievement Created!",
            description:
              "Your game achievement NFT has been created. Please opt-in to receive it.",
          });

          await recordGameSession({
            playerWalletAddress: accountAddress,
            gameName,
            score,
            rewardAmount,
            nftAssetId: result.assetId,
            difficulty,
          });
        } else {
          await recordGameSession({
            playerWalletAddress: accountAddress,
            gameName,
            score,
            rewardAmount,
            difficulty,
          });
        }
      } else {
        // Lose: just record game
        await recordGameSession({
          playerWalletAddress: accountAddress,
          gameName,
          score,
          rewardAmount,
          difficulty,
        });
      }
    };

    handleRewards();
  }, [winner, accountAddress, rewardClaimed, score, toast]);

  const handleOptInAndReceiveNFT = async () => {
    if (!nftAssetId || !accountAddress) return;

    const optInSuccess = await optInToAsset(nftAssetId);
    if (optInSuccess) {
      const transferSuccess = await transferNFT(accountAddress, nftAssetId);
      if (transferSuccess) {
        setShowOptInPrompt(false);
        toast({
          title: "NFT Received!",
          description: "Your achievement NFT has been transferred to your wallet!",
        });
      }
    }
  };

  const getStatusText = () => {
    if (!winner) {
      return (
        <>
          Current Turn:{" "}
          <span
            className={`font-bold ${
              currentPlayer === "X" ? "text-sky-400" : "text-rose-400"
            }`}
          >
            {currentPlayer}
          </span>
        </>
      );
    }

    if (winner === "X") {
      return (
        <>
          <span className="text-emerald-300 font-semibold">You Won!</span>{" "}
          <span className="text-slate-300 text-sm block">
            +3 ALGO & NFT Achievement
          </span>
        </>
      );
    }

    if (winner === "O") {
      return (
        <>
          <span className="text-rose-400 font-semibold">AI Won!</span>{" "}
          <span className="text-slate-400 text-sm block">
            No reward this time — try again from the home screen.
          </span>
        </>
      );
    }

    if (winner === "Draw") {
      return (
        <>
          <span className="text-amber-300 font-semibold">It&apos;s a draw.</span>{" "}
          <span className="text-slate-300 text-sm block">
            +1 ALGO (entry fee) & NFT Achievement
          </span>
        </>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 text-slate-50 relative overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-32 -left-24 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
      </div>

      <div className="relative container mx-auto max-w-2xl">
        {/* Top bar */}
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="border-slate-700 bg-slate-900/70 hover:bg-slate-800/80"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>

          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 via-emerald-300 to-purple-400 bg-clip-text text-transparent">
              Tic Tac Toe
            </h1>
            <p className="text-xs mt-1 text-slate-400 uppercase tracking-wide">
              Total ALGO earned:{" "}
              <span className="text-sky-300 font-semibold">{score}</span>
            </p>
          </div>

          <Button
            variant="outline"
            onClick={resetGame}
            className="border-slate-700 bg-slate-900/70 hover:bg-slate-800/80"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            New Game
          </Button>
        </div>

        {/* Main card */}
        <Card className="p-6 md:p-8 border-slate-800 bg-slate-900/70 backdrop-blur-xl shadow-[0_0_40px_rgba(56,189,248,0.18)]">
          {/* Status */}
          <div className="text-center mb-6">
            <p className="text-lg">{getStatusText()}</p>
          </div>

          {/* Board */}
          <div className="relative max-w-md mx-auto">
            {/* Subtle board background */}
            <div className="absolute inset-3 rounded-3xl bg-slate-900/80 border border-slate-700/80 shadow-[0_20px_40px_rgba(15,23,42,0.9)] pointer-events-none" />
            <div className="relative grid grid-cols-3 gap-3 p-3">
              {board.map((cell, index) => {
                const isX = cell === "X";
                const isO = cell === "O";

                return (
                  <button
                    key={index}
                    onClick={() => handleClick(index)}
                    disabled={!!cell || !!winner}
                    className={`
                      aspect-square rounded-2xl text-5xl font-bold flex items-center justify-center
                      border
                      transition-all duration-200
                      ${
                        cell
                          ? "cursor-not-allowed"
                          : "cursor-pointer hover:scale-[1.03] hover:shadow-[0_0_18px_rgba(56,189,248,0.35)]"
                      }
                      ${
                        isX
                          ? "bg-sky-500/10 border-sky-400/60 text-sky-300 shadow-[0_0_22px_rgba(56,189,248,0.4)]"
                          : isO
                          ? "bg-rose-500/10 border-rose-400/60 text-rose-300 shadow-[0_0_22px_rgba(248,113,113,0.4)]"
                          : "bg-slate-900/60 border-slate-700/80 text-slate-400"
                      }
                    `}
                  >
                    {cell}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer actions */}
          {winner && (
            <div className="mt-8 flex flex-col items-center gap-4">
              {showOptInPrompt && nftAssetId && (
                <Card className="w-full max-w-md p-4 bg-sky-500/10 border-sky-500/30">
                  <p className="text-sm mb-3 text-slate-100">
                    🏆 Your achievement NFT is ready! Opt-in to receive it in your
                    wallet.
                  </p>
                  <Button
                    onClick={handleOptInAndReceiveNFT}
                    variant="default"
                    size="sm"
                    className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold"
                  >
                    Opt-in & Receive NFT
                  </Button>
                </Card>
              )}
              <Button
                onClick={handlePlayAgain}
                className="gap-2 bg-slate-800 hover:bg-slate-700"
              >
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
