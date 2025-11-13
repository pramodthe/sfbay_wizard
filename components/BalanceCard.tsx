import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import { useAppContext } from '../context/AppContext';
import { useGoals } from '../hooks/useGoals';

export default function BalanceCard() {
  const { 
    categories, 
    categoriesLoading, 
    categoriesError,
    transactions,
    transactionsLoading,
    transactionsError,
    dummyBalance,
  } = useAppContext();
  
  const { goals, loading: goalsLoading, error: goalsError } = useGoals();

  const monthlyOverviewData = useMemo(() => {
    // Get last 6 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[date.getMonth()];
      
      // Calculate expenses for this month
      const monthTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.created_at);
        return txDate.getMonth() === date.getMonth() && txDate.getFullYear() === date.getFullYear();
      });
      const expenses = monthTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      
      // Calculate total budget
      const totalBudget = categories.reduce((sum, cat) => sum + cat.budget, 0);
      
      // Calculate savings (simplified - using goals progress)
      const savings = goals.reduce((sum, goal) => sum + goal.current_amount, 0) / 6; // Distribute evenly
      
      // Calculate balance - use dummy balance for current month if set
      const isCurrentMonth = i === 0;
      let balance;
      if (isCurrentMonth && dummyBalance !== null) {
        balance = dummyBalance;
      } else {
        balance = totalBudget - expenses + savings;
      }
      
      data.push({
        month: monthName,
        balance: Math.round(balance),
        savings: Math.round(savings),
        expenses: Math.round(expenses),
      });
    }

    return data;
  }, [categories, transactions, goals, dummyBalance]);

  const isLoading = categoriesLoading || transactionsLoading || goalsLoading;
  const hasError = categoriesError || transactionsError || goalsError;

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-xl">Financial Overview</CardTitle>
          <CardDescription>Month-over-month balance, savings, and expenses.</CardDescription>
        </CardHeader>
        <CardContent className="h-96 w-full pt-4 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading financial data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasError) {
    const errorMessage = categoriesError || transactionsError || goalsError || 'Failed to load data';
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-xl">Financial Overview</CardTitle>
          <CardDescription>Month-over-month balance, savings, and expenses.</CardDescription>
        </CardHeader>
        <CardContent className="h-96 w-full pt-4 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">{errorMessage}</p>
            <p className="mt-2 text-sm text-gray-600">Please try refreshing the page</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl">Financial Overview</CardTitle>
        <CardDescription>Month-over-month balance, savings, and expenses.</CardDescription>
      </CardHeader>
      <CardContent className="h-96 w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthlyOverviewData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis 
              yAxisId="left" 
              stroke="#0ea5e9"
              tickFormatter={(value) => `${(value as number / 1000).toFixed(0)}k`} 
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#f59e0b"
              tickFormatter={(value) => `${(value as number / 1000).toFixed(1)}k`}
            />
            <Tooltip 
              formatter={(value, name) => [`${Number(value).toLocaleString()}`, name]} 
              contentStyle={{
                borderRadius: '0.75rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="balance" name="Total Balance" stroke="#0ea5e9" strokeWidth={2} activeDot={{ r: 6 }} />
            <Line yAxisId="right" type="monotone" dataKey="savings" name="Savings" stroke="#22c55e" strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="expenses" name="Expenses" stroke="#f59e0b" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
