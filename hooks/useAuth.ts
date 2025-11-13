import { useState, useEffect, useCallback } from 'react'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase/client'
import * as authService from '../lib/supabase/auth'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: AuthError | null
}

/**
 * Hook to manage authentication state and operations
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          setState(prev => ({ ...prev, loading: false, error }))
          return
        }

        setState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null,
        })
      } catch (err) {
        setState({
          user: null,
          session: null,
          loading: false,
          error: {
            message: err instanceof Error ? err.message : 'Failed to initialize auth',
            name: 'InitializationError',
            status: 500,
          } as AuthError,
        })
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null,
        })
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    const result = await authService.signUp(email, password)
    
    if (result.error) {
      setState(prev => ({ ...prev, loading: false, error: result.error }))
    } else {
      setState({
        user: result.user,
        session: result.session,
        loading: false,
        error: null,
      })
    }
    
    return result
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    const result = await authService.signIn(email, password)
    
    if (result.error) {
      setState(prev => ({ ...prev, loading: false, error: result.error }))
    } else {
      setState({
        user: result.user,
        session: result.session,
        loading: false,
        error: null,
      })
    }
    
    return result
  }, [])

  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    const { error } = await authService.signOut()
    
    if (error) {
      setState(prev => ({ ...prev, loading: false, error }))
    } else {
      setState({
        user: null,
        session: null,
        loading: false,
        error: null,
      })
    }
    
    return { error }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    const result = await authService.signInWithGoogle()
    
    if (result.error) {
      setState(prev => ({ ...prev, loading: false, error: result.error }))
    }
    // Note: OAuth will redirect, so state update may not be visible
    
    return result
  }, [])

  return {
    user: state.user,
    session: state.session,
    loading: state.loading,
    error: state.error,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
  }
}

/**
 * Hook to get the current user
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
        setLoading(false)
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : 'Failed to load user',
          name: 'UserLoadError',
          status: 500,
        } as AuthError)
        setLoading(false)
      }
    }

    loadUser()

    // Subscribe to auth changes
    const { unsubscribe } = authService.onAuthStateChange((newUser) => {
      setUser(newUser)
      setLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return { user, loading, error }
}

/**
 * Hook to get the current session
 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)

  useEffect(() => {
    const loadSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          setError(error)
        } else {
          setSession(session)
        }
        setLoading(false)
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : 'Failed to load session',
          name: 'SessionLoadError',
          status: 500,
        } as AuthError)
        setLoading(false)
      }
    }

    loadSession()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession)
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { session, loading, error }
}
