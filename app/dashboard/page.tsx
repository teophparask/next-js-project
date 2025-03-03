'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  username?: string
  avatar_url?: string
  roles?: string[]
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutMessage, setLogoutMessage] = useState('')
  const router = useRouter()
  
  useEffect(() => {
    // Get user from localStorage (set during login)
    const storedUser = localStorage.getItem('user')
    
    if (!storedUser) {
      // If no user found, redirect to login
      router.push('/')
      return
    }
    
    try {
      setUser(JSON.parse(storedUser))
    } catch (e) {
      console.error('Failed to parse user data', e)
      localStorage.removeItem('user')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }, [router])
  
  const handleLogout = async () => {
    try {
      setLoggingOut(true)
      setLogoutMessage('Logging out...')
      
      // Call logout API endpoint
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      
      setLogoutMessage('Logout successful! Redirecting...')
      
      // Clear local storage
      localStorage.removeItem('user')
      
      // Delay redirect for feedback
      setTimeout(() => {
        router.push('/')
      }, 1000)
    } catch (error) {
      console.error('Logout error:', error)
      setLogoutMessage('Error during logout. Redirecting anyway...')
      
      // Clear local storage and redirect regardless of API success
      localStorage.removeItem('user')
      setTimeout(() => {
        router.push('/')
      }, 1000)
    }
  }

  // If we're still determining if user is authenticated
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <div className="text-gray-700">Loading your dashboard...</div>
        </div>
      </main>
    )
  }

  // If logging out, show logout message
  if (loggingOut) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <div className="text-gray-700">{logoutMessage}</div>
        </div>
      </main>
    )
  }

  const userName = user?.first_name || user?.username || user?.email?.split('@')[0] || 'User'

  return (
    <main className="flex min-h-screen flex-col p-4 bg-gray-50">
      <div className="max-w-4xl w-full mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            Logout
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6 transition-all duration-300 hover:shadow-md">
          <h2 className="text-2xl font-bold mb-4">Welcome, {userName}!</h2>
          <p className="text-gray-600">
            You have successfully logged in to your account.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6 transition-all duration-300 hover:shadow-md">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
              </svg>
              Account Overview
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Account type:</span>
                <span className="font-medium">
                  {user?.roles?.includes('admin') ? (
                    <span className="bg-purple-100 text-purple-800 text-xs font-medium py-1 px-2 rounded">
                      Administrator
                    </span>
                  ) : (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium py-1 px-2 rounded">
                      Standard
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">User ID:</span>
                <span className="font-medium text-sm text-gray-500">{user?.id}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 transition-all duration-300 hover:shadow-md">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 001.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
              </svg>
              Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Last login:</span>
                <span className="font-medium">{new Date().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Device:</span>
                <span className="font-medium">Web Browser</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}