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

    console.log(`Fetching metadata for token ${tokenId}`);

    // Call signatureMetadata on the contract
    const data = await contract.signatureMetadata(Number(tokenId));
    
    console.log(`Token metadata:`, data);

    return res.status(200).json({ 
      success: true, 
      data: {
        timestamp: data.timestamp ? Number(data.timestamp) : null,
        signature: data.signature || '',
        signer: data.signer || ''
      }
    });

  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch token metadata',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 