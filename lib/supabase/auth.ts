import { supabase } from './client'
import type { User, AuthError, Session } from '@supabase/supabase-js'
import { logAuthError } from './errors'

export interface AuthResponse {
  user: User | null
  session: Session | null
  error: AuthError | null
}

export interface AuthService {
  signUp(email: string, password: string): Promise<AuthResponse>
  signIn(email: string, password: string): Promise<AuthResponse>
  signOut(): Promise<{ error: AuthError | null }>
  signInWithGoogle(): Promise<AuthResponse>
  getCurrentUser(): Promise<User | null>
  onAuthStateChange(callback: (user: User | null) => void): { unsubscribe: () => void }
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      logAuthError(error, 'signUp', email)
      return { user: null, session: null, error }
    }

    return {
      user: data.user,
      session: data.session,
      error: null,
    }
  } catch (err) {
    logAuthError(err, 'signUp', email, { unexpected: true })
    return {
      user: null,
      session: null,
      error: {
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
        name: 'UnknownError',
        status: 500,
      } as AuthError,
    }
  }
}

/**
 * Sign in an existing user with email and password
 */
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      logAuthError(error, 'signIn', email)
      return { user: null, session: null, error }
    }

    return {
      user: data.user,
      session: data.session,
      error: null,
    }
  } catch (err) {
    logAuthError(err, 'signIn', email, { unexpected: true })
    return {
      user: null,
      session: null,
      error: {
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
        name: 'UnknownError',
        status: 500,
      } as AuthError,
    }
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      logAuthError(error, 'signOut')
    }
    return { error }
  } catch (err) {
    logAuthError(err, 'signOut', undefined, { unexpected: true })
    return {
      error: {
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
        name: 'UnknownError',
        status: 500,
      } as AuthError,
    }
  }
}

/**
 * Sign in with Google OAuth provider
 */
export async function signInWithGoogle(): Promise<AuthResponse> {
  try {
    // Validate that we're in a browser environment
    if (typeof window === 'undefined') {
      const error = {
        message: 'OAuth can only be initiated from the browser',
        name: 'EnvironmentError',
        status: 400,
      } as AuthError
      logAuthError(error, 'signInWithGoogle', undefined, { environment: 'server' })
      return {
        user: null,
        session: null,
        error,
      }
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      // Provide more specific error messages for common OAuth errors
      let errorMessage = error.message
      
      if (error.message.includes('provider not enabled')) {
        errorMessage = 'Google OAuth is not enabled. Please contact support.'
      } else if (error.message.includes('invalid_request')) {
        errorMessage = 'Invalid OAuth configuration. Please contact support.'
      } else if (error.message.includes('access_denied')) {
        errorMessage = 'Access was denied. Please try again.'
      }

      logAuthError(error, 'signInWithGoogle', undefined, { 
        provider: 'google',
        originalMessage: error.message 
      })

      return { 
        user: null, 
        session: null, 
        error: {
          ...error,
          message: errorMessage,
        } as AuthError
      }
    }

    // OAuth redirects, so we won't have user/session immediately
    return {
      user: null,
      session: null,
      error: null,
    }
  } catch (err) {
    let errorMessage = 'An unexpected error occurred during sign in'
    
    if (err instanceof Error) {
      if (err.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (err.message.includes('popup')) {
        errorMessage = 'Popup was blocked. Please allow popups for this site.'
      }
    }

    logAuthError(err, 'signInWithGoogle', undefined, { 
      provider: 'google',
      unexpected: true 
    })

    return {
      user: null,
      session: null,
      error: {
        message: errorMessage,
        name: 'UnknownError',
        status: 500,
      } as AuthError,
    }
  }
}

/**
 * Get the currently authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      logAuthError(error, 'getCurrentUser')
      return null
    }

    return user
  } catch (err) {
    logAuthError(err, 'getCurrentUser', undefined, { unexpected: true })
    return null
  }
}

/**
 * Subscribe to authentication state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void): { unsubscribe: () => void } {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })

  return {
    unsubscribe: () => subscription.unsubscribe(),
  }
}
