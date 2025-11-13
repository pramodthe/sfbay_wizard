import React, { useMemo, useState } from 'react';
import { Card, CardContent } from './ui/Card';
import { useAppContext } from '../context/AppContext';
import { useGoals } from '../hooks/useGoals';

const SummaryCardSkeleton = ({ gradient }: { gradient: string }) => {
  return (
    <Card className="relative overflow-hidden shadow-md">
      <div className={`absolute left-0 right-0 top-0 h-1.5 bg-gradient-to-r ${gradient}`} />
      <CardContent className="p-4 pt-6">
        <div className="h-9 w-32 bg-slate-200 rounded animate-pulse" />
        <div className="mt-1 h-4 w-24 bg-slate-200 rounded animate-pulse" />
        <div className="mt-4 h-6 w-28 bg-slate-200 rounded-full animate-pulse" />
      </CardContent>
    </Card>
  );
};

interface SummaryCardData {
  value: string;
  label: string;
  badge: {
    text: string;
    color: string;
  };
  gradient: string;
}

const SummaryCard = ({ data, onEdit }: { data: SummaryCardData; onEdit?: () => void }) => {
  return (
    <Card className="relative overflow-hidden shadow-md">
      <div className={`absolute left-0 right-0 top-0 h-1.5 bg-gradient-to-r ${data.gradient}`} />
      <CardContent className="p-4 pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-3xl font-bold text-slate-900">{data.value}</h3>
            <p className="mt-1 text-sm text-slate-600">{data.label}</p>
          </div>
          {onEdit && (
            <button
              onClick={onEdit}
              className="ml-2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              title="Edit balance"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
        </div>
        <div className={`mt-4 inline-block rounded-full px-3 py-1 text-xs font-semibold ${data.badge.color}`}>
          {data.badge.text}
        </div>
      </CardContent>
    </Card>
  );
};

const ErrorCard = ({ message, gradient }: { message: string; gradient: string }) => {
  return (
    <Card className="relative overflow-hidden shadow-md">
      <div className={`absolute left-0 right-0 top-0 h-1.5 bg-gradient-to-r ${gradient}`} />
      <CardContent className="p-4 pt-6">
        <p className="text-sm text-red-600">{message}</p>
      </CardContent>
    </Card>
  );
};

export default function SummaryCards() {
  const { 
    categories, 
    categoriesLoading, 
    categoriesError,
    transactions,
    transactionsLoading,
    transactionsError,
    dummyBalance,
    setDummyBalance,
  } = useAppContext();
  
  const { goals, loading: goalsLoading, error: goalsError } = useGoals();
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceInput, setBalanceInput] = useState('');

  const summaryData = useMemo(() => {
    // Calculate total budget and total spent
    const totalBudget = categories.reduce((sum, cat) => sum + cat.budget, 0);
    const totalSpent = categories.reduce((sum, cat) => sum + cat.value, 0);
    const currentBalance = dummyBalance !== null ? dummyBalance : totalBudget - totalSpent;
    
    // Calculate this month's spending
    const now = new Date();
    const thisMonthTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.created_at);
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    });
    const thisMonthSpending = thisMonthTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    
    // Calculate total savings goal and progress
    const totalGoalTarget = goals.reduce((sum, goal) => sum + goal.target_amount, 0);
    const totalGoalProgress = goals.reduce((sum, goal) => sum + goal.current_amount, 0);
    const goalsPercentage = totalGoalTarget > 0 ? Math.round((totalGoalProgress / totalGoalTarget) * 100) : 0;
    
    // Calculate savings growth (simplified - comparing current to target)
    const savingsGrowth = totalGoalTarget > 0 ? Math.round((totalGoalProgress / totalGoalTarget) * 100) : 0;

    return [
      {
        value: `$${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        label: 'Current Balance',
        badge: {
          text: currentBalance >= 0 ? 'On Track' : 'Over Budget',
          color: currentBalance >= 0 ? 'bg-teal-600/80 text-white' : 'bg-rose-500/80 text-white',
        },
        gradient: 'from-amber-400 to-emerald-400',
      },
      {
        value: `$${thisMonthSpending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        label: 'This Month',
        badge: {
          text: `${thisMonthTransactions.length} transactions`,
          color: 'bg-blue-600/80 text-white',
        },
        gradient: 'from-emerald-400 to-amber-400',
      },
      {
        value: `$${totalGoalProgress.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        label: 'Savings Progress',
        badge: {
          text: `${goalsPercentage}% complete`,
          color: 'bg-teal-600/80 text-white',
        },
        gradient: 'from-emerald-400 to-green-500',
      },
      {
        value: `${savingsGrowth}%`,
        label: 'Savings Goal',
        badge: {
          text: `${goals.length} active goals`,
          color: 'bg-teal-600/80 text-white',
        },
        gradient: 'from-green-500 to-amber-400',
      },
    ];
  }, [categories, transactions, goals, dummyBalance]);

  const isLoading = categoriesLoading || transactionsLoading || goalsLoading;
  const hasError = categoriesError || transactionsError || goalsError;

  if (isLoading) {
    return (
      <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCardSkeleton gradient="from-amber-400 to-emerald-400" />
        <SummaryCardSkeleton gradient="from-emerald-400 to-amber-400" />
        <SummaryCardSkeleton gradient="from-emerald-400 to-green-500" />
        <SummaryCardSkeleton gradient="from-green-500 to-amber-400" />
      </div>
    );
  }

  if (hasError) {
    const errorMessage = categoriesError || transactionsError || goalsError || 'Failed to load data';
    return (
      <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <ErrorCard message={errorMessage} gradient="from-amber-400 to-emerald-400" />
        <ErrorCard message={errorMessage} gradient="from-emerald-400 to-amber-400" />
        <ErrorCard message={errorMessage} gradient="from-emerald-400 to-green-500" />
        <ErrorCard message={errorMessage} gradient="from-green-500 to-amber-400" />
      </div>
    );
  }

  const handleEditBalance = () => {
    setBalanceInput(dummyBalance !== null ? dummyBalance.toString() : '');
    setShowBalanceModal(true);
  };

  const handleSaveBalance = () => {
    const value = parseFloat(balanceInput);
    if (!isNaN(value)) {
      setDummyBalance(value);
    }
    setShowBalanceModal(false);
  };

  const handleResetBalance = () => {
    setDummyBalance(null);
    setShowBalanceModal(false);
  };

  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {summaryData.map((item, index) => (
          <SummaryCard 
            key={item.label} 
            data={item} 
            onEdit={index === 0 ? handleEditBalance : undefined}
          />
        ))}
      </div>

      {/* Balance Edit Modal */}
      {showBalanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Set Balance Amount</h3>
            <div className="mb-4">
              <label htmlFor="balance-input" className="block text-sm font-medium text-slate-700 mb-2">
                Enter balance amount
              </label>
              <input
                id="balance-input"
                type="number"
                step="0.01"
                value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveBalance}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Save
              </button>
              <button
                onClick={handleResetBalance}
                className="flex-1 bg-slate-200 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-300 transition-colors font-medium"
              >
                Reset
              </button>
              <button
                onClick={() => setShowBalanceModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}