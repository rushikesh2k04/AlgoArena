import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';
import { useToast } from '@/hooks/use-toast';
import algosdk from 'algosdk';

interface WalletContextType {
  accountAddress: string | null;
  balance: number;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  sendGameTransaction: (entryFee: number) => Promise<boolean>;
  isConnected: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

let peraWallet: PeraWalletConnect | null = null;

const getPeraWallet = () => {
  if (!peraWallet) {
    peraWallet = new PeraWalletConnect({
      chainId: 416002, // Algorand TestNet
    });
  }
  return peraWallet;
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const wallet = getPeraWallet();
    wallet.reconnectSession().then((accounts) => {
      if (accounts.length) {
        setAccountAddress(accounts[0]);
        fetchBalance(accounts[0]);
      }
    }).catch((e) => console.error(e));

    wallet.connector?.on('disconnect', () => {
      setAccountAddress(null);
      setBalance(0);
    });
  }, []);

  const fetchBalance = async (address: string) => {
    try {
      const response = await fetch(
        `https://testnet-api.algonode.cloud/v2/accounts/${address}`
      );
      const data = await response.json();
      setBalance(data.amount / 1000000); // Convert microAlgos to Algos
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const connectWallet = async () => {
    try {
      const wallet = getPeraWallet();
      const accounts = await wallet.connect();
      setAccountAddress(accounts[0]);
      await fetchBalance(accounts[0]);
      toast({
        title: 'Wallet Connected',
        description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
      });
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
    const wallet = getPeraWallet();
    wallet.disconnect();
    setAccountAddress(null);
    setBalance(0);
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected',
    });
  };

  const sendGameTransaction = async (entryFee: number): Promise<boolean> => {
    if (!accountAddress) {
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
      
      // Game wallet address (you can replace this with your actual game wallet)
      const gameWalletAddress = 'HZ57J3K46JIJXILONBBZOHX6BKPXEM2VVXNRFSUED6DKFD5ZD24PMJ3MVA';
      
      const transaction = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: accountAddress,
        receiver: gameWalletAddress,
        amount: Math.floor(entryFee * 1000000), // Convert ALGO to microAlgos
        note: new Uint8Array(Buffer.from('Game Entry Fee')),
        suggestedParams: params,
      });

      const singleTxnGroups = [{ txn: transaction, signers: [accountAddress] }];
      const wallet = getPeraWallet();
      const signedTxn = await wallet.signTransaction([singleTxnGroups]);

      const response = await algodClient.sendRawTransaction(signedTxn).do();
      const txId = response.txid || transaction.txID();
      
      // Wait for confirmation
      await algosdk.waitForConfirmation(algodClient, txId, 4);
      
      // Update balance after transaction
      await fetchBalance(accountAddress);

      toast({
        title: 'Transaction Successful',
        description: `Entry fee of ${entryFee} ALGO paid. Good luck!`,
      });

      return true;
    } catch (error: any) {
      console.error('Transaction error:', error);
      
      if (error.message?.includes('cancelled')) {
        toast({
          title: 'Transaction Cancelled',
          description: 'You cancelled the transaction in Pera Wallet',
        });
      } else {
        toast({
          title: 'Transaction Failed',
          description: error.message || 'Failed to process transaction',
          variant: 'destructive',
        });
      }
      
      return false;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        accountAddress,
        balance,
        connectWallet,
        disconnectWallet,
        sendGameTransaction,
        isConnected: !!accountAddress,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const usePeraWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('usePeraWallet must be used within WalletProvider');
  }
  return context;
};
