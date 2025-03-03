import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Validate password strength - at least 8 characters
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Split name into first and last name
    let firstName = name
    let lastName = ''
    
    if (name.includes(' ')) {
      const nameParts = name.split(' ')
      firstName = nameParts[0]
      lastName = nameParts.slice(1).join(' ')
    }

    // Create username from email
    const username = email.split('@')[0] + '_' + Math.floor(Math.random() * 1000)

    // First, get the default role ID
    const { data: defaultRole } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', 'user')
      .maybeSingle()

    if (!defaultRole) {
      return NextResponse.json(
        { error: 'Default role not found. Please contact administrator.' },
        { status: 500 }
      )
    }

    const defaultRoleId = defaultRole.id

    // Create user with is_verified set to false
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        username: username,
        is_verified: false,
        is_active: true
      })
      .select('id, email, first_name, last_name, username, avatar_url')
      .single()

    if (createError) {
      console.error('Error creating user:', createError)
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      )
    }

    // Assign default role to user
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.id,
        role_id: defaultRoleId
      })

    if (roleError) {
      console.error('Error assigning role:', roleError)
    }

    // Create verification token for email verification
    const verificationToken = uuidv4()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours from now

    await supabaseAdmin
      .from('verification_tokens')
      .insert({
        user_id: newUser.id,
        token: verificationToken,
        type: 'EMAIL_VERIFICATION',
        expires_at: expiresAt.toISOString()
      })

    // In development mode, don't try to send an email, just provide the verification link
    let verificationUrl = null
    let emailSent = false

    try {
      // Send verification email
      const emailResult = await sendVerificationEmail(email, verificationToken)
      emailSent = emailResult.success
      
      // In development, we may still have the preview URL
      if (emailResult.previewUrl) {
        verificationUrl = emailResult.previewUrl
      }
    } catch (error) {
      console.error('Error sending verification email:', error)
      
      // In development, create a direct verification URL
      if (process.env.NODE_ENV !== 'production') {
        verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      user: {
        ...newUser,
        roles: ['user'],
        needsVerification: true
      },
      message: emailSent 
        ? 'Account created successfully! Please check your email to verify your account.'
        : 'Account created! Verification email could not be sent.',
      ...(verificationUrl && { verificationUrl })
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}