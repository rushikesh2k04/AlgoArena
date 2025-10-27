import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePeraWallet } from "@/hooks/usePeraWallet";
import { claimReward } from "@/utils/algoReward";

const suits = ["♠", "♥", "♦", "♣"];
const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

type CardType = { suit: string; value: string; flipped: boolean; matched: boolean };

const createDeck = (): CardType[] => {
  const deck: CardType[] = [];
  for (let i = 0; i < 8; i++) {
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const value = values[Math.floor(Math.random() * values.length)];
    deck.push(
      { suit, value, flipped: false, matched: false },
      { suit, value, flipped: false, matched: false }
    );
  }
  return deck.sort(() => Math.random() - 0.5);
};

export default function CardMaster() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { accountAddress } = usePeraWallet();
  const [cards, setCards] = useState<CardType[]>(createDeck());
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  useEffect(() => {
    if (flippedIndices.length === 2) {
      const [first, second] = flippedIndices;
      if (
        cards[first].value === cards[second].value &&
        cards[first].suit === cards[second].suit
      ) {
        setTimeout(() => {
          const newCards = [...cards];
          newCards[first].matched = true;
          newCards[second].matched = true;
          setCards(newCards);
          setMatches(matches + 1);
          setFlippedIndices([]);
          
          if (matches + 1 === 8) {
            setGameWon(true);
            toast({
              title: "You Won!",
              description: `Completed in ${moves + 1} moves! Prize: 10 ALGO`,
            });
          }
        }, 500);
      } else {
        setTimeout(() => {
          const newCards = [...cards];
          newCards[first].flipped = false;
          newCards[second].flipped = false;
          setCards(newCards);
          setFlippedIndices([]);
        }, 1000);
      }
      setMoves(moves + 1);
    }
  }, [flippedIndices]);

  const handleCardClick = (index: number) => {
    if (
      flippedIndices.length === 2 ||
      cards[index].flipped ||
      cards[index].matched
    ) {
      return;
    }

    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);
    setFlippedIndices([...flippedIndices, index]);
  };

  const resetGame = () => {
    setCards(createDeck());
    setFlippedIndices([]);
    setMoves(0);
    setMatches(0);
    setGameWon(false);
    setRewardClaimed(false);
  };

  useEffect(() => {
    if (gameWon && !rewardClaimed && accountAddress) {
      const rewardAmount = 50;
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
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button variant="outline" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>

        <Card className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Card Master</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <span>Moves: {moves}</span>
              </div>
              <div>Matches: {matches}/8</div>
            </div>
          </div>

          {gameWon && (
            <div className="mb-6 p-4 bg-primary/20 rounded-lg text-center">
              <p className="text-xl font-bold text-primary">
                You Won 50 ALGO! 🎉
              </p>
              <Button onClick={resetGame} className="mt-4">
                Play Again
              </Button>
            </div>
          )}

          <div className="grid grid-cols-4 gap-4">
            {cards.map((card, index) => (
              <button
                key={index}
                onClick={() => handleCardClick(index)}
                disabled={card.flipped || card.matched}
                className={`aspect-square rounded-lg flex items-center justify-center text-4xl font-bold transition-all ${
                  card.matched
                    ? "bg-green-500/20 cursor-default"
                    : card.flipped
                    ? card.suit === "♥" || card.suit === "♦"
                      ? "bg-red-500 text-white"
                      : "bg-gray-900 text-white"
                    : "bg-primary hover:bg-primary/80"
                }`}
              >
                {card.flipped || card.matched ? (
                  <div className="text-center">
                    <div>{card.value}</div>
                    <div className="text-2xl">{card.suit}</div>
                  </div>
                ) : (
                  "?"
                )}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
