import { CAMPUS_CENTER, CAMPUS_RADIUS_METERS } from '@/lib/constants'

const EARTH_RADIUS_METERS = 6_371_000

function toRadians(value: number): number {
  return (value * Math.PI) / 180
}

export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function isWithinCampusBoundary(latitude: number, longitude: number): boolean {
  const distance = haversineDistanceMeters(
    latitude,
    longitude,
    CAMPUS_CENTER.latitude,
    CAMPUS_CENTER.longitude,
  )
  return distance <= CAMPUS_RADIUS_METERS
}
