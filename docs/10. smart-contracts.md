# 🔐 AlgoArena – Smart Contracts Documentation

AlgoArena uses Algorand Layer-1 smart contracts written in **PyTeal** to automate ALGO rewards, NFT transfers, admin control, and contract state management.  
These contracts are built using the **ARC-4 ABI standard** for compatibility and easy front-end interaction.

---

# 🧠 1. Overview of Reward Contract

### **Main Contract:** `AlgoArenaRewardContract`

This is the core smart contract responsible for:
- Managing admin access
- Pausing/unpausing the system
- Sending ALGO rewards to players
- Rewarding NFTs (ARC-3/ARC-19)
- Handling ASA opt-ins for the contract
- Exposing contract metadata & state

The contract uses safe **inner transactions** to perform ALGO/NFT transfers.

---

# 📜 2. Contract Methods

Below are the **important methods** in the reward contract:

---

## 🔷 **Admin Management**

### `set_admin(new_admin)`
Assigns a new admin who is authorized to execute restricted functions.

---

## ⏸️ **Contract State Controls**

### `pause()`
Pauses all reward operations.

### `unpause()`
Reactivates the contract after pausing.

Used for:
- Maintenance  
- Emergency stop  
- Security patches  

---

## 💸 **ALGO Reward Distribution**

### `reward_algo(player, amount)`
Sends ALGO to a player using an **inner payment transaction**.

Key rules:
- Only admin can initiate  
- Contract must not be paused  
- Amount must be > 0  

---

## 🖼️ **NFT Reward Mechanism**

### `nft_reward(receiver, asset_id)`
Transfers **1 unit** of an ARC-3/ARC-19 NFT to the receiver.

Supports:
- Achievement NFTs  
- Collectible badges  
- Game milestone rewards  

---

## 🧩 **Asset Opt-In**

### `asset_opt_in(asset)`
Allows the contract to **opt-in to any ASA**, so it can hold and transfer NFTs or tokens.

---

## 📘 **Read-Only Methods**

### `get_info()`
Returns:
- Admin address  
- Pause status  
- Contract name  

### `is_paused()`
Returns:
- `0` → active  
- `1` → paused  

Used by the frontend for quick UI updates.

---

# 🛡️ 3. Security Features

AlgoArena contracts include multiple safety mechanisms:

### ✓ Admin-only restricted methods  
Prevents unauthorized ALGO/NFT distribution.

### ✓ Pause control  
Allows administrators to temporarily halt contract actions.

### ✓ Inner transactions  
Ensures verified, atomic ALGO/NFT transfers.

### ✓ Input validation  
Rejects invalid amounts, invalid asset IDs, uninitialized states.

### ✓ ARC-4 ABI compliance  
Safe for wallet connectors, frontends, and SDK integration.

---

# 🧱 4. Standards & Integrations

### **ARC-4** – ABI interface standard  
Used for frontend → contract communication.

### **ARC-3** – NFT metadata standard  
Used for achievement NFTs.

### **ASA (Algorand Standard Assets)**  
Used for future game-specific tokens or reward tokens.

---

# 🧪 5. Testing the Contract

You can test the contract using:

- AlgoKit LocalNet  
- Python + algosdk  
- `pytest` for contract-level tests  
- Wallet transactions via Pera Wallet TestNet  

Testing Includes:
- Reward distribution  
- NFT transfers  
- Contract pause/unpause  
- Admin access control  

---

# 📌 Summary

The AlgoArena smart contract system is designed to be:
- **Secure** (admin restrictions, validation)  
- **Fast** (Algorand’s instant finality)  
- **Flexible** (ALGO + NFT rewards)  
- **Extensible** (future ASAs, staking models)  
- **Transparent** (on-chain reward logic)  

These contracts form the **engine** behind AlgoArena’s reward system, ensuring trustless and fair distribution for all players.

