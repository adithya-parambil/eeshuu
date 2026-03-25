'use client'

import { Loader2, MapPin } from 'lucide-react'

interface LocationButtonProps {
  onClick: () => void
  isLoading: boolean
  disabled: boolean
}

export function LocationButton({ onClick, isLoading, disabled }: LocationButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label="Use my current location"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        background: isLoading ? 'rgba(200,255,0,0.1)' : 'rgba(200,255,0,0.15)',
        border: '1px solid rgba(200,255,0,0.3)',
        borderRadius: '8px',
        padding: '12px 16px',
        minHeight: '44px',
        minWidth: '44px',
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        color: '#c8ff00',
        fontSize: '14px',
        fontWeight: 500,
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isLoading) {
          e.currentTarget.style.background = 'rgba(200,255,0,0.2)'
          e.currentTarget.style.borderColor = 'rgba(200,255,0,0.5)'
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !isLoading) {
          e.currentTarget.style.background = 'rgba(200,255,0,0.15)'
          e.currentTarget.style.borderColor = 'rgba(200,255,0,0.3)'
        }
      }}
    >
      {isLoading ? (
        <>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Getting location...</span>
        </>
      ) : (
        <>
          <MapPin size={18} />
          <span>Use my location</span>
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
    </button>
  )
}
