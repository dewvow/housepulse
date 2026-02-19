export const AUSTRALIAN_STATES = [
  { code: 'NSW', name: 'New South Wales' },
  { code: 'VIC', name: 'Victoria' },
  { code: 'QLD', name: 'Queensland' },
  { code: 'WA', name: 'Western Australia' },
  { code: 'SA', name: 'South Australia' },
  { code: 'TAS', name: 'Tasmania' },
  { code: 'ACT', name: 'Australian Capital Territory' },
  { code: 'NT', name: 'Northern Territory' },
] as const

export type StateCode = typeof AUSTRALIAN_STATES[number]['code']

export const BEDROOM_OPTIONS = ['2', '3', '4+'] as const
export type BedroomType = typeof BEDROOM_OPTIONS[number]

export const PROPERTY_TYPES = ['house', 'unit'] as const
export type PropertyType = typeof PROPERTY_TYPES[number]

export interface BedroomPriceData {
  buyPrice: number
  rentPrice: number
}

export interface PropertyData {
  bedrooms: Record<BedroomType, BedroomPriceData>
  yield: Record<BedroomType, number>
}

export interface SuburbDemographics {
  medianIncome: number           // Annual personal income from ABS (weekly * 52)
  medianAge: number               // From ABS C21_G02_POA
  mainLanguage: string            // From ABS C21_G13_POA (top language)
  occupationType: string          // From ABS C21_G60_POA (mapped to broad category)
  censusYear: number              // 2021 (hardcoded for now, future: detect latest)
  source: 'abs-api' | 'fallback'  // Track if data came from live API or fallback
}

export interface SuburbData {
  id: string
  suburb: string
  state: StateCode
  postcode: string
  sscCode?: number
  lat?: number
  lng?: number
  population?: number
  medianIncome?: number
  isHot: boolean
  distanceToCapital: number
  nominatedFor: string[]
  demographics?: SuburbDemographics
  house: PropertyData
  unit: PropertyData
  dateAdded: string
  lastUpdated: string
}

export interface SuburbListItem {
  suburb: string
  state: StateCode
  postcode: string
  sscCode?: number
  lat?: number
  lng?: number
  population?: number
  medianIncome?: number
}

export interface FilterState {
  states: StateCode[]
  bedrooms: BedroomType[]
  propertyTypes: PropertyType[]
  maxPrice: number | null
  minYield: number | null
  hotOnly: boolean
}
