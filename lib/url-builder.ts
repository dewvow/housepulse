import { URLS } from './constants'

export function buildReaSuburbUrl(suburb: string, state: string, postcode: string): string {
  return URLS.getReaSuburbUrl(suburb, state, postcode)
}

export function buildReaSearchUrl(suburb: string, state: string): string {
  const encodedSuburb = encodeURIComponent(suburb)
  return `https://www.realestate.com.au/buy/property-${encodedSuburb}-in-${state.toLowerCase()}/list-1`
}

export function buildReaRentUrl(suburb: string, state: string): string {
  const encodedSuburb = encodeURIComponent(suburb)
  return `https://www.realestate.com.au/rent/property-${encodedSuburb}-in-${state.toLowerCase()}/list-1`
}

export function buildGoogleMapsUrl(suburb: string, state: string, postcode: string): string {
  const encoded = encodeURIComponent(`${suburb}, ${state}, ${postcode}`)
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`
}
