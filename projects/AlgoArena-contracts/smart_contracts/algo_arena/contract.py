from algopy import ARC4Contract, arc4, Global, UInt64, Bytes, Account, Txn, GlobalState, itxn

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
        self.admin.value = new_admin.native
    @arc4.abimethod
    def pause(self) -> None:
        assert Txn.sender == self.admin.value, "only admin"
        self.paused.value = UInt64(1)
    @arc4.abimethod
    def unpause(self) -> None:
        assert Txn.sender == self.admin.value, "only admin"
        self.paused.value = UInt64(0)
    @arc4.abimethod
    def reward(self, player: arc4.Address, amount: arc4.UInt64) -> None:
        assert Txn.sender == self.admin.value, "only admin"
        assert self.paused.value == UInt64(0), "contract paused"
        assert amount.native > 0, "amount must be > 0"

       itxn.Payment(
    sender=arc4.Address("<application-or-funded-account>"),
    receiver=player.native,
    amount=amount.native,
    fee=1000
    ).submit()

    @arc4.abimethod(readonly=True)
    def get_info(self) -> tuple[arc4.Address, UInt64, Bytes]:
        return (
            arc4.Address(self.admin.value),
            self.paused.value,
            self.name.value
        )
    @arc4.abimethod(readonly=True)
    def is_paused(self) -> UInt64:
        return self.paused.value
