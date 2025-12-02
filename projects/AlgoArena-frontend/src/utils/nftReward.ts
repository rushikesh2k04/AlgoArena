export interface NFTRewardResult {
  success: boolean;
  assetId?: number;
  imageUrl?: string;
  error?: string;
}

export const mintGameNFT = async (
  walletAddress: string,
  gameName: string,
  score: number,
  gameIcon: string,
  matchId?: string,
  difficulty?: string
): Promise<NFTRewardResult> => {
  try {
    console.log(`Minting NFT for ${gameName} with score ${score}`);

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mint-game-nft`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          walletAddress,
          gameName,
          score,
          gameIcon,
          matchId,
          difficulty,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('NFT minting failed:', error);
      return { success: false, error: error.error || 'Failed to mint NFT' };
    }

    const result = await response.json();
    console.log('NFT minted successfully:', result);

    return {
      success: result.success,
      assetId: result.assetId,
      imageUrl: result.imageUrl,
    };
  } catch (error) {
    console.error('Error minting NFT:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const transferNFT = async (
  walletAddress: string,
  assetId: number
): Promise<boolean> => {
  try {
    console.log(`Transferring NFT ${assetId} to ${walletAddress}`);

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transfer-nft`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          walletAddress,
          assetId,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('NFT transfer failed:', error);
      return false;
    }

    const result = await response.json();
    console.log('NFT transferred successfully:', result);

    return result.success;
  } catch (error) {
    console.error('Error transferring NFT:', error);
    return false;
  }
};
