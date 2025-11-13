import React from 'react'
import { SupabaseErrorType, getErrorMessage } from '../lib/supabase/errors'

interface ErrorMessageProps {
  error: any
  className?: string
  onRetry?: () => void
  onDismiss?: () => void
}

/**
 * Component for displaying error messages with optional retry and dismiss actions
 */
export function ErrorMessage({ error, className = '', onRetry, onDismiss }: ErrorMessageProps) {
  if (!error) return null
  
  const message = getErrorMessage(error)
  
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-red-800">{message}</p>
        </div>
        <div className="ml-auto pl-3 flex gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm font-medium text-red-800 hover:text-red-900 underline"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-red-400 hover:text-red-500"
              aria-label="Dismiss"
            >
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

interface InlineErrorProps {
  error: any
  className?: string
}

/**
 * Compact inline error message for form fields
 */
export function InlineError({ error, className = '' }: InlineErrorProps) {
  if (!error) return null
  
  const message = getErrorMessage(error)
  
  return (
    <p className={`text-sm text-red-600 mt-1 ${className}`}>
      {message}
    </p>
  )
}
