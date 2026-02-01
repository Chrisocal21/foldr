'use client'

import { useState, useEffect } from 'react'
import { getNearbyAttractions, type Attraction } from '@/lib/travel-apis'

interface AttractionsDiscoveryProps {
  lat: number
  lon: number
  tripName: string
  className?: string
}

export function AttractionsDiscovery({ lat, lon, tripName, className = '' }: AttractionsDiscoveryProps) {
  const [attractions, setAttractions] = useState<Attraction[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let mounted = true
    
    async function fetchAttractions() {
      setLoading(true)
      const results = await getNearbyAttractions(lat, lon, 5000, 20)
      if (mounted) {
        // Sort by rating and filter out low-rated ones
        const filtered = results
          .filter(a => a.name && a.rate >= 3)
          .sort((a, b) => b.rate - a.rate)
        setAttractions(filtered)
        setLoading(false)
      }
    }
    
    fetchAttractions()
    return () => { mounted = false }
  }, [lat, lon])

  if (loading) {
    return (
      <div className={`bg-slate-800/50 rounded-xl border border-slate-700 p-6 ${className}`}>
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 2v4m0 12v4m-7-7H2m20 0h-3m-2.5-7.5L14 7m-4 10-2.5 2.5M17.5 17.5 15 15M6.5 6.5 9 9" />
          </svg>
          <span className="text-sm">Discovering attractions near {tripName}...</span>
        </div>
      </div>
    )
  }

  if (attractions.length === 0) {
    return null
  }

  const displayedAttractions = expanded ? attractions : attractions.slice(0, 4)

  return (
    <div className={`bg-slate-800/50 rounded-xl border border-slate-700 ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            🗺️ Nearby Attractions
            <span className="text-xs text-slate-400 font-normal">({attractions.length} found)</span>
          </h3>
        </div>

        <div className="grid gap-3">
          {displayedAttractions.map((attraction, index) => (
            <div
              key={index}
              className="bg-slate-700/30 rounded-lg p-4 hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-white truncate">{attraction.name}</h4>
                    {attraction.rate > 0 && (
                      <div className="flex items-center gap-1 text-xs text-yellow-400">
                        <span>★</span>
                        <span>{attraction.rate}/7</span>
                      </div>
                    )}
                  </div>
                  
                  {attraction.kinds && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {attraction.kinds.split(',').slice(0, 3).map((kind, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 bg-slate-600/50 text-slate-300 rounded"
                        >
                          {kind.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    {attraction.distance && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {attraction.distance < 1000 
                          ? `${Math.round(attraction.distance)}m` 
                          : `${(attraction.distance / 1000).toFixed(1)}km`
                        }
                      </span>
                    )}
                    
                    <div className="flex items-center gap-2">
                      {attraction.wikipedia && (
                        <a
                          href={`https://wikipedia.org/wiki/${attraction.wikipedia}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm-1.5 4.5c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5zm3 0c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5zM8 12c0 .552.448 1 1 1h6c.552 0 1-.448 1-1s-.448-1-1-1H9c-.552 0-1 .448-1 1zm-1.5 3c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5zm10 0c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5z"/>
                          </svg>
                          Wiki
                        </a>
                      )}
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${attraction.point.lat},${attraction.point.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M9 11a3 3 0 106 0 3 3 0 00-6 0z" />
                          <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        Map
                      </a>
                    </div>
                  </div>
                </div>

                {attraction.preview?.source && (
                  <img
                    src={attraction.preview.source}
                    alt={attraction.name}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {attractions.length > 4 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-4 w-full py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            {expanded ? 'Show Less' : `Show ${attractions.length - 4} More`}
          </button>
        )}
      </div>
    </div>
  )
}
