import { useState, useEffect, useCallback } from 'react'
import { Transaction } from '@/types'
import { getTransactions, createTransaction, deleteTransaction, subscribeToTransactions } from '@/lib/supabase/services/transactions'
import { useUser } from './useAuth'
import { supabase } from '@/lib/supabase/client'

interface UseTransactionsReturn {
  transactions: Transaction[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  hasMore: boolean
  loadMore: () => Promise<void>
}

const CACHE_KEY_PREFIX = 'finsmart_transactions_'

export function useTransactions(limit: number = 50): UseTransactionsReturn {
  const { user } = useUser()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // Load cached data on mount
  useEffect(() => {
    if (user?.id) {
      const cacheKey = `${CACHE_KEY_PREFIX}${user.id}`
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          setTransactions(JSON.parse(cached))
        } catch (err) {
          console.error('Error parsing cached transactions:', err)
        }
      }
    }
  }, [user?.id])

  const fetchTransactions = useCallback(async (reset: boolean = false) => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      const currentOffset = reset ? 0 : offset
      const data = await getTransactions(user.id, limit, currentOffset)
      
      if (reset) {
        setTransactions(data)
        setOffset(0)
        
        // Cache the data
        const cacheKey = `${CACHE_KEY_PREFIX}${user.id}`
        localStorage.setItem(cacheKey, JSON.stringify(data))
      } else {
        setTransactions(prev => [...prev, ...data])
      }
      
      // Check if there are more transactions to load
      setHasMore(data.length === limit)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions')
      console.error('Error fetching transactions:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id, limit, offset])

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    
    setOffset(prev => prev + limit)
    await fetchTransactions(false)
  }, [hasMore, loading, limit, fetchTransactions])

  const refetch = useCallback(async () => {
    setOffset(0)
    await fetchTransactions(true)
  }, [fetchTransactions])

  useEffect(() => {
    fetchTransactions(true)
  }, [user?.id, limit])

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return

    const channel = subscribeToTransactions(user.id, (updatedTransactions) => {
      setTransactions(updatedTransactions)
      setOffset(0)
      setHasMore(updatedTransactions.length === limit)
      
      // Update cache when real-time updates arrive
      const cacheKey = `${CACHE_KEY_PREFIX}${user.id}`
      localStorage.setItem(cacheKey, JSON.stringify(updatedTransactions))
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, limit])

  return {
    transactions,
    loading,
    error,
    refetch,
    hasMore,
    loadMore,
  }
}

interface UseAddTransactionReturn {
  addTransaction: (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => Promise<Transaction>
  adding: boolean
  error: string | null
}

export function useAddTransaction(
  onOptimisticAdd?: (transaction: Transaction) => void,
  onRollback?: (transactionId: string) => void
): UseAddTransactionReturn {
  const { user } = useUser()
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addTransaction = useCallback(async (
    transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at'>
  ): Promise<Transaction> => {
    if (!user?.id) {
      throw new Error('User not authenticated')
    }

    // Check if online
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('You are offline. Please connect to the internet to add transactions.')
    }

    setAdding(true)
    setError(null)

    // Create optimistic transaction with temporary ID
    const optimisticTransaction: Transaction = {
      ...transaction,
      id: `temp-${Date.now()}`,
      user_id: user.id,
      created_at: new Date().toISOString(),
    }

    // Apply optimistic update
    if (onOptimisticAdd) {
      onOptimisticAdd(optimisticTransaction)
    }

    try {
      const newTransaction = await createTransaction({
        ...transaction,
        user_id: user.id,
      })
      
      return newTransaction
    } catch (err) {
      // Rollback optimistic update on error
      if (onRollback) {
        onRollback(optimisticTransaction.id)
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to add transaction'
      setError(errorMessage)
      throw err
    } finally {
      setAdding(false)
    }
  }, [user?.id, onOptimisticAdd, onRollback])

  return {
    addTransaction,
    adding,
    error,
  }
}

interface UseDeleteTransactionReturn {
  deleteTransactionMutation: (id: string) => Promise<void>
  deleting: boolean
  error: string | null
}

export function useDeleteTransaction(): UseDeleteTransactionReturn {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteTransactionMutation = useCallback(async (id: string) => {
    setDeleting(true)
    setError(null)

    try {
      await deleteTransaction(id)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete transaction'
      setError(errorMessage)
      throw err
    } finally {
      setDeleting(false)
    }
  }, [])

  return {
    deleteTransactionMutation,
    deleting,
    error,
  }
}
