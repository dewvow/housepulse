'use client'

import { useState, useMemo, useCallback } from 'react'
import { SuburbData, BedroomType, PropertyType, FilterState, SuburbDemographics } from '@/lib/types'
import { formatCurrency, formatPercentage, calculatePropertyYields } from '@/lib/calculations'
import { deleteSuburb, saveSuburb } from '@/lib/storage'
import { fetchDemographics } from '@/lib/demographics'
import { 
  ChevronRightIcon, 
  ExternalLinkIcon, 
  ClipboardIcon 
} from './icons'

const generateReaUrl = (suburb: string, state: string, postcode: string) => {
  const slug = `${state.toLowerCase()}/${suburb.toLowerCase().replace(/\s+/g, '-')}-${postcode}`
  return `https://www.realestate.com.au/${slug}/`
}

const getYieldColorClass = (yieldValue: number): string => {
  if (yieldValue >= 5) return 'text-green-600'
  if (yieldValue >= 4) return 'text-yellow-600'
  return 'text-gray-600'
}

const getPropertyTypeBadgeClass = (propertyType: PropertyType): string => {
  return propertyType === 'house' 
    ? 'bg-blue-100 text-blue-800' 
    : 'bg-green-100 text-green-800'
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
  const [demographicsLoading, setDemographicsLoading] = useState<Set<string>>(new Set())
  const [demographicsCache, setDemographicsCache] = useState<Map<string, SuburbDemographics>>(new Map())
  const [demographicsError, setDemographicsError] = useState<Set<string>>(new Set())

  const toggleExpand = useCallback(async (id: string, suburb: SuburbData) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
        
        if (suburb.demographics) {
          setDemographicsCache(prev => new Map(prev).set(id, suburb.demographics!))
        } else if (suburb.sscCode && suburb.postcode && suburb.demographics === undefined) {
          setDemographicsLoading(prev => new Set(prev).add(id))
          setDemographicsError(prev => {
            const next = new Set(prev)
            next.delete(id)
            return next
          })
          
          fetchDemographics(suburb.sscCode, suburb.postcode, suburb.medianIncome, suburb.population)
            .then(demo => {
              if (demo) {  // Only cache if we got data
                setDemographicsCache(prev => new Map(prev).set(id, demo))
              } else {
                // Fetch failed - mark error so we can show error message
                setDemographicsError(prev => new Set(prev).add(id))
              }
            })
            .catch(() => {
              // Network error - mark error
              setDemographicsError(prev => new Set(prev).add(id))
            })
            .finally(() => {
              setDemographicsLoading(prev => {
                const next = new Set(prev)
                next.delete(id)
                return next
              })
            })
        }
      }
      return next
    })
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this suburb?')) {
      await deleteSuburb(id)
      onDataChange()
    }
  }, [onDataChange])

  const handlePasteFromClipboard = useCallback(async (suburb: SuburbData) => {
    try {
      setPastingId(suburb.id)
      const text = await navigator.clipboard.readText()
      const data = JSON.parse(text)
      
      // Validate that the pasted data matches the clicked suburb
      const pastedSuburb = data.suburb?.toLowerCase()?.trim()
      const clickedSuburb = suburb.suburb.toLowerCase().trim()
      const pastedState = data.state?.toUpperCase()?.trim()
      const clickedState = suburb.state.toUpperCase().trim()
      
      if (pastedSuburb !== clickedSuburb || pastedState !== clickedState) {
        throw new Error(
          `Clipboard data doesn't match. You clicked on "${suburb.suburb}, ${suburb.state}" but the clipboard contains "${data.suburb}, ${data.state}".`
        )
      }
      
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
        nominatedFor: data.nominatedFor || suburb.nominatedFor || [],
        distanceToCapital: data.distanceToCapital || suburb.distanceToCapital || 0,
        demographics: data.demographics || suburb.demographics,
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
  }, [onDataChange])

  const handleSort = useCallback((field: SortField) => {
    const isSameField = sortField === field
    const newDirection = isSameField
      ? (sortDirection === 'asc' ? 'desc' : 'asc')
      : (field === 'yield' ? 'desc' : 'asc')
    
    setSortDirection(newDirection)
    if (!isSameField) {
      setSortField(field)
    }
  }, [sortField, sortDirection])

  const getYields = useCallback((suburb: SuburbData): YieldEntry[] => {
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
  }, [filters])

  const suburbRows = useMemo((): SuburbRow[] => {
    const seenSuburbIds = new Set<string>()
    const rows: SuburbRow[] = []

    for (const suburb of suburbs) {
      const yields = getYields(suburb)

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
  }, [suburbs, getYields, sortField, sortDirection])

  if (suburbs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
        No suburbs found. Add some data to get started!
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <TableHeader 
            sortField={sortField} 
            onSort={handleSort} 
          />
          <tbody>
            {suburbRows.map((row) => (
              <SuburbRow
                key={row.suburb.id}
                row={row}
                isExpanded={expandedRows.has(row.suburb.id)}
                isPasting={pastingId === row.suburb.id}
                demographics={demographicsCache.get(row.suburb.id)}
                isLoadingDemographics={demographicsLoading.has(row.suburb.id)}
                hasDemographicsError={demographicsError.has(row.suburb.id)}
                onToggleExpand={() => toggleExpand(row.suburb.id, row.suburb)}
                onDelete={() => handleDelete(row.suburb.id)}
                onPaste={() => handlePasteFromClipboard(row.suburb)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Sub-components

interface TableHeaderProps {
  sortField: SortField
  onSort: (field: SortField) => void
}

function TableHeader({ sortField, onSort }: TableHeaderProps) {
  const SortableHeader = ({ 
    field, 
    children 
  }: { 
    field: SortField 
    children: React.ReactNode 
  }) => (
    <th 
      className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer"
      onClick={() => onSort(field)}
    >
      {children} {sortField === field ? '↕' : ''}
    </th>
  )

  return (
    <thead className="bg-gray-100">
      <tr>
        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-8"></th>
        <SortableHeader field="suburb">Suburb</SortableHeader>
        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">State</th>
        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type / Beds</th>
        <SortableHeader field="yield">Yield</SortableHeader>
        <SortableHeader field="price">Price</SortableHeader>
        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Distance</th>
        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Last Updated</th>
        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
      </tr>
    </thead>
  )
}

interface SuburbRowProps {
  row: SuburbRow
  isExpanded: boolean
  isPasting: boolean
  demographics?: SuburbDemographics
  isLoadingDemographics: boolean
  hasDemographicsError: boolean
  onToggleExpand: () => void
  onDelete: () => void
  onPaste: () => void
}

function SuburbRow({ 
  row, 
  isExpanded, 
  isPasting,
  demographics,
  isLoadingDemographics,
  hasDemographicsError,
  onToggleExpand, 
  onDelete, 
  onPaste 
}: SuburbRowProps) {
  const bestYield = row.yields[0]
  const hasData = row.yields.length > 0

  return (
    <>
      <tr 
        className={`border-t hover:bg-gray-50 ${row.isNewSuburb ? 'border-t-2 border-gray-300' : ''}`}
      >
        <td className="px-2 py-3">
          <button
            onClick={onToggleExpand}
            disabled={!hasData}
            className={`text-gray-500 hover:text-gray-700 ${!hasData ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            <ChevronRightIcon className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
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
              <ExternalLinkIcon className="h-4 w-4" />
            </a>
            <span className="font-medium">{row.suburb.suburb}</span>
          </div>
          {row.suburb.isHot && <span className="text-xs">🔥 Hot</span>}
        </td>
        <td className="px-4 py-3 text-sm">{row.suburb.state}</td>
        <td className="px-4 py-3">
          {hasData ? (
            <PropertyTypeBadge 
              propertyType={bestYield.propertyType} 
              beds={bestYield.beds} 
            />
          ) : (
            <span className="text-xs text-gray-400">No data</span>
          )}
        </td>
        <td className={`px-4 py-3 text-sm font-medium ${hasData ? getYieldColorClass(bestYield.yield) : 'text-gray-400'}`}>
          {hasData ? formatPercentage(bestYield.yield) : '-'}
        </td>
        <td className="px-4 py-3 text-sm">
          {hasData ? formatCurrency(bestYield.buyPrice) : '-'}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">
          {row.suburb.distanceToCapital > 0 ? `${row.suburb.distanceToCapital} km` : '-'}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">
          {row.suburb.lastUpdated ? new Date(row.suburb.lastUpdated).toLocaleDateString() : '-'}
        </td>
        <td className="px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={onPaste}
              disabled={isPasting}
              className="text-green-600 hover:text-green-800 disabled:opacity-50"
              title="Paste JSON from clipboard"
            >
              <ClipboardIcon className="h-4 w-4" />
            </button>
            {row.isNewSuburb && (
              <button
                onClick={onDelete}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Delete
              </button>
            )}
          </div>
        </td>
      </tr>
      {isExpanded && hasData && (
        <ExpandedRow 
          suburb={row.suburb} 
          yields={row.yields} 
          demographics={demographics}
          isLoadingDemographics={isLoadingDemographics}
          hasDemographicsError={hasDemographicsError}
        />
      )}
    </>
  )
}

interface PropertyTypeBadgeProps {
  propertyType: PropertyType
  beds: BedroomType
}

function PropertyTypeBadge({ propertyType, beds }: PropertyTypeBadgeProps) {
  return (
    <span className={`px-2 py-1 rounded text-xs ${getPropertyTypeBadgeClass(propertyType)}`}>
      {propertyType} {beds}
    </span>
  )
}

interface ExpandedRowProps {
  suburb: SuburbData
  yields: YieldEntry[]
  demographics?: SuburbDemographics
  isLoadingDemographics: boolean
  hasDemographicsError: boolean
}

function ExpandedRow({ suburb, yields, demographics, isLoadingDemographics, hasDemographicsError }: ExpandedRowProps) {
  return (
    <tr className="bg-gray-50">
      <td colSpan={8} className="px-4 py-3">
        <div className="pl-8">
          <div className="text-xs font-medium text-gray-500 mb-2">
            All yields for {suburb.suburb}
          </div>
          
          <div className="mb-4 p-3 bg-white rounded border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-gray-500">Demographics</div>
              {demographics && (
                <div className="text-xs text-gray-400">
                  Census {demographics.censusYear}
                  {demographics.source === 'fallback' && ' (estimated)'}
                </div>
              )}
            </div>
            {isLoadingDemographics ? (
              <div className="text-sm text-gray-400">Loading demographics from ABS...</div>
            ) : hasDemographicsError ? (
              <div className="text-sm text-red-500">Failed to load demographics from ABS Census. The postcode may not have data available.</div>
            ) : demographics ? (
              <div className="grid grid-cols-5 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 mb-1">Population</div>
                  <div className="font-medium">{suburb.population ? new Intl.NumberFormat('en-AU').format(suburb.population) : '-'}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Median Income</div>
                  <div className="font-medium">${new Intl.NumberFormat('en-AU').format(demographics.medianIncome)}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Median Age</div>
                  <div className="font-medium">{demographics.medianAge}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Main Language</div>
                  <div className="font-medium">{demographics.mainLanguage}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Occupation</div>
                  <div className="font-medium">{demographics.occupationType}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400">Demographics not available from ABS Census</div>
            )}
          </div>
          
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
              {yields.map((y) => (
                <tr key={`${y.propertyType}-${y.beds}`} className="border-t border-gray-200">
                  <td className="py-2">
                    <PropertyTypeBadge propertyType={y.propertyType} beds={y.beds} />
                  </td>
                  <td className="py-2">{y.beds}</td>
                  <td className="py-2">{formatCurrency(y.buyPrice)}</td>
                  <td className="py-2">{y.rentPrice > 0 ? `$${y.rentPrice}/wk` : '-'}</td>
                  <td className={`py-2 font-medium ${getYieldColorClass(y.yield)}`}>
                    {formatPercentage(y.yield)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  )
}
