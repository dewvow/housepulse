import { SuburbData, StateCode, BedroomType, PropertyType, FilterState } from './types'

export async function getSuburbs(): Promise<SuburbData[]> {
  try {
    const response = await fetch('/api/suburbs')
    if (!response.ok) throw new Error('Failed to fetch suburbs')
    return await response.json()
  } catch (error) {
    console.error('Error fetching suburbs:', error)
    return []
  }
}

export async function saveSuburb(suburb: SuburbData): Promise<void> {
  try {
    const response = await fetch('/api/suburbs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(suburb),
    })
    if (!response.ok) throw new Error('Failed to save suburb')
  } catch (error) {
    console.error('Error saving suburb:', error)
    throw error
  }
}

export async function deleteSuburb(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/suburbs?id=${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete suburb')
  } catch (error) {
    console.error('Error deleting suburb:', error)
    throw error
  }
}

export async function clearAllSuburbs(): Promise<void> {
  try {
    const response = await fetch('/api/suburbs', {
      method: 'PUT',
    })
    if (!response.ok) throw new Error('Failed to clear suburbs')
  } catch (error) {
    console.error('Error clearing suburbs:', error)
    throw error
  }
}

export function filterSuburbs(
  suburbs: SuburbData[],
  filters: FilterState
): SuburbData[] {
  // Check if any filters are active
  const hasActiveFilters =
    filters.states.length > 0 ||
    filters.bedrooms.length > 0 ||
    filters.propertyTypes.length > 0 ||
    filters.maxPrice !== null ||
    filters.minYield !== null ||
    filters.hotOnly

  // If no filters are active, return all suburbs
  if (!hasActiveFilters) {
    return suburbs
  }

  // Apply filters when they are active
  return suburbs.filter(suburb => {
    // Show hot suburbs even without price data (for syncing)
    if (suburb.isHot && filters.hotOnly) {
      return true
    }

    // Skip suburbs with missing house/unit data when filtering
    if (!suburb.house || !suburb.unit) {
      return false
    }

    if (filters.states.length > 0 && !filters.states.includes(suburb.state)) {
      return false
    }

    if (filters.hotOnly && !suburb.isHot) {
      return false
    }

    const propertyTypes = filters.propertyTypes.length > 0 ? filters.propertyTypes : (['house', 'unit'] as PropertyType[])
    const bedroomValues = filters.bedrooms.length > 0 ? filters.bedrooms : (['2', '3', '4+'] as BedroomType[])

    // Check if any combination of property type and bedroom matches filters
    const hasMatchingData = propertyTypes.some(propType => {
      const propData = suburb[propType]
      return bedroomValues.some(beds => {
        const price = propData.bedrooms[beds]?.buyPrice || 0
        const yieldVal = propData.yield[beds] || 0

        const priceMatch = !filters.maxPrice || price <= filters.maxPrice
        const yieldMatch = !filters.minYield || yieldVal >= filters.minYield

        return priceMatch && yieldMatch && price > 0
      })
    })

    return hasMatchingData
  })
}

export function exportToCSV(suburbs: SuburbData[]): string {
  const headers = ['Suburb', 'State', 'Postcode', 'Hot', 'Property Type', 'Beds', 'Buy Price', 'Weekly Rent', 'Yield %', 'Date Added', 'Last Updated']
  const rows: (string | number)[][] = []
  
  suburbs.forEach(suburb => {
    // Skip suburbs with missing house/unit data
    if (!suburb.house || !suburb.unit) {
      console.warn('Skipping suburb in CSV export - missing house/unit data:', suburb.suburb)
      return
    }

    // House data
    ;(['2', '3', '4+'] as BedroomType[]).forEach((beds: BedroomType) => {
      rows.push([
        suburb.suburb,
        suburb.state,
        suburb.postcode,
        suburb.isHot ? 'Yes' : 'No',
        'House',
        beds,
        suburb.house.bedrooms[beds]?.buyPrice || '',
        suburb.house.bedrooms[beds]?.rentPrice || '',
        suburb.house.yield[beds]?.toFixed(2) || '',
        suburb.dateAdded,
        suburb.lastUpdated || '',
      ])
    })
    
    // Unit data
    ;(['2', '3', '4+'] as BedroomType[]).forEach((beds: BedroomType) => {
      rows.push([
        suburb.suburb,
        suburb.state,
        suburb.postcode,
        suburb.isHot ? 'Yes' : 'No',
        'Unit',
        beds,
        suburb.unit.bedrooms[beds]?.buyPrice || '',
        suburb.unit.bedrooms[beds]?.rentPrice || '',
        suburb.unit.yield[beds]?.toFixed(2) || '',
        suburb.dateAdded,
        suburb.lastUpdated || '',
      ])
    })
  })

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

// Hot suburbs are now stored in the suburb data itself via isHot field
export async function getHotSuburbs(): Promise<string[]> {
  const suburbs = await getSuburbs()
  return suburbs.filter(s => s.isHot).map(s => s.id)
}

export async function addHotSuburb(suburbId: string): Promise<void> {
  const suburbs = await getSuburbs()
  const suburb = suburbs.find(s => s.id === suburbId)
  if (suburb) {
    suburb.isHot = true
    await saveSuburb(suburb)
  }
}

export async function removeHotSuburb(suburbId: string): Promise<void> {
  const suburbs = await getSuburbs()
  const suburb = suburbs.find(s => s.id === suburbId)
  if (suburb) {
    suburb.isHot = false
    await saveSuburb(suburb)
  }
}
