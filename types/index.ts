export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'ai';
  content: string;
  created_at: string;
}

export interface SpendingCategory {
  id: string;
  user_id: string;
  name: string;
  value: number; // Represents actual spending
  budget: number; // The allocated budget for the category
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  description: string;
  amount: number;
  category_name: string;
  created_at: string;
}

export interface FinancialGoal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  months_remaining: number;
  created_at: string;
  updated_at: string;
}
