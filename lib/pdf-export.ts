import jsPDF from 'jspdf'
import { Trip, Block } from './types'

// Helper to format date string correctly (avoiding timezone issues)
function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  // Handle datetime strings like "2025-01-15T00:00:00.000Z"
  const datePart = dateStr.split('T')[0]
  const [year, month, day] = datePart.split('-').map(Number)
  if (!year || !month || !day) {
    return dateStr // Return as-is if can't parse
  }
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString()
}

// Helper to format datetime string correctly (avoiding timezone issues)
function formatDateTime(dateTimeStr: string): string {
  if (!dateTimeStr) return ''
  // For datetime-local values like "2025-01-15T14:30"
  const [datePart, timePart] = dateTimeStr.split('T')
  if (!datePart || !timePart) {
    return dateTimeStr // Return as-is if can't parse
  }
  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes] = timePart.split(':').map(Number)
  const date = new Date(year, month - 1, day, hours, minutes)
  return date.toLocaleString()
}

export function exportTripToPDF(trip: Trip, blocks: Block[]): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const maxWidth = pageWidth - (margin * 2)
  let y = margin

  // Helper function to add text with auto-wrap and new page handling
  const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
    doc.setFontSize(fontSize)
    if (isBold) {
      doc.setFont('helvetica', 'bold')
    } else {
      doc.setFont('helvetica', 'normal')
    }

    const lines = doc.splitTextToSize(text, maxWidth)
    const lineHeight = fontSize * 0.4

    lines.forEach((line: string) => {
      if (y + lineHeight > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage()
        y = margin
      }
      doc.text(line, margin, y)
      y += lineHeight
    })
  }

  const addSpace = (space: number = 5) => {
    y += space
  }

  // Title
  addText(trip.name, 18, true)
  addSpace(3)
  
  // Dates
  addText(`${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`, 12)
  addSpace(10)

  // Blocks
  blocks.forEach((block, index) => {
    if (index > 0) addSpace(8)

    switch (block.type) {
      case 'flight':
        addText('✈ FLIGHT', 12, true)
        addSpace(3)
        addText(`${block.airline} ${block.flightNumber}`)
        addText(`${block.departureAirport} → ${block.arrivalAirport}`)
        addText(`${formatDate(block.date)} | Depart: ${block.departureTime} | Arrive: ${block.arrivalTime}`)
        if (block.confirmationNumber) addText(`Confirmation: ${block.confirmationNumber}`)
        if (block.seat) addText(`Seat: ${block.seat}`)
        if (block.terminal) addText(`Terminal: ${block.terminal}`)
        if (block.gate) addText(`Gate: ${block.gate}`)
        break

      case 'hotel':
        addText('🏨 HOTEL', 12, true)
        addSpace(3)
        addText(block.name, 10, true)
        addText(block.address)
        addText(`Phone: ${block.phone}`)
        addText(`Check-in: ${formatDate(block.checkInDate)}${block.checkInTime ? ` at ${block.checkInTime}` : ''}`)
        addText(`Check-out: ${formatDate(block.checkOutDate)}${block.checkOutTime ? ` at ${block.checkOutTime}` : ''}`)
        if (block.confirmationNumber) addText(`Confirmation: ${block.confirmationNumber}`)
        break

      case 'layover':
        addText('🕐 LAYOVER', 12, true)
        addSpace(3)
        addText(block.location, 10, true)
        addText(`Arrival: ${formatDateTime(block.arrivalTime)}`)
        addText(`Departure: ${formatDateTime(block.departureTime)}`)
        if (block.terminal) addText(`Terminal: ${block.terminal}`)
        break

      case 'transport':
        addText('🚗 TRANSPORT', 12, true)
        addSpace(3)
        addText(`${block.transportType}${block.company ? ` - ${block.company}` : ''}`, 10, true)
        addText(`Pickup: ${block.pickupLocation} at ${formatDateTime(block.pickupDateTime)}`)
        addText(`Dropoff: ${block.dropoffLocation} at ${formatDateTime(block.dropoffDateTime)}`)
        if (block.confirmationNumber) addText(`Confirmation: ${block.confirmationNumber}`)
        break

      case 'work':
        addText('💼 WORK', 12, true)
        addSpace(3)
        addText(block.siteName, 10, true)
        addText(block.address)
        if (block.contactName) addText(`Contact: ${block.contactName}`)
        if (block.contactPhone) addText(`Phone: ${block.contactPhone}`)
        if (block.contactEmail) addText(`Email: ${block.contactEmail}`)
        break

      case 'screenshot':
        addText('📷 SCREENSHOT', 12, true)
        addSpace(3)
        if (block.caption) addText(block.caption)
        if (block.extractedText) {
          addText('Extracted text:', 9, true)
          addText(block.extractedText, 8)
        }
        break

      case 'note':
        addText('📝 NOTE', 12, true)
        addSpace(3)
        if (block.title) addText(block.title, 10, true)
        addText(block.text)
        break
    }

    if ('notes' in block && block.notes) {
      addSpace(2)
      addText(`Notes: ${block.notes}`, 9)
    }
  })

  // Save
  const filename = `${trip.name.replace(/[^a-z0-9]/gi, '_')}_itinerary.pdf`
  doc.save(filename)
}
