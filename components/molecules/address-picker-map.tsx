'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { DeliveryAddress, DeliveryAddressWithCoords, GeocodeSuggestion } from '@/types'
import { geocodingPickerService } from '@/lib/geocode-picker'
import { SearchInput } from './search-input'
import { LocationButton } from '../atoms/location-button'
import { AddressDisplay } from '../atoms/address-display'
import { MapIcon, Edit3 } from 'lucide-react'

interface AddressPickerMapProps {
  onAddressSelect: (address: DeliveryAddressWithCoords) => void
  initialAddress?: DeliveryAddress
  className?: string
}

type Mode = 'map' | 'manual'

export function AddressPickerMap({
  onAddressSelect,
  initialAddress,
  className = '',
}: AddressPickerMapProps) {
  const [mode, setMode] = useState<Mode>('map')
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(
    initialAddress?.lat && initialAddress?.lng
      ? { lat: initialAddress.lat, lng: initialAddress.lng }
      : null
  )
  const [formattedAddress, setFormattedAddress] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([])
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mapError, setMapError] = useState(false)

  // Manual entry fields
  const [manualLine1, setManualLine1] = useState(initialAddress?.line1 || '')
  const [manualCity, setManualCity] = useState(initialAddress?.city || '')
  const [manualPincode, setManualPincode] = useState(initialAddress?.pincode || '')
  
  // Building/landmark details (required even in map mode)
  const [buildingDetails, setBuildingDetails] = useState(initialAddress?.line1 || '')

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Initialize map
  useEffect(() => {
    if (mode !== 'map' || mapError) return

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default
        await import('leaflet/dist/leaflet.css')

        if (!mapContainerRef.current || mapInstanceRef.current) return

        const defaultCenter: [number, number] = coordinates
          ? [coordinates.lat, coordinates.lng]
          : [19.076, 72.8777] // Mumbai default

        const map = L.map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 15,
          zoomControl: true,
          attributionControl: false,
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map)

        // Custom pin marker icon
        const pinIcon = L.divIcon({
          html: `
            <div style="position:relative;width:40px;height:40px;">
              <div style="
                position:absolute;inset:0;border-radius:50%;
                overflow:hidden;
                box-shadow:0 2px 8px rgba(0,0,0,0.3);
              ">
                <img src="/marker.png" alt="Pin" style="width:100%;height:100%;object-fit:cover;" />
              </div>
            </div>
          `,
          className: '',
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        })

        const marker = L.marker(defaultCenter, {
          icon: pinIcon,
          draggable: true,
        }).addTo(map)

        marker.on('dragend', async () => {
          const pos = marker.getLatLng()
          const newCoords = {
            lat: parseFloat(pos.lat.toFixed(6)),
            lng: parseFloat(pos.lng.toFixed(6)),
          }
          setCoordinates(newCoords)
          await handleReverseGeocode(newCoords.lat, newCoords.lng)
        })

        mapInstanceRef.current = map
        markerRef.current = marker

        // If we have initial coordinates, reverse geocode them
        if (coordinates) {
          await handleReverseGeocode(coordinates.lat, coordinates.lng)
        }
      } catch (err) {
        console.error('[MAP] Failed to load map:', err)
        setError('Map unavailable. Switching to manual address entry.')
        setMapError(true)
        setMode('manual')
      }
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, mapError])

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchQuery.length < 3) {
      setSuggestions([])
      return
    }

    setIsSearching(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await geocodingPickerService.search(searchQuery)
        setSuggestions(results)
      } catch (err) {
        console.error('[GEOCODE] Search failed:', err)
        setError('Search failed. Please try again.')
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  const handleReverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true)
    setError(null)
    try {
      const result = await geocodingPickerService.reverseGeocode(lat, lng)
      setFormattedAddress(result.formattedAddress)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('[GEOCODE] Reverse geocoding failed:', err)
        setFormattedAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
        setError('Unable to fetch address. You can still place your order with these coordinates.')
      }
    } finally {
      setIsGeocoding(false)
    }
  }

  const handleCurrentLocation = async () => {
    setIsLoadingLocation(true)
    setError(null)
    try {
      const coords = await geocodingPickerService.getCurrentLocation()
      const newCoords = {
        lat: parseFloat(coords.lat.toFixed(6)),
        lng: parseFloat(coords.lng.toFixed(6)),
      }
      setCoordinates(newCoords)

      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.setView([newCoords.lat, newCoords.lng], 15)
        markerRef.current.setLatLng([newCoords.lat, newCoords.lng])
      }

      await handleReverseGeocode(newCoords.lat, newCoords.lng)
    } catch (err: any) {
      console.error('[GEOCODE] Geolocation error:', err)
      if (err.code === 1) {
        setError('Location access denied. Please use search or enter address manually.')
        // Default to Mumbai
        const defaultCoords = { lat: 19.076, lng: 72.8777 }
        setCoordinates(defaultCoords)
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([defaultCoords.lat, defaultCoords.lng], 15)
          markerRef.current.setLatLng([defaultCoords.lat, defaultCoords.lng])
        }
      } else if (err.code === 2) {
        setError('Location unavailable. Please check your device settings.')
      } else if (err.code === 3) {
        setError('Location request timed out. Please try again or use search.')
      }
    } finally {
      setIsLoadingLocation(false)
    }
  }

  const handleSuggestionSelect = async (suggestion: GeocodeSuggestion) => {
    const newCoords = {
      lat: parseFloat(suggestion.lat.toFixed(6)),
      lng: parseFloat(suggestion.lng.toFixed(6)),
    }
    setCoordinates(newCoords)
    setFormattedAddress(suggestion.displayName)
    setSearchQuery('')
    setSuggestions([])

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([newCoords.lat, newCoords.lng], 15)
      markerRef.current.setLatLng([newCoords.lat, newCoords.lng])
    }
  }

  const handleModeToggle = () => {
    setMode((prev) => (prev === 'map' ? 'manual' : 'map'))
    setError(null)
  }

  const handleSubmit = async () => {
    if (mode === 'map') {
      if (!coordinates) {
        setError('Please select a location on the map')
        return
      }
      
      if (!buildingDetails.trim()) {
        setError('Please enter building/room/landmark details')
        return
      }

      // Parse city and pincode from formatted address
      const parts = formattedAddress.split(',').map((p) => p.trim())
      const address: DeliveryAddressWithCoords = {
        line1: buildingDetails.trim(),
        city: parts[parts.length - 3] || 'Mumbai',
        pincode: parts[parts.length - 2] || '400001',
        lat: coordinates.lat,
        lng: coordinates.lng,
      }

      onAddressSelect(address)
    } else {
      // Manual mode
      if (!manualLine1 || !manualCity || !manualPincode) {
        setError('Please fill in all address fields')
        return
      }

      // Try to geocode manual address
      try {
        const searchStr = `${manualLine1}, ${manualCity}, ${manualPincode}, India`
        const results = await geocodingPickerService.search(searchStr)
        
        if (results.length > 0) {
          const coords = {
            lat: parseFloat(results[0].lat.toFixed(6)),
            lng: parseFloat(results[0].lng.toFixed(6)),
          }
          onAddressSelect({
            line1: manualLine1,
            city: manualCity,
            pincode: manualPincode,
            lat: coords.lat,
            lng: coords.lng,
          })
        } else {
          // No coordinates found, submit without them
          onAddressSelect({
            line1: manualLine1,
            city: manualCity,
            pincode: manualPincode,
            lat: 0,
            lng: 0,
          })
        }
      } catch (err) {
        console.error('[GEOCODE] Manual address geocoding failed:', err)
        // Submit without coordinates
        onAddressSelect({
          line1: manualLine1,
          city: manualCity,
          pincode: manualPincode,
          lat: 0,
          lng: 0,
        })
      }
    }
  }

  return (
    <div className={className} style={{ width: '100%' }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setMode('map')}
          disabled={mapError}
          aria-label="Map mode"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: mode === 'map' ? 'rgba(200,255,0,0.15)' : 'rgba(247,244,239,0.02)',
            border: `1px solid ${mode === 'map' ? 'rgba(200,255,0,0.3)' : 'rgba(247,244,239,0.08)'}`,
            borderRadius: '8px',
            padding: '10px',
            minHeight: '44px',
            cursor: mapError ? 'not-allowed' : 'pointer',
            color: mode === 'map' ? '#c8ff00' : 'rgba(247,244,239,0.7)',
            fontSize: '14px',
            fontWeight: 500,
            opacity: mapError ? 0.5 : 1,
          }}
        >
          <MapIcon size={18} />
          <span>Map</span>
        </button>
        <button
          onClick={() => setMode('manual')}
          aria-label="Manual entry mode"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: mode === 'manual' ? 'rgba(200,255,0,0.15)' : 'rgba(247,244,239,0.02)',
            border: `1px solid ${mode === 'manual' ? 'rgba(200,255,0,0.3)' : 'rgba(247,244,239,0.08)'}`,
            borderRadius: '8px',
            padding: '10px',
            minHeight: '44px',
            cursor: 'pointer',
            color: mode === 'manual' ? '#c8ff00' : 'rgba(247,244,239,0.7)',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          <Edit3 size={18} />
          <span>Manual</span>
        </button>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(255,77,0,0.1)',
            border: '1px solid rgba(255,77,0,0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            color: '#ff4d00',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {mode === 'map' ? (
        <>
          <div style={{ marginBottom: '12px' }}>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              onSuggestionSelect={handleSuggestionSelect}
              suggestions={suggestions}
              isLoading={isSearching}
              placeholder="Search for your address..."
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <LocationButton
              onClick={handleCurrentLocation}
              isLoading={isLoadingLocation}
              disabled={isLoadingLocation}
            />
          </div>

          <div
            ref={mapContainerRef}
            style={{
              width: '100%',
              height: '400px',
              minHeight: '300px',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid rgba(247,244,239,0.08)',
            }}
          />

          <AddressDisplay
            address={formattedAddress}
            coordinates={coordinates}
            isLoading={isGeocoding}
          />
          
          {/* Building/Landmark details - Required */}
          <div style={{ marginTop: '12px' }}>
            <label
              htmlFor="building-details"
              style={{
                display: 'block',
                marginBottom: '6px',
                color: 'rgba(247,244,239,0.7)',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Building / Room / Landmark <span style={{ color: '#ff4d00' }}>*</span>
            </label>
            <input
              id="building-details"
              type="text"
              value={buildingDetails}
              onChange={(e) => setBuildingDetails(e.target.value)}
              placeholder="e.g., Room 304, Building B, Near City Mall"
              aria-label="Building, room, or landmark details"
              required
              style={{
                width: '100%',
                background: 'rgba(247,244,239,0.02)',
                border: '1px solid rgba(247,244,239,0.08)',
                borderRadius: '8px',
                padding: '12px',
                minHeight: '44px',
                color: 'rgba(247,244,239,0.90)',
                fontSize: '15px',
                outline: 'none',
              }}
            />
            <p style={{ 
              marginTop: '6px', 
              fontSize: '12px', 
              color: 'rgba(247,244,239,0.5)',
              fontStyle: 'italic'
            }}>
              Help delivery partner find you easily
            </p>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label
              htmlFor="line1"
              style={{
                display: 'block',
                marginBottom: '6px',
                color: 'rgba(247,244,239,0.7)',
                fontSize: '14px',
              }}
            >
              Address Line 1
            </label>
            <input
              id="line1"
              type="text"
              value={manualLine1}
              onChange={(e) => setManualLine1(e.target.value)}
              placeholder="Building, Room, Street"
              aria-label="Address line 1"
              style={{
                width: '100%',
                background: 'rgba(247,244,239,0.02)',
                border: '1px solid rgba(247,244,239,0.08)',
                borderRadius: '8px',
                padding: '12px',
                minHeight: '44px',
                color: 'rgba(247,244,239,0.90)',
                fontSize: '15px',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="city"
              style={{
                display: 'block',
                marginBottom: '6px',
                color: 'rgba(247,244,239,0.7)',
                fontSize: '14px',
              }}
            >
              City
            </label>
            <input
              id="city"
              type="text"
              value={manualCity}
              onChange={(e) => setManualCity(e.target.value)}
              placeholder="City"
              aria-label="City"
              style={{
                width: '100%',
                background: 'rgba(247,244,239,0.02)',
                border: '1px solid rgba(247,244,239,0.08)',
                borderRadius: '8px',
                padding: '12px',
                minHeight: '44px',
                color: 'rgba(247,244,239,0.90)',
                fontSize: '15px',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="pincode"
              style={{
                display: 'block',
                marginBottom: '6px',
                color: 'rgba(247,244,239,0.7)',
                fontSize: '14px',
              }}
            >
              Pincode
            </label>
            <input
              id="pincode"
              type="text"
              value={manualPincode}
              onChange={(e) => setManualPincode(e.target.value)}
              placeholder="Pincode"
              aria-label="Pincode"
              style={{
                width: '100%',
                background: 'rgba(247,244,239,0.02)',
                border: '1px solid rgba(247,244,239,0.08)',
                borderRadius: '8px',
                padding: '12px',
                minHeight: '44px',
                color: 'rgba(247,244,239,0.90)',
                fontSize: '15px',
                outline: 'none',
              }}
            />
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        style={{
          width: '100%',
          background: '#c8ff00',
          border: 'none',
          borderRadius: '8px',
          padding: '14px',
          marginTop: '16px',
          minHeight: '48px',
          cursor: 'pointer',
          color: '#050505',
          fontSize: '15px',
          fontWeight: 600,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#b8ef00'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#c8ff00'
        }}
      >
        Confirm Address
      </button>
    </div>
  )
}
