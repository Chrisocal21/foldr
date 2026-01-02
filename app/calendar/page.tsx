'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trip } from '@/lib/types'
import { getTrips, getTripStatus } from '@/lib/storage'

// US Federal Holidays - computed for any year
const getUSHolidays = (year: number): Map<string, string> => {
  const holidays = new Map<string, string>()
  
  // Fixed-date holidays
  holidays.set(`${year}-01-01`, "New Year's Day")
  holidays.set(`${year}-06-19`, "Juneteenth")
  holidays.set(`${year}-07-04`, "Independence Day")
  holidays.set(`${year}-11-11`, "Veterans Day")
  holidays.set(`${year}-12-25`, "Christmas Day")
  
  // MLK Day - 3rd Monday of January
  const mlk = getNthWeekdayOfMonth(year, 0, 1, 3)
  holidays.set(formatDate(mlk), "MLK Day")
  
  // Presidents Day - 3rd Monday of February
  const presidents = getNthWeekdayOfMonth(year, 1, 1, 3)
  holidays.set(formatDate(presidents), "Presidents Day")
  
  // Memorial Day - Last Monday of May
  const memorial = getLastWeekdayOfMonth(year, 4, 1)
  holidays.set(formatDate(memorial), "Memorial Day")
  
  // Labor Day - 1st Monday of September
  const labor = getNthWeekdayOfMonth(year, 8, 1, 1)
  holidays.set(formatDate(labor), "Labor Day")
  
  // Columbus Day - 2nd Monday of October
  const columbus = getNthWeekdayOfMonth(year, 9, 1, 2)
  holidays.set(formatDate(columbus), "Columbus Day")
  
  // Thanksgiving - 4th Thursday of November
  const thanksgiving = getNthWeekdayOfMonth(year, 10, 4, 4)
  holidays.set(formatDate(thanksgiving), "Thanksgiving")
  
  // Black Friday - Day after Thanksgiving
  const blackFriday = new Date(thanksgiving)
  blackFriday.setDate(blackFriday.getDate() + 1)
  holidays.set(formatDate(blackFriday), "Black Friday")
  
  // Valentine's Day
  holidays.set(`${year}-02-14`, "Valentine's Day")
  
  // St. Patrick's Day
  holidays.set(`${year}-03-17`, "St. Patrick's Day")
  
  // Halloween
  holidays.set(`${year}-10-31`, "Halloween")
  
  // New Year's Eve
  holidays.set(`${year}-12-31`, "New Year's Eve")
  
  return holidays
}

// Get nth occurrence of a weekday in a month (e.g., 3rd Monday)
const getNthWeekdayOfMonth = (year: number, month: number, weekday: number, n: number): Date => {
  const first = new Date(year, month, 1)
  const dayOffset = (weekday - first.getDay() + 7) % 7
  return new Date(year, month, 1 + dayOffset + (n - 1) * 7)
}

// Get last occurrence of a weekday in a month (e.g., last Monday)
const getLastWeekdayOfMonth = (year: number, month: number, weekday: number): Date => {
  const last = new Date(year, month + 1, 0) // Last day of month
  const dayOffset = (last.getDay() - weekday + 7) % 7
  return new Date(year, month + 1, -dayOffset)
}

const formatDate = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

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
  const holidays = getUSHolidays(year)

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

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const isCurrentMonth = () => {
    const today = new Date()
    return today.getFullYear() === year && today.getMonth() === month
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

  const getHolidayForDay = (day: number): string | undefined => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return holidays.get(dateStr)
  }

  // Count trips visible this month
  const tripsThisMonth = trips.filter(trip => {
    const start = trip.startDate.split('T')[0]
    const end = trip.endDate.split('T')[0]
    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`
    return start <= monthEnd && end >= monthStart
  }).length

  const days = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="h-24 sm:h-32 bg-slate-900/50" />)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayTrips = getTripsForDay(day)
    const holiday = getHolidayForDay(day)
    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()
    const dayOfWeek = new Date(year, month, day).getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    days.push(
      <div
        key={day}
        className={`h-24 sm:h-32 border border-slate-700 p-2 ${
          isToday 
            ? 'bg-slate-700 border-slate-500 ring-2 ring-slate-400 ring-inset' 
            : isWeekend 
              ? 'bg-slate-850 bg-slate-800/60' 
              : 'bg-slate-800'
        }`}
      >
        <div className="flex items-center gap-1">
          <span className={`text-sm font-medium ${isToday ? 'bg-white text-slate-900 rounded-full w-6 h-6 flex items-center justify-center' : 'text-slate-300'}`}>
            {day}
          </span>
          {holiday && (
            <span className="text-[10px] text-amber-400 truncate flex-1" title={holiday}>
              {holiday}
            </span>
          )}
        </div>
        <div className="space-y-1 overflow-y-auto h-14 sm:h-[4.5rem] mt-1">
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
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">
              {monthNames[month]} {year}
            </h2>
            {tripsThisMonth > 0 && (
              <p className="text-sm text-slate-400 mt-1">
                {tripsThisMonth} trip{tripsThisMonth !== 1 ? 's' : ''} this month
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!isCurrentMonth() && (
              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-slate-200"
              >
                Today
              </button>
            )}
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
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
        <div className="mt-6 flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-slate-500"></div>
            <span>Trip days</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-white"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-400"></div>
            <span>Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-slate-800/60 border border-slate-600"></div>
            <span>Weekend</span>
          </div>
        </div>
      </main>
    </div>
  )
}


