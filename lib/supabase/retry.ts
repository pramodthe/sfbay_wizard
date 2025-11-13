import { isNetworkError, logError } from './errors'

/**
 * Configuration options for retry logic
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number
  /** Base delay in milliseconds before first retry */
  baseDelay?: number
  /** Maximum delay in milliseconds between retries */
  maxDelay?: number
  /** Function to determine if an error should trigger a retry */
  shouldRetry?: (error: any) => boolean
  /** Callback function called before each retry attempt */
  onRetry?: (error: any, attempt: number) => void
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  shouldRetry: (error: any) => {
    // Retry on network errors by default
    return isNetworkError(error)
  },
  onRetry: () => {}
}

/**
 * Calculates the delay for the next retry attempt using exponential backoff
 * @param attempt - The current attempt number (0-indexed)
 * @param baseDelay - The base delay in milliseconds
 * @param maxDelay - The maximum delay in milliseconds
 * @returns The delay in milliseconds
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number
): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt)
  
  // Add jitter (random factor between 0.5 and 1.5) to prevent thundering herd
  const jitter = 0.5 + Math.random()
  const delayWithJitter = exponentialDelay * jitter
  
  // Cap at maxDelay
  return Math.min(delayWithJitter, maxDelay)
}

/**
 * Executes an async operation with retry logic and exponential backoff
 * @param operation - The async function to execute
 * @param options - Retry configuration options
 * @returns The result of the operation
 * @throws The last error if all retries are exhausted
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: any
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Execute the operation
      return await operation()
    } catch (error) {
      lastError = error
      
      // Check if we should retry
      const isLastAttempt = attempt === config.maxRetries
      const shouldRetry = config.shouldRetry(error)
      
      if (isLastAttempt || !shouldRetry) {
        // Log the final error
        logError(error, `Operation failed after ${attempt + 1} attempts`)
        throw error
      }
      
      // Calculate delay for next retry
      const delay = calculateBackoffDelay(attempt, config.baseDelay, config.maxDelay)
      
      // Log retry attempt
      logError(error, `Retry attempt ${attempt + 1}/${config.maxRetries}`)
      
      // Call onRetry callback
      config.onRetry(error, attempt + 1)
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError
}

/**
 * Creates a retry wrapper function with pre-configured options
 * @param options - Retry configuration options
 * @returns A function that wraps operations with retry logic
 */
export function createRetryWrapper(options: RetryOptions = {}) {
  return <T>(operation: () => Promise<T>): Promise<T> => {
    return withRetry(operation, options)
  }
}

/**
 * Retry wrapper specifically for database operations
 * Retries on network errors and certain database errors
 */
export const withDatabaseRetry = createRetryWrapper({
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 5000,
  shouldRetry: (error: any) => {
    // Retry on network errors
    if (isNetworkError(error)) {
      return true
    }
    
    // Retry on specific database errors (e.g., connection issues)
    if (error?.code === 'PGRST301' || error?.code === '08000') {
      return true
    }
    
    return false
  }
})

/**
 * Retry wrapper for authentication operations
 * More conservative retry policy for auth operations
 */
export const withAuthRetry = createRetryWrapper({
  maxRetries: 2,
  baseDelay: 1000,
  maxDelay: 3000,
  shouldRetry: (error: any) => {
    // Only retry on network errors for auth
    return isNetworkError(error)
  }
})
