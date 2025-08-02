import type { NextApiRequest, NextApiResponse } from 'next';

interface ZineSubmissionData {
  name: string;
  email: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data: ZineSubmissionData = req.body;

    // Validate required fields
    if (!data.name || !data.email || !data.address1 || !data.city || !data.state || !data.zip) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Log the submission for now
    console.log('Zine submission received:', data);
    
    // For now, we'll just log the data and return success
    // You can set up EmailJS on the client side or use a server-side email service
    // The data is being logged to your server console where you can see it
    
    return res.status(200).json({ 
      success: true, 
      message: 'Zine request received! We\'ll be in touch soon.',
      data: data 
    });

  } catch (error) {
    console.error('Error processing zine submission:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 