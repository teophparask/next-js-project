import { NextResponse } from 'next/server'
import cookie from 'cookie'
import { supabaseAdmin } from '@/lib/supabase'
import { 
  comparePasswords, 
  createSession, 
  logLoginAttempt,
  checkLoginAttempts
} from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Get IP address from request headers
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    
    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Check if user is blocked due to too many failed attempts
    const tooManyAttempts = await checkLoginAttempts(email, ip)
    if (tooManyAttempts) {
      await logLoginAttempt(email, false, ip)
      return NextResponse.json(
        { error: 'Too many failed login attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Find user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, password_hash, is_active, is_verified')
      .eq('email', email.toLowerCase())
      .single()

    // Check if user exists
    if (userError || !user) {
      await logLoginAttempt(email, false, ip)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!user.is_active) {
      await logLoginAttempt(email, false, ip)
      return NextResponse.json(
        { error: 'Account is disabled. Please contact support.' },
        { status: 403 }
      )
    }

    // Check if user is verified
    if (!user.is_verified) {
      await logLoginAttempt(email, false, ip)
      return NextResponse.json(
        { error: 'Please verify your email before logging in.' },
        { status: 403 }
      )
    }

    // Verify password
    const passwordValid = await comparePasswords(password, user.password_hash)
    if (!passwordValid) {
      await logLoginAttempt(email, false, ip)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Log successful login
    await logLoginAttempt(email, true, ip)

    // Create a new session
    const session = await createSession(user.id, userAgent, ip)

    // Get user roles - join with roles table to get role names
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role_id, roles(name)')
      .eq('user_id', user.id)

    // Extract role names
    const roles = roleData?.map(role => role.roles?.name).filter(Boolean) || []

    // Get user profile data
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, username, avatar_url')
      .eq('id', user.id)
      .single()

    // Set session cookie
    const cookieValue = cookie.serialize('session_token', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    // Return success response with user data
    const response = NextResponse.json({
      success: true,
      user: { ...profile, roles }
    })
    
    // Add cookie to response
    response.headers.set('Set-Cookie', cookieValue)
    
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}