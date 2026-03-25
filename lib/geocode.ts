/**
 * Production-ready geocoding with OpenCage API (primary) and fallbacks.
 * OpenCage aggregates multiple data sources and works well for Indian addresses.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  console.log('[GEOCODE] Starting geocode for address:', address)
  
  // Try OpenCage Geocoding API first (best for production)
  const opencageApiKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY
  if (opencageApiKey) {
    try {
      const encoded = encodeURIComponent(address)
      const url = `https://api.opencagedata.com/geocode/v1/json?q=${encoded}&key=${opencageApiKey}&countrycode=in&limit=1&no_annotations=1`
      console.log('[GEOCODE] Trying OpenCage API')
      
      const res = await fetch(url, {
        signal: AbortSignal.timeout(5000)
      })
      console.log('[GEOCODE] OpenCage response status:', res.status)
      
      if (res.ok) {
        const data = await res.json()
        console.log('[GEOCODE] OpenCage response:', data)
        
        if (data.results?.[0]?.geometry) {
          const { lat, lng } = data.results[0].geometry
          const coords = { lat, lng }
          console.log('[GEOCODE] OpenCage success! Coordinates:', coords, 'Confidence:', data.results[0].confidence)
          return coords
        } else {
          console.warn('[GEOCODE] OpenCage returned no results')
        }
      }
    } catch (err) {
      console.error('[GEOCODE] OpenCage error:', err)
    }
  } else {
    console.warn('[GEOCODE] OpenCage API key not configured, using fallback geocoders')
  }
  
  // Try Google Maps Geocoding API as secondary option
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (googleApiKey) {
    try {
      const encoded = encodeURIComponent(address)
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&region=in&key=${googleApiKey}`
      console.log('[GEOCODE] Trying Google Maps API')
      
      const res = await fetch(url, {
        signal: AbortSignal.timeout(5000)
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
          const { lat, lng } = data.results[0].geometry.location
          const coords = { lat, lng }
          console.log('[GEOCODE] Google Maps success! Coordinates:', coords)
          return coords
        }
      }
    } catch (err) {
      console.error('[GEOCODE] Google Maps error:', err)
    }
  }
  
  // Fallback: Try different address formats with free OSM geocoders
  const addressVariants = [
    address, // Original full address
    address.split(',').slice(-3).join(',').trim(), // Last 3 parts (area, city, pincode)
    address.split(',').slice(-2).join(',').trim(), // Last 2 parts (city, pincode)
  ]
  
  for (const addr of addressVariants) {
    console.log('[GEOCODE] Trying OSM with address variant:', addr)
    
    // Try Nominatim
    try {
      const encoded = encodeURIComponent(addr)
      const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=in`
      
      const res = await fetch(url, { 
        headers: { 'User-Agent': 'Eeshuu-App/1.0' },
        signal: AbortSignal.timeout(5000)
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data?.[0]) {
          const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
          console.log('[GEOCODE] Nominatim success! Coordinates:', coords)
          return coords
        }
      }
    } catch (err) {
      console.error('[GEOCODE] Nominatim error:', err)
    }
  }
  
  console.log('[GEOCODE] All geocoding attempts failed')
  return null
}
