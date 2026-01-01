'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trip } from '@/lib/types'
import { getTrips, getTripStatus, saveTrip, deleteTrip, getTimeAtTimezone, getTimezoneAbbr } from '@/lib/storage'
import { useSettings } from '@/lib/settings-context'
import FloatingMenu from '@/components/FloatingMenu'
import { setupAutoSync, isLoggedIn, fullSync } from '@/lib/cloud-sync'

export default function TripsPage() {
  const { settings } = useSettings()
  const [trips, setTrips] = useState<Trip[]>([])
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'active' | 'past'>('all')
  const [hidePast, setHidePast] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; trip: Trip | null }>({ show: false, trip: null })

  useEffect(() => {
    loadTrips()
    // Load hidePast preference
    const saved = localStorage.getItem('foldr_hide_past')
    if (saved) setHidePast(saved === 'true')
    
    // Setup auto-sync if logged in
    if (isLoggedIn()) {
      setupAutoSync()
      // Do an initial sync when page loads
      fullSync().then(() => {
        loadTrips() // Reload trips after sync
      })
    }
  }, [])

  const loadTrips = () => {
    const allTrips = getTrips().map(trip => ({
      ...trip,
      status: getTripStatus(trip.startDate, trip.endDate)
    }))
    setTrips(allTrips)
  }

  const toggleFavorite = (tripId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const trip = trips.find(t => t.id === tripId)
    if (trip) {
      saveTrip({ ...trip, favorite: !trip.favorite })
      loadTrips()
    }
  }

  const handleDeleteTrip = () => {
    if (deleteModal.trip) {
      deleteTrip(deleteModal.trip.id)
      setDeleteModal({ show: false, trip: null })
      loadTrips()
    }
  }

  const toggleHidePast = () => {
    const newValue = !hidePast
    setHidePast(newValue)
    localStorage.setItem('foldr_hide_past', String(newValue))
  }

  // Sort trips based on settings
  const sortedTrips = [...trips].sort((a, b) => {
    // Always respect favorites-first if setting is 'favorites'
    if (settings.tripSortOrder === 'favorites') {
      if (a.favorite && !b.favorite) return -1
      if (!a.favorite && b.favorite) return 1
    }
    
    // Secondary sort by name or date
    if (settings.tripSortOrder === 'name') {
      return (a.destination || '').localeCompare(b.destination || '')
    }
    
    // Default: sort by date
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  })

  // Apply filters
  let filteredTrips = sortedTrips.filter(trip => 
    filter === 'all' || trip.status === filter
  )
  
  // Hide past trips if enabled OR auto-archive setting
  if (hidePast && filter === 'all') {
    filteredTrips = filteredTrips.filter(t => t.status !== 'past')
  } else if (settings.autoArchiveDays > 0 && filter === 'all') {
    const archiveDate = new Date()
    archiveDate.setDate(archiveDate.getDate() - settings.autoArchiveDays)
    filteredTrips = filteredTrips.filter(t => {
      if (t.status !== 'past') return true
      return new Date(t.endDate) > archiveDate
    })
  }

  const upcomingCount = trips.filter(t => t.status === 'upcoming').length
  const activeCount = trips.filter(t => t.status === 'active').length
  const pastCount = trips.filter(t => t.status === 'past').length

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <img 
              src="/logos/logo.png" 
              alt="TripFldr" 
              className="h-10 w-auto"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.insertAdjacentHTML('afterend', '<span class="text-xl font-bold" style="color: #6B9AE8">TripFldr</span>');
              }}
            />
          </Link>
          <div className="flex items-center gap-1 sm:gap-3">
            <Link
              href="/calendar"
              className="text-slate-400 hover:text-white p-1.5 sm:p-2"
              title="Calendar View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </Link>
            <Link
              href="/search"
              className="text-slate-400 hover:text-white p-1.5 sm:p-2"
              title="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </Link>
            <Link
              href="/settings"
              className="text-slate-400 hover:text-white p-1.5 sm:p-2"
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Filter Tabs + Hide Past Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            <FilterButton
              active={filter === 'all'}
              onClick={() => setFilter('all')}
              count={hidePast ? trips.filter(t => t.status !== 'past').length : trips.length}
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
          
          {/* Hide Past Toggle */}
          {filter === 'all' && pastCount > 0 && (
            <button
              onClick={toggleHidePast}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${
                hidePast 
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                  : 'bg-slate-800 text-slate-400 hover:text-slate-300'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {hidePast ? (
                  <path d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 0 1 1.563-3.029m5.858.908a3 3 0 1 1 4.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88 6.59 6.59m7.532 7.532 3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0 1 12 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 0 1-4.132 5.411m0 0L21 21" />
                ) : (
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
                )}
              </svg>
              {hidePast ? 'Past hidden' : 'Hide past'}
            </button>
          )}
        </div>

        {/* Trip List */}
        {filteredTrips.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-slate-400 mb-4">
              {trips.length === 0 ? (
                <>
                  <svg className="w-20 h-20 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5Z" />
                  </svg>
                  <p className="text-xl font-medium text-slate-300 mb-2">No trips yet</p>
                  <p className="text-slate-500">Plan your first adventure!</p>
                </>
              ) : (
                <>
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-lg">No {filter !== 'all' ? filter : ''} trips</p>
                </>
              )}
            </div>
            {trips.length === 0 && (
              <Link
                href="/trips/new"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Create Your First Trip
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTrips.map(trip => (
              <TripCard 
                key={trip.id} 
                trip={trip} 
                onToggleFavorite={toggleFavorite}
                onDelete={(t) => setDeleteModal({ show: true, trip: t })}
                showCountdown={settings.showTripCountdown}
              />
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && deleteModal.trip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteModal({ show: false, trip: null })}>
          <div 
            className="bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl border border-slate-700"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-500/20 p-2 rounded-full">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Delete Trip</h3>
            </div>
            <p className="text-slate-300 mb-2">
              Are you sure you want to delete <span className="font-semibold text-white">{deleteModal.trip.name}</span>?
            </p>
            <p className="text-slate-500 text-sm mb-6">
              This will also delete all blocks associated with this trip. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal({ show: false, trip: null })}
                className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTrip}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete Trip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Menu for Notes, To-Do, Build, Roadmap */}
      <FloatingMenu />
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

function TripCard({ 
  trip, 
  onToggleFavorite, 
  onDelete,
  showCountdown = true
}: { 
  trip: Trip
  onToggleFavorite: (tripId: string, e: React.MouseEvent) => void
  onDelete: (trip: Trip) => void
  showCountdown?: boolean
}) {
  // Parse dates as local to avoid timezone issues
  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  
  const startDate = parseLocalDate(trip.startDate)
  const endDate = parseLocalDate(trip.endDate)
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Calculate countdown
  const getCountdown = () => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(0, 0, 0, 0)
    
    if (now < start) {
      const diffTime = start.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays === 1 ? '1 day away' : `${diffDays} days away`
    } else if (now >= start && now <= end) {
      const diffTime = end.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays === 0) return 'Ends today'
      return diffDays === 1 ? '1 day left' : `${diffDays} days left`
    }
    return null
  }

  const countdown = getCountdown()

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
        
        {/* Favorite Star */}
        <button
          onClick={(e) => onToggleFavorite(trip.id, e)}
          className={`absolute top-3 right-3 p-1.5 rounded-lg transition-all ${
            trip.favorite 
              ? 'text-yellow-400 bg-yellow-400/20' 
              : 'text-slate-500 hover:text-yellow-400 hover:bg-slate-700'
          }`}
          title={trip.favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg className="w-5 h-5" fill={trip.favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.563.563 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.563.563 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
          </svg>
        </button>

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDelete(trip)
          }}
          className="absolute top-3 right-12 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
          title="Delete trip"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        
        <div className="flex items-start justify-between mb-3 pr-16">
          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
            {trip.favorite && (
              <svg className="w-4 h-4 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.563.563 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.563.563 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
            )}
            {trip.name}
          </h3>
          <span className={`text-xs px-2 py-1 rounded ${statusColors[trip.status]} text-white font-medium flex-shrink-0`}>
            {statusLabels[trip.status]}
          </span>
        </div>
        
        <div className="text-sm text-slate-300 space-y-1">
          {trip.destination && (
            <div className="flex items-center gap-2 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{trip.destination}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <span>{formatDate(startDate)} – {formatDate(endDate)}</span>
          </div>
          {trip.timezone && (
            <div className="flex items-center gap-2 text-emerald-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>{getTimeAtTimezone(trip.timezone)} {getTimezoneAbbr(trip.timezone)}</span>
            </div>
          )}
          {countdown && showCountdown && (
            <div className="flex items-center gap-2 text-blue-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span className="font-medium">{countdown}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
