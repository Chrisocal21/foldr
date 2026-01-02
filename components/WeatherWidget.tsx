'use client'

import { useEffect, useState } from 'react'
import { useSettings } from '@/lib/settings-context'

interface WeatherDay {
  date: string
  temp: number
  tempMin: number
  tempMax: number
  description: string
  icon: string
}

interface WeatherWidgetProps {
  latitude: number
  longitude: number
  destination?: string
  className?: string
}

export function WeatherWidget({ latitude, longitude, destination, className = '' }: WeatherWidgetProps) {
  const { settings } = useSettings()
  const [forecast, setForecast] = useState<WeatherDay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  // Convert temperature based on user settings
  const formatTemp = (celsius: number): string => {
    if (settings.temperatureUnit === 'fahrenheit') {
      const f = Math.round((celsius * 9/5) + 32)
      return `${f}°F`
    }
    return `${Math.round(celsius)}°C`
  }

  const fetchWeather = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Using Open-Meteo - free, no API key required
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${latitude}&longitude=${longitude}&` +
        `daily=weather_code,temperature_2m_max,temperature_2m_min&` +
        `timezone=auto&` +
        `forecast_days=${settings.weatherForecastDays}`,
        { signal: AbortSignal.timeout(10000) }
      )
      
      if (!response.ok) {
        throw new Error('Weather data unavailable')
      }
      
      const data = await response.json()
      
      // Parse the response
      const days: WeatherDay[] = data.daily.time.map((date: string, index: number) => ({
        date,
        temp: Math.round((data.daily.temperature_2m_max[index] + data.daily.temperature_2m_min[index]) / 2),
        tempMin: Math.round(data.daily.temperature_2m_min[index]),
        tempMax: Math.round(data.daily.temperature_2m_max[index]),
        description: getWeatherDescription(data.daily.weather_code[index]),
        icon: getWeatherIcon(data.daily.weather_code[index]),
      }))
      
      setForecast(days)
    } catch (err) {
      if (!navigator.onLine) {
        setIsOffline(true)
      } else {
        setError('Unable to load weather')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Check online status
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    if (!navigator.onLine) {
      setIsOffline(true)
      setIsLoading(false)
      return
    }

    fetchWeather()
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [latitude, longitude, settings.weatherForecastDays])

  // Offline state
  if (isOffline) {
    return (
      <div className={`bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
          Weather
        </h3>
        <div className="flex items-center gap-3 text-slate-400 py-4">
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18.364 5.636a9 9 0 11-12.728 12.728 9 9 0 0112.728-12.728zM15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Weather unavailable offline</span>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
          Weather
        </h3>
        <div className="flex items-center justify-center py-6">
          <svg className="w-6 h-6 animate-spin text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 2v4m0 12v4m-7-7H2m20 0h-3m-2.5-7.5L14 7m-4 10-2.5 2.5M17.5 17.5 15 15M6.5 6.5 9 9" />
          </svg>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
          Weather
        </h3>
        <div className="flex items-center gap-3 text-slate-400 py-4">
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
          <button 
            onClick={fetchWeather}
            className="ml-auto text-sm text-slate-400 hover:text-slate-300"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
        {settings.weatherForecastDays}-Day Forecast
        {destination && <span className="text-sm font-normal text-slate-400">• {destination.split(',')[0]}</span>}
      </h3>
      
      <div className={`grid gap-2 ${
        settings.weatherForecastDays === 3 ? 'grid-cols-3' : 
        settings.weatherForecastDays === 7 ? 'grid-cols-7' : 'grid-cols-5'
      }`}>
        {forecast.map((day, index) => (
          <div 
            key={day.date} 
            className={`text-center p-2 rounded-lg ${index === 0 ? 'bg-slate-500/20 border border-slate-500/30' : 'bg-slate-700/30'}`}
          >
            <div className="text-xs text-slate-400 mb-1">
              {index === 0 ? 'Today' : formatDayName(day.date)}
            </div>
            <div className="text-2xl mb-1">{day.icon}</div>
            <div className="text-sm font-semibold text-white">{formatTemp(day.tempMax)}</div>
            <div className="text-xs text-slate-500">{formatTemp(day.tempMin)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatDayName(dateStr: string): string {
  // Parse as local date to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

// WMO Weather interpretation codes
function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Clear',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Fog',
    51: 'Light Drizzle',
    53: 'Drizzle',
    55: 'Heavy Drizzle',
    56: 'Freezing Drizzle',
    57: 'Freezing Drizzle',
    61: 'Light Rain',
    63: 'Rain',
    65: 'Heavy Rain',
    66: 'Freezing Rain',
    67: 'Freezing Rain',
    71: 'Light Snow',
    73: 'Snow',
    75: 'Heavy Snow',
    77: 'Snow Grains',
    80: 'Light Showers',
    81: 'Showers',
    82: 'Heavy Showers',
    85: 'Snow Showers',
    86: 'Heavy Snow Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm',
    99: 'Thunderstorm',
  }
  return descriptions[code] || 'Unknown'
}

function getWeatherIcon(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 2) return '🌤️'
  if (code === 3) return '☁️'
  if (code <= 48) return '🌫️'
  if (code <= 57) return '🌧️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 82) return '🌧️'
  if (code <= 86) return '🌨️'
  if (code >= 95) return '⛈️'
  return '🌡️'
}

