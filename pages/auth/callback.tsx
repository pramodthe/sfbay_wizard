import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase/client'
import { seedUserData } from '../../lib/supabase/seed'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSeeding, setIsSeeding] = useState(false)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for error in URL params (OAuth provider errors)
        const urlParams = new URLSearchParams(window.location.search)
        const errorParam = urlParams.get('error')
        const errorDescription = urlParams.get('error_description')

        if (errorParam) {
          console.error('OAuth provider error:', errorParam, errorDescription)
          setError(errorDescription || 'Authentication failed. Please try again.')
          
          // Redirect to login after a delay
          setTimeout(() => {
            router.push('/login')
          }, 3000)
          return
        }

        // Get the session from Supabase
        const { data, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Error establishing session:', sessionError)
          
          // Provide more specific error messages
          if (sessionError.message.includes('refresh_token_not_found')) {
            setError('Session expired. Please sign in again.')
          } else if (sessionError.message.includes('invalid_grant')) {
            setError('Invalid authentication. Please try signing in again.')
          } else {
            setError('Failed to establish session. Please try again.')
          }
          
          // Redirect to login after a delay
          setTimeout(() => {
            router.push('/login')
          }, 3000)
          return
        }

        if (!data.session) {
          console.error('No session found after OAuth callback')
          setError('Authentication failed. Please try again.')
          
          // Redirect to login after a delay
          setTimeout(() => {
            router.push('/login')
          }, 3000)
          return
        }

        // Session established successfully
        const userId = data.session.user.id
        
        // Trigger initial data seeding for new OAuth users
        setIsSeeding(true)
        try {
          await seedUserData(userId)
        } catch (seedError) {
          // Log the error but don't block the OAuth flow
          console.error('Failed to seed user data:', seedError)
          // User can still proceed to the dashboard
        } finally {
          setIsSeeding(false)
        }
        
        // Redirect to dashboard
        router.push('/')
      } catch (err) {
        console.error('Unexpected error during OAuth callback:', err)
        
        // Provide user-friendly error message
        if (err instanceof Error) {
          if (err.message.includes('network')) {
            setError('Network error. Please check your connection and try again.')
          } else {
            setError('An unexpected error occurred. Please try again.')
          }
        } else {
          setError('An unexpected error occurred. Please try again.')
        }
        
        // Redirect to login after a delay
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        {error ? (
          <>
            <div className="mb-4">
              <svg
                className="w-16 h-16 text-red-500 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Authentication Failed
            </h2>
            <p className="text-slate-600 mb-4">{error}</p>
            <p className="text-sm text-slate-500">
              Redirecting to login page...
            </p>
          </>
        ) : (
          <>
            <div className="mb-4">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {isSeeding ? 'Setting Up Your Account' : 'Completing Sign In'}
            </h2>
            <p className="text-slate-600">
              {isSeeding 
                ? 'Creating your default categories and sample data...'
                : 'Please wait while we set up your account...'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
