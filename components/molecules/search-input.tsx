'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { GeocodeSuggestion } from '@/types'
import { Search, X, Loader2 } from 'lucide-react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onSuggestionSelect: (suggestion: GeocodeSuggestion) => void
  suggestions: GeocodeSuggestion[]
  isLoading: boolean
  placeholder?: string
}

export function SearchInput({
  value,
  onChange,
  onSuggestionSelect,
  suggestions,
  isLoading,
  placeholder = 'Search address...',
}: SearchInputProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
      setSelectedIndex(-1)
    } else {
      setShowSuggestions(false)
    }
  }, [suggestions])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleSelect = (suggestion: GeocodeSuggestion) => {
    onSuggestionSelect(suggestion)
    setShowSuggestions(false)
    setSelectedIndex(-1)
  }

  const handleClear = () => {
    onChange('')
    setShowSuggestions(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(247,244,239,0.02)',
          border: '1px solid rgba(247,244,239,0.08)',
          borderRadius: '8px',
          padding: '0 12px',
          minHeight: '44px',
        }}
      >
        <Search size={18} style={{ color: 'rgba(247,244,239,0.5)', marginRight: '8px' }} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search address"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'rgba(247,244,239,0.90)',
            fontSize: '15px',
            padding: '12px 0',
          }}
        />
        {isLoading && (
          <Loader2
            size={18}
            style={{ color: '#c8ff00', marginLeft: '8px', animation: 'spin 1s linear infinite' }}
          />
        )}
        {value && !isLoading && (
          <button
            onClick={handleClear}
            aria-label="Clear search"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '8px',
              minWidth: '24px',
              minHeight: '24px',
            }}
          >
            <X size={18} style={{ color: 'rgba(247,244,239,0.5)' }} />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'rgba(17,17,17,0.98)',
            border: '1px solid rgba(247,244,239,0.08)',
            borderRadius: '8px',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.placeId}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => handleSelect(suggestion)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                background: index === selectedIndex ? 'rgba(200,255,0,0.1)' : 'transparent',
                borderBottom:
                  index < suggestions.length - 1 ? '1px solid rgba(247,244,239,0.05)' : 'none',
                transition: 'background 0.15s ease',
                color: 'rgba(247,244,239,0.90)',
                fontSize: '14px',
                lineHeight: '1.5',
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {suggestion.displayName}
            </div>
          ))}
        </div>
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
