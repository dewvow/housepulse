'use client'

import { SuburbData, StateCode, BedroomType, FilterState } from './types'

const STORAGE_KEY = 'housepulse_suburbs'
const HOT_STORAGE_KEY = 'housepulse_hot_suburbs'

export function getSuburbs(): SuburbData[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

export function saveSuburb(suburb: SuburbData): void {
  const suburbs = getSuburbs()
  const existingIndex = suburbs.findIndex(s => s.id === suburb.id)
  if (existingIndex >= 0) {
    suburbs[existingIndex] = suburb
  } else {
    suburbs.push(suburb)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(suburbs))
}

export function deleteSuburb(id: string): void {
  const suburbs = getSuburbs().filter(s => s.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(suburbs))
}

export function clearAllSuburbs(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function getHotSuburbs(): string[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(HOT_STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

export function addHotSuburb(suburbId: string): void {
  const hot = new Set(getHotSuburbs())
  hot.add(suburbId)
  localStorage.setItem(HOT_STORAGE_KEY, JSON.stringify(Array.from(hot)))
}

export function removeHotSuburb(suburbId: string): void {
  const hot = new Set(getHotSuburbs())
  hot.delete(suburbId)
  localStorage.setItem(HOT_STORAGE_KEY, JSON.stringify(Array.from(hot)))
}

export function filterSuburbs(
  suburbs: SuburbData[],
  filters: FilterState
): SuburbData[] {
  return suburbs.filter(suburb => {
    if (filters.states.length > 0 && !filters.states.includes(suburb.state)) {
      return false
    }

    if (filters.hotOnly && !suburb.isHot) {
      return false
    }

    const bedroomValues = filters.bedrooms.length > 0 ? filters.bedrooms : (['2', '3', '4+'] as BedroomType[])

    const hasMatchingBedroom = bedroomValues.some(beds => {
      const price = suburb.bedrooms[beds]?.salePrice || 0
      const yieldVal = suburb.yield[beds] || 0

      const priceMatch = !filters.maxPrice || price <= filters.maxPrice
      const yieldMatch = !filters.minYield || yieldVal >= filters.minYield

      return priceMatch && yieldMatch
    })

    return hasMatchingBedroom
  })
}

export function exportToCSV(suburbs: SuburbData[]): string {
  const headers = ['Suburb', 'State', 'Postcode', 'Hot', 'Beds', 'Sale Price', 'Weekly Rent', 'Yield %', 'Date Added']
  const rows = suburbs.flatMap(suburb =>
    (['2', '3', '4+'] as BedroomType[]).map(beds => [
      suburb.suburb,
      suburb.state,
      suburb.postcode,
      suburb.isHot ? 'Yes' : 'No',
      beds,
      suburb.bedrooms[beds]?.salePrice || '',
      suburb.bedrooms[beds]?.rent || '',
      suburb.yield[beds]?.toFixed(2) || '',
      suburb.dateAdded,
    ])
  )

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}
