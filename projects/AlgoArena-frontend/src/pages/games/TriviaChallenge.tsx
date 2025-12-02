import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trophy, Timer, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePeraWallet } from "@/hooks/usePeraWallet";
import { claimReward } from "@/utils/algoReward";
import { mintGameNFT, transferNFT } from "@/utils/nftReward";
import { recordGameSession } from "@/utils/gameSession";
import triviaIcon from "@/assets/trivia-icon.jpg";
import { motion, AnimatePresence } from "framer-motion";

/*
  Updated: selects 10 questions randomly (from the 20 question pool) each match.
  ALGO reward = correctCount (capped at 10) since match is 10 questions.
*/

const BASE_QUESTIONS = [
  { question: "What consensus mechanism does Algorand use?", options: ["Proof of Work", "Pure Proof of Stake", "Delegated PoS", "Proof of Authority"], correct: 1 },
  { question: "What is the average block time on Algorand?", options: ["10 minutes", "4.5 seconds", "15 seconds", "1 minute"], correct: 1 },
  { question: "Who created Algorand?", options: ["Vitalik Buterin", "Silvio Micali", "Charles Hoskinson", "Gavin Wood"], correct: 1 },
  { question: "What is the native token of Algorand?", options: ["USDC", "ETH", "ALGO", "ADA"], correct: 2 },
  { question: "What is the maximum supply of ALGO tokens?", options: ["10 billion", "21 million", "100 million", "Unlimited"], correct: 0 },
  { question: "What programming language is primarily used for Algorand smart contracts?", options: ["Solidity", "Python", "PyTeal", "Rust"], correct: 2 },
  { question: "What does ASA stand for in Algorand?", options: ["Algorand Standard Asset", "Automated Staking Algorithm", "Advanced Security Algorithm", "Asset Standard Agreement"], correct: 0 },
  { question: "What is the typical minimum fee on Algorand (in ALGO)?", options: ["0.1 ALGO", "0.01 ALGO", "0.001 ALGO", "0 ALGO"], correct: 2 },
  { question: "Which algorithmic property is Algorand known for?", options: ["Sharding", "Pure Proof-of-Stake", "Proof-of-Work", "Delegated Proof-of-Stake"], correct: 1 },
  { question: "Algorand's blockchain was designed to provide which of the following?", options: ["High decentralization only", "Scalability and speed", "Private transactions only", "Smart contract incompatibility"], correct: 1 },
  { question: "What Layer is Algorand considered?", options: ["Layer 0", "Layer 1", "Layer 2", "Application Layer"], correct: 1 },
  { question: "Which cryptographer founded Algorand?", options: ["Shafi Goldwasser", "Silvio Micali", "Mihir Bellare", "Ron Rivest"], correct: 1 },
  { question: "Algorand Smart Contracts can be written in which of the following languages?", options: ["PyTeal, Reach, TEAL", "Solidity only", "Rust only", "C++ only"], correct: 0 },
  { question: "What is an ASA used for?", options: ["Creating tokens & NFTs on Algorand", "Storing off-chain data", "Running EVM contracts", "Mining ALGO"], correct: 0 },
  { question: "What consensus step does Algorand's protocol include?", options: ["Voting via Verifiable Random Function (VRF)", "Mining by GPUs", "Leader election by stake only", "No randomness"], correct: 0 },
  { question: "Algorand uses which virtual machine for TEAL programs?", options: ["AVM (Algorand VM)", "EVM (Ethereum VM)", "WASM", "JVM"], correct: 0 },
  { question: "How does Algorand achieve finality?", options: ["Probabilistic finality", "Immediate finality via BA* consensus", "No finality", "Finality after confirmations"], correct: 1 },
  { question: "What is the block proposer selection based on in Algorand?", options: ["Random selection via cryptographic sortition", "Highest fee", "Largest miner power", "Time-based rotation"], correct: 0 },
  { question: "Which feature helps Algorand scale without sharding?", options: ["Pure PoS plus efficient consensus", "Layer-2 rollups only", "Centralized validators", "Sharding is required"], correct: 0 },
  { question: "Which token standard is commonly used for NFTs on Algorand?", options: ["ASA standard", "ERC-721", "BEP-20", "SPL"], correct: 0 },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function prepareShuffledQuestions(baseQuestions: typeof BASE_QUESTIONS) {
  // PICK EXACTLY 10 QUESTIONS (or fewer if pool is smaller)
  const PICK_COUNT = Math.min(10, baseQuestions.length);
  const shuffled = shuffleArray(baseQuestions);
  const picked = shuffled.slice(0, PICK_COUNT);

  return picked.map((q) => {
    const opts = shuffleArray(q.options.slice());
    const correctText = q.options[q.correct];
    const correctIndex = opts.indexOf(correctText);
    return { question: q.question, options: opts, correct: correctIndex };
  });
}

function playTone(frequency = 440, duration = 0.08, volume = 0.05) {
  try {
    const ctx = new (window.AudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = frequency;
    g.gain.value = volume;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    setTimeout(() => {
      o.stop();
      ctx.close();
    }, duration * 1000);
  } catch (e) {
    // ignore audio errors
  }
}

export default function TriviaChallenge(): JSX.Element {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { accountAddress, optInToAsset } = usePeraWallet();

  const PER_QUESTION_TIME = 15;

  const [questions, setQuestions] = useState(() => prepareShuffledQuestions(BASE_QUESTIONS));
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const correctCountRef = useRef(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(PER_QUESTION_TIME);
  const [gameOver, setGameOver] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [nftAssetId, setNftAssetId] = useState<number | null>(null);
  const [showOptInPrompt, setShowOptInPrompt] = useState(false);
  const [muted, setMuted] = useState(false);
  const [lifeline5050Used, setLifeline5050Used] = useState(false);
  const [disabledOptions, setDisabledOptions] = useState<number[]>([]);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    correctCountRef.current = correctCount;
  }, [correctCount]);

  useEffect(() => {
    setTimeLeft(PER_QUESTION_TIME);
  }, [questions]);

  // when game ends, claim/mint/record — uses final ref count
  useEffect(() => {
    if (!gameOver) return;

    const finalCorrect = correctCountRef.current;
    const rewardAmount = Math.min(10, Math.max(0, finalCorrect)); // cap at 10 (10-question match)

    if (accountAddress) {
      if (rewardAmount > 0 && !rewardClaimed) {
        claimReward(accountAddress, rewardAmount)
          .then((success) => {
            if (success) {
              setRewardClaimed(true);
              toast({
                title: "Reward Claimed!",
                description: `${rewardAmount} ALGO has been credited to your wallet!`,
              });
            }
          })
          .catch((err) => console.error("claimReward failed", err));
      }

      const matchId = `trivia-${Date.now()}`;
      const difficulty = "standard";

      mintGameNFT(accountAddress, "Trivia Challenge", score, triviaIcon, matchId, difficulty)
        .then((result) => {
          if (result && result.success && result.assetId) {
            setNftAssetId(result.assetId);
            setShowOptInPrompt(true);
            toast({
              title: "NFT Achievement Created!",
              description: "Your game achievement NFT has been created. Please opt-in to receive it.",
            });

            return recordGameSession({
              playerWalletAddress: accountAddress,
              gameName: "Trivia Challenge",
              score,
              rewardAmount,
              nftAssetId: result.assetId,
              difficulty,
              correctAnswers: finalCorrect,
            });
          } else {
            return recordGameSession({
              playerWalletAddress: accountAddress,
              gameName: "Trivia Challenge",
              score,
              rewardAmount,
              nftAssetId: null,
              difficulty,
              correctAnswers: finalCorrect,
            });
          }
        })
        .catch((err) => {
          console.error("mintGameNFT failed", err);
          recordGameSession({
            playerWalletAddress: accountAddress,
            gameName: "Trivia Challenge",
            score,
            rewardAmount,
            nftAssetId: null,
            difficulty,
            correctAnswers: finalCorrect,
          }).catch(() => {});
        });
    } else {
      // no wallet — still record session with null wallet
      recordGameSession({
        playerWalletAddress: null,
        gameName: "Trivia Challenge",
        score,
        rewardAmount,
        nftAssetId: null,
        difficulty: "standard",
        correctAnswers: finalCorrect,
      }).catch(() => {});
    }
  }, [gameOver, accountAddress, rewardClaimed, score, toast]);

  const handleOptInAndReceiveNFT = async () => {
    if (!nftAssetId || !accountAddress) return;
    try {
      const optInSuccess = await optInToAsset(nftAssetId);
      if (!optInSuccess) {
        toast({ title: "Opt-in failed", variant: "destructive" });
        return;
      }
      const transferSuccess = await transferNFT(accountAddress, nftAssetId);
      if (transferSuccess) {
        setShowOptInPrompt(false);
        toast({
          title: "NFT Received!",
          description: "Your achievement NFT has been transferred to your wallet!",
        });
      } else {
        toast({ title: "Transfer failed", variant: "destructive" });
      }
    } catch (err) {
      console.error("opt-in/transfer failed", err);
      toast({
        title: "NFT Transfer Failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (gameOver) return;
    if (timeLeft <= 0) {
      handleAnswer(null);
      return;
    }
    const t = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, gameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (gameOver) return;
      const key = e.key;
      if (["1", "2", "3", "4"].includes(key)) {
        const idx = Number(key) - 1;
        if (!disabledOptions.includes(idx)) handleAnswer(idx);
      } else if (key === "ArrowDown") {
        const currentIndex = optionRefs.current.findIndex((r) => r === document.activeElement);
        const next = (currentIndex + 1) % optionRefs.current.length;
        optionRefs.current[next]?.focus();
      } else if (key === "ArrowUp") {
        const currentIndex = optionRefs.current.findIndex((r) => r === document.activeElement);
        const prev = (currentIndex - 1 + optionRefs.current.length) % optionRefs.current.length;
        optionRefs.current[prev]?.focus();
      } else if (key === "Enter") {
        const focusedIndex = optionRefs.current.findIndex((r) => r === document.activeElement);
        if (focusedIndex >= 0 && !disabledOptions.includes(focusedIndex)) handleAnswer(focusedIndex);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [gameOver, disabledOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswer = (index: number | null) => {
    if (selectedAnswer !== null || gameOver) return;

    setSelectedAnswer(index);
    const isCorrect = index !== null && index === questions[currentQuestion].correct;

    if (isCorrect) {
      setCorrectCount((c) => {
        const updated = c + 1;
        correctCountRef.current = updated;
        return updated;
      });
      setScore((s) => s + 100);
      if (!muted) playTone(880, 0.08, 0.06);
      toast({ title: "Correct! +100" });
    } else {
      if (!muted) {
        playTone(220, 0.12, 0.06);
        playTone(150, 0.12, 0.03);
      }
      toast({
        title: index === null ? "Time's up!" : "Wrong answer!",
        variant: "destructive",
      });
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((c) => c + 1);
        setSelectedAnswer(null);
        setDisabledOptions([]);
        setTimeLeft(PER_QUESTION_TIME);
        setTimeout(() => optionRefs.current[0]?.focus(), 40);
      } else {
        finishGame(correctCountRef.current);
      }
    }, 700);
  };

  const finishGame = (finalCorrectCountParam?: number) => {
    const finalCorrect =
      typeof finalCorrectCountParam === "number"
        ? finalCorrectCountParam
        : correctCountRef.current;
    setCorrectCount(finalCorrect);
    correctCountRef.current = finalCorrect;
    setGameOver(true);

    const algos = Math.min(10, Math.max(0, finalCorrect)); // cap at 10 for 10-question match
    if (algos > 0) {
      toast({
        title: "You Earned ALGO!",
        description: `Prize: ${algos} ALGO • Correct: ${finalCorrect}/${questions.length}`,
      });
    } else {
      toast({
        title: "Game Over",
        description: `Correct: ${finalCorrect}/${questions.length}`,
      });
    }

    if (!muted && algos > 0) playTone(1000, 0.15, 0.06);
  };

  const use5050 = () => {
    if (lifeline5050Used || selectedAnswer !== null) return;
    const correct = questions[currentQuestion].correct;
    const indices = [0, 1, 2, 3].filter((i) => i !== correct);
    const shuffled = shuffleArray(indices);
    const toDisable = shuffled.slice(0, 2);
    setDisabledOptions(toDisable);
    setLifeline5050Used(true);
    toast({ title: "50/50 used", description: "Two wrong answers removed." });
    if (!muted) playTone(600, 0.08, 0.04);
  };

  const percentProgress = Math.round(
    ((currentQuestion + (selectedAnswer !== null ? 1 : 0)) / questions.length) * 100
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-emerald-900 py-8 text-white">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <div className="text-2xl font-bold">Trivia Challenge</div>
          </div>

          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2 bg-white/6 px-3 py-2 rounded-2xl">
              <Trophy className="w-5 h-5 text-yellow-300" />
              <div className="text-sm font-semibold">
                {correctCount}/{questions.length}
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/6 px-3 py-2 rounded-2xl">
              <Timer className="w-5 h-5 text-cyan-200" />
              <div className="text-sm font-semibold">{timeLeft}s</div>
            </div>

            <Button
              variant="ghost"
              onClick={() => setMuted((m) => !m)}
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? "🔇" : "🔊"}
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                /* possible settings open */
              }}
              title="Settings"
            >
              <Settings />
            </Button>
          </div>
        </div>

        <Card className="p-6 bg-white/6 border border-white/8 shadow-2xl rounded-2xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-slate-300">
                Question {currentQuestion + 1} / {questions.length}
              </p>
              <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">
                {questions[currentQuestion].question}
              </h1>
              <p className="text-sm text-slate-400">
                Correct: {correctCount} • 50/50 available:{" "}
                {!lifeline5050Used ? "Yes" : "Used"}
              </p>
            </div>

            <div className="w-48">
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-cyan-300 transition-all"
                  style={{ width: `${percentProgress}%` }}
                />
              </div>
              <p className="text-right text-xs text-slate-400 mt-1">
                Progress: {percentProgress}%
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {questions[currentQuestion].options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === questions[currentQuestion].correct;
              const reveal = selectedAnswer !== null;
              const disabled = disabledOptions.includes(index);

              return (
                <motion.button
                  key={option}
                  ref={(el) => (optionRefs.current[index] = el)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => handleAnswer(index)}
                  disabled={selectedAnswer !== null || gameOver || disabled}
                  aria-pressed={isSelected}
                  aria-disabled={selectedAnswer !== null || gameOver || disabled}
                  className={`w-full text-left py-4 px-5 rounded-lg shadow-sm font-medium text-lg backdrop-blur-sm transition-all duration-200 focus:outline-none
                    ${
                      disabled
                        ? "opacity-40 cursor-not-allowed line-through"
                        : isSelected && reveal
                        ? isCorrect
                          ? "bg-emerald-600 text-white scale-105"
                          : "bg-red-600 text-white"
                        : "bg-white/6 text-white hover:bg-white/12"
                    }`}
                  style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    <span className="text-sm text-slate-300">
                      {isSelected && reveal ? (isCorrect ? "✔" : "✖") : ""}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={use5050}
                disabled={lifeline5050Used || selectedAnswer !== null}
              >
                50/50
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  toast({
                    title: "Hint",
                    description: "Think Algorand: fast, secure and Pure PoS.",
                  });
                }}
              >
                Hint
              </Button>
            </div>

            <div className="text-sm text-slate-400">
              Time per question: {PER_QUESTION_TIME}s
            </div>
          </div>
        </Card>

        {/* Game Over modal (translucent) */}
        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center p-6"
            >
              <div
                className="max-w-lg w-full p-6 rounded-2xl bg-white/8 backdrop-blur-lg border border-white/20 text-white shadow-2xl"
                role="dialog"
                aria-modal="true"
              >
                <div className="text-center">
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
                  <h2 className="text-3xl font-bold mb-2">
                    {correctCount === questions.length
                      ? "Perfect! You Won!"
                      : "Quiz Completed"}
                  </h2>
                  <p className="text-xl mb-2">
                    Correct Answers: {correctCount} / {questions.length}
                  </p>
                  <p className="mb-4">
                    ALGO Reward:{" "}
                    <strong>
                      {Math.min(10, Math.max(0, correctCount))} ALGO
                    </strong>
                  </p>

                  {showOptInPrompt && nftAssetId && (
                    <Card className="p-4 bg-white/10 border border-white/12 mb-4 max-w-sm mx-auto text-white">
                      <p className="text-sm mb-3">
                        🏆 Your achievement NFT is ready! Opt-in to receive it in
                        your wallet.
                      </p>
                      <div className="flex gap-3 justify-center">
                        <Button
                          onClick={handleOptInAndReceiveNFT}
                          variant="default"
                          size="sm"
                        >
                          Opt-in & Receive NFT
                        </Button>
                      </div>
                    </Card>
                  )}

                  <div className="mt-6 flex justify-center">
                    <Button onClick={() => navigate("/")}>Play Again</Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
