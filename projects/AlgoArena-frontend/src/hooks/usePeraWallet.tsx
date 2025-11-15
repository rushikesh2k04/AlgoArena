// Re-export everything from the new multi-wallet hook for backwards compatibility
export { 
  MultiWalletProvider as WalletProvider,
  useMultiWallet as usePeraWallet,
  useMultiWallet
} from './useMultiWallet';
