import { useState } from 'react'
import { Block, FlightBlock, HotelBlock, WorkBlock, TransportBlock, NoteBlock, LayoverBlock, ScreenshotBlock, PackingBlock, ExpenseBlock } from '@/lib/types'
import { CopyField } from './CopyField'
import { duplicateBlock } from '@/lib/storage'
import Link from 'next/link'
import { PackingList } from './PackingList'
import { ExpenseTracker } from './ExpenseTracker'

// Helper to format date string correctly (avoiding timezone issues)
// Input: "2025-01-15" -> Output: "1/15/2025" (in local format)
function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  // Handle datetime strings like "2025-01-15T00:00:00.000Z"
  const datePart = dateStr.split('T')[0]
  const [year, month, day] = datePart.split('-').map(Number)
  if (!year || !month || !day) {
    return dateStr // Return as-is if can't parse
  }
  const date = new Date(year, month - 1, day) // month is 0-indexed
  return date.toLocaleDateString()
}

// Helper to format datetime string correctly (avoiding timezone issues)
// Input: "2025-01-15T14:30" -> Output: "1/15/2025, 2:30:00 PM" (in local format)
function formatDateTime(dateTimeStr: string): string {
  if (!dateTimeStr) return ''
  // Parse datetime-local format: "YYYY-MM-DDTHH:MM"
  const [datePart, timePart] = dateTimeStr.split('T')
  if (!datePart || !timePart) {
    // Return as-is if format is unexpected
    return dateTimeStr
  }
  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes] = timePart.split(':').map(Number)
  const date = new Date(year, month - 1, day, hours, minutes)
  return date.toLocaleString()
}

// Helper to calculate flight check-in status
function getFlightCheckInStatus(departureTime: string): { canCheckIn: boolean; countdown: string | null; checkInOpen: boolean } {
  if (!departureTime) return { canCheckIn: false, countdown: null, checkInOpen: false }
  
  const [datePart, timePart] = departureTime.split('T')
  if (!datePart || !timePart) return { canCheckIn: false, countdown: null, checkInOpen: false }
  
  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes] = timePart.split(':').map(Number)
  const departure = new Date(year, month - 1, day, hours, minutes)
  const now = new Date()
  
  // Check-in typically opens 24 hours before departure
  const checkInOpens = new Date(departure.getTime() - 24 * 60 * 60 * 1000)
  const timeUntilCheckIn = checkInOpens.getTime() - now.getTime()
  const timeUntilDeparture = departure.getTime() - now.getTime()
  
  // Already departed
  if (timeUntilDeparture < 0) return { canCheckIn: false, countdown: null, checkInOpen: false }
  
  // Check-in is open (within 24 hours of departure)
  if (timeUntilCheckIn <= 0) {
    const hoursLeft = Math.floor(timeUntilDeparture / (60 * 60 * 1000))
    return { 
      canCheckIn: true, 
      countdown: hoursLeft > 0 ? `${hoursLeft}h until departure` : 'Departing soon!',
      checkInOpen: true 
    }
  }
  
  // Check-in opens soon (within 48 hours)
  if (timeUntilCheckIn < 24 * 60 * 60 * 1000) {
    const hoursUntil = Math.floor(timeUntilCheckIn / (60 * 60 * 1000))
    const minsUntil = Math.floor((timeUntilCheckIn % (60 * 60 * 1000)) / (60 * 1000))
    return { 
      canCheckIn: false, 
      countdown: hoursUntil > 0 ? `Check-in opens in ${hoursUntil}h ${minsUntil}m` : `Check-in opens in ${minsUntil}m`,
      checkInOpen: false 
    }
  }
  
  return { canCheckIn: false, countdown: null, checkInOpen: false }
}

