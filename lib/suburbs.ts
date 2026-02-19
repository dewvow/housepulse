import { SuburbListItem, StateCode, AUSTRALIAN_STATES } from './types'
import { getDistanceToCapital } from './capital-distances'

// This will be populated from public/data/suburbs.json
let suburbsCache: SuburbListItem[] | null = null

export async function loadSuburbs(): Promise<SuburbListItem[]> {
  if (suburbsCache) return suburbsCache
  
  try {
    const response = await fetch('/data/suburbs.json')
    if (!response.ok) throw new Error('Failed to load suburbs')
    
    const json = await response.json()
    const data = json.data || json
    const mappedData: SuburbListItem[] = data.map((item: any) => ({
      suburb: item.suburb || item.name || item.locality,
      state: item.state.toUpperCase() as StateCode,
      postcode: String(item.postcode || item.zip || ''),
      sscCode: item.ssc_code,
      lat: item.lat,
      lng: item.lng,
      population: item.population,
      medianIncome: item.median_income
    }))
    
    suburbsCache = mappedData
    return mappedData
  } catch (error) {
    console.error('Error loading suburbs:', error)
    return []
  }
}

export function getSuburbDetails(suburb: string, state: StateCode, postcode: string): SuburbListItem | undefined {
  if (!suburbsCache) return undefined
  return suburbsCache.find(s => 
    s.suburb.toLowerCase() === suburb.toLowerCase() && 
    s.state === state && 
    s.postcode === postcode
  )
}

export function calculateDistance(state: StateCode, lat?: number, lng?: number): number {
  if (!lat || !lng) return 0
  return getDistanceToCapital(state, lat, lng)
}

export function getSuburbsByState(suburbs: SuburbListItem[], state: StateCode): SuburbListItem[] {
  return suburbs.filter(s => s.state === state)
}

export function searchSuburbs(suburbs: SuburbListItem[], query: string): SuburbListItem[] {
  const lowerQuery = query.toLowerCase()
  return suburbs.filter(s => 
    s.suburb.toLowerCase().includes(lowerQuery) ||
    s.postcode.includes(query)
  )
}

export function getStateName(code: StateCode): string {
  const state = AUSTRALIAN_STATES.find(s => s.code === code)
  return state?.name || code
}
