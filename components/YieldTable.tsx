'use client'

import { useState, useMemo } from 'react'
import { SuburbData, BedroomType, PropertyType, FilterState } from '@/lib/types'
import { formatCurrency, formatPercentage } from '@/lib/calculations'
import { deleteSuburb } from '@/lib/storage'

type SortField = 'suburb' | 'price' | 'yield'
type SortDirection = 'asc' | 'desc'

interface YieldTableProps {
  suburbs: SuburbData[]
  filters: FilterState
  onDataChange: () => void
}

export function YieldTable({ suburbs, filters, onDataChange }: YieldTableProps) {
  const [sortField, setSortField] = useState<SortField>('suburb')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this suburb?')) {
      await deleteSuburb(id)
      onDataChange()
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Flatten data to show house and unit separately, respecting filters
  const flattenedData = useMemo(() => {
    const data = suburbs.flatMap((suburb): typeof rows => {
    const rows: Array<{
      suburb: SuburbData
      propertyType: PropertyType
      beds: BedroomType
      bedIndex: number
      buyPrice: number
      rentPrice: number
      yield: number
    }> = []
    
    // Skip suburbs with missing data
    if (!suburb.house || !suburb.unit) {
      return rows
    }
    
    // Use filtered property types if specified, otherwise show all
    const propertyTypesToShow = filters.propertyTypes.length > 0 
      ? filters.propertyTypes 
      : (['house', 'unit'] as PropertyType[])
    
    // Use filtered bedroom options if specified, otherwise show all
    const bedroomsToShow = filters.bedrooms.length > 0
      ? filters.bedrooms
      : (['2', '3', '4+'] as BedroomType[])
    
    propertyTypesToShow.forEach((propType) => {
      bedroomsToShow.forEach((beds, bedIndex) => {
        const data = suburb[propType]?.bedrooms?.[beds]
        // Skip if bedroom data doesn't exist
        if (!data) {
          return
        }
        rows.push({
          suburb,
          propertyType: propType,
          beds,
          bedIndex,
          buyPrice: data.buyPrice,
          rentPrice: data.rentPrice,
          yield: suburb[propType]?.yield?.[beds] || 0,
        })
      })
    })
    
    return rows
    })

    return [...data].sort((a, b) => {
      let comparison = 0
      if (sortField === 'suburb') {
        comparison = a.suburb.suburb.localeCompare(b.suburb.suburb)
      } else if (sortField === 'price') {
        comparison = a.buyPrice - b.buyPrice
      } else if (sortField === 'yield') {
        comparison = a.yield - b.yield
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [suburbs, filters, sortField, sortDirection])

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer" onClick={() => handleSort('suburb')}>
                Suburb ↕
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">State</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Beds</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer" onClick={() => handleSort('price')}>
                Buy Price ↕
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rent/wk</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer" onClick={() => handleSort('yield')}>
                Yield ↕
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {flattenedData.map((row, index) => {
              const hasData = row.buyPrice > 0 || row.rentPrice > 0
              const isNewSuburb = index === 0 || flattenedData[index - 1].suburb.id !== row.suburb.id
              
              return (
                <tr 
                  key={`${row.suburb.id}-${row.propertyType}-${row.beds}`} 
                  className={`border-t hover:bg-gray-50 ${!hasData ? 'opacity-50' : ''} ${isNewSuburb ? 'border-t-2 border-gray-300' : ''}`}
                >
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium">{row.suburb.suburb}</div>
                    {row.suburb.isHot && <span className="text-xs">🔥 Hot</span>}
                  </td>
                  <td className="px-4 py-3 text-sm">{row.suburb.state}</td>
                  <td className="px-4 py-3 text-sm capitalize">
                    <span className={`px-2 py-1 rounded text-xs ${row.propertyType === 'house' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                      {row.propertyType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{row.beds}</td>
                  <td className="px-4 py-3 text-sm">
                    {row.buyPrice > 0 ? formatCurrency(row.buyPrice) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {row.rentPrice > 0 ? `$${row.rentPrice}/wk` : '-'}
                  </td>
                  <td className={`px-4 py-3 text-sm font-medium ${
                    !hasData ? 'text-gray-400' :
                    row.yield >= 5 ? 'text-green-600' : 
                    row.yield >= 4 ? 'text-yellow-600' : 'text-gray-600'
                  }`}>
                    {hasData ? formatPercentage(row.yield) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {isNewSuburb && (
                      <button
                        onClick={() => handleDelete(row.suburb.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      {suburbs.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No suburbs found. Add some data to get started!
        </div>
      )}
    </div>
  )
}
