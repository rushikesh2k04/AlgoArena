import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MultiWalletProvider } from "@/hooks/useMultiWallet";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TriviaChallenge from "./pages/games/TriviaChallenge";
import SpeedRacer from "./pages/games/SpeedRacer";
import CardMaster from "./pages/games/CardMaster";
import EightBallPool from "./pages/games/EightBallPool";
import NumberSlide from "./pages/games/NumberSlide";
import SudokuMaster from "./pages/games/SudokuMaster";
import WaterSort from "./pages/games/WaterSort";
import BlockPuzzle from "./pages/games/BlockPuzzle";
import ColorConnect from "./pages/games/ColorConnect";
import TicTacToe from "./pages/games/TicTacToe";
import CandyCrush from "./pages/games/CandyCrush";
import BubbleShooter from "./pages/games/BubbleShooter";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <MultiWalletProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/games/trivia" element={<TriviaChallenge />} />
            <Route path="/games/speed-racer" element={<SpeedRacer />} />
            <Route path="/games/card-master" element={<CardMaster />} />
            <Route path="/games/8ball-pool" element={<EightBallPool />} />
            <Route path="/games/2048" element={<NumberSlide />} />
            <Route path="/games/sudoku" element={<SudokuMaster />} />
            <Route path="/games/water-sort" element={<WaterSort />} />
            <Route path="/games/block-puzzle" element={<BlockPuzzle />} />
            <Route path="/games/color-connect" element={<ColorConnect />} />
            <Route path="/games/tictactoe" element={<TicTacToe />} />
            <Route path="/games/candy-crush" element={<CandyCrush />} />
            <Route path="/games/bubble-shooter" element={<BubbleShooter />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </MultiWalletProvider>
  </QueryClientProvider>
);

export default App;
