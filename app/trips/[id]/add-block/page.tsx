'use client'

import { useState, FormEvent, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BlockType, FlightBlock, HotelBlock, WorkBlock, TransportBlock, NoteBlock, LayoverBlock, ScreenshotBlock, PackingBlock, ExpenseBlock } from '@/lib/types'
import { saveBlock } from '@/lib/storage'
import { ComboBox } from '@/components/ComboBox'
import { AIRLINES, AIRPORTS, TERMINALS, TRANSPORT_TYPES, HOTEL_CHAINS } from '@/lib/travel-data'
import { extractTextFromImage } from '@/lib/ocr'

export default function AddBlockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [blockType, setBlockType] = useState<BlockType>('flight')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Subtle accent glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-slate-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-slate-400/5 rounded-full blur-3xl pointer-events-none" />
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/trips/${id}`} className="text-slate-300 hover:text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 12H5m7-7-7 7 7 7" />
              </svg>
              Back
            </Link>
            <h1 className="text-xl font-bold text-white">Add Block</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Block Type Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-3">Block Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <BlockTypeButton
              type="flight"
              label="Flight"
              icon={<PlaneIcon />}
              active={blockType === 'flight'}
              onClick={() => setBlockType('flight')}
            />
            <BlockTypeButton
              type="hotel"
              label="Hotel"
              icon={<HotelIcon />}
              active={blockType === 'hotel'}
              onClick={() => setBlockType('hotel')}
            />
            <BlockTypeButton
              type="layover"
              label="Layover"
              icon={<ClockIcon />}
              active={blockType === 'layover'}
              onClick={() => setBlockType('layover')}
            />
            <BlockTypeButton
              type="transport"
              label="Transport"
              icon={<CarIcon />}
              active={blockType === 'transport'}
              onClick={() => setBlockType('transport')}
            />
            <BlockTypeButton
              type="work"
              label="Work"
              icon={<BriefcaseIcon />}
              active={blockType === 'work'}
              onClick={() => setBlockType('work')}
            />
            <BlockTypeButton
              type="screenshot"
              label="Screenshot"
              icon={<CameraIcon />}
              active={blockType === 'screenshot'}
              onClick={() => setBlockType('screenshot')}
            />
            <BlockTypeButton
              type="note"
              label="Note"
              icon={<NoteIcon />}
              active={blockType === 'note'}
              onClick={() => setBlockType('note')}
            />
            <BlockTypeButton
              type="packing"
              label="Packing"
              icon={<PackingIcon />}
              active={blockType === 'packing'}
              onClick={() => setBlockType('packing')}
            />
            <BlockTypeButton
              type="expense"
              label="Expenses"
              icon={<ExpenseIcon />}
              active={blockType === 'expense'}
              onClick={() => setBlockType('expense')}
            />
          </div>
        </div>

        {/* Form based on block type */}
        {blockType === 'flight' && <FlightForm tripId={id} />}
        {blockType === 'hotel' && <HotelForm tripId={id} />}
        {blockType === 'layover' && <LayoverForm tripId={id} />}
        {blockType === 'transport' && <TransportForm tripId={id} />}
        {blockType === 'work' && <WorkForm tripId={id} />}
        {blockType === 'screenshot' && <ScreenshotForm tripId={id} />}
        {blockType === 'note' && <NoteForm tripId={id} />}
        {blockType === 'packing' && <PackingForm tripId={id} />}
        {blockType === 'expense' && <ExpenseForm tripId={id} />}
      </main>
    </div>
  )
}

function BlockTypeButton({ 
  type, 
  label, 
  icon, 
  active, 
  onClick 
}: { 
  type: BlockType
  label: string
  icon: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-4 rounded-lg border-2 transition-all ${
        active
          ? 'border-white bg-white/20 text-white'
          : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        <div className={active ? 'text-white' : ''}>{icon}</div>
        <span className="text-sm font-medium">{label}</span>
      </div>
    </button>
  )
}

function FlightForm({ tripId }: { tripId: string }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    airline: '',
    flightNumber: '',
    date: '',
    departureTime: '',
    departureAirport: '',
    arrivalTime: '',
    arrivalAirport: '',
    confirmationNumber: '',
    seat: '',
    terminal: '',
    gate: '',
    notes: '',
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    const block: FlightBlock = {
      id: crypto.randomUUID(),
      tripId,
      type: 'flight',
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    saveBlock(block)
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
        Add Flight
      </button>
    </form>
  )
}

function HotelForm({ tripId }: { tripId: string }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    checkInDate: '',
    checkInTime: '',
    checkOutDate: '',
    checkOutTime: '',
    confirmationNumber: '',
    notes: '',
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    const block: HotelBlock = {
      id: crypto.randomUUID(),
      tripId,
      type: 'hotel',
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    saveBlock(block)
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
          placeholder="Check-in Date"
          value={formData.checkInDate}
          onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
        />
        <input
          type="time"
          placeholder="Check-in Time"
          value={formData.checkInTime}
          onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <input
          type="date"
          required
          placeholder="Check-out Date"
          value={formData.checkOutDate}
          onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
        />
        <input
          type="time"
          placeholder="Check-out Time"
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
        Add Hotel
      </button>
    </form>
  )
}

function TransportForm({ tripId }: { tripId: string }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    transportType: '',
    company: '',
    confirmationNumber: '',
    pickupLocation: '',
    pickupDateTime: '',
    dropoffLocation: '',
    dropoffDateTime: '',
    notes: '',
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    const block: TransportBlock = {
      id: crypto.randomUUID(),
      tripId,
      type: 'transport',
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    saveBlock(block)
    router.push(`/trips/${tripId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <ComboBox
          value={formData.transportType}
          onChange={(value) => setFormData({ ...formData, transportType: value })}
          options={TRANSPORT_TYPES}
          placeholder="Type (e.g., Rental, Uber) *"
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
        Add Transportation
      </button>
    </form>
  )
}

