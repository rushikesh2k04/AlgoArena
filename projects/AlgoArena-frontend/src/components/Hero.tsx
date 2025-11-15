import { Button } from "@/components/ui/button";
import { Play, Trophy } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url(${heroBanner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-slide-in">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight md:leading-snug">
  Play. Earn. Dominate.
  <span
    className="block bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent mt-4"
    style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.5)' }}
  >
    The Web3 Gaming Arena
  </span>
</h1>


          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Compete in mini-games, win ALGO tokens, and collect exclusive NFTs on Algorand TestNet.
            Your skills matter, your rewards are instant.
          </p>

          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Button size="lg" className="gap-2 text-lg px-8 shadow-glow">
              <Play className="w-5 h-5" />
              Start Playing
            </Button>
            <Button size="lg" variant="outline" className="gap-2 text-lg px-8">
              <Trophy className="w-5 h-5" />
              View Leaderboard
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">12+</div>
              <div className="text-sm text-muted-foreground">Mini Games</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-secondary">5K+</div>
              <div className="text-sm text-muted-foreground">Active Players</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">1M+</div>
              <div className="text-sm text-muted-foreground">ALGO Rewards</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
