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
    def reward_user(
        self,
        recipient_address: Address,
        algo_reward_amount: UInt64,
        nft_asset_id: UInt64,
    ) -> None:
        """Distributes Algos and an NFT to a recipient."""
        assert Txn.sender == self.owner.value, "Only the AlgoArena owner/server can issue rewards."

        itxn.Payment(
            sender=Global.current_application_address,
            receiver=recipient_address.native,
            amount=algo_reward_amount.native
        ).submit()

        itxn.AssetTransfer(
            sender=Global.current_application_address,
            asset_receiver=recipient_address.native,
            xfer_asset=nft_asset_id.native,
            asset_amount=NativeUInt64(1)
        ).submit()
