import { Card } from "@/components/ui/card";
import { Wallet, Zap, Shield, Coins } from "lucide-react";

export const Stats = () => {
  const features = [
    {
      icon: Wallet,
      title: "Pera Wallet Integration",
      description: "Seamlessly connect your Algorand wallet and start playing instantly",
    },
    {
      icon: Zap,
      title: "Instant Rewards",
      description: "Win ALGO tokens automatically through smart contract distribution",
    },
    {
      icon: Shield,
      title: "Secure & Fair",
      description: "Blockchain-verified gameplay ensures complete transparency",
    },
    {
      icon: Coins,
      title: "NFT Achievements",
      description: "Collect rare achievement NFTs and showcase your gaming prowess",
    },
  ];

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="p-6 border-border bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all shadow-card hover:shadow-glow group"
              >
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4 shadow-glow group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
