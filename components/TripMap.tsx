'use client'

import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { useOnline } from '@/lib/offline'
import { useSettings } from '@/lib/settings-context'
import { FullscreenMap } from './FullscreenMap'
import { Block } from '@/lib/types'

interface TripMapProps {
  latitude: number
  longitude: number
  destination?: string
  className?: string
  blocks?: Block[]
}

export function TripMap({ latitude, longitude, destination, className = '', blocks = [] }: TripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const isOnline = useOnline()
  const { settings } = useSettings()

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return
    if (!mapRef.current) return
    if (!isOnline) return // Don't try to load map offline
    
    // Prevent re-initialization
    if (mapInstanceRef.current) return

    // Dynamically import Leaflet
    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default
        
        // Check again in case component unmounted
        if (!mapRef.current || mapInstanceRef.current) return

        // Create map
        const map = L.map(mapRef.current, {
          scrollWheelZoom: false,
          zoomControl: true,
        }).setView([latitude, longitude], settings.mapDefaultZoom)

        // Add tile layer with error handling
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        })
        
        tileLayer.on('tileerror', () => {
          if (!navigator.onLine) setLoadError(true)
        })
        
        tileLayer.addTo(map)

        // Custom icon
        const icon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })

        // Add marker
        const marker = L.marker([latitude, longitude], { icon }).addTo(map)
        if (destination) {
          marker.bindPopup(`<b>${destination}</b>`)
        }

        mapInstanceRef.current = map
        setIsLoaded(true)
        
        // Force map to recalculate size after render
        setTimeout(() => {
          map.invalidateSize()
        }, 100)
      } catch (err) {
        setLoadError(true)
      }
    }

    initMap()

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [latitude, longitude, destination, isOnline, settings.mapDefaultZoom])

  // Offline state
  if (!isOnline || loadError) {
    return (
      <div className={`rounded-xl overflow-hidden ${className}`} style={{ minHeight: '200px', height: '200px' }}>
        <div className="h-full w-full bg-slate-800 flex flex-col items-center justify-center text-slate-500">
          <svg className="w-8 h-8 mb-2 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm">Map unavailable offline</span>
          {destination && (
            <span className="text-xs text-slate-600 mt-1">{destination}</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div 
        className={`rounded-xl overflow-hidden cursor-pointer relative group ${className}`} 
        style={{ minHeight: '200px', height: '200px' }}
        onClick={() => setIsFullscreen(true)}
      >
        {/* Expand hint overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors z-10 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-black/70 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            Tap to expand
          </div>
        </div>
        
        <div 
          ref={mapRef} 
          style={{ height: '200px', width: '100%' }}
        >
          {!isLoaded && (
            <div className="h-full w-full bg-slate-800 flex items-center justify-center text-slate-500">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 2v4m0 12v4m-7-7H2m20 0h-3m-2.5-7.5L14 7m-4 10-2.5 2.5M17.5 17.5 15 15M6.5 6.5 9 9" />
                </svg>
                Loading map...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Map Modal */}
      <FullscreenMap
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        latitude={latitude}
        longitude={longitude}
        destination={destination}
        blocks={blocks}
      />
    </>
  )
}
