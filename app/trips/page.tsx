'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trip } from '@/lib/types'
import { getTrips, getTripStatus } from '@/lib/storage'

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'active' | 'past'>('all')

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

  const filteredTrips = trips.filter(trip => 
    filter === 'all' || trip.status === filter
  )

  const upcomingCount = trips.filter(t => t.status === 'upcoming').length
  const activeCount = trips.filter(t => t.status === 'active').length
  const pastCount = trips.filter(t => t.status === 'past').length

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <Link href="/">
            <img 
              src="/logos/logo.png" 
              alt="Foldr" 
              className="h-12 w-auto"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.insertAdjacentHTML('afterend', '<span class="text-2xl font-bold" style="color: #6B9AE8">Foldr</span>');
              }}
            />
          </Link>
          <div className="flex items-center gap-5">
            <Link
              href="/calendar"
              className="text-slate-300 hover:text-white p-2"
              title="Calendar View"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </Link>
            <Link
              href="/search"
              className="text-slate-300 hover:text-white p-2"
              title="Search"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </Link>
            <Link
              href="/trips/new"
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              title="New Trip"
            >
              <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <FilterButton
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            count={trips.length}
          >
            All
          </FilterButton>
          <FilterButton
            active={filter === 'upcoming'}
            onClick={() => setFilter('upcoming')}
            count={upcomingCount}
          >
            Upcoming
          </FilterButton>
          <FilterButton
            active={filter === 'active'}
            onClick={() => setFilter('active')}
            count={activeCount}
          >
            Active
          </FilterButton>
          <FilterButton
            active={filter === 'past'}
            onClick={() => setFilter('past')}
            count={pastCount}
          >
            Past
          </FilterButton>
        </div>

        {/* Trip List */}
        {filteredTrips.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-slate-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M6 12 3 9m0 0 3-3M3 9h12a6 6 0 0 1 0 12h-3" />
              </svg>
              <p className="text-lg">No {filter !== 'all' ? filter : ''} trips yet</p>
            </div>
            <Link
              href="/trips/new"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Create Your First Trip
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function FilterButton({ 
  active, 
  onClick, 
  children, 
  count 
}: { 
  active: boolean
  onClick: () => void
  children: React.ReactNode
  count: number
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
      }`}
    >
      {children} <span className="text-slate-400">({count})</span>
    </button>
  )
}

function TripCard({ trip }: { trip: Trip }) {
  const startDate = new Date(trip.startDate)
  const endDate = new Date(trip.endDate)
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const statusColors = {
    upcoming: 'bg-blue-500',
    active: 'bg-green-500',
    past: 'bg-slate-600'
  }

  const statusLabels = {
    upcoming: 'Upcoming',
    active: 'Active',
    past: 'Past'
  }

  return (
    <Link href={`/trips/${trip.id}`}>
      <div 
        className="bg-slate-800 hover:bg-slate-750 border rounded-xl p-6 transition-all cursor-pointer group relative overflow-hidden"
        style={{ borderColor: trip.color || '#475569' }}
      >
        {/* Color accent bar */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: trip.color || '#3b82f6' }}
        />
        
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
            {trip.name}
          </h3>
          <span className={`text-xs px-2 py-1 rounded ${statusColors[trip.status]} text-white font-medium`}>
            {statusLabels[trip.status]}
          </span>
        </div>
        
        <div className="text-sm text-slate-300 space-y-1">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <span>{formatDate(startDate)} – {formatDate(endDate)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
