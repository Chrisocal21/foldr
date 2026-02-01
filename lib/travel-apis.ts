/**
 * Travel API integrations for enhanced trip data
 * All APIs used here have generous free tiers
 */

// ============== REST COUNTRIES API (No key required) ==============
export interface CountryInfo {
  name: string
  officialName: string
  flag: string // emoji flag
  flagUrl: string // SVG flag URL
  currencies: { code: string; name: string; symbol: string }[]
  languages: string[]
  capital: string[]
  region: string
  subregion: string
  population: number
  timezones: string[]
}

export async function getCountryInfo(countryName: string): Promise<CountryInfo | null> {
  try {
    const response = await fetch(
      `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fullText=false`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    )
    if (!response.ok) return null
    
    const data = await response.json()
    const country = data[0]
    
    return {
      name: country.name.common,
      officialName: country.name.official,
      flag: country.flag,
      flagUrl: country.flags.svg,
      currencies: Object.values(country.currencies || {}).map((c: any) => ({
        code: c.code || '',
        name: c.name || '',
        symbol: c.symbol || ''
      })),
      languages: Object.values(country.languages || {}),
      capital: country.capital || [],
      region: country.region,
      subregion: country.subregion,
      population: country.population,
      timezones: country.timezones || []
    }
  } catch (error) {
    console.error('Failed to fetch country info:', error)
    return null
  }
}

// Extract country from destination string (e.g., "Paris, France" -> "France")
export function extractCountryFromDestination(destination: string): string {
  const parts = destination.split(',').map(s => s.trim())
  return parts[parts.length - 1] // Last part is usually country
}

// ============== WORLD TIME API (No key required) ==============
export interface LocalTimeInfo {
  datetime: string // ISO 8601 datetime
  timezone: string // IANA timezone
  utcOffset: string // e.g., "+02:00"
  dayOfWeek: number
  dayOfYear: number
  weekNumber: number
  isDst: boolean
  abbreviation: string // e.g., "EST", "PST"
}

export async function getLocalTime(timezone: string): Promise<LocalTimeInfo | null> {
  try {
    const response = await fetch(
      `https://worldtimeapi.org/api/timezone/${encodeURIComponent(timezone)}`,
      { cache: 'no-store' } // Always get fresh time
    )
    if (!response.ok) return null
    
    const data = await response.json()
    return {
      datetime: data.datetime,
      timezone: data.timezone,
      utcOffset: data.utc_offset,
      dayOfWeek: data.day_of_week,
      dayOfYear: data.day_of_year,
      weekNumber: data.week_number,
      isDst: data.dst,
      abbreviation: data.abbreviation
    }
  } catch (error) {
    console.error('Failed to fetch local time:', error)
    return null
  }
}

// Get timezone from coordinates
export async function getTimezoneFromCoords(lat: number, lon: number): Promise<string | null> {
  try {
    // This is a simple approximation - you can enhance with a proper timezone API
    const response = await fetch(
      `https://api.timezonedb.com/v2.1/get-time-zone?key=demo&format=json&by=position&lat=${lat}&lng=${lon}`,
      { next: { revalidate: 86400 } }
    )
    if (!response.ok) return null
    const data = await response.json()
    return data.zoneName
  } catch (error) {
    console.error('Failed to get timezone:', error)
    return null
  }
}

// ============== EXCHANGERATE API ==============
export interface ExchangeRates {
  base: string
  date: string
  rates: { [currency: string]: number }
}

export async function getExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRates | null> {
  const apiKey = process.env.NEXT_PUBLIC_EXCHANGERATE_API_KEY
  if (!apiKey) {
    console.warn('EXCHANGERATE_API_KEY not set')
    return null
  }

  try {
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    )
    if (!response.ok) return null
    
    const data = await response.json()
    return {
      base: data.base_code,
      date: data.time_last_update_utc,
      rates: data.conversion_rates
    }
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error)
    return null
  }
}

export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<number | null> {
  const rates = await getExchangeRates(from)
  if (!rates || !rates.rates[to]) return null
  return amount * rates.rates[to]
}

// ============== OPENTRIPMAP API ==============
export interface Attraction {
  name: string
  kinds: string // comma-separated categories
  rate: number // 1-7 rating
  osm: string
  wikidata?: string
  wikipedia?: string
  image?: string
  preview?: {
    source: string
    height: number
    width: number
  }
  point: {
    lat: number
    lon: number
  }
  distance?: number // meters from search point
}

export async function getNearbyAttractions(
  lat: number,
  lon: number,
  radiusMeters: number = 5000,
  limit: number = 20
): Promise<Attraction[]> {
  const apiKey = process.env.NEXT_PUBLIC_OPENTRIPMAP_API_KEY
  if (!apiKey) {
    console.warn('OPENTRIPMAP_API_KEY not set')
    return []
  }

  try {
    // First get list of places
    const response = await fetch(
      `https://api.opentripmap.com/0.1/en/places/radius?radius=${radiusMeters}&lon=${lon}&lat=${lat}&kinds=cultural,interesting_places,tourist_facilities&limit=${limit}&apikey=${apiKey}`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    )
    if (!response.ok) return []
    
    const data = await response.json()
    
    // Get details for each place
    const attractions = await Promise.all(
      data.features.slice(0, 10).map(async (feature: any) => {
        try {
          const detailResponse = await fetch(
            `https://api.opentripmap.com/0.1/en/places/xid/${feature.properties.xid}?apikey=${apiKey}`,
            { next: { revalidate: 86400 } }
          )
          const detail = await detailResponse.json()
          return {
            name: detail.name || feature.properties.name,
            kinds: detail.kinds,
            rate: detail.rate || feature.properties.rate,
            osm: detail.osm,
            wikidata: detail.wikidata,
            wikipedia: detail.wikipedia,
            image: detail.image,
            preview: detail.preview,
            point: {
              lat: feature.geometry.coordinates[1],
              lon: feature.geometry.coordinates[0]
            },
            distance: feature.properties.dist
          }
        } catch (error) {
          return null
        }
      })
    )
    
    return attractions.filter((a): a is Attraction => a !== null)
  } catch (error) {
    console.error('Failed to fetch attractions:', error)
    return []
  }
}

// ============== GOOGLE PLACES API ==============
export interface GooglePlace {
  placeId: string
  name: string
  formattedAddress: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  types: string[]
  rating?: number
  userRatingsTotal?: number
  priceLevel?: number
  photos?: {
    photoReference: string
    height: number
    width: number
  }[]
  openingHours?: {
    openNow: boolean
    weekdayText: string[]
  }
}

export async function searchGooglePlaces(query: string): Promise<GooglePlace[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    console.warn('GOOGLE_PLACES_API_KEY not set')
    return []
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`,
      { next: { revalidate: 3600 } }
    )
    if (!response.ok) return []
    
    const data = await response.json()
    return data.results.map((place: any) => ({
      placeId: place.place_id,
      name: place.name,
      formattedAddress: place.formatted_address,
      geometry: {
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng
        }
      },
      types: place.types,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      priceLevel: place.price_level,
      photos: place.photos,
      openingHours: place.opening_hours
    }))
  } catch (error) {
    console.error('Failed to search Google Places:', error)
    return []
  }
}

export function getGooglePlacePhotoUrl(photoReference: string, maxWidth: number = 400): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
  if (!apiKey) return ''
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${apiKey}`
}
