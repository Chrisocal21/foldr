'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trip, Block } from '@/lib/types'
import { getTrips, getBlocks, getTripStatus, getExpenses, CURRENCIES } from '@/lib/storage'

interface TripStats {
  totalTrips: number
  upcomingTrips: number
  activeTrips: number
  pastTrips: number
  totalDays: number
  citiesVisited: string[]
  countriesVisited: string[]
  totalFlights: number
  totalHotels: number
  expensesByCurrency: { currency: string; symbol: string; total: number }[]
  longestTrip: { name: string; days: number } | null
  thisYearTrips: number
  thisYearDays: number
}

function calculateStats(trips: Trip[], blocks: Block[]): TripStats {
  const now = new Date()
  const thisYear = now.getFullYear()
  
  const stats: TripStats = {
    totalTrips: 0, // Only count completed trips
    upcomingTrips: 0,
    activeTrips: 0,
    pastTrips: 0,
    totalDays: 0,
    citiesVisited: [],
    countriesVisited: [],
    totalFlights: 0,
    totalHotels: 0,
    expensesByCurrency: [],
    longestTrip: null,
    thisYearTrips: 0,
    thisYearDays: 0,
  }
  
  const cities = new Set<string>()
  const countries = new Set<string>()
  let maxDays = 0
  
  // Get IDs of past (completed) trips for filtering blocks
  const pastTripIds = new Set<string>()
  
  trips.forEach(trip => {
    const status = getTripStatus(trip.startDate, trip.endDate)
    if (status === 'upcoming') {
      stats.upcomingTrips++
    } else if (status === 'active') {
      stats.activeTrips++
    } else {
      // Only count PAST/COMPLETED trips in main statistics
      stats.pastTrips++
      stats.totalTrips++ // totalTrips = completed trips only
      pastTripIds.add(trip.id)
      
      // Calculate trip duration (only for completed trips)
      const start = new Date(trip.startDate)
      const end = new Date(trip.endDate)
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      stats.totalDays += days
      
      // Track longest trip (only completed)
      if (days > maxDays) {
        maxDays = days
        stats.longestTrip = { name: trip.name, days }
      }
      
      // This year stats (only completed)
      if (start.getFullYear() === thisYear || end.getFullYear() === thisYear) {
        stats.thisYearTrips++
        stats.thisYearDays += days
      }
      
      // Track destinations (only from completed trips)
      if (trip.destination) {
        const parts = trip.destination.split(',').map(p => p.trim())
        if (parts[0]) cities.add(parts[0])
        if (parts[1]) countries.add(parts[1])
      }
    }
  })
  
  // Count blocks by type (only from completed trips)
  blocks.forEach(block => {
    if (pastTripIds.has(block.tripId)) {
      if (block.type === 'flight') stats.totalFlights++
      if (block.type === 'hotel') stats.totalHotels++
    }
  })
  
  stats.citiesVisited = Array.from(cities)
  stats.countriesVisited = Array.from(countries)
  
  // Get expenses
  const expenses = getExpenses()
  const expensesByCurrency: Record<string, number> = {}
  expenses.forEach(exp => {
    expensesByCurrency[exp.currency] = (expensesByCurrency[exp.currency] || 0) + exp.amount
  })
  
  stats.expensesByCurrency = Object.entries(expensesByCurrency).map(([currency, total]) => {
    const curr = CURRENCIES.find(c => c.code === currency)
    return { currency, symbol: curr?.symbol || currency, total }
  })
  
  return stats
}

