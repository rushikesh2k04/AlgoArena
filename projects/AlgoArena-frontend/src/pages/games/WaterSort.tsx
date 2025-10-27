import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trophy, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePeraWallet } from "@/hooks/usePeraWallet";
import { claimReward } from "@/utils/algoReward";

type Tube = string[];

const initGame = (): Tube[] => {
  return [
    ["red", "blue", "green", "yellow"],
    ["blue", "red", "yellow", "green"],
    ["green", "yellow", "red", "blue"],
    ["yellow", "green", "blue", "red"],
    [],
    [],
  ];
};

export default function WaterSort() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { accountAddress } = usePeraWallet();
  const [tubes, setTubes] = useState<Tube[]>(initGame());
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const checkWin = (currentTubes: Tube[]) => {
    for (const tube of currentTubes) {
      if (tube.length === 0) continue;
      if (tube.length !== 4) return false;
      if (!tube.every(c => c === tube[0])) return false;
    }
    return true;
  };

  const handleTubeClick = (index: number) => {
    if (selected === null) {
      if (tubes[index].length > 0) {
        setSelected(index);
      }
    } else {
      if (selected === index) {
        setSelected(null);
        return;
      }

      const fromTube = tubes[selected];
      const toTube = tubes[index];

      if (fromTube.length === 0) {
        setSelected(null);
        return;
      }

      if (toTube.length === 4) {
        toast({ title: "Tube is full!", variant: "destructive" });
        setSelected(null);
        return;
      }

      const topColor = fromTube[fromTube.length - 1];
      if (toTube.length > 0 && toTube[toTube.length - 1] !== topColor) {
        toast({ title: "Colors don't match!", variant: "destructive" });
        setSelected(null);
        return;
      }

      const newTubes = tubes.map(t => [...t]);
      newTubes[index].push(newTubes[selected].pop()!);
      setTubes(newTubes);
      setSelected(null);
      setMoves(moves + 1);

      if (checkWin(newTubes)) {
        setGameWon(true);
        toast({
          title: "Puzzle Solved!",
          description: `You won 7 ALGO in ${moves + 1} moves!`,
        });
      }
    }
  };

  const resetGame = () => {
    setTubes(initGame());
    setSelected(null);
    setMoves(0);
    setGameWon(false);
    setRewardClaimed(false);
  };

  useEffect(() => {
    if (gameWon && !rewardClaimed && accountAddress) {
      const rewardAmount = 7;
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

  const colorMap: { [key: string]: string } = {
    red: "#EF4444",
    blue: "#3B82F6",
    green: "#10B981",
    yellow: "#F59E0B",
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Button variant="outline" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>

        <Card className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Water Sort</h1>
            <div className="flex items-center gap-4">
              <span className="text-lg">Moves: {moves}</span>
              <Button variant="outline" size="icon" onClick={resetGame}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {gameWon && (
            <div className="mb-6 p-4 bg-primary/20 rounded-lg text-center">
              <Trophy className="w-12 h-12 mx-auto mb-2 text-primary" />
              <p className="text-xl font-bold text-primary">
                You Won 10 ALGO in {moves} moves! 🎉
              </p>
            </div>
          )}

          <div className="mb-6 text-center text-muted-foreground">
            Click a tube to select, then click another to pour
          </div>

          <div className="grid grid-cols-6 gap-4">
            {tubes.map((tube, index) => (
              <button
                key={index}
                onClick={() => handleTubeClick(index)}
                className={`relative h-64 rounded-2xl border-4 transition-all
                  ${selected === index ? "border-primary scale-105" : "border-muted"}
                  hover:scale-105 bg-muted/20
                `}
              >
                <div className="absolute bottom-0 left-0 right-0 flex flex-col-reverse p-2 gap-1">
                  {tube.map((color, i) => (
                    <div
                      key={i}
                      className="h-12 rounded-lg transition-all"
                      style={{ backgroundColor: colorMap[color] }}
                    />
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
