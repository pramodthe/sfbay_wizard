import { supabase } from '../client'
import { Transaction } from '@/types'
import { logDatabaseError } from '../errors'

// Retry utility with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, i)))
    }
  }
  throw new Error('Max retries exceeded')
}

// Error handling wrapper
function handleError(error: any, operation: string, userId?: string, transactionId?: string): never {
  logDatabaseError(error, operation, 'transaction', transactionId, userId)
  throw new Error(`Failed to ${operation}: ${error.message || 'Unknown error'}`)
}

export async function getTransactions(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Transaction[]> {
  try {
    return await withRetry(async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      
      return data || []
    })
  } catch (error) {
    handleError(error, 'get transactions', userId)
  }
}

export async function createTransaction(
  transaction: Omit<Transaction, 'id' | 'created_at'> & { user_id: string }
): Promise<Transaction> {
  try {
    return await withRetry(async () => {
      // Start a transaction to update both the transaction and category
      const { data: newTransaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: transaction.user_id,
          category_id: transaction.category_id,
          description: transaction.description,
          amount: transaction.amount,
          category_name: transaction.category_name,
        })
        .select()
        .single()

      if (transactionError) throw transactionError

      // Update the category value if category_id is provided
      if (transaction.category_id) {
        // Get current category value
        const { data: category, error: categoryFetchError } = await supabase
          .from('spending_categories')
          .select('value')
          .eq('id', transaction.category_id)
          .single()

        if (categoryFetchError) {
          logDatabaseError(
            categoryFetchError, 
            'fetch category for transaction update', 
            'spending_category', 
            transaction.category_id, 
            transaction.user_id
          )
        } else if (category) {
          // Update category value
          const newValue = (category.value || 0) + transaction.amount
          const { error: categoryUpdateError } = await supabase
            .from('spending_categories')
            .update({ 
              value: newValue,
              updated_at: new Date().toISOString()
            })
            .eq('id', transaction.category_id)

          if (categoryUpdateError) {
            logDatabaseError(
              categoryUpdateError, 
              'update category value after transaction', 
              'spending_category', 
              transaction.category_id, 
              transaction.user_id
            )
          }
        }
      }

      return newTransaction
    })
  } catch (error) {
    handleError(error, 'create transaction', transaction.user_id)
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  try {
    return await withRetry(async () => {
      // First, get the transaction to update the category value
      const { data: transaction, error: fetchError } = await supabase
        .from('transactions')
        .select('category_id, amount, user_id')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // Delete the transaction
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Update the category value if category_id exists
      if (transaction?.category_id) {
        const { data: category, error: categoryFetchError } = await supabase
          .from('spending_categories')
          .select('value')
          .eq('id', transaction.category_id)
          .single()

        if (categoryFetchError) {
          logDatabaseError(
            categoryFetchError, 
            'fetch category for transaction deletion', 
            'spending_category', 
            transaction.category_id, 
            transaction.user_id
          )
        } else if (category) {
          const newValue = Math.max(0, (category.value || 0) - transaction.amount)
          const { error: categoryUpdateError } = await supabase
            .from('spending_categories')
            .update({ 
              value: newValue,
              updated_at: new Date().toISOString()
            })
            .eq('id', transaction.category_id)

          if (categoryUpdateError) {
            logDatabaseError(
              categoryUpdateError, 
              'update category value after transaction deletion', 
              'spending_category', 
              transaction.category_id, 
              transaction.user_id
            )
          }
        }
      }
    })
  } catch (error) {
    handleError(error, 'delete transaction', undefined, id)
  }
}

export function subscribeToTransactions(
  userId: string,
  callback: (transactions: Transaction[]) => void
) {
  const channel = supabase
    .channel('transactions-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        // Refetch all transactions when any change occurs
        try {
          const transactions = await getTransactions(userId)
          callback(transactions)
        } catch (error) {
          logDatabaseError(error, 'refetch transactions on real-time update', 'transaction', undefined, userId)
        }
      }
    )
    .subscribe()

  return channel
}
