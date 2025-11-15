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
    const { walletAddress, amount } = await req.json();

    if (!walletAddress || !amount) {
      throw new Error('Missing required parameters: walletAddress and amount');
    }

    // Get environment variables
    const APP_ID = parseInt(Deno.env.get('ALGOARENA_APP_ID') || '0');
    const ADMIN_MNEMONIC = Deno.env.get('ALGORAND_MINTER_MNEMONIC') || '';

    if (!APP_ID || !ADMIN_MNEMONIC) {
      throw new Error('Contract not configured. Please set ALGOARENA_APP_ID and ALGORAND_MINTER_MNEMONIC');
    }

    // Initialize Algorand client
    const algodClient = new algosdk.Algodv2(
      '',
      'https://testnet-api.algonode.cloud',
      ''
    );

    // Get admin account from mnemonic
    const adminAccount = algosdk.mnemonicToSecretKey(ADMIN_MNEMONIC);

    // Get suggested params with increased fee for inner transaction
    const params = await algodClient.getTransactionParams().do();
    params.fee = 2000; // Cover outer transaction (1000) + inner transaction (1000)
    params.flatFee = true;

    // Create application call transaction to reward the player
    const encoder = new TextEncoder();
    const appArgs = [
      encoder.encode('reward'),
      algosdk.encodeUint64(amount), // amount in microAlgos
    ];

    // Add unique note to prevent duplicate transactions
    const uniqueNote = encoder.encode(`reward-${Date.now()}-${Math.random()}`);

    const txn = algosdk.makeApplicationCallTxnFromObject({
      from: adminAccount.addr,
      appIndex: APP_ID,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      appArgs,
      accounts: [walletAddress], // Player address goes to Txn.accounts[1]
      suggestedParams: params,
      note: uniqueNote,
    });

    // Sign and send transaction
    const signedTxn = txn.signTxn(adminAccount.sk);
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();

    // Wait for confirmation
    await algosdk.waitForConfirmation(algodClient, txId, 4);

    console.log(`Reward sent: ${amount / 1000000} ALGO to ${walletAddress}`);

    return new Response(
      JSON.stringify({
        success: true,
        txId,
        amount: amount / 1000000,
        recipient: walletAddress,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error claiming reward:', error);
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
