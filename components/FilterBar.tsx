'use client'

import { FilterState, AUSTRALIAN_STATES, BEDROOM_OPTIONS, PROPERTY_TYPES, StateCode, BedroomType, PropertyType } from '@/lib/types'
import { Button, Input, Checkbox } from '@/components/ui'
import { LABELS, PLACEHOLDERS } from '@/lib/constants'

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

  const togglePropertyType = (type: PropertyType) => {
    const propertyTypes = filters.propertyTypes.includes(type)
      ? filters.propertyTypes.filter(t => t !== type)
      : [...filters.propertyTypes, type]
    onChange({ ...filters, propertyTypes })
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          States
        </label>
        <div className="flex flex-wrap gap-2">
          {AUSTRALIAN_STATES.map((state) => (
            <Button
              key={state.code}
              variant={filters.states.includes(state.code) ? 'primary' : 'outline'}
              size="sm"
              onClick={() => toggleState(state.code)}
            >
              {state.code}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Property Type
        </label>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPES.map((type) => (
            <Button
              key={type}
              variant={filters.propertyTypes.includes(type) ? 'primary' : 'outline'}
              size="sm"
              onClick={() => togglePropertyType(type)}
              className="capitalize"
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bedrooms
        </label>
        <div className="flex flex-wrap gap-2">
          {BEDROOM_OPTIONS.map((beds) => (
            <Button
              key={beds}
              variant={filters.bedrooms.includes(beds) ? 'primary' : 'outline'}
              size="sm"
              onClick={() => toggleBedroom(beds)}
            >
              {beds} bed
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={LABELS.MAX_PRICE}
          type="text"
          value={filters.maxPrice ? Math.round(filters.maxPrice / 1000).toLocaleString() : ''}
          onChange={(e) => {
            const value = e.target.value.replace(/[^\d]/g, '')
            onChange({ ...filters, maxPrice: value ? parseInt(value) * 1000 : null })
          }}
          placeholder={PLACEHOLDERS.MAX_PRICE}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {LABELS.MIN_YIELD}
          </label>
          <select
            value={filters.minYield || ''}
            onChange={(e) => onChange({ ...filters, minYield: e.target.value ? parseFloat(e.target.value) : null })}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{LABELS.NO_MINIMUM}</option>
            <option value="3">3%</option>
            <option value="4">4%</option>
            <option value="5">5%</option>
            <option value="6">6%</option>
            <option value="7">7%</option>
          </select>
        </div>
      </div>

      <Checkbox
        label={LABELS.SHOW_HOT_ONLY}
        checked={filters.hotOnly}
        onChange={(e) => onChange({ ...filters, hotOnly: e.target.checked })}
      />
    </div>
  )
}
