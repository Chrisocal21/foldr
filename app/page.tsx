'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { login, signup, fullSync, isLoggedIn } from '@/lib/cloud-sync'

function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Check if already logged in and redirect to trips
  useEffect(() => {
    setMounted(true)
    if (isLoggedIn()) {
      router.replace('/trips')
    } else {
      setCheckingAuth(false)
    }
  }, [router])

  // Check for ?mode=signup or ?mode=reset in URL
  useEffect(() => {
    const urlMode = searchParams?.get('mode')
    if (urlMode === 'signup') {
      setMode('signup')
    } else if (urlMode === 'reset') {
      setMode('reset')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if ((mode === 'signup' || mode === 'reset') && password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      if (mode === 'reset') {
        // Password reset
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, newPassword: password, inviteCode })
        })
        const data = await response.json()
        
        if (data.success) {
          setSuccess('Password reset successfully! You can now sign in.')
          setPassword('')
          setConfirmPassword('')
          setInviteCode('')
          setTimeout(() => setMode('login'), 2000)
        } else {
          setError(data.error || 'Reset failed')
        }
      } else {
        const result = mode === 'login' 
          ? await login(email, password)
          : await signup(email, password, inviteCode)

        if (result.success) {
          // Sync data after login/signup
          await fullSync()
          router.push('/trips')
        } else {
          setError(result.error || 'Authentication failed')
        }
      }
    } catch (err) {
      setError('Network error - please try again')
    } finally {
      setLoading(false)
    }
  }

  // Show loading spinner until client-side mounted and auth checked
  if (!mounted || checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="/logos/logo.png" 
            alt="Foldr" 
            className="h-12 w-auto mx-auto mb-4"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.insertAdjacentHTML('afterend', '<span class="text-3xl font-bold" style="color: #6B9AE8">Foldr</span>');
            }}
          />
          <p className="text-slate-400">
            {mode === 'login' && 'Sign in to sync your trips'}
            {mode === 'signup' && 'Create an account to sync your trips'}
            {mode === 'reset' && 'Reset your password'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {success}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                {mode === 'reset' ? 'New Password' : 'Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 pr-10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {(mode === 'signup' || mode === 'reset') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    {mode === 'reset' ? 'Confirm New Password' : 'Confirm Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 pr-10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Invite Code
                  </label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    required
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter invite code"
                  />
                </div>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {mode === 'login' && 'Signing in...'}
                {mode === 'signup' && 'Creating account...'}
                {mode === 'reset' && 'Resetting password...'}
              </>
            ) : (
              <>
                {mode === 'login' && 'Sign In'}
                {mode === 'signup' && 'Create Account'}
                {mode === 'reset' && 'Reset Password'}
              </>
            )}
          </button>
        </form>

        {/* Toggle mode */}
        <div className="text-center mt-4 text-slate-400 text-sm space-y-2">
          {mode === 'login' && (
            <>
              <p>
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Sign up
                </button>
              </p>
              <p>
                <button
                  onClick={() => { setMode('reset'); setError(''); setSuccess(''); }}
                  className="text-slate-500 hover:text-slate-400"
                >
                  Forgot password?
                </button>
              </p>
            </>
          )}
          {mode === 'signup' && (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className="text-blue-400 hover:text-blue-300"
              >
                Sign in
              </button>
            </p>
          )}
          {mode === 'reset' && (
            <p>
              Remember your password?{' '}
              <button
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className="text-blue-400 hover:text-blue-300"
              >
                Sign in
              </button>
            </p>
          )}
        </div>

        {/* Skip link */}
        <p className="text-center mt-6">
          <Link href="/trips" className="text-slate-500 hover:text-slate-400 text-sm">
            Continue without account →
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  )
}
