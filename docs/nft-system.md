
# 🖼️ AlgoArena – NFT Achievement System

AlgoArena uses **ARC-3 compliant NFTs** to reward players for skill, milestones, and tournament performance.  
These NFTs represent **true digital ownership**, stored permanently on the Algorand blockchain.

Below is the full NFT system in the same expandable format.

---

# 🏆 NFT Categories
<details>
<summary><h3>🟦 Puzzle Achievement NFTs</h3></summary>

- Awarded for high scores in games like Sudoku, 2048, Block Puzzle  
- Tiered NFT rewards (Bronze → Silver → Gold → Legendary)  
- Includes stats such as score, time, streak count  
</details>

<details>
<summary><h3>🟥 Arcade Performance NFTs</h3></summary>

- Rewards in Bubble Shooter, Speed Runner  
- Perfect round NFTs for flawless gameplay  
- Time, accuracy, and combo-based badges  
</details>

<details>
<summary><h3>⭕ Strategy Skill NFTs</h3></summary>

- Tic Tac Toe “Unbeatable Player” NFT  
- Connect4 “Grandmaster” NFT  
- Win streak and difficulty-based rarities  
</details>

<details>
<summary><h3>🏅 Tournament Trophy NFTs</h3></summary>

- Daily/Weekly/Seasonal tournament winners  
- Rare trophy NFTs with timestamp + game stats  
- Limited edition collectible designs  
</details>

---

# 📦 NFT Metadata (ARC-3)
<details>
<summary><h3>📜 JSON Metadata Example</h3></summary>

```json
{
  "name": "AlgoArena Champion - Sudoku",
  "description": "Awarded for achieving a top-tier Sudoku score.",
  "image": "ipfs://bafybeiexample/image.png",
  "image_mimetype": "image/png",
  "properties": {
    "game": "Sudoku",
    "score": 1500,
    "rank": "Legendary",
    "time": "00:32",
    "rarity": "Ultra Rare",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
````

</details>

---

# 📂 Storage & Delivery

<details>
<summary><h3>📡 IPFS Storage</h3></summary>

* All NFT images + metadata stored on **IPFS**
* Ensures immutability and decentralization
* Supports Pinata, NFT.Storage, or Supabase IPFS

</details>

<details>
<summary><h3>🚀 NFT Reward Flow</h3></summary>

```
1. Player completes achievement
2. Backend validates using Supabase Edge Function
3. Calls smart contract → nft_reward()
4. Contract transfers NFT via inner transaction
5. Wallet receives NFT instantly (Pera/Defly/Lute)
```

</details>

---

# 🔐 Smart Contract NFT Logic

<details>
<summary><h3>🧪 Core Methods</h3></summary>

```python
def nft_reward(receiver, asset_id):
    # Transfers 1 unit of an NFT to player

def asset_opt_in(asset):
    # App opts-in to NFT asset
```

* Admin-only execution
* Atomic inner transactions
* Validates asset ID before transfer

</details>

---

# 📱 Wallet Compatibility

<details>
<summary><h3>✔ Supported Wallets & Marketplaces</h3></summary>

**Wallets:**

* Pera Wallet
* Defly Wallet
* Lute Wallet

**Marketplaces:**

* Rand Gallery
* Shufl
* Exa Market
* ASA Explorer

NFTs show immediately once minted.

</details>

---

# 🔮 Future NFT Expansions

<details>
<summary><h3>🌟 Planned NFT Features</h3></summary>

* Dynamic NFTs (stats update on-chain)
* Soulbound achievements (non-transferable)
* Seasonal limited-edition NFT collections
* In-app NFT gallery for player profiles
* Marketplace inside AlgoArena

</details>

---

# 📌 Summary

AlgoArena NFTs provide:

* **True digital ownership**
* **ARC-3 compliant metadata**
* **Secure on-chain achievement verification**
* **IPFS-backed decentralization**
* **Smooth wallet visibility and tradeability**
* **A scalable achievement ecosystem for all games**

NFTs form a central part of the AlgoArena reward identity system.

