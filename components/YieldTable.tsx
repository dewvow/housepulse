'use client'

import { useState, useMemo } from 'react'
import { SuburbData, BedroomType, PropertyType, FilterState } from '@/lib/types'
import { formatCurrency, formatPercentage, calculatePropertyYields } from '@/lib/calculations'
import { deleteSuburb, saveSuburb } from '@/lib/storage'

const generateReaUrl = (suburb: string, state: string, postcode: string) => {
  const slug = `${state.toLowerCase()}/${suburb.toLowerCase().replace(/\s+/g, '-')}-${postcode}`
  return `https://www.realestate.com.au/${slug}/`
}

type SortField = 'suburb' | 'yield' | 'price'
type SortDirection = 'asc' | 'desc'

interface YieldTableProps {
  suburbs: SuburbData[]
  filters: FilterState
  onDataChange: () => void
}

type YieldEntry = {
  propertyType: PropertyType
  beds: BedroomType
  buyPrice: number
  rentPrice: number
  yield: number
}

type SuburbRow = {
  suburb: SuburbData
  yields: YieldEntry[]
  isNewSuburb: boolean
}

export function YieldTable({ suburbs, filters, onDataChange }: YieldTableProps) {
  const [sortField, setSortField] = useState<SortField>('suburb')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [pastingId, setPastingId] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this suburb?')) {
      await deleteSuburb(id)
      onDataChange()
    }
  }

  const handlePasteFromClipboard = async (suburb: SuburbData) => {
    try {
      setPastingId(suburb.id)
      const text = await navigator.clipboard.readText()
      const data = JSON.parse(text)
      
      const processed: SuburbData = {
        ...suburb,
        house: {
          bedrooms: data.house?.bedrooms || suburb.house.bedrooms,
          yield: data.house?.yield || calculatePropertyYields(data.house?.bedrooms || suburb.house.bedrooms),
        },
        unit: {
          bedrooms: data.unit?.bedrooms || suburb.unit.bedrooms,
          yield: data.unit?.yield || calculatePropertyYields(data.unit?.bedrooms || suburb.unit.bedrooms),
        },
        dateAdded: suburb.dateAdded || new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      }
      
      await saveSuburb(processed)
      onDataChange()
    } catch (err) {
      alert('Failed to paste: ' + (err instanceof Error ? err.message : 'Invalid JSON in clipboard'))
    } finally {
      setPastingId(null)
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

  const getYields = (suburb: SuburbData): YieldEntry[] => {
    if (!suburb.house || !suburb.unit) return []

    const yields: YieldEntry[] = []
    const propertyTypes: PropertyType[] = filters.propertyTypes.length > 0
      ? filters.propertyTypes
      : (['house', 'unit'] as PropertyType[])
    const bedrooms: BedroomType[] = filters.bedrooms.length > 0
      ? filters.bedrooms
      : (['2', '3', '4+'] as BedroomType[])

    for (const propType of propertyTypes) {
      for (const beds of bedrooms) {
        const data = suburb[propType]?.bedrooms?.[beds]
        if (!data || data.buyPrice === 0) continue

        const yieldVal = suburb[propType]?.yield?.[beds] || 0
        
        if (filters.minYield && yieldVal < filters.minYield) continue

        yields.push({
          propertyType: propType,
          beds,
          buyPrice: data.buyPrice,
          rentPrice: data.rentPrice,
          yield: yieldVal,
        })
      }
    }

    return yields.sort((a, b) => b.yield - a.yield)
  }

  const suburbRows = useMemo((): SuburbRow[] => {
    const seenSuburbIds = new Set<string>()
    const rows: SuburbRow[] = []

    for (const suburb of suburbs) {
      if (!suburb.house || !suburb.unit) continue

      const yields = getYields(suburb)
      if (yields.length === 0) continue

      const isNewSuburb = !seenSuburbIds.has(suburb.id)
      seenSuburbIds.add(suburb.id)

      rows.push({ suburb, yields, isNewSuburb })
    }

    rows.sort((a, b) => {
      let comparison = 0
      if (sortField === 'suburb') {
        comparison = a.suburb.suburb.localeCompare(b.suburb.suburb)
      } else if (sortField === 'yield') {
        const aBest = a.yields[0]?.yield || 0
        const bBest = b.yields[0]?.yield || 0
        comparison = aBest - bBest
      } else if (sortField === 'price') {
        const aBest = a.yields[0]?.buyPrice || 0
        const bBest = b.yields[0]?.buyPrice || 0
        comparison = aBest - bBest
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return rows
  }, [suburbs, filters, sortField, sortDirection])

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-8"></th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer" onClick={() => handleSort('suburb')}>
                Suburb ↕
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">State</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type / Beds</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer" onClick={() => handleSort('yield')}>
                Yield ↕
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer" onClick={() => handleSort('price')}>
                Price ↕
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Last Updated</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {suburbRows.map((row) => {
              const isExpanded = expandedRows.has(row.suburb.id)
              const bestYield = row.yields[0]

              return (
                <>
                  <tr 
                    key={row.suburb.id}
                    className={`border-t hover:bg-gray-50 ${row.isNewSuburb ? 'border-t-2 border-gray-300' : ''}`}
                  >
                    <td className="px-2 py-3">
                      <button
                        onClick={() => toggleExpand(row.suburb.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <a
                          href={generateReaUrl(row.suburb.suburb, row.suburb.state, row.suburb.postcode)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                          title="View on realestate.com.au"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                        <span className="font-medium">{row.suburb.suburb}</span>
                      </div>
                      {row.suburb.isHot && <span className="text-xs">🔥 Hot</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">{row.suburb.state}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${bestYield.propertyType === 'house' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {bestYield.propertyType} {bestYield.beds}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm font-medium ${
                      bestYield.yield >= 5 ? 'text-green-600' : 
                      bestYield.yield >= 4 ? 'text-yellow-600' : 'text-gray-600'
                    }`}>
                      {formatPercentage(bestYield.yield)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {formatCurrency(bestYield.buyPrice)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {row.suburb.lastUpdated ? new Date(row.suburb.lastUpdated).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePasteFromClipboard(row.suburb)}
                          disabled={pastingId === row.suburb.id}
                          className="text-green-600 hover:text-green-800 disabled:opacity-50"
                          title="Paste JSON from clipboard"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </button>
                        {row.isNewSuburb && (
                          <button
                            onClick={() => handleDelete(row.suburb.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${row.suburb.id}-expanded`} className="bg-gray-50">
                      <td colSpan={8} className="px-4 py-3">
                        <div className="pl-8">
                          <div className="text-xs font-medium text-gray-500 mb-2">All yields for {row.suburb.suburb}</div>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-500">
                                <th className="pb-2 font-medium">Type</th>
                                <th className="pb-2 font-medium">Beds</th>
                                <th className="pb-2 font-medium">Buy Price</th>
                                <th className="pb-2 font-medium">Rent/wk</th>
                                <th className="pb-2 font-medium">Yield</th>
                              </tr>
                            </thead>
                            <tbody>
                              {row.yields.map((y) => (
                                <tr key={`${y.propertyType}-${y.beds}`} className="border-t border-gray-200">
                                  <td className="py-2">
                                    <span className={`px-2 py-1 rounded text-xs ${y.propertyType === 'house' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                      {y.propertyType}
                                    </span>
                                  </td>
                                  <td className="py-2">{y.beds}</td>
                                  <td className="py-2">{formatCurrency(y.buyPrice)}</td>
                                  <td className="py-2">{y.rentPrice > 0 ? `$${y.rentPrice}/wk` : '-'}</td>
                                  <td className={`py-2 font-medium ${y.yield >= 5 ? 'text-green-600' : y.yield >= 4 ? 'text-yellow-600' : 'text-gray-600'}`}>
                                    {formatPercentage(y.yield)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
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
