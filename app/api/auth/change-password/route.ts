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
    const { email, currentPassword, newPassword } = await request.json()
    
    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: 'All fields required' }, { status: 400 })
    }
    
    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, error: 'New password must be at least 6 characters' }, { status: 400 })
    }
    
    // Get D1 database binding
    const db = (process.env as any).DB
    
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database not available' }, { status: 500 })
    }
    
    // Verify current password
    const currentHash = await hashPassword(currentPassword)
    const user = await db.prepare(
      'SELECT id FROM users WHERE email = ? AND password_hash = ?'
    ).bind(email, currentHash).first()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 401 })
    }
    
    // Update to new password
    const newHash = await hashPassword(newPassword)
    await db.prepare(
      'UPDATE users SET password_hash = ? WHERE email = ?'
    ).bind(newHash, email).run()
    
    return NextResponse.json({ success: true, message: 'Password changed successfully' })
    
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
