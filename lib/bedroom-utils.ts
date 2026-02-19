import { BedroomType, BedroomPriceData } from './types'

const BEDROOM_TYPES: BedroomType[] = ['2', '3', '4+']

export function forEachBedroom<T>(
  callback: (bedroom: BedroomType, index: number) => T
): T[] {
  return BEDROOM_TYPES.map((bedroom, index) => callback(bedroom, index))
}

export function mapBedrooms<T>(
  mapper: (bedroom: BedroomType) => T
): Record<BedroomType, T> {
  return {
    '2': mapper('2'),
    '3': mapper('3'),
    '4+': mapper('4+'),
  } as Record<BedroomType, T>
}

export function createEmptyBedroomPriceData(): BedroomPriceData {
  return {
    buyPrice: 0,
    rentPrice: 0,
  }
}

export function createEmptyBedroomData(): Record<BedroomType, BedroomPriceData> {
  return {
    '2': createEmptyBedroomPriceData(),
    '3': createEmptyBedroomPriceData(),
    '4+': createEmptyBedroomPriceData(),
  }
}

export function createEmptyYieldData(): Record<BedroomType, number> {
  return {
    '2': 0,
    '3': 0,
    '4+': 0,
  }
}

export function createEmptyPropertyData() {
  return {
    bedrooms: createEmptyBedroomData(),
    yield: createEmptyYieldData(),
  }
}

export function convertOldBedroomFormat(
  oldBedrooms: Record<string, { salePrice?: number; rent?: number }>
): Record<BedroomType, BedroomPriceData> {
  return {
    '2': {
      buyPrice: oldBedrooms['2']?.salePrice || 0,
      rentPrice: oldBedrooms['2']?.rent || 0,
    },
    '3': {
      buyPrice: oldBedrooms['3']?.salePrice || 0,
      rentPrice: oldBedrooms['3']?.rent || 0,
    },
    '4+': {
      buyPrice: oldBedrooms['4+']?.salePrice || 0,
      rentPrice: oldBedrooms['4+']?.rent || 0,
    },
  }
}

export function isBedroomType(value: string): value is BedroomType {
  return BEDROOM_TYPES.includes(value as BedroomType)
}

export function getBedroomLabel(bedroom: BedroomType): string {
  return `${bedroom} bed`
}
