'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth')
      
      // Handle non-OK responses gracefully
      if (!response.ok) {
        setUser(null)
        setLoading(false)
        return
      }
      
      let data
      try {
        const text = await response.text()
        data = text ? JSON.parse(text) : {}
      } catch (parseError) {
        console.error('Error parsing auth response:', parseError)
        setUser(null)
        setLoading(false)
        return
      }
      
      if (data.authenticated && data.user) {
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      // Silently fail - user might not be logged in, which is fine
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      // Check if response is ok before parsing
      let data
      try {
        const text = await response.text()
        data = text ? JSON.parse(text) : {}
      } catch (parseError) {
        console.error('Error parsing response:', parseError)
        return { success: false, error: 'Server error: Invalid response. Please try again.' }
      }

      if (response.ok && data.success) {
        setUser(data.user)
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      
      // Provide more specific error messages
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { success: false, error: 'Cannot connect to server. Please make sure the development server is running (npm run dev).' }
      } else if (error.message?.includes('Failed to fetch')) {
        return { success: false, error: 'Server is not responding. Please check if the development server is running.' }
      } else {
        return { success: false, error: error.message || 'Network error. Please try again.' }
      }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' })
      setUser(null)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear user state even if API call fails
      setUser(null)
      router.push('/')
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    // Return a safe default instead of throwing
    console.warn('useAuth called outside AuthProvider, returning default values')
    return {
      user: null,
      loading: false,
      login: async () => ({ success: false, error: 'Auth not available' }),
      logout: async () => {},
      checkAuth: async () => {},
    }
  }
  return context
}
