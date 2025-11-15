import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, UserPlus, Trophy, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const Friends = () => {
  const [friendAddress, setFriendAddress] = useState("");
  const { toast } = useToast();

  const friends = [
    { name: "CryptoKing", address: "ALGO1...XY9Z", wins: 45, online: true },
    { name: "GameMaster", address: "ALGO2...AB3C", wins: 38, online: true },
    { name: "PuzzlePro", address: "ALGO3...DE5F", wins: 32, online: false },
    { name: "SpeedDemon", address: "ALGO4...GH7I", wins: 29, online: true },
  ];

  const handleAddFriend = () => {
    if (!friendAddress) {
      toast({
        title: "Enter Address",
        description: "Please enter a wallet address",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Friend Request Sent",
      description: `Request sent to ${friendAddress.slice(0, 6)}...${friendAddress.slice(-4)}`,
    });
    setFriendAddress("");
  };

  return (
    <section id="friends" className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Your <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent">Friends</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect with players and challenge them to epic battles
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="glass-effect border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Add Friend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter friend's wallet address..."
                  value={friendAddress}
                  onChange={(e) => setFriendAddress(e.target.value)}
                  className="glass-effect"
                />
                <Button onClick={handleAddFriend}>
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Friends List
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {friends.map((friend, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 glass-effect rounded-lg hover:border-primary/40 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                          <Users className="w-6 h-6" />
                        </div>
                        {friend.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold">{friend.name}</h3>
                        <p className="text-sm text-muted-foreground">{friend.address}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-primary">
                          <Trophy className="w-4 h-4" />
                          <span className="font-bold">{friend.wins}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">wins</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Challenge
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
