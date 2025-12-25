'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trip, Block, Todo } from '@/lib/types'
import { getTripById, getBlocksByTripId, deleteTrip, deleteBlock, saveBlock, saveTrip, getTodos, toggleTodo, deleteTodo } from '@/lib/storage'
import { BlockCard } from '@/components/BlockCard'
import { exportTripToPDF } from '@/lib/pdf-export'

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [showMenu, setShowMenu] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDates, setEditingDates] = useState(false)
  const [titleValue, setTitleValue] = useState('')
  const [startDateValue, setStartDateValue] = useState('')
  const [endDateValue, setEndDateValue] = useState('')
  const [todos, setTodos] = useState<Todo[]>([])

  useEffect(() => {
    loadTripData()
  }, [id])

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
    // Load todos tagged to this trip
    setTodos(getTodos().filter(t => t.tripIds.includes(id)))
  }

  const handleToggleTripTodo = (todoId: string) => {
    toggleTodo(todoId)
    setTodos(getTodos().filter(t => t.tripIds.includes(id)))
  }

  const handleDeleteTripTodo = (todoId: string) => {
    deleteTodo(todoId)
    setTodos(getTodos().filter(t => t.tripIds.includes(id)))
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

  const handleDelete = () => {
    if (confirm('Delete this trip and all its blocks?')) {
      deleteTrip(id)
      router.push('/trips')
    }
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

  if (!trip) return null

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

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
                    onClick={handleDelete}
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
                <h1
                  className="text-2xl font-bold text-white cursor-pointer hover:text-blue-400 transition-colors flex-1"
                  onClick={() => setEditingTitle(true)}
                  title="Tap to edit"
                >
                  {trip.name}
                </h1>
                <span className={`text-xs px-3 py-1 rounded ${statusColors[trip.status]} text-white font-medium shrink-0`}>
                  {statusLabels[trip.status]}
                </span>
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
        </div>

        {/* Add Block Button */}
        <Link
          href={`/trips/${id}/add-block`}
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-medium mb-8 transition-colors"
        >
          + Add Block
        </Link>

        {/* To-Dos for this trip */}
        {todos.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4" />
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
              To Do
            </h2>
            <ul className="space-y-2">
              {todos.filter(t => !t.completed).map(todo => (
                <li key={todo.id} className="flex items-center gap-3 bg-slate-800 rounded-lg px-4 py-3 border border-slate-700">
                  <button onClick={() => handleToggleTripTodo(todo.id)} className="text-slate-400 hover:text-green-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  </button>
                  <span className="flex-1 text-white">{todo.text}</span>
                  <button onClick={() => handleDeleteTripTodo(todo.id)} className="text-slate-500 hover:text-red-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
              {todos.filter(t => t.completed).map(todo => (
                <li key={todo.id} className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-4 py-3 border border-slate-700/50 opacity-60">
                  <button onClick={() => handleToggleTripTodo(todo.id)} className="text-green-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  </button>
                  <span className="flex-1 text-slate-400 line-through">{todo.text}</span>
                  <button onClick={() => handleDeleteTripTodo(todo.id)} className="text-slate-500 hover:text-red-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
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
                isFirst={index === 0}
                isLast={index === blocks.length - 1}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}