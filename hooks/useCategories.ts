import { useState, useEffect, useCallback } from 'react'
import { SpendingCategory } from '@/types'
import { getCategories, updateCategory, subscribeToCategories, createCategory } from '@/lib/supabase/services/categories'
import { useUser } from './useAuth'
import { supabase } from '@/lib/supabase/client'

interface UseCategoriesReturn {
  categories: SpendingCategory[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const CACHE_KEY_PREFIX = 'finsmart_categories_'

// Fixed categories that should always exist
const FIXED_CATEGORIES = [
  'Food and Groceries',
  'Shopping',
  'Housing',
  'Transportation',
  'Debt Payments',
  'Entertainment',
  'Utilities',
  'Healthcare',
  'Personal',
  'Insurance',
]

// Default colors for categories
const DEFAULT_COLORS = [
  '#10b981', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
]

export function useCategories(): UseCategoriesReturn {
  const { user } = useUser()
  const [categories, setCategories] = useState<SpendingCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load cached data on mount
  useEffect(() => {
    if (user?.id) {
      const cacheKey = `${CACHE_KEY_PREFIX}${user.id}`
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          setCategories(JSON.parse(cached))
        } catch (err) {
          console.error('Error parsing cached categories:', err)
        }
      }
    }
  }, [user?.id])

  const fetchCategories = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      const data = await getCategories(user.id)
      
      // Check if any fixed categories are missing
      const existingCategoryNames = new Set(data.map(cat => cat.name))
      const missingCategories = FIXED_CATEGORIES.filter(
        name => !existingCategoryNames.has(name)
      )
      
      // Create missing fixed categories
      if (missingCategories.length > 0) {
        const newCategories = await Promise.all(
          missingCategories.map((name, index) => 
            createCategory({
              user_id: user.id,
              name,
              value: 0,
              budget: 0,
              color: DEFAULT_COLORS[FIXED_CATEGORIES.indexOf(name) % DEFAULT_COLORS.length],
            })
          )
        )
        
        // Merge with existing categories
        const allCategories = [...data, ...newCategories]
        
        // Sort to maintain fixed category order
        const sortedCategories = allCategories.sort((a, b) => {
          const aIndex = FIXED_CATEGORIES.indexOf(a.name)
          const bIndex = FIXED_CATEGORIES.indexOf(b.name)
          
          // If both are fixed categories, sort by fixed order
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex
          }
          // Fixed categories come first
          if (aIndex !== -1) return -1
          if (bIndex !== -1) return 1
          // Non-fixed categories maintain their order
          return 0
        })
        
        setCategories(sortedCategories)
        
        // Cache the data
        const cacheKey = `${CACHE_KEY_PREFIX}${user.id}`
        localStorage.setItem(cacheKey, JSON.stringify(sortedCategories))
      } else {
        // Sort existing categories by fixed order
        const sortedCategories = data.sort((a, b) => {
          const aIndex = FIXED_CATEGORIES.indexOf(a.name)
          const bIndex = FIXED_CATEGORIES.indexOf(b.name)
          
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex
          }
          if (aIndex !== -1) return -1
          if (bIndex !== -1) return 1
          return 0
        })
        
        setCategories(sortedCategories)
        
        // Cache the data
        const cacheKey = `${CACHE_KEY_PREFIX}${user.id}`
        localStorage.setItem(cacheKey, JSON.stringify(sortedCategories))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories')
      console.error('Error fetching categories:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return

    const channel = subscribeToCategories(user.id, (updatedCategories) => {
      setCategories(updatedCategories)
      
      // Update cache when real-time updates arrive
      const cacheKey = `${CACHE_KEY_PREFIX}${user.id}`
      localStorage.setItem(cacheKey, JSON.stringify(updatedCategories))
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  }
}

interface UseUpdateCategoryReturn {
  updateCategoryMutation: (id: string, updates: Partial<SpendingCategory>) => Promise<void>
  updating: boolean
  error: string | null
}

export function useUpdateCategory(
  onOptimisticUpdate?: (id: string, updates: Partial<SpendingCategory>) => void,
  onRollback?: (id: string, previousData: Partial<SpendingCategory>) => void
): UseUpdateCategoryReturn {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateCategoryMutation = useCallback(async (
    id: string,
    updates: Partial<Omit<SpendingCategory, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ) => {
    // Check if online
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('You are offline. Please connect to the internet to update categories.')
    }

    setUpdating(true)
    setError(null)

    // Store previous data for rollback
    const previousData = { ...updates }

    // Apply optimistic update
    if (onOptimisticUpdate) {
      onOptimisticUpdate(id, updates)
    }

    try {
      await updateCategory(id, updates)
    } catch (err) {
      // Rollback optimistic update on error
      if (onRollback) {
        onRollback(id, previousData)
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to update category'
      setError(errorMessage)
      throw err
    } finally {
      setUpdating(false)
    }
  }, [onOptimisticUpdate, onRollback])

  return {
    updateCategoryMutation,
    updating,
    error,
  }
}
