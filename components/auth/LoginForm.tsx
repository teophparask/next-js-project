'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingState, setLoadingState] = useState('')
  const [resendVerification, setResendVerification] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const router = useRouter()

  const handleResendVerification = async () => {
    if (!verificationEmail) return
    
    setResendLoading(true)
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: verificationEmail }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification email')
      }
      
      setResendVerification(false)
      setSuccess('Verification email resent! Please check your inbox.')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to resend verification email')
    } finally {
      setResendLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    setResendVerification(false)

    // Simple validation
    if (!email || !password || (!isLogin && !name)) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    try {
      if (isLogin) {
        setLoadingState('Authenticating...')
        // Handle login with API
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        })

        const data = await response.json()

        if (!response.ok) {
          // Special handling for unverified users
          if (response.status === 403 && data.error.includes('verify your email')) {
            setError('Your email is not verified. Please check your inbox for a verification link.')
            setVerificationEmail(email)
            setResendVerification(true)
            setLoading(false)
            return
          }
          
          throw new Error(data.error || 'Login failed')
        }

        // Store user info in localStorage for client access
        localStorage.setItem('user', JSON.stringify(data.user))
        
        // Show success message
        setSuccess('Login successful! Redirecting to dashboard...')
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      } else {
        setLoadingState('Creating account...')
        // Handle signup with API
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, password }),
        })
        
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Signup failed')
        }
        
        // Show success message with verification instructions
        setSuccess(data.message || 'Account created! Please check your email to verify your account.')
        
        // If we're in development and have a direct verification URL, show it
        if (data.verificationUrl) {
          setSuccess(prev => `${prev} For development: <a href="${data.verificationUrl}" class="text-blue-600 hover:underline" target="_blank">Click here to verify</a>`)
        }
        
        // Reset form
        if (!isLogin) {
          setEmail('')
          setPassword('')
          setName('')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
      setLoadingState('')
    }
  }

  // Handle form mode toggle with animation
  const toggleForm = () => {
    setError('')
    setSuccess('')
    setIsLogin(!isLogin)
    setResendVerification(false)
    // Clear fields when switching modes
    if (isLogin) {
      setName('')
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md transition-all duration-300">
      <h2 className="text-2xl font-bold text-center mb-6">
        {isLogin ? 'Login to Your Account' : 'Create New Account'}
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded animate-fadeIn">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}
      
      {resendVerification && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded animate-fadeIn">
          <p className="mb-2">Need a new verification email?</p>
          <button 
            onClick={handleResendVerification}
            disabled={resendLoading}
            className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-1 px-3 rounded transition-colors duration-200 disabled:opacity-70"
          >
            {resendLoading ? 'Sending...' : 'Resend Verification Email'}
          </button>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded animate-fadeIn">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span dangerouslySetInnerHTML={{ __html: success }}></span>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div className="transition-all duration-300 ease-in-out">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              required
              disabled={loading}
              placeholder="John Doe"
            />
          </div>
        )}
        
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            required
            disabled={loading}
            placeholder="your@email.com"
          />
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            required
            disabled={loading}
            minLength={8}
          />
          {!isLogin && (
            <p className="mt-1 text-sm text-gray-500">
              Password must be at least 8 characters long
            </p>
          )}
        </div>
        
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 relative"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {loadingState || 'Processing...'}
              </span>
            ) : (
              <span>{isLogin ? 'Log In' : 'Sign Up'}</span>
            )}
          </button>
        </div>
        
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={toggleForm}
            disabled={loading}
            className="text-blue-500 hover:text-blue-700 text-sm font-medium transition-colors duration-200"
          >
            {isLogin ? 'Need to create an account?' : 'Already have an account?'}
          </button>
        </div>
      </form>
    </div>
  )
}