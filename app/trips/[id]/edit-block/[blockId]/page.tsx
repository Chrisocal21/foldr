'use client'

import { useState, useEffect, FormEvent, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BlockType, FlightBlock, HotelBlock, WorkBlock, TransportBlock, NoteBlock, LayoverBlock, ScreenshotBlock } from '@/lib/types'
import { getBlockById, saveBlock } from '@/lib/storage'
import { ComboBox } from '@/components/ComboBox'
import { AIRLINES, AIRPORTS, TERMINALS, TRANSPORT_TYPES, HOTEL_CHAINS } from '@/lib/travel-data'
import { extractTextFromImage } from '@/lib/ocr'

export default function EditBlockPage({ params }: { params: Promise<{ id: string; blockId: string }> }) {
  const { id: tripId, blockId } = use(params)
  const router = useRouter()
  const [block, setBlock] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const blockData = getBlockById(blockId)
    if (!blockData || blockData.tripId !== tripId) {
      router.push(`/trips/${tripId}`)
      return
    }
    setBlock(blockData)
    setIsLoading(false)
  }, [blockId, tripId, router])

  if (isLoading || !block) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Subtle accent glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-slate-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-slate-400/5 rounded-full blur-3xl pointer-events-none" />
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/trips/${tripId}`} className="text-slate-300 hover:text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 12H5m7-7-7 7 7 7" />
              </svg>
              Back
            </Link>
            <h1 className="text-xl font-bold text-white">Edit Block</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {block.type === 'flight' && <EditFlightForm block={block} tripId={tripId} />}
        {block.type === 'hotel' && <EditHotelForm block={block} tripId={tripId} />}
        {block.type === 'layover' && <EditLayoverForm block={block} tripId={tripId} />}
        {block.type === 'transport' && <EditTransportForm block={block} tripId={tripId} />}
        {block.type === 'work' && <EditWorkForm block={block} tripId={tripId} />}
        {block.type === 'screenshot' && <EditScreenshotForm block={block} tripId={tripId} />}
        {block.type === 'note' && <EditNoteForm block={block} tripId={tripId} />}
      </main>
    </div>
  )
}

// Edit Forms for each block type
function EditFlightForm({ block, tripId }: { block: FlightBlock; tripId: string }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    airline: block.airline,
    flightNumber: block.flightNumber,
    date: block.date,
    departureTime: block.departureTime,
    departureAirport: block.departureAirport,
    arrivalTime: block.arrivalTime,
    arrivalAirport: block.arrivalAirport,
    confirmationNumber: block.confirmationNumber || '',
    seat: block.seat || '',
    terminal: block.terminal || '',
    gate: block.gate || '',
    notes: block.notes || '',
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    const updatedBlock: FlightBlock = {
      ...block,
      ...formData,
      updatedAt: new Date().toISOString(),
    }
    
    saveBlock(updatedBlock)
    router.push(`/trips/${tripId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <ComboBox
          value={formData.airline}
          onChange={(value) => setFormData({ ...formData, airline: value })}
          options={AIRLINES}
          placeholder="Airline *"
          required
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
        />
        <input
          type="text"
          required
          placeholder="Flight Number *"
          value={formData.flightNumber}
          onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
        />
      </div>

      <input
        type="date"
        required
        value={formData.date}
        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <ComboBox
          value={formData.departureAirport}
          onChange={(value) => setFormData({ ...formData, departureAirport: value })}
          options={AIRPORTS}
          placeholder="Departure Airport *"
          required
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
        />
        <input
          type="time"
          required
          value={formData.departureTime}
          onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <ComboBox
          value={formData.arrivalAirport}
          onChange={(value) => setFormData({ ...formData, arrivalAirport: value })}
          options={AIRPORTS}
          placeholder="Arrival Airport *"
          required
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
        />
        <input
          type="time"
          required
          value={formData.arrivalTime}
          onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Confirmation Number"
          value={formData.confirmationNumber}
          onChange={(e) => setFormData({ ...formData, confirmationNumber: e.target.value })}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
        />
        <input
          type="text"
          placeholder="Seat"
          value={formData.seat}
          onChange={(e) => setFormData({ ...formData, seat: e.target.value })}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <ComboBox
          value={formData.terminal}
          onChange={(value) => setFormData({ ...formData, terminal: value })}
          options={TERMINALS}
          placeholder="Terminal"
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
        />
        <input
          type="text"
          placeholder="Gate"
          value={formData.gate}
          onChange={(e) => setFormData({ ...formData, gate: e.target.value })}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
        />
      </div>

      <textarea
        placeholder="Notes"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        rows={3}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
      />

      <button
        type="submit"
        className="w-full bg-white hover:bg-slate-100 text-slate-900 py-3 rounded-lg font-medium transition-colors"
      >
        Save Changes
      </button>
    </form>
  )
}

