import { NextRequest, NextResponse } from 'next/server'

// Simple hash function for passwords
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'foldr_salt_2025')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword, inviteCode } = await request.json()
    
    if (!email || !newPassword || !inviteCode) {
      return NextResponse.json({ success: false, error: 'All fields required' }, { status: 400 })
    }
    
    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 })
    }
    
    // Validate invite code (same as signup - only admin can reset)
    const validInviteCode = (process.env as any).INVITE_CODE || process.env.INVITE_CODE
    if (inviteCode !== validInviteCode) {
      return NextResponse.json({ success: false, error: 'Invalid invite code' }, { status: 403 })
    }
    
    // Get D1 database binding
    const db = (process.env as any).DB
    
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database not available' }, { status: 500 })
    }
    
    // Check if user exists
    const user = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Email not found' }, { status: 404 })
    }
    
    // Update password
    const newHash = await hashPassword(newPassword)
    await db.prepare(
      'UPDATE users SET password_hash = ? WHERE email = ?'
    ).bind(newHash, email).run()
    
    return NextResponse.json({ success: true, message: 'Password reset successfully' })
    
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
