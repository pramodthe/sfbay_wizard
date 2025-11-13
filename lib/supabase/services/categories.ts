import { supabase } from '../client'
import { SpendingCategory } from '@/types'
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
function handleError(error: any, operation: string, userId?: string, categoryId?: string): never {
  logDatabaseError(error, operation, 'spending_category', categoryId, userId)
  throw new Error(`Failed to ${operation}: ${error.message || 'Unknown error'}`)
}

export async function getCategories(userId: string): Promise<SpendingCategory[]> {
  try {
    return await withRetry(async () => {
      const { data, error } = await supabase
        .from('spending_categories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (error) throw error
      
      return data || []
    })
  } catch (error) {
    handleError(error, 'get categories', userId)
  }
}

export async function createCategory(
  category: Omit<SpendingCategory, 'id' | 'created_at' | 'updated_at'> & { user_id: string }
): Promise<SpendingCategory> {
  try {
    return await withRetry(async () => {
      const { data, error } = await supabase
        .from('spending_categories')
        .insert({
          user_id: category.user_id,
          name: category.name,
          value: category.value || 0,
          budget: category.budget,
          color: category.color,
        })
        .select()
        .single()

      if (error) throw error
      
      return data
    })
  } catch (error) {
    handleError(error, 'create category', category.user_id, undefined)
  }
}

export async function updateCategory(
  id: string,
  updates: Partial<Omit<SpendingCategory, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<SpendingCategory> {
  try {
    return await withRetry(async () => {
      const { data, error } = await supabase
        .from('spending_categories')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      return data
    })
  } catch (error) {
    handleError(error, 'update category', undefined, id)
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    return await withRetry(async () => {
      const { error } = await supabase
        .from('spending_categories')
        .delete()
        .eq('id', id)

      if (error) throw error
    })
  } catch (error) {
    handleError(error, 'delete category', undefined, id)
  }
}

export function subscribeToCategories(
  userId: string,
  callback: (categories: SpendingCategory[]) => void
) {
  const channel = supabase
    .channel('categories-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'spending_categories',
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        // Refetch all categories when any change occurs
        try {
          const categories = await getCategories(userId)
          callback(categories)
        } catch (error) {
          logDatabaseError(error, 'refetch categories on real-time update', 'spending_category', undefined, userId)
        }
      }
    )
    .subscribe()

  return channel
}
