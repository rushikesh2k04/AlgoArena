"""
AlgoArena Reward Distribution Smart Contract
=============================================

Simplified contract focused ONLY on secure reward distribution.
No game logic - only handles sending ALGO rewards to players.

Features:
- Admin-controlled reward distribution
- Inner transaction payments to player wallets
- Security validations and replay protection
- Pause/unpause capability
"""

from pyteal import *

# State Schema
GLOBAL_SCHEMA = StateSchema(
    num_uints=2,  # admin, paused
    num_byte_slices=0
)

LOCAL_SCHEMA = StateSchema(
    num_uints=0,
    num_byte_slices=0
)

class AlgoArenaRewardContract:
    """Simplified contract for ALGO reward distribution only"""
    
    # Global state keys
    ADMIN = Bytes("admin")
    PAUSED = Bytes("paused")
    
    def application_start(self):
        """Initialize contract on creation"""
        return Seq([
            App.globalPut(self.ADMIN, Txn.sender()),
            App.globalPut(self.PAUSED, Int(0)),
            Approve()
        ])
    
    def is_admin(self):
        """Check if sender is admin"""
        return Txn.sender() == App.globalGet(self.ADMIN)
    
    def is_paused(self):
        """Check if contract is paused"""
        return App.globalGet(self.PAUSED) == Int(1)
    
    def reward_player(self):
        """
        ABI Method: reward(uint64)void
        Args: reward_amount (in microALGOs)
        Accounts: [0] = sender (admin), [1] = player receiving reward
        
        Sends ALGO reward to player using inner transaction.
        Security: Admin only, validates contract is not paused, validates player address.
        """
        reward_amount = Btoi(Txn.application_args[1])
        player_address = Txn.accounts[1]  # Player address passed in accounts array
        
        return Seq([
            # Security checks
            Assert(self.is_admin()),
            Assert(Not(self.is_paused())),
            Assert(reward_amount > Int(0)),
            Assert(player_address != Global.zero_address()),
            
            # Send ALGO reward via inner transaction
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.Payment,
                TxnField.receiver: player_address,
                TxnField.amount: reward_amount,
            }),
            InnerTxnBuilder.Submit(),
            
            Approve()
        ])
    
    def pause_contract(self):
        """ABI Method: pause()void - Admin pauses contract"""
        return Seq([
            Assert(self.is_admin()),
            App.globalPut(self.PAUSED, Int(1)),
            Approve()
        ])
    
    def unpause_contract(self):
        """ABI Method: unpause()void - Admin unpauses contract"""
        return Seq([
            Assert(self.is_admin()),
            App.globalPut(self.PAUSED, Int(0)),
            Approve()
        ])
    
    def approval_program(self):
        """Main approval program router"""
        
        # Method selectors
        reward_method = Txn.application_args[0] == Bytes("reward")
        pause_method = Txn.application_args[0] == Bytes("pause")
        unpause_method = Txn.application_args[0] == Bytes("unpause")
        
        return Cond(
            [Txn.application_id() == Int(0), self.application_start()],
            [Txn.on_completion() == OnComplete.DeleteApplication, Return(self.is_admin())],
            [Txn.on_completion() == OnComplete.UpdateApplication, Return(self.is_admin())],
            [Txn.on_completion() == OnComplete.CloseOut, Approve()],
            [Txn.on_completion() == OnComplete.OptIn, Approve()],
            [reward_method, self.reward_player()],
            [pause_method, self.pause_contract()],
            [unpause_method, self.unpause_contract()],
        )
    
    def clear_program(self):
        """Clear state program (always approves)"""
        return Approve()


def compile_contract():
    """Compile approval and clear programs"""
    contract = AlgoArenaRewardContract()
    
    approval_program = contract.approval_program()
    clear_program = contract.clear_program()
    
    compiled_approval = compileTeal(approval_program, Mode.Application, version=8)
    compiled_clear = compileTeal(clear_program, Mode.Application, version=8)
    
    return compiled_approval, compiled_clear


if __name__ == "__main__":
    approval_teal, clear_teal = compile_contract()
    
    # Save compiled TEAL
    with open("algoarena_approval.teal", "w") as f:
        f.write(approval_teal)
    
    with open("algoarena_clear.teal", "w") as f:
        f.write(clear_teal)
    
    print("✅ Reward contract compiled successfully!")
    print(f"📄 Approval program: algoarena_approval.teal")
    print(f"📄 Clear program: algoarena_clear.teal")
