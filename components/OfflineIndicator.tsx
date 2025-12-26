'use client'

import { useOnline } from '@/lib/offline'

/**
 * Banner that appears at top of screen when offline
 */
export function OfflineBanner() {
  const isOnline = useOnline()
  
  if (isOnline) return null
  
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-600 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M18.364 5.636a9 9 0 11-12.728 12.728 9 9 0 0112.728-12.728zM15 12H9" />
      </svg>
      <span>You&apos;re offline — Some features may be limited</span>
    </div>
  )
}

/**
 * Inline message for when a feature is unavailable offline
 */
interface OfflineMessageProps {
  message?: string
  className?: string
  compact?: boolean
}

export function OfflineMessage({ 
  message = 'This feature requires an internet connection', 
  className = '',
  compact = false
}: OfflineMessageProps) {
  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-slate-400 ${className}`}>
        <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M18.364 5.636a9 9 0 11-12.728 12.728 9 9 0 0112.728-12.728zM15 12H9" />
        </svg>
        <span className="text-sm">{message}</span>
      </div>
    )
  }
  
  return (
    <div className={`flex flex-col items-center justify-center py-8 text-center ${className}`}>
      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
        <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M18.364 5.636a9 9 0 11-12.728 12.728 9 9 0 0112.728-12.728z" />
          <path d="M15 12H9" />
        </svg>
      </div>
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  )
}

/**
 * Wrapper that shows offline message when not connected
 */
interface OfflineGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  message?: string
}

export function OfflineGuard({ children, fallback, message }: OfflineGuardProps) {
  const isOnline = useOnline()
  
  if (!isOnline) {
    return fallback || <OfflineMessage message={message} />
  }
  
  return <>{children}</>
}
