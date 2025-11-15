# AlgoArena Smart Contract

Complete PyTeal smart contract implementation for AlgoArena gaming platform with rewards and NFT distribution.

## Features

✅ **Game Management**
- Create games with custom parameters (max players, entry fee, reward percentage)
- Players join by paying entry fees (held in escrow)
- Track player scores securely

✅ **Reward Distribution**
- Automatic ALGO distribution to top players
- NFT minting for achievements (ARC-3 compliant)
- Proportional reward splitting
- Treasury management

✅ **Security**
- Admin-only functions with signature verification
- Replay protection for score submissions
- Atomic transaction groups for payments
- Pause/unpause mechanism
- Box storage for scalability

## Architecture

### State Design

**Global State (10 uints, 5 bytes)**
- `admin`: Creator address
- `paused`: Contract pause status
- `total_games`: Number of games created
- `treasury`: Accumulated platform fees
- `default_reward_pct`: Default reward percentage

**Local State (5 uints, 3 bytes per player)**
- `player_games`: Games participated
- `player_score`: Current score
- `claimed`: Reward claim status

**Box Storage**
- Game data (scalable, off-chain)
- Avoids global state limits

## ABI Method Signatures

```
create_game(uint64,uint64,uint64,uint64)void
join_game(uint64,pay)void
submit_score(uint64,uint64)void
end_game_and_distribute(uint64,address[],uint64[])void
mint_reward_nft(address,string)uint64
claim_reward(uint64)void
set_params(uint64)void
pause()void
unpause()void
withdraw_fees(uint64)void
```

## Deployment

### Prerequisites

```bash
pip install py-algorand-sdk pyteal
```

### Get TestNet ALGO

1. Create account: https://testnet.algorand.network
2. Fund with dispenser: https://bank.testnet.algorand.network

### Deploy Contract

```bash
# Set your mnemonic
export ALGORAND_MINTER_MNEMONIC="your 25 word mnemonic here"

# Compile
python contracts/algoarena_contract.py

# Deploy
python contracts/deploy.py
```

### Example Interaction

```python
from interact import AlgoArenaClient

# Initialize
client = AlgoArenaClient(
    app_id=123456,  # Your deployed app ID
    player_mnemonic="player mnemonic"
)

# Opt in to contract
client.opt_in()

# Join game (0.1 ALGO entry fee)
client.join_game(game_id=1, entry_fee=100_000)

# Submit score
client.submit_score(game_id=1, score=2500)

# Claim reward
client.claim_reward(game_id=1)
```

## Integration with Frontend

### 1. Store Contract Address

Add to `.env`:
```
VITE_ALGOARENA_APP_ID=123456
VITE_ALGOARENA_APP_ADDRESS=ABC...XYZ
```

### 2. Use with Pera Wallet

```typescript
import { usePeraWallet } from '@/hooks/usePeraWallet';
import algosdk from 'algosdk';

const APP_ID = parseInt(import.meta.env.VITE_ALGOARENA_APP_ID);

// Join game transaction
const joinGame = async (gameId: number, entryFee: number) => {
  const suggestedParams = await algodClient.getTransactionParams().do();
  
  // Payment txn
  const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: accountAddress,
    to: algosdk.getApplicationAddress(APP_ID),
    amount: entryFee,
    suggestedParams
  });
  
  // App call txn
  const appArgs = [
    new Uint8Array(Buffer.from('join_game')),
    algosdk.encodeUint64(gameId)
  ];
  
  const appTxn = algosdk.makeApplicationNoOpTxnFromObject({
    from: accountAddress,
    appIndex: APP_ID,
    appArgs,
    suggestedParams
  });
  
  // Group atomically
  const txns = algosdk.assignGroupID([payTxn, appTxn]);
  
  // Sign with Pera Wallet
  const signedTxns = await peraWallet.signTransaction([txns]);
  
  // Send
  await algodClient.sendRawTransaction(signedTxns).do();
};
```

## Security Notes

### Implemented Protections

✅ **Replay Protection**
- Players can only submit scores once per game
- Local state tracks submission status

✅ **Signature Validation**
- Admin functions verify `Txn.sender() == admin`
- Payment transactions validated in atomic groups

✅ **Reentry Prevention**
- State updates before external calls
- Inner transactions for NFT minting

✅ **Atomic Operations**
- Payment + app call grouped atomically
- Distribution uses inner transactions

### Known Limitations

⚠️ **Box Storage Costs**
- Each game requires minimum balance increase
- Admin must fund contract adequately

⚠️ **Distribution Complexity**
- Winner selection done off-chain
- Contract validates but trusts admin input

⚠️ **NFT Metadata**
- Stored as URL (IPFS recommended)
- Contract doesn't validate metadata content

## Testing Checklist

- [ ] Deploy to TestNet
- [ ] Create test game
- [ ] Multiple players join
- [ ] Submit scores
- [ ] End game and distribute
- [ ] Mint NFTs
- [ ] Claim rewards
- [ ] Test pause/unpause
- [ ] Withdraw treasury
- [ ] Verify on explorer

## Resources

- [PyTeal Docs](https://pyteal.readthedocs.io/)
- [Algorand Developer Portal](https://developer.algorand.org/)
- [ARC-3 NFT Standard](https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0003.md)
- [TestNet Explorer](https://testnet.explorer.perawallet.app/)

## Support

For issues or questions:
- Review code comments in `algoarena_contract.py`
- Check deployment logs
- Test on TestNet before mainnet
- Verify transactions on explorer
