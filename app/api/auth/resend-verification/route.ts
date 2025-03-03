import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find the user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, is_verified')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (userError || !user) {
      // For security, don't reveal if the user exists or not
      return NextResponse.json(
        { success: true, message: 'If your email exists in our system, a verification link will be sent.' },
        { status: 200 }
      )
    }

    // If user is already verified, no need to send verification
    if (user.is_verified) {
      return NextResponse.json(
        { success: true, message: 'Your email is already verified. You can log in now.' },
        { status: 200 }
      )
    }

    // Delete any existing verification tokens for this user
    await supabaseAdmin
      .from('verification_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('type', 'EMAIL_VERIFICATION')

    // Create new verification token
    const verificationToken = uuidv4()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours from now

    await supabaseAdmin
      .from('verification_tokens')
      .insert({
        user_id: user.id,
        token: verificationToken,
        type: 'EMAIL_VERIFICATION',
        expires_at: expiresAt.toISOString()
      })

    // Send verification email
    await sendVerificationEmail(email, verificationToken)

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.'
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}