'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type TemperatureUnit = 'celsius' | 'fahrenheit'
export type DistanceUnit = 'miles' | 'kilometers'
export type DateFormat = 'mdy' | 'dmy' | 'ymd'
export type TimeFormat = '12h' | '24h'
export type FirstDayOfWeek = 'sunday' | 'monday'
export type TripSortOrder = 'date' | 'name' | 'favorites'

export interface AppSettings {
  // Units & Format
  temperatureUnit: TemperatureUnit
  distanceUnit: DistanceUnit
  dateFormat: DateFormat
  timeFormat: TimeFormat
  defaultCurrency: string
  
  // Calendar & Display
  firstDayOfWeek: FirstDayOfWeek
  weatherForecastDays: 3 | 5 | 7
  mapDefaultZoom: number
  compactMode: boolean
  showTripCountdown: boolean
  tripSortOrder: TripSortOrder
  
  // Trip Defaults
  defaultTripDuration: number
  autoArchiveDays: number // 0 = disabled
  defaultAirline: string
  defaultHotelChain: string
  homeAirport: string
}

const DEFAULT_SETTINGS: AppSettings = {
  temperatureUnit: 'fahrenheit',
  distanceUnit: 'miles',
  dateFormat: 'mdy',
  timeFormat: '12h',
  defaultCurrency: 'USD',
  firstDayOfWeek: 'sunday',
  weatherForecastDays: 5,
  mapDefaultZoom: 12,
  compactMode: false,
  showTripCountdown: true,
  tripSortOrder: 'date',
  defaultTripDuration: 7,
  autoArchiveDays: 0,
  defaultAirline: '',
  defaultHotelChain: '',
  homeAirport: '',
}

const SETTINGS_KEY = 'foldr_settings'

interface SettingsContextType {
  settings: AppSettings
  updateSettings: (updates: Partial<AppSettings>) => void
  formatTemperature: (celsius: number) => string
  formatDistance: (km: number) => string
  formatDate: (dateStr: string) => string
  formatTime: (timeStr: string) => string
  exportData: () => void
  importData: (jsonString: string) => boolean
  clearAllData: () => void
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SETTINGS_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setSettings({ ...DEFAULT_SETTINGS, ...parsed })
        } catch (e) {
          console.error('Failed to parse settings:', e)
        }
      }
      setIsLoaded(true)
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    }
  }, [settings, isLoaded])

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }

  // Convert Celsius to the user's preferred unit
  const formatTemperature = (celsius: number): string => {
    if (settings.temperatureUnit === 'fahrenheit') {
      const fahrenheit = Math.round((celsius * 9/5) + 32)
      return `${fahrenheit}°F`
    }
    return `${Math.round(celsius)}°C`
  }

  // Convert kilometers to preferred unit
  const formatDistance = (km: number): string => {
    if (settings.distanceUnit === 'miles') {
      const miles = km * 0.621371
      return `${miles.toFixed(1)} mi`
    }
    return `${km.toFixed(1)} km`
  }

  // Format date according to user preference
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return ''
    const [datePart] = dateStr.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    
    switch (settings.dateFormat) {
      case 'dmy':
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      case 'ymd':
        return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })
      case 'mdy':
      default:
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  // Format time according to user preference
  const formatTime = (timeStr: string): string => {
    if (!timeStr) return ''
    let hours: number, minutes: number
    
    if (timeStr.includes('T')) {
      const timePart = timeStr.split('T')[1]
      ;[hours, minutes] = timePart.split(':').map(Number)
    } else {
      ;[hours, minutes] = timeStr.split(':').map(Number)
    }
    
    if (settings.timeFormat === '24h') {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    }
    
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHour = hours % 12 || 12
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  // Export all app data as JSON
  const exportData = () => {
    if (typeof window === 'undefined') return
    
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      trips: localStorage.getItem('foldr_trips'),
      blocks: localStorage.getItem('foldr_blocks'),
      todos: localStorage.getItem('foldr_todos'),
      packingItems: localStorage.getItem('foldr_packing_items'),
      expenses: localStorage.getItem('foldr_expenses'),
      settings: localStorage.getItem('foldr_settings'),
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `foldr-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Import data from JSON backup
  const importData = (jsonString: string): boolean => {
    if (typeof window === 'undefined') return false
    
    try {
      const data = JSON.parse(jsonString)
      
      if (data.trips) localStorage.setItem('foldr_trips', data.trips)
      if (data.blocks) localStorage.setItem('foldr_blocks', data.blocks)
      if (data.todos) localStorage.setItem('foldr_todos', data.todos)
      if (data.packingItems) localStorage.setItem('foldr_packing_items', data.packingItems)
      if (data.expenses) localStorage.setItem('foldr_expenses', data.expenses)
      if (data.settings) {
        localStorage.setItem('foldr_settings', data.settings)
        const parsed = JSON.parse(data.settings)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      }
      
      return true
    } catch (e) {
      console.error('Failed to import data:', e)
      return false
    }
  }

  // Clear all app data
  const clearAllData = () => {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem('foldr_trips')
    localStorage.removeItem('foldr_blocks')
    localStorage.removeItem('foldr_todos')
    localStorage.removeItem('foldr_packing_items')
    localStorage.removeItem('foldr_expenses')
    localStorage.removeItem('foldr_settings')
    localStorage.removeItem('foldr_logged_in')
    
    // Reset settings to defaults
    setSettings(DEFAULT_SETTINGS)
  }

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSettings, 
      formatTemperature, 
      formatDistance,
      formatDate, 
      formatTime,
      exportData,
      importData,
      clearAllData
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

// Supported currencies with symbols
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
]
