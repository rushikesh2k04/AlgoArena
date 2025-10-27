export const claimReward = async (walletAddress: string, amount: number): Promise<boolean> => {
  try {
    console.log(`Claiming ${amount} ALGO for wallet: ${walletAddress}`);
    
    // Convert ALGO to microAlgos (1 ALGO = 1,000,000 microAlgos)
    const microAlgos = amount * 1000000;
    
    // Use no-cors mode to avoid CORS issues, but note we won't be able to read the response
    const response = await fetch(
      `https://bank.testnet.algorand.network/?account=${walletAddress}&amount=${microAlgos}`,
      {
        method: 'GET',
        mode: 'no-cors', // This bypasses CORS but we can't read the response
      }
    );
    
    console.log('Dispenser request sent');
    
    // Since we're using no-cors, we can't check response.ok
    // We'll assume success and let the user verify in their wallet
    return true;
  } catch (error) {
    console.error('Error claiming reward:', error);
    return false;
  }
};
