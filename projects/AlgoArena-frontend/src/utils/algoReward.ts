export const claimReward = async (walletAddress: string, amount: number): Promise<boolean> => {
  try {
    console.log(`Claiming ${amount} ALGO reward from smart contract for wallet: ${walletAddress}`);
    
    // Convert ALGO to microAlgos (1 ALGO = 1,000,000 microAlgos)
    const microAlgos = amount * 1000000;
    
    // Call the backend edge function to trigger smart contract reward distribution
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claim-reward`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          walletAddress,
          amount: microAlgos,
        }),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Reward claim failed:', error);
      return false;
    }
    
    const result = await response.json();
    console.log('Reward claimed successfully:', result);
    
    return result.success;
  } catch (error) {
    console.error('Error claiming reward:', error);
    return false;
  }
};
