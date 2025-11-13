import { supabase } from '../client'
import { logDatabaseError } from '../errors'

export interface FinancialGoal {
  id: string
  user_id: string
  title: string
  target_amount: number
  current_amount: number
  months_remaining: number
  created_at: string
  updated_at: string
}

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
function handleError(error: any, operation: string, userId?: string, goalId?: string): never {
  logDatabaseError(error, operation, 'financial_goal', goalId, userId)
  throw new Error(`Failed to ${operation}: ${error.message || 'Unknown error'}`)
}

export async function getGoals(userId: string): Promise<FinancialGoal[]> {
  try {
    return await withRetry(async () => {
      const { data, error } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (error) throw error
      
      return data || []
    })
  } catch (error) {
    handleError(error, 'get goals', userId)
  }
}

export async function createGoal(
  goal: Omit<FinancialGoal, 'id' | 'created_at' | 'updated_at'> & { user_id: string }
): Promise<FinancialGoal> {
  try {
    return await withRetry(async () => {
      const { data, error } = await supabase
        .from('financial_goals')
        .insert({
          user_id: goal.user_id,
          title: goal.title,
          target_amount: goal.target_amount,
          current_amount: goal.current_amount || 0,
          months_remaining: goal.months_remaining,
        })
        .select()
        .single()

      if (error) throw error
      
      return data
    })
  } catch (error) {
    handleError(error, 'create goal', goal.user_id)
  }
}

export async function updateGoal(
  id: string,
  updates: Partial<Omit<FinancialGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<FinancialGoal> {
  try {
    return await withRetry(async () => {
      const { data, error } = await supabase
        .from('financial_goals')
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
    handleError(error, 'update goal', undefined, id)
  }
}

export async function deleteGoal(id: string): Promise<void> {
  try {
    return await withRetry(async () => {
      const { error } = await supabase
        .from('financial_goals')
        .delete()
        .eq('id', id)

      if (error) throw error
    })
  } catch (error) {
    handleError(error, 'delete goal', undefined, id)
  }
}

export async function addContribution(
  goalId: string,
  amount: number
): Promise<FinancialGoal> {
  try {
    return await withRetry(async () => {
      // Get current goal
      const { data: goal, error: fetchError } = await supabase
        .from('financial_goals')
        .select('current_amount, user_id')
        .eq('id', goalId)
        .single()

      if (fetchError) throw fetchError
      if (!goal) throw new Error('Goal not found')

      // Update with new contribution
      const newAmount = (goal.current_amount || 0) + amount
      const { data, error } = await supabase
        .from('financial_goals')
        .update({
          current_amount: newAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', goalId)
        .select()
        .single()

      if (error) throw error
      
      return data
    })
  } catch (error) {
    handleError(error, 'add contribution to goal', undefined, goalId)
  }
}

export function subscribeToGoals(
  userId: string,
  callback: (goals: FinancialGoal[]) => void
) {
  const channel = supabase
    .channel('goals-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'financial_goals',
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        // Refetch all goals when any change occurs
        try {
          const goals = await getGoals(userId)
          callback(goals)
        } catch (error) {
          logDatabaseError(error, 'refetch goals on real-time update', 'financial_goal', undefined, userId)
        }
      }
    )
    .subscribe()

  return channel
}
