'use client'

import { useState, useEffect, useRef } from 'react'
import { SuburbListItem, StateCode } from '@/lib/types'
import { searchSuburbs } from '@/lib/suburbs'

interface SuburbSearchProps {
  suburbs: SuburbListItem[]
  selectedState: StateCode | null
  onSelect: (suburb: SuburbListItem) => void
}

export function SuburbSearch({ suburbs, selectedState, onSelect }: SuburbSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SuburbListItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    let filtered = searchSuburbs(suburbs, query)
    
    if (selectedState) {
      filtered = filtered.filter(s => s.state === selectedState)
    }
    
    setResults(filtered.slice(0, 10))
  }, [query, suburbs, selectedState])

  const handleSelect = (suburb: SuburbListItem) => {
    onSelect(suburb)
    setQuery(suburb.suburb)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Search Suburb
      </label>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Type to search suburbs..."
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      
      {isOpen && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {results.map((suburb, index) => (
            <button
              key={`${suburb.suburb}-${suburb.postcode}-${index}`}
              onClick={() => handleSelect(suburb)}
              className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
            >
              <div className="font-medium">{suburb.suburb}</div>
              <div className="text-sm text-gray-500">
                {suburb.postcode} · {suburb.state}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
