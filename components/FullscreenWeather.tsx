'use client'

import { useEffect, useState } from 'react'
import { useSettings } from '@/lib/settings-context'

interface HourlyForecast {
  time: string
  temp: number
  icon: string
  precipitation: number
  windSpeed: number
}

interface DailyForecast {
  date: string
  tempMax: number
  tempMin: number
  icon: string
  description: string
  precipitation: number
  uvIndex: number
  sunrise: string
  sunset: string
  windSpeed: number
  humidity: number
}

interface FullscreenWeatherProps {
  isOpen: boolean
  onClose: () => void
  latitude: number
  longitude: number
  destination?: string
}

export function FullscreenWeather({ isOpen, onClose, latitude, longitude, destination }: FullscreenWeatherProps) {
  const { settings } = useSettings()
  const [hourly, setHourly] = useState<HourlyForecast[]>([])
  const [daily, setDaily] = useState<DailyForecast[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'hourly' | 'daily'>('daily')

  const formatTemp = (celsius: number): string => {
    if (settings.temperatureUnit === 'fahrenheit') {
      return `${Math.round((celsius * 9/5) + 32)}°`
    }
    return `${Math.round(celsius)}°`
  }

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString)
    return date.toLocaleTimeString([], { hour: 'numeric', hour12: true })
  }

  const formatDay = (dateStr: string): string => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  }

  useEffect(() => {
    if (!isOpen) return

    const fetchWeather = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // Fetch comprehensive weather data from Open-Meteo
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?` +
          `latitude=${latitude}&longitude=${longitude}&` +
          `hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m&` +
          `daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,` +
          `uv_index_max,sunrise,sunset,wind_speed_10m_max,relative_humidity_2m_mean&` +
          `timezone=auto&forecast_days=7`,
          { signal: AbortSignal.timeout(15000) }
        )
        
        if (!response.ok) throw new Error('Weather data unavailable')
        
        const data = await response.json()
        
        // Parse hourly data (next 24 hours)
        const hourlyData: HourlyForecast[] = data.hourly.time.slice(0, 24).map((time: string, i: number) => ({
          time,
          temp: data.hourly.temperature_2m[i],
          icon: getWeatherIcon(data.hourly.weather_code[i]),
          precipitation: data.hourly.precipitation_probability[i],
          windSpeed: data.hourly.wind_speed_10m[i],
        }))
        
        // Parse daily data
        const dailyData: DailyForecast[] = data.daily.time.map((date: string, i: number) => ({
          date,
          tempMax: data.daily.temperature_2m_max[i],
          tempMin: data.daily.temperature_2m_min[i],
          icon: getWeatherIcon(data.daily.weather_code[i]),
          description: getWeatherDescription(data.daily.weather_code[i]),
          precipitation: data.daily.precipitation_probability_max[i],
          uvIndex: data.daily.uv_index_max[i],
          sunrise: data.daily.sunrise[i],
          sunset: data.daily.sunset[i],
          windSpeed: data.daily.wind_speed_10m_max[i],
          humidity: data.daily.relative_humidity_2m_mean[i],
        }))
        
        setHourly(hourlyData)
        setDaily(dailyData)
      } catch (err) {
        setError('Unable to load weather data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchWeather()
  }, [isOpen, latitude, longitude])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur border-b border-slate-700/50">
        <div className="p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              Weather
            </h2>
            <p className="text-sm text-slate-400">{destination || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-4 gap-2 pb-2">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'daily' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            7-Day Forecast
          </button>
          <button
            onClick={() => setActiveTab('hourly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'hourly' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            24-Hour
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-auto h-[calc(100vh-120px)] p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <svg className="w-8 h-8 animate-spin text-white mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 2v4m0 12v4m-7-7H2m20 0h-3" />
              </svg>
              <p className="text-slate-400">Loading weather...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-red-400">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p>{error}</p>
            </div>
          </div>
        ) : activeTab === 'daily' ? (
          <div className="space-y-3">
            {daily.map((day, index) => (
              <div
                key={day.date}
                className={`p-4 rounded-xl ${
                  index === 0 
                    ? 'bg-gradient-to-r from-slate-700/50 to-slate-600/30 border border-slate-500/30' 
                    : 'bg-slate-800/50 border border-slate-700/30'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold text-white">{formatDay(day.date)}</div>
                    <div className="text-sm text-slate-400">{day.description}</div>
                  </div>
                  <div className="text-4xl">{day.icon}</div>
                </div>
                
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-2xl font-bold text-white">{formatTemp(day.tempMax)}</div>
                  <div className="text-lg text-slate-500">{formatTemp(day.tempMin)}</div>
                </div>

                <div className="grid grid-cols-4 gap-3 text-center text-sm">
                  <div className="bg-slate-700/30 rounded-lg p-2">
                    <div className="text-slate-400 text-xs mb-1">💧 Rain</div>
                    <div className="text-white font-medium">{day.precipitation}%</div>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-2">
                    <div className="text-slate-400 text-xs mb-1">☀️ UV</div>
                    <div className={`font-medium ${day.uvIndex >= 8 ? 'text-red-400' : day.uvIndex >= 6 ? 'text-orange-400' : 'text-white'}`}>
                      {Math.round(day.uvIndex)}
                    </div>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-2">
                    <div className="text-slate-400 text-xs mb-1">💨 Wind</div>
                    <div className="text-white font-medium">{Math.round(day.windSpeed)} km/h</div>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-2">
                    <div className="text-slate-400 text-xs mb-1">💦 Humidity</div>
                    <div className="text-white font-medium">{Math.round(day.humidity)}%</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 text-sm text-slate-400">
                  <span>🌅 {formatTime(day.sunrise)}</span>
                  <span>🌇 {formatTime(day.sunset)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto -mx-4 px-4">
              <div className="flex gap-3" style={{ width: 'max-content' }}>
                {hourly.map((hour, index) => (
                  <div
                    key={hour.time}
                    className={`flex-shrink-0 w-20 p-3 rounded-xl text-center ${
                      index === 0 
                        ? 'bg-gradient-to-b from-slate-600/50 to-slate-700/50 border border-slate-500/30' 
                        : 'bg-slate-800/50 border border-slate-700/30'
                    }`}
                  >
                    <div className="text-xs text-slate-400 mb-2">
                      {index === 0 ? 'Now' : formatTime(hour.time)}
                    </div>
                    <div className="text-2xl mb-2">{hour.icon}</div>
                    <div className="text-lg font-semibold text-white mb-1">{formatTemp(hour.temp)}</div>
                    <div className="text-xs text-slate-500">
                      💧 {hour.precipitation}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Stats */}
            {daily.length > 0 && (
              <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                <h3 className="text-lg font-semibold text-white mb-3">Today's Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                      🌡️
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">Feels Like</div>
                      <div className="font-semibold text-white">{formatTemp(daily[0]?.tempMax || 0)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      ☀️
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">UV Index</div>
                      <div className="font-semibold text-white">{Math.round(daily[0]?.uvIndex || 0)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      💧
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">Humidity</div>
                      <div className="font-semibold text-white">{Math.round(daily[0]?.humidity || 0)}%</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                      💨
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">Wind</div>
                      <div className="font-semibold text-white">{Math.round(daily[0]?.windSpeed || 0)} km/h</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Weather code to icon mapping (WMO codes)
function getWeatherIcon(code: number): string {
  const icons: Record<number, string> = {
    0: '☀️',   // Clear sky
    1: '🌤️',  // Mainly clear
    2: '⛅',  // Partly cloudy
    3: '☁️',  // Overcast
    45: '🌫️', // Fog
    48: '🌫️', // Depositing rime fog
    51: '🌧️', // Light drizzle
    53: '🌧️', // Moderate drizzle
    55: '🌧️', // Dense drizzle
    61: '🌧️', // Slight rain
    63: '🌧️', // Moderate rain
    65: '🌧️', // Heavy rain
    66: '🌨️', // Light freezing rain
    67: '🌨️', // Heavy freezing rain
    71: '🌨️', // Slight snow
    73: '🌨️', // Moderate snow
    75: '❄️',  // Heavy snow
    77: '🌨️', // Snow grains
    80: '🌦️', // Slight rain showers
    81: '🌦️', // Moderate rain showers
    82: '⛈️',  // Violent rain showers
    85: '🌨️', // Slight snow showers
    86: '🌨️', // Heavy snow showers
    95: '⛈️',  // Thunderstorm
    96: '⛈️',  // Thunderstorm with hail
    99: '⛈️',  // Thunderstorm with heavy hail
  }
  return icons[code] || '🌤️'
}

function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Rime fog',
    51: 'Light drizzle',
    53: 'Drizzle',
    55: 'Dense drizzle',
    61: 'Light rain',
    63: 'Rain',
    65: 'Heavy rain',
    66: 'Freezing rain',
    67: 'Heavy freezing rain',
    71: 'Light snow',
    73: 'Snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Rain showers',
    81: 'Rain showers',
    82: 'Heavy showers',
    85: 'Snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Severe thunderstorm',
  }
  return descriptions[code] || 'Unknown'
}
