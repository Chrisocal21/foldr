'use client'

import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { useOnline } from '@/lib/offline'
import { Block, FlightBlock, HotelBlock, WorkBlock, TransportBlock, LayoverBlock } from '@/lib/types'

interface Location {
  lat: number
  lng: number
  name: string
  type: string
  details?: string
  date?: string
}

interface FullscreenMapProps {
  isOpen: boolean
  onClose: () => void
  latitude: number
  longitude: number
  destination?: string
  blocks?: Block[]
}

export function FullscreenMap({ isOpen, onClose, latitude, longitude, destination, blocks = [] }: FullscreenMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [showRoute, setShowRoute] = useState(true)
  const isOnline = useOnline()

  // Extract locations from blocks
  const extractLocations = (): Location[] => {
    const locations: Location[] = []
    
    // Add main destination
    locations.push({
      lat: latitude,
      lng: longitude,
      name: destination || 'Destination',
      type: 'destination',
    })
    
    // Extract from blocks (would need geocoding for full implementation)
    blocks.forEach(block => {
      if (block.type === 'flight') {
        const flight = block as FlightBlock
        // Note: In a real app, you'd geocode airports
        locations.push({
          lat: latitude + (Math.random() - 0.5) * 0.1,
          lng: longitude + (Math.random() - 0.5) * 0.1,
          name: `${flight.departureAirport} → ${flight.arrivalAirport}`,
          type: 'flight',
          details: `${flight.airline} ${flight.flightNumber}`,
          date: flight.date,
        })
      } else if (block.type === 'hotel') {
        const hotel = block as HotelBlock
        locations.push({
          lat: latitude + (Math.random() - 0.5) * 0.05,
          lng: longitude + (Math.random() - 0.5) * 0.05,
          name: hotel.name,
          type: 'hotel',
          details: hotel.address,
          date: hotel.checkInDate,
        })
      } else if (block.type === 'work') {
        const work = block as WorkBlock
        locations.push({
          lat: latitude + (Math.random() - 0.5) * 0.05,
          lng: longitude + (Math.random() - 0.5) * 0.05,
          name: work.siteName,
          type: 'work',
          details: work.address,
        })
      }
    })
    
    return locations
  }

  useEffect(() => {
    if (!isOpen || !isOnline) return
    if (typeof window === 'undefined') return
    if (!mapRef.current) return

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default
        
        if (!mapRef.current) return
        
        // Clean up existing map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }

        // Create map with more controls
        const map = L.map(mapRef.current, {
          scrollWheelZoom: true,
          zoomControl: true,
          doubleClickZoom: true,
        }).setView([latitude, longitude], 12)

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map)

        const locations = extractLocations()
        const markers: L.Marker[] = []
        
        // Custom icons for different location types
        const createIcon = (color: string, emoji: string) => L.divIcon({
          html: `<div style="background: ${color}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${emoji}</div>`,
          className: 'custom-marker',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        })

        const icons: Record<string, L.DivIcon> = {
          destination: createIcon('#ef4444', '📍'),
          flight: createIcon('#3b82f6', '✈️'),
          hotel: createIcon('#8b5cf6', '🏨'),
          work: createIcon('#f59e0b', '💼'),
          transport: createIcon('#10b981', '🚗'),
          layover: createIcon('#6b7280', '⏱️'),
        }

        // Add markers
        locations.forEach((loc, index) => {
          const marker = L.marker([loc.lat, loc.lng], { 
            icon: icons[loc.type] || icons.destination 
          }).addTo(map)
          
          marker.bindPopup(`
            <div style="min-width: 150px;">
              <strong>${loc.name}</strong>
              ${loc.details ? `<br><span style="color: #666;">${loc.details}</span>` : ''}
              ${loc.date ? `<br><small>${new Date(loc.date).toLocaleDateString()}</small>` : ''}
              <br><a href="https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}" target="_blank" style="color: #3b82f6;">Get Directions</a>
            </div>
          `)
          
          markers.push(marker)
        })

        // Draw route line if enabled
        if (showRoute && locations.length > 1) {
          const routeCoords = locations.map(loc => [loc.lat, loc.lng] as [number, number])
          L.polyline(routeCoords, {
            color: '#3b82f6',
            weight: 3,
            opacity: 0.7,
            dashArray: '10, 10',
          }).addTo(map)
        }

        // Fit bounds to show all markers
        if (markers.length > 1) {
          const group = L.featureGroup(markers)
          map.fitBounds(group.getBounds().pad(0.1))
        }

        mapInstanceRef.current = map
        setIsLoaded(true)

        setTimeout(() => map.invalidateSize(), 100)
      } catch (err) {
        console.error('Map init error:', err)
      }
    }

    // Small delay to ensure DOM is ready
    setTimeout(initMap, 100)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [isOpen, latitude, longitude, blocks, showRoute, isOnline])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{destination || 'Trip Map'}</h2>
            <p className="text-sm text-slate-300">
              {blocks.length} locations • Tap markers for details
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Map */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Route Toggle */}
          <button
            onClick={() => setShowRoute(!showRoute)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showRoute ? 'bg-blue-500 text-white' : 'bg-white/10 text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 20l-5.447-2.724A2 2 0 013 15.382V5.618a2 2 0 011.106-1.789l4-2A2 2 0 019 2a2 2 0 011.894 1.368l2 6A2 2 0 0113 10v10M9 20l4-2m0 0l4 2m-4-2v-8" />
            </svg>
            Show Route
          </button>

          {/* Open in Maps */}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open in Maps
          </a>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-300">
          <span className="flex items-center gap-1">📍 Destination</span>
          <span className="flex items-center gap-1">✈️ Flight</span>
          <span className="flex items-center gap-1">🏨 Hotel</span>
          <span className="flex items-center gap-1">💼 Work</span>
        </div>
      </div>

      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <div className="text-center">
            <svg className="w-8 h-8 animate-spin text-white mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2v4m0 12v4m-7-7H2m20 0h-3" />
            </svg>
            <p className="text-slate-400">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  )
}
