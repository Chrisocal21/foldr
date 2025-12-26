'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSettings, SUPPORTED_CURRENCIES, TemperatureUnit, DateFormat, TimeFormat } from '@/lib/settings-context'

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings()
  const [saved, setSaved] = useState(false)

  const handleChange = (key: string, value: string) => {
    updateSettings({ [key]: value })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/trips" className="text-slate-300 hover:text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 12H5m7-7-7 7 7 7" />
              </svg>
              Back
            </Link>
            <h1 className="text-xl font-bold text-white">Settings</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Save indicator */}
        {saved && (
          <div className="fixed top-20 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in z-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" />
            </svg>
            Settings saved
          </div>
        )}

        {/* Units Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
            </svg>
            Units & Format
          </h2>
          
          <div className="bg-slate-800 rounded-xl border border-slate-700 divide-y divide-slate-700">
            {/* Temperature */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Temperature</p>
                <p className="text-sm text-slate-400">Display temperature in weather widgets</p>
              </div>
              <select
                value={settings.temperatureUnit}
                onChange={(e) => handleChange('temperatureUnit', e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="fahrenheit">Fahrenheit (°F)</option>
                <option value="celsius">Celsius (°C)</option>
              </select>
            </div>

            {/* Date Format */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Date Format</p>
                <p className="text-sm text-slate-400">How dates are displayed</p>
              </div>
              <select
                value={settings.dateFormat}
                onChange={(e) => handleChange('dateFormat', e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="mdy">Dec 25, 2025 (MDY)</option>
                <option value="dmy">25 Dec 2025 (DMY)</option>
                <option value="ymd">2025/12/25 (YMD)</option>
              </select>
            </div>

            {/* Time Format */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Time Format</p>
                <p className="text-sm text-slate-400">12-hour or 24-hour clock</p>
              </div>
              <select
                value={settings.timeFormat}
                onChange={(e) => handleChange('timeFormat', e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="12h">12-hour (2:30 PM)</option>
                <option value="24h">24-hour (14:30)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Currency Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
            Currency
          </h2>
          
          <div className="bg-slate-800 rounded-xl border border-slate-700 divide-y divide-slate-700">
            {/* Default Currency */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Default Currency</p>
                <p className="text-sm text-slate-400">Pre-selected currency for new expenses</p>
              </div>
              <select
                value={settings.defaultCurrency}
                onChange={(e) => handleChange('defaultCurrency', e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SUPPORTED_CURRENCIES.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Preview Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Preview
          </h2>
          
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="grid gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Temperature 25°C displays as:</span>
                <span className="text-white font-medium">
                  {settings.temperatureUnit === 'fahrenheit' ? '77°F' : '25°C'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date Dec 25, 2025 displays as:</span>
                <span className="text-white font-medium">
                  {settings.dateFormat === 'mdy' ? 'Dec 25, 2025' : 
                   settings.dateFormat === 'dmy' ? '25 Dec 2025' : '2025/12/25'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Time 14:30 displays as:</span>
                <span className="text-white font-medium">
                  {settings.timeFormat === '12h' ? '2:30 PM' : '14:30'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Default currency symbol:</span>
                <span className="text-white font-medium">
                  {SUPPORTED_CURRENCIES.find(c => c.code === settings.defaultCurrency)?.symbol || '$'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Info */}
        <p className="text-center text-slate-500 text-sm">
          Settings are saved automatically and sync across this device.
        </p>
      </main>
    </div>
  )
}
