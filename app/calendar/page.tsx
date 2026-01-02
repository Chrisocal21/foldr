'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trip } from '@/lib/types'
import { getTrips, getTripStatus } from '@/lib/storage'

export default function CalendarPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    loadTrips()
  }, [])

  const loadTrips = () => {
    const allTrips = getTrips().map(trip => ({
      ...trip,
      status: getTripStatus(trip.startDate, trip.endDate)
    }))
    setTrips(allTrips)
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const startingDayOfWeek = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1))
  }

  const getTripsForDay = (day: number) => {
    // Format as YYYY-MM-DD in local time (avoid toISOString which uses UTC)
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    return trips.filter(trip => {
      const start = trip.startDate.split('T')[0]
      const end = trip.endDate.split('T')[0]
      return dateStr >= start && dateStr <= end
    })
  }

  const days = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="h-24 sm:h-32" />)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayTrips = getTripsForDay(day)
    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()
    
    days.push(
      <div
        key={day}
        className={`h-24 sm:h-32 border border-slate-700 p-2 ${
          isToday ? 'bg-white text-slate-900/10 border-slate-500' : 'bg-slate-800'
        }`}
      >
        <div className={`text-sm font-medium mb-1 ${isToday ? 'text-slate-400' : 'text-slate-300'}`}>
          {day}
        </div>
        <div className="space-y-1 overflow-y-auto h-16 sm:h-20">
          {dayTrips.map(trip => (
            <Link
              key={trip.id}
              href={`/trips/${trip.id}`}
              className="block text-xs p-1 rounded bg-white/80 hover:bg-white text-white truncate"
              style={{ backgroundColor: trip.color || undefined }}
            >
              {trip.name}
            </Link>
          ))}
        </div>
      </div>
    )
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Subtle accent glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-slate-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-slate-400/5 rounded-full blur-3xl pointer-events-none" />
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/trips" className="text-slate-300 hover:text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 12H5m7-7-7 7 7 7" />
              </svg>
              Trips
            </Link>
            <h1 className="text-xl font-bold text-white">Calendar</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h2 className="text-2xl font-bold text-white">
            {monthNames[month]} {year}
          </h2>
          
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-slate-800">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center py-3 text-sm font-semibold text-slate-300">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {days}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-6 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-white text-slate-900"></div>
            <span>Trip days</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border-2 border-slate-500"></div>
            <span>Today</span>
          </div>
        </div>
      </main>
    </div>
  )
}


