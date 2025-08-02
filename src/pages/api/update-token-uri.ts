import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import ManifestoMinterABI from '@/lib/ManifestoMinterABI.json';

interface UpdateTokenURIRequest {
  tokenId: number;
  metadataUrl: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tokenId, metadataUrl }: UpdateTokenURIRequest = req.body;

    // Validate required fields
    if (!tokenId || !metadataUrl) {
      return res.status(400).json({ error: 'Missing tokenId or metadataUrl' });
    }

    // Get environment variables
    const privateKey = process.env.CONTRACT_OWNER_PRIVATE_KEY;
    const rpcUrl = process.env.RPC_URL;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!privateKey || !rpcUrl || !contractAddress) {
      console.error('Missing environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Set up provider and wallet
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, ManifestoMinterABI, wallet);

    console.log(`Updating token URI for token ${tokenId} to ${metadataUrl}`);

    // Call setTokenURI on the contract
    const tx = await contract.setTokenURI(tokenId, metadataUrl);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    console.log(`Token URI updated successfully. Transaction hash: ${receipt.hash}`);

    return res.status(200).json({ 
      success: true, 
      transactionHash: receipt.hash,
      message: 'Token URI updated successfully'
    });

  } catch (error) {
    console.error('Error updating token URI:', error);
    return res.status(500).json({ 
      error: 'Failed to update token URI',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 