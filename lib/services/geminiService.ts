import { ChatMessage, SpendingCategory } from '../../types';

const SPENDING_COLORS = ["#0ea5e9", "#22c55e", "#f59e0b", "#6366f1", "#ec4899", "#8b5cf6", "#f43f5e"];

async function callGeminiApi(action: string, payload: any) {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'An unknown API error occurred');
  }

  return response.json();
}

export const getGeminiResponse = async (
  message: string,
  history: ChatMessage[]
): Promise<string> => {
  try {
    const result = await callGeminiApi('getGeminiResponse', { message, history });
    return result.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.";
  }
};

export const getPersonalizedPlan = async (tips: string[]): Promise<string> => {
    try {
        const result = await callGeminiApi('getPersonalizedPlan', { tips });
        return result.text;
    } catch (error) {
        console.error("Gemini Plan Generation Error:", error);
        throw new Error("Could not generate a personalized plan at this time. Please try again later.");
    }
};

export const getAIFinancialTips = async (
  categories: SpendingCategory[]
): Promise<string[]> => {
  try {
    const result = await callGeminiApi('getAIFinancialTips', { categories });
    const parsedResult = JSON.parse(result.text);

    if (!parsedResult.tips || !Array.isArray(parsedResult.tips) || parsedResult.tips.length < 3) {
      throw new Error("AI returned an invalid tips format.");
    }

    return parsedResult.tips;

  } catch (error) {
    console.error("Gemini Tips Generation Error:", error);
    return [
      "Review your subscriptions for potential savings.",
      "Consider setting a budget for dining out.",
      "Automate a small weekly transfer to your savings account.",
    ];
  }
};

export const getAIInsight = async (
  categories: SpendingCategory[]
): Promise<string> => {
  try {
    const result = await callGeminiApi('getAIInsight', { categories });
    return result.text;
  } catch (error) {
    console.error("Gemini Insight Generation Error:", error);
    return "You're doing a great job managing your Housing and Utilities costs. Reviewing your Entertainment spending could unlock extra savings this month.";
  }
};


export const getRecategorization = async (
  prompt: string,
  currentCategories: Omit<SpendingCategory, 'color'>[]
): Promise<Omit<SpendingCategory, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]> => {
  try {
    const result = await callGeminiApi('getRecategorization', { prompt, currentCategories });
    const newCategories = JSON.parse(result.text) as { name: string, value: number, budget: number }[];
    
    return newCategories.map((cat, index) => ({
      ...cat,
      color: SPENDING_COLORS[index % SPENDING_COLORS.length],
    }));

  } catch (error) {
    console.error("Gemini Recategorization Error:", error);
    throw new Error("Failed to generate new categories. Please try a different request.");
  }
};

export const extractExpenseDetails = async (
  prompt: string,
  categoryList: string[]
): Promise<{ description: string; amount: number; category: string }> => {
  try {
    const expenseDetails = await callGeminiApi('extractExpenseDetails', { prompt, categoryList });

    if (!categoryList.includes(expenseDetails.category)) {
        // Find closest match or use first category as fallback
        const closestMatch = categoryList.find(cat => 
          cat.toLowerCase().includes(expenseDetails.category.toLowerCase()) ||
          expenseDetails.category.toLowerCase().includes(cat.toLowerCase())
        ) || categoryList[0];
        
        console.warn(`AI returned invalid category "${expenseDetails.category}", using "${closestMatch}" instead`);
        expenseDetails.category = closestMatch;
    }

    return expenseDetails;

  } catch (error) {
    console.error("Gemini Expense Extraction Error:", error);
    throw new Error("I couldn't understand that expense. Please try phrasing it differently, like '50 dollars for groceries at Trader Joe's'.");
  }
};
