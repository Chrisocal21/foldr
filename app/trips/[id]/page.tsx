'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trip, Block, Todo } from '@/lib/types'
import { getTripById, getBlocksByTripId, deleteTrip, deleteBlock, saveBlock, saveTrip, TIMEZONES, getTimeAtTimezone, getTimezoneAbbr, getTodos, toggleTodo, deleteTodo, saveTodo } from '@/lib/storage'
import { BlockCard } from '@/components/BlockCard'
import { exportTripToPDF } from '@/lib/pdf-export'
import FloatingMenu from '@/components/FloatingMenu'
import { TripMap } from '@/components/TripMap'
import { WeatherWidget } from '@/components/WeatherWidget'
import { useSettings } from '@/lib/settings-context'

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { settings } = useSettings()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [tripTodos, setTripTodos] = useState<Todo[]>([])
  const [newTodoText, setNewTodoText] = useState('')
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
  const [titleValue, setTitleValue] = useState('')
  const [startDateValue, setStartDateValue] = useState('')
  const [endDateValue, setEndDateValue] = useState('')
  const [currentTemp, setCurrentTemp] = useState<{ temp: number; icon: string } | null>(null)

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

  useEffect(() => {
    loadTripData()
  }, [id])

  // Fetch current temperature
  useEffect(() => {
    if (!trip?.latitude || !trip?.longitude) return
    
    const fetchCurrentTemp = async () => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?` +
          `latitude=${trip.latitude}&longitude=${trip.longitude}&` +
          `current=temperature_2m,weather_code&` +
          `timezone=auto`,
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
      } catch {
        // Silently fail - weather is not critical
      }
    }
    
    fetchCurrentTemp()
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
      tripIds: [id],
      createdAt: now,
      updatedAt: now,
    }
    saveTodo(todo)
    setNewTodoText('')
    loadTripData()
  }

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
    upcoming: 'bg-blue-500',
    active: 'bg-green-500',
    past: 'bg-slate-600'
  }

  const statusLabels = {
    upcoming: 'Upcoming',
    active: 'Active',
    past: 'Past'
  }

  return (
    <div className="min-h-screen bg-slate-950">
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
                    className="text-2xl font-bold text-white cursor-pointer hover:text-blue-400 transition-colors"
                    onClick={() => setEditingTitle(true)}
                    title="Tap to edit"
                  >
                    {trip.name}
                  </h1>
                  {trip.destination && (
                    <p className="flex items-center gap-1 text-slate-400 text-sm mt-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {trip.destination}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {countdown && (
                    <span className={`text-xs px-3 py-1 rounded font-medium ${countdown.type === 'active' ? 'bg-green-600/20 text-green-400' : 'bg-blue-600/20 text-blue-400'}`}>
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
              className="flex items-center gap-2 text-slate-300 cursor-pointer hover:text-blue-400 transition-colors"
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
          </div>
        </div>

        {/* Add Block Button */}
        <Link
          href={`/trips/${id}/add-block`}
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-medium mb-4 transition-colors"
        >
          + Add Block
        </Link>

        {/* Trip Tasks - Block Card Style */}
        <div className="relative group mb-4">
          {tasksCollapsed ? (
            /* Collapsed View */
            <div 
              onClick={() => handleToggleTasksCollapse(false)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-slate-700/50 transition-colors"
            >
              <div className="bg-green-600/20 p-1.5 rounded-lg">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4" />
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-white font-medium">Tasks</span>
                <span className="text-slate-500 mx-2">·</span>
                <span className="text-slate-400 text-sm">
                  {tripTodos.filter(t => !t.completed).length} pending
                  {tripTodos.filter(t => t.completed).length > 0 && `, ${tripTodos.filter(t => t.completed).length} done`}
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
            /* Expanded View */
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="bg-green-600/20 p-1.5 rounded-lg">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4" />
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                    </svg>
                  </div>
                  <span className="text-white font-medium">Tasks</span>
                  {tripTodos.filter(t => !t.completed).length > 0 && (
                    <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full">
                      {tripTodos.filter(t => !t.completed).length}
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
              
              {/* Content */}
              <div className="p-4">
                {/* Add Todo Input */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newTodoText}
                    onChange={(e) => setNewTodoText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                    placeholder="Add a task..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-green-500"
                  />
                  <button
                    onClick={handleAddTodo}
                    disabled={!newTodoText.trim()}
                    className="bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-3 py-2 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 5v14m-7-7h14" />
                    </svg>
                  </button>
                </div>

                {/* Todo List */}
                {tripTodos.length === 0 ? (
                  <div className="text-center py-6 text-slate-500">
                    <p className="text-sm">No tasks yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Incomplete todos */}
                    {tripTodos.filter(t => !t.completed).map(todo => (
                      <div key={todo.id} className="flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-2 border border-slate-700 group">
                        <button 
                          onClick={() => handleToggleTodo(todo.id)} 
                          className="text-slate-400 hover:text-green-400 transition-colors shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                        </button>
                        <span className="flex-1 text-white text-sm">{todo.text}</span>
                        <button 
                          onClick={() => handleDeleteTodo(todo.id)} 
                          className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    
                    {/* Completed todos */}
                    {tripTodos.filter(t => t.completed).length > 0 && (
                      <>
                        <div className="text-xs text-slate-500 uppercase tracking-wide pt-2 pb-1">Completed</div>
                        {tripTodos.filter(t => t.completed).map(todo => (
                          <div key={todo.id} className="flex items-center gap-2 bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-700/50 group">
                            <button 
                              onClick={() => handleToggleTodo(todo.id)} 
                              className="text-green-500 shrink-0"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M9 12l2 2 4-4" />
                                <circle cx="12" cy="12" r="10" />
                              </svg>
                            </button>
                            <span className="flex-1 text-slate-500 text-sm line-through">{todo.text}</span>
                            <button 
                              onClick={() => handleDeleteTodo(todo.id)} 
                              className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Destination
                </h2>
                <TripMap 
                  latitude={trip.latitude} 
                  longitude={trip.longitude} 
                  destination={trip.destination}
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