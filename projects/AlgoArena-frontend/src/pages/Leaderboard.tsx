import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Award, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Player {
  id: string;
  player_id: string;
  name: string;
  wallet_address: string;
  total_score: number;
  games_played: number;
  games_won: number;
  total_rewards_earned: number;
  nfts_earned: number;
}

const PLAYERS_PER_PAGE = 10;

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPlayers, setTotalPlayers] = useState(0);

  useEffect(() => {
    fetchPlayers();
    fetchTotalCount();
  }, [currentPage]);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const from = (currentPage - 1) * PLAYERS_PER_PAGE;
      const to = from + PLAYERS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('total_score', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalCount = async () => {
    try {
      const { count, error } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      setTotalPlayers(count || 0);
    } catch (error) {
      console.error('Error fetching player count:', error);
    }
  };

  const totalPages = Math.ceil(totalPlayers / PLAYERS_PER_PAGE);
  const globalRankOffset = (currentPage - 1) * PLAYERS_PER_PAGE;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
    if (rank === 2) return "bg-gray-400/20 text-gray-400 border-gray-400/50";
    if (rank === 3) return "bg-amber-600/20 text-amber-600 border-amber-600/50";
    return "bg-card border-border";
  };

  if (loading && players.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-24 text-center">
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-primary bg-clip-text text-transparent">Global Leaderboard</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Top players competing for glory and rewards
            </p>
          </div>

          <Card className="glass-effect border-primary/20 max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Rankings</CardTitle>
                  <CardDescription>
                    Showing {globalRankOffset + 1}-{Math.min(globalRankOffset + PLAYERS_PER_PAGE, totalPlayers)} of {totalPlayers} players
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  Page {currentPage} of {totalPages}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {players.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No players yet. Be the first to compete!
                </p>
              ) : (
                <div className="space-y-3">
                  {players.map((player, index) => {
                    const globalRank = globalRankOffset + index + 1;
                    return (
                      <div
                        key={player.id}
                        className={`flex items-center gap-4 p-4 rounded-lg transition-all hover:scale-[1.02] ${getRankBadge(globalRank)} border-2`}
                      >
                        <div className="flex items-center justify-center w-12">
                          {getRankIcon(globalRank)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg truncate">{player.name}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {player.player_id}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>Games: {player.games_played}</span>
                            <span>•</span>
                            <span>NFTs: {player.nfts_earned}</span>
                            <span>•</span>
                            <span>Rewards: {Number(player.total_rewards_earned).toFixed(2)} ALGO</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-primary" />
                            <span className="text-2xl font-bold text-primary">
                              {player.total_score.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">Total Score</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || loading}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          disabled={loading}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || loading}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LeaderboardPage;
