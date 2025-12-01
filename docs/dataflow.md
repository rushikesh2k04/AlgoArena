# 🔄 AlgoArena – Data Flow

AlgoArena uses a hybrid data flow where gameplay is off-chain, and rewards are on-chain.  
This ensures fast performance while maintaining full transparency for rewards.

---

# 🔶 1. Overview

| Flow Type | Purpose |
|----------|---------|
| Off-chain | Gameplay, score handling, caching |
| On-chain | Rewards, NFTs, admin controls |

---

# 🧭 2. Full Data Flow

### **1. Player Connects Wallet**
- Pera / Defly / Lute wallet connection  
- WalletConnect session opens  

### **2. Player Starts Game**
- Game runs fully on frontend (React + Canvas)  
- No gas cost during gameplay  

### **3. Score is Submitted**
- Frontend → Supabase Edge Function  
- Score is validated  
- Anti-cheat + timestamp checks  

### **4. Backend Triggers Smart Contract**
- Calls reward_algo() or nft_reward()  
- Contract sends ALGO / NFT to the player  

### **5. Wallet Receives Assets**
- Player gets instant ALGO or NFT  
- Frontend updates UI + leaderboard  

---

# 📌 Summary

AlgoArena keeps gameplay fast (off-chain), while rewards remain **100% on-chain** for trust and transparency.
