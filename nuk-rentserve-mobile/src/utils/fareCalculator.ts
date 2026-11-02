// Fare calculation engine for Auto, Car Trips, and Goods Van in Karnataka

import { CONFIG } from '../constants/config';

export function calculateAutoFare(km: number): number {
  if (km <= 0) return CONFIG.AUTO_FARE.baseFare;
  const extraKm = Math.max(0, km - CONFIG.AUTO_FARE.baseKm);
  const rawFare = CONFIG.AUTO_FARE.baseFare + extraKm * CONFIG.AUTO_FARE.perKmRate;
  // Round to nearest multiple of 5
  return Math.round(rawFare / CONFIG.AUTO_FARE.roundStep) * CONFIG.AUTO_FARE.roundStep;
}

export function calculateCarTripFare(
  tripType: 'One-day trip' | 'Outstation one-way' | 'Round trip' | 'Airport / station drop',
  passengers: number = 2
): number {
  const baseRates: Record<string, number> = {
    'One-day trip': 2400,
    'Outstation one-way': 3200,
    'Round trip': 4600,
    'Airport / station drop': 1500,
  };
  const base = baseRates[tripType] ?? 2400;
  // Extra seat charge for large SUV if > 4 passengers
  const extraSeatCharge = passengers > 4 ? 600 : 0;
  return base + extraSeatCharge;
}

export function calculateGoodsVanFare(
  vehicleSize: 'Mini van' | 'Pickup truck' | 'Large truck'
): number {
  const rates: Record<string, number> = {
    'Mini van': 650,
    'Pickup truck': 1100,
    'Large truck': 2400,
  };
  return rates[vehicleSize] ?? 650;
}

// Distance calculation between two lat/lng coordinates (Haversine formula in km)
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const rad = (n: number) => (n * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c; // Earth radius in km
}
