import { Gamepad2, Twitter, Github, MessageCircle } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/30 backdrop-blur-sm py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-primary" />
             <span className="block font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent mt-2 drop-shadow-lg">
                AlgoArena
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              The future of decentralized gaming on Algorand TestNet
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Games</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Trivia Challenge</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Speed Racer</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Card Master</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Community</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Leaderboard</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Tournaments</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">NFT Gallery</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-lg bg-muted hover:bg-accent flex items-center justify-center transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-muted hover:bg-accent flex items-center justify-center transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-muted hover:bg-accent flex items-center justify-center transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© 2025 AlgoArena. Built on Algorand TestNet. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
