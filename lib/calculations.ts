import { BedroomType, SuburbData, BedroomData } from './types'

export function calculateYield(weeklyRent: number, salePrice: number): number {
  if (salePrice <= 0) return 0
  const annualRent = weeklyRent * 52
  return (annualRent / salePrice) * 100
}

export function calculateAllYields(bedrooms: Record<BedroomType, BedroomData>): Record<BedroomType, number> {
  return {
    '2': calculateYield(bedrooms['2'].rent, bedrooms['2'].salePrice),
    '3': calculateYield(bedrooms['3'].rent, bedrooms['3'].salePrice),
    '4+': calculateYield(bedrooms['4+'].rent, bedrooms['4+'].salePrice),
  }
}

export function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`
  }
  return `$${(value / 1000).toFixed(0)}K`
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`
}

export function generateSuburbId(suburb: string, state: string, postcode: string): string {
  return `${suburb.toLowerCase().replace(/\s+/g, '-')}-${postcode}-${state.toLowerCase()}`
}

export function parsePriceString(priceStr: string): number {
  const cleaned = priceStr.replace(/[$,\s]/g, '').toUpperCase()
  const multiplier = cleaned.includes('M') ? 1000000 : cleaned.includes('K') ? 1000 : 1
  const num = parseFloat(cleaned.replace(/[MK]/g, ''))
  return num * multiplier
}
