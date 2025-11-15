import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWalletSelect: (wallet: 'pera' | 'defly' | 'lute') => void;
}

export const WalletModal = ({ open, onOpenChange, onWalletSelect }: WalletModalProps) => {
  const wallets = [
    { name: 'Pera Wallet', id: 'pera' as const, available: true },
    { name: 'Defly Wallet', id: 'defly' as const, available: true },
    { name: 'Lute Wallet', id: 'lute' as const, available: true },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-effect border-primary/20">
        <DialogHeader>
         <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent mt-2 drop-shadow-lg">
  Connect Wallet
</DialogTitle>


        </DialogHeader>
        <div className="space-y-3 py-4">
          {wallets.map((wallet) => (
            <Button
              key={wallet.id}
              onClick={() => {
                onWalletSelect(wallet.id);
                onOpenChange(false);
              }}
              disabled={!wallet.available}
              className="w-full justify-start gap-3 h-14 text-lg"
              variant="outline"
            >
              <Wallet className="w-5 h-5" />
              {wallet.name}
              {!wallet.available && <span className="ml-auto text-xs text-muted-foreground">(Coming Soon)</span>}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
