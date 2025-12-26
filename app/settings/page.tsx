'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSettings, SUPPORTED_CURRENCIES } from '@/lib/settings-context'
import { AIRLINES, AIRPORTS, HOTEL_CHAINS } from '@/lib/travel-data'
import { ComboBox } from '@/components/ComboBox'
import { isLoggedIn, getUserEmail, getLastSyncTime, logout, fullSync } from '@/lib/cloud-sync'

export default function SettingsPage() {
  const router = useRouter()
  const { settings, updateSettings, exportData, importData, clearAllData } = useSettings()
  const [saved, setSaved] = useState(false)
  const [showClearModal, setShowClearModal] = useState(false)
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Account state
  const [loggedIn, setLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  
  // Password change state
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [changingPassword, setChangingPassword] = useState(false)
  
  useEffect(() => {
    setLoggedIn(isLoggedIn())
    setUserEmail(getUserEmail())
    setLastSync(getLastSyncTime())
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    await fullSync()
    setLastSync(getLastSyncTime())
    setSyncing(false)
  }

  const handleLogout = () => {
    logout()
    setLoggedIn(false)
    setUserEmail(null)
    router.push('/auth')
  }

  const handleChangePassword = async () => {
    setPasswordMessage(null)
    
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }
    
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }
    
    setChangingPassword(true)
    
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          currentPassword,
          newPassword
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully!' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmNewPassword('')
        setTimeout(() => {
          setShowChangePassword(false)
          setPasswordMessage(null)
        }, 2000)
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Failed to change password' })
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'Network error' })
    } finally {
      setChangingPassword(false)
    }
  }

  const handleChange = (key: string, value: string | number | boolean) => {
    updateSettings({ [key]: value })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const success = importData(content)
      setImportStatus(success ? 'success' : 'error')
      setTimeout(() => setImportStatus('idle'), 3000)
      if (success) {
        window.location.reload()
      }
    }
    reader.readAsText(file)
  }

  const handleClearAllData = () => {
    clearAllData()
    setShowClearModal(false)
    router.push('/')
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

      <main className="container mx-auto px-4 py-8 max-w-2xl pb-24">
        {/* Save indicator */}
        {saved && (
          <div className="fixed top-20 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" />
            </svg>
            Settings saved
          </div>
        )}

        {/* Import status */}
        {importStatus !== 'idle' && (
          <div className={`fixed top-20 right-4 ${importStatus === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {importStatus === 'success' ? <path d="M5 13l4 4L19 7" /> : <path d="M6 18L18 6M6 6l12 12" />}
            </svg>
            {importStatus === 'success' ? 'Data imported!' : 'Import failed'}
          </div>
        )}

        {/* Account Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
            </svg>
            Account & Sync
          </h2>
          
          <div className="bg-slate-800 rounded-xl border border-slate-700 divide-y divide-slate-700">
            {loggedIn ? (
              <>
                {/* Logged in state */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{userEmail}</p>
                      <p className="text-sm text-slate-400">Signed in</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="text-sm text-green-400">Connected</span>
                    </div>
                  </div>
                </div>
                
                {/* Sync status */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Sync</p>
                    <p className="text-sm text-slate-400">
                      {lastSync 
                        ? `Last synced ${new Date(lastSync).toLocaleString()}`
                        : 'Not synced yet'
                      }
                    </p>
                  </div>
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15" />
                    </svg>
                    {syncing ? 'Syncing...' : 'Sync Now'}
                  </button>
                </div>
                
                {/* Logout */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Sign Out</p>
                    <p className="text-sm text-slate-400">Your data stays on this device</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
                
                {/* Change Password */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Change Password</p>
                      <p className="text-sm text-slate-400">Update your account password</p>
                    </div>
                    <button
                      onClick={() => setShowChangePassword(!showChangePassword)}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                      {showChangePassword ? 'Cancel' : 'Change'}
                    </button>
                  </div>
                  
                  {showChangePassword && (
                    <div className="mt-4 space-y-3">
                      {passwordMessage && (
                        <div className={`px-3 py-2 rounded-lg text-sm ${
                          passwordMessage.type === 'success' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {passwordMessage.text}
                        </div>
                      )}
                      
                      <div className="relative">
                        <input
                          type={showPasswords ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Current password"
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 pr-10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(!showPasswords)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                        >
                          {showPasswords ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password"
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      
                      <button
                        onClick={handleChangePassword}
                        disabled={changingPassword || !currentPassword || !newPassword || !confirmNewPassword}
                        className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                      >
                        {changingPassword ? 'Changing...' : 'Update Password'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Not logged in */
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Not signed in</p>
                    <p className="text-sm text-slate-400">Sign in to sync across devices</p>
                  </div>
                  <Link
                    href="/auth"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

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
                <p className="text-sm text-slate-400">Weather display</p>
              </div>
              <select
                value={settings.temperatureUnit}
                onChange={(e) => handleChange('temperatureUnit', e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="fahrenheit">°F Fahrenheit</option>
                <option value="celsius">°C Celsius</option>
              </select>
            </div>

            {/* Distance */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Distance</p>
                <p className="text-sm text-slate-400">Miles or km</p>
              </div>
              <select
                value={settings.distanceUnit}
                onChange={(e) => handleChange('distanceUnit', e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="miles">Miles</option>
                <option value="kilometers">Kilometers</option>
              </select>
            </div>

            {/* Date Format */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Date Format</p>
                <p className="text-sm text-slate-400">Display style</p>
              </div>
              <select
                value={settings.dateFormat}
                onChange={(e) => handleChange('dateFormat', e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="mdy">Dec 25, 2025</option>
                <option value="dmy">25 Dec 2025</option>
                <option value="ymd">2025/12/25</option>
              </select>
            </div>

            {/* Time Format */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Time Format</p>
                <p className="text-sm text-slate-400">Clock style</p>
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

            {/* Default Currency */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Currency</p>
                <p className="text-sm text-slate-400">Default for expenses</p>
              </div>
              <select
                value={settings.defaultCurrency}
                onChange={(e) => handleChange('defaultCurrency', e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SUPPORTED_CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Display Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
            Display & Calendar
          </h2>
          
          <div className="bg-slate-800 rounded-xl border border-slate-700 divide-y divide-slate-700">
            {/* First Day of Week */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Week Starts</p>
                <p className="text-sm text-slate-400">Calendar first day</p>
              </div>
              <select
                value={settings.firstDayOfWeek}
                onChange={(e) => handleChange('firstDayOfWeek', e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="sunday">Sunday</option>
                <option value="monday">Monday</option>
              </select>
            </div>

            {/* Weather Forecast Days */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Weather Days</p>
                <p className="text-sm text-slate-400">Forecast length</p>
              </div>
              <select
                value={settings.weatherForecastDays}
                onChange={(e) => handleChange('weatherForecastDays', parseInt(e.target.value))}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={3}>3 days</option>
                <option value={5}>5 days</option>
                <option value={7}>7 days</option>
              </select>
            </div>

            {/* Map Default Zoom */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Map Zoom</p>
                <p className="text-sm text-slate-400">Default level</p>
              </div>
              <select
                value={settings.mapDefaultZoom}
                onChange={(e) => handleChange('mapDefaultZoom', parseInt(e.target.value))}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>City view</option>
                <option value={12}>Neighborhood</option>
                <option value={14}>Street level</option>
                <option value={16}>Close up</option>
              </select>
            </div>

            {/* Trip Sort Order */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Sort Trips</p>
                <p className="text-sm text-slate-400">List order</p>
              </div>
              <select
                value={settings.tripSortOrder}
                onChange={(e) => handleChange('tripSortOrder', e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">By date</option>
                <option value="name">By name</option>
                <option value="favorites">Favorites first</option>
              </select>
            </div>

            {/* Show Trip Countdown */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Countdown</p>
                <p className="text-sm text-slate-400">Days until trip</p>
              </div>
              <button
                onClick={() => handleChange('showTripCountdown', !settings.showTripCountdown)}
                className={`relative w-12 h-6 rounded-full transition-colors ${settings.showTripCountdown ? 'bg-blue-600' : 'bg-slate-600'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.showTripCountdown ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {/* Compact Mode */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Compact Mode</p>
                <p className="text-sm text-slate-400">Denser layout</p>
              </div>
              <button
                onClick={() => handleChange('compactMode', !settings.compactMode)}
                className={`relative w-12 h-6 rounded-full transition-colors ${settings.compactMode ? 'bg-blue-600' : 'bg-slate-600'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.compactMode ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Trip Defaults Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5Z" />
            </svg>
            Trip Defaults
          </h2>
          
          <div className="bg-slate-800 rounded-xl border border-slate-700 divide-y divide-slate-700">
            {/* Default Trip Duration */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Trip Length</p>
                <p className="text-sm text-slate-400">Default duration</p>
              </div>
              <select
                value={settings.defaultTripDuration}
                onChange={(e) => handleChange('defaultTripDuration', parseInt(e.target.value))}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={3}>3 days</option>
                <option value={5}>5 days</option>
                <option value={7}>1 week</option>
                <option value={10}>10 days</option>
                <option value={14}>2 weeks</option>
              </select>
            </div>

            {/* Auto Archive */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Auto-Archive</p>
                <p className="text-sm text-slate-400">Hide past trips</p>
              </div>
              <select
                value={settings.autoArchiveDays}
                onChange={(e) => handleChange('autoArchiveDays', parseInt(e.target.value))}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Never</option>
                <option value={7}>After 1 week</option>
                <option value={30}>After 1 month</option>
                <option value={90}>After 3 months</option>
              </select>
            </div>

            {/* Default Airline */}
            <div className="p-4">
              <div className="mb-2">
                <p className="text-white font-medium">Default Airline</p>
                <p className="text-sm text-slate-400">Pre-fill flights</p>
              </div>
              <ComboBox
                value={settings.defaultAirline}
                onChange={(value) => handleChange('defaultAirline', value)}
                options={AIRLINES}
                placeholder="Select airline..."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              />
            </div>

            {/* Default Hotel Chain */}
            <div className="p-4">
              <div className="mb-2">
                <p className="text-white font-medium">Default Hotel</p>
                <p className="text-sm text-slate-400">Pre-fill hotels</p>
              </div>
              <ComboBox
                value={settings.defaultHotelChain}
                onChange={(value) => handleChange('defaultHotelChain', value)}
                options={HOTEL_CHAINS}
                placeholder="Select hotel chain..."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              />
            </div>

            {/* Home Airport */}
            <div className="p-4">
              <div className="mb-2">
                <p className="text-white font-medium">Home Airport</p>
                <p className="text-sm text-slate-400">Your primary airport</p>
              </div>
              <ComboBox
                value={settings.homeAirport}
                onChange={(value) => handleChange('homeAirport', value)}
                options={AIRPORTS}
                placeholder="Select airport..."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>
        </section>

        {/* Data Management Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" />
              <path d="M14 2v4a2 2 0 0 0 2 2h4" />
              <path d="M3 15h6M6 12v6" />
            </svg>
            Data Management
          </h2>
          
          <div className="bg-slate-800 rounded-xl border border-slate-700 divide-y divide-slate-700">
            {/* Export Data */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Export Data</p>
                <p className="text-sm text-slate-400">Download backup</p>
              </div>
              <button
                onClick={exportData}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                Export
              </button>
            </div>

            {/* Import Data */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Import Data</p>
                <p className="text-sm text-slate-400">Restore backup</p>
              </div>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                ref={fileInputRef}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                Import
              </button>
            </div>

            {/* Clear All Data */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Clear All Data</p>
                <p className="text-sm text-slate-400">Reset everything</p>
              </div>
              <button
                onClick={() => setShowClearModal(true)}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
                Clear
              </button>
            </div>
          </div>
        </section>

        <p className="text-center text-slate-500 text-sm">
          Settings save automatically
        </p>
      </main>

      {/* Clear All Data Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowClearModal(false)}>
          <div 
            className="bg-slate-800 rounded-xl p-6 w-full max-w-sm shadow-xl border border-slate-700"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-500/20 p-2 rounded-full">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Clear All Data?</h3>
            </div>
            <p className="text-slate-300 mb-2">This will delete:</p>
            <ul className="text-slate-400 text-sm mb-4 list-disc list-inside space-y-1">
              <li>All trips and blocks</li>
              <li>All to-dos and notes</li>
              <li>All packing lists and expenses</li>
              <li>All settings</li>
            </ul>
            <p className="text-red-400 text-sm mb-6 font-medium">
              This cannot be undone!
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllData}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
