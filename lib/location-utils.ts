/**
 * Location and distance calculation utilities for GeoContacts
 */

import type { LocationCoordinates, DistanceResult } from '@/shared/types';

const EARTH_RADIUS_KM = 6371;
const EARTH_RADIUS_MILES = 3959;

/**
 * Calculate distance between two geographic points using Haversine formula
 * @param lat1 - Latitude of first point in degrees
 * @param lon1 - Longitude of first point in degrees
 * @param lat2 - Latitude of second point in degrees
 * @param lon2 - Longitude of second point in degrees
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Calculate distance between two coordinate objects
 */
export function getDistance(
  from: LocationCoordinates,
  to: LocationCoordinates
): number {
  return calculateHaversineDistance(
    from.latitude,
    from.longitude,
    to.latitude,
    to.longitude
  );
}

/**
 * Calculate bearing (direction) between two points
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLon = toRad(lon2 - lon1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

  const bearing = Math.atan2(y, x);
  return (toDeg(bearing) + 360) % 360;
}

/**
 * Get comprehensive distance and bearing information
 */
export function getDistanceAndBearing(
  from: LocationCoordinates,
  to: LocationCoordinates
): DistanceResult {
  return {
    distance: getDistance(from, to),
    bearing: calculateBearing(
      from.latitude,
      from.longitude,
      to.latitude,
      to.longitude
    ),
  };
}

/**
 * Check if a point is within a radius of another point
 */
export function isWithinRadius(
  center: LocationCoordinates,
  point: LocationCoordinates,
  radiusKm: number
): boolean {
  return getDistance(center, point) <= radiusKm;
}

/**
 * Filter locations within a radius
 */
export function filterByRadius(
  center: LocationCoordinates,
  locations: LocationCoordinates[],
  radiusKm: number
): LocationCoordinates[] {
  return locations.filter((location) =>
    isWithinRadius(center, location, radiusKm)
  );
}

/**
 * Sort locations by distance from a center point
 */
export function sortByDistance(
  center: LocationCoordinates,
  locations: LocationCoordinates[]
): LocationCoordinates[] {
  return [...locations].sort(
    (a, b) => getDistance(center, a) - getDistance(center, b)
  );
}

/**
 * Format distance for display
 */
export function formatDistance(
  distanceKm: number,
  unit: 'km' | 'mi' = 'km'
): string {
  if (unit === 'mi') {
    const distanceMi = distanceKm * 0.621371;
    return distanceMi < 1 ? '< 1 mi' : `${distanceMi.toFixed(1)} mi`;
  }
  return distanceKm < 1 ? '< 1 km' : `${distanceKm.toFixed(1)} km`;
}

/**
 * Get direction name from bearing
 */
export function getDirectionName(bearing: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(bearing / 22.5) % 16;
  return directions[index];
}

/**
 * Calculate the center point between multiple coordinates
 */
export function calculateCenterPoint(
  locations: LocationCoordinates[]
): LocationCoordinates {
  if (locations.length === 0) {
    return { latitude: 0, longitude: 0 };
  }

  let sumLat = 0;
  let sumLon = 0;

  locations.forEach((loc) => {
    sumLat += loc.latitude;
    sumLon += loc.longitude;
  });

  return {
    latitude: sumLat / locations.length,
    longitude: sumLon / locations.length,
  };
}

/**
 * Validate coordinates
 */
export function isValidCoordinates(
  latitude: number,
  longitude: number
): boolean {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
function toDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}
