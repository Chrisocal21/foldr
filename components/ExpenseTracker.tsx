'use client'

import { useState, useEffect } from 'react'
import { Expense, ExpenseCategory } from '@/lib/types'
import { 
  getExpenses, 
  saveExpense, 
  deleteExpense, 
  getExpenseTotal,
  CURRENCIES,
  EXPENSE_CATEGORIES 
} from '@/lib/storage'
import { useSettings } from '@/lib/settings-context'
import { convertCurrency } from '@/lib/travel-apis'

interface ExpenseTrackerProps {
  tripId: string
}

export function ExpenseTracker({ tripId }: ExpenseTrackerProps) {
  const { settings } = useSettings()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)
  const [convertedTotals, setConvertedTotals] = useState<Record<string, number>>({})
  const [isConverting, setIsConverting] = useState(false)
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    currency: settings.defaultCurrency,
    category: 'other' as ExpenseCategory,
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadExpenses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  // Convert currencies when expenses change
  useEffect(() => {
    async function convertTotals() {
      if (Object.keys(totalsByCurrency).length === 0) return
      
      setIsConverting(true)
      const converted: Record<string, number> = {}
      
      for (const [currency, total] of Object.entries(totalsByCurrency)) {
        if (currency === settings.defaultCurrency) {
          converted[currency] = total
        } else {
          const result = await convertCurrency(total, currency, settings.defaultCurrency)
          if (result !== null) {
            converted[currency] = result
          }
        }
      }
      
      setConvertedTotals(converted)
      setIsConverting(false)
    }
    
    convertTotals()
  }, [expenses, settings.defaultCurrency])

  const loadExpenses = () => {
    setExpenses(getExpenses(tripId))
  }

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newExpense.description.trim() || !newExpense.amount) return

    const expense: Expense = {
      id: crypto.randomUUID(),
      tripId,
      description: newExpense.description.trim(),
      amount: parseFloat(newExpense.amount),
      currency: newExpense.currency,
      category: newExpense.category,
      date: newExpense.date,
      createdAt: new Date().toISOString()
    }

    saveExpense(expense)
    setNewExpense({
      description: '',
      amount: '',
      currency: newExpense.currency, // Keep selected currency
      category: 'other',
      date: new Date().toISOString().split('T')[0]
    })
    setShowAddForm(false)
    loadExpenses()
  }

  const handleDelete = (expenseId: string) => {
    deleteExpense(expenseId)
    setShowDeleteModal(null)
    loadExpenses()
  }

  const getCurrencySymbol = (code: string) => {
    return CURRENCIES.find(c => c.code === code)?.symbol || code
  }

  const formatAmount = (amount: number, currency: string) => {
    return `${getCurrencySymbol(currency)}${amount.toFixed(2)}`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Calculate totals by currency
  const totalsByCurrency = expenses.reduce((acc, expense) => {
    if (!acc[expense.currency]) acc[expense.currency] = 0
    acc[expense.currency] += expense.amount
    return acc
  }, {} as Record<string, number>)

  // Group by category for breakdown
  const byCategory = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) acc[expense.category] = 0
    acc[expense.category] += expense.amount
    return acc
  }, {} as Record<ExpenseCategory, number>)

  const getCategoryInfo = (cat: ExpenseCategory) => {
    return EXPENSE_CATEGORIES.find(c => c.value === cat) || { label: cat, icon: '📦' }
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            💰 Expenses
          </h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-xs px-3 py-1.5 bg-white hover:bg-slate-100 text-white rounded-lg transition-colors"
          >
            + Add
          </button>
        </div>

        {/* Totals */}
        {Object.keys(totalsByCurrency).length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
              {Object.entries(totalsByCurrency).map(([currency, total]) => (
                <div key={currency} className="bg-slate-700/50 rounded-lg px-3 py-2">
                  <div className="text-xs text-slate-400">{currency}</div>
                  <div className="text-lg font-bold text-white">
                    {formatAmount(total, currency)}
                  </div>
                  {convertedTotals[currency] && currency !== settings.defaultCurrency && (
                    <div className="text-xs text-slate-400 mt-1">
                      ≈ {formatAmount(convertedTotals[currency], settings.defaultCurrency)}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Grand Total in Default Currency */}
            {Object.keys(convertedTotals).length > 1 && (
              <div className="bg-emerald-600/20 border border-emerald-600/30 rounded-lg px-3 py-2">
                <div className="text-xs text-emerald-400">Total in {settings.defaultCurrency}</div>
                <div className="text-lg font-bold text-white">
                  {isConverting ? (
                    <span className="text-sm text-slate-400">Converting...</span>
                  ) : (
                    formatAmount(
                      Object.values(convertedTotals).reduce((sum, val) => sum + val, 0),
                      settings.defaultCurrency
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleAddExpense} className="p-4 border-b border-slate-700 bg-slate-800/50 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              placeholder="Description..."
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1 flex gap-2">
              <select
                value={newExpense.currency}
                onChange={(e) => setNewExpense({ ...newExpense, currency: e.target.value })}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                placeholder="0.00"
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={newExpense.category}
              onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as ExpenseCategory })}
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
              ))}
            </select>
            <input
              type="date"
              value={newExpense.date}
              onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-white hover:bg-slate-100 text-white rounded-lg text-sm transition-colors"
            >
              Add Expense
            </button>
          </div>
        </form>
      )}

      {/* Category Breakdown */}
      {Object.keys(byCategory).length > 1 && (
        <div className="p-4 border-b border-slate-700">
          <p className="text-xs text-slate-400 mb-2">By Category</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(byCategory).map(([category, total]) => {
              const info = getCategoryInfo(category as ExpenseCategory)
              return (
                <div key={category} className="flex items-center gap-1 text-xs bg-slate-700/50 rounded px-2 py-1">
                  <span>{info.icon}</span>
                  <span className="text-slate-400">{info.label}:</span>
                  <span className="text-white font-medium">${total.toFixed(0)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="max-h-80 overflow-y-auto">
        {expenses.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <p className="mb-2">No expenses yet</p>
            <p className="text-xs">Track your trip spending</p>
          </div>
        ) : (
          expenses.map((expense) => {
            const catInfo = getCategoryInfo(expense.category)
            return (
              <div
                key={expense.id}
                className="px-4 py-3 border-b border-slate-700 last:border-0 hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{catInfo.icon}</span>
                    <div>
                      <p className="text-white text-sm font-medium">{expense.description}</p>
                      <p className="text-xs text-slate-500">
                        {catInfo.label} • {formatDate(expense.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">
                      {formatAmount(expense.amount, expense.currency)}
                    </span>
                    <button
                      onClick={() => setShowDeleteModal(expense.id)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(null)}>
          <div 
            className="bg-slate-800 rounded-xl p-5 w-full max-w-sm shadow-xl border border-slate-700"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-3">Delete Expense?</h3>
            <p className="text-slate-400 text-sm mb-4">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
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

