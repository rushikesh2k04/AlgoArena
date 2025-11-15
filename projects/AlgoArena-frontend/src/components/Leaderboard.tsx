import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, Users, Globe, Heart } from "lucide-react";
import { useState } from "react";

export const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState("global");

  const globalLeaders = [
    { rank: 1, name: "AlgoWhale", score: 15420, rewards: "250 ALGO", country: "USA" },
    { rank: 2, name: "CryptoNinja", score: 14890, rewards: "150 ALGO", country: "Japan" },
    { rank: 3, name: "BlockchainKing", score: 13250, rewards: "100 ALGO", country: "UK" },
    { rank: 4, name: "TokenMaster", score: 11780, rewards: "50 ALGO", country: "Canada" },
    { rank: 5, name: "DeFiLegend", score: 10340, rewards: "25 ALGO", country: "Germany" },
  ];

  const friendsLeaders = [
    { rank: 1, name: "CryptoKing", score: 8420, rewards: "80 ALGO", country: "USA" },
    { rank: 2, name: "GameMaster", score: 7890, rewards: "60 ALGO", country: "USA" },
    { rank: 3, name: "PuzzlePro", score: 6250, rewards: "40 ALGO", country: "USA" },
    { rank: 4, name: "SpeedDemon", score: 5780, rewards: "20 ALGO", country: "USA" },
  ];

  const countryLeaders = [
    { rank: 1, name: "StarPlayer", score: 9420, rewards: "120 ALGO", country: "USA" },
    { rank: 2, name: "ProGamer99", score: 8890, rewards: "90 ALGO", country: "USA" },
    { rank: 3, name: "AlgoChamp", score: 7250, rewards: "70 ALGO", country: "USA" },
    { rank: 4, name: "WinStreak", score: 6780, rewards: "45 ALGO", country: "USA" },
    { rank: 5, name: "TopShot", score: 6340, rewards: "30 ALGO", country: "USA" },
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const renderLeaderboard = (leaders: typeof globalLeaders) => (
    <div className="space-y-4">
      {leaders.map((leader, index) => (
        <div
          key={index}
          className={`flex items-center justify-between p-4 rounded-lg transition-all ${
            leader.rank <= 3
              ? "glass-effect border border-primary/30"
              : "bg-card/50 hover:bg-card/80"
          }`}
        >
          <div className="flex items-center gap-4">
            {getRankIcon(leader.rank)}
            <div>
              <h3 className="font-bold">{leader.name}</h3>
              <p className="text-sm text-muted-foreground">{leader.score.toLocaleString()} points</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-primary">{leader.rewards}</p>
            <p className="text-xs text-muted-foreground">earned</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <section id="leaderboard" className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Top <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent">Players</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Compete for the top spot and earn massive rewards
          </p>
        </div>

        <Card className="max-w-4xl mx-auto glass-effect border-primary/20">
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="friends" className="gap-2">
                  <Heart className="w-4 h-4" />
                  Friends
                </TabsTrigger>
                <TabsTrigger value="country" className="gap-2">
                  <Users className="w-4 h-4" />
                  Country
                </TabsTrigger>
                <TabsTrigger value="global" className="gap-2">
                  <Globe className="w-4 h-4" />
                  Global
                </TabsTrigger>
              </TabsList>

              <TabsContent value="friends">
                {renderLeaderboard(friendsLeaders)}
              </TabsContent>

              <TabsContent value="country">
                {renderLeaderboard(countryLeaders)}
              </TabsContent>

              <TabsContent value="global">
                {renderLeaderboard(globalLeaders)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
