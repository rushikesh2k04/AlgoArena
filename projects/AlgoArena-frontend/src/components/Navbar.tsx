import { Button } from "@/components/ui/button";
import { Wallet, LogOut, Gamepad2, Users } from "lucide-react";
import { usePeraWallet } from "@/hooks/usePeraWallet";

export const Navbar = () => {
  const { accountAddress, balance, connectWallet, disconnectWallet, isConnected } = usePeraWallet();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
  <Gamepad2 className="w-8 h-8 text-primary drop-shadow-lg" />
  <span className="text-2xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent mt-2 drop-shadow-lg">
    AlgoArena
  </span>
</div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#games" className="text-foreground hover:text-primary transition-colors">
              Games
            </a>
            <a href="#friends" className="text-foreground hover:text-primary transition-colors flex items-center gap-2">
              <Users className="w-4 h-4" />
              Friends
            </a>
            <a href="#leaderboard" className="text-foreground hover:text-primary transition-colors">
              Leaderboard
            </a>
          </div>

          {isConnected ? (
            <div className="flex items-center gap-4">
              <div className="glass-effect px-4 py-2 rounded-lg">
                <p className="text-xs text-muted-foreground">Balance</p>
                <p className="font-bold text-primary">{balance.toFixed(2)} ALGO</p>
              </div>
              <Button variant="outline" onClick={disconnectWallet} className="gap-2">
                <LogOut className="w-4 h-4" />
                {accountAddress?.slice(0, 6)}...{accountAddress?.slice(-4)}
              </Button>
            </div>
          ) : (
            <Button variant="default" onClick={connectWallet} className="gap-2">
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};
