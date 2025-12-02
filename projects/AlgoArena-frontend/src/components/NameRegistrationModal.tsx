import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { z } from "zod";
import { UserCircle } from "lucide-react";

const nameSchema = z.object({
  name: z.string()
    .trim()
    .min(3, { message: "Name must be at least 3 characters" })
    .max(30, { message: "Name must be less than 30 characters" })
    .regex(/^[a-zA-Z0-9_-]+$/, { message: "Name can only contain letters, numbers, hyphens and underscores" })
});

interface NameRegistrationModalProps {
  open: boolean;
  onSubmit: (name: string) => void;
  walletAddress: string;
}

export const NameRegistrationModal = ({ open, onSubmit, walletAddress }: NameRegistrationModalProps) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const validatedData = nameSchema.parse({ name });
      await onSubmit(validatedData.name);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError("Failed to register name");
      }
      setIsSubmitting(false);
    }
  };

  const suggestedName = `Player_${walletAddress.slice(0, 8)}`;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md glass-effect border-primary/20" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-primary bg-clip-text text-transparent flex items-center gap-2">
            <UserCircle className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent" />
            Welcome to AlgoArena!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose a display name for your player profile
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              type="text"
              placeholder={suggestedName}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              maxLength={30}
              className="w-full"
              disabled={isSubmitting}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <p className="text-xs text-muted-foreground">
              3-30 characters. Letters, numbers, hyphens and underscores only.
            </p>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !name.trim()}
          >
            {isSubmitting ? "Creating Profile..." : "Continue"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
