import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trophy, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePeraWallet } from "@/hooks/usePeraWallet";
import { claimReward } from "@/utils/algoReward";

const questions = [
  {
    question: "What consensus mechanism does Algorand use?",
    options: ["Proof of Work", "Pure Proof of Stake", "Delegated PoS", "Proof of Authority"],
    correct: 1,
  },
  {
    question: "What is the average block time on Algorand?",
    options: ["10 minutes", "4.5 seconds", "15 seconds", "1 minute"],
    correct: 1,
  },
  {
    question: "Who created Algorand?",
    options: ["Vitalik Buterin", "Silvio Micali", "Charles Hoskinson", "Gavin Wood"],
    correct: 1,
  },
  {
    question: "What is the native token of Algorand?",
    options: ["USDC", "ETH", "ALGO", "ADA"],
    correct: 2,
  },
  {
    question: "What is the maximum supply of ALGO tokens?",
    options: ["10 billion", "21 million", "100 million", "Unlimited"],
    correct: 0,
  },
  {
    question: "What programming language is primarily used for Algorand smart contracts?",
    options: ["Solidity", "Python", "PyTeal", "Rust"],
    correct: 2,
  },
  {
    question: "What does ASA stand for in Algorand?",
    options: ["Algorand Smart Asset", "Automated Staking Algorithm", "Advanced Security Algorithm", "Asset Standard Agreement"],
    correct: 0,
  },
  {
    question: "What is the typical transaction fee on Algorand?",
    options: ["$10", "$1", "0.001 ALGO", "Free"],
    correct: 2,
  },
];

export default function TriviaChallenge() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { accountAddress } = usePeraWallet();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameOver, setGameOver] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  useEffect(() => {
    if (gameOver && score >= 300 && !rewardClaimed && accountAddress) {
      const rewardAmount = 10;
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
  }, [gameOver, score, accountAddress, rewardClaimed, toast]);

  useEffect(() => {
    if (timeLeft > 0 && !gameOver) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !gameOver) {
      handleGameOver();
    }
  }, [timeLeft, gameOver]);

  const handleAnswer = (index: number) => {
    setSelectedAnswer(index);
    const isCorrect = index === questions[currentQuestion].correct;
    
    if (isCorrect) {
      setScore(score + 100);
      toast({ title: "Correct! +100 points" });
    } else {
      toast({ title: "Wrong answer!", variant: "destructive" });
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setTimeLeft(30);
      } else {
        handleGameOver();
      }
    }, 1000);
  };

  const handleGameOver = () => {
    setGameOver(true);
    const won = score >= 300;
    toast({
      title: won ? "You Won!" : "Game Over",
      description: won ? `Prize: 10 ALGO + ${score} bonus points!` : `Final Score: ${score}`,
    });
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Button variant="outline" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>

        <Card className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="text-xl font-bold">Score: {score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-primary" />
              <span className="text-xl font-bold">{timeLeft}s</span>
            </div>
          </div>

          {!gameOver ? (
            <>
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-2">
                  Question {currentQuestion + 1} of {questions.length}
                </p>
                <h2 className="text-2xl font-bold mb-6">
                  {questions[currentQuestion].question}
                </h2>
              </div>

              <div className="grid gap-3">
                {questions[currentQuestion].options.map((option, index) => (
                  <Button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={selectedAnswer !== null}
                    variant={
                      selectedAnswer === index
                        ? index === questions[currentQuestion].correct
                          ? "default"
                          : "destructive"
                        : "outline"
                    }
                    className="w-full text-left justify-start h-auto py-4 text-lg"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
              <p className="text-xl mb-2">Final Score: {score}</p>
              <p className="text-muted-foreground mb-6">
                {score >= 300 ? "You won 10 ALGO!" : "Better luck next time!"}
              </p>
              <Button onClick={() => navigate("/")}>Return to Games</Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
