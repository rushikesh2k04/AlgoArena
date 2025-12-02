import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trophy, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePeraWallet } from "@/hooks/usePeraWallet";
import { claimReward } from "@/utils/algoReward";
import { mintGameNFT, transferNFT } from "@/utils/nftReward";
import { recordGameSession } from "@/utils/gameSession";
import slotMachineIcon from "@/assets/slot-machine-icon.jpg";

const SYMBOLS = ["🍒", "🍋", "🍊", "🔔", "💎", "7️⃣"];
const SPINS_PER_GAME = 3;
const JACKPOT_REWARD = 50;

export default function SlotMachine() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { accountAddress, optInToAsset } = usePeraWallet();
  const [reels, setReels] = useState([SYMBOLS[0], SYMBOLS[0], SYMBOLS[0]]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinsLeft, setSpinsLeft] = useState(SPINS_PER_GAME);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [score, setScore] = useState(0);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [nftAssetId, setNftAssetId] = useState<number | null>(null);
  const [showOptInPrompt, setShowOptInPrompt] = useState(false);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setWon(false);
    setSpinsLeft(SPINS_PER_GAME);
    setScore(0);
    setRewardClaimed(false);
    setReels([SYMBOLS[0], SYMBOLS[0], SYMBOLS[0]]);
  };

  const spin = () => {
    if (isSpinning || spinsLeft <= 0) return;

    setIsSpinning(true);
    
    // Animate spinning
    const spinInterval = setInterval(() => {
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ]);
    }, 100);

    // Stop after 2 seconds
    setTimeout(() => {
      clearInterval(spinInterval);
      
      // Final result
      const finalReels = [
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ];
      
      setReels(finalReels);
      setIsSpinning(false);
      
      // Check for win
      if (finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2]) {
        setWon(true);
        setGameOver(true);
        setGameStarted(false);
        const winScore = SYMBOLS.indexOf(finalReels[0]) * 100 + 300;
        setScore(winScore);
        toast({
          title: "JACKPOT! 🎰",
          description: `Three ${finalReels[0]} in a row! You won ${JACKPOT_REWARD} ALGO!`,
        });
      } else {
        const newSpinsLeft = spinsLeft - 1;
        setSpinsLeft(newSpinsLeft);
        
        // Check for partial matches
        if (finalReels[0] === finalReels[1] || finalReels[1] === finalReels[2] || finalReels[0] === finalReels[2]) {
          const partialScore = 50;
          setScore((prev) => prev + partialScore);
          toast({
            title: "Partial Match!",
            description: `Two matching symbols! +${partialScore} points`,
          });
        }
        
        if (newSpinsLeft === 0) {
          setGameOver(true);
          setGameStarted(false);
          toast({
            title: "Game Over",
            description: "No more spins left. Try again!",
          });
        }
      }
    }, 2000);
  };

  useEffect(() => {
    if (gameOver && won && !rewardClaimed && accountAddress) {
      const rewardAmount = JACKPOT_REWARD;
      claimReward(accountAddress, rewardAmount).then((success) => {
        if (success) {
          setRewardClaimed(true);
          toast({
            title: "Jackpot Claimed!",
            description: `${rewardAmount} ALGO has been credited to your wallet!`,
          });
        } else {
          toast({
            title: "Reward Claim Failed",
            description: "Please try again or check your wallet connection.",
            variant: "destructive",
          });
        }
      });

      // Mint NFT achievement
      const matchId = `slotmachine-${Date.now()}`;
      const difficulty = "hard";
      mintGameNFT(
        accountAddress,
        "Slot Machine",
        score,
        slotMachineIcon,
        matchId,
        difficulty
      ).then((result) => {
        if (result.success && result.assetId) {
          setNftAssetId(result.assetId);
          setShowOptInPrompt(true);
          toast({
            title: "NFT Achievement Created!",
            description:
              "Your game achievement NFT has been created. Please opt-in to receive it.",
          });

          recordGameSession({
            playerWalletAddress: accountAddress,
            gameName: "Slot Machine",
            score: score,
            rewardAmount: rewardAmount,
            nftAssetId: result.assetId,
            difficulty: difficulty,
          });
        } else {
          recordGameSession({
            playerWalletAddress: accountAddress,
            gameName: "Slot Machine",
            score: score,
            rewardAmount: rewardAmount,
            difficulty: difficulty,
          });
        }
      });
    }
  }, [gameOver, won, accountAddress, rewardClaimed, toast, score]);

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

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Button variant="outline" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>

        <Card className="p-8 bg-gradient-to-br from-card via-card to-primary/5">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-primary" />
              Slot Machine
            </h1>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="text-xl font-bold">Score: {score}</span>
              </div>
              {gameStarted && (
                <span className="text-sm text-muted-foreground">
                  Spins Left: {spinsLeft}
                </span>
              )}
            </div>
          </div>

          {!gameStarted && !gameOver && (
            <div className="text-center py-12">
              <div className="text-6xl mb-6">🎰</div>
              <p className="mb-4 text-muted-foreground">
                Match three symbols to win the jackpot!
              </p>
              <p className="mb-6 text-sm text-muted-foreground">
                You have {SPINS_PER_GAME} spins per game
              </p>
              <Button onClick={startGame} size="lg" className="bg-primary">
                <Sparkles className="w-5 h-5 mr-2" />
                Start Game
              </Button>
            </div>
          )}

          {gameOver && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-3xl font-bold mb-4">
                {won ? "JACKPOT! 🎰" : "Game Over"}
              </h2>
              <p className="text-xl mb-2">Final Score: {score}</p>
              <p className="text-muted-foreground mb-6">
                {won
                  ? `You won ${JACKPOT_REWARD} ALGO + NFT Achievement!`
                  : "Better luck next time!"}
              </p>
              {showOptInPrompt && nftAssetId && (
                <Card className="p-4 bg-primary/10 border-primary/20 mb-4">
                  <p className="text-sm mb-3">
                    🏆 Your achievement NFT is ready! Opt-in to receive it in your wallet.
                  </p>
                  <Button onClick={handleOptInAndReceiveNFT} variant="default" size="sm">
                    Opt-in & Receive NFT
                  </Button>
                </Card>
              )}
              <div className="flex gap-4 justify-center">
                <Button onClick={startGame}>Play Again</Button>
                <Button variant="outline" onClick={() => navigate("/")}>
                  Return to Games
                </Button>
              </div>
            </div>
          )}

          {gameStarted && (
            <div className="space-y-8">
              {/* Slot Machine Display */}
              <div className="relative">
                <div className="bg-gradient-to-b from-primary/20 to-primary/5 rounded-2xl p-8 border-4 border-primary/30 shadow-2xl">
                  <div className="flex justify-center gap-4 mb-8">
                    {reels.map((symbol, index) => (
                      <div
                        key={index}
                        className={`w-24 h-24 flex items-center justify-center text-6xl bg-card rounded-xl border-4 border-border shadow-lg transition-transform ${
                          isSpinning ? "animate-bounce" : ""
                        }`}
                      >
                        {symbol}
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-center">
                    <Button
                      onClick={spin}
                      disabled={isSpinning || spinsLeft <= 0}
                      size="lg"
                      className="w-full max-w-xs bg-gradient-to-r from-primary to-primary/80 text-lg font-bold"
                    >
                      {isSpinning ? (
                        "SPINNING..."
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          SPIN ({spinsLeft} left)
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Prize Table */}
              <Card className="p-4 bg-muted/50">
                <h3 className="font-bold mb-3 text-center">Prize Table</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span>7️⃣ 7️⃣ 7️⃣</span>
                    <span className="font-bold text-primary">50 ALGO + NFT</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>💎 💎 💎</span>
                    <span className="font-bold text-primary">50 ALGO + NFT</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Any three matching</span>
                    <span className="font-bold text-primary">50 ALGO + NFT</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Two matching</span>
                    <span>+50 points</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
