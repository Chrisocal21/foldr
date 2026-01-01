import { NextRequest, NextResponse } from 'next/server'

// Proxy for Nominatim API to avoid CORS issues
// Nominatim blocks direct browser requests - we proxy through our server

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  
  if (!query || query.length < 2) {
    return NextResponse.json([])
  }
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}&` +
      `format=json&` +
      `addressdetails=1&` +
      `limit=5&` +
      `featuretype=city`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TripFldr-Travel-App/1.0 (https://tripfldr.com)'
        }
      }
    )
    
    if (!response.ok) {
      return NextResponse.json([])
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Places search error:', error)
    return NextResponse.json([])
  }
}
