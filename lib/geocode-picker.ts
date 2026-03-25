import { GeocodeResult, GeocodeSuggestion, GeocodeCache } from '@/types'

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'
const CACHE_KEY = 'geocode_cache'
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

class GeocodingService {
  private cache: GeocodeCache = {}
  private abortControllers: Map<string, AbortController> = new Map()

  constructor() {
    this.loadCache()
  }

  private loadCache() {
    if (typeof window === 'undefined') return
    try {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached) this.cache = JSON.parse(cached)
    } catch (err) {
      console.warn('[GEOCODE] Failed to load cache:', err)
    }
  }

  private saveCache() {
    if (typeof window === 'undefined') return
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(this.cache))
    } catch (err) {
      console.warn('[GEOCODE] Failed to save cache:', err)
    }
  }

  private getCached(key: string): GeocodeResult | null {
    const entry = this.cache[key]
    if (!entry) return null
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      delete this.cache[key]
      return null
    }
    return entry.result
  }

  private setCache(key: string, result: GeocodeResult) {
    this.cache[key] = { result, timestamp: Date.now() }
    this.saveCache()
  }

  async search(query: string): Promise<GeocodeSuggestion[]> {
    if (query.length < 3) return []

    // Cancel previous request
    const prevController = this.abortControllers.get('search')
    if (prevController) prevController.abort()

    const controller = new AbortController()
    this.abortControllers.set('search', controller)

    try {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        addressdetails: '1',
        limit: '5',
        countrycodes: 'in',
      })

      const response = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'QuickCommerceApp/1.0' },
      })

      if (!response.ok) throw new Error(`Geocoding failed: ${response.status}`)

      const data = await response.json()
      return data.map((item: any) => ({
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        placeId: item.place_id,
      }))
    } catch (err: any) {
      if (err.name === 'AbortError') return []
      console.error('[GEOCODE] Search failed:', err)
      throw err
    } finally {
      this.abortControllers.delete('search')
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
    const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`
    const cached = this.getCached(cacheKey)
    if (cached) {
      console.log('[GEOCODE] Cache hit:', cacheKey)
      return cached
    }

    // Cancel previous request
    const prevController = this.abortControllers.get('reverse')
    if (prevController) prevController.abort()

    const controller = new AbortController()
    this.abortControllers.set('reverse', controller)

    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(),
        format: 'json',
        addressdetails: '1',
      })

      const response = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'QuickCommerceApp/1.0' },
      })

      if (!response.ok) throw new Error(`Reverse geocoding failed: ${response.status}`)

      const data = await response.json()
      const result: GeocodeResult = {
        lat,
        lng,
        formattedAddress: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      }

      this.setCache(cacheKey, result)
      return result
    } catch (err: any) {
      if (err.name === 'AbortError') throw err
      console.error('[GEOCODE] Reverse geocoding failed:', err)
      // Fallback to coordinates only
      return {
        lat,
        lng,
        formattedAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      }
    } finally {
      this.abortControllers.delete('reverse')
    }
  }

  getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error('[GEOCODE] Geolocation error:', error)
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    })
  }
}

export const geocodingPickerService = new GeocodingService()
