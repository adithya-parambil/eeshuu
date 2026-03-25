'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

interface DeliveryMapProps {
  partnerLat?: number
  partnerLng?: number
  destLat?: number
  destLng?: number
  accuracyMeters?: number
  isOffline?: boolean
  isLastKnown?: boolean
  className?: string
  isFullscreen?: boolean
  onExitFullscreen?: () => void
}

// ── Haversine distance (km) ──────────────────────────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Fetch road-following route from OSRM (free, no key) ──────────────────────
async function fetchRoute(
  fromLat: number, fromLng: number,
  toLat: number, toLng: number,
): Promise<[number, number][]> {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${fromLng},${fromLat};${toLng},${toLat}` +
      `?overview=full&geometries=geojson`
    console.log('[OSRM] Fetching route:', { fromLat, fromLng, toLat, toLng, url })
    const res = await fetch(url)
    const data = await res.json()
    console.log('[OSRM] Response:', data)
    if (data.code !== 'Ok' || !data.routes?.[0]) {
      console.warn('[OSRM] No valid route found')
      return []
    }
    // GeoJSON coords are [lng, lat] — flip to [lat, lng] for Leaflet
    const coords = data.routes[0].geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
    )
    console.log('[OSRM] Route coordinates count:', coords.length)
    return coords
  } catch (err) {
    console.error('[OSRM] Error fetching route:', err)
    return []
  }
}

// ── CSS injected once ─────────────────────────────────────────────────────────
const MAP_CSS = `
  @keyframes rider-pulse {
    0%   { transform: scale(1);   opacity: 0.6; }
    100% { transform: scale(2.6); opacity: 0; }
  }
  .rider-ring1, .rider-ring2 {
    position: absolute; inset: 0; border-radius: 50%;
    border: 2px solid #7c3aed;
    animation: rider-pulse 2s ease-out infinite;
  }
  .rider-ring2 { animation-delay: 1s; }
`

function injectMapCss() {
  if (typeof document === 'undefined') return
  if (document.getElementById('delivery-map-css')) return
  const s = document.createElement('style')
  s.id = 'delivery-map-css'
  s.textContent = MAP_CSS
  document.head.appendChild(s)
}

function buildRiderHtml(isOffline: boolean) {
  const opacity = isOffline ? 0.5 : 1
  return `
    <div style="position:relative;width:48px;height:48px;opacity:${opacity}">
      <div class="rider-ring1"></div>
      <div class="rider-ring2"></div>
      <div style="
        position:absolute;inset:0;border-radius:50%;
        overflow:hidden;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
      ">
        <img src="/rider.png" alt="Rider" style="width:100%;height:100%;object-fit:cover;" />
      </div>
    </div>
  `
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DeliveryMap({
  partnerLat, partnerLng,
  destLat, destLng,
  accuracyMeters,
  isOffline = false,
  isLastKnown = false,
  className,
  isFullscreen = false,
  onExitFullscreen,
}: DeliveryMapProps) {
  const mapRef        = useRef<HTMLDivElement>(null)
  const mapInst       = useRef<any>(null)
  const riderMarker   = useRef<any>(null)
  const destMarker    = useRef<any>(null)
  const routeLine     = useRef<any>(null)
  const calloutRef    = useRef<HTMLDivElement>(null)
  const routeAbort    = useRef<AbortController | null>(null)
  const mountedRef    = useRef(true)

  // ── Destroy helper ──────────────────────────────────────────────────────────
  const destroyMap = useCallback(() => {
    // Cancel any pending route requests first
    if (routeAbort.current) {
      routeAbort.current.abort()
      routeAbort.current = null
    }
    
    // Clear markers before removing the map to prevent DOM access after removal
    if (riderMarker.current) {
      try { riderMarker.current.remove() } catch { /* ignore */ }
      riderMarker.current = null
    }
    if (destMarker.current) {
      try { destMarker.current.remove() } catch { /* ignore */ }
      destMarker.current = null
    }
    if (routeLine.current) {
      try { routeLine.current.remove() } catch { /* ignore */ }
      routeLine.current = null
    }
    
    // Stop any pending map animations before removing
    if (mapInst.current) {
      try {
        mapInst.current.stop()
        mapInst.current.remove()
      } catch { /* ignore */ }
      mapInst.current = null
    }
    
    if (mapRef.current) {
      const n = mapRef.current as any
      if (n._leaflet_id != null) delete n._leaflet_id
    }
  }, [])

  // ── Init map ────────────────────────────────────────────────────────────────
  const initMap = useCallback(async () => {
    injectMapCss()
    const L = (await import('leaflet')).default
    
    // Check if unmounted after async import
    if (!mountedRef.current || !mapRef.current) return
    
    await import('leaflet/dist/leaflet.css')

    // Check again after CSS import
    if (!mountedRef.current || !mapRef.current) return

    // Tear down any existing instance (strict-mode double-invoke)
    destroyMap()
    if (!mapRef.current || !mountedRef.current) return

    const lat = partnerLat ?? destLat ?? 28.6139
    const lng = partnerLng ?? destLng ?? 77.209

    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    })

    // Light tile — clear roads, labels, buildings
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Create custom pane for route polylines with higher z-index
    map.createPane('routePane')
    map.getPane('routePane')!.style.zIndex = '450'

    mapInst.current = map
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Draw / update markers + route ───────────────────────────────────────────
  const updateMap = useCallback(async () => {
    console.log('[MAP] updateMap called with:', { partnerLat, partnerLng, destLat, destLng })
    // FIX: Save map instance reference BEFORE async operations to prevent race condition
    const mapInstance = mapInst.current
    if (!mapInstance) {
      console.log('[MAP] No map instance, returning')
      return
    }
    
    const L = (await import('leaflet')).default
    
    // Check mounted state and map instance after async operation
    if (!mountedRef.current || !mapInst.current || mapInst.current !== mapInstance) {
      console.log('[MAP] Component unmounted or map changed, returning')
      return
    }

    // ── Destination marker ──
    if (destLat != null && destLng != null) {
      const destIcon = L.divIcon({
        html: `
          <div style="position:relative;width:40px;height:40px;">
            <div style="
              position:absolute;inset:0;border-radius:50%;
              overflow:hidden;
              box-shadow:0 2px 8px rgba(0,0,0,0.3);
            ">
              <img src="/marker.png" alt="Destination" style="width:100%;height:100%;object-fit:cover;" />
            </div>
          </div>`,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      })
      if (destMarker.current) {
        destMarker.current.setLatLng([destLat, destLng])
      } else {
        // Use saved reference to avoid race condition
        destMarker.current = L.marker([destLat, destLng], { icon: destIcon })
          .addTo(mapInstance)
          .bindTooltip('Destination', { permanent: false, direction: 'top' })
      }
    }

    // ── Rider marker ──
    if (partnerLat != null && partnerLng != null) {
      const riderIcon = L.divIcon({
        html: buildRiderHtml(isOffline),
        className: '',
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      })
      if (riderMarker.current) {
        riderMarker.current.setLatLng([partnerLat, partnerLng])
        riderMarker.current.setIcon(riderIcon)
      } else {
        // Use saved reference to avoid race condition
        riderMarker.current = L.marker([partnerLat, partnerLng], { icon: riderIcon })
          .addTo(mapInstance)
          .bindTooltip('You', { permanent: false, direction: 'top' })
      }
    }

    // ── Route line ──
    if (partnerLat != null && partnerLng != null && destLat != null && destLng != null) {
      // Cancel any in-flight route request
      routeAbort.current?.abort()
      routeAbort.current = new AbortController()

      const routeCoords = await fetchRoute(partnerLat, partnerLng, destLat, destLng)
      if (!mountedRef.current || !mapInst.current) return

      const latlngs: [number, number][] = routeCoords.length > 1
        ? routeCoords
        : [[partnerLat, partnerLng], [destLat, destLng]] // fallback straight line

      if (routeLine.current) {
        routeLine.current.setLatLngs(latlngs)
        routeLine.current.bringToFront()
      } else {
        routeLine.current = L.polyline(latlngs, {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.85,
          lineJoin: 'round',
          lineCap: 'round',
          pane: 'routePane',
        }).addTo(mapInst.current)
        routeLine.current.bringToFront()
      }

      // Fit both markers in view
      if (mapRef.current && mapRef.current.offsetHeight > 300) {
        // Fullscreen mode - fit bounds with padding
        mapInst.current.fitBounds(
          [[partnerLat, partnerLng], [destLat, destLng]],
          { padding: [56, 56] }
        )
      } else {
        // Mini mode - center between points with fixed zoom
        mapInst.current.setView([(partnerLat + destLat) / 2, (partnerLng + destLng) / 2], 14)
      }

      // ETA callout
      const dist = haversine(partnerLat, partnerLng, destLat, destLng)
      const etaMins = Math.max(1, Math.round((dist / 25) * 60))
      if (calloutRef.current) {
        const el = calloutRef.current.querySelector('.eta-val')
        if (el) el.textContent = `ETA ~${etaMins} min`
      }
    } else if (partnerLat != null && partnerLng != null) {
      mapInst.current.setView([partnerLat, partnerLng], 15)
    } else if (destLat != null && destLng != null) {
      mapInst.current.setView([destLat, destLng], 15)
    }
  }, [partnerLat, partnerLng, destLat, destLng, isOffline])

  // ── Lifecycle ───────────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true
    // Init map and then update it when ready
    initMap().then(() => {
      if (mountedRef.current) {
        updateMap()
      }
    })
    return () => {
      mountedRef.current = false
      destroyMap()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mapInst.current) updateMap()
  }, [updateMap])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 0, overflow: 'hidden' }} className={className}>
      <div ref={mapRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {/* Exit fullscreen button - always visible on top when in fullscreen mode */}
      {isFullscreen && (
        <button
          onClick={onExitFullscreen}
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255,255,255,0.95)',
            border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: 24,
            padding: '10px 20px',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            fontSize: 14,
            fontWeight: 600,
            color: '#1a1a2e',
            backdropFilter: 'blur(8px)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 14h6v6"/>
            <path d="M20 10h-6V4"/>
            <path d="M14 10l7-7"/>
            <path d="M3 21l7-7"/>
          </svg>
          Exit Fullscreen
        </button>
      )}

      {/* ETA callout */}
      {(partnerLat != null || destLat != null) && (
        <div
          ref={calloutRef}
          style={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.92)',
            border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: 20,
            padding: '5px 14px',
            pointerEvents: 'none',
            zIndex: 1000,
            backdropFilter: 'blur(8px)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#7c3aed', display: 'inline-block' }} />
          <span className="eta-val" style={{ color: '#1a1a2e', fontSize: 12, fontWeight: 700 }}>
            {partnerLat != null && destLat != null ? 'Calculating…' : 'Waiting for GPS…'}
          </span>
          {isLastKnown && (
            <span style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>
              LAST KNOWN
            </span>
          )}
        </div>
      )}

      {/* Offline badge */}
      {isOffline && (
        <div style={{
          position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
          background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6,
          padding: '3px 10px', color: '#dc2626', fontSize: 11, fontWeight: 700,
          letterSpacing: 1, zIndex: 1000,
        }}>
          PARTNER OFFLINE
        </div>
      )}
    </div>
  )
}
