'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const [userName, setUserName] = useState('User')
  const router = useRouter()
  
  // In a real app, you would fetch user data here
  // This is just a placeholder
  
  const handleLogout = () => {
    // In a real app, you would implement proper logout logic
    router.push('/')
  }

  return (
    <main className="flex min-h-screen flex-col p-4 bg-gray-50">
      <div className="max-w-4xl w-full mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Welcome, {userName}!</h2>
          <p className="text-gray-600">
            You have successfully logged in to your account.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Account Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">user@example.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account type:</span>
                <span className="font-medium">Standard</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Member since:</span>
                <span className="font-medium">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
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