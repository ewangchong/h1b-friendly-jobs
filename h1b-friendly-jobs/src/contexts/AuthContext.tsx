import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, fullName?: string) => Promise<any>
  signOut: () => Promise<any>
  getCurrentUser: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user on mount (one-time check)
  useEffect(() => {
    async function loadUser() {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }
    loadUser()

    // Set up auth listener - KEEP SIMPLE, avoid any async operations in callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // NEVER use any async operations in callback
        setUser(session?.user || null)
        if (_event === 'SIGNED_IN' || _event === 'SIGNED_OUT') {
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Auth methods
  async function signIn(email: string, password: string) {
    const result = await supabase.auth.signInWithPassword({ email, password })
    return result
  }

  async function signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.protocol}//${window.location.host}/auth/callback`
      }
    })

    // If signup is successful and user is created, create profile
    if (data.user && !error) {
      try {
        await supabase.from('profiles').insert({
          user_id: data.user.id,
          email: email,
          full_name: fullName || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      } catch (profileError) {
        console.error('Error creating profile:', profileError)
      }
    }

    return { data, error }
  }

  async function signOut() {
    return await supabase.auth.signOut()
  }

  async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Error getting user:', error)
      return null
    }
    return user
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, getCurrentUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}