'use client'

import { FilterState, AUSTRALIAN_STATES, BEDROOM_OPTIONS, StateCode, BedroomType } from '@/lib/types'

interface FilterBarProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const toggleState = (state: StateCode) => {
    const states = filters.states.includes(state)
      ? filters.states.filter(s => s !== state)
      : [...filters.states, state]
    onChange({ ...filters, states })
  }

  const toggleBedroom = (beds: BedroomType) => {
    const bedrooms = filters.bedrooms.includes(beds)
      ? filters.bedrooms.filter(b => b !== beds)
      : [...filters.bedrooms, beds]
    onChange({ ...filters, bedrooms })
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          States
        </label>
        <div className="flex flex-wrap gap-2">
          {AUSTRALIAN_STATES.map((state) => (
            <button
              key={state.code}
              onClick={() => toggleState(state.code)}
              className={`px-3 py-1 text-sm rounded-full border ${
                filters.states.includes(state.code)
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {state.code}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bedrooms
        </label>
        <div className="flex flex-wrap gap-2">
          {BEDROOM_OPTIONS.map((beds) => (
            <button
              key={beds}
              onClick={() => toggleBedroom(beds)}
              className={`px-3 py-1 text-sm rounded-full border ${
                filters.bedrooms.includes(beds)
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {beds} bed
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Price
          </label>
          <select
            value={filters.maxPrice || ''}
            onChange={(e) => onChange({ ...filters, maxPrice: e.target.value ? parseInt(e.target.value) : null })}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="">No limit</option>
            <option value="500000">$500K</option>
            <option value="750000">$750K</option>
            <option value="1000000">$1M</option>
            <option value="1500000">$1.5M</option>
            <option value="2000000">$2M</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Yield %
          </label>
          <select
            value={filters.minYield || ''}
            onChange={(e) => onChange({ ...filters, minYield: e.target.value ? parseFloat(e.target.value) : null })}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="">No minimum</option>
            <option value="3">3%</option>
            <option value="4">4%</option>
            <option value="5">5%</option>
            <option value="6">6%</option>
            <option value="7">7%</option>
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={filters.hotOnly}
          onChange={(e) => onChange({ ...filters, hotOnly: e.target.checked })}
          className="w-4 h-4"
        />
        <span className="text-sm text-gray-700">Show Hot Suburbs Only</span>
      </label>
    </div>
  )
}
