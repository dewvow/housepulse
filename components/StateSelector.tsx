'use client'

import { AUSTRALIAN_STATES, StateCode } from '@/lib/types'

interface StateSelectorProps {
  selectedState: StateCode | null
  onSelect: (state: StateCode | null) => void
}

export function StateSelector({ selectedState, onSelect }: StateSelectorProps) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select State/Territory
      </label>
      <select
        value={selectedState || ''}
        onChange={(e) => onSelect(e.target.value as StateCode || null)}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All States</option>
        {AUSTRALIAN_STATES.map((state) => (
          <option key={state.code} value={state.code}>
            {state.name}
          </option>
        ))}
      </select>
    </div>
  )
}
