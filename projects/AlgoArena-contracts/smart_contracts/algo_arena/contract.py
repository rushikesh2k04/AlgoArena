from algopy import ARC4Contract, GlobalState, Txn, Global, itxn
from algopy.arc4 import abimethod, Address, UInt64
from algopy import UInt64 as NativeUInt64

class AlgoArenaReward(ARC4Contract):
    """
    ARC-4 Contract for distributing Algo and NFT rewards to AlgoArena users.
    The contract owner (game server) is the only entity authorized to call 
    the reward_user method, which executes two Inner Transactions atomically:
    1. An Algo payment to the winner.
    2. An Asset Transfer (NFT) to the winner.
    """
    
    def __init__(self) -> None:
        self.owner = GlobalState(Address(), key="owner_addr")

    @abimethod()
    def create(self) -> None:
        """Sets the contract owner to the sender on application creation."""
        self.owner.value = Address(Txn.sender)

    @abimethod()
    def create(self) -> None:
    """Sets the contract owner to the sender and initializes fee to 0%."""
        self.owner.value = Address(Txn.sender)
        self.fee_percent.value = UInt8(0)
        # Initialize authorized_nfts with all zeros
        self.authorized_nfts.value = Bytes(b'\x00' * 80)

