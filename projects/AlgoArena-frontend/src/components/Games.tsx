import { GameCard } from "./GameCard";
import { ChallengeModal } from "./ChallengeModal";
import triviaIcon from "@/assets/trivia-icon.jpg";
import racingIcon from "@/assets/racing-icon.jpg";
import cardsIcon from "@/assets/cards-icon.jpg";
import poolIcon from "@/assets/pool-icon.jpg";
import numberSlideIcon from "@/assets/2048-icon.jpg";
import sudokuIcon from "@/assets/sudoku-icon.jpg";
import waterSortIcon from "@/assets/water-sort-icon.jpg";
import blockPuzzleIcon from "@/assets/block-puzzle-icon.jpg";
import fruitMergeIcon from "@/assets/fruit-merge-icon.jpg";
import ticTacToeIcon from "@/assets/tictactoe-icon.jpg";
import candyCrushIcon from "@/assets/candy-crush-icon.jpg";
import bubbleShooterIcon from "@/assets/bubble-shooter-icon.jpg";
import { useState } from "react";

export const Games = () => {
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState("");

  const handleChallengeFriend = (gameName: string) => {
    setSelectedGame(gameName);
    setChallengeModalOpen(true);
  };

  const games = [
    {
      title: "Trivia Challenge",
      description: "Test your knowledge across multiple categories. Fast answers = bigger rewards!",
      image: triviaIcon,
      players: 324,
      prize: "10",
      entryFee: "2",
      difficulty: "Easy" as const,
    },
    {
      title: "Speed Racer",
      description: "Navigate through obstacles at lightning speed. Beat the clock to win!",
      image: racingIcon,
      players: 189,
      prize: "25",
      entryFee: "5",
      difficulty: "Medium" as const,
    },
    {
      title: "Card Master",
      description: "Strategic card battles with instant rewards. Outsmart your opponents!",
      image: cardsIcon,
      players: 256,
      prize: "50",
      entryFee: "10",
      difficulty: "Hard" as const,
    },
    {
      title: "8 Ball Pool",
      description: "Classic pool game with precision controls. Sink all balls to win!",
      image: poolIcon,
      players: 412,
      prize: "15",
      entryFee: "3",
      difficulty: "Medium" as const,
    },
    {
      title: "Number Slide (2048)",
      description: "Combine tiles to reach 2048. Strategic moves lead to victory!",
      image: numberSlideIcon,
      players: 567,
      prize: "8",
      entryFee: "1.5",
      difficulty: "Easy" as const,
    },
    {
      title: "Sudoku Master",
      description: "Logic puzzle challenge. Complete the grid faster than opponents!",
      image: sudokuIcon,
      players: 298,
      prize: "12",
      entryFee: "2.5",
      difficulty: "Medium" as const,
    },
    {
      title: "Water Sort",
      description: "Sort colored water into tubes. Relaxing yet challenging puzzle!",
      image: waterSortIcon,
      players: 445,
      prize: "7",
      entryFee: "1",
      difficulty: "Easy" as const,
    },
    {
      title: "Block Puzzle",
      description: "Fit blocks perfectly to clear lines. Classic puzzle meets rewards!",
      image: blockPuzzleIcon,
      players: 389,
      prize: "9",
      entryFee: "2",
      difficulty: "Easy" as const,
    },
    {
      title: "Fruit Merge",
      description: "Merge fruits to create bigger ones. Juicy rewards await!",
      image: fruitMergeIcon,
      players: 521,
      prize: "11",
      entryFee: "2",
      difficulty: "Medium" as const,
    },
    {
      title: "Tic Tac Toe",
      description: "Classic strategy game. Outsmart your opponent with perfect moves!",
      image: ticTacToeIcon,
      players: 678,
      prize: "6",
      entryFee: "1",
      difficulty: "Easy" as const,
    },
    {
      title: "Candy Crush",
      description: "Match colorful candies through multiple levels. Sweet rewards await!",
      image: candyCrushIcon,
      players: 892,
      prize: "20",
      entryFee: "4",
      difficulty: "Medium" as const,
    },
    {
      title: "Bubble Shooter",
      description: "Pop colorful bubbles to clear the board. Aim carefully to win!",
      image: bubbleShooterIcon,
      players: 734,
      prize: "8",
      entryFee: "1.5",
      difficulty: "Easy" as const,
    },
  ];

  return (
    <>
      <section id="games" className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">
              Featured <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent">Games</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose your game, connect your wallet, and start earning ALGO tokens instantly
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {games.map((game, index) => (
              <div key={index} className="animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <GameCard {...game} onChallengeFriend={() => handleChallengeFriend(game.title)} />
              </div>
            ))}
          </div>
        </div>
      </section>
      
      <ChallengeModal 
        open={challengeModalOpen}
        onOpenChange={setChallengeModalOpen}
        gameName={selectedGame}
      />
    </>
  );
};
