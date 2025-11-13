import { useState, useEffect, useCallback } from 'react'
import { ChatMessage } from '@/types'
import { getMessages, createMessage, clearHistory } from '@/lib/supabase/services/chat'
import { useUser } from './useAuth'

// Extended ChatMessage with database fields
interface DbChatMessage extends ChatMessage {
  id: string
  user_id: string
  created_at: string
}

interface UseChatHistoryReturn {
  messages: DbChatMessage[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  clearMessages: () => Promise<void>
}

const CACHE_KEY_PREFIX = 'finsmart_chat_'

/**
 * Hook to manage chat history with loading states
 * Automatically loads messages when user is authenticated
 */
export function useChatHistory(limit: number = 100): UseChatHistoryReturn {
  const { user } = useUser()
  const [messages, setMessages] = useState<DbChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load cached data on mount
  useEffect(() => {
    if (user?.id) {
      const cacheKey = `${CACHE_KEY_PREFIX}${user.id}`
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          setMessages(JSON.parse(cached))
        } catch (err) {
          console.error('Error parsing cached messages:', err)
        }
      }
    }
  }, [user?.id])

  const fetchMessages = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      const data = await getMessages(user.id, limit)
      setMessages(data)
      
      // Cache the data
      const cacheKey = `${CACHE_KEY_PREFIX}${user.id}`
      localStorage.setItem(cacheKey, JSON.stringify(data))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages')
      console.error('Error fetching messages:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id, limit])

  const clearMessages = useCallback(async () => {
    if (!user?.id) return

    // Check if online
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('You are offline. Please connect to the internet to clear chat history.')
    }

    try {
      setError(null)
      await clearHistory(user.id)
      setMessages([])
      
      // Clear cache
      const cacheKey = `${CACHE_KEY_PREFIX}${user.id}`
      localStorage.removeItem(cacheKey)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear history')
      console.error('Error clearing messages:', err)
      throw err
    }
  }, [user?.id])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  return {
    messages,
    loading,
    error,
    refetch: fetchMessages,
    clearMessages,
  }
}

interface UseAddChatMessageReturn {
  addMessage: (role: 'user' | 'ai', content: string) => Promise<DbChatMessage>
  adding: boolean
  error: string | null
}

/**
 * Hook for adding chat messages with automatic persistence
 * Provides optimistic updates for better UX
 */
export function useAddChatMessage(): UseAddChatMessageReturn {
  const { user } = useUser()
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addMessage = useCallback(async (
    role: 'user' | 'ai',
    content: string
  ): Promise<DbChatMessage> => {
    if (!user?.id) {
      throw new Error('User must be authenticated to add messages')
    }

    // Check if online
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('You are offline. Please connect to the internet to send messages.')
    }

    setAdding(true)
    setError(null)

    try {
      const message = await createMessage({
        user_id: user.id,
        role,
        content,
      })
      return message
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add message'
      setError(errorMessage)
      throw err
    } finally {
      setAdding(false)
    }
  }, [user?.id])

  return {
    addMessage,
    adding,
    error,
  }
}
