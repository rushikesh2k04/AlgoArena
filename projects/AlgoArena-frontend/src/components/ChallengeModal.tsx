import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Copy } from "lucide-react";

interface ChallengeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameName: string;
}

export const ChallengeModal = ({ open, onOpenChange, gameName }: ChallengeModalProps) => {
  const [friendAddress, setFriendAddress] = useState("");
  const { toast } = useToast();
  const challengeLink = `${window.location.origin}/challenge/${Math.random().toString(36).slice(2)}`;

  const handleSendChallenge = () => {
    if (!friendAddress) {
      toast({
        title: "Enter Friend's Address",
        description: "Please enter your friend's wallet address",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Challenge Sent!",
      description: `Challenge sent to ${friendAddress.slice(0, 6)}...${friendAddress.slice(-4)}`,
    });
    onOpenChange(false);
    setFriendAddress("");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(challengeLink);
    toast({
      title: "Link Copied",
      description: "Challenge link copied to clipboard",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-effect border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Challenge a Friend - {gameName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Friend's Wallet Address
            </label>
            <Input
              placeholder="Enter Algorand address..."
              value={friendAddress}
              onChange={(e) => setFriendAddress(e.target.value)}
              className="glass-effect"
            />
          </div>

          <Button onClick={handleSendChallenge} className="w-full">
            Send Challenge
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or share link</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              value={challengeLink}
              readOnly
              className="glass-effect"
            />
            <Button variant="outline" size="icon" onClick={copyLink}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
