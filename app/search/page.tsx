'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { searchAll } from '@/lib/storage'
import { Trip, Block } from '@/lib/types'

// Helper to parse date string as local date
const formatDate = (dateStr: string): string => {
  const [datePart] = dateStr.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString()
}

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ trips: Trip[], blocks: Block[] }>({ trips: [], blocks: [] })
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    if (query.length >= 2) {
      const searchResults = searchAll(query)
      setResults(searchResults)
      setHasSearched(true)
    } else {
      setResults({ trips: [], blocks: [] })
      setHasSearched(false)
    }
  }, [query])

  const totalResults = results.trips.length + results.blocks.length

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-slate-300 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 12H5m7-7-7 7 7 7" />
              </svg>
            </button>
            
            <div className="flex-1 relative">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search trips, confirmations, addresses..."
                autoFocus
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="w-5 h-5 absolute left-3 top-2.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {!hasSearched ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <p className="text-slate-400">Search for trips, confirmation codes, addresses, and more</p>
          </div>
        ) : totalResults === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg">No results found for &ldquo;{query}&rdquo;</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Trip Results */}
            {results.trips.length > 0 && (
              <div>
                <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M6 12 3 9m0 0 3-3M3 9h12a6 6 0 0 1 0 12h-3" />
                  </svg>
                  Trips ({results.trips.length})
                </h2>
                <div className="space-y-2">
                  {results.trips.map(trip => (
                    <Link
                      key={trip.id}
                      href={`/trips/${trip.id}`}
                      className="block bg-slate-800 border border-slate-700 rounded-lg p-4 hover:bg-slate-750 transition-colors"
                    >
                      <h3 className="text-white font-medium mb-1">{trip.name}</h3>
                      <p className="text-sm text-slate-400">
                        {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Block Results */}
            {results.blocks.length > 0 && (
              <div>
                <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 3v18M3 9h18M3 15h18" />
                  </svg>
                  Blocks ({results.blocks.length})
                </h2>
                <div className="space-y-2">
                  {results.blocks.map(block => (
                    <Link
                      key={block.id}
                      href={`/trips/${block.tripId}`}
                      className="block bg-slate-800 border border-slate-700 rounded-lg p-4 hover:bg-slate-750 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">
                          {block.type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300">
                        {getBlockPreview(block)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function getBlockPreview(block: Block): string {
  switch (block.type) {
    case 'flight':
      return `${block.airline} ${block.flightNumber} - ${block.departureAirport} → ${block.arrivalAirport}`
    case 'hotel':
      return block.name
    case 'layover':
      return `${block.location} layover`
    case 'work':
      return block.siteName
    case 'transport':
      return `${block.transportType}: ${block.pickupLocation} → ${block.dropoffLocation}`
    case 'screenshot':
      return block.caption || 'Screenshot'
    case 'note':
      return block.title || block.text.slice(0, 100)
    default:
      return ''
  }
}
