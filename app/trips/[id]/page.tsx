'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trip, Block, Todo, TodoPriority, TodoStatus, TripCategory } from '@/lib/types'
import { getTripById, getBlocksByTripId, deleteTrip, deleteBlock, saveBlock, saveTrip, TIMEZONES, getTimeAtTimezone, getTimezoneAbbr, getTodos, toggleTodo, deleteTodo, saveTodo, PlaceResult } from '@/lib/storage'
import { BlockCard } from '@/components/BlockCard'
import { exportTripToPDF } from '@/lib/pdf-export'
import FloatingMenu from '@/components/FloatingMenu'
import { TripMap } from '@/components/TripMap'
import { WeatherWidget } from '@/components/WeatherWidget'
import { useSettings } from '@/lib/settings-context'
import { PlaceSearch } from '@/components/PlaceSearch'
import { CountryInfo } from '@/components/CountryInfo'
import { LocalTimeWidget } from '@/components/LocalTimeWidget'
import { AttractionsDiscovery } from '@/components/AttractionsDiscovery'

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { settings } = useSettings()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [tripTodos, setTripTodos] = useState<Todo[]>([])
  const [newTodoText, setNewTodoText] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<TodoPriority | ''>("")
  const [draggedTodo, setDraggedTodo] = useState<string | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showTasksMenu, setShowTasksMenu] = useState(false)
  const [tasksCollapsed, setTasksCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tasks-collapsed') === 'true'
    }
    return false
  })
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDates, setEditingDates] = useState(false)
  const [editingColor, setEditingColor] = useState(false)
  const [editingTimezone, setEditingTimezone] = useState(false)
  const [editingLocation, setEditingLocation] = useState(false)
  const [titleValue, setTitleValue] = useState('')
  const [startDateValue, setStartDateValue] = useState('')
  const [endDateValue, setEndDateValue] = useState('')
  const [locationValue, setLocationValue] = useState('')
  const [currentTemp, setCurrentTemp] = useState<{ temp: number; icon: string } | null>(null)
  const [editingCategory, setEditingCategory] = useState(false)
  const [sunData, setSunData] = useState<{ sunrise: string; sunset: string } | null>(null)

  const handleToggleTasksCollapse = (collapsed: boolean) => {
    setTasksCollapsed(collapsed)
    if (typeof window !== 'undefined') {
      if (collapsed) {
        localStorage.setItem('tasks-collapsed', 'true')
      } else {
        localStorage.removeItem('tasks-collapsed')
      }
    }
  }

  const colors = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Green', value: '#10b981' },
    { name: 'Teal', value: '#14b8a6' },
  ]

  // SVG icons for categories
  const categoryIcons: Record<TripCategory | 'default', React.ReactNode> = {
    vacation: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>,
    business: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
    family: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    solo: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    adventure: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>,
    other: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z"/></svg>,
    default: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.42 0l6.58-6.58a1 1 0 0 0 0-1.42L12 2Z"/><circle cx="7" cy="7" r="1"/></svg>,
  }

  const tripCategories: { value: TripCategory; label: string }[] = [
    { value: 'vacation', label: 'Vacation' },
    { value: 'business', label: 'Business' },
    { value: 'family', label: 'Family' },
    { value: 'solo', label: 'Solo' },
    { value: 'adventure', label: 'Adventure' },
    { value: 'other', label: 'Other' },
  ]

  useEffect(() => {
    loadTripData()
  }, [id])

  // Fetch current temperature and sunrise/sunset
  useEffect(() => {
    if (!trip?.latitude || !trip?.longitude) return
    
    const fetchWeatherData = async () => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?` +
          `latitude=${trip.latitude}&longitude=${trip.longitude}&` +
          `current=temperature_2m,weather_code&` +
          `daily=sunrise,sunset&` +
          `timezone=auto&forecast_days=1`,
          { signal: AbortSignal.timeout(10000) }
        )
        if (!response.ok) return
        const data = await response.json()
        if (data.current) {
          setCurrentTemp({
            temp: Math.round(data.current.temperature_2m),
            icon: getWeatherIcon(data.current.weather_code)
          })
        }
        if (data.daily?.sunrise?.[0] && data.daily?.sunset?.[0]) {
          const formatTime = (isoStr: string) => {
            const date = new Date(isoStr)
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          }
          setSunData({
            sunrise: formatTime(data.daily.sunrise[0]),
            sunset: formatTime(data.daily.sunset[0])
          })
        }
      } catch {
        // Silently fail - weather is not critical
      }
    }
    
    fetchWeatherData()
  }, [trip?.latitude, trip?.longitude])

  // Weather icon helper
  const getWeatherIcon = (code: number): string => {
    if (code === 0) return '☀️'
    if (code <= 2) return '🌤️'
    if (code === 3) return '☁️'
    if (code <= 48) return '🌫️'
    if (code <= 67) return '🌧️'
    if (code <= 77) return '❄️'
    if (code <= 82) return '🌧️'
    if (code <= 86) return '🌨️'
    if (code >= 95) return '⛈️'
    return '🌡️'
  }

  // Format temperature based on settings
  const formatTemp = (celsius: number): string => {
    if (settings.temperatureUnit === 'fahrenheit') {
      return `${Math.round((celsius * 9/5) + 32)}°F`
    }
    return `${Math.round(celsius)}°C`
  }

  // Category change handler
  const handleCategoryChange = (category: TripCategory | undefined) => {
    if (trip) {
      const updatedTrip = { ...trip, category }
      saveTrip(updatedTrip)
      setTrip(updatedTrip)
      setEditingCategory(false)
    }
  }

  // Calculate trip duration in nights
  const getTripDuration = () => {
    if (!trip) return null
    const start = parseLocalDate(trip.startDate)
    const end = parseLocalDate(trip.endDate)
    const nights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return nights === 1 ? '1 night' : `${nights} nights`
  }

  // Calculate timezone difference from home
  const getTimezoneDiff = () => {
    if (!trip?.timezone) return null
    try {
      const now = new Date()
      const localOffset = now.getTimezoneOffset() // in minutes, negative for ahead of UTC
      const destTime = new Date(now.toLocaleString('en-US', { timeZone: trip.timezone }))
      const localTime = new Date(now.toLocaleString('en-US'))
      const diffHours = Math.round((destTime.getTime() - localTime.getTime()) / (1000 * 60 * 60))
      if (diffHours === 0) return 'Same as home'
      return diffHours > 0 ? `+${diffHours}h from home` : `${diffHours}h from home`
    } catch {
      return null
    }
  }

  // Find the next upcoming block (by departure/check-in/pickup time)
  const getNextUpBlockId = (): string | null => {
    const now = new Date()
    let nextBlock: { id: string; time: Date } | null = null

    for (const block of blocks) {
      let blockTime: Date | null = null

      if (block.type === 'flight' && block.departureTime) {
        const [date, time] = block.departureTime.split('T')
        if (date && time) {
          const [y, m, d] = date.split('-').map(Number)
          const [h, min] = time.split(':').map(Number)
          blockTime = new Date(y, m - 1, d, h, min)
        }
      } else if (block.type === 'hotel' && block.checkInDate) {
        const [y, m, d] = block.checkInDate.split('-').map(Number)
        blockTime = new Date(y, m - 1, d, 15, 0) // Assume 3 PM check-in
      } else if (block.type === 'transport' && block.pickupDateTime) {
        const [date, time] = block.pickupDateTime.split('T')
        if (date && time) {
          const [y, m, d] = date.split('-').map(Number)
          const [h, min] = time.split(':').map(Number)
          blockTime = new Date(y, m - 1, d, h, min)
        }
      } else if (block.type === 'layover' && block.departureTime) {
        const [date, time] = block.departureTime.split('T')
        if (date && time) {
          const [y, m, d] = date.split('-').map(Number)
          const [h, min] = time.split(':').map(Number)
          blockTime = new Date(y, m - 1, d, h, min)
        }
      }

      if (blockTime && blockTime > now) {
        if (!nextBlock || blockTime < nextBlock.time) {
          nextBlock = { id: block.id, time: blockTime }
        }
      }
    }

    return nextBlock?.id || null
  }

  const nextUpBlockId = getNextUpBlockId()

  const loadTripData = () => {
    const tripData = getTripById(id)
    if (!tripData) {
      router.push('/trips')
      return
    }
    setTrip(tripData)
    setTitleValue(tripData.name)
    setStartDateValue(tripData.startDate)
    setEndDateValue(tripData.endDate)
    setLocationValue(tripData.destination || '')
    setBlocks(getBlocksByTripId(id))
    setTripTodos(getTodos().filter(t => t.tripIds.includes(id)))
  }

  const handleSaveTitle = () => {
    if (trip && titleValue.trim()) {
      const updatedTrip = { ...trip, name: titleValue.trim() }
      saveTrip(updatedTrip)
      setTrip(updatedTrip)
      setEditingTitle(false)
    }
  }

  const handleSaveDates = () => {
    if (trip && startDateValue && endDateValue) {
      const updatedTrip = { ...trip, startDate: startDateValue, endDate: endDateValue }
      saveTrip(updatedTrip)
      setTrip(updatedTrip)
      setEditingDates(false)
    }
  }

  const handlePlaceSelect = (place: PlaceResult) => {
    if (trip) {
      const updatedTrip = { 
        ...trip, 
        destination: place.displayName,
        latitude: place.latitude,
        longitude: place.longitude
      }
      saveTrip(updatedTrip)
      setTrip(updatedTrip)
      setLocationValue(place.displayName)
      setEditingLocation(false)
    }
  }

  const handleClearLocation = () => {
    if (trip) {
      const updatedTrip = { 
        ...trip, 
        destination: undefined,
        latitude: undefined,
        longitude: undefined
      }
      saveTrip(updatedTrip)
      setTrip(updatedTrip)
      setLocationValue('')
      setEditingLocation(false)
    }
  }

  const handleColorChange = (color: string) => {
    if (trip) {
      const updatedTrip = { ...trip, color }
      saveTrip(updatedTrip)
      setTrip(updatedTrip)
      setEditingColor(false)
    }
  }

  const [showDeleteTripModal, setShowDeleteTripModal] = useState(false)

  const handleDelete = async () => {
    await deleteTrip(id)
    router.push('/trips')
  }

  const handleExportPDF = () => {
    if (trip) {
      exportTripToPDF(trip, blocks)
      setShowMenu(false)
    }
  }

  const handleDeleteBlock = (blockId: string) => {
    deleteBlock(blockId)
    loadTripData()
  }

  // Todo handlers
  const handleToggleTodo = (todoId: string) => {
    toggleTodo(todoId)
    loadTripData()
  }

  const handleDeleteTodo = (todoId: string) => {
    deleteTodo(todoId)
    loadTripData()
  }

  const handleAddTodo = () => {
    if (!newTodoText.trim()) return
    const now = new Date().toISOString()
    const todo: Todo = {
      id: crypto.randomUUID(),
      text: newTodoText.trim(),
      completed: false,
      status: 'todo',
      tripIds: [id],
      dueDate: dueDate || undefined,
      priority: priority || undefined,
      createdAt: now,
      updatedAt: now,
    }
    saveTodo(todo)
    setNewTodoText('')
    setDueDate('')
    setPriority('')
    setShowAdvanced(false)
    loadTripData()
  }

  // Kanban helpers
  const moveToColumn = (todoId: string, newStatus: TodoStatus) => {
    const todo = tripTodos.find(t => t.id === todoId)
    if (!todo) return
    const updatedTodo: Todo = {
      ...todo,
      status: newStatus,
      completed: newStatus === 'done',
      updatedAt: new Date().toISOString(),
    }
    saveTodo(updatedTodo)
    loadTripData()
  }

  const handleDragStart = (todoId: string) => setDraggedTodo(todoId)
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  const handleDrop = (e: React.DragEvent, status: TodoStatus) => {
    e.preventDefault()
    if (draggedTodo) {
      moveToColumn(draggedTodo, status)
      setDraggedTodo(null)
    }
  }

  const formatDueDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (date.getTime() === today.getTime()) return 'Today'
    if (date.getTime() === tomorrow.getTime()) return 'Tmrw'
    if (date < today) return 'Late'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getDueDateColor = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date < today) return 'text-red-400 bg-red-500/20'
    if (date.getTime() === today.getTime()) return 'text-orange-400 bg-orange-500/20'
    return 'text-slate-400 bg-slate-700'
  }

  const getPriorityColor = (p: TodoPriority) => {
    switch (p) {
      case 'high': return 'border-l-red-500'
      case 'medium': return 'border-l-yellow-500'
      case 'low': return 'border-l-green-500'
    }
  }

  const getPriorityDot = (p: TodoPriority) => {
    switch (p) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
    }
  }

  // Group todos by status
  const todosByStatus: Record<TodoStatus, Todo[]> = { 'todo': [], 'in-progress': [], 'done': [] }
  tripTodos.forEach(todo => {
    const status: TodoStatus = todo.status || (todo.completed ? 'done' : 'todo')
    todosByStatus[status].push(todo)
  })

  // Sort by priority then due date
  const sortTodos = (arr: Todo[]) => arr.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    const aPriority = a.priority ? priorityOrder[a.priority] : 3
    const bPriority = b.priority ? priorityOrder[b.priority] : 3
    if (aPriority !== bPriority) return aPriority - bPriority
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
    if (a.dueDate) return -1
    if (b.dueDate) return 1
    return 0
  })

  Object.keys(todosByStatus).forEach(key => {
    todosByStatus[key as TodoStatus] = sortTodos(todosByStatus[key as TodoStatus])
  })

  const todoCount = todosByStatus['todo'].length + todosByStatus['in-progress'].length

  const kanbanColumns: { key: TodoStatus; label: string; icon: string; color: string }[] = [
    { key: 'todo', label: 'To Do', icon: '○', color: 'text-slate-400' },
    { key: 'in-progress', label: 'Doing', icon: '◐', color: 'text-slate-400' },
    { key: 'done', label: 'Done', icon: '●', color: 'text-green-400' },
  ]

  if (!trip) return null

  const parseLocalDate = (dateStr: string) => {
    const datePart = dateStr.split('T')[0]
    const [year, month, day] = datePart.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  const formatDate = (dateStr: string) => {
    // Parse as local date by splitting the string (avoids UTC interpretation)
    // Handle datetime strings like "2025-01-15T00:00:00.000Z"
    const datePart = dateStr.split('T')[0]
    const [year, month, day] = datePart.split('-').map(Number)
    if (!year || !month || !day) {
      return dateStr // Return as-is if can't parse
    }
    const date = new Date(year, month - 1, day) // month is 0-indexed
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Calculate countdown
  const getCountdown = () => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const start = parseLocalDate(trip.startDate)
    start.setHours(0, 0, 0, 0)
    const end = parseLocalDate(trip.endDate)
    end.setHours(0, 0, 0, 0)
    
    if (now < start) {
      const diffTime = start.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return { text: diffDays === 1 ? '1 day away' : `${diffDays} days away`, type: 'upcoming' }
    } else if (now >= start && now <= end) {
      const diffTime = end.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays === 0) return { text: 'Ends today!', type: 'active' }
      return { text: diffDays === 1 ? '1 day left' : `${diffDays} days left`, type: 'active' }
    }
    return null
  }

  const countdown = getCountdown()

  const statusColors = {
    upcoming: 'bg-slate-500',
    active: 'bg-green-500',
    past: 'bg-slate-600'
  }

  const statusLabels = {
    upcoming: 'Upcoming',
    active: 'Active',
    past: 'Past'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Subtle accent glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-slate-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-slate-400/5 rounded-full blur-3xl pointer-events-none" />
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/trips" className="text-slate-300 hover:text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 12H5m7-7-7 7 7 7" />
              </svg>
              Trips
            </Link>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-slate-300 hover:text-white p-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl">
                  <button
                    onClick={handleExportPDF}
                    className="block w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-t-lg"
                  >
                    Export to PDF
                  </button>
                  <Link
                    href={`/trips/${id}/duplicate`}
                    className="block w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700"
                  >
                    Duplicate Trip
                  </Link>
                  <button
                    onClick={() => { setShowDeleteTripModal(true); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2 text-red-400 hover:bg-slate-700 rounded-b-lg"
                  >
                    Delete Trip
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Trip Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-2 mb-4">
            {editingTitle ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  className="text-2xl font-bold text-white bg-slate-800 border border-slate-600 rounded px-3 py-2 w-full"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveTitle} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded transition-colors">
                    Save
                  </button>
                  <button onClick={() => { setEditingTitle(false); setTitleValue(trip.name); }} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <h1
                    className="text-2xl font-bold text-white cursor-pointer hover:text-slate-300 transition-colors"
                    onClick={() => setEditingTitle(true)}
                    title="Tap to edit"
                  >
                    {trip.name}
                  </h1>
                  {editingLocation ? (
                    <div className="mt-2 flex flex-col gap-2">
                      <PlaceSearch
                        value={locationValue}
                        onChange={setLocationValue}
                        onPlaceSelect={handlePlaceSelect}
                        placeholder="Search for a destination..."
                        className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm w-full"
                      />
                      <div className="flex gap-2">
                        {trip.destination && (
                          <button 
                            onClick={handleClearLocation} 
                            className="px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded text-sm transition-colors"
                          >
                            Remove
                          </button>
                        )}
                        <button 
                          onClick={() => { setEditingLocation(false); setLocationValue(trip.destination || ''); }} 
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p 
                      className="flex items-center gap-1 text-slate-400 text-sm mt-1 cursor-pointer hover:text-slate-300 transition-colors"
                      onClick={() => setEditingLocation(true)}
                      title="Tap to edit location"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {trip.destination || 'Add destination'}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {countdown && (
                    <span className={`text-xs px-3 py-1 rounded font-medium ${countdown.type === 'active' ? 'bg-green-600/20 text-green-400' : 'bg-slate-600/20 text-slate-400'}`}>
                      <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                      {countdown.text}
                    </span>
                  )}
                  <span className={`text-xs px-3 py-1 rounded ${statusColors[trip.status]} text-white font-medium`}>
                    {statusLabels[trip.status]}
                  </span>
                </div>
              </div>
            )}
          </div>
          {editingDates ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDateValue}
                  onChange={(e) => setStartDateValue(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
                />
                <span className="text-slate-400">–</span>
                <input
                  type="date"
                  value={endDateValue}
                  onChange={(e) => setEndDateValue(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveDates} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded transition-colors">
                  Save
                </button>
                <button onClick={() => { setEditingDates(false); setStartDateValue(trip.startDate); setEndDateValue(trip.endDate); }} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 text-slate-300 cursor-pointer hover:text-white transition-colors"
              onClick={() => setEditingDates(true)}
              title="Tap to edit"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              <span>{formatDate(trip.startDate)} – {formatDate(trip.endDate)}</span>
            </div>
          )}

          {/* Color Picker */}
          <div className="mt-4">
            {editingColor ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">Trip Color:</span>
                  <div className="flex gap-2 flex-wrap">
                    {colors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => handleColorChange(color.value)}
                        className={`w-8 h-8 rounded-lg transition-all ${
                          trip.color === color.value
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setEditingColor(false)}
                  className="text-sm text-slate-500 hover:text-slate-300 self-start"
                >
                  Done
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingColor(true)}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <div 
                  className="w-5 h-5 rounded-full border-2 border-slate-600"
                  style={{ backgroundColor: trip.color || '#3b82f6' }}
                />
                <span className="text-sm">Change color</span>
              </button>
            )}
          </div>

          {/* Timezone Selector */}
          <div className="mt-3 flex flex-wrap items-center gap-4">
            {editingTimezone ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">Destination timezone:</span>
                  <select
                    value={trip.timezone || ''}
                    onChange={(e) => {
                      const updated = { ...trip, timezone: e.target.value || undefined };
                      saveTrip(updated);
                      setTrip(updated);
                    }}
                    className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  >
                    <option value="">Not set</option>
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setEditingTimezone(false)}
                  className="text-sm text-slate-500 hover:text-slate-300 self-start"
                >
                  Done
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingTimezone(true)}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <span className="text-sm">
                  {trip.timezone ? `${getTimezoneAbbr(trip.timezone)} • ${getTimeAtTimezone(trip.timezone)}` : 'Set destination timezone'}
                </span>
              </button>
            )}
            
            {/* Current Temperature */}
            {currentTemp && (
              <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/50 px-3 py-1.5 rounded-lg">
                <span className="text-lg">{currentTemp.icon}</span>
                <span className="text-sm font-medium">{formatTemp(currentTemp.temp)}</span>
                <span className="text-xs text-slate-500">now</span>
              </div>
            )}

            {/* Local Time Widget */}
            {trip.timezone && (
              <LocalTimeWidget 
                timezone={trip.timezone} 
                className="text-slate-300 bg-slate-800/50 px-3 py-1.5 rounded-lg"
              />
            )}
          </div>

          {/* Country Info */}
          {trip.destination && (
            <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <CountryInfo destination={trip.destination} showDetailed={false} />
            </div>
          )}

          {/* Trip Info Row: Category, Duration, Timezone Diff, Sunrise/Sunset */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {/* Category Badge */}
            {editingCategory ? (
              <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-2 flex-wrap">
                {tripCategories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => {
                      handleCategoryChange(cat.value as TripCategory);
                      setEditingCategory(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                      trip.category === cat.value
                        ? 'bg-white text-slate-900'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {categoryIcons[cat.value]}
                    {cat.label}
                  </button>
                ))}
                <button
                  onClick={() => {
                    handleCategoryChange(undefined);
                    setEditingCategory(false);
                  }}
                  className="p-1.5 text-slate-500 hover:text-slate-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingCategory(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  trip.category
                    ? 'bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                    : 'bg-slate-800/50 text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
              >
                {categoryIcons[trip.category || 'default']}
                <span>{tripCategories.find(c => c.value === trip.category)?.label || 'Add category'}</span>
              </button>
            )}

            {/* Trip Duration */}
            {getTripDuration() && (
              <div className="flex items-center gap-1.5 text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                </svg>
                <span>{getTripDuration()}</span>
              </div>
            )}

            {/* Timezone Difference */}
            {getTimezoneDiff() && (
              <div className="flex items-center gap-1.5 text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
                <span>{getTimezoneDiff()}</span>
              </div>
            )}

            {/* Sunrise/Sunset */}
            {sunData && (
              <div className="flex items-center gap-3 text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg text-sm">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                    <circle cx="12" cy="12" r="4"/>
                    <path d="M12 16v4"/>
                  </svg>
                  <span>{sunData.sunrise}</span>
                </span>
                <span className="text-slate-600">·</span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 10V2M4.93 10.93l1.41 1.41M2 18h2M20 18h2M19.07 10.93l-1.41 1.41"/>
                    <path d="M22 18H2"/>
                    <path d="M8 18a4 4 0 1 1 8 0"/>
                  </svg>
                  <span>{sunData.sunset}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Add Block Button */}
        <Link
          href={`/trips/${id}/add-block`}
          className="block w-full bg-white hover:bg-slate-100 text-slate-900 text-center py-3 rounded-lg font-medium mb-4 transition-colors"
        >
          + Add Block
        </Link>

        {/* Trip Tasks - Kanban Board */}
        {tripTodos.length > 0 && (
        <div className="relative group mb-4">
          {tasksCollapsed ? (
            /* Collapsed View */
            <div 
              onClick={() => handleToggleTasksCollapse(false)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-slate-700/50 transition-colors"
            >
              <div className="bg-slate-600/20 p-1.5 rounded-lg">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="18" rx="1" />
                  <rect x="14" y="3" width="7" height="12" rx="1" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-white font-medium">Task Board</span>
                <span className="text-slate-500 mx-2">·</span>
                <span className="text-slate-400 text-sm">
                  {todoCount} active{todosByStatus['done'].length > 0 && `, ${todosByStatus['done'].length} done`}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowTasksMenu(!showTasksMenu)
                }}
                className="text-slate-500 hover:text-slate-300 p-1 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="6" r="1" fill="currentColor" />
                  <circle cx="12" cy="12" r="1" fill="currentColor" />
                  <circle cx="12" cy="18" r="1" fill="currentColor" />
                </svg>
              </button>
              
              {showTasksMenu && (
                <div className="absolute right-2 top-12 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden min-w-[120px] z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleTasksCollapse(false)
                      setShowTasksMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    Expand
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Expanded Kanban View */
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-600/20 p-1.5 rounded-lg">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="7" height="18" rx="1" />
                      <rect x="14" y="3" width="7" height="12" rx="1" />
                    </svg>
                  </div>
                  <span className="text-white font-medium">Task Board</span>
                  {todoCount > 0 && (
                    <span className="text-xs bg-slate-600/20 text-slate-400 px-2 py-0.5 rounded-full">
                      {todoCount} active
                    </span>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowTasksMenu(!showTasksMenu)}
                    className="text-slate-500 hover:text-slate-300 p-1 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="6" r="1" fill="currentColor" />
                      <circle cx="12" cy="12" r="1" fill="currentColor" />
                      <circle cx="12" cy="18" r="1" fill="currentColor" />
                    </svg>
                  </button>
                  
                  {showTasksMenu && (
                    <div className="absolute right-0 top-8 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden min-w-[120px] z-20">
                      <button
                        onClick={() => {
                          handleToggleTasksCollapse(true)
                          setShowTasksMenu(false)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                      >
                        Minimize
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Add Todo Section */}
              <div className="p-3 border-b border-slate-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTodoText}
                    onChange={(e) => setNewTodoText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                    placeholder="Add a task..."
                    className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-slate-400"
                  />
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`px-3 py-2 rounded-lg border transition-colors ${(dueDate || priority) ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-900 border-slate-600 text-slate-400 hover:text-white'}`}
                    title="Due date & Priority"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                  </button>
                  <button
                    onClick={handleAddTodo}
                    disabled={!newTodoText.trim()}
                    className="bg-white hover:bg-slate-100 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 px-3 py-2 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 5v14m-7-7h14" />
                    </svg>
                  </button>
                </div>
                
                {/* Advanced Options (Due Date & Priority) */}
                {showAdvanced && (
                  <div className="flex flex-wrap gap-2 mt-2 p-2 bg-slate-900 rounded-lg border border-slate-700">
                    <div className="w-full flex gap-2">
                      <div className="flex-1">
                        <label className="text-slate-500 text-xs block mb-1">Due Date</label>
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-slate-400"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-slate-500 text-xs block mb-1">Priority</label>
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value as TodoPriority | '')}
                          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-slate-400"
                        >
                          <option value="">None</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Kanban Columns */}
              <div className="p-3 overflow-x-auto">
                <div className="flex gap-3 min-h-[180px]">
                  {kanbanColumns.map(col => (
                    <div
                      key={col.key}
                      className="flex-1 min-w-[120px] flex flex-col"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, col.key)}
                    >
                      {/* Column Header */}
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700">
                        <span className={col.color}>{col.icon}</span>
                        <span className="text-xs font-medium text-slate-300">{col.label}</span>
                        <span className="text-xs text-slate-500">({todosByStatus[col.key].length})</span>
                      </div>

                      {/* Column Content */}
                      <div className={`flex-1 space-y-2 overflow-y-auto min-h-[100px] p-1 rounded-lg transition-colors ${
                        draggedTodo ? 'bg-slate-900/50 border border-dashed border-slate-600' : ''
                      }`}>
                        {todosByStatus[col.key].length === 0 ? (
                          <div className="text-center py-4 text-slate-600 text-xs">
                            {col.key === 'todo' ? 'No tasks' : col.key === 'in-progress' ? 'Drag here' : 'Completed'}
                          </div>
                        ) : (
                          todosByStatus[col.key].map(todo => (
                            <div
                              key={todo.id}
                              draggable
                              onDragStart={() => handleDragStart(todo.id)}
                              className={`group bg-slate-900 rounded-lg p-2 border-l-2 cursor-grab active:cursor-grabbing transition-all hover:bg-slate-800 ${
                                todo.priority ? getPriorityColor(todo.priority) : 'border-l-slate-600'
                              } ${draggedTodo === todo.id ? 'opacity-50' : ''}`}
                            >
                              <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs leading-tight ${todo.status === 'done' ? 'text-slate-500 line-through' : 'text-white'}`}>
                                    {todo.text}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-1 mt-1">
                                    {todo.priority && (
                                      <span className={`w-1.5 h-1.5 rounded-full ${getPriorityDot(todo.priority)}`} />
                                    )}
                                    {todo.dueDate && (
                                      <span className={`text-[10px] px-1 rounded ${getDueDateColor(todo.dueDate)}`}>
                                        {formatDueDate(todo.dueDate)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDeleteTodo(todo.id)}
                                  className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-2 bg-slate-900 border-t border-slate-700 text-xs text-slate-500 flex justify-between">
                <span>Drag tasks between columns</span>
                <span>{tripTodos.length} total</span>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Timeline */}
        {blocks.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M12 6v6l4 2" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            <p className="text-slate-400 text-lg">No blocks yet</p>
            <p className="text-slate-500 text-sm mt-2">Add flights, hotels, and more to build your itinerary</p>
          </div>
        ) : (
          <div className="space-y-4">
            {blocks.map((block, index) => (
              <BlockCard 
                key={block.id}
                block={block}
                onDelete={handleDeleteBlock}
                onDuplicate={loadTripData}
                isFirst={index === 0}
                isLast={index === blocks.length - 1}
                isNextUp={block.id === nextUpBlockId}
              />
            ))}
          </div>
        )}

        {/* Map, Weather, Packing List, Expenses Section */}
        <div className="mt-8 space-y-6 pb-24">
          {/* Map & Weather Row */}
          {trip.latitude && trip.longitude && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Map */}
              <div>
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Destination
                </h2>
                <TripMap 
                  latitude={trip.latitude} 
                  longitude={trip.longitude} 
                  destination={trip.destination}
                  blocks={blocks}
                  className="h-48 md:h-52"
                />
              </div>
              
              {/* Weather */}
              <div>
                <WeatherWidget 
                  latitude={trip.latitude} 
                  longitude={trip.longitude} 
                  destination={trip.destination}
                />
              </div>
            </div>
          )}

          {/* Attractions Discovery */}
          {trip.latitude && trip.longitude && (
            <AttractionsDiscovery 
              lat={trip.latitude}
              lon={trip.longitude}
              tripName={trip.name}
              className="mt-6"
            />
          )}

        </div>
      </main>

      {/* Delete Trip Modal */}
      {showDeleteTripModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteTripModal(false)}>
          <div 
            className="bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl border border-slate-700"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-500/20 p-2 rounded-full">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Delete Trip</h3>
            </div>
            <p className="text-slate-300 mb-2">
              Are you sure you want to delete <span className="font-semibold text-white">{trip.name}</span>?
            </p>
            <p className="text-slate-500 text-sm mb-6">
              This will also delete all {blocks.length} block{blocks.length !== 1 ? 's' : ''} associated with this trip. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteTripModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete Trip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Menu */}
      <FloatingMenu tripId={id} tripName={trip.name} />
    </div>
  )
}