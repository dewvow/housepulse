'use client'

import { useState, useEffect } from 'react'
import { SuburbData, StateCode } from '@/lib/types'
import { getHotSuburbs } from '@/lib/storage'

interface HotSuburbsProps {
  selectedState: StateCode | null
  allSuburbs: SuburbData[]
  onSelectSuburb: (suburb: SuburbData) => void
}

export function HotSuburbs({ selectedState, allSuburbs, onSelectSuburb }: HotSuburbsProps) {
  const [hotIds, setHotIds] = useState<string[]>([])
  
  useEffect(() => {
    const fetchHotSuburbs = async () => {
      const ids = await getHotSuburbs()
      setHotIds(ids)
    }
    fetchHotSuburbs()
  }, [allSuburbs])
  
  const hotSuburbs = allSuburbs.filter(s => {
    if (s.isHot || hotIds.includes(s.id)) {
      return selectedState ? s.state === selectedState : true
    }
    return false
  })

  if (hotSuburbs.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No hot suburbs marked yet. Use the bookmarklet on Hot 100 pages to mark suburbs as hot.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700">
        Hot Suburbs {selectedState && `in ${selectedState}`}
      </div>
      <div className="flex flex-wrap gap-2">
        {hotSuburbs.map((suburb) => (
          <button
            key={suburb.id}
            onClick={() => onSelectSuburb(suburb)}
            className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full hover:bg-orange-200 transition-colors"
          >
            <span className="mr-1">🔥</span>
            {suburb.suburb}
          </button>
        ))}
      </div>
    </div>
  )
}
