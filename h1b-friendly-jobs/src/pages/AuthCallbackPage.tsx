import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash fragment from the URL
        const hashFragment = window.location.hash

        if (hashFragment && hashFragment.length > 0) {
          // Exchange the auth code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(hashFragment)

          if (error) {
            console.error('Error exchanging code for session:', error.message)
            toast.error('Authentication failed: ' + error.message)
            navigate('/login?error=' + encodeURIComponent(error.message))
            return
          }

          if (data.session) {
            // Successfully signed in, redirect to app
            toast.success('Successfully verified! Welcome to H1B Friendly Jobs.')
            navigate('/dashboard') // or your app's main page
            return
          }
        }

        // If we get here, something went wrong
        toast.error('No session found. Please try signing in again.')
        navigate('/login?error=No session found')
      } catch (error) {
        console.error('Auth callback error:', error)
        toast.error('Authentication error occurred')
        navigate('/login')
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">H1B</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Verifying your account...
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please wait while we verify your email address.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <p className="mt-4 text-center text-gray-600">
            Authenticating your account...
          </p>
        </div>
      </div>
    </div>
  )
}