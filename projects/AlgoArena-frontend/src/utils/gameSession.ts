import { supabase } from '@/integrations/supabase/client';

export interface GameSessionData {
  playerWalletAddress: string;
  gameName: string;
  score: number;
  rewardAmount: number;
  nftAssetId?: number;
  difficulty?: string;
  transactionId?: string;
}

export const recordGameSession = async (sessionData: GameSessionData): Promise<boolean> => {
  try {
    // First, get or create the player
    const { data: player, error: playerFetchError } = await supabase
      .from('players')
      .select('*')
      .eq('wallet_address', sessionData.playerWalletAddress)
      .maybeSingle();

    if (playerFetchError) throw playerFetchError;

    let playerId: string;

    if (!player) {
      // Create new player if doesn't exist
      const playerName = `Player_${sessionData.playerWalletAddress.slice(0, 8)}`;
      const { data: newPlayer, error: createError } = await supabase
        .from('players')
        .insert([{ 
          wallet_address: sessionData.playerWalletAddress, 
          name: playerName 
        }])
        .select()
        .single();

      if (createError) throw createError;
      playerId = newPlayer.id;
    } else {
      playerId = player.id;
    }

    // Insert game session
    const { error: sessionError } = await supabase
      .from('game_sessions')
      .insert([{
        player_id: playerId,
        game_name: sessionData.gameName,
        score: sessionData.score,
        reward_amount: sessionData.rewardAmount,
        nft_asset_id: sessionData.nftAssetId,
        difficulty: sessionData.difficulty,
        transaction_id: sessionData.transactionId,
      }]);

    if (sessionError) throw sessionError;

    // Update player stats
    const { error: updateError } = await supabase
      .from('players')
      .update({
        games_played: (player?.games_played || 0) + 1,
        games_won: (player?.games_won || 0) + 1,
        total_score: (player?.total_score || 0) + sessionData.score,
        total_rewards_earned: (player?.total_rewards_earned || 0) + sessionData.rewardAmount,
        nfts_earned: sessionData.nftAssetId 
          ? (player?.nfts_earned || 0) + 1 
          : (player?.nfts_earned || 0),
      })
      .eq('id', playerId);

    if (updateError) throw updateError;

    console.log('Game session recorded successfully');
    return true;
  } catch (error) {
    console.error('Error recording game session:', error);
    return false;
  }
};
