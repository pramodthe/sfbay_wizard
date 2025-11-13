import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Wand2, LoaderCircle, Home, Utensils, Car, Receipt, Ticket, Zap, HeartPulse, ShoppingBag, Banknote, Shield, Package } from 'lucide-react';
import { extractExpenseDetails } from '../lib/services/geminiService';
import { useAppContext } from '../context/AppContext';

const categoryIcons: { [key: string]: React.ElementType } = {
  'Housing': Home,
  'Food': Utensils,
  'Transportation': Car,
  'Debt Payments': Receipt,
  'Entertainment': Ticket,
  'Utilities': Zap,
  'Savings & Investments': Banknote,
  'Healthcare': HeartPulse,
  'Personal': ShoppingBag,
  'Insurance': Shield,
  'Default': Package
};

export default function RecordExpense() {
  const { 
    categories, 
    transactions, 
    addExpense, 
    addingExpense, 
    addExpenseError,
    categoriesLoading,
    transactionsLoading 
  } = useAppContext();
  
  const [expenseInput, setExpenseInput] = useState('');
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseInput.trim() || aiProcessing || addingExpense) return;

    setAiProcessing(true);
    setAiError(null);

    try {
      const categoryNames = categories.map(c => c.name);
      const expenseDetails = await extractExpenseDetails(expenseInput, categoryNames);
      
      // Persist transaction to Supabase
      await addExpense(expenseDetails);
      
      setExpenseInput('');
    } catch (err: any) {
        setAiError(err.message || "An unexpected error occurred.");
    } finally {
        setAiProcessing(false);
    }
  };

  const isLoading = aiProcessing || addingExpense;
  const error = aiError || addExpenseError;

  const getIcon = (categoryName: string) => {
    return categoryIcons[categoryName] || categoryIcons['Default'];
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-indigo-500" />
          <CardTitle className="text-xl">AI Expense Recorder</CardTitle>
        </div>
        <CardDescription>Describe your expense and let AI handle it</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            placeholder="e.g., $55.25 for groceries at Whole Foods" 
            value={expenseInput}
            onChange={(e) => {
              setExpenseInput(e.target.value)
              setAiError(null)
            }}
            disabled={aiProcessing || addingExpense}
            required
          />
          <Button type="submit" className="w-full" disabled={isLoading || !expenseInput.trim()}>
            {isLoading ? (
              <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
            ) : (
              "Add Expense"
            )}
          </Button>
        </form>
        {error && <p className="mt-2 text-center text-sm text-rose-600">{error}</p>}
        
        <div className="mt-6">
          <h4 className="text-sm font-medium text-slate-600 mb-2">Recent Transactions</h4>
          <div className="h-[15.5rem] space-y-3 overflow-y-auto pr-2">
            {transactionsLoading ? (
              <div className="flex items-center justify-center h-full">
                <LoaderCircle className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-slate-400">No transactions yet</p>
              </div>
            ) : (
              transactions.map((t, i) => {
                const Icon = getIcon(t.category_name);
                const catDetails = categories.find(c => c.name === t.category_name);
                return (
                  <div key={t.id || i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: catDetails ? `${catDetails.color}20` : '#e2e8f0' }}>
                        <Icon className="h-4 w-4" style={{ color: catDetails?.color }}/>
                      </div>
                      <div className="overflow-hidden">
                        <p className="truncate text-sm font-medium text-slate-800">{t.description}</p>
                        <p className="text-xs text-slate-500">{t.category_name}</p>
                      </div>
                    </div>
                    <p className="flex-shrink-0 pl-2 text-sm font-semibold text-slate-900">-${t.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}