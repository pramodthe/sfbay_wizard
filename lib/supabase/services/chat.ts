import { supabase } from '../client'
import { ChatMessage } from '@/types'
import { logDatabaseError } from '../errors'

// Database ChatMessage interface (includes id, user_id, created_at)
interface DbChatMessage extends ChatMessage {
  id: string
  user_id: string
  created_at: string
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
function handleError(error: any, operation: string, userId?: string, messageId?: string): never {
  logDatabaseError(error, operation, 'chat_message', messageId, userId)
  throw new Error(`Failed to ${operation}: ${error.message || 'Unknown error'}`)
}

/**
 * Retrieves chat messages for a user with a limit of 100 messages
 * Messages are ordered by creation time (oldest first)
 */
export async function getMessages(userId: string, limit: number = 100): Promise<DbChatMessage[]> {
  try {
    return await withRetry(async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(limit)

      if (error) throw error
      
      return data || []
    })
  } catch (error) {
    handleError(error, 'get messages', userId)
  }
}

/**
 * Creates a new chat message (user or AI)
 */
export async function createMessage(
  message: { user_id: string; role: 'user' | 'ai'; content: string }
): Promise<DbChatMessage> {
  try {
    return await withRetry(async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: message.user_id,
          role: message.role,
          content: message.content,
        })
        .select()
        .single()

      if (error) throw error
      
      return data
    })
  } catch (error) {
    handleError(error, 'create message', message.user_id)
  }
}

/**
 * Clears all chat history for a user
 */
export async function clearHistory(userId: string): Promise<void> {
  try {
    return await withRetry(async () => {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', userId)

      if (error) throw error
    })
  } catch (error) {
    handleError(error, 'clear history', userId)
  }
}
