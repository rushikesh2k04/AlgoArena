from algopy import ARC4Contract, arc4, Global, UInt64, Bytes, Account, Txn, GlobalState, itxn, Asset
from algopy.op import AssetHoldingGet

class AlgoArenaRewardContract(ARC4Contract):
    def __init__(self) -> None:
        self.admin = GlobalState(Account, key="admin")
        self.paused = GlobalState(UInt64, key="paused")
        self.name = GlobalState(Bytes, key="name")

        if not self.admin:
            self.admin.value = Global.creator_address
        if not self.paused:
            self.paused.value = UInt64(0)
        if not self.name:
            self.name.value = Bytes(b"AlgoArenaReward")

    @arc4.abimethod
    def set_admin(self, new_admin: arc4.Address) -> None:
        assert Txn.sender == self.admin.value, "only admin"
        self.admin.value = new_admin.native  # Convert arc4.Address to Account

    @arc4.abimethod
    def pause(self) -> None:
        assert Txn.sender == self.admin.value, "only admin"
        self.paused.value = UInt64(1)

    @arc4.abimethod
    def unpause(self) -> None:
        assert Txn.sender == self.admin.value, "only admin"
        self.paused.value = UInt64(0)

    @arc4.abimethod
    def reward_algo(self, player: arc4.Address, amount: arc4.UInt64) -> None:
        assert Txn.sender == self.admin.value, "only admin"
        assert self.paused.value == UInt64(0), "contract paused"
        assert amount.native > 0, "amount must be > 0"
        itxn.Payment(
            receiver=player.native,
            amount=amount.native,
            fee=1000
        ).submit()
    
    @arc4.abimethod
    def asset_opt_in(self, asset: Asset) -> None:
        assert not Global.current_application_address.is_opted_in(asset), \
            "App already opted in"

        itxn.AssetTransfer(
            asset_receiver=Global.current_application_address,
            xfer_asset=asset,
            asset_amount=0,
            fee=0,
        ).submit()    
    @arc4.abimethod
    def nft_reward(self, receiver: arc4.Address, asset_id: arc4.UInt64) -> None:
        assert Txn.sender == self.admin.value, "only admin"
        assert self.paused.value == UInt64(0), "contract paused"
        assert asset_id.native > 0, "invalid asset id"
            # receiver_account = receiver.native     
            # asset_id_native = asset_id.native 
            # v, receiver_opted_in = AssetHoldingGet.asset_balance(receiver_account, asset_id_native)
            # assert receiver_opted_in, "receiver not opted-in"
            # admin = self.admin.value
            # admin_balance, admin_opted_in = AssetHoldingGet.asset_balance(admin, asset_id_native)
            # assert admin_opted_in and admin_balance >= 1, "admin does not hold asset"

        itxn.AssetTransfer(
            xfer_asset=asset_id.native,
            asset_receiver=receiver.native,
            asset_amount=1,
            fee=0
        ).submit()
    
    @arc4.abimethod(readonly=True)
    def get_info(self) -> tuple[arc4.Address, UInt64, Bytes]:
        return (arc4.Address(self.admin.value), self.paused.value, self.name.value)

    @arc4.abimethod(readonly=True)
    def is_paused(self) -> UInt64:
        return self.paused.value
