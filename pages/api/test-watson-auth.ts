import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const apiKey = 'cpd-apikey-IBMid-6920014LFW-2025-11-12T20:08:15Z';
  
  try {
    // Test getting IAM token
    const tokenResponse = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        'grant_type': 'urn:ibm:params:oauth:grant-type:apikey',
        'apikey': apiKey,
      }),
    });

    const tokenText = await tokenResponse.text();
    
    return res.status(200).json({
      status: tokenResponse.status,
      statusText: tokenResponse.statusText,
      body: tokenText,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
