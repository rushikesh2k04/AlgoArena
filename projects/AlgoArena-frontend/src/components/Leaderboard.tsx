import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, Users, Globe, Heart, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Player {
  id: string;
  player_id: string;
  name: string;
  total_score: number;
  total_rewards_earned: number;
  wallet_address: string;
}

export const Leaderboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("global");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayers();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('players-leaderboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players'
        },
        () => {
          fetchPlayers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('total_score', { ascending: false })
        .limit(5);

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const renderLeaderboard = () => {
    if (loading) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Loading leaderboard...
        </div>
      );
    }

    if (players.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No players yet. Be the first to play!
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {players.map((player, index) => {
          const rank = index + 1;
          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                rank <= 3
                  ? "glass-effect border border-primary/30"
                  : "bg-card/50 hover:bg-card/80"
              }`}
            >
              <div className="flex items-center gap-4">
                {getRankIcon(rank)}
                <div>
                  <h3 className="font-bold">{player.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {player.total_score.toLocaleString()} points
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">
                  {Number(player.total_rewards_earned).toFixed(2)} ALGO
                </p>
                <p className="text-xs text-muted-foreground">earned</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

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
              <TabsList className="grid w-full grid-cols-1 mb-8">
                <TabsTrigger value="global" className="gap-2">
                  <Globe className="w-4 h-4" />
                  Global Leaderboard
                </TabsTrigger>
              </TabsList>

              <TabsContent value="global">
                {renderLeaderboard()}
                <div className="mt-6 text-center">
                  <Button
                    onClick={() => navigate('/leaderboard')}
                    className="gap-2"
                    size="lg"
                  >
                    View Full Leaderboard
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