// Similar edit forms for other block types - I'll create abbreviated versions
function EditHotelForm({ block, tripId }: { block: HotelBlock; tripId: string }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: block.name,
    address: block.address,
    phone: block.phone,
    checkInDate: block.checkInDate,
    checkInTime: block.checkInTime || '',
    checkOutDate: block.checkOutDate,
    checkOutTime: block.checkOutTime || '',
    confirmationNumber: block.confirmationNumber || '',
    notes: block.notes || '',
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    saveBlock({ ...block, ...formData, updatedAt: new Date().toISOString() })
    router.push(`/trips/${tripId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ComboBox
        value={formData.name}
        onChange={(value) => setFormData({ ...formData, name: value })}
        options={HOTEL_CHAINS}
        placeholder="Hotel Name *"
        required
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
      />

      <input
        type="text"
        required
        placeholder="Address *"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
      />

      <input
        type="tel"
        required
        placeholder="Phone *"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <input
          type="date"
          required
          value={formData.checkInDate}
          onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
        />
        <input
          type="time"
          value={formData.checkInTime}
          onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <input
          type="date"
          required
          value={formData.checkOutDate}
          onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
        />
        <input
          type="time"
          value={formData.checkOutTime}
          onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
        />
      </div>

      <input
        type="text"
        placeholder="Confirmation Number"
        value={formData.confirmationNumber}
        onChange={(e) => setFormData({ ...formData, confirmationNumber: e.target.value })}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
      />

      <textarea
        placeholder="Notes"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        rows={3}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
      />

      <button
        type="submit"
        className="w-full bg-white hover:bg-slate-100 text-slate-900 py-3 rounded-lg font-medium transition-colors"
      >
        Save Changes
      </button>
    </form>
  )
}

function EditLayoverForm({ block, tripId }: { block: LayoverBlock; tripId: string }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    location: block.location,
    arrivalTime: block.arrivalTime,
    departureTime: block.departureTime,
    terminal: block.terminal || '',
    notes: block.notes || '',
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    saveBlock({ ...block, ...formData, updatedAt: new Date().toISOString() })
    router.push(`/trips/${tripId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ComboBox
        value={formData.location}
        onChange={(value) => setFormData({ ...formData, location: value })}
        options={AIRPORTS}
        placeholder="Airport/Location *"
        required
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-2">Arrival Time</label>
          <input
            type="datetime-local"
            required
            value={formData.arrivalTime}
            onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-2">Departure Time</label>
          <input
            type="datetime-local"
            required
            value={formData.departureTime}
            onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>
      </div>

      <ComboBox
        value={formData.terminal}
        onChange={(value) => setFormData({ ...formData, terminal: value })}
        options={TERMINALS}
        placeholder="Terminal"
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
      />

      <textarea
        placeholder="Notes"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        rows={3}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
      />

      <button
        type="submit"
        className="w-full bg-white hover:bg-slate-100 text-slate-900 py-3 rounded-lg font-medium transition-colors"
      >
        Save Changes
      </button>
    </form>
  )
}

function EditTransportForm({ block, tripId }: { block: TransportBlock; tripId: string }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    transportType: block.transportType,
    company: block.company || '',
    confirmationNumber: block.confirmationNumber || '',
    pickupLocation: block.pickupLocation,
    pickupDateTime: block.pickupDateTime,
    dropoffLocation: block.dropoffLocation,
    dropoffDateTime: block.dropoffDateTime,
    notes: block.notes || '',
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    saveBlock({ ...block, ...formData, updatedAt: new Date().toISOString() })
    router.push(`/trips/${tripId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <ComboBox
          value={formData.transportType}
          onChange={(value) => setFormData({ ...formData, transportType: value })}
          options={TRANSPORT_TYPES}
          placeholder="Type *"
          required
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
        />
        <input
          type="text"
          placeholder="Company"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
        />
      </div>

      <input
        type="text"
        placeholder="Confirmation Number"
        value={formData.confirmationNumber}
        onChange={(e) => setFormData({ ...formData, confirmationNumber: e.target.value })}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
      />

      <input
        type="text"
        required
        placeholder="Pickup Location *"
        value={formData.pickupLocation}
        onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
      />

      <input
        type="datetime-local"
        required
        value={formData.pickupDateTime}
        onChange={(e) => setFormData({ ...formData, pickupDateTime: e.target.value })}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
      />

      <input
        type="text"
        required
        placeholder="Dropoff Location *"
        value={formData.dropoffLocation}
        onChange={(e) => setFormData({ ...formData, dropoffLocation: e.target.value })}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
      />

      <input
        type="datetime-local"
        required
        value={formData.dropoffDateTime}
        onChange={(e) => setFormData({ ...formData, dropoffDateTime: e.target.value })}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
      />

      <textarea
        placeholder="Notes"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        rows={3}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
      />

      <button
        type="submit"
        className="w-full bg-white hover:bg-slate-100 text-slate-900 py-3 rounded-lg font-medium transition-colors"
      >
        Save Changes
      </button>
    </form>
  )
}

function EditWorkForm({ block, tripId }: { block: WorkBlock; tripId: string }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    siteName: block.siteName,
    address: block.address,
    contactName: block.contactName || '',
    contactPhone: block.contactPhone || '',
    contactEmail: block.contactEmail || '',
    notes: block.notes || '',
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    saveBlock({ ...block, ...formData, updatedAt: new Date().toISOString() })
    router.push(`/trips/${tripId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        required
        placeholder="Site/Venue Name *"
        value={formData.siteName}
        onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
      />

      <input
        type="text"
        required
        placeholder="Address *"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
      />

      <input
        type="text"
        placeholder="Contact Name"
        value={formData.contactName}
        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <input
          type="tel"
          placeholder="Contact Phone"
          value={formData.contactPhone}
          onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
        />
        <input
          type="email"
          placeholder="Contact Email"
          value={formData.contactEmail}
          onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
        />
      </div>

      <textarea
        placeholder="Notes"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        rows={3}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
      />

      <button
        type="submit"
        className="w-full bg-white hover:bg-slate-100 text-slate-900 py-3 rounded-lg font-medium transition-colors"
      >
        Save Changes
      </button>
    </form>
  )
}

function EditScreenshotForm({ block, tripId }: { block: ScreenshotBlock; tripId: string }) {
  const router = useRouter()
  const [caption, setCaption] = useState(block.caption || '')
  const [notes, setNotes] = useState(block.notes || '')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    saveBlock({ ...block, caption, notes, updatedAt: new Date().toISOString() })
    router.push(`/trips/${tripId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg overflow-hidden bg-slate-900 border border-slate-700 mb-4">
        <img
          src={block.imageData}
          alt="Screenshot"
          className="w-full h-auto"
        />
      </div>

      <input
        type="text"
        placeholder="Caption (optional)"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
      />

      <textarea
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
      />

      {block.extractedText && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <label className="block text-sm text-slate-400 mb-2">Extracted Text</label>
          <p className="text-slate-300 text-sm">{block.extractedText}</p>
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-white hover:bg-slate-100 text-slate-900 py-3 rounded-lg font-medium transition-colors"
      >
        Save Changes
      </button>
    </form>
  )
}

function EditNoteForm({ block, tripId }: { block: NoteBlock; tripId: string }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: block.title || '',
    text: block.text,
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    saveBlock({ ...block, ...formData, updatedAt: new Date().toISOString() })
    router.push(`/trips/${tripId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Title (optional)"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
      />

      <textarea
        required
        placeholder="Note text *"
        value={formData.text}
        onChange={(e) => setFormData({ ...formData, text: e.target.value })}
        rows={8}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
      />

      <button
        type="submit"
        className="w-full bg-white hover:bg-slate-100 text-slate-900 py-3 rounded-lg font-medium transition-colors"
      >
        Save Changes
      </button>
    </form>
  )
}
