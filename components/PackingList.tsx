'use client'

import { useState, useEffect } from 'react'
import { PackingItem, PackingCategory } from '@/lib/types'
import { 
  getPackingItems, 
  savePackingItem, 
  deletePackingItem, 
  togglePackingItem, 
  addPackingTemplate,
  PACKING_TEMPLATES 
} from '@/lib/storage'

interface PackingListProps {
  tripId: string
}

const CATEGORY_INFO: Record<PackingCategory, { label: string; icon: string }> = {
  clothing: { label: 'Clothing', icon: '👕' },
  toiletries: { label: 'Toiletries', icon: '🧴' },
  electronics: { label: 'Electronics', icon: '🔌' },
  documents: { label: 'Documents', icon: '📄' },
  accessories: { label: 'Accessories', icon: '👜' },
  other: { label: 'Other', icon: '📦' },
}

export function PackingList({ tripId }: PackingListProps) {
  const [items, setItems] = useState<PackingItem[]>([])
  const [newItemName, setNewItemName] = useState('')
  const [newItemCategory, setNewItemCategory] = useState<PackingCategory>('clothing')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [filter, setFilter] = useState<'all' | 'packed' | 'unpacked'>('all')

  useEffect(() => {
    loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  const loadItems = () => {
    setItems(getPackingItems(tripId))
  }

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemName.trim()) return

    const item: PackingItem = {
      id: crypto.randomUUID(),
      tripId,
      name: newItemName.trim(),
      category: newItemCategory,
      packed: false,
      createdAt: new Date().toISOString()
    }

    savePackingItem(item)
    setNewItemName('')
    setShowAddForm(false)
    loadItems()
  }

  const handleToggle = (itemId: string) => {
    togglePackingItem(itemId)
    loadItems()
  }

  const handleDelete = (itemId: string) => {
    deletePackingItem(itemId)
    loadItems()
  }

  const handleAddTemplate = (templateIndex: number) => {
    const template = PACKING_TEMPLATES[templateIndex]
    addPackingTemplate(tripId, template.items)
    setShowTemplates(false)
    loadItems()
  }

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<PackingCategory, PackingItem[]>)

  // Filter items
  const filteredGrouped = Object.entries(groupedItems).reduce((acc, [category, categoryItems]) => {
    const filtered = categoryItems.filter(item => {
      if (filter === 'packed') return item.packed
      if (filter === 'unpacked') return !item.packed
      return true
    })
    if (filtered.length > 0) {
      acc[category as PackingCategory] = filtered
    }
    return acc
  }, {} as Record<PackingCategory, PackingItem[]>)

  const packedCount = items.filter(i => i.packed).length
  const totalCount = items.length
  const progress = totalCount > 0 ? (packedCount / totalCount) * 100 : 0

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            🎒 Packing List
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
            >
              + Template
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              + Item
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {totalCount > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>{packedCount} of {totalCount} packed</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        {totalCount > 0 && (
          <div className="flex gap-2">
            {(['all', 'unpacked', 'packed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:text-slate-300'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Templates Dropdown */}
      {showTemplates && (
        <div className="p-4 border-b border-slate-700 bg-slate-800/50">
          <p className="text-xs text-slate-400 mb-2">Add items from a template:</p>
          <div className="flex flex-wrap gap-2">
            {PACKING_TEMPLATES.map((template, index) => (
              <button
                key={template.name}
                onClick={() => handleAddTemplate(index)}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors"
              >
                {template.icon} {template.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add Item Form */}
      {showAddForm && (
        <form onSubmit={handleAddItem} className="p-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex gap-2">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Item name..."
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value as PackingCategory)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(CATEGORY_INFO).map(([key, { label, icon }]) => (
                <option key={key} value={key}>{icon} {label}</option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              Add
            </button>
          </div>
        </form>
      )}

      {/* Items List */}
      <div className="max-h-96 overflow-y-auto">
        {items.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <p className="mb-2">No items yet</p>
            <p className="text-xs">Add items or use a template to get started</p>
          </div>
        ) : Object.keys(filteredGrouped).length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <p>No {filter} items</p>
          </div>
        ) : (
          Object.entries(filteredGrouped).map(([category, categoryItems]) => (
            <div key={category} className="border-b border-slate-700 last:border-0">
              <div className="px-4 py-2 bg-slate-800/30 flex items-center gap-2">
                <span>{CATEGORY_INFO[category as PackingCategory].icon}</span>
                <span className="text-sm font-medium text-slate-300">
                  {CATEGORY_INFO[category as PackingCategory].label}
                </span>
                <span className="text-xs text-slate-500">
                  ({categoryItems.filter(i => i.packed).length}/{categoryItems.length})
                </span>
              </div>
              {categoryItems.map((item) => (
                <div
                  key={item.id}
                  className={`px-4 py-2 flex items-center gap-3 hover:bg-slate-700/30 transition-colors ${
                    item.packed ? 'opacity-60' : ''
                  }`}
                >
                  <button
                    onClick={() => handleToggle(item.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      item.packed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-slate-500 hover:border-green-500'
                    }`}
                  >
                    {item.packed && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <span className={`flex-1 text-sm ${item.packed ? 'text-slate-500 line-through' : 'text-white'}`}>
                    {item.name}
                    {item.quantity && item.quantity > 1 && (
                      <span className="text-slate-500 ml-1">×{item.quantity}</span>
                    )}
                  </span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
