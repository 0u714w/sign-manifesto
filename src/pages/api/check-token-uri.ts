import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import ManifestoMinterABI from '@/lib/ManifestoMinterABI.json';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tokenId } = req.query;

    if (!tokenId) {
      return res.status(400).json({ error: 'Missing tokenId' });
    }

    const rpcUrl = process.env.RPC_URL;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!rpcUrl || !contractAddress) {
      console.error('Missing environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Set up provider (read-only, no private key needed)
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, ManifestoMinterABI, provider);

    console.log(`Checking token URI for token ${tokenId}`);

    // Check if token exists
    const owner = await contract.ownerOf(Number(tokenId));
    console.log(`Token ${tokenId} owner:`, owner);

    // Get token URI
    const tokenURI = await contract.tokenURI(Number(tokenId));
    console.log(`Token ${tokenId} URI:`, tokenURI);

    // Get signature metadata
    const metadata = await contract.signatureMetadata(Number(tokenId));
    console.log(`Token ${tokenId} metadata:`, metadata);

    return res.status(200).json({ 
      success: true, 
      data: {
        tokenId: Number(tokenId),
        owner: owner,
        tokenURI: tokenURI,
        metadata: {
          name: metadata.name || '',
          timestamp: metadata.timestamp ? Number(metadata.timestamp) : null,
        }
      }
    });

  } catch (error) {
    console.error('Error checking token URI:', error);
    return res.status(500).json({ 
      error: 'Failed to check token URI',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 