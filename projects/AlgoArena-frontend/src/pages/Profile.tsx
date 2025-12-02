import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useMultiWallet } from "@/hooks/useMultiWallet";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  Wallet, 
  Trophy, 
  Star, 
  Gift, 
  TrendingUp, 
  Edit2, 
  LogOut,
  ArrowLeft,
  Calendar,
  Award
} from "lucide-react";
import { z } from "zod";

const nameSchema = z.object({
  name: z.string()
    .trim()
    .min(3, { message: "Name must be at least 3 characters" })
    .max(30, { message: "Name must be less than 30 characters" })
    .regex(/^[a-zA-Z0-9_-]+$/, { message: "Name can only contain letters, numbers, hyphens and underscores" })
});

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
  created_at: string;
}

interface GameSession {
  id: string;
  game_name: string;
  score: number;
  reward_amount: number;
  played_at: string;
  difficulty: string | null;
  nft_asset_id: number | null;
}

const Profile = () => {
  const { accountAddress, balance, disconnectWallet, isConnected } = useMultiWallet();
  const [player, setPlayer] = useState<Player | null>(null);
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [nftGallery, setNftGallery] = useState<GameSession[]>([]);
  const [activeTab, setActiveTab] = useState<"games" | "nfts">("games");
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isConnected || !accountAddress) {
      navigate("/");
      return;
    }
    
    fetchPlayerData();
  }, [accountAddress, isConnected, navigate]);

  useEffect(() => {
    if (!player?.id) return;
    
    fetchGameSessions();
    fetchNFTs();

    // Subscribe to game sessions updates
    const sessionsChannel = supabase
      .channel('player-sessions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_sessions',
          filter: `player_id=eq.${player.id}`
        },
        () => {
          fetchGameSessions();
          fetchNFTs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionsChannel);
    };
  }, [player?.id]);

  useEffect(() => {
    if (!accountAddress) return;

    // Subscribe to player updates
    const playerChannel = supabase
      .channel('player-profile')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `wallet_address=eq.${accountAddress}`
        },
        () => {
          fetchPlayerData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(playerChannel);
    };
  }, [accountAddress]);

  const fetchPlayerData = async () => {
    if (!accountAddress) return;

    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('wallet_address', accountAddress)
        .single();

      if (error) throw error;
      setPlayer(data);
      setNewName(data.name);
    } catch (error) {
      console.error('Error fetching player:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGameSessions = async () => {
    if (!player?.id) return;

    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('player_id', player.id)
        .order('played_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setGameSessions(data || []);
    } catch (error) {
      console.error('Error fetching game sessions:', error);
    }
  };

  const fetchNFTs = async () => {
    if (!player?.id) return;

    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('player_id', player.id)
        .not('nft_asset_id', 'is', null)
        .order('played_at', { ascending: false });

      if (error) throw error;
      setNftGallery(data || []);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
    }
  };

  const handleUpdateName = async () => {
    setNameError("");

    try {
      const validatedData = nameSchema.parse({ name: newName });

      const { error } = await supabase
        .from('players')
        .update({ name: validatedData.name })
        .eq('wallet_address', accountAddress);

      if (error) throw error;

      setIsEditingName(false);
      toast({
        title: "Success",
        description: "Name updated successfully",
      });
      fetchPlayerData();
    } catch (error) {
      if (error instanceof z.ZodError) {
        setNameError(error.errors[0].message);
      } else {
        toast({
          title: "Error",
          description: "Failed to update name",
          variant: "destructive",
        });
      }
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-24 text-center">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-24 text-center">
          <p className="text-muted-foreground">Player not found</p>
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

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Player Info & Wallet */}
            <div className="space-y-6">
              {/* Player Card */}
              <Card className="glass-effect border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                        <User className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{player.name}</CardTitle>
                        <CardDescription className="text-xs">
                          ID: {player.player_id}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditingName ? (
                    <div className="space-y-2">
                      <Label htmlFor="name">Display Name</Label>
                      <Input
                        id="name"
                        value={newName}
                        onChange={(e) => {
                          setNewName(e.target.value);
                          setNameError("");
                        }}
                        maxLength={30}
                      />
                      {nameError && (
                        <p className="text-sm text-destructive">{nameError}</p>
                      )}
                      <div className="flex gap-2">
                        <Button onClick={handleUpdateName} size="sm">
                          Save
                        </Button>
                        <Button
                          onClick={() => {
                            setIsEditingName(false);
                            setNewName(player.name);
                            setNameError("");
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setIsEditingName(true)}
                      variant="outline"
                      className="w-full"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Name
                    </Button>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      Joined {new Date(player.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Wallet Card */}
              <Card className="glass-effect border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    Wallet
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Address</Label>
                    <p className="text-sm font-mono break-all">
                      {player.wallet_address}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Balance</Label>
                    <p className="text-2xl font-bold">
                      {balance.toFixed(2)} ALGO
                    </p>
                  </div>

                  <Button
                    onClick={handleDisconnect}
                    variant="destructive"
                    className="w-full"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnect Wallet
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Middle Column - Stats */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Grid */}
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="glass-effect border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Score</p>
                        <p className="text-2xl font-bold">{player.total_score.toLocaleString()}</p>
                      </div>
                      <Trophy className="w-8 h-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-effect border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Games Played</p>
                        <p className="text-2xl font-bold">{player.games_played}</p>
                      </div>
                      <Star className="w-8 h-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-effect border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Rewards Earned</p>
                        <p className="text-2xl font-bold">
                          {Number(player.total_rewards_earned).toFixed(2)}
                        </p>
                      </div>
                      <Gift className="w-8 h-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-effect border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">NFTs Earned</p>
                        <p className="text-2xl font-bold">{player.nfts_earned}</p>
                      </div>
                      <Award className="w-8 h-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Game History & NFT Gallery */}
              <Card className="glass-effect border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                      <button
                        onClick={() => setActiveTab("games")}
                        className={`flex items-center gap-2 pb-2 transition-all ${
                          activeTab === "games"
                            ? "border-b-2 border-primary text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <TrendingUp className="w-5 h-5" />
                        <span className="font-semibold">Recent Games</span>
                      </button>
                      <button
                        onClick={() => setActiveTab("nfts")}
                        className={`flex items-center gap-2 pb-2 transition-all ${
                          activeTab === "nfts"
                            ? "border-b-2 border-primary text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Award className="w-5 h-5" />
                        <span className="font-semibold">NFT Gallery</span>
                        <Badge variant="secondary" className="ml-1">
                          {nftGallery.length}
                        </Badge>
                      </button>
                    </div>
                  </div>
                  <CardDescription>
                    {activeTab === "games"
                      ? "Your last 10 game sessions"
                      : "Your collected achievement NFTs"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activeTab === "games" ? (
                    gameSessions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No games played yet. Start playing to see your history!
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {gameSessions.map((session) => (
                          <div
                            key={session.id}
                            className="flex items-center justify-between p-4 rounded-lg bg-card/50 hover:bg-card/80 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{session.game_name}</h4>
                                {session.difficulty && (
                                  <Badge variant="outline" className="text-xs">
                                    {session.difficulty}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {new Date(session.played_at).toLocaleDateString()} at{" "}
                                {new Date(session.played_at).toLocaleTimeString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">{session.score}</p>
                              {session.reward_amount > 0 && (
                                <p className="text-sm text-primary">
                                  +{Number(session.reward_amount).toFixed(2)} ALGO
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : nftGallery.length === 0 ? (
                    <div className="text-center py-12">
                      <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-muted-foreground mb-2">No NFTs earned yet</p>
                      <p className="text-sm text-muted-foreground">
                        Win games to earn achievement NFTs!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {nftGallery.map((nft) => (
                        <div
                          key={nft.id}
                          className="group relative overflow-hidden rounded-lg border border-primary/20 bg-gradient-to-br from-card to-card/50 hover:border-primary/50 transition-all hover:scale-105 animate-scale-in"
                        >
                          <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center p-6">
                            <div className="text-center">
                              <Award className="w-16 h-16 mx-auto mb-3 text-primary" />
                              <h3 className="font-bold text-lg mb-1">{nft.game_name}</h3>
                              <Badge variant="secondary" className="mb-2">
                                Score: {nft.score}
                              </Badge>
                            </div>
                          </div>
                          <div className="p-3 bg-card/80 backdrop-blur-sm">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Asset ID</span>
                              <span className="font-mono font-semibold">
                                #{nft.nft_asset_id}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs mt-1">
                              <span className="text-muted-foreground">Earned</span>
                              <span className="text-muted-foreground">
                                {new Date(nft.played_at).toLocaleDateString()}
                              </span>
                            </div>
                            <a
                              href={`https://testnet.explorer.perawallet.app/asset/${nft.nft_asset_id}/`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 w-full inline-flex items-center justify-center text-xs text-primary hover:text-primary/80 transition-colors"
                            >
                              View on Explorer →
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Profile;
