import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Trophy, UserPlus } from "lucide-react";
import { usePeraWallet } from "@/hooks/usePeraWallet";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface GameCardProps {
  title: string;
  description: string;
  image: string;
  players: number;
  prize: string;
  entryFee: string;
  difficulty: "Easy" | "Medium" | "Hard";
  onChallengeFriend?: () => void;
}

export const GameCard = ({
  title,
  description,
  image,
  players,
  prize,
  entryFee,
  difficulty,
  onChallengeFriend,
}: GameCardProps) => {
  const { isConnected, balance, sendGameTransaction } = usePeraWallet();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);

  const getGameRoute = (gameTitle: string) => {
    const routes: { [key: string]: string } = {
      "Trivia Challenge": "/games/trivia",
      "Speed Racer": "/games/speed-racer",
      "Card Master": "/games/card-master",
      "8 Ball Pool": "/games/8ball-pool",
      "Number Slide (2048)": "/games/2048",
      "Sudoku Master": "/games/sudoku",
      "Water Sort": "/games/water-sort",
      "Block Puzzle": "/games/block-puzzle",
      "Color Connect": "/games/color-connect",
      "Tic Tac Toe": "/games/tictactoe",
      "Candy Crush": "/games/candy-crush",
      "Bubble Shooter": "/games/bubble-shooter",
    };
    return routes[gameTitle] || "/";
  };

  const handlePlay = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your Pera Wallet to play",
        variant: "destructive",
      });
      return;
    }

    const fee = parseFloat(entryFee);
    if (balance < fee) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${fee} ALGO to play this game`,
        variant: "destructive",
      });
      return;
    }

    setIsPlaying(true);
    
    toast({
      title: "Transaction Pending",
      description: "Please approve the transaction in Pera Wallet app",
    });

    const success = await sendGameTransaction(fee);
    
    if (success) {
      toast({
        title: "Entering Game",
        description: `Welcome to ${title}!`,
      });
      
      setTimeout(() => {
        setIsPlaying(false);
        navigate(getGameRoute(title));
      }, 1000);
    } else {
      setIsPlaying(false);
    }
  };
  const difficultyColors = {
    Easy: "text-green-400",
    Medium: "text-yellow-400",
    Hard: "text-red-400",
  };

  return (
    <Card className="group overflow-hidden border-border bg-card hover:border-primary/50 transition-all duration-300 shadow-card hover:shadow-glow">
      <div className="relative aspect-square overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-60" />
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold glass-effect ${difficultyColors[difficulty]}`}>
            {difficulty}
          </span>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="flex items-center justify-between text-sm mb-2">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{players} playing</span>
          </div>
          <div className="flex items-center gap-1 text-primary font-bold">
            <Trophy className="w-4 h-4" />
            <span>{prize} ALGO</span>
          </div>
        </div>

        <div className="glass-effect p-2 rounded-lg mb-4">
          <p className="text-xs text-muted-foreground">Entry Fee</p>
          <p className="font-bold text-primary">{entryFee} ALGO</p>
        </div>

        <div className="flex gap-2">
          <Button 
            className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
            onClick={handlePlay}
            disabled={isPlaying}
          >
            {isPlaying ? "Starting..." : "Play Now"}
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={onChallengeFriend}
            title="Challenge a Friend"
          >
            <UserPlus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
