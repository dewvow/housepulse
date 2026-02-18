'use client'

import { useState } from 'react'
import { SuburbData, StateCode, BedroomType, BedroomPriceData } from '@/lib/types'
import { calculatePropertyYields, generateSuburbId, parseReaPrice, parseReaRent } from '@/lib/calculations'
import { saveSuburb } from '@/lib/storage'

interface DataInputProps {
  onSuburbAdded: () => void
}

const initialBedroomPriceData: BedroomPriceData = { buyPrice: 0, rentPrice: 0 }

const initialPropertyData = {
  bedrooms: {
    '2': { ...initialBedroomPriceData },
    '3': { ...initialBedroomPriceData },
    '4+': { ...initialBedroomPriceData },
  } as Record<BedroomType, BedroomPriceData>,
  yield: { '2': 0, '3': 0, '4+': 0 } as Record<BedroomType, number>,
}

export function DataInput({ onSuburbAdded }: DataInputProps) {
  const [jsonInput, setJsonInput] = useState('')
  const [error, setError] = useState('')
  const [isManual, setIsManual] = useState(false)
  
  // Manual form state
  const [suburbName, setSuburbName] = useState('')
  const [state, setState] = useState<StateCode>('NSW')
  const [postcode, setPostcode] = useState('')
  const [isHot, setIsHot] = useState(false)
  const [houseData, setHouseData] = useState({ ...initialPropertyData })
  const [unitData, setUnitData] = useState({ ...initialPropertyData })

  const processImportedData = (data: any): SuburbData => {
    // Handle new format with house/unit
    if (data.house && data.unit) {
      return {
        id: data.id || generateSuburbId(data.suburb, data.state, data.postcode),
        suburb: data.suburb,
        state: data.state.toUpperCase() as StateCode,
        postcode: data.postcode,
        isHot: data.isHot || false,
        house: {
          bedrooms: data.house.bedrooms || initialPropertyData.bedrooms,
          yield: data.house.yield || calculatePropertyYields(data.house.bedrooms || initialPropertyData.bedrooms),
        },
        unit: {
          bedrooms: data.unit.bedrooms || initialPropertyData.bedrooms,
          yield: data.unit.yield || calculatePropertyYields(data.unit.bedrooms || initialPropertyData.bedrooms),
        },
        dateAdded: new Date().toISOString(),
      }
    }
    
    // Handle old format - convert to new format
    const oldBedrooms = data.bedrooms || initialPropertyData.bedrooms
    const convertedBedrooms: Record<BedroomType, BedroomPriceData> = {
      '2': { buyPrice: oldBedrooms['2']?.salePrice || 0, rentPrice: oldBedrooms['2']?.rent || 0 },
      '3': { buyPrice: oldBedrooms['3']?.salePrice || 0, rentPrice: oldBedrooms['3']?.rent || 0 },
      '4+': { buyPrice: oldBedrooms['4+']?.salePrice || 0, rentPrice: oldBedrooms['4+']?.rent || 0 },
    }
    
    return {
      id: data.id || generateSuburbId(data.suburb, data.state, data.postcode),
      suburb: data.suburb,
      state: data.state.toUpperCase() as StateCode,
      postcode: data.postcode,
      isHot: data.isHot || false,
      house: {
        bedrooms: convertedBedrooms,
        yield: calculatePropertyYields(convertedBedrooms),
      },
      unit: {
        bedrooms: { ...initialPropertyData.bedrooms },
        yield: { ...initialPropertyData.yield },
      },
      dateAdded: new Date().toISOString(),
    }
  }

  const handleJsonSubmit = async () => {
    try {
      const data = JSON.parse(jsonInput)
      
      // Validate structure
      if (!data.suburb || !data.state || !data.postcode) {
        throw new Error('Missing required fields: suburb, state, postcode')
      }

      const suburbData = processImportedData(data)
      await saveSuburb(suburbData)
      setJsonInput('')
      setError('')
      onSuburbAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON')
    }
  }

  const handleManualSubmit = async () => {
    if (!suburbName || !state || !postcode) {
      setError('Please fill in all required fields')
      return
    }

    const suburbData: SuburbData = {
      id: generateSuburbId(suburbName, state, postcode),
      suburb: suburbName,
      state,
      postcode,
      isHot,
      house: {
        bedrooms: houseData.bedrooms,
        yield: calculatePropertyYields(houseData.bedrooms),
      },
      unit: {
        bedrooms: unitData.bedrooms,
        yield: calculatePropertyYields(unitData.bedrooms),
      },
      dateAdded: new Date().toISOString(),
    }

    await saveSuburb(suburbData)
    setSuburbName('')
    setPostcode('')
    setIsHot(false)
    setHouseData({ ...initialPropertyData })
    setUnitData({ ...initialPropertyData })
    setError('')
    onSuburbAdded()
  }

  const updateBedroomPrice = (
    propertyType: 'house' | 'unit',
    beds: BedroomType,
    field: keyof BedroomPriceData,
    value: string
  ) => {
    const numValue = field === 'buyPrice' ? parseReaPrice(value) : parseReaRent(value)
    
    if (propertyType === 'house') {
      setHouseData(prev => ({
        ...prev,
        bedrooms: {
          ...prev.bedrooms,
          [beds]: { ...prev.bedrooms[beds], [field]: numValue }
        }
      }))
    } else {
      setUnitData(prev => ({
        ...prev,
        bedrooms: {
          ...prev.bedrooms,
          [beds]: { ...prev.bedrooms[beds], [field]: numValue }
        }
      }))
    }
  }

  const renderPropertyInputs = (propertyType: 'house' | 'unit', data: typeof initialPropertyData) => (
    <div className="space-y-3">
      <div className="font-medium capitalize text-gray-700">{propertyType} Prices</div>
      {(['2', '3', '4+'] as BedroomType[]).map((beds) => (
        <div key={beds} className="grid grid-cols-3 gap-2 items-center">
          <span className="text-sm">{beds} bed:</span>
          <input
            type="text"
            placeholder="Buy price"
            onChange={(e) => updateBedroomPrice(propertyType, beds, 'buyPrice', e.target.value)}
            className="p-2 border border-gray-300 rounded text-sm"
          />
          <input
            type="text"
            placeholder="Rent/week"
            onChange={(e) => updateBedroomPrice(propertyType, beds, 'rentPrice', e.target.value)}
            className="p-2 border border-gray-300 rounded text-sm"
          />
        </div>
      ))}
    </div>
  )

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Add Suburb Data</h3>
      
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setIsManual(false)}
          className={`px-4 py-2 rounded ${!isManual ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Paste JSON
        </button>
        <button
          onClick={() => setIsManual(true)}
          className={`px-4 py-2 rounded ${isManual ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Manual Entry
        </button>
      </div>

      {!isManual ? (
        <div className="space-y-4">
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste JSON data from bookmarklet here..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg font-mono text-sm"
          />
          <button
            onClick={handleJsonSubmit}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Suburb
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              value={suburbName}
              onChange={(e) => setSuburbName(e.target.value)}
              placeholder="Suburb name"
              className="p-2 border border-gray-300 rounded"
            />
            <select
              value={state}
              onChange={(e) => setState(e.target.value as StateCode)}
              className="p-2 border border-gray-300 rounded"
            >
              <option value="NSW">NSW</option>
              <option value="VIC">VIC</option>
              <option value="QLD">QLD</option>
              <option value="WA">WA</option>
              <option value="SA">SA</option>
              <option value="TAS">TAS</option>
              <option value="ACT">ACT</option>
              <option value="NT">NT</option>
            </select>
          </div>
          
          <input
            type="text"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            placeholder="Postcode"
            className="w-full p-2 border border-gray-300 rounded"
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isHot}
              onChange={(e) => setIsHot(e.target.checked)}
            />
            Mark as Hot Suburb
          </label>

          <div className="space-y-6">
            {renderPropertyInputs('house', houseData)}
            <div className="border-t pt-4">
              {renderPropertyInputs('unit', unitData)}
            </div>
          </div>

          <button
            onClick={handleManualSubmit}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Suburb
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
    </div>
  )
}
