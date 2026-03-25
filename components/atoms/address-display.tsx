'use client'

import { Loader2, MapPin } from 'lucide-react'

interface AddressDisplayProps {
  address: string
  coordinates: { lat: number; lng: number } | null
  isLoading: boolean
}

export function AddressDisplay({ address, coordinates, isLoading }: AddressDisplayProps) {
  return (
    <div
      style={{
        background: 'rgba(247,244,239,0.02)',
        border: '1px solid rgba(247,244,239,0.08)',
        borderRadius: '8px',
        padding: '12px 16px',
        marginTop: '12px',
      }}
    >
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(247,244,239,0.5)' }}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '14px' }}>Loading address...</span>
        </div>
      ) : (
        <>
          <div
            style={{
              color: 'rgba(247,244,239,0.90)',
              fontSize: '14px',
              lineHeight: '1.5',
              marginBottom: coordinates ? '8px' : 0,
            }}
          >
            {address || 'No address selected'}
          </div>
          {coordinates && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'rgba(247,244,239,0.5)',
                fontSize: '12px',
              }}
            >
              <MapPin size={12} />
              <span>
                {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
              </span>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
