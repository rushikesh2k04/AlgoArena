# 🖼️ AlgoArena – NFT Achievement System (ARC-3)

AlgoArena uses **ARC-3 NFTs** to reward players with permanent, verifiable, on-chain badges based on their performance, achievements, milestones, and tournament wins.  
This document explains how the NFT system works inside the platform.

---

# 🧩 1. Introduction to Achievement NFTs

AlgoArena awards players with **NFT-based achievements**, representing:
- High scores  
- Level completions  
- Fastest times  
- Tournament wins  
- Perfect streaks  
- Seasonal event milestones  

These NFTs:
- Are permanently stored on-chain  
- Use the **ARC-3 standard**  
- Are fully tradeable  
- Can be viewed in any Algorand-compatible wallet  
- Have IPFS metadata for decentralization  

---

# 🏛️ 2. NFT Standard: ARC-3

AlgoArena follows **ARC-3 (Algorand Request for Comments – NFT Metadata Standard)**, the official Algorand format for NFTs.

### ARC-3 Benefits:
- Clear JSON metadata format  
- Official wallet compatibility  
- IPFS support  
- Flexible properties for game stats  

### ARC-3 Metadata Fields Used:
- `name`  
- `description`  
- `image` (IPFS)  
- `properties` (game-specific stats)  
- `image_integrity`  
- `image_mimetype`  

---

# 📦 3. NFT Metadata Structure (Example)

Below is a real example of AlgoArena’s NFT structure.

```json
{
  "name": "AlgoArena Champion - Sudoku",
  "description": "Awarded for achieving a superior performance in Sudoku.",
  "image": "ipfs://bafybeieexample123/image.png",
  "image_mimetype": "image/png",
  "properties": {
    "game": "Sudoku",
    "score": 1500,
    "rank": "Legendary",
    "completion_time": "00:32",
    "timestamp": "2025-01-15T10:30:00Z",
    "rarity": "Ultra Rare"
  }
}


📂 4. IPFS Storage

All NFT images + metadata are stored on IPFS (InterPlanetary File System) to ensure:

Decentralization

Immutability

Censorship resistance

Long-term data availability

AlgoArena uses:

Pinata IPFS

or NFT.Storage

or Supabase + IPFS integration

🛠️ 5. NFT Reward Flow (Step-by-Step)

Below is the complete lifecycle of awarding an NFT to a player.

1. Player achieves a milestone inside a game
2. Frontend sends a request → Supabase Edge Function
3. Edge Function validates achievement (off-chain logic)
4. Edge Function invokes the smart contract → nft_reward()
5. Contract transfers the NFT to player's wallet using inner transactions
6. Frontend fetches success status and updates user profile
7. Player can now view NFT in Pera/Defly/Lute Wallet


This combines off-chain verification and on-chain reward delivery.

🔐 6. Smart Contract Integration

Primary NFT functions used in AlgoArena:

def nft_reward(receiver, asset_id):
    # Transfers 1 unit of an ARC-3 NFT to player

def asset_opt_in(asset):
    # Contract opts-in to hold/mint NFT assets

Features:

Admin-only NFT distribution

Inner transactions ensure atomic transfers

Validation prevents invalid asset IDs

🧱 7. Achievement Categories

AlgoArena supports four main categories of achievement NFTs:

🟦 Puzzle Achievements

Sudoku Master

2048 Ultra Tile Achiever

Block Puzzle Streak Champion

🟥 Arcade Achievements

Bubble Shooter Perfect Clear

Speed Runner Survivor

⭕ Strategy Achievements

Tic Tac Toe Unbeatable

Connect 4 Grandmaster

🏆 Tournament Achievements

Daily Winner Badge

Weekly Champion Trophy

Seasonal Tournament NFT

Each category has rarity tiers:

Common

Rare

Epic

Legendary

Ultra Rare

🔄 8. NFT Claiming API (Backend Logic)

The backend edge function:

Validates gameplay or score

Prevents duplicate claims

Logs NFT claim history

Calls the reward contract

Example pseudo-code:

if valid_achievement:
    call_contract("nft_reward", receiver, asset_id)
    store_in_db(player, asset_id, timestamp)

🔍 9. NFT Viewing Compatibility

AlgoArena NFTs can be seen on:

✔ Pera Wallet
✔ Defly Wallet
✔ Lute Wallet
✔ Rand Gallery
✔ Shufl
✔ Exa Market
✔ Tinyman (if used as ASA)

Thanks to ARC-3 compliance.

🛡️ 10. Security Features
✓ Admin-Restricted Distribution

Only the authorized contract admin can mint/transfer NFTs.

✓ Opt-In Requirement

Receivers must opt-in before receiving NFTs.

✓ Inner Transactions

Guarantees safe, atomic transfer.

✓ Metadata Integrity

IPFS hash anchors prevent tampering.

✓ Replay Protection

Backend prevents double-claims.

🚀 11. Future NFT Roadmap

Planned enhancements include:

Dynamic NFTs (stats update over time)

Soulbound achievement NFTs (non-transferable)

Tournament Trophy NFTs with embedded prize history

Multi-chain NFT exploration

NFT marketplace integration

📌 Summary

The NFT system in AlgoArena provides:

On-chain achievements

ARC-3 standard compliance

Scalability for multiple games

IPFS storage for metadata

Secure, verifiable ownership

Smooth wallet compatibility

Extensible design for future NFT-based game mechanics
