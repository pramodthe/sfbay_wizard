import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, SpendingCategory } from '../../types';

const SPENDING_COLORS = ["#0ea5e9", "#22c55e", "#f59e0b", "#6366f1", "#ec4899", "#8b5cf6", "#f43f5e"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { action, payload } = req.body;
    
    // Initialize AI client with API key from environment
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    try {
        switch (action) {
            case 'getGeminiResponse': {
                const { message, history } = payload as { message: string, history: ChatMessage[] };
                const chatHistory = history.map((msg) => ({
                    role: msg.role === 'ai' ? 'model' : 'user',
                    parts: [{ text: msg.content }],
                }));

                const chat = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    history: chatHistory,
                    config: {
                        systemInstruction: 'You are a helpful and knowledgeable personal finance assistant. You help users understand their dashboard data, provide savings tips, and answer financial questions. Keep your answers concise, encouraging, and easy to read.',
                    },
                });

                const response = await chat.sendMessage({ message });
                return res.status(200).json({ text: response.text });
            }

            case 'getPersonalizedPlan': {
                const { tips } = payload as { tips: string[] };
                const prompt = `
                    You are an expert financial coach. A user named Alex has received the following automated tips this week:
                    - Tip 1: "${tips[0]}"
                    - Tip 2: "${tips[1]}"
                    - Tip 3: "${tips[2]}"

                    Based on these specific tips, create a concise, actionable, and personalized financial plan for Alex.
                    The plan should have three sections:
                    1.  **Savings Strategy:** How to boost savings based on the tips.
                    2.  **Debt Management:** If applicable, or general advice on keeping debt low.
                    3.  **Smart Spending:** Concrete actions to adjust spending habits.

                    Address Alex directly. Use Markdown for formatting with headings (e.g., "## Your Savings Strategy") and bullet points (*).
                    The tone should be encouraging and motivational. Ensure the output is only the Markdown plan.
                `;
                const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
                return res.status(200).json({ text: response.text });
            }
            
            case 'getAIFinancialTips': {
                const { categories } = payload as { categories: SpendingCategory[] };
                const prompt = `You are an expert financial coach AI for a personal finance dashboard.
                Analyze the user's current monthly spending data provided below. Each category has a 'name', 'value' (amount spent), and 'budget' (allocated amount).

                Current spending data: ${JSON.stringify(categories.map(c => ({ name: c.name, value: c.value, budget: c.budget })))}

                Your task is to:
                1.  Identify key areas of overspending or opportunities for savings.
                2.  Generate exactly three distinct, short, and actionable financial tips based on this data.
                3.  The tips should be encouraging and practical. For example, if 'Food' is over budget, you could suggest reducing 'Entertainment' spending.
                4.  Return ONLY a valid JSON object containing a single key "tips", which is an array of exactly three strings.`;

                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                          type: Type.OBJECT,
                          properties: {
                            tips: {
                              type: Type.ARRAY,
                              items: {
                                type: Type.STRING,
                                description: "A single financial tip.",
                              },
                              description: "An array of exactly three financial tips.",
                            },
                          },
                          required: ["tips"],
                        },
                    },
                });
                return res.status(200).json({ text: response.text });
            }

            case 'getAIInsight': {
                const { categories } = payload as { categories: SpendingCategory[] };
                 const prompt = `You are an expert financial analyst AI for a personal finance dashboard.
                Analyze the user's current monthly spending data provided below. Each category has a 'name', 'value' (amount spent), and 'budget' (allocated amount).

                Current spending data: ${JSON.stringify(categories.map(c => ({ name: c.name, value: c.value, budget: c.budget })))}

                Your task is to:
                1. Review the entire financial condition based on the spending vs. budget data.
                2. Provide a short, concise summary (around 40-60 words) of their financial health.
                3. The tone should be neutral and informative, but can be slightly encouraging. Highlight one positive aspect and one area for improvement.
                4. Return ONLY the summary as a single string. Do not use Markdown, JSON, or any other formatting.`;
                const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
                return res.status(200).json({ text: response.text });
            }
            
            case 'getRecategorization': {
                const { prompt, currentCategories } = payload as { prompt: string, currentCategories: Omit<SpendingCategory, 'color'>[] };
                const modelPrompt = `You are a data analysis assistant for a financial app.
                The user wants to regroup their spending categories.
                User's request: "${prompt}"
                Current categories JSON: ${JSON.stringify(currentCategories)}
                
                Each category has a 'name', a 'value' (amount spent), and a 'budget' (allocated amount).
                
                Your task is to:
                1. Interpret the user's request to create new categories.
                2. Group the original items under these new categories.
                3. Sum the 'value' for each new category.
                4. Sum the 'budget' for each new category.
                5. Ensure the total value of all new categories equals the total value of all original categories.
                6. Ensure the total budget of all new categories equals the total budget of all original categories.
                7. Return ONLY a valid JSON array of the new categories, each with 'name', 'value', and 'budget'. Do not return any other text or explanations.`;

                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: modelPrompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              name: { type: Type.STRING },
                              value: { type: Type.NUMBER },
                              budget: { type: Type.NUMBER },
                            },
                            required: ["name", "value", "budget"],
                          },
                        },
                    },
                });
                return res.status(200).json({ text: response.text });
            }
            
            case 'extractExpenseDetails': {
                const { prompt, categoryList } = payload as { prompt: string, categoryList: string[] };
                const modelPrompt = `You are an expense parsing assistant for a financial app.
                The user has provided a natural language description of an expense.
                User's input: "${prompt}"

                Your task is to extract three pieces of information:
                1.  A short 'description' of the expense (e.g., "Groceries", "Trader Joe's", "Monthly Rent").
                2.  The 'amount' of the expense as a number.
                3.  The 'category' of the expense. You MUST choose one of the following valid categories: ${JSON.stringify(categoryList)}. If the user mentions a category, use it if it's in the list. Otherwise, infer the best fit.

                Return ONLY a valid JSON object with 'description', 'amount', and 'category'. Do not return any other text or explanations.`;

                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: modelPrompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                          type: Type.OBJECT,
                          properties: {
                            description: { type: Type.STRING, description: "A short description of the transaction." },
                            amount: { type: Type.NUMBER, description: "The numerical amount of the expense." },
                            category: { type: Type.STRING, description: `The expense category. Must be one of: ${categoryList.join(', ')}.` },
                          },
                          required: ["description", "amount", "category"],
                        },
                    },
                });
                const expenseDetails = JSON.parse(response.text || '{}');
                return res.status(200).json(expenseDetails);
            }

            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error(`Gemini API Error for action ${action}:`, error);
        return res.status(500).json({ error: `An error occurred while processing the action: ${action}` });
    }
}
