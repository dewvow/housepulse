'use client'

import { useState } from 'react'
import { SuburbData, StateCode, BedroomType, BedroomPriceData, SuburbDemographics } from '@/lib/types'
import { calculatePropertyYields, generateSuburbId, parseReaPrice, parseReaRent } from '@/lib/calculations'
import { saveSuburb } from '@/lib/storage'
import { loadSuburbs, getSuburbDetails, calculateDistance } from '@/lib/suburbs'
import { fetchDemographics } from '@/lib/demographics'

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
  const [nominatedFor, setNominatedFor] = useState('')
  const [houseData, setHouseData] = useState({ ...initialPropertyData })
  const [unitData, setUnitData] = useState({ ...initialPropertyData })



  const processImportedData = async (data: any): Promise<SuburbData> => {
    const stateCode = data.state.toUpperCase() as StateCode
    const suburbs = await loadSuburbs()
    const details = getSuburbDetails(data.suburb, stateCode, data.postcode)
    const distance = details ? calculateDistance(stateCode, details.lat, details.lng) : 0
    
    const demographics = details?.sscCode 
      ? await fetchDemographics(details.sscCode, data.postcode, details.medianIncome, details.population)
      : undefined

    const nominatedList = data.nominatedFor || []

    // Handle new format with house/unit
    if (data.house && data.unit) {
      return {
        id: data.id || generateSuburbId(data.suburb, data.state, data.postcode),
        suburb: data.suburb,
        state: stateCode,
        postcode: data.postcode,
        isHot: data.isHot || false,
        distanceToCapital: distance,
        nominatedFor: Array.isArray(nominatedList) ? nominatedList : [nominatedList].filter(Boolean),
        demographics,
        house: {
          bedrooms: data.house.bedrooms || initialPropertyData.bedrooms,
          yield: data.house.yield || calculatePropertyYields(data.house.bedrooms || initialPropertyData.bedrooms),
        },
        unit: {
          bedrooms: data.unit.bedrooms || initialPropertyData.bedrooms,
          yield: data.unit.yield || calculatePropertyYields(data.unit.bedrooms || initialPropertyData.bedrooms),
        },
        dateAdded: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
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
      state: stateCode,
      postcode: data.postcode,
      isHot: data.isHot || false,
      distanceToCapital: distance,
      nominatedFor: [],
      demographics,
      house: {
        bedrooms: convertedBedrooms,
        yield: calculatePropertyYields(convertedBedrooms),
      },
      unit: {
        bedrooms: { ...initialPropertyData.bedrooms },
        yield: { ...initialPropertyData.yield },
      },
      dateAdded: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    }
  }

  const handleJsonSubmit = async () => {
    try {
      const data = JSON.parse(jsonInput)
      
      // Validate structure
      if (!data.suburb || !data.state || !data.postcode) {
        throw new Error('Missing required fields: suburb, state, postcode')
      }

      const suburbData = await processImportedData(data)
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

    const suburbs = await loadSuburbs()
    const details = getSuburbDetails(suburbName, state, postcode)
    const distance = details ? calculateDistance(state, details.lat, details.lng) : 0
    
    const demographics = details?.sscCode 
      ? await fetchDemographics(details.sscCode, postcode, details.medianIncome, details.population)
      : undefined

    const nominatedList = nominatedFor ? nominatedFor.split(',').map(s => s.trim()).filter(Boolean) : []

    const suburbData: SuburbData = {
      id: generateSuburbId(suburbName, state, postcode),
      suburb: suburbName,
      state,
      postcode,
      isHot,
      distanceToCapital: distance,
      nominatedFor: nominatedList,
      demographics,
      house: {
        bedrooms: houseData.bedrooms,
        yield: calculatePropertyYields(houseData.bedrooms),
      },
      unit: {
        bedrooms: unitData.bedrooms,
        yield: calculatePropertyYields(unitData.bedrooms),
      },
      dateAdded: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    }

    await saveSuburb(suburbData)
    setSuburbName('')
    setPostcode('')
    setIsHot(false)
    setNominatedFor('')
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

          <input
            type="text"
            value={nominatedFor}
            onChange={(e) => setNominatedFor(e.target.value)}
            placeholder="Nominated for (e.g. Hot 100 2026)"
            className="w-full p-2 border border-gray-300 rounded"
          />

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
