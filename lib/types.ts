export type TripStatus = 'upcoming' | 'active' | 'past'

export type BlockType = 'flight' | 'hotel' | 'layover' | 'work' | 'transport' | 'screenshot' | 'note'

export interface Trip {
  id: string
  name: string
  destination?: string // City/place name
  latitude?: number // For maps
  longitude?: number // For maps
  startDate: string // ISO date string
  endDate: string // ISO date string
  color?: string
  favorite?: boolean
  archived?: boolean
  timezone?: string // IANA timezone like 'America/New_York'
  status: TripStatus
  createdAt: string
  updatedAt: string
}

export interface BaseBlock {
  id: string
  tripId: string
  type: BlockType
  date?: string // ISO date string
  createdAt: string
  updatedAt: string
}

export interface FlightBlock extends BaseBlock {
  type: 'flight'
  airline: string
  flightNumber: string
  date: string
  departureTime: string
  departureAirport: string
  arrivalTime: string
  arrivalAirport: string
  confirmationNumber?: string
  seat?: string
  terminal?: string
  gate?: string
  notes?: string
}

export interface HotelBlock extends BaseBlock {
  type: 'hotel'
  name: string
  address: string
  phone: string
  checkInDate: string
  checkInTime?: string
  checkOutDate: string
  checkOutTime?: string
  confirmationNumber?: string
  notes?: string
}

export interface LayoverBlock extends BaseBlock {
  type: 'layover'
  location: string
  arrivalTime: string
  departureTime: string
  terminal?: string
  notes?: string
}

export interface WorkBlock extends BaseBlock {
  type: 'work'
  siteName: string
  address: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  notes?: string
}

export interface TransportBlock extends BaseBlock {
  type: 'transport'
  transportType: string // rental, rideshare, shuttle, etc.
  company?: string
  confirmationNumber?: string
  pickupLocation: string
  pickupDateTime: string
  dropoffLocation: string
  dropoffDateTime: string
  notes?: string
}

export interface ScreenshotBlock extends BaseBlock {
  type: 'screenshot'
  imageData: string // base64 or blob URL
  caption?: string
  extractedText?: string // OCR extracted text
  notes?: string
}

export interface NoteBlock extends BaseBlock {
  type: 'note'
  title?: string
  text: string
}

export type Block = FlightBlock | HotelBlock | LayoverBlock | WorkBlock | TransportBlock | ScreenshotBlock | NoteBlock

export type TodoPriority = 'low' | 'medium' | 'high'
export type TodoStatus = 'todo' | 'in-progress' | 'done'

export interface Todo {
  id: string
  text: string
  completed: boolean
  status?: TodoStatus // 'todo' | 'in-progress' | 'done'
  color?: string // hex color for visual tagging
  tripIds: string[] // empty array means "all trips" / general
  dueDate?: string // ISO date string
  priority?: TodoPriority
  createdAt: string
  updatedAt: string
}
