// Simple message type for Watson API (only needs role and content)
interface WatsonMessage {
  role: 'user' | 'ai';
  content: string;
}

export async function getWatsonResponse(
  userMessage: string,
  conversationHistory: WatsonMessage[]
): Promise<string> {
  try {
    // Build context from conversation history
    const context = conversationHistory
      .slice(-5) // Keep last 5 messages for context
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const prompt = context 
      ? `You are a helpful financial assistant for FinSmart app. Help users with their financial planning, budgeting, and spending questions.\n\n${context}\nUser: ${userMessage}\nAssistant:`
      : `You are a helpful financial assistant for FinSmart app. Help users with their financial planning, budgeting, and spending questions.\n\nUser: ${userMessage}\nAssistant:`;

    // Call our Next.js API route instead of Watson directly (to avoid CORS)
    const response = await fetch('/api/watson-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response.trim();
  } catch (error) {
    console.error('Watson API Error:', error);
    throw new Error('Failed to get response from Watson AI');
  }
}
