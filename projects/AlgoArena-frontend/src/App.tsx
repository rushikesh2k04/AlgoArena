import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MultiWalletProvider, useMultiWallet } from "@/hooks/useMultiWallet";
import { NameRegistrationModal } from "@/components/NameRegistrationModal";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import LeaderboardPage from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";
import TriviaChallenge from "./pages/games/TriviaChallenge";
import SpeedRacer from "./pages/games/SpeedRacer";
import CardMaster from "./pages/games/CardMaster";
import EightBallPool from "./pages/games/EightBallPool";
import NumberSlide from "./pages/games/NumberSlide";
import WaterSort from "./pages/games/WaterSort";
import RouletteWheel from "./pages/games/ColorConnect";
import TicTacToe from "./pages/games/TicTacToe";
import Mines from "./pages/games/Mines";
import SlotMachine from "./pages/games/SlotMachine";

const queryClient = new QueryClient();

const AppContent = () => {
  const { showNameRegistration, registerPlayerName, pendingWalletAddress } = useMultiWallet();

  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/games/trivia" element={<TriviaChallenge />} />
          <Route path="/games/speed-racer" element={<SpeedRacer />} />
          <Route path="/games/card-master" element={<CardMaster />} />
          <Route path="/games/8ball-pool" element={<EightBallPool />} />
          <Route path="/games/2048" element={<NumberSlide />} />
          <Route path="/games/water-sort" element={<WaterSort />} />
          <Route path="/games/roulette-wheel" element={<RouletteWheel />} />
          <Route path="/games/tictactoe" element={<TicTacToe />} />
          <Route path="/games/mines" element={<Mines />} />
          <Route path="/games/slot-machine" element={<SlotMachine />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <NameRegistrationModal
        open={showNameRegistration}
        onSubmit={registerPlayerName}
        walletAddress={pendingWalletAddress || ""}
      />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <MultiWalletProvider>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </MultiWalletProvider>
  </QueryClientProvider>
);

export default App;
