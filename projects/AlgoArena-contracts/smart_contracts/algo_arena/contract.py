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
