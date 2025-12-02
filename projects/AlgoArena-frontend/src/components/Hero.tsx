import { Button } from "@/components/ui/button";
import { Play, Trophy } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url(${heroBanner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />

      {/* Animated orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-slide-in">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Play. Earn. Dominate.
            <span
    className="block bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent mt-4"
    style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.5)' }}
  >
    The Web3 Gaming Arena
  </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Compete in exciting mini-games, earn ALGO tokens instantly, and dominate the Algorand blockchain.
            Your skills matter, your rewards are real.
          </p>

          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Button size="lg" className="gap-2 text-lg px-8 shadow-glow hover:scale-105 transition-transform">
              <Play className="w-5 h-5" />
              Start Playing
            </Button>
            <Button size="lg" variant="outline" className="gap-2 text-lg px-8 hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5" />
              View Leaderboard
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
            <div className="space-y-2 glass-effect p-4 rounded-lg hover:scale-105 transition-transform">
              <div className="text-3xl font-bold text-primary">12+</div>
              <div className="text-sm text-muted-foreground">Mini Games</div>
            </div>
            <div className="space-y-2 glass-effect p-4 rounded-lg hover:scale-105 transition-transform">
              <div className="text-3xl font-bold text-secondary">5K+</div>
              <div className="text-sm text-muted-foreground">Active Players</div>
            </div>
            <div className="space-y-2 glass-effect p-4 rounded-lg hover:scale-105 transition-transform">
              <div className="text-3xl font-bold text-primary">1M+</div>
              <div className="text-sm text-muted-foreground">ALGO Distributed</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
