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

export interface BedroomData {
  salePrice: number
  rent: number
}

export interface SuburbData {
  id: string
  suburb: string
  state: StateCode
  postcode: string
  isHot: boolean
  bedrooms: Record<BedroomType, BedroomData>
  yield: Record<BedroomType, number>
  dateAdded: string
}

export interface SuburbListItem {
  suburb: string
  state: StateCode
  postcode: string
}

export interface FilterState {
  states: StateCode[]
  bedrooms: BedroomType[]
  maxPrice: number | null
  minYield: number | null
  hotOnly: boolean
}
