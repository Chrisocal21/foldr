import { NextRequest, NextResponse } from 'next/server'

// Simple hash function for passwords (use bcrypt in production)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'foldr_salt_2025')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Generate a simple token
function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Generate user ID
function generateUserId(): string {
  return 'user_' + crypto.randomUUID()
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, inviteCode } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 })
    }
    
    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 })
    }
    
    // Validate invite code - stored as environment variable
    const validInviteCode = (process.env as any).INVITE_CODE || process.env.INVITE_CODE
    if (!inviteCode || inviteCode !== validInviteCode) {
      return NextResponse.json({ success: false, error: 'Invalid invite code' }, { status: 403 })
    }
    
    // Get D1 database binding from env
    const db = (process.env as any).DB
    
    if (!db) {
      // Fallback for local development - store in a simple way
      // In production, this will use Cloudflare D1
      const userId = generateUserId()
      const token = generateToken()
      
      return NextResponse.json({
        success: true,
        userId,
        token,
        message: 'Account created (local mode)'
      })
    }
    
    // Check if email already exists
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
    if (existing) {
      return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 400 })
    }
    
    // Create user
    const userId = generateUserId()
    const passwordHash = await hashPassword(password)
    const token = generateToken()
    
    await db.prepare(
      'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)'
    ).bind(userId, email, passwordHash).run()
    
    return NextResponse.json({
      success: true,
      userId,
      token
    })
    
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
