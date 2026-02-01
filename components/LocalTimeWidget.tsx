'use client'

import { useState, useEffect } from 'react'
import { getLocalTime, type LocalTimeInfo } from '@/lib/travel-apis'

interface LocalTimeWidgetProps {
  timezone: string
  label?: string
  className?: string
}

export function LocalTimeWidget({ timezone, label, className = '' }: LocalTimeWidgetProps) {
  const [timeInfo, setTimeInfo] = useState<LocalTimeInfo | null>(null)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch initial time data
  useEffect(() => {
    let mounted = true
    
    async function fetchTime() {
      const info = await getLocalTime(timezone)
      if (mounted && info) {
        setTimeInfo(info)
        setCurrentTime(new Date(info.datetime))
        setLoading(false)
      }
    }
    
    fetchTime()
    return () => { mounted = false }
  }, [timezone])

  // Update time every second
  useEffect(() => {
    if (!currentTime) return
    
    const interval = setInterval(() => {
      setCurrentTime(new Date(currentTime.getTime() + 1000))
    }, 1000)
    
    return () => clearInterval(interval)
  }, [currentTime])

  if (loading || !currentTime || !timeInfo) {
    return (
      <div className={`text-sm text-slate-400 ${className}`}>
        {label && <span className="font-medium">{label}: </span>}
        <span>Loading...</span>
      </div>
    )
  }

  const timeString = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })

  const dateString = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })

  return (
    <div className={`text-sm ${className}`}>
      {label && <span className="font-medium text-slate-300">{label}: </span>}
      <span className="text-white font-mono">{timeString}</span>
      <span className="text-slate-400 ml-2">
        {dateString} ({timeInfo.abbreviation})
      </span>
    </div>
  )
}
