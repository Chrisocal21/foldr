'use client'

import { useState, useEffect, FormEvent, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trip, Block } from '@/lib/types'
import { getTripById, getBlocksByTripId, saveTrip, saveBlock, getTripStatus } from '@/lib/storage'

export default function DuplicateTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [originalTrip, setOriginalTrip] = useState<Trip | null>(null)
  const [originalBlocks, setOriginalBlocks] = useState<Block[]>([])
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    const trip = getTripById(id)
    if (!trip) {
      router.push('/trips')
      return
    }
    
    setOriginalTrip(trip)
    setOriginalBlocks(getBlocksByTripId(id))
    
    // Pre-fill form with original trip name
    setFormData({
      name: `${trip.name} (Copy)`,
      startDate: '',
      endDate: '',
    })
  }, [id, router])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    if (!originalTrip) return
    
    // Create new trip
    const newTripId = crypto.randomUUID()
    const newTrip: Trip = {
      id: newTripId,
      name: formData.name,
      startDate: formData.startDate,
      endDate: formData.endDate,
      color: originalTrip.color,
      status: getTripStatus(formData.startDate, formData.endDate),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    saveTrip(newTrip)
    
    // Duplicate all blocks (without date-specific info)
    originalBlocks.forEach(block => {
      const newBlock: Block = {
        ...block,
        id: crypto.randomUUID(),
        tripId: newTripId,
        date: '', // Clear dates so user can update them
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      saveBlock(newBlock)
    })
    
    router.push(`/trips/${newTripId}`)
  }

  if (!originalTrip) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Subtle accent glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-slate-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-slate-400/5 rounded-full blur-3xl pointer-events-none" />
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/trips/${id}`}
              className="text-slate-300 hover:text-white flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 12H5m7-7-7 7 7 7" />
              </svg>
              Back
            </Link>
            <h1 className="text-xl font-bold text-white">Duplicate Trip</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-2">Original Trip</h2>
          <p className="text-slate-300">{originalTrip.name}</p>
          <p className="text-sm text-slate-400 mt-1">
            {originalBlocks.length} block{originalBlocks.length !== 1 ? 's' : ''} will be copied
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
              New Trip Name
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Tokyo Summer 2025"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
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
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
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
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>

          <div className="bg-slate-600/10 border border-slate-600/30 rounded-lg p-4">
            <p className="text-sm text-slate-300">
              <strong>Note:</strong> All blocks will be copied, but dates will be cleared so you can update them for the new trip.
            </p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-white hover:bg-slate-100 text-slate-900 py-3 rounded-lg font-medium transition-colors"
            >
              Duplicate Trip
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
