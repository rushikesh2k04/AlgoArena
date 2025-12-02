import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as algosdk from "https://esm.sh/algosdk@2.7.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { walletAddress, assetId } = await req.json();

    if (!walletAddress || !assetId) {
      throw new Error('Missing required parameters: walletAddress and assetId');
    }

    console.log(`Transferring NFT ${assetId} to ${walletAddress}`);

    // UNIFIED ADMIN WALLET CONFIGURATION
    // This mnemonic MUST derive to: YMGJFPZCNKZF33Y6OJCPVJIF4H4N2WQWNBTM5L7VWLH6LBT5EZIUS2MBSQ
    // This single admin wallet handles the complete rotation mechanism:
    // 1. Collects all entry fees from players (via frontend transactions)
    // 2. Mints NFT rewards (via mint-game-nft function)
    // 3. Transfers NFT rewards to winners (via this edge function)
    // 4. Distributes ALGO rewards (via claim-reward function)
    const EXPECTED_ADMIN_ADDRESS = 'YMGJFPZCNKZF33Y6OJCPVJIF4H4N2WQWNBTM5L7VWLH6LBT5EZIUS2MBSQ';
    const ADMIN_MNEMONIC = Deno.env.get('ALGORAND_MINTER_MNEMONIC') || '';

    if (!ADMIN_MNEMONIC) {
      throw new Error('ALGORAND_MINTER_MNEMONIC not configured');
    }

    // Initialize Algorand client
    const algodClient = new algosdk.Algodv2(
      '',
      'https://testnet-api.algonode.cloud',
      ''
    );

    // Get admin account
    const adminAccount = algosdk.mnemonicToSecretKey(ADMIN_MNEMONIC);
    
    // Validate that the mnemonic corresponds to the expected admin address
    if (adminAccount.addr !== EXPECTED_ADMIN_ADDRESS) {
      throw new Error(`Admin wallet mismatch! Expected ${EXPECTED_ADMIN_ADDRESS}, got ${adminAccount.addr}`);
    }

    // Get suggested params
    const params = await algodClient.getTransactionParams().do();

    // Create asset transfer transaction
    console.log('Creating transfer transaction...');
    const assetTransferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: adminAccount.addr,
      to: walletAddress,
      assetIndex: assetId,
      amount: 1,
      suggestedParams: params,
    });

    // Sign and send transaction
    const signedTransferTxn = assetTransferTxn.signTxn(adminAccount.sk);
    const transferResult = await algodClient.sendRawTransaction(signedTransferTxn).do();
    
    console.log('Waiting for transfer confirmation...');
    await algosdk.waitForConfirmation(algodClient, transferResult.txId, 4);

    console.log(`NFT ${assetId} transferred successfully to ${walletAddress}`);

    return new Response(
      JSON.stringify({
        success: true,
        txId: transferResult.txId,
        assetId: assetId,
        recipient: walletAddress,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error transferring NFT:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
