import { GameCard } from "./GameCard";
import { ChallengeModal } from "./ChallengeModal";
import triviaIcon from "@/assets/trivia-icon.jpg";
import racingIcon from "@/assets/racing-icon.jpg";
import cardsIcon from "@/assets/cards-icon.jpg";
import poolIcon from "@/assets/pool-icon.jpg";
import numberSlideIcon from "@/assets/2048-icon.jpg";
import waterSortIcon from "@/assets/water-sort-icon.jpg";
import rouletteIcon from "@/assets/roulette-icon.jpg";
import ticTacToeIcon from "@/assets/tictactoe-icon.jpg";
import minesIcon from "@/assets/mines-icon.jpg";
import slotMachineIcon from "@/assets/slot-machine-icon.jpg";
import { useState } from "react";

export const Games = () => {
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"all" | "easy" | "medium" | "hard">("all");

  const handleChallengeFriend = (gameName: string) => {
    setSelectedGame(gameName);
    setChallengeModalOpen(true);
  };

  const easyGames = [
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
      title: "Water Sort",
      description: "Sort colored water into tubes. Relaxing yet challenging puzzle!",
      image: waterSortIcon,
      players: 445,
      prize: "7",
      entryFee: "1",
      difficulty: "Easy" as const,
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
      title: "Number Slide (2048)",
      description: "Combine tiles to reach 2048. Strategic moves lead to victory!",
      image: numberSlideIcon,
      players: 567,
      prize: "8",
      entryFee: "1.5",
      difficulty: "Easy" as const,
    },
  ];

  const mediumGames = [
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
      title: "Speed Racer",
      description: "Navigate through obstacles at lightning speed. Beat the clock to win!",
      image: racingIcon,
      players: 189,
      prize: "25",
      entryFee: "5",
      difficulty: "Medium" as const,
    },
    {
      title: "Mines",
      description: "Strategic minesweeper with explosive rewards. Clear the board without hitting mines!",
      image: minesIcon,
      players: 345,
      prize: "18",
      entryFee: "3.5",
      difficulty: "Medium" as const,
    },
  ];

  const hardGames = [
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
      title: "Roulette Wheel",
      description: "Spin the wheel and bet on your lucky numbers. Classic casino action!",
      image: rouletteIcon,
      players: 521,
      prize: "35",
      entryFee: "7",
      difficulty: "Hard" as const,
    },
    {
      title: "Slot Machine",
      description: "Realistic casino slots with three spins. Match three symbols to hit the jackpot!",
      image: slotMachineIcon,
      players: 678,
      prize: "50",
      entryFee: "10",
      difficulty: "Hard" as const,
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

          {/* Difficulty Filters */}
          <div className="flex justify-center gap-4 mb-12 flex-wrap">
            <button
              onClick={() => setSelectedDifficulty("all")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedDifficulty === "all"
                  ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                  : 'bg-card text-muted-foreground hover:bg-card/80'
              }`}
            >
              All Games
            </button>
            <button
              onClick={() => setSelectedDifficulty("easy")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedDifficulty === "easy"
                  ? 'bg-green-500 text-white shadow-lg scale-105'
                  : 'bg-card text-muted-foreground hover:bg-card/80'
              }`}
            >
              Easy
            </button>
            <button
              onClick={() => setSelectedDifficulty("medium")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedDifficulty === "medium"
                  ? 'bg-yellow-500 text-white shadow-lg scale-105'
                  : 'bg-card text-muted-foreground hover:bg-card/80'
              }`}
            >
              Medium
            </button>
            <button
              onClick={() => setSelectedDifficulty("hard")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedDifficulty === "hard"
                  ? 'bg-red-500 text-white shadow-lg scale-105'
                  : 'bg-card text-muted-foreground hover:bg-card/80'
              }`}
            >
              Hard
            </button>
          </div>

          {/* Easy Games Section */}
          {(selectedDifficulty === "all" || selectedDifficulty === "easy") && (
            <div className="mb-16 animate-fade-in">
              <h3 className="text-2xl md:text-3xl font-semibold mb-8 text-center">
                <span className="text-green-500">Easy</span> Games
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {easyGames.map((game, index) => (
                  <div key={index} className="animate-scale-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <GameCard {...game} onChallengeFriend={() => handleChallengeFriend(game.title)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medium Games Section */}
          {(selectedDifficulty === "all" || selectedDifficulty === "medium") && (
            <div className="mb-16 animate-fade-in">
              <h3 className="text-2xl md:text-3xl font-semibold mb-8 text-center">
                <span className="text-yellow-500">Medium</span> Games
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {mediumGames.map((game, index) => (
                  <div key={index} className="animate-scale-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <GameCard {...game} onChallengeFriend={() => handleChallengeFriend(game.title)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hard Games Section */}
          {(selectedDifficulty === "all" || selectedDifficulty === "hard") && (
            <div className="animate-fade-in">
              <h3 className="text-2xl md:text-3xl font-semibold mb-8 text-center">
                <span className="text-red-500">Hard</span> Games
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {hardGames.map((game, index) => (
                  <div key={index} className="animate-scale-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <GameCard {...game} onChallengeFriend={() => handleChallengeFriend(game.title)} />
                  </div>
                ))}
              </div>
            </div>
          )}
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
