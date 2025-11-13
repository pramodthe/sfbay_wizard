import type { NextApiRequest, NextApiResponse } from 'next';

const WATSON_API_KEY = process.env.WATSON_API_KEY || '';
const WATSON_ENDPOINT = process.env.WATSON_ENDPOINT || '';
const WATSON_CPD_URL = process.env.WATSON_CPD_URL || '';

// Cache for IAM token
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getWatsonToken(): Promise<string> {
  // Return cached token if still valid
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  // If CPD URL is provided, use CPD authentication
  if (WATSON_CPD_URL) {
    const response = await fetch(`${WATSON_CPD_URL}/icp4d-api/v1/authorize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: WATSON_API_KEY,
      }),
    });

    if (!response.ok) {
      throw new Error(`CPD auth failed: ${response.status}`);
    }

    const data = await response.json();
    tokenCache = {
      token: data.token,
      expiresAt: Date.now() + (55 * 60 * 1000),
    };
    return data.token;
  }

  // Otherwise use IBM Cloud IAM
  // Extract the actual API key if it has a prefix
  const apiKey = WATSON_API_KEY.replace(/^cpd-apikey-/, '');
  
  const response = await fetch('https://iam.cloud.ibm.com/identity/token', {
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

  if (!response.ok) {
    const errorText = await response.text();
    console.error('IAM Token Error:', errorText);
    throw new Error(`Failed to get IAM token: ${response.status}`);
  }

  const data = await response.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (55 * 60 * 1000),
  };
  return data.access_token;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get Watson token
    const token = await getWatsonToken();

    // Parse the prompt to extract user message
    const userMessage = prompt.split('User:').pop()?.split('Assistant:')[0]?.trim() || prompt;

    const requestBody = {
      messages: [
        {
          role: 'user',
          content: userMessage,
        }
      ]
    };

    console.log('Sending request to Watson');

    const response = await fetch(WATSON_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Watson API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return res.status(response.status).json({ 
        error: `Watson API error: ${response.status} ${response.statusText}`,
        details: errorText 
      });
    }

    // Handle streaming response from Watson
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          // Watson uses "data: " prefix for SSE
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (!data || data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              // Watson format: choices[0].delta.content
              if (parsed.choices?.[0]?.delta?.content) {
                fullResponse += parsed.choices[0].delta.content;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    }

    if (!fullResponse) {
      fullResponse = "I'm sorry, I couldn't generate a response.";
    }

    return res.status(200).json({ response: fullResponse });
  } catch (error) {
    console.error('Watson API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to get response from Watson AI',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
