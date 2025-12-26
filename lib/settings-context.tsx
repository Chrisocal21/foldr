'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type TemperatureUnit = 'celsius' | 'fahrenheit'
export type DateFormat = 'mdy' | 'dmy' | 'ymd'
export type TimeFormat = '12h' | '24h'

export interface AppSettings {
  temperatureUnit: TemperatureUnit
  defaultCurrency: string
  dateFormat: DateFormat
  timeFormat: TimeFormat
}

const DEFAULT_SETTINGS: AppSettings = {
  temperatureUnit: 'fahrenheit',
  defaultCurrency: 'USD',
  dateFormat: 'mdy',
  timeFormat: '12h',
}

const SETTINGS_KEY = 'foldr_settings'

interface SettingsContextType {
  settings: AppSettings
  updateSettings: (updates: Partial<AppSettings>) => void
  formatTemperature: (celsius: number) => string
  formatDate: (dateStr: string) => string
  formatTime: (timeStr: string) => string
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
    // Handle both "HH:MM" and full datetime strings
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

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, formatTemperature, formatDate, formatTime }}>
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