function WorkForm({ tripId }: { tripId: string }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    siteName: '',
    address: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    notes: '',
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    const block: WorkBlock = {
      id: crypto.randomUUID(),
      tripId,
      type: 'work',
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    saveBlock(block)
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
        Add Work Details
      </button>
    </form>
  )
}

function NoteForm({ tripId }: { tripId: string }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    text: '',
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    const block: NoteBlock = {
      id: crypto.randomUUID(),
      tripId,
      type: 'note',
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    saveBlock(block)
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
        Add Note
      </button>
    </form>
  )
}

// Icon components
function PlaneIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z" />
    </svg>
  )
}

function HotelIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 21h18M4 21V7a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v14M14 21V10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v11" />
      <path d="M8 14h.01M8 10h.01M16 14h.01" />
    </svg>
  )
}

function CarIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M5 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0Zm10 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0Z" />
      <path d="M5 17H3v-5l2-5h9l4 5v5h-2m-7-9 1.5 4.5H9L7.5 8Z" />
    </svg>
  )
}

function BriefcaseIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function NoteIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  )
}

function PackingIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

function ExpenseIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  )
}

function LayoverForm({ tripId }: { tripId: string }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    location: '',
    arrivalTime: '',
    departureTime: '',
    terminal: '',
    notes: '',
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    const block: LayoverBlock = {
      id: crypto.randomUUID(),
      tripId,
      type: 'layover',
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    saveBlock(block)
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
        Add Layover
      </button>
    </form>
  )
}

function ScreenshotForm({ tripId }: { tripId: string }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    caption: '',
    imageData: '',
    notes: '',
  })
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, imageData: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!formData.imageData) {
      alert('Please select an image')
      return
    }
    
    setIsProcessing(true)
    
    try {
      // Extract text from image using OCR
      const extractedText = await extractTextFromImage(formData.imageData)
      
      const block: ScreenshotBlock = {
        id: crypto.randomUUID(),
        tripId,
        type: 'screenshot',
        ...formData,
        extractedText: extractedText || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      saveBlock(block)
      router.push(`/trips/${tripId}`)
    } catch (error) {
      console.error('Error processing screenshot:', error)
      alert('Error processing image. Please try again.')
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-slate-400 mb-2">Image *</label>
        <input
          type="file"
          accept="image/*"
          required
          onChange={handleFileChange}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-white file:text-slate-900 file:cursor-pointer hover:file:bg-slate-100"
        />
      </div>

      {formData.imageData && (
        <div className="rounded-lg overflow-hidden bg-slate-900 border border-slate-700">
          <img
            src={formData.imageData}
            alt="Preview"
            className="w-full h-auto"
          />
        </div>
      )}

      <input
        type="text"
        placeholder="Caption (optional)"
        value={formData.caption}
        onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
      />

      <textarea
        placeholder="Notes (optional)"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        rows={3}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
      />

      <button
        type="submit"
        disabled={isProcessing}
        className="w-full bg-white hover:bg-slate-100 text-slate-900 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing image...
          </>
        ) : (
          'Add Screenshot'
        )}
      </button>
    </form>
  )
}

function PackingForm({ tripId }: { tripId: string }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    const block: PackingBlock = {
      id: crypto.randomUUID(),
      tripId,
      type: 'packing',
      title: formData.title || 'Packing List',
      notes: formData.notes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    saveBlock(block)
    router.push(`/trips/${tripId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 mb-4">
        <p className="text-slate-400 text-sm">
          Add a packing list to track what you need to bring. You can add items and check them off as you pack.
        </p>
      </div>

      <input
        type="text"
        placeholder="List name (e.g., Beach Trip Essentials)"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
      />

      <textarea
        placeholder="Notes (optional)"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        rows={3}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
      />

      <button
        type="submit"
        className="w-full bg-white hover:bg-slate-100 text-slate-900 py-3 rounded-lg font-medium transition-colors"
      >
        Add Packing List
      </button>
    </form>
  )
}

function ExpenseForm({ tripId }: { tripId: string }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    const block: ExpenseBlock = {
      id: crypto.randomUUID(),
      tripId,
      type: 'expense',
      title: formData.title || 'Expenses',
      notes: formData.notes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    saveBlock(block)
    router.push(`/trips/${tripId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 mb-4">
        <p className="text-slate-400 text-sm">
          Add an expense tracker to log your spending. Track costs across multiple currencies and categories.
        </p>
      </div>

      <input
        type="text"
        placeholder="Tracker name (e.g., Japan Trip Budget)"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
      />

      <textarea
        placeholder="Notes (optional)"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        rows={3}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
      />

      <button
        type="submit"
        className="w-full bg-white hover:bg-slate-100 text-slate-900 py-3 rounded-lg font-medium transition-colors"
      >
        Add Expense Tracker
      </button>
    </form>
  )
}
