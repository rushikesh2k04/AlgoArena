import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePeraWallet } from "@/hooks/usePeraWallet";
import { claimReward } from "@/utils/algoReward";
import { mintGameNFT, transferNFT } from "@/utils/nftReward";
import { recordGameSession } from "@/utils/gameSession";
import cardsIcon from "@/assets/cards-icon.jpg";

const suits = ["♠", "♥", "♦", "♣"];
const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

type CardType = { id: string; suit: string; value: string; flipped: boolean; matched: boolean };

const makePairCard = (suit: string, value: string, pairIndex: number): CardType => ({
/**
 * Creates a deck of 16 cards with random suits and values.
 * Each card in the deck is represented by an object with the following properties:
 *   - suit: The suit of the card (one of "", "", "", or "")
 *   - value: The value of the card (one of "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K")
 *   - flipped: A boolean indicating whether the card is flipped or not
 *   - matched: A boolean indicating whether the card is matched or not
 * The deck is shuffled using the Fisher-Yates algorithm and returned in a random order.
 */
  id: `${suit}${value}-${pairIndex}-${Math.random().toString(36).slice(2, 8)}`,
  suit,
  value,
  flipped: false,
  matched: false,
});

const createDeck = (): CardType[] => {
  const pairs: CardType[] = [];
  for (let i = 0; i < 8; i++) {
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const value = values[Math.floor(Math.random() * values.length)];
    pairs.push(makePairCard(suit, value, 1), makePairCard(suit, value, 2));
  }
  return pairs.sort(() => Math.random() - 0.5);
};

