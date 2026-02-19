import { SuburbDemographics } from './types'

// In-memory cache for demographics data
const DEMOGRAPHICS_CACHE: Map<string, SuburbDemographics> = new Map()

// ABS Census API base URL
const ABS_API_BASE = 'https://data.api.abs.gov.au/rest/data'

// Census 2021 DataPack lookups (loaded on first use)
let LANGUAGE_LOOKUP: Record<string, string> | null = null
let OCCUPATION_LOOKUP: Record<string, string> | null = null

/**
 * Load language lookup from pre-processed Census DataPack
 */
async function loadLanguageLookup(): Promise<Record<string, string>> {
  if (LANGUAGE_LOOKUP !== null) return LANGUAGE_LOOKUP
  
  try {
    const response = await fetch('/data/census-language.json')
    if (!response.ok) throw new Error('Failed to load language data')
    const data = await response.json()
    LANGUAGE_LOOKUP = data
    return data
  } catch (error) {
    console.error('Failed to load language lookup:', error)
    LANGUAGE_LOOKUP = {}
    return {}
  }
}

/**
 * Load occupation lookup from pre-processed Census DataPack
 */
async function loadOccupationLookup(): Promise<Record<string, string>> {
  if (OCCUPATION_LOOKUP !== null) return OCCUPATION_LOOKUP
  
  try {
    const response = await fetch('/data/census-occupation.json')
    if (!response.ok) throw new Error('Failed to load occupation data')
    const data = await response.json()
    OCCUPATION_LOOKUP = data
    return data
  } catch (error) {
    console.error('Failed to load occupation lookup:', error)
    OCCUPATION_LOOKUP = {}
    return {}
  }
}

// SDMX-JSON response structure for G02 (median age/income)
interface SDMXResponse {
  data: {
    dataSets: Array<{
      series?: Record<string, {
        observations: Record<string, [number]>
      }>
    }>
    structures: Array<{
      dimensions: {
        series: Array<{
          id: string
          values: Array<{
            id: string
            name: string
            order?: number
          }>
        }>
      }
    }>
  }
}

/**
 * Parse SDMX-JSON response to extract a specific metric value
 */
function parseSDMXValue(response: SDMXResponse, targetMetricId: string): number | null {
  const dataSets = response.data.dataSets[0]
  if (!dataSets || !dataSets.series) return null

  const structure = response.data.structures[0]
  const metricDimension = structure.dimensions.series[0] // First dimension is always the metric (MEDAVG)

  if (!metricDimension) return null

  // Find the index of our target metric in the dimension values
  const targetIndex = metricDimension.values.findIndex(v => v.id === targetMetricId)
  if (targetIndex === -1) return null

  // Find series where first dimension (metric) matches our target
  for (const [seriesKey, seriesData] of Object.entries(dataSets.series)) {
    const dimensions = seriesKey.split(':')
    const metricIndex = parseInt(dimensions[0])

    if (metricIndex === targetIndex) {
      const observation = Object.values(seriesData.observations)[0]
      return observation?.[0] ?? null
    }
  }

  return null
}

/**
 * Fetch median age and median income from C21_G02_POA
 */
async function fetchMediansFromG02(postcode: string): Promise<{
  medianAge: number | null
  medianWeeklyIncome: number | null
}> {
  try {
    const url = `${ABS_API_BASE}/C21_G02_POA/1+2.${postcode}...2021?format=jsondata`
    const response = await fetch(url, {
      headers: { 'Accept': 'application/vnd.sdmx.data+json' }
    })

    if (!response.ok) {
      throw new Error(`ABS API error: ${response.status}`)
    }

    const data: SDMXResponse = await response.json()

    return {
      medianAge: parseSDMXValue(data, '1'), // Code 1 = median age of persons
      medianWeeklyIncome: parseSDMXValue(data, '2') // Code 2 = median total personal income ($/weekly)
    }
  } catch (error) {
    console.error('Failed to fetch from C21_G02_POA:', error)
    return { medianAge: null, medianWeeklyIncome: null }
  }
}

/**
 * Get main language from pre-processed Census DataPack
 */
async function getLanguageForPostcode(postcode: string): Promise<string | null> {
  const lookup = await loadLanguageLookup()
  return lookup[postcode] || null
}

/**
 * Get main occupation from pre-processed Census DataPack
 */
async function getOccupationForPostcode(postcode: string): Promise<string | null> {
  const lookup = await loadOccupationLookup()
  return lookup[postcode] || null
}

/**
 * Fetch demographics from ABS Census 2021 API using postcode
 * 
 * @param sscCode - State Suburb Code (not used, kept for backwards compatibility)
 * @param postcode - Postcode to query (used for POA queries)
 * @param medianIncome - Not used (we fetch from API)
 * @param population - Not used (we fetch from API)
 * @returns SuburbDemographics from ABS Census API or null if failed
 */
export async function fetchDemographics(
  sscCode: number,
  postcode: string,
  medianIncome?: number,
  population?: number
): Promise<SuburbDemographics | undefined> {
  // Check cache first (use postcode as key since that's what we query)
  const cacheKey = `poa_${postcode}`
  if (DEMOGRAPHICS_CACHE.has(cacheKey)) {
    return DEMOGRAPHICS_CACHE.get(cacheKey)!
  }

  try {
    // Fetch medians from API and language/occupation from pre-processed data
    const [g02Data, language, occupation] = await Promise.all([
      fetchMediansFromG02(postcode),
      getLanguageForPostcode(postcode),
      getOccupationForPostcode(postcode)
    ])

    // If we got at least median age and income from G02, consider it success
    if (g02Data.medianAge !== null && g02Data.medianWeeklyIncome !== null) {
      const demographics: SuburbDemographics = {
        medianIncome: g02Data.medianWeeklyIncome * 52, // Convert weekly to annual
        medianAge: g02Data.medianAge,
        mainLanguage: language || 'Not available',
        occupationType: occupation || 'Not available',
        censusYear: 2021,
        source: 'abs-api'
      }

      DEMOGRAPHICS_CACHE.set(cacheKey, demographics)
      return demographics
    }

    // If ABS API failed, return undefined (no derived fallback)
    return undefined

  } catch (error) {
    console.error(`Failed to fetch demographics for postcode ${postcode}:`, error)
    return undefined
  }
}

/**
 * Clear the in-memory demographics cache
 */
export function clearDemographicsCache(): void {
  DEMOGRAPHICS_CACHE.clear()
}
