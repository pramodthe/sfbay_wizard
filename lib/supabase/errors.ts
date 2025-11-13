import { PostgrestError, AuthError } from '@supabase/supabase-js'

/**
 * Enum defining different types of errors that can occur in the application
 */
export enum SupabaseErrorType {
  AUTH_ERROR = 'AUTH_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Custom error class for Supabase-related errors
 */
export class SupabaseError extends Error {
  type: SupabaseErrorType
  originalError?: any
  
  constructor(message: string, type: SupabaseErrorType, originalError?: any) {
    super(message)
    this.name = 'SupabaseError'
    this.type = type
    this.originalError = originalError
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SupabaseError)
    }
  }
}

/**
 * User-friendly error messages for each error type
 */
export const ERROR_MESSAGES: Record<SupabaseErrorType, string> = {
  [SupabaseErrorType.AUTH_ERROR]: 'Authentication failed. Please log in again.',
  [SupabaseErrorType.NETWORK_ERROR]: 'Network error. Please check your connection.',
  [SupabaseErrorType.PERMISSION_ERROR]: 'You don\'t have permission to perform this action.',
  [SupabaseErrorType.VALIDATION_ERROR]: 'Invalid data. Please check your input.',
  [SupabaseErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
}

/**
 * Transforms a Supabase PostgrestError into a SupabaseError
 */
export function transformPostgrestError(error: PostgrestError): SupabaseError {
  // Check for specific error codes
  if (error.code === 'PGRST301') {
    return new SupabaseError(
      ERROR_MESSAGES[SupabaseErrorType.PERMISSION_ERROR],
      SupabaseErrorType.PERMISSION_ERROR,
      error
    )
  }
  
  if (error.code === '23505') {
    return new SupabaseError(
      'This record already exists.',
      SupabaseErrorType.VALIDATION_ERROR,
      error
    )
  }
  
  if (error.code === '23503') {
    return new SupabaseError(
      'Invalid reference. The related record does not exist.',
      SupabaseErrorType.VALIDATION_ERROR,
      error
    )
  }
  
  return new SupabaseError(
    error.message || ERROR_MESSAGES[SupabaseErrorType.UNKNOWN_ERROR],
    SupabaseErrorType.UNKNOWN_ERROR,
    error
  )
}

/**
 * Transforms a Supabase AuthError into a SupabaseError
 */
export function transformAuthError(error: AuthError): SupabaseError {
  // Check for specific auth error messages
  if (error.message.includes('Invalid login credentials')) {
    return new SupabaseError(
      'Invalid email or password.',
      SupabaseErrorType.AUTH_ERROR,
      error
    )
  }
  
  if (error.message.includes('Email not confirmed')) {
    return new SupabaseError(
      'Please confirm your email address before logging in.',
      SupabaseErrorType.AUTH_ERROR,
      error
    )
  }
  
  if (error.message.includes('User already registered')) {
    return new SupabaseError(
      'An account with this email already exists.',
      SupabaseErrorType.VALIDATION_ERROR,
      error
    )
  }
  
  return new SupabaseError(
    error.message || ERROR_MESSAGES[SupabaseErrorType.AUTH_ERROR],
    SupabaseErrorType.AUTH_ERROR,
    error
  )
}

/**
 * Transforms a generic error into a SupabaseError
 */
export function transformError(error: any): SupabaseError {
  // Already a SupabaseError
  if (error instanceof SupabaseError) {
    return error
  }
  
  // Supabase AuthError
  if (error?.name === 'AuthError' || error?.__isAuthError) {
    return transformAuthError(error)
  }
  
  // Supabase PostgrestError
  if (error?.code && error?.message && error?.details) {
    return transformPostgrestError(error)
  }
  
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new SupabaseError(
      ERROR_MESSAGES[SupabaseErrorType.NETWORK_ERROR],
      SupabaseErrorType.NETWORK_ERROR,
      error
    )
  }
  
  if (error?.message?.includes('NetworkError') || error?.message?.includes('Failed to fetch')) {
    return new SupabaseError(
      ERROR_MESSAGES[SupabaseErrorType.NETWORK_ERROR],
      SupabaseErrorType.NETWORK_ERROR,
      error
    )
  }
  
  // Generic error
  return new SupabaseError(
    error?.message || ERROR_MESSAGES[SupabaseErrorType.UNKNOWN_ERROR],
    SupabaseErrorType.UNKNOWN_ERROR,
    error
  )
}

/**
 * Gets a user-friendly error message from any error
 */
export function getErrorMessage(error: any): string {
  const supabaseError = transformError(error)
  return supabaseError.message
}

/**
 * Checks if an error is a network error
 */
export function isNetworkError(error: any): boolean {
  const supabaseError = transformError(error)
  return supabaseError.type === SupabaseErrorType.NETWORK_ERROR
}

/**
 * Checks if an error is an authentication error
 */
export function isAuthError(error: any): boolean {
  const supabaseError = transformError(error)
  return supabaseError.type === SupabaseErrorType.AUTH_ERROR
}

/**
 * Context information for error logging
 */
export interface ErrorContext {
  operation?: string
  userId?: string
  resourceId?: string
  resourceType?: string
  metadata?: Record<string, any>
}

/**
 * Structured error log entry
 */
export interface ErrorLogEntry {
  timestamp: string
  type: SupabaseErrorType
  message: string
  context?: ErrorContext
  stack?: string
  originalError?: any
  userAgent?: string
  url?: string
}

/**
 * Logs error details for debugging purposes with structured context
 */
export function logError(error: any, context?: string | ErrorContext): void {
  const supabaseError = transformError(error)
  
  // Parse context
  const contextObj: ErrorContext = typeof context === 'string' 
    ? { operation: context }
    : context || {}
  
  // Build structured log entry
  const logEntry: ErrorLogEntry = {
    timestamp: new Date().toISOString(),
    type: supabaseError.type,
    message: supabaseError.message,
    context: contextObj,
    stack: supabaseError.stack,
    originalError: supabaseError.originalError,
  }
  
  // Add browser context if available
  if (typeof window !== 'undefined') {
    logEntry.userAgent = window.navigator.userAgent
    logEntry.url = window.location.href
  }
  
  // Log to console with structured format
  console.error('[SupabaseError]', logEntry)
  
  // In production, you could send this to a logging service
  // Example: sendToLoggingService(logEntry)
}

/**
 * Logs database operation errors with detailed context
 */
export function logDatabaseError(
  error: any,
  operation: string,
  resourceType: string,
  resourceId?: string,
  userId?: string,
  metadata?: Record<string, any>
): void {
  logError(error, {
    operation,
    resourceType,
    resourceId,
    userId,
    metadata,
  })
}

/**
 * Logs authentication errors with user context
 */
export function logAuthError(
  error: any,
  operation: string,
  email?: string,
  metadata?: Record<string, any>
): void {
  logError(error, {
    operation,
    resourceType: 'authentication',
    metadata: {
      ...metadata,
      email: email ? maskEmail(email) : undefined,
    },
  })
}

/**
 * Masks email address for privacy (shows first 2 chars and domain)
 */
function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@')
  if (!domain) return '***'
  
  const maskedLocal = localPart.length > 2 
    ? `${localPart.substring(0, 2)}***`
    : '***'
  
  return `${maskedLocal}@${domain}`
}
