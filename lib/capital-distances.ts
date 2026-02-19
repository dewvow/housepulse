import { StateCode } from './types'

interface CapitalCoordinates {
  lat: number
  lng: number
}

const STATE_CAPITALS: Record<StateCode, CapitalCoordinates> = {
  NSW: { lat: -33.8688, lng: 151.2093 },
  VIC: { lat: -37.8136, lng: 144.9631 },
  QLD: { lat: -27.4698, lng: 153.0251 },
  WA: { lat: -31.9505, lng: 115.8605 },
  SA: { lat: -34.9285, lng: 138.6007 },
  TAS: { lat: -42.8821, lng: 147.3272 },
  ACT: { lat: -35.2809, lng: 149.1300 },
  NT: { lat: -12.4634, lng: 130.8456 },
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function getDistanceToCapital(state: StateCode, lat: number, lng: number): number {
  const capital = STATE_CAPITALS[state]
  if (!capital) return 0
  return Math.round(haversineDistance(lat, lng, capital.lat, capital.lng) * 10) / 10
}

export function getCapitalCoordinates(state: StateCode): CapitalCoordinates | undefined {
  return STATE_CAPITALS[state]
}
