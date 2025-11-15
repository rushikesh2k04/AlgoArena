import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';
import { DeflyWalletConnect } from '@blockshake/defly-connect';
import LuteConnect from 'lute-connect';
import { useToast } from '@/hooks/use-toast';
import algosdk from 'algosdk';

type WalletType = 'pera' | 'defly' | 'lute' | null;

interface WalletContextType {
  accountAddress: string | null;
  balance: number;
  walletType: WalletType;
  connectWallet: (type: WalletType) => Promise<void>;
  disconnectWallet: () => void;
  sendGameTransaction: (entryFee: number) => Promise<boolean>;
  isConnected: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

let peraWallet: PeraWalletConnect | null = null;
let deflyWallet: DeflyWalletConnect | null = null;
let luteWallet: LuteConnect | null = null;

const getPeraWallet = () => {
  if (!peraWallet) {
    peraWallet = new PeraWalletConnect({
      chainId: 416002,
    });
  }
  return peraWallet;
};

const getDeflyWallet = () => {
  if (!deflyWallet) {
    deflyWallet = new DeflyWalletConnect({
      chainId: 416002,
    });
  }
  return deflyWallet;
};

const getLuteWallet = () => {
  if (!luteWallet) {
    luteWallet = new LuteConnect();
  }
  return luteWallet;
};

export const MultiWalletProvider = ({ children }: { children: ReactNode }) => {
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [walletType, setWalletType] = useState<WalletType>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Try to reconnect to previously connected wallet
    const savedWalletType = localStorage.getItem('walletType') as WalletType;
    if (savedWalletType === 'pera') {
      const wallet = getPeraWallet();
      wallet.reconnectSession().then((accounts) => {
        if (accounts.length) {
          setAccountAddress(accounts[0]);
          setWalletType('pera');
          fetchBalance(accounts[0]);
        }
      }).catch((e) => console.error(e));
    } else if (savedWalletType === 'defly') {
      const wallet = getDeflyWallet();
      wallet.reconnectSession().then((accounts) => {
        if (accounts.length) {
          setAccountAddress(accounts[0]);
          setWalletType('defly');
          fetchBalance(accounts[0]);
        }
      }).catch((e) => console.error(e));
    } else if (savedWalletType === 'lute') {
      // Lute wallet doesn't have auto-reconnect, user needs to connect manually
      localStorage.removeItem('walletType');
    }
  }, []);

  const fetchBalance = async (address: string) => {
    try {
      const response = await fetch(
        `https://testnet-api.algonode.cloud/v2/accounts/${address}`
      );
      const data = await response.json();
      setBalance(data.amount / 1000000);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const connectWallet = async (type: WalletType) => {
    try {
      let accounts: string[] = [];
      
      if (type === 'pera') {
        const wallet = getPeraWallet();
        accounts = await wallet.connect();
        setWalletType('pera');
        localStorage.setItem('walletType', 'pera');
      } else if (type === 'defly') {
        const wallet = getDeflyWallet();
        accounts = await wallet.connect();
        setWalletType('defly');
        localStorage.setItem('walletType', 'defly');
      } else if (type === 'lute') {
        const wallet = getLuteWallet();
        const algodClient = new algosdk.Algodv2(
          '',
          'https://testnet-api.algonode.cloud',
          ''
        );
        const genesis = await algodClient.genesis().do();
        const genesisID = genesis['id'];
        const result = await wallet.connect(genesisID);
        if (result && result.length) {
          accounts = result;
          setWalletType('lute');
          localStorage.setItem('walletType', 'lute');
        }
      }
      
      if (accounts.length > 0) {
        setAccountAddress(accounts[0]);
        await fetchBalance(accounts[0]);
        toast({
          title: 'Wallet Connected',
          description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        });
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect wallet',
        variant: 'destructive',
      });
    }
  };

  const disconnectWallet = () => {
    if (walletType === 'pera') {
      const wallet = getPeraWallet();
      wallet.disconnect();
    } else if (walletType === 'defly') {
      const wallet = getDeflyWallet();
      wallet.disconnect();
    } else if (walletType === 'lute') {
      // Lute doesn't have disconnect method, just clear local state
    }
    
    setAccountAddress(null);
    setBalance(0);
    setWalletType(null);
    localStorage.removeItem('walletType');
    
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected',
    });
  };

  const sendGameTransaction = async (entryFee: number): Promise<boolean> => {
    if (!accountAddress || !walletType) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const algodClient = new algosdk.Algodv2(
        '',
        'https://testnet-api.algonode.cloud',
        ''
      );

      const params = await algodClient.getTransactionParams().do();
      const gameWalletAddress = 'HZ57J3K46JIJXILONBBZOHX6BKPXEM2VVXNRFSUED6DKFD5ZD24PMJ3MVA';
      
      const transaction = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: accountAddress,
        receiver: gameWalletAddress,
        amount: Math.floor(entryFee * 1000000),
        note: new Uint8Array(Buffer.from('Game Entry Fee')),
        suggestedParams: params,
      });

      const singleTxnGroups = [{ txn: transaction, signers: [accountAddress] }];
      let signedTxn;

      if (walletType === 'pera') {
        const wallet = getPeraWallet();
        signedTxn = await wallet.signTransaction([singleTxnGroups]);
      } else if (walletType === 'defly') {
        const wallet = getDeflyWallet();
        signedTxn = await wallet.signTransaction([singleTxnGroups]);
      } else if (walletType === 'lute') {
        const wallet = getLuteWallet();
        const encodedTxn = algosdk.encodeUnsignedTransaction(transaction);
        const txns = [{
          txn: Buffer.from(encodedTxn).toString('base64'),
        }];
        const signed = await wallet.signTxns(txns);
        signedTxn = (signed as any).map((s: string) => new Uint8Array(Buffer.from(s, 'base64')));
      }

      if (signedTxn) {
        const response = await algodClient.sendRawTransaction(signedTxn).do();
        const txId = response.txid;
        await algosdk.waitForConfirmation(algodClient, txId, 4);
        
        toast({
          title: 'Transaction Successful',
          description: `Entry fee paid: ${entryFee} ALGO`,
        });
        
        await fetchBalance(accountAddress);
        return true;
      }
    } catch (error) {
      console.error('Transaction error:', error);
      toast({
        title: 'Transaction Failed',
        description: 'Failed to process transaction',
        variant: 'destructive',
      });
    }
    return false;
  };

  return (
    <WalletContext.Provider value={{
      accountAddress,
      balance,
      walletType,
      connectWallet,
      disconnectWallet,
      sendGameTransaction,
      isConnected: !!accountAddress,
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useMultiWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useMultiWallet must be used within a MultiWalletProvider');
  }
  return context;
};

export const usePeraWallet = useMultiWallet;
