'use client'

import { useState, useEffect } from 'react'
import { getCountryInfo, extractCountryFromDestination, type CountryInfo as CountryInfoType } from '@/lib/travel-apis'

interface CountryInfoProps {
  destination: string
  className?: string
  showDetailed?: boolean
}

export function CountryInfo({ destination, className = '', showDetailed = false }: CountryInfoProps) {
  const [countryInfo, setCountryInfo] = useState<CountryInfoType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    
    async function fetchCountryInfo() {
      const country = extractCountryFromDestination(destination)
      const info = await getCountryInfo(country)
      if (mounted) {
        setCountryInfo(info)
        setLoading(false)
      }
    }
    
    fetchCountryInfo()
    return () => { mounted = false }
  }, [destination])

  if (loading) {
    return <div className={`text-sm text-slate-400 ${className}`}>Loading country info...</div>
  }

  if (!countryInfo) {
    return null
  }

  if (!showDetailed) {
    // Compact view - just flag and currency
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <span className="text-2xl" title={countryInfo.name}>{countryInfo.flag}</span>
        {countryInfo.currencies[0] && (
          <span className="text-slate-300">
            {countryInfo.currencies[0].symbol} {countryInfo.currencies[0].code}
          </span>
        )}
      </div>
    )
  }

  // Detailed view
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-3">
        <span className="text-4xl">{countryInfo.flag}</span>
        <div>
          <h3 className="font-semibold text-white">{countryInfo.name}</h3>
          <p className="text-xs text-slate-400">{countryInfo.region} • {countryInfo.subregion}</p>
        </div>
      </div>
      
      {countryInfo.capital.length > 0 && (
        <div className="text-sm">
          <span className="text-slate-400">Capital: </span>
          <span className="text-white">{countryInfo.capital.join(', ')}</span>
        </div>
      )}
      
      {countryInfo.currencies.length > 0 && (
        <div className="text-sm">
          <span className="text-slate-400">Currency: </span>
          {countryInfo.currencies.map((c, i) => (
            <span key={i} className="text-white">
              {c.name} ({c.symbol} {c.code})
              {i < countryInfo.currencies.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      )}
      
      {countryInfo.languages.length > 0 && (
        <div className="text-sm">
          <span className="text-slate-400">Languages: </span>
          <span className="text-white">{countryInfo.languages.join(', ')}</span>
        </div>
      )}
      
      {countryInfo.timezones.length > 0 && (
        <div className="text-sm">
          <span className="text-slate-400">Timezones: </span>
          <span className="text-white text-xs">{countryInfo.timezones.slice(0, 3).join(', ')}</span>
          {countryInfo.timezones.length > 3 && <span className="text-slate-500"> +{countryInfo.timezones.length - 3} more</span>}
        </div>
      )}
    </div>
  )
}