export default function CardMaster() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { accountAddress, optInToAsset } = usePeraWallet();

  // settings
  const TOTAL_TIME = 30; // seconds
  const REWARD_AMOUNT = 30; // ALGO

  // state
  const [cards, setCards] = useState<CardType[]>(() => createDeck());
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [gameStarted, setGameStarted] = useState(false);

  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [nftAssetId, setNftAssetId] = useState<number | null>(null);
  const [showOptInPrompt, setShowOptInPrompt] = useState(false);

  // modals
  const [showWinModal, setShowWinModal] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);

  // refs
  const movesRef = useRef(moves);
  const timeLeftRef = useRef(timeLeft);

  useEffect(() => { movesRef.current = moves; }, [moves]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  // Timer starts on first click
  useEffect(() => {
    if (!gameStarted || gameWon) return;
    setTimeLeft(TOTAL_TIME);
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [gameStarted, gameWon]);

  // If time runs out before win -> show time-up modal and freeze game (no rewards)
  useEffect(() => {
    if (timeLeft === 0 && !gameWon && gameStarted) {
      // stop the game and show time-up UI
      setGameStarted(false);
      setShowTimeUpModal(true);
      toast({ title: "Time's up", description: "You ran out of time — better luck next time.", variant: "default" });
    }
  }, [timeLeft, gameWon, gameStarted, toast]);

  // handle flips & matching
  useEffect(() => {
    if (flippedIndices.length !== 2) return;
    const [i1, i2] = flippedIndices;
    const c1 = cards[i1];
    const c2 = cards[i2];

    setMoves((m) => m + 1);

    if (c1.value === c2.value && c1.suit === c2.suit) {
      setTimeout(() => {
        setCards((prev) => {
          const copy = prev.map((c) => ({ ...c }));
          copy[i1].matched = true;
          copy[i2].matched = true;
          return copy;
        });
        setFlippedIndices([]);
        setMatches((m) => {
          const newM = m + 1;
          if (newM === 8) {
            // win condition
            setGameWon(true);
            setShowWinModal(true);
            setGameStarted(false);
          }
          return newM;
        });
      }, 400);
    } else {
      setTimeout(() => {
        setCards((prev) => {
          const copy = prev.map((c) => ({ ...c }));
          copy[i1].flipped = false;
          copy[i2].flipped = false;
          return copy;
        });
        setFlippedIndices([]);
      }, 600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flippedIndices]);

  // when game is won: automatically send reward (if finished within time) and mint NFT in background
  useEffect(() => {
    if (!gameWon) return;

    const finishedInTime = timeLeftRef.current > 0;

    (async () => {
      try {
        if (finishedInTime && accountAddress) {
          // send reward immediately
          const success = await claimReward(accountAddress, REWARD_AMOUNT);
          if (success) {
            setRewardClaimed(true);
            toast({ title: "Reward Sent", description: `${REWARD_AMOUNT} ALGO has been sent to your wallet.`, variant: "default" });
          } else {
            toast({ title: "Reward failed", description: "Could not send ALGO automatically.", variant: "destructive" });
          }
        } else {
          // finished after timer => no reward
          toast({ title: "No reward", description: "Finished after timer — no ALGO reward.", variant: "default" });
        }

        // mint NFT in background (so user can opt-in & receive)
        if (accountAddress) {
          const matchId = `cardmaster-${Date.now()}`;
          const difficulty = movesRef.current < 15 ? "easy" : movesRef.current < 30 ? "medium" : "hard";
          const res = await mintGameNFT(accountAddress, "Card Master", movesRef.current, cardsIcon, matchId, difficulty);
          if (res.success && res.assetId) {
            setNftAssetId(res.assetId);
            setShowOptInPrompt(true);
            // record session (include nft asset id)
            recordGameSession({
              playerWalletAddress: accountAddress,
              gameName: "Card Master",
              score: Math.max(0, 100 - movesRef.current),
              rewardAmount: finishedInTime ? REWARD_AMOUNT : 0,
              nftAssetId: res.assetId,
              difficulty,
            });
          } else {
            recordGameSession({
              playerWalletAddress: accountAddress,
              gameName: "Card Master",
              score: Math.max(0, 100 - movesRef.current),
              rewardAmount: finishedInTime ? REWARD_AMOUNT : 0,
              difficulty,
            });
          }
        }
      } catch (err) {
        console.error("auto reward/mint error", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameWon]);

  const handleCardClick = (index: number) => {
    if (!gameStarted) setGameStarted(true);
    if (gameWon) return;
    if (timeLeftRef.current === 0) {
      // allow play but no rewards; but user will see time-up modal
      return;
    }
    if (flippedIndices.length >= 2) return;
    if (cards[index].flipped || cards[index].matched) return;

    setCards((prev) => {
      const copy = prev.map((c) => ({ ...c }));
      copy[index].flipped = true;
      return copy;
    });
    setFlippedIndices((f) => [...f, index]);
  };

  const resetBoard = (goHome = false) => {
    setCards(createDeck());
    setFlippedIndices([]);
    setMoves(0);
    setMatches(0);
    setGameWon(false);
    setTimeLeft(TOTAL_TIME);
    setGameStarted(false);
    setRewardClaimed(false);
    setNftAssetId(null);
    setShowOptInPrompt(false);
    setShowWinModal(false);
    setShowTimeUpModal(false);
    if (goHome) navigate("/");
  };

  const handleOptInAndReceiveNFT = async () => {
    if (!nftAssetId || !accountAddress) {
      toast({ title: "Missing", description: "NFT not ready or wallet not connected.", variant: "destructive" });
      return;
    }
    try {
      const ok = await optInToAsset(nftAssetId);
      if (!ok) {
        toast({ title: "Please opt-in", description: "Approve the opt-in in your wallet then press the button again.", variant: "destructive" });
        return;
      }
      const transferOk = await transferNFT(accountAddress, nftAssetId);
      if (transferOk) {
        setShowOptInPrompt(false);
        toast({ title: "NFT Transferred", description: "Check your wallet for the achievement NFT.", variant: "default" });
      } else {
        toast({ title: "Transfer failed", description: "NFT transfer failed.", variant: "destructive" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Unexpected error with NFT opt-in/transfer.", variant: "destructive" });
    }
  };

  // format mm:ss
  const formatTime = (s: number) => {
    const mm = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg,#071025 0%, #041022 100%)", padding: 24 }}>
      <style>{`
        .card-container {
          width: 760px;
          max-width: 92vw;
          border-radius: 12px;
          padding: 18px;
          background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
          box-shadow: 0 12px 40px rgba(2,6,23,0.6);
          border: 1px solid rgba(167,139,250,0.06);
          backdrop-filter: blur(6px) saturate(120%);
        }
        .compact {
          max-width: 720px;
          margin: 0 auto;
        }
        .deck-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        .card-outer { perspective: 900px; width: 100%; }
        .card-inner { position: relative; padding-top: 100%; transform-style: preserve-3d; transition: transform 420ms cubic-bezier(.2,.9,.2,1); }
        .card-inner.flipped { transform: rotateY(180deg); }
        .card-face { position: absolute; inset: 0; border-radius: 10px; backface-visibility: hidden; display:flex; align-items:center; justify-content:center; font-weight:700; }
        .card-back {
          background-image: url("${cardsIcon}");
          background-size: cover;
          background-position: center;
          box-shadow: 0 8px 24px rgba(2,6,23,0.6);
          border: 1px solid rgba(255,255,255,0.04);
        }
        .card-front {
          background: linear-gradient(180deg,#fff,#f7fafc);
          transform: rotateY(180deg);
          color: #0f172a;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          border: 1px solid rgba(2,6,23,0.06);
        }
        .suit-heart { color: #e11d48; text-shadow: 0 6px 18px rgba(225,29,72,0.08); }
        .suit-diamond { color: #fb923c; text-shadow: 0 6px 18px rgba(251,146,60,0.06); }
        .suit-spade, .suit-club { color: #0b1220; }

        /* small header / hud */
        .hud { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom: 12px; }
        .hud-left { display:flex; gap:12px; align-items:center; }
        .hud-right { display:flex; gap:10px; align-items:center; }

        /* transparent win modal */
        .win-modal-backdrop { position: fixed; inset: 0; display:flex; align-items:center; justify-content:center; z-index:120; background: rgba(2,6,23,0.55); }
        .win-modal {
          width: 420px; border-radius: 12px; padding: 20px;
          background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02));
          border: 1px solid rgba(167,139,250,0.08);
          backdrop-filter: blur(6px);
          color: #eaf6ff;
          text-align:center;
          box-shadow: 0 30px 80px rgba(2,6,23,0.6);
        }

        /* transparent time-up modal (same visual) */
        .timeup-modal-backdrop { position: fixed; inset: 0; display:flex; align-items:center; justify-content:center; z-index:120; background: rgba(2,6,23,0.55); }
        .timeup-modal {
          width: 380px; border-radius: 12px; padding: 18px;
          background: linear-gradient(180deg, rgba(0,0,0,0.45), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.04);
          backdrop-filter: blur(6px);
          color: #fff;
          text-align:center;
          box-shadow: 0 20px 60px rgba(2,6,23,0.6);
        }
      `}</style>

      <div className="card-container compact">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>Card Master</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Finish within {TOTAL_TIME}s to get {REWARD_AMOUNT} ALGO & NFT</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Time</div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{formatTime(timeLeft)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Moves</div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{moves}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Matches</div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{matches}/8</div>
            </div>
          </div>
        </div>

        <Card className="game-card" style={{ padding: 14 }}>
          <div className="deck-grid">
            {cards.map((card, idx) => {
              const flipped = card.flipped || card.matched;
              return (
                <div key={card.id} className="card-outer" onClick={() => handleCardClick(idx)} style={{ cursor: card.matched ? "default" : "pointer" }}>
                  <div className={`card-inner ${flipped ? "flipped" : ""}`}>
                    <div className="card-face card-back" />
                    <div className="card-face card-front">
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }} className={
                          card.suit === "♥" ? "suit-heart" : card.suit === "♦" ? "suit-diamond" : (card.suit === "♠" ? "suit-spade" : "suit-club")
                        }>
                          {card.suit}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 900 }}>{card.value}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>ALGO reward: {REWARD_AMOUNT} (if finished within {TOTAL_TIME}s)</div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button size="sm" onClick={() => resetBoard(false)}>Restart</Button>
              <Button size="sm" variant="outline" onClick={() => resetBoard(true)}>Home</Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Win modal — transparent, auto-sent ALGO; Play Again navigates home */}
      {showWinModal && (
        <div className="win-modal-backdrop" role="dialog" aria-modal="true">
          <div className="win-modal">
            <div style={{ fontSize: 20, fontWeight: 900 }}>You Won! 🎉</div>
            <div style={{ marginTop: 8, color: "rgba(255,255,255,0.8)" }}>Completed in {moves} moves • {formatTime(timeLeft)} left</div>

            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 14, marginBottom: 8 }}>
                {rewardClaimed ? `${REWARD_AMOUNT} ALGO has been sent to your wallet.` : (timeLeft > 0 ? `Sending ${REWARD_AMOUNT} ALGO to your wallet...` : `No ALGO (timer expired).`)}
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 6 }}>
                {showOptInPrompt && nftAssetId ? (
                  <Button onClick={handleOptInAndReceiveNFT}>Opt-in & Receive NFT</Button>
                ) : (
                  <Button variant="outline" disabled>NFT Preparing...</Button>
                )}

                <Button variant="ghost" onClick={() => resetBoard(true)}>
                  Play Again
                </Button>
              </div>

              <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                Note: ALGO is automatically sent only if you finish before the timer ends.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time-up modal: only Play Again (navigates home), no reward */}
      {showTimeUpModal && (
        <div className="timeup-modal-backdrop" role="dialog" aria-modal="true">
          <div className="timeup-modal">
            <div style={{ fontSize: 20, fontWeight: 900 }}>Better luck next time</div>
            <div style={{ marginTop: 8 }}>You're out of time — no rewards this round.</div>

            <div style={{ marginTop: 16 }}>
              <Button variant="ghost" onClick={() => resetBoard(true)}>
                Play Again
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// helper: format time mm:ss
function formatTime(s: number) {
  const mm = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}
