import { NextResponse } from 'next/server'
import cookie from 'cookie'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    // Get the session token from cookies
    const cookies = cookie.parse(request.headers.get('cookie') || '')
    const sessionToken = cookies.session_token

    if (sessionToken) {
      // Delete the session from the database
      await supabaseAdmin
        .from('sessions')
        .delete()
        .eq('token', sessionToken)
    }

    // Clear the cookie
    const clearedCookie = cookie.serialize('session_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/'
    })

    // Return a success response
    const response = NextResponse.json({ success: true })
    response.headers.set('Set-Cookie', clearedCookie)
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}