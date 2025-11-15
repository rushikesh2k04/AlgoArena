"""
AlgoArena Reward Contract Deployment Script
===========================================

Deploys the simplified reward distribution contract to Algorand TestNet
"""

import os
import base64
from algosdk import account, mnemonic
from algosdk.v2client import algod
from algosdk.transaction import (
    ApplicationCreateTxn,
    PaymentTxn,
    StateSchema,
    OnComplete,
    wait_for_confirmation
)
from algoarena_contract import compile_contract, GLOBAL_SCHEMA, LOCAL_SCHEMA

# TestNet Configuration
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""  # No token needed for public node

def get_algod_client():
    """Initialize Algod client"""
    return algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

def compile_program(client, source_code):
    """Compile TEAL source code"""
    compile_response = client.compile(source_code)
    return base64.b64decode(compile_response['result'])

def deploy_contract(creator_mnemonic):
    """
    Deploy AlgoArena reward contract
    
    Args:
        creator_mnemonic: 25-word mnemonic of creator account
    
    Returns:
        app_id, app_address: Deployed application ID and address
    """
    client = get_algod_client()
    
    # Get creator account
    private_key = mnemonic.to_private_key(creator_mnemonic)
    creator_address = account.address_from_private_key(private_key)
    
    print(f"🚀 Deploying from: {creator_address}")
    
    # Check account balance
    account_info = client.account_info(creator_address)
    balance = account_info.get('amount', 0)
    print(f"💰 Balance: {balance / 1_000_000} ALGO")
    
    if balance < 1_000_000:  # Less than 1 ALGO
        print("❌ Insufficient balance. Get TestNet ALGO from: https://bank.testnet.algorand.network")
        return None
    
    # Compile contract
    print("⚙️ Compiling contract...")
    approval_teal, clear_teal = compile_contract()
    
    approval_program = compile_program(client, approval_teal)
    clear_program = compile_program(client, clear_teal)
    
    # Get suggested params
    params = client.suggested_params()
    
    # Create application
    print("📝 Creating application transaction...")
    txn = ApplicationCreateTxn(
        sender=creator_address,
        sp=params,
        on_complete=OnComplete.NoOpOC,
        approval_program=approval_program,
        clear_program=clear_program,
        global_schema=GLOBAL_SCHEMA,
        local_schema=LOCAL_SCHEMA,
        extra_pages=0,
    )
    
    # Sign transaction
    signed_txn = txn.sign(private_key)
    
    # Send transaction
    print("📤 Sending transaction...")
    tx_id = client.send_transaction(signed_txn)
    print(f"Transaction ID: {tx_id}")
    
    # Wait for confirmation
    print("⏳ Waiting for confirmation...")
    confirmed_txn = wait_for_confirmation(client, tx_id, 4)
    
    # Get application ID
    app_id = confirmed_txn['application-index']
    app_address = algod.logic.get_application_address(app_id)
    
    print(f"\n✅ Reward contract deployed successfully!")
    print(f"📱 Application ID: {app_id}")
    print(f"📍 Application Address: {app_address}")
    print(f"🔗 View on TestNet: https://testnet.explorer.perawallet.app/application/{app_id}")
    
    # Fund contract account (needed for inner transactions)
    print(f"\n💸 Funding contract account...")
    fund_txn = PaymentTxn(
        sender=creator_address,
        sp=params,
        receiver=app_address,
        amt=5_000_000,  # 5 ALGO for reward pool + fees
    )
    signed_fund = fund_txn.sign(private_key)
    fund_tx_id = client.send_transaction(signed_fund)
    wait_for_confirmation(client, fund_tx_id, 4)
    print(f"✅ Contract funded with 5 ALGO for reward distribution")
    
    return app_id, app_address

if __name__ == "__main__":
    print("=" * 60)
    print("AlgoArena Reward Contract Deployment")
    print("=" * 60)
    print()
    
    # IMPORTANT: Replace with your funded TestNet mnemonic
    CREATOR_MNEMONIC = os.getenv("ALGORAND_MINTER_MNEMONIC", "")
    
    if not CREATOR_MNEMONIC:
        print("❌ Error: Set ALGORAND_MINTER_MNEMONIC environment variable")
        print("   Get TestNet ALGO from: https://bank.testnet.algorand.network")
        exit(1)
    
    # Deploy contract
    result = deploy_contract(CREATOR_MNEMONIC)
    
    if result:
        app_id, app_address = result
        
        print(f"\n🎉 Deployment complete!")
        print(f"\n📋 Save these values:")
        print(f"   APP_ID={app_id}")
        print(f"   APP_ADDRESS={app_address}")
        print(f"\n💡 Next steps:")
        print(f"   1. Save APP_ID to your .env file")
        print(f"   2. Fund the contract with more ALGO for rewards")
        print(f"   3. Use interact.py to distribute rewards to players")
