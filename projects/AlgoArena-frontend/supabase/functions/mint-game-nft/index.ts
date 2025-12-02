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
    const { walletAddress, gameName, score, gameIcon, matchId, difficulty } = await req.json();

    if (!walletAddress || !gameName || score === undefined || !gameIcon) {
      throw new Error('Missing required parameters: walletAddress, gameName, score, and gameIcon');
    }

    console.log(`Minting ARC-3 NFT for ${gameName} with score ${score} to ${walletAddress}`);

    // UNIFIED ADMIN WALLET CONFIGURATION
    // This mnemonic MUST derive to: YMGJFPZCNKZF33Y6OJCPVJIF4H4N2WQWNBTM5L7VWLH6LBT5EZIUS2MBSQ
    // This single admin wallet handles the complete rotation mechanism:
    // 1. Collects all entry fees from players (via frontend transactions)
    // 2. Mints NFT rewards (via this edge function)
    // 3. Transfers NFT rewards (via transfer-nft function)
    // 4. Distributes ALGO rewards (via claim-reward function)
    const EXPECTED_ADMIN_ADDRESS = 'YMGJFPZCNKZF33Y6OJCPVJIF4H4N2WQWNBTM5L7VWLH6LBT5EZIUS2MBSQ';
    const ADMIN_MNEMONIC = Deno.env.get('ALGORAND_MINTER_MNEMONIC') || '';
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY') || '';
    const PINATA_JWT = Deno.env.get('PINATA_JWT') || '';

    if (!ADMIN_MNEMONIC) {
      throw new Error('ALGORAND_MINTER_MNEMONIC not configured');
    }

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    if (!PINATA_JWT) {
      throw new Error('PINATA_JWT not configured');
    }

    // Generate match ID and timestamp
    const timestamp = Date.now();
    const matchIdFinal = matchId || `${gameName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}`;
    const difficultyLevel = difficulty || 'normal';
    const date = new Date(timestamp).toISOString();

    // Generate achievement image with score using AI
    console.log('Generating achievement image with AI...');
    const imagePrompt = `Create a gaming achievement certificate image with a modern, vibrant design. 
    Include the text "AlgoArena Achievement" at the top in bold letters.
    Add "${gameName}" as the game title in large text.
    Display "Score: ${score}" prominently in the center.
    Add "Match: ${matchIdFinal}" and "Difficulty: ${difficultyLevel}" in smaller text.
    Use gaming-themed decorations like stars, trophies, or medals.
    Make it look professional and celebratory with a dark background and bright accents.
    16:9 aspect ratio, ultra high resolution.`;

    const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [{
          role: 'user',
          content: imagePrompt
        }],
        modalities: ['image', 'text']
      })
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error('AI Gateway error:', imageResponse.status, errorText);
      throw new Error(`Failed to generate image: ${imageResponse.status} - ${errorText}`);
    }

    const imageData = await imageResponse.json();
    const base64Image = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!base64Image) {
      throw new Error('No image generated from AI');
    }

    console.log('Image generated successfully');

    // Upload image to IPFS via Pinata
    console.log('Uploading image to IPFS...');
    const imageBuffer = Uint8Array.from(atob(base64Image.split(',')[1]), c => c.charCodeAt(0));
    
    const imageFormData = new FormData();
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
    imageFormData.append('file', imageBlob, `${matchIdFinal}-achievement.png`);
    imageFormData.append('pinataMetadata', JSON.stringify({
      name: `${gameName} Achievement - Score ${score}`,
    }));

    const imageUploadResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
      },
      body: imageFormData,
    });

    if (!imageUploadResponse.ok) {
      const error = await imageUploadResponse.text();
      throw new Error(`Failed to upload image to IPFS: ${error}`);
    }

    const imageUploadData = await imageUploadResponse.json();
    const imageIpfsHash = imageUploadData.IpfsHash;
    const imageUrl = `ipfs://${imageIpfsHash}`;
    
    console.log(`Image uploaded to IPFS: ${imageUrl}`);

    // Create ARC-3 compliant metadata
    const arc3Metadata = {
      name: `${gameName} Achievement`,
      description: `AlgoArena achievement NFT for ${gameName}. Score: ${score}, Difficulty: ${difficultyLevel}`,
      image: imageUrl,
      image_integrity: `sha256-${imageIpfsHash}`,
      image_mimetype: 'image/png',
      external_url: 'https://algoarena.app',
      properties: {
        game: gameName,
        score: score,
        difficulty: difficultyLevel,
        matchId: matchIdFinal,
        date: date,
        timestamp: timestamp,
        platform: 'AlgoArena',
        playerAddress: walletAddress,
      },
    };

    // Upload metadata to IPFS
    console.log('Uploading metadata to IPFS...');
    const metadataUploadResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pinataContent: arc3Metadata,
        pinataMetadata: {
          name: `${gameName} Achievement Metadata`,
        },
      }),
    });

    if (!metadataUploadResponse.ok) {
      const error = await metadataUploadResponse.text();
      throw new Error(`Failed to upload metadata to IPFS: ${error}`);
    }

    const metadataUploadData = await metadataUploadResponse.json();
    const metadataIpfsHash = metadataUploadData.IpfsHash;
    const metadataUrl = `ipfs://${metadataIpfsHash}`;
    
    console.log(`Metadata uploaded to IPFS: ${metadataUrl}`);

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

    // Create ARC-3 compliant NFT (ASA with total supply = 1, decimals = 0)
    const assetName = `${gameName} Achievement`;
    const unitName = 'AARENA';
    
    // ARC-3: URL points to metadata JSON on IPFS
    const assetURL = `https://gateway.pinata.cloud/ipfs/${metadataIpfsHash}#arc3`;
    
    // ARC-3: Metadata hash is SHA-256 of the metadata JSON
    const metadataBytes = new TextEncoder().encode(JSON.stringify(arc3Metadata));
    const metadataHashBuffer = await crypto.subtle.digest('SHA-256', metadataBytes);
    const assetMetadataHash = new Uint8Array(metadataHashBuffer);

    console.log('Creating ARC-3 compliant NFT asset...');
    console.log(`Asset URL: ${assetURL}`);
    const assetCreateTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      from: adminAccount.addr,
      total: 1,
      decimals: 0,
      assetName: assetName,
      unitName: unitName,
      assetURL: assetURL,
      assetMetadataHash: assetMetadataHash,
      defaultFrozen: false,
      manager: adminAccount.addr,
      reserve: adminAccount.addr,
      freeze: undefined,
      clawback: undefined,
      suggestedParams: params,
    });

    // Sign and send asset creation transaction
    const signedAssetCreateTxn = assetCreateTxn.signTxn(adminAccount.sk);
    const assetCreateResult = await algodClient.sendRawTransaction(signedAssetCreateTxn).do();
    
    console.log('Waiting for asset creation confirmation...');
    await algosdk.waitForConfirmation(algodClient, assetCreateResult.txId, 4);

    // Get the asset ID from the transaction
    const ptx = await algodClient.pendingTransactionInformation(assetCreateResult.txId).do();
    const assetID = ptx['asset-index'];
    
    console.log(`NFT created with asset ID: ${assetID}`);

    // Return success with asset ID and IPFS URLs
    return new Response(
      JSON.stringify({
        success: true,
        assetId: assetID,
        message: 'ARC-3 compliant NFT created successfully. Player needs to opt-in to receive it.',
        imageUrl: `https://gateway.pinata.cloud/ipfs/${imageIpfsHash}`,
        metadataUrl: `https://gateway.pinata.cloud/ipfs/${metadataIpfsHash}`,
        metadata: arc3Metadata,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error minting NFT:', error);
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
