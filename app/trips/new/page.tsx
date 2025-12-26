'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Trip } from '@/lib/types'
import { saveTrip, getTripStatus, PlaceResult, getTimeAtTimezone, getTimezoneAbbr } from '@/lib/storage'
import { PlaceSearch } from '@/components/PlaceSearch'

export default function NewTripPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    startDate: '',
    endDate: '',
    color: '#3b82f6',
  })
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null)

  const colors = [
    // Row 1 - Vibrant
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Green', value: '#10b981' },
    { name: 'Teal', value: '#14b8a6' },
    // Row 2 - Muted/Pastel
    { name: 'Sky', value: '#0ea5e9' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Fuchsia', value: '#d946ef' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Lime', value: '#84cc16' },
    { name: 'Emerald', value: '#059669' },
    { name: 'Cyan', value: '#06b6d4' },
  ]

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    const trip: Trip = {
      id: crypto.randomUUID(),
      name: formData.name,
      destination: formData.destination || undefined,
      latitude: selectedPlace?.latitude,
      longitude: selectedPlace?.longitude,
      timezone: selectedPlace?.timezone,
      startDate: formData.startDate,
      endDate: formData.endDate,
      color: formData.color,
      status: getTripStatus(formData.startDate, formData.endDate),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    saveTrip(trip)
    router.push(`/trips/${trip.id}`)
  }

  const handlePlaceSelect = (place: PlaceResult) => {
    setSelectedPlace(place)
    setFormData(prev => ({
      ...prev,
      destination: place.city + (place.country ? `, ${place.country}` : ''),
      // Auto-fill name if empty
      name: prev.name || place.city
    }))
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="text-slate-300 hover:text-white flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 12H5m7-7-7 7 7 7" />
              </svg>
              Back
            </button>
            <h1 className="text-xl font-bold text-white">New Trip</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Destination Search */}
          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-slate-300 mb-2">
              Destination
            </label>
            <PlaceSearch
              value={formData.destination}
              onChange={(value) => setFormData({ ...formData, destination: value })}
              onPlaceSelect={handlePlaceSelect}
              placeholder="Search for a city..."
            />
            {selectedPlace && (
              <div className="mt-2 flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-emerald-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  {getTimezoneAbbr(selectedPlace.timezone)} • {getTimeAtTimezone(selectedPlace.timezone)}
                </span>
                <span className="text-slate-500">
                  Auto-detected timezone
                </span>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
              Trip Name
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Tokyo Summer 2025"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-slate-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-slate-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Color
            </label>
            <div className="grid grid-cols-8 gap-2 sm:flex sm:gap-3">
              {colors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg transition-all ${
                    formData.color === color.value
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Create Trip
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
