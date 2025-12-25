import { useState } from 'react'
import { Block, FlightBlock, HotelBlock, WorkBlock, TransportBlock, NoteBlock, LayoverBlock, ScreenshotBlock } from '@/lib/types'
import { CopyField } from './CopyField'
import Link from 'next/link'

interface BlockCardProps {
  block: Block
  onDelete?: (blockId: string) => void
  isFirst?: boolean
  isLast?: boolean
}

export function BlockCard({ 
  block, 
  onDelete, 
  isFirst, 
  isLast
}: BlockCardProps) {
  const [showMenu, setShowMenu] = useState(false)

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
      default:
        return null
    }
  }

  return (
    <div className="relative group">
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
              <Link
                href={`/trips/${block.tripId}/edit-block/${block.id}`}
                className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Edit
              </Link>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm('Are you sure you want to delete this block?')) {
                    onDelete?.(block.id)
                  }
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
    </div>
  )
}

function FlightCard({ block }: { block: FlightBlock }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600/20 p-2 rounded-lg">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
          <CopyField label="Check-in" value={new Date(block.checkInDate).toLocaleDateString()} />
          <CopyField label="Check-out" value={new Date(block.checkOutDate).toLocaleDateString()} />
        </div>

        {block.confirmationNumber && (
          <CopyField label="Confirmation" value={block.confirmationNumber} />
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

        <CopyField label="Pickup" value={`${block.pickupLocation} - ${new Date(block.pickupDateTime).toLocaleString()}`} />
        <CopyField label="Dropoff" value={`${block.dropoffLocation} - ${new Date(block.dropoffDateTime).toLocaleString()}`} />

        {block.confirmationNumber && (
          <CopyField label="Confirmation" value={block.confirmationNumber} />
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
          <CopyField label="Arrival" value={arrival.toLocaleString()} />
          <CopyField label="Departure" value={departure.toLocaleString()} />
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
