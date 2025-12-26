import { NextRequest, NextResponse } from 'next/server'

// Simple hash function for passwords
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

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 })
    }
    
    // Get D1 database binding from env
    const db = (process.env as any).DB
    
    if (!db) {
      // Fallback for local development
      // In production, this will use Cloudflare D1
      const token = generateToken()
      
      return NextResponse.json({
        success: true,
        userId: 'local_user',
        token,
        message: 'Logged in (local mode)'
      })
    }
    
    // Find user
    const user = await db.prepare('SELECT id, password_hash FROM users WHERE email = ?').bind(email).first()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 })
    }
    
    // Verify password
    const passwordHash = await hashPassword(password)
    if (passwordHash !== user.password_hash) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 })
    }
    
    // Generate new token
    const token = generateToken()
    
    // Store token in database for later verification
    await db.prepare(`
      INSERT OR REPLACE INTO tokens (token, user_id, created_at)
      VALUES (?, ?, ?)
    `).bind(token, user.id, new Date().toISOString()).run()
    
    return NextResponse.json({
      success: true,
      userId: user.id,
      token
    })
    
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
