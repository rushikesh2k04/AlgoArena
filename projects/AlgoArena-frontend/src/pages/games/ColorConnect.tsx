import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
// adjust these relative imports to your project structure
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { usePeraWallet } from "../../hooks/usePeraWallet";
import { claimReward } from "../../utils/algoReward";
import { mintGameNFT, transferNFT } from "../../utils/nftReward";
import rouletteImg from "../../assets/roulette-ref.png";
import Confetti from "react-confetti";
import { motion } from "framer-motion";

// CONFIG (unchanged)
const TOTAL_SPINS = 3;
const ALGO_PER_WIN = 5;
const SLOT_COUNT = 37; // 0..36
const DEG_PER_SLOT = 360 / SLOT_COUNT;

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function isRed(n: number) {
  const reds = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
  return reds.has(n);
}
function playTone(freq = 440, dur = 0.08, vol = 0.05) {
  try {
    const ctx = new (window.AudioContext || window.AudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    setTimeout(() => { o.stop(); ctx.close(); }, dur * 1000);
  } catch (e) {
    console.warn("playTone failed:", e);
  }
}

export default function RouletteRefWithNFT() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { accountAddress, optInToAsset } = usePeraWallet();

  const [selectedNumber, setSelectedNumber] = useState<number>(0);
  const [typedInput, setTypedInput] = useState<string>("");
  const [spins, setSpins] = useState<{bet:number,result:number,win:boolean}[]>([]);
  const [winsCount, setWinsCount] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [rewardClaimed, setRewardClaimed] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);

  const [nftAssetId, setNftAssetId] = useState<number | null>(null);
  const [minting, setMinting] = useState<boolean>(false);
  const [showOptInPrompt, setShowOptInPrompt] = useState<boolean>(false);

  const wheelRef = useRef<HTMLImageElement | null>(null);
  const ballRef = useRef<HTMLDivElement | null>(null);
  const spinIndexRef = useRef<number>(0);

  // Auto-claim ALGO on game over (if wallet connected) — unchanged logic
  useEffect(() => {
    if (gameOver && !rewardClaimed && accountAddress) {
      const algos = Math.max(0, winsCount * ALGO_PER_WIN);
      if (algos > 0) {
        claimReward(accountAddress, algos)
          .then((ok) => {
            if (ok) {
              setRewardClaimed(true);
              toast({ title: "ALGO Claimed", description: `${algos} ALGO credited to your wallet.` });
            } else {
              toast({ title: "ALGO Claim", description: "Claim call returned false.", variant: "default" });
            }
          })
          .catch((e) => {
            console.error("claimReward failed", e);
            toast({ title: "ALGO Claim Failed", description: String(e), variant: "destructive" });
          });
      }
    }
  }, [gameOver, accountAddress, rewardClaimed, winsCount, toast]);

  const reset = () => {
    setSelectedNumber(0);
    setTypedInput("");
    setSpins([]);
    setWinsCount(0);
    setIsSpinning(false);
    setRewardClaimed(false);
    setGameOver(false);
    spinIndexRef.current = 0;
    setNftAssetId(null);
    setShowOptInPrompt(false);
    if (wheelRef.current) {
      wheelRef.current.style.transition = "none";
      wheelRef.current.style.transform = "rotate(0deg)";
    }
    if (ballRef.current) {
      ballRef.current.style.transition = "none";
      ballRef.current.style.transform = "rotate(0deg) translateY(-118px)";
    }
  };

  // spin (logic unchanged)
  const spin = async () => {
    if (isSpinning || gameOver) return;
    if (spinIndexRef.current >= TOTAL_SPINS) return;

    setIsSpinning(true);
    if (!muted) playTone(380, 0.12, 0.06);

    const duration = 1000 + Math.floor(Math.random() * 800);
    const result = randInt(0, 36);

    if (wheelRef.current) {
      const rounds = 6 + Math.floor(Math.random() * 6);
      const targetDegWheel = rounds * 360 + result * DEG_PER_SLOT + (Math.random() * (DEG_PER_SLOT) - DEG_PER_SLOT / 2);
      wheelRef.current.style.transition = `transform ${duration}ms cubic-bezier(.17,.67,.5,1)`;
      wheelRef.current.style.transform = `rotate(${targetDegWheel}deg)`;
    }

    if (ballRef.current) {
      const roundsBall = 8 + Math.floor(Math.random() * 6);
      const ballLandingDeg = -(roundsBall * 360 + result * DEG_PER_SLOT + (Math.random() * (DEG_PER_SLOT) - DEG_PER_SLOT / 2));
      ballRef.current.style.transition = `transform ${duration + 120}ms cubic-bezier(.2,.9,.3,1)`;
      ballRef.current.style.transform = `rotate(${ballLandingDeg}deg) translateY(-118px)`;
    }

    await new Promise((res) => setTimeout(res, duration + 140));

    const win = (result === Number(selectedNumber));
    const spinRecord = { bet: selectedNumber, result, win };
    setSpins((s) => [...s, spinRecord]);
    if (win) {
      setWinsCount((w) => w + 1);
      if (!muted) playTone(900, 0.08, 0.06);
      toast({ title: "Win!", description: `Result: ${result}`, variant: "default" });
    } else {
      if (!muted) playTone(220, 0.12, 0.05);
      toast({ title: "No Win", description: `Result: ${result}`, variant: "default" });
    }

    spinIndexRef.current += 1;

    if (wheelRef.current) {
      setTimeout(() => {
        if (wheelRef.current) {
          wheelRef.current.style.transition = "none";
          wheelRef.current.style.transform = "rotate(0deg)";
        }
      }, 80);
    }
    if (ballRef.current) {
      setTimeout(() => {
        if (ballRef.current) {
          ballRef.current.style.transition = "none";
          ballRef.current.style.transform = "rotate(0deg) translateY(-118px)";
        }
      }, 100);
    }

    setIsSpinning(false);

    if (spinIndexRef.current >= TOTAL_SPINS) {
      finishGame();
    }
  };

  const finishGame = () => {
    setGameOver(true);
    const algos = Math.max(0, winsCount * ALGO_PER_WIN);
    if (algos > 0) {
      toast({ title: "You Earned ALGO!", description: `Prize: ${algos} ALGO • Wins: ${winsCount}/${TOTAL_SPINS}`, variant: "default" });
    } else {
      toast({ title: "Round Complete", description: `Wins: ${winsCount}/${TOTAL_SPINS}`, variant: "default" });
    }
  };

  // mint NFT (unchanged)
  const handleGenerateNFT = async () => {
    if (!accountAddress) {
      toast({ title: "Connect Wallet", description: "Please connect your wallet to mint an NFT.", variant: "destructive" });
      return;
    }
    if (minting) return;
    setMinting(true);
    const matchId = `roulette-${Date.now()}`;
    try {
      toast({ title: "Minting NFT...", description: "Please wait — this may prompt your wallet." });
      const difficultyLabel = `wins-${winsCount}`;
      const result = await mintGameNFT(accountAddress, "Roulette Round", winsCount, rouletteImg, matchId, difficultyLabel);
      if (result && result.success && result.assetId) {
        setNftAssetId(result.assetId);
        setShowOptInPrompt(true);
        toast({ title: "NFT Created", description: `Asset ID: ${result.assetId}. Opt-in to receive it.` });
      } else {
        toast({ title: "Mint failed", description: result?.error || "Unknown error", variant: "destructive" });
        console.error("mintGameNFT returned:", result);
      }
    } catch (err) {
      console.error("mintGameNFT errored:", err);
      toast({ title: "Mint Error", description: String(err), variant: "destructive" });
    } finally {
      setMinting(false);
    }
  };

  // opt-in and receive (unchanged)
  const handleOptInAndReceiveNFT = async () => {
    if (!nftAssetId) {
      toast({ title: "No NFT", description: "No NFT asset ID available.", variant: "destructive" });
      return;
    }
    if (!accountAddress) {
      toast({ title: "Wallet Required", description: "Please connect your wallet to opt-in.", variant: "destructive" });
      return;
    }
    try {
      toast({ title: "Opting-in...", description: "Wallet will prompt to opt-in to the asset." });
      const optOk = await optInToAsset(nftAssetId);
      if (!optOk) {
        toast({ title: "Opt-in failed", description: "User declined or opt-in failed.", variant: "destructive" });
        return;
      }
      toast({ title: "Opt-in successful", description: "Now transferring NFT..." });

      const transferOk = await transferNFT(accountAddress, nftAssetId);
      if (transferOk) {
        toast({ title: "NFT Received!", description: "Your achievement NFT was transferred to your wallet.", variant: "default" });
        setShowOptInPrompt(false);
      } else {
        toast({ title: "Transfer failed", description: "Transfer transaction failed.", variant: "destructive" });
      }
    } catch (err) {
      console.error("opt-in/transfer error:", err);
      toast({ title: "Transfer Error", description: String(err), variant: "destructive" });
    }
  };

  // keyboard handler (unchanged)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (gameOver) return;
      if (/^[0-9]$/.test(e.key)) {
        setTypedInput((t) => {
          const next = (t + e.key).slice(0, 2);
          const num = Number(next);
          if (Number.isNaN(num)) return "";
          if (num > 36) return e.key;
          setSelectedNumber(num);
          return next;
        });
      } else if (e.key === "Enter") {
        if (typedInput !== "") {
          const num = Number(typedInput);
          if (!Number.isNaN(num) && num >= 0 && num <= 36) setSelectedNumber(num);
          setTypedInput("");
        }
      } else if ((e .code === "Space")) {
        e.preventDefault();
        spin();
      } else if (e.key.toLowerCase() === "r") {
        reset();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [typedInput, gameOver, selectedNumber]);

  const numberClass = (n: number) => {
    const picked = Number(selectedNumber) === n;
    const base = "w-10 h-10 flex items-center justify-center rounded text-xs font-semibold transition-transform";
    const colorClass = n === 0 ? "bg-green-400 text-black" : isRed(n) ? "bg-red-500 text-white" : "bg-slate-900 text-white";
    return `${base} ${colorClass} ${picked ? "ring-4 ring-yellow-400 scale-105" : "hover:scale-105"}`;
  };

  return (
    <div style={{
      minHeight: "100vh",
      // new neon background: layered radial + linear gradients
      background: `radial-gradient(600px 400px at 10% 10%, rgba(0,255,200,0.06), transparent 6%),
                   radial-gradient(500px 360px at 90% 80%, rgba(140,80,255,0.06), transparent 6%),
                   linear-gradient(180deg, #00111a 0%, #031026 40%, #0b1b2b 100%)`,
      padding: 40,
      color: "#e6fff8",
      fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial"
    }}>
      <style>{`
        /* small animation for neon glow */
        @keyframes neonPulse {
          0% { box-shadow: 0 6px 18px rgba(0,255,200,0.06); }
          50% { box-shadow: 0 18px 48px rgba(0,255,200,0.12); transform: translateY(-2px); }
          100% { box-shadow: 0 6px 18px rgba(0,255,200,0.06); transform: translateY(0); }
        }
        .neon-btn { animation: neonPulse 2.6s ease-in-out infinite; }
        .blurred {
          filter: blur(6px) saturate(110%);
          transition: filter .35s ease;
          pointer-events: none;
          user-select: none;
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: 0.3 }}>Roulette — Neon Table</h1>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(230,255,248,0.75)" }}>Pick a number (0–36). 3 spins per round. Each win = {ALGO_PER_WIN} ALGO.</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ background: "linear-gradient(90deg,#001f0f,#07321a)", padding: "6px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.06)" }}>
              Wins: <strong style={{ marginLeft: 6 }}>{winsCount}/{TOTAL_SPINS}</strong>
            </div>
            <Button variant="ghost" onClick={() => setMuted((m) => !m)}>{muted ? "🔇" : "🔊"}</Button>
            <Button variant="secondary" onClick={() => reset()}><RefreshCw /> Reset</Button>
          </div>
        </div>

        {/* main content -- will be blurred when modal open */}
        <div className={gameOver ? "blurred" : ""} aria-hidden={gameOver}>
          <Card className="p-6" style={{
            padding: 18,
            borderRadius: 22,
            background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
            border: "1px solid rgba(0,255,190,0.08)",
            boxShadow: "0 10px 40px rgba(0,255,190,0.04)",
          }}>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {/* wheel + controls */}
              <div style={{ flex: "1 1 420px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{ position: "relative", width: 340, height: 340 }}>
                  <img
                    ref={wheelRef}
                    src={rouletteImg}
                    alt="Roulette wheel"
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", boxShadow: "0 18px 48px rgba(0,0,0,0.6)" }}
                  />
                  <div
                    ref={ballRef}
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%) rotate(0deg) translateY(-118px)",
                      transformOrigin: "center center",
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "radial-gradient(circle at 25% 25%, #fff, #e0e6e3 40%, #c4d3cf 70%)",
                      boxShadow: "0 3px 8px rgba(0,0,0,0.5)",
                    }}
                  />
                  <div style={{ position: "absolute", left: "50%", top: -8, transform: "translateX(-50%)" }}>
                    <div style={{ width: 0, height: 0, borderLeft: "12px solid transparent", borderRight: "12px solid transparent", borderBottom: "22px solid rgba(255,255,255,0.92)" }} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <Button className="neon-btn" onClick={() => spin()} disabled={isSpinning || gameOver} >
                    {isSpinning ? "Spinning..." : "Spin"}
                  </Button>
                  <Button variant="outline" onClick={() => reset()}>Reset</Button>
                </div>

                <div style={{ fontSize: 12, color: "rgba(230,255,248,0.75)", marginTop: 6 }}>
                  Keyboard: type digits 0–36 then Enter to pick; Space to spin; R to reset
                </div>
              </div>

              {/* number selection & history */}
              <div style={{ flex: "1 1 420px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Choose number</h3>
                  <div style={{ fontSize: 14, color: "rgba(230,255,248,0.85)" }}>Selected: <strong style={{ marginLeft: 6 }}>{selectedNumber}</strong></div>
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(6, 1fr)",
                  gap: 8,
                  marginBottom: 12
                }}>
                  {Array.from({ length: 37 }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedNumber(i)}
                      style={{
                        width: "100%",
                        height: 40,
                        borderRadius: 8,
                        fontWeight: 700,
                        cursor: "pointer",
                        border: selectedNumber === i ? "2px solid #ffeb3b" : "1px solid rgba(255,255,255,0.06)",
                        background: i === 0 ? "#6ee7b7" : (isRed(i) ? "#ef4444" : "#0f172a"),
                        color: i === 0 ? "#041014" : "#fff",
                        boxShadow: selectedNumber === i ? "0 6px 18px rgba(255,235,59,0.12)" : "none",
                        transition: "transform .12s ease",
                      }}
                      disabled={isSpinning}
                      title={`Bet on ${i}`}
                    >
                      {i}
                    </button>
                  ))}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Spins</h4>
                  <div style={{ marginTop: 8, maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                    {spins.length === 0 && <div style={{ color: "rgba(230,255,248,0.6)" }}>No spins yet</div>}
                    {spins.map((s, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(90deg, rgba(255,255,255,0.02), rgba(0,0,0,0.03))", padding: 8, borderRadius: 10 }}>
                        <div style={{ fontSize: 13 }}>Spin {idx + 1}: <strong>{s.result}</strong></div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: s.win ? "#4ade80" : "#fb7185" }}>{s.win ? "WIN" : "LOSE"}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Potential reward</h4>
                  <div style={{ marginTop: 8, fontSize: 13 }}>Per win: <strong>{ALGO_PER_WIN} ALGO</strong></div>
                  <div style={{ marginTop: 6, fontSize: 18, fontWeight: 900 }}>{winsCount * ALGO_PER_WIN} <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(230,255,248,0.7)" }}>ALGO</span></div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* overlay + modal when gameOver */}
        {gameOver && (
          <>
            {/* full-screen blur overlay (applies backdrop blur visually) */}
            <div style={{
              position: "fixed",
              inset: 0,
              zIndex: 55,
              background: "rgba(2,6,23,0.45)",
              backdropFilter: "blur(6px) saturate(120%)",
            }} />

            {/* centered frosted modal */}
            <div style={{
              position: "fixed",
              inset: 0,
              zIndex: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}>
              <div style={{
                width: "min(760px, 96%)",
                padding: 22,
                borderRadius: 16,
                background: "linear-gradient(180deg, rgba(10,12,20,0.98), rgba(14,16,26,0.95))",
                border: "1px solid rgba(0,255,200,0.12)",
                boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
                color: "#eafff4",
                textAlign: "center"
              }}>
                <div>
                  {winsCount === 0 ? (
                    <>
                      <h2 style={{ fontSize: 30, marginBottom: 6, color: "#ff8aa2" }}>Oops — Better luck next time</h2>
                      <p style={{ margin: "6px 0 12px", color: "rgba(230,255,248,0.85)" }}>You didn't win any spins this round.</p>
                      <div style={{ marginTop: 16 }}>
                        <Button onClick={() => navigate("/")}>Play Again</Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {winsCount === TOTAL_SPINS && <Confetti numberOfPieces={250} />}
                      <h2 style={{ fontSize: 30, marginBottom: 6, color: "#7ef3a6" }}>You Won {winsCount * ALGO_PER_WIN} ALGO!</h2>
                      <p style={{ margin: "6px 0 10px", color: "rgba(230,255,248,0.85)" }}>Wins: {winsCount}/{TOTAL_SPINS} — ALGO reward {winsCount * ALGO_PER_WIN}</p>
                      <div style={{ marginBottom: 8, fontSize: 14, color: rewardClaimed ? "#bfffcf" : "rgba(230,255,248,0.75)" }}>
                        {rewardClaimed ? `ALGO sent to wallet.` : `Sending ALGO to your wallet...`}
                      </div>

                      <div style={{ marginTop: 14, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                        <Button onClick={() => handleGenerateNFT()} disabled={minting}>
                          {minting ? "Minting..." : "Generate NFT"}
                        </Button>

                        {nftAssetId && (
                          <Button variant="default" onClick={() => handleOptInAndReceiveNFT()}>
                            Opt-in & Receive NFT (Asset {nftAssetId})
                          </Button>
                        )}

                        <Button onClick={() => navigate("/")}>Play Again</Button>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ marginTop: 12, fontSize: 12, color: "rgba(230,255,248,0.7)" }}>
                  {winsCount === 0 ? "No rewards this round — try again!" : "ALGOs are auto-sent when the round finishes (if wallet connected)."}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