// Deep link generators
function getGoogleMapsLink(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

function getAppleMapsLink(address: string): string {
  return `https://maps.apple.com/?q=${encodeURIComponent(address)}`
}

function getUberDeepLink(address: string): string {
  return `https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${encodeURIComponent(address)}`
}

// Airline check-in links (common airlines)
function getAirlineCheckInLink(airline: string): string | null {
  const airlineLower = airline.toLowerCase()
  const checkInLinks: Record<string, string> = {
    'united': 'https://www.united.com/en/us/checkin',
    'ua': 'https://www.united.com/en/us/checkin',
    'delta': 'https://www.delta.com/mytrips/',
    'dl': 'https://www.delta.com/mytrips/',
    'american': 'https://www.aa.com/homePage.do',
    'aa': 'https://www.aa.com/homePage.do',
    'southwest': 'https://www.southwest.com/air/check-in/',
    'wn': 'https://www.southwest.com/air/check-in/',
    'jetblue': 'https://www.jetblue.com/check-in',
    'b6': 'https://www.jetblue.com/check-in',
    'alaska': 'https://www.alaskaair.com/checkin',
    'as': 'https://www.alaskaair.com/checkin',
    'spirit': 'https://www.spirit.com/check-in',
    'nk': 'https://www.spirit.com/check-in',
    'frontier': 'https://www.flyfrontier.com/travel/my-trips/check-in/',
    'f9': 'https://www.flyfrontier.com/travel/my-trips/check-in/',
  }
  
  for (const [key, url] of Object.entries(checkInLinks)) {
    if (airlineLower.includes(key)) return url
  }
  return null
}

interface BlockCardProps {
  block: Block
  onDelete?: (blockId: string) => void
  onDuplicate?: () => void
  isFirst?: boolean
  isLast?: boolean
  isNextUp?: boolean
}

// Helper to get block icon and color
function getBlockMeta(type: Block['type']) {
  switch (type) {
    case 'flight':
      return { color: 'blue', icon: (
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z" />
        </svg>
      )}
    case 'hotel':
      return { color: 'purple', icon: (
        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M3 21h18M4 21V7a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v14M14 21V10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v11" />
        </svg>
      )}
    case 'layover':
      return { color: 'yellow', icon: (
        <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
        </svg>
      )}
    case 'work':
      return { color: 'orange', icon: (
        <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      )}
    case 'transport':
      return { color: 'green', icon: (
        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M5 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0Zm10 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0Z" />
          <path d="M5 17H3v-5l2-5h9l4 5v5h-2m-7-9 1.5 4.5H9L7.5 8Z" />
        </svg>
      )}
    case 'screenshot':
      return { color: 'indigo', icon: (
        <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
      )}
    case 'note':
      return { color: 'slate', icon: (
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
      )}
    case 'packing':
      return { color: 'emerald', icon: (
        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      )}
    case 'expense':
      return { color: 'amber', icon: (
        <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      )}
    default:
      return { color: 'slate', icon: null }
  }
}

// Helper to get block summary for collapsed view
function getBlockSummary(block: Block): { title: string; subtitle: string } {
  switch (block.type) {
    case 'flight':
      return { 
        title: 'Flight', 
        subtitle: `${block.airline} ${block.flightNumber} · ${block.departureAirport} → ${block.arrivalAirport}` 
      }
    case 'hotel':
      return { title: 'Hotel', subtitle: block.name }
    case 'layover':
      return { title: 'Layover', subtitle: block.location }
    case 'work':
      return { title: 'Work', subtitle: block.siteName }
    case 'transport':
      return { title: 'Transport', subtitle: `${block.transportType} · ${block.pickupLocation}` }
    case 'screenshot':
      return { title: 'Screenshot', subtitle: block.caption || 'Image' }
    case 'note':
      return { title: 'Note', subtitle: block.title || block.text.slice(0, 50) + (block.text.length > 50 ? '...' : '') }
    case 'packing':
      return { title: 'Packing List', subtitle: block.title || 'Packing List' }
    case 'expense':
      return { title: 'Expenses', subtitle: block.title || 'Expense Tracker' }
    default:
      return { title: 'Block', subtitle: '' }
  }
}

export function BlockCard({ 
  block, 
  onDelete, 
  onDuplicate,
  isFirst, 
  isLast,
  isNextUp
}: BlockCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  
  // Persist collapsed state in localStorage
  const storageKey = `block-collapsed-${block.id}`
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(storageKey) === 'true'
    }
    return false
  })

  const handleToggleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed)
    if (typeof window !== 'undefined') {
      if (collapsed) {
        localStorage.setItem(storageKey, 'true')
      } else {
        localStorage.removeItem(storageKey)
      }
    }
  }
  
  const meta = getBlockMeta(block.type)
  const summary = getBlockSummary(block)

  const handleDuplicate = () => {
    duplicateBlock(block.id)
    setShowMenu(false)
    onDuplicate?.()
  }

  const handleDelete = () => {
    onDelete?.(block.id)
    setShowDeleteModal(false)
    setShowMenu(false)
  }

  const renderBlockContent = () => {
    switch (block.type) {
      case 'flight':
        return <FlightCard block={block} />
      case 'hotel':
        return <HotelCard block={block} />
      case 'layover':
        return <LayoverCard block={block} />
      case 'work':
        return <WorkCard block={block} />
      case 'transport':
        return <TransportCard block={block} />
      case 'screenshot':
        return <ScreenshotCard block={block} />
      case 'note':
        return <NoteCard block={block} />
      case 'packing':
        return <PackingCard block={block} />
      case 'expense':
        return <ExpenseCard block={block} />
      default:
        return null
    }
  }

  // Collapsed view - just the header
  if (isCollapsed) {
    return (
      <div className="relative group">
        <div 
          onClick={() => handleToggleCollapse(false)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-slate-700/50 transition-colors"
        >
          <div className={`bg-${meta.color}-600/20 p-1.5 rounded-lg`}>
            {meta.icon}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-white font-medium">{summary.title}</span>
            <span className="text-slate-500 mx-2">·</span>
            <span className="text-slate-400 text-sm truncate">{summary.subtitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="text-slate-500 hover:text-slate-300 p-1 transition-colors"
              title="More options"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="6" r="1" fill="currentColor" />
                <circle cx="12" cy="12" r="1" fill="currentColor" />
                <circle cx="12" cy="18" r="1" fill="currentColor" />
              </svg>
            </button>
          </div>
          
          {showMenu && (
            <div className="absolute right-2 top-12 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden min-w-[120px] z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleCollapse(false)
                  setShowMenu(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Expand
              </button>
              <Link
                href={`/trips/${block.tripId}/edit-block/${block.id}`}
                className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Edit
              </Link>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDuplicate()
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Duplicate
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDeleteModal(true)
                  setShowMenu(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`relative group ${isNextUp ? 'ring-2 ring-green-500/50 rounded-xl' : ''}`}>
      {/* Next Up Indicator */}
      {isNextUp && (
        <div className="absolute -top-2.5 left-4 z-10 bg-green-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          NEXT UP
        </div>
      )}
      
      {/* Control Overlay - Menu only */}
      <div className="absolute top-2 right-2 z-10">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="bg-slate-800/90 hover:bg-slate-700 text-slate-300 p-1.5 rounded backdrop-blur-sm transition-colors"
            title="More options"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="6" r="1" fill="currentColor" />
              <circle cx="12" cy="12" r="1" fill="currentColor" />
              <circle cx="12" cy="18" r="1" fill="currentColor" />
            </svg>
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden min-w-[120px]">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleCollapse(true)
                  setShowMenu(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Minimize
              </button>
              <Link
                href={`/trips/${block.tripId}/edit-block/${block.id}`}
                className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Edit
              </Link>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDuplicate()
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Duplicate
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDeleteModal(true)
                  setShowMenu(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {renderBlockContent()}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div 
            className="bg-slate-800 rounded-xl p-6 w-full max-w-sm shadow-xl border border-slate-700"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-500/20 p-2 rounded-full">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Delete Block</h3>
            </div>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete this <span className="font-semibold text-white">{summary.title.toLowerCase()}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FlightCard({ block }: { block: FlightBlock }) {
  const checkInStatus = getFlightCheckInStatus(block.departureTime)
  const airlineCheckInUrl = getAirlineCheckInLink(block.airline)
  
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      {/* Check-in Alert Banner */}
      {checkInStatus.checkInOpen && (
        <div className="bg-green-600/20 border border-green-500/30 rounded-lg px-4 py-3 mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z" />
            </svg>
            <div>
              <span className="text-green-400 font-semibold text-sm">Check-in is OPEN!</span>
              {checkInStatus.countdown && (
                <span className="text-green-300 text-xs ml-2">• {checkInStatus.countdown}</span>
              )}
            </div>
          </div>
          {airlineCheckInUrl && (
            <a
              href={airlineCheckInUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            >
              Check In →
            </a>
          )}
        </div>
      )}
      
      {/* Check-in Countdown (when opens soon) */}
      {!checkInStatus.checkInOpen && checkInStatus.countdown && (
        <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-lg px-4 py-2 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
          <span className="text-yellow-300 text-sm">{checkInStatus.countdown}</span>
        </div>
      )}
      
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-slate-600/20 p-2 rounded-lg">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold">Flight</h3>
            <p className="text-sm text-slate-400">{block.airline} {block.flightNumber}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <CopyField label="Depart" value={`${block.departureAirport} ${block.departureTime}`} />
          </div>
          <div>
            <CopyField label="Arrive" value={`${block.arrivalAirport} ${block.arrivalTime}`} />
          </div>
        </div>

        {block.confirmationNumber && (
          <CopyField label="Confirmation" value={block.confirmationNumber} />
        )}

        {block.seat && (
          <CopyField label="Seat" value={block.seat} />
        )}

        {(block.terminal || block.gate) && (
          <div className="grid grid-cols-2 gap-4">
            {block.terminal && <CopyField label="Terminal" value={block.terminal} />}
            {block.gate && <CopyField label="Gate" value={block.gate} />}
          </div>
        )}

        {block.notes && (
          <div className="text-sm text-slate-400 mt-3 pt-3 border-t border-slate-700">
            {block.notes}
          </div>
        )}
        
        {/* Deep Links */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-700">
          {airlineCheckInUrl && (
            <a
              href={airlineCheckInUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z" />
              </svg>
              Airline
            </a>
          )}
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(block.airline + ' ' + block.flightNumber + ' flight status')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            Flight Status
          </a>
        </div>
      </div>
    </div>
  )
}

function HotelCard({ block }: { block: HotelBlock }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600/20 p-2 rounded-lg">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 21h18M4 21V7a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v14M14 21V10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v11" />
              <path d="M8 14h.01M8 10h.01M16 14h.01" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold">Hotel</h3>
            <p className="text-sm text-slate-400">{block.name}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <CopyField label="Address" value={block.address} />
        <CopyField label="Phone" value={block.phone} />

        <div className="grid grid-cols-2 gap-4">
          <CopyField label="Check-in" value={formatDate(block.checkInDate)} />
          <CopyField label="Check-out" value={formatDate(block.checkOutDate)} />
        </div>

        {block.confirmationNumber && (
          <CopyField label="Confirmation" value={block.confirmationNumber} />
        )}

        {block.notes && (
          <div className="text-sm text-slate-400 mt-3 pt-3 border-t border-slate-700">
            {block.notes}
          </div>
        )}
        
        {/* Deep Links */}
        {block.address && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-700">
            <a
              href={getGoogleMapsLink(block.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              Maps
            </a>
            <a
              href={getUberDeepLink(block.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0Zm10 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0Z" />
                <path d="M5 17H3v-5l2-5h9l4 5v5h-2m-7-9 1.5 4.5H9L7.5 8Z" />
              </svg>
              Uber
            </a>
            {block.phone && (
              <a
                href={`tel:${block.phone}`}
                className="flex items-center gap-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Call
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function WorkCard({ block }: { block: WorkBlock }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-orange-600/20 p-2 rounded-lg">
            <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="7" width="18" height="13" rx="2" />
              <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold">Work</h3>
            <p className="text-sm text-slate-400">{block.siteName}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <CopyField label="Address" value={block.address} />

        {block.contactName && (
          <CopyField label="Contact" value={block.contactName} />
        )}

        {block.contactPhone && (
          <CopyField label="Phone" value={block.contactPhone} />
        )}

        {block.contactEmail && (
          <CopyField label="Email" value={block.contactEmail} />
        )}

        {block.notes && (
          <div className="text-sm text-slate-400 mt-3 pt-3 border-t border-slate-700">
            {block.notes}
          </div>
        )}
        
        {/* Deep Links */}
        {block.address && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-700">
            <a
              href={getGoogleMapsLink(block.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              Maps
            </a>
            <a
              href={getUberDeepLink(block.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0Zm10 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0Z" />
                <path d="M5 17H3v-5l2-5h9l4 5v5h-2m-7-9 1.5 4.5H9L7.5 8Z" />
              </svg>
              Uber
            </a>
            {block.contactPhone && (
              <a
                href={`tel:${block.contactPhone}`}
                className="flex items-center gap-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Call
              </a>
            )}
            {block.contactEmail && (
              <a
                href={`mailto:${block.contactEmail}`}
                className="flex items-center gap-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                Email
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TransportCard({ block }: { block: TransportBlock }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-green-600/20 p-2 rounded-lg">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0Zm10 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0Z" />
              <path d="M5 17H3v-5l2-5h9l4 5v5h-2m-7-9 1.5 4.5H9L7.5 8Z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold">Transportation</h3>
            <p className="text-sm text-slate-400">{block.transportType}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {block.company && (
          <CopyField label="Company" value={block.company} />
        )}

        <CopyField label="Pickup" value={`${block.pickupLocation} - ${formatDateTime(block.pickupDateTime)}`} />
        <CopyField label="Dropoff" value={`${block.dropoffLocation} - ${formatDateTime(block.dropoffDateTime)}`} />

        {block.confirmationNumber && (
          <CopyField label="Confirmation" value={block.confirmationNumber} />
        )}

        {block.notes && (
          <div className="text-sm text-slate-400 mt-3 pt-3 border-t border-slate-700">
            {block.notes}
          </div>
        )}
        
        {/* Deep Links */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-700">
          {block.pickupLocation && (
            <a
              href={getGoogleMapsLink(block.pickupLocation)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              Pickup
            </a>
          )}
          {block.dropoffLocation && (
            <a
              href={getGoogleMapsLink(block.dropoffLocation)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              Dropoff
            </a>
          )}
          {block.pickupLocation && block.dropoffLocation && (
            <a
              href={getUberDeepLink(block.dropoffLocation)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0Zm10 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0Z" />
                <path d="M5 17H3v-5l2-5h9l4 5v5h-2m-7-9 1.5 4.5H9L7.5 8Z" />
              </svg>
              Uber
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function NoteCard({ block }: { block: NoteBlock }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="flex items-start gap-3 mb-3">
        <div className="bg-slate-600/20 p-2 rounded-lg">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z" />
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
          </svg>
        </div>
        <div className="flex-1">
          {block.title && (
            <h3 className="text-white font-semibold mb-2">{block.title}</h3>
          )}
          <p className="text-slate-300 whitespace-pre-wrap">{block.text}</p>
        </div>
      </div>
    </div>
  )
}

function LayoverCard({ block }: { block: LayoverBlock }) {
  const arrival = new Date(block.arrivalTime)
  const departure = new Date(block.departureTime)
  const durationMs = departure.getTime() - arrival.getTime()
  const hours = Math.floor(durationMs / (1000 * 60 * 60))
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-600/20 p-2 rounded-lg">
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold">Layover</h3>
            <p className="text-sm text-slate-400">{block.location}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <CopyField label="Arrival" value={formatDateTime(block.arrivalTime)} />
          <CopyField label="Departure" value={formatDateTime(block.departureTime)} />
        </div>

        <div className="bg-slate-900/50 rounded-lg p-3">
          <div className="text-xs text-slate-500 mb-1">Duration</div>
          <div className="text-slate-200 font-medium">
            {hours > 0 && `${hours}h `}{minutes}m
          </div>
        </div>

        {block.terminal && (
          <CopyField label="Terminal" value={block.terminal} />
        )}

        {block.notes && (
          <div className="text-sm text-slate-400 mt-3 pt-3 border-t border-slate-700">
            {block.notes}
          </div>
        )}
      </div>
    </div>
  )
}

function ScreenshotCard({ block }: { block: ScreenshotBlock }) {
  const [showExtractedText, setShowExtractedText] = useState(false)

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="bg-indigo-600/20 p-2 rounded-lg">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-2">Screenshot</h3>
          {block.caption && (
            <p className="text-slate-300 text-sm mb-3">{block.caption}</p>
          )}
        </div>
      </div>

      <div className="rounded-lg overflow-hidden bg-slate-900 mb-4">
        <img
          src={block.imageData}
          alt={block.caption || 'Screenshot'}
          className="w-full h-auto"
        />
      </div>

      {block.extractedText && (
        <div className="space-y-2">
          <button
            onClick={() => setShowExtractedText(!showExtractedText)}
            className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {showExtractedText ? (
                <path d="m18 15-6-6-6 6" />
              ) : (
                <path d="m6 9 6 6 6-6" />
              )}
            </svg>
            {showExtractedText ? 'Hide' : 'Show'} extracted text
          </button>

          {showExtractedText && (
            <div className="bg-slate-900/50 rounded-lg p-4">
              <CopyField label="Extracted Text" value={block.extractedText} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PackingCard({ block }: { block: PackingBlock }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600/20 p-2 rounded-lg">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold">Packing List</h3>
            <p className="text-sm text-slate-400">Track what to pack for your trip</p>
          </div>
        </div>
      </div>
      <div className="p-0">
        <PackingList tripId={block.tripId} />
      </div>
    </div>
  )
}

function ExpenseCard({ block }: { block: ExpenseBlock }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="bg-amber-600/20 p-2 rounded-lg">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold">Expense Tracker</h3>
            <p className="text-sm text-slate-400">Track your trip expenses</p>
          </div>
        </div>
      </div>
      <div className="p-0">
        <ExpenseTracker tripId={block.tripId} />
      </div>
    </div>
  )
}

