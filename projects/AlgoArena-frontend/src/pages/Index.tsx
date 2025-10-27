import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Games } from "@/components/Games";
import { Stats } from "@/components/Stats";
import { Friends } from "@/components/Friends";
import { Leaderboard } from "@/components/Leaderboard";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Stats />
      <Games />
      <Friends />
      <Leaderboard />
      <Footer />
    </div>
  );
};

export default Index;
