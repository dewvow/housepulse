import { z } from 'zod'
import { AUSTRALIAN_STATES, BEDROOM_OPTIONS, PROPERTY_TYPES } from './types'

const stateCodes = AUSTRALIAN_STATES.map(s => s.code) as unknown as [string, ...string[]]
const bedroomTypes = BEDROOM_OPTIONS as unknown as [string, ...string[]]
const propertyTypeValues = PROPERTY_TYPES as unknown as [string, ...string[]]

// Bedroom price data schema
export const BedroomPriceDataSchema = z.object({
  buyPrice: z.number().min(0).default(0),
  rentPrice: z.number().min(0).default(0),
})

// Property data schema (house or unit)
export const PropertyDataSchema = z.object({
  bedrooms: z.record(
    z.enum(bedroomTypes),
    BedroomPriceDataSchema
  ),
  yield: z.record(
    z.enum(bedroomTypes),
    z.number().min(0).default(0)
  ),
})

// Suburb data schema
export const SuburbDataSchema = z.object({
  id: z.string().min(1),
  suburb: z.string().min(1),
  state: z.enum(stateCodes),
  postcode: z.string().min(1),
  isHot: z.boolean().default(false),
  house: PropertyDataSchema,
  unit: PropertyDataSchema,
  dateAdded: z.string().datetime().or(z.string()),
  lastUpdated: z.string().datetime().or(z.string()),
})

// Filter state schema
export const FilterStateSchema = z.object({
  states: z.array(z.enum(stateCodes)).default([]),
  bedrooms: z.array(z.enum(bedroomTypes)).default([]),
  propertyTypes: z.array(z.enum(propertyTypeValues)).default([]),
  maxPrice: z.number().min(0).nullable().default(null),
  minYield: z.number().min(0).nullable().default(null),
  hotOnly: z.boolean().default(false),
})

// Old format bedroom data (for migration)
export const OldBedroomDataSchema = z.object({
  salePrice: z.number().min(0).optional(),
  rent: z.number().min(0).optional(),
})

// Old format data schema (for migration)
export const OldSuburbDataSchema = z.object({
  id: z.string().optional(),
  suburb: z.string().min(1),
  state: z.string().min(1),
  postcode: z.string().min(1),
  isHot: z.boolean().optional(),
  bedrooms: z.record(z.string(), OldBedroomDataSchema).optional(),
})

// New format from bookmarklet
export const BookmarkletDataSchema = z.object({
  suburb: z.string().min(1),
  state: z.string().min(1),
  postcode: z.string().min(1),
  isHot: z.boolean().optional(),
  house: PropertyDataSchema.optional(),
  unit: PropertyDataSchema.optional(),
})

// Type exports
export type ValidatedSuburbData = z.infer<typeof SuburbDataSchema>
export type ValidatedPropertyData = z.infer<typeof PropertyDataSchema>
export type ValidatedBedroomPriceData = z.infer<typeof BedroomPriceDataSchema>
export type ValidatedFilterState = z.infer<typeof FilterStateSchema>

// Validation helpers
export function validateSuburbData(data: unknown): { success: true; data: ValidatedSuburbData } | { success: false; error: string } {
  const result = SuburbDataSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error.issues.map((e: z.ZodIssue) => e.message).join(', ') }
}

export function validateBookmarkletData(data: unknown): { success: true; data: z.infer<typeof BookmarkletDataSchema> } | { success: false; error: string } {
  const result = BookmarkletDataSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error.issues.map((e: z.ZodIssue) => e.message).join(', ') }
}

export function isOldFormat(data: unknown): boolean {
  const result = OldSuburbDataSchema.safeParse(data)
  return result.success && 'bedrooms' in result.data && !('house' in result.data)
}
