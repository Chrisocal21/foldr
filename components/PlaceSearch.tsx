'use client'

import { useState, useEffect, useRef } from 'react'
import { PlaceResult, searchPlaces } from '@/lib/storage'

interface PlaceSearchProps {
  value: string
  onChange: (value: string) => void
  onPlaceSelect: (place: PlaceResult) => void
  placeholder?: string
  className?: string
}

export function PlaceSearch({ 
  value, 
  onChange, 
  onPlaceSelect, 
  placeholder = 'Search for a city...',
  className = ''
}: PlaceSearchProps) {
  const [results, setResults] = useState<PlaceResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
  useEffect(() => {
    if (selectedPlace) return // Don't search if we already selected a place
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    if (value.length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }

    setIsSearching(true)
    searchTimeout.current = setTimeout(async () => {
      const places = await searchPlaces(value)
      setResults(places)
      setShowDropdown(places.length > 0)
      setIsSearching(false)
    }, 400) // 400ms debounce

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }
    }
  }, [value, selectedPlace])

  const handleSelect = (place: PlaceResult) => {
    setSelectedPlace(place)
    onChange(place.city + (place.country ? `, ${place.country}` : ''))
    setShowDropdown(false)
    onPlaceSelect(place)
  }

  const handleInputChange = (newValue: string) => {
    setSelectedPlace(null) // Clear selected place when typing
    onChange(newValue)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className={`w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        />
        
        {/* Search/Location Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
          {isSearching ? (
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2v4m0 12v4m-7-7H2m20 0h-3m-2.5-7.5L14 7m-4 10-2.5 2.5M17.5 17.5 15 15M6.5 6.5 9 9" />
            </svg>
          ) : selectedPlace ? (
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {results.map((place, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(place)}
              className="w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg border-b border-slate-700 last:border-0"
            >
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {place.city}{place.country && <span className="text-slate-400">, {place.country}</span>}
                  </p>
                  <p className="text-sm text-slate-500 truncate">{place.displayName}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                      {place.timezone.split('/').pop()?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
