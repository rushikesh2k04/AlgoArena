import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Player {
  id: string;
  player_id: string;
  name: string;
  wallet_address: string;
  total_score: number;
  games_played: number;
  games_won: number;
  total_rewards_earned: number;
  nfts_earned: number;
}

export const usePlayer = (walletAddress: string | null) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createOrFetchPlayer = async (address: string, name?: string) => {
    setLoading(true);
    try {
      // First, try to fetch existing player
      const { data: existingPlayer, error: fetchError } = await supabase
        .from('players')
        .select('*')
        .eq('wallet_address', address)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingPlayer) {
        setPlayer(existingPlayer);
        return existingPlayer;
      }

      // If player doesn't exist, create new one
      const playerName = name || `Player_${address.slice(0, 8)}`;
      const { data: newPlayer, error: createError } = await supabase
        .from('players')
        .insert([{ wallet_address: address, name: playerName }])
        .select()
        .single();

      if (createError) throw createError;

      setPlayer(newPlayer);
      toast({
        title: "Welcome!",
        description: `Player ${newPlayer.player_id} created successfully`,
      });
      
      return newPlayer;
    } catch (error) {
      console.error('Error managing player:', error);
      toast({
        title: "Error",
        description: "Failed to create or fetch player",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      createOrFetchPlayer(walletAddress);
    } else {
      setPlayer(null);
    }
  }, [walletAddress]);

  return { player, loading, createOrFetchPlayer };
};
