# 🖼️ AlgoArena – NFT Reward System

AlgoArena includes a simple, reliable NFT reward mechanism powered by the Algorand blockchain.  
Players receive an **ARC-3 NFT** after completing a verified task inside any game.  
The NFT is permanently stored on-chain and viewable in **Pera Wallet** and Algorand NFT explorers.

---

# 🏆 1. Overview

AlgoArena uses **single-achievement NFTs** to acknowledge player milestones.  
Unlike complex tiered NFT collections, AlgoArena focuses on:

- ✔ One NFT per completed task  
- ✔ Simple ARC-3 metadata  
- ✔ Fast and low-cost minting  
- ✔ Secure transfer using Algorand smart contracts  
- ✔ Instant visibility in Pera Wallet  

No rarity tiers, no multiple categories — just **clean achievement NFTs**.

---

# 🧩 2. How the NFT Reward Works

- Player completes a task (e.g., wins a game)

- Supabase Edge Function validates the completion

- Backend triggers the smart contract call → nft_reward()

- Smart contract transfers exactly 1 NFT to the player's wallet

- NFT appears instantly in Pera Wallet


This ensures:
- 🎯 100% fair and verifiable reward distribution  
- 🔐 No admin bypass or manipulation  
- ⚡ Extremely fast reward delivery  

---

# 📦 3. ARC-3 NFT Metadata Structure

AlgoArena NFTs follow the **ARC-3** standard (Algorand NFT standard).  
Here is the exact metadata format used:

```json
{
  "name": "AlgoArena Achievement",
  "description": "Awarded for completing a verified task in AlgoArena.",
  "image": "ipfs://YOUR_IMAGE_CID",
  "image_mimetype": "image/png",
  "properties": {
    "task": "Completed Task",
    "game": "Game Name",
    "timestamp": "2025-01-01T10:00:00Z",
    "reward_type": "Achievement NFT"
  }
}
```
### Editable Fields
* **task** → description of task completed
* **game** → which game generated the NFT
* **timestamp** → creation timestamp

---

## 🔐 4. Smart Contract NFT Logic
AlgoArena’s reward smart contract exposes simple NFT-transfer methods.

### Core NFT Methods
```python
def nft_reward(receiver, asset_id):
    # transfers 1 unit of an NFT to the player

def asset_opt_in(asset):
    # allows the contract to opt-in to the NFT ASA
```
### Security Features
* Only **admin** can call `nft_reward()`
* Contract checks **paused/unpaused** state
* Transfers use **inner transactions**
* Ensures **correct asset ID** is transferred

---

## 👛 5. Wallet Support
AlgoArena NFTs are compatible with all major Algorand wallets:

### Supported Wallets
* **Pera Wallet** (primary & recommended)
* Defly Wallet
* Lute Wallet

### Player Capabilities
* View NFTs in the wallet
* Send NFTs to others
* Trade NFTs on marketplaces

---

## 🛍️ 6. Marketplace Compatibility
AlgoArena NFTs work on popular Algorand NFT platforms:

* Rand Gallery
* Shufl
* Exa Market
* ASA Explorer

> **Note:** Because AlgoArena uses **ARC-3**, no custom integration is required.

---

## 🚀 7. NFT Flow in AlgoArena
**Game** → **Task Complete** → **Supabase Validate** → `nft_reward()` → **Pera Wallet**

* **Fully automated**
* **No manual approval needed**
* **Always on-chain**
* **Gas cost:** ≈ negligible (~0.002 ALGO)

---

## 🔮 8. Future NFT Enhancements
AlgoArena may introduce:

* **Dynamic NFTs** (stats update on-chain)
* **Seasonal collectible series**
* **Special event NFTs**
* **Soul-bound NFTs** (non-transferable achievements)
* **NFT gallery** inside player profiles

*(These are optional future expansions — not part of the current system.)*

---

## 📌 Summary
The **AlgoArena** NFT system is:

* ✔ **Simple** — one NFT per completed task
* ✔ **Secure** — enforced by Algorand smart contracts
* ✔ **Fast** — instant delivery after validation
* ✔ **On-Chain** — permanent and decentralized
* ✔ **Wallet-Friendly** — visible instantly in Pera Wallet
