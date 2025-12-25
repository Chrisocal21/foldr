'use client'

import { useState } from 'react'

interface CopyFieldProps {
  value: string
  label?: string
  className?: string
}

export function CopyField({ value, label, className = '' }: CopyFieldProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`text-left w-full hover:bg-slate-700/50 rounded px-2 py-1 -mx-2 transition-colors relative group ${className}`}
    >
      {label && (
        <div className="text-xs text-slate-500 mb-0.5">{label}</div>
      )}
      <div className="text-slate-200 flex items-center justify-between">
        <span>{value}</span>
        {copied ? (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </div>
    </button>
  )
}
