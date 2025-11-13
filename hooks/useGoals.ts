import { useState, useEffect, useCallback } from 'react'
import { 
  FinancialGoal,
  getGoals, 
  createGoal, 
  updateGoal, 
  addContribution,
  subscribeToGoals 
} from '@/lib/supabase/services/goals'
import { useUser } from './useAuth'
import { supabase } from '@/lib/supabase/client'

interface UseGoalsReturn {
  goals: FinancialGoal[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const CACHE_KEY_PREFIX = 'finsmart_goals_'

export function useGoals(): UseGoalsReturn {
  const { user } = useUser()
  const [goals, setGoals] = useState<FinancialGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load cached data on mount
  useEffect(() => {
    if (user?.id) {
      const cacheKey = `${CACHE_KEY_PREFIX}${user.id}`
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          setGoals(JSON.parse(cached))
        } catch (err) {
          console.error('Error parsing cached goals:', err)
        }
      }
    }
  }, [user?.id])

  const fetchGoals = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      const data = await getGoals(user.id)
      setGoals(data)
      
      // Cache the data
      const cacheKey = `${CACHE_KEY_PREFIX}${user.id}`
      localStorage.setItem(cacheKey, JSON.stringify(data))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goals')
      console.error('Error fetching goals:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return

    const channel = subscribeToGoals(user.id, (updatedGoals) => {
      setGoals(updatedGoals)
      
      // Update cache when real-time updates arrive
      const cacheKey = `${CACHE_KEY_PREFIX}${user.id}`
      localStorage.setItem(cacheKey, JSON.stringify(updatedGoals))
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  return {
    goals,
    loading,
    error,
    refetch: fetchGoals,
  }
}

interface UseAddGoalReturn {
  addGoal: (goal: Omit<FinancialGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<FinancialGoal>
  adding: boolean
  error: string | null
}

export function useAddGoal(): UseAddGoalReturn {
  const { user } = useUser()
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addGoal = useCallback(async (
    goal: Omit<FinancialGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<FinancialGoal> => {
    if (!user?.id) {
      throw new Error('User not authenticated')
    }

    // Check if online
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('You are offline. Please connect to the internet to add goals.')
    }

    setAdding(true)
    setError(null)

    try {
      const newGoal = await createGoal({
        ...goal,
        user_id: user.id,
      })
      return newGoal
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add goal'
      setError(errorMessage)
      throw err
    } finally {
      setAdding(false)
    }
  }, [user?.id])

  return {
    addGoal,
    adding,
    error,
  }
}

interface UseUpdateGoalReturn {
  updateGoalMutation: (id: string, updates: Partial<FinancialGoal>) => Promise<void>
  addContributionMutation: (goalId: string, amount: number) => Promise<void>
  updating: boolean
  error: string | null
}

export function useUpdateGoal(
  onOptimisticUpdate?: (goalId: string, updates: Partial<FinancialGoal>) => void,
  onRollback?: (goalId: string, previousData: Partial<FinancialGoal>) => void
): UseUpdateGoalReturn {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateGoalMutation = useCallback(async (
    id: string,
    updates: Partial<Omit<FinancialGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ) => {
    setUpdating(true)
    setError(null)

    // Store previous data for rollback
    const previousData = { ...updates }

    // Apply optimistic update
    if (onOptimisticUpdate) {
      onOptimisticUpdate(id, updates)
    }

    try {
      await updateGoal(id, updates)
    } catch (err) {
      // Rollback optimistic update on error
      if (onRollback) {
        onRollback(id, previousData)
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to update goal'
      setError(errorMessage)
      throw err
    } finally {
      setUpdating(false)
    }
  }, [onOptimisticUpdate, onRollback])

  const addContributionMutation = useCallback(async (
    goalId: string,
    amount: number
  ) => {
    // Check if online
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('You are offline. Please connect to the internet to add contributions.')
    }

    setUpdating(true)
    setError(null)

    // Apply optimistic update
    if (onOptimisticUpdate) {
      onOptimisticUpdate(goalId, { current_amount: amount })
    }

    try {
      await addContribution(goalId, amount)
    } catch (err) {
      // Rollback optimistic update on error
      if (onRollback) {
        onRollback(goalId, { current_amount: -amount })
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to add contribution'
      setError(errorMessage)
      throw err
    } finally {
      setUpdating(false)
    }
  }, [onOptimisticUpdate, onRollback])

  return {
    updateGoalMutation,
    addContributionMutation,
    updating,
    error,
  }
}
