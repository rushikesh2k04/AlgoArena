# 🔐 AlgoArena – Wallet Integration

AlgoArena supports secure, seamless wallet connectivity using WalletConnect v2.  
Players can connect using Pera, Defly, or Lute wallet to receive ALGO rewards, NFTs, and participate in tournaments.

---

# 🔶 1. Overview

AlgoArena uses a **multi-wallet integration system** for maximum accessibility.

| Wallet | Supported | Purpose |
|--------|-----------|----------|
| Pera Wallet | ✅ | Primary wallet for ALGO + NFTs |
| Defly Wallet | ✅ | Professional trading + gaming |
| Lute Wallet | ✅ | Lightweight browser-based wallet |

Wallet integration is **non-custodial**, meaning users always control their private keys.

---

# 🔌 2. How Wallet Connection Works

### **Purpose**
Enable secure login and blockchain interactions without email/password.

### **What It Enables**
- Connect wallet → start playing  
- Receive on-chain ALGO rewards  
- Receive ARC-3 NFTs  
- Submit transactions securely  
- View owned assets instantly  

### **Flow**
1. User clicks **Connect Wallet**  
2. QR code or in-app request via WalletConnect  
3. Session established (secure, encrypted)  
4. Player wallet address stored temporarily on frontend  
5. Player begins gameplay + reward interactions  

---

# 🧩 3. WalletConnect v2 Integration

AlgoArena uses **WalletConnect v2**, the latest version with enhanced security.

### **Key Features**
- Fast session initialization  
- Domain binding (prevents phishing)  
- Encrypted communication  
- Session persistence across reloads  
- Supports multiple Algorand providers  

### **Used Libraries**
- `@perawallet/connect`  
- `@blockshake/defly-connect`  
- `lute-connect`  

---

# 🧪 4. Frontend Integration (Simplified Code)

```ts
import { PeraWalletConnect } from "@perawallet/connect";

const peraWallet = new PeraWalletConnect();

// Connect wallet
const connectWallet = async () => {
  const accounts = await peraWallet.connect();
  setWalletAddress(accounts[0]);
};
```
# 📦 5. Transactions & Signing

### Purpose
Allow players to claim rewards, NFTs, or participate in tournaments.

### What Happens
1. **Frontend** prepares a transaction group
2. **Wallet preview** → user signs manually
3. **Smart contract** executes reward logic
4. **Player** instantly receives assets

### Transaction Types
- **ALGO transfer** (`reward_algo`)
- **NFT transfer** (`nft_reward`)
- **App call** (join tournament / claim reward)

---

# 👁️ 6. Viewing Assets After Rewards

After receiving rewards, players can see:

### In Wallet Apps
- **ALGO balance** (reward payouts)
- **NFT achievements** (ARC-3 assets)
- **Collectibles section** showing game badges

### In Explorers
- Pera Explorer
- Lora Blockchain Explorer
- ASA Explorer

---

# 🛡️ 7. Security Features

### Wallet-Level Security
- User must approve every transaction
- No private keys handled by AlgoArena
- WalletConnect encrypted sessions

### Platform-Level Security
- Admin-only contract methods
- Signed backend calls for rewards
- Anti-spam + rate limiting

### User-Level Protection
- No background transactions
- No auto-sign
- Transparent signing prompts
