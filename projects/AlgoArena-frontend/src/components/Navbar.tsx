import { Button } from "@/components/ui/button";
import { Wallet, LogOut, Gamepad2, Users } from "lucide-react";
import { useMultiWallet } from "@/hooks/useMultiWallet";
import { WalletModal } from "@/components/WalletModal";
import { useState } from "react";

export const Navbar = () => {
  const { accountAddress, balance, connectWallet, disconnectWallet, isConnected } = useMultiWallet();
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const handleWalletSelect = (wallet: 'pera' | 'defly' | 'lute') => {
    connectWallet(wallet);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-border/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 animate-float">
              <Gamepad2 className="w-8 h-8 text-primary drop-shadow-glow" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent mt-2 drop-shadow-lg">
    AlgoArena
  </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#games" className="text-foreground hover:text-primary transition-all hover:scale-105">
                Games
              </a>
              <a href="#friends" className="text-foreground hover:text-primary transition-all hover:scale-105 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Friends
              </a>
              <a href="#leaderboard" className="text-foreground hover:text-primary transition-all hover:scale-105">
                Leaderboard
              </a>
            </div>

            {isConnected ? (
              <div className="flex items-center gap-4">
                <div className="glass-effect px-4 py-2 rounded-lg border border-primary/20">
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="font-bold text-primary">{balance.toFixed(2)} ALGO</p>
                </div>
                <Button variant="outline" onClick={disconnectWallet} className="gap-2 hover:scale-105 transition-transform">
                  <LogOut className="w-4 h-4" />
                  {accountAddress?.slice(0, 6)}...{accountAddress?.slice(-4)}
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                onClick={() => setWalletModalOpen(true)}
                className="gap-2 shadow-glow hover:scale-105 transition-transform"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </nav>

      <WalletModal
        open={walletModalOpen}
        onOpenChange={setWalletModalOpen}
        onWalletSelect={handleWalletSelect}
      />
    </>
  );
};
