"""
AlgoArena Reward Contract Interaction
=====================================

Connect wallet and claim rewards from the smart contract
"""

import os
from algosdk import account, mnemonic
from algosdk.v2client import algod
from algosdk.transaction import (
    ApplicationCallTxn,
    OnComplete,
    wait_for_confirmation
)

ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

def get_client():
    return algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

class RewardClient:
    """Client for claiming rewards from AlgoArena contract"""
    
    def __init__(self, app_id: int, admin_mnemonic: str):
        self.client = get_client()
        self.app_id = app_id
        self.private_key = mnemonic.to_private_key(admin_mnemonic)
        self.address = account.address_from_private_key(self.private_key)
        self.app_address = algod.logic.get_application_address(app_id)
    
    def send_reward(self, player_address: str, reward_amount: int):
        """
        Send ALGO reward to player's connected wallet
        
        Args:
            player_address: Player's Algorand wallet address (connected wallet)
            reward_amount: Amount in microALGOs (1 ALGO = 1,000,000 microALGOs)
        
        Returns:
            Transaction ID
        """
        params = self.client.suggested_params()
        
        app_args = [
            b"reward",
            reward_amount.to_bytes(8, 'big')
        ]
        
        # Player address must be in accounts array (Txn.accounts[1] in contract)
        accounts = [player_address]
        
        txn = ApplicationCallTxn(
            sender=self.address,
            sp=params,
            index=self.app_id,
            on_complete=OnComplete.NoOpOC,
            app_args=app_args,
            accounts=accounts,
        )
        
        signed_txn = txn.sign(self.private_key)
        tx_id = self.client.send_transaction(signed_txn)
        wait_for_confirmation(self.client, tx_id, 4)
        
        print(f"✅ Sent {reward_amount / 1_000_000} ALGO to {player_address}")
        print(f"🔗 View transaction: https://testnet.explorer.perawallet.app/tx/{tx_id}")
        return tx_id
    
    def pause_contract(self):
        """Pause the contract (admin only)"""
        params = self.client.suggested_params()
        
        txn = ApplicationCallTxn(
            sender=self.address,
            sp=params,
            index=self.app_id,
            on_complete=OnComplete.NoOpOC,
            app_args=[b"pause"],
        )
        
        signed_txn = txn.sign(self.private_key)
        tx_id = self.client.send_transaction(signed_txn)
        wait_for_confirmation(self.client, tx_id, 4)
        
        print("⏸️ Contract paused")
        return tx_id
    
    def unpause_contract(self):
        """Unpause the contract (admin only)"""
        params = self.client.suggested_params()
        
        txn = ApplicationCallTxn(
            sender=self.address,
            sp=params,
            index=self.app_id,
            on_complete=OnComplete.NoOpOC,
            app_args=[b"unpause"],
        )
        
        signed_txn = txn.sign(self.private_key)
        tx_id = self.client.send_transaction(signed_txn)
        wait_for_confirmation(self.client, tx_id, 4)
        
        print("▶️ Contract unpaused")
        return tx_id
    
    def get_contract_balance(self):
        """Check contract's ALGO balance"""
        account_info = self.client.account_info(self.app_address)
        balance = account_info.get('amount', 0)
        print(f"💰 Contract balance: {balance / 1_000_000} ALGO")
        return balance


# Example usage
if __name__ == "__main__":
    print("=" * 60)
    print("AlgoArena Reward Distribution")
    print("=" * 60)
    print()
    
    APP_ID = int(os.getenv("ALGOARENA_APP_ID", "0"))
    ADMIN_MNEMONIC = os.getenv("ALGORAND_MINTER_MNEMONIC", "")
    
    if not APP_ID or not ADMIN_MNEMONIC:
        print("❌ Set ALGOARENA_APP_ID and ALGORAND_MINTER_MNEMONIC environment variables")
        exit(1)
    
    # Initialize client
    client = RewardClient(APP_ID, ADMIN_MNEMONIC)
    
    # Check contract balance
    client.get_contract_balance()
    
    # Example: Reward a player
    # Replace with actual player's connected wallet address
    PLAYER_WALLET = os.getenv("PLAYER_WALLET_ADDRESS", "")
    
    if PLAYER_WALLET:
        print(f"\n🎮 Sending reward to player...")
        client.send_reward(
            player_address=PLAYER_WALLET,
            reward_amount=100_000  # 0.1 ALGO reward
        )
    else:
        print("\n💡 To send a reward, set PLAYER_WALLET_ADDRESS environment variable")
        print("   Example: export PLAYER_WALLET_ADDRESS='PLAYER_ALGORAND_ADDRESS'")
        print("   Then run: python interact.py")
    
    print("\n✅ Interaction complete!")
