import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { supabaseAdmin } from './supabase'

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Salt rounds for bcrypt
const SALT_ROUNDS = 10

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS)
}

// Compare password with hash
export const comparePasswords = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

// Generate JWT token
export const generateToken = (userId: string): string => {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' })
}

// Verify JWT token
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

// Create session in database
export const createSession = async (userId: string, userAgent?: string, ipAddress?: string) => {
  const token = uuidv4()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

  const { data, error } = await supabaseAdmin
    .from('sessions')
    .insert({
      user_id: userId,
      token,
      expires_at: expiresAt.toISOString(),
      user_agent: userAgent,
      ip_address: ipAddress
    })
    .select('id, token, expires_at')
    .single()

  if (error) throw error

  return data
}

// Log login attempt
export const logLoginAttempt = async (
  email: string,
  success: boolean,
  ipAddress: string
) => {
  const { error } = await supabaseAdmin.from('login_attempts').insert({
    email,
    ip_address: ipAddress,
    success
  })

  if (error) console.error('Failed to log login attempt:', error)
}

// Check if too many failed login attempts
export const checkLoginAttempts = async (email: string, ipAddress: string): Promise<boolean> => {
  const { count, error } = await supabaseAdmin
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('email', email)
    .eq('ip_address', ipAddress)
    .eq('success', false)
    .gte('attempted_at', new Date(Date.now() - 15 * 60 * 1000).toISOString()) // Last 15 minutes

  if (error) {
    console.error('Error checking login attempts:', error)
    return false
  }

  // If there are 5 or more failed attempts in the last 15 minutes
  return count !== null && count >= 5
}