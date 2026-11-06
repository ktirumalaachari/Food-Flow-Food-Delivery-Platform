import { getHaversineDistanceKm } from './geofence.utils';

export interface IDistanceResult {
  distanceKm: number;
  distanceText: string;
}

/**
 * Calculate distance between restaurant and user coordinates.
 * Returns distanceKm and formatted distanceText (e.g., "1.2 km" or "850 m").
 */
export function calculateRestaurantDistance(
  restaurant: any,
  userLat?: number,
  userLng?: number
): IDistanceResult {
  if (
    userLat === undefined ||
    userLng === undefined ||
    !Number.isFinite(userLat) ||
    !Number.isFinite(userLng)
  ) {
    return {
      distanceKm: 0,
      distanceText: '',
    };
  }

  const restLat = Number(
    restaurant?.coordinates?.latitude ??
    restaurant?.address?.coordinates?.latitude ??
    restaurant?.address?.latitude ??
    restaurant?.latitude
  );

  const restLng = Number(
    restaurant?.coordinates?.longitude ??
    restaurant?.address?.coordinates?.longitude ??
    restaurant?.address?.longitude ??
    restaurant?.longitude
  );

  if (!Number.isFinite(restLat) || !Number.isFinite(restLng)) {
    return {
      distanceKm: 0,
      distanceText: '',
    };
  }

  const distanceKm = getHaversineDistanceKm(userLat, userLng, restLat, restLng);

  let distanceText = '';
  if (distanceKm < 1) {
    distanceText = `${Math.round(distanceKm * 1000)} m`;
  } else {
    distanceText = `${distanceKm.toFixed(1)} km`;
  }

  return {
    distanceKm,
    distanceText,
  };
}