export default function StatsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<TripStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const trips = getTrips()
    const blocks = getBlocks()
    setStats(calculateStats(trips, blocks))
    setIsLoading(false)
  }, [])

  if (isLoading || !stats) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-500">Loading stats...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">Travel Statistics</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard 
            icon={<TripIcon />}
            label="Total Trips"
            value={stats.totalTrips}
            color="blue"
          />
          <StatCard 
            icon={<CalendarIcon />}
            label="Days Traveled"
            value={stats.totalDays}
            color="green"
          />
          <StatCard 
            icon={<CityIcon />}
            label="Cities Visited"
            value={stats.citiesVisited.length}
            color="purple"
          />
          <StatCard 
            icon={<GlobeIcon />}
            label="Countries"
            value={stats.countriesVisited.length}
            color="orange"
          />
        </div>

        {/* Trip Status Breakdown */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <h2 className="text-lg font-semibold text-white mb-4">Trip Status</h2>
          <div className="space-y-3">
            <StatusBar label="Upcoming" value={stats.upcomingTrips} total={stats.totalTrips} color="blue" />
            <StatusBar label="Active" value={stats.activeTrips} total={stats.totalTrips} color="green" />
            <StatusBar label="Completed" value={stats.pastTrips} total={stats.totalTrips} color="slate" />
          </div>
        </div>

        {/* This Year */}
        <div className="bg-gradient-to-br from-slate-600/20 to-purple-600/20 rounded-xl p-4 border border-slate-500/30">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date().getFullYear()} Summary
          </h2>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-white">{stats.thisYearTrips}</div>
              <div className="text-sm text-slate-400">trips this year</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{stats.thisYearDays}</div>
              <div className="text-sm text-slate-400">days traveling</div>
            </div>
          </div>
        </div>

        {/* Blocks Summary */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <h2 className="text-lg font-semibold text-white mb-4">Itinerary Items</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" />
                  <path d="M12 19l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2" />
                </svg>
              </div>
              <div>
                <div className="text-xl font-bold text-white">{stats.totalFlights}</div>
                <div className="text-sm text-slate-400">Flights</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <div className="text-xl font-bold text-white">{stats.totalHotels}</div>
                <div className="text-sm text-slate-400">Hotels</div>
              </div>
            </div>
          </div>
        </div>

        {/* Longest Trip */}
        {stats.longestTrip && (
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <h2 className="text-lg font-semibold text-white mb-2">Longest Trip</h2>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">{stats.longestTrip.name}</span>
              <span className="text-slate-400 font-semibold">{stats.longestTrip.days} days</span>
            </div>
          </div>
        )}

        {/* Cities Visited */}
        {stats.citiesVisited.length > 0 && (
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <h2 className="text-lg font-semibold text-white mb-3">Cities Visited</h2>
            <div className="flex flex-wrap gap-2">
              {stats.citiesVisited.map(city => (
                <span key={city} className="px-3 py-1 bg-slate-700/50 rounded-full text-sm text-slate-300">
                  {city}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Expenses by Currency */}
        {stats.expensesByCurrency.length > 0 && (
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <h2 className="text-lg font-semibold text-white mb-3">Total Expenses</h2>
            <div className="space-y-2">
              {stats.expensesByCurrency.map(({ currency, symbol, total }) => (
                <div key={currency} className="flex items-center justify-between">
                  <span className="text-slate-400">{currency}</span>
                  <span className="text-white font-semibold">{symbol}{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {stats.totalTrips === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No trips yet</h3>
            <p className="text-slate-500 mb-4">Create your first trip to see statistics</p>
            <Link href="/trips/new" className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-white px-4 py-2 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" />
              </svg>
              Create Trip
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

// Stat Card Component
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'from-slate-600/20 to-slate-600/5 border-slate-500/30',
    green: 'from-green-600/20 to-green-600/5 border-green-500/30',
    purple: 'from-purple-600/20 to-purple-600/5 border-purple-500/30',
    orange: 'from-orange-600/20 to-orange-600/5 border-orange-500/30',
  }
  
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 border`}>
      <div className="flex items-center gap-3 mb-2">
        {icon}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  )
}

// Status Bar Component
function StatusBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percentage = total > 0 ? (value / total) * 100 : 0
  const colors: Record<string, string> = {
    blue: 'bg-slate-500',
    green: 'bg-green-500',
    slate: 'bg-slate-500',
  }
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-white">{value}</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${colors[color]} rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}

// Icons
function TripIcon() {
  return (
    <div className="w-8 h-8 rounded-lg bg-slate-500/20 flex items-center justify-center">
      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </div>
  )
}

function CalendarIcon() {
  return (
    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  )
}

function CityIcon() {
  return (
    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    </div>
  )
}

function GlobeIcon() {
  return (
    <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
      <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  )
}


