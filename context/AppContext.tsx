import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { SpendingCategory, Transaction } from '../types';
import { useCategories } from '../hooks/useCategories';
import { useTransactions, useAddTransaction } from '../hooks/useTransactions';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface AppContextType {
  categories: SpendingCategory[];
  categoriesLoading: boolean;
  categoriesError: string | null;
  transactions: Transaction[];
  transactionsLoading: boolean;
  transactionsError: string | null;
  addExpense: (expense: { description: string; amount: number; category: string }) => Promise<void>;
  addingExpense: boolean;
  addExpenseError: string | null;
  isOnline: boolean;
  dummyBalance: number | null;
  setDummyBalance: (balance: number | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  // Local state for optimistic updates
  const [optimisticTransactions, setOptimisticTransactions] = useState<Transaction[]>([]);
  
  // Dummy balance state
  const [dummyBalance, setDummyBalance] = useState<number | null>(null);
  
  // Online status
  const isOnline = useOnlineStatus();

  // Use Supabase hooks for categories and transactions
  const { 
    categories, 
    loading: categoriesLoading, 
    error: categoriesError 
  } = useCategories();
  
  const { 
    transactions: dbTransactions, 
    loading: transactionsLoading, 
    error: transactionsError 
  } = useTransactions();

  // Optimistic update handlers
  const handleOptimisticAdd = useCallback((transaction: Transaction) => {
    setOptimisticTransactions(prev => [transaction, ...prev]);
  }, []);

  const handleRollback = useCallback((transactionId: string) => {
    setOptimisticTransactions(prev => prev.filter(t => t.id !== transactionId));
  }, []);
  
  const { 
    addTransaction, 
    adding: addingExpense, 
    error: addExpenseError 
  } = useAddTransaction(handleOptimisticAdd, handleRollback);

  // Merge optimistic and real transactions, removing optimistic ones that have been persisted
  const transactions = React.useMemo(() => {
    // Filter out optimistic transactions that have been persisted
    const persistedIds = new Set(dbTransactions.map(t => t.description + t.amount));
    const validOptimistic = optimisticTransactions.filter(
      t => !persistedIds.has(t.description + t.amount)
    );
    return [...validOptimistic, ...dbTransactions];
  }, [dbTransactions, optimisticTransactions]);

  const addExpense = async (expense: { description: string; amount: number; category: string }) => {
    // Check if user is online before attempting to add expense
    if (!isOnline) {
      throw new Error('You are offline. Please connect to the internet to add expenses.');
    }
    
    // Find the category_id from the category name
    const category = categories.find(cat => cat.name === expense.category);
    
    try {
      await addTransaction({
        description: expense.description,
        amount: expense.amount,
        category_name: expense.category,
        category_id: category?.id || null,
      });
      
      // Clear optimistic transaction after successful add
      // The real-time subscription will add the persisted version
      setTimeout(() => {
        setOptimisticTransactions(prev => 
          prev.filter(t => t.description !== expense.description || t.amount !== expense.amount)
        );
      }, 1000);
    } catch (err) {
      // Error handling is done in the hook
      throw err;
    }
  };

  return (
    <AppContext.Provider value={{ 
      categories, 
      categoriesLoading,
      categoriesError,
      transactions, 
      transactionsLoading,
      transactionsError,
      addExpense,
      addingExpense,
      addExpenseError,
      isOnline,
      dummyBalance,
      setDummyBalance,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
