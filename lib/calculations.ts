import { BedroomType, SuburbData, PropertyData, BedroomPriceData } from './types'

export function calculateYield(weeklyRent: number, salePrice: number): number {
  if (salePrice <= 0) return 0
  const annualRent = weeklyRent * 52
  return (annualRent / salePrice) * 100
}

export function calculatePropertyYields(bedrooms: Record<BedroomType, BedroomPriceData>): Record<BedroomType, number> {
  return {
    '2': calculateYield(bedrooms['2'].rentPrice, bedrooms['2'].buyPrice),
    '3': calculateYield(bedrooms['3'].rentPrice, bedrooms['3'].buyPrice),
    '4+': calculateYield(bedrooms['4+'].rentPrice, bedrooms['4+'].buyPrice),
  }
}

export function calculateAllYields(houseBedrooms: Record<BedroomType, BedroomPriceData>, unitBedrooms: Record<BedroomType, BedroomPriceData>) {
  return {
    house: calculatePropertyYields(houseBedrooms),
    unit: calculatePropertyYields(unitBedrooms),
  }
}

export function formatCurrency(value: number): string {
  return `$${value.toLocaleString()}`
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

export function parseReaPrice(text: string): number {
  if (!text) return 0
  // Handle formats like "$850k", "$1.2m", "$850,000", "850k"
  const match = text.match(/\$?([\d.,]+)\s*(k|m)?/i)
  if (!match) return 0
  
  let num = parseFloat(match[1].replace(/,/g, ''))
  const unit = (match[2] || '').toLowerCase()
  
  if (unit === 'k') num *= 1000
  if (unit === 'm') num *= 1000000
  
  return num
}

export function parseReaRent(text: string): number {
  if (!text) return 0
  // Handle formats like "$650", "$650 pw", "$650/week", "650"
  const match = text.match(/\$?([\d,]+)/)
  if (!match) return 0
  return parseInt(match[1].replace(/,/g, ''), 10)
}
