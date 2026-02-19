import { SuburbData, BedroomType, PropertyType, FilterState } from './types'
import { CSV, PROPERTY_TYPES as PROPERTY_TYPE_VALUES } from './constants'
import { forEachBedroom } from './bedroom-utils'

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
  const hasActiveFilters =
    filters.states.length > 0 ||
    filters.bedrooms.length > 0 ||
    filters.propertyTypes.length > 0 ||
    filters.maxPrice !== null ||
    filters.minYield !== null ||
    filters.hotOnly

  if (!hasActiveFilters) {
    return suburbs
  }

  return suburbs.filter(suburb => {
    if (suburb.isHot && filters.hotOnly) {
      return true
    }

    if (!suburb.house || !suburb.unit) {
      return false
    }

    if (filters.states.length > 0 && !filters.states.includes(suburb.state)) {
      return false
    }

    if (filters.hotOnly && !suburb.isHot) {
      return false
    }

    const propertyTypes = filters.propertyTypes.length > 0 
      ? filters.propertyTypes 
      : PROPERTY_TYPE_VALUES
    const bedroomValues = filters.bedrooms.length > 0 
      ? filters.bedrooms 
      : (['2', '3', '4+'] as BedroomType[])

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
  const rows: (string | number)[][] = []
  
  suburbs.forEach(suburb => {
    if (!suburb.house || !suburb.unit) {
      console.warn('Skipping suburb in CSV export - missing house/unit data:', suburb.suburb)
      return
    }

    const hotValue = suburb.isHot ? CSV.HOT_YES : CSV.HOT_NO

    PROPERTY_TYPE_VALUES.forEach(propType => {
      forEachBedroom((beds) => {
        const propData = suburb[propType]
        rows.push([
          suburb.suburb,
          suburb.state,
          suburb.postcode,
          hotValue,
          propType,
          beds,
          propData.bedrooms[beds]?.buyPrice || '',
          propData.bedrooms[beds]?.rentPrice || '',
          propData.yield[beds]?.toFixed(2) || '',
          suburb.dateAdded,
          suburb.lastUpdated || '',
        ])
      })
    })
  })

  return [CSV.HEADERS, ...rows].map(row => row.join(',')).join('\n')
}

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
