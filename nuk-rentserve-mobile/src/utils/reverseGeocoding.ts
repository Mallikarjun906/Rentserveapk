// Accurate Karnataka GPS Reverse Geocoding & Coordinate Resolver
// Corrects Android British/Revenue Division mapping (e.g. Belagavi Division overriding Jamkhandi)

import * as Location from 'expo-location';

export interface GeocodedLocationResult {
  town: string;
  district: string;
  state: string;
  formattedAddress: string;
  coords: { latitude: number; longitude: number };
  postalCode?: string;
  isAccurate: boolean;
}

// Distance in kilometers using Haversine formula
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
}

// Known Karnataka Taluks and Town Centers for precise North Karnataka matching
interface KarnatakaTownProfile {
  name: string;
  district: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  postalCodes: string[];
}

const KARNATAKA_TOWNS: KarnatakaTownProfile[] = [
  {
    name: 'Jamkhandi',
    district: 'Bagalkot',
    latitude: 16.505,
    longitude: 75.295,
    radiusKm: 22,
    postalCodes: ['587301', '587302', '587330'],
  },
  {
    name: 'Mudhol',
    district: 'Bagalkot',
    latitude: 16.34,
    longitude: 75.285,
    radiusKm: 18,
    postalCodes: ['587313'],
  },
  {
    name: 'Bilgi',
    district: 'Bagalkot',
    latitude: 16.345,
    longitude: 75.618,
    radiusKm: 16,
    postalCodes: ['587116'],
  },
  {
    name: 'Bagalkot',
    district: 'Bagalkot',
    latitude: 16.1853,
    longitude: 75.6968,
    radiusKm: 20,
    postalCodes: ['587101', '587102', '587103'],
  },
  {
    name: 'Badami',
    district: 'Bagalkot',
    latitude: 15.918,
    longitude: 75.679,
    radiusKm: 18,
    postalCodes: ['587201'],
  },
  {
    name: 'Ilkal',
    district: 'Bagalkot',
    latitude: 15.962,
    longitude: 76.13,
    radiusKm: 16,
    postalCodes: ['587125'],
  },
  {
    name: 'Guledgudda',
    district: 'Bagalkot',
    latitude: 16.053,
    longitude: 75.875,
    radiusKm: 14,
    postalCodes: ['587203'],
  },
  {
    name: 'Hunagund',
    district: 'Bagalkot',
    latitude: 16.061,
    longitude: 76.058,
    radiusKm: 16,
    postalCodes: ['587118'],
  },
  {
    name: 'Vijayapura',
    district: 'Vijayapura',
    latitude: 16.83,
    longitude: 75.71,
    radiusKm: 25,
    postalCodes: ['586101', '586102', '586103', '586104'],
  },
  {
    name: 'Belagavi',
    district: 'Belagavi',
    latitude: 15.8497,
    longitude: 74.4977,
    radiusKm: 30,
    postalCodes: ['590001', '590002', '590003', '590016'],
  },
  {
    name: 'Hubballi',
    district: 'Dharwad',
    latitude: 15.3647,
    longitude: 75.124,
    radiusKm: 22,
    postalCodes: ['580020', '580021', '580024', '580028'],
  },
  {
    name: 'Dharwad',
    district: 'Dharwad',
    latitude: 15.4589,
    longitude: 75.0078,
    radiusKm: 20,
    postalCodes: ['580001', '580007', '580008'],
  },
  {
    name: 'Gadag',
    district: 'Gadag',
    latitude: 15.4167,
    longitude: 75.6167,
    radiusKm: 20,
    postalCodes: ['582101', '582102', '582103'],
  },
];

const BELAGAVI_CENTER = { latitude: 15.8497, longitude: 74.4977 };

/**
 * Cleanly resolves coordinates and reverse geocode result into true town, district, and address.
 * Never allows Belagavi Division to override Jamkhandi or other Bagalkot taluks.
 */
export function resolveKarnatakaLocation(
  coords: { latitude: number; longitude: number },
  reverseResult?: Location.LocationGeocodedAddress | null
): GeocodedLocationResult {
  const { latitude, longitude } = coords;

  const rawName = String(reverseResult?.name || '').trim();
  const rawStreet = String(reverseResult?.street || '').trim();
  const rawCity = String(reverseResult?.city || '').trim();
  const rawDistrict = String(reverseResult?.district || '').trim();
  const rawSubregion = String(reverseResult?.subregion || '').trim();
  const rawRegion = String(reverseResult?.region || '').trim();
  const postalCode = String(reverseResult?.postalCode || '').trim();

  // 1. Distance check from Belagavi City Center
  const distFromBelagavi = haversineDistanceKm(
    latitude,
    longitude,
    BELAGAVI_CENTER.latitude,
    BELAGAVI_CENTER.longitude
  );

  // If user is more than 40 km from Belagavi city, discard any Belagavi subregion or city label
  const isFarFromBelagavi = distFromBelagavi > 40;
  const isBelagaviString = (s: string) =>
    /belagavi|belgaum/i.test(s) && (s.toLowerCase().includes('division') || isFarFromBelagavi);

  // 2. Check postal code match against known Karnataka profiles
  if (postalCode) {
    const matchedByPin = KARNATAKA_TOWNS.find((t) =>
      t.postalCodes.includes(postalCode)
    );
    if (matchedByPin) {
      const parts = [
        rawName !== matchedByPin.name ? rawName : '',
        rawStreet !== matchedByPin.name ? rawStreet : '',
        matchedByPin.name,
        matchedByPin.district,
        postalCode,
      ]
        .filter(Boolean)
        .join(', ');

      return {
        town: matchedByPin.name,
        district: matchedByPin.district,
        state: 'Karnataka',
        formattedAddress: parts || `${matchedByPin.name}, ${matchedByPin.district}, Karnataka`,
        coords,
        postalCode,
        isAccurate: true,
      };
    }
  }

  // 3. Check text fields for exact town keywords (e.g. "Jamkhandi" or "Jamakhandi")
  const allText = `${rawName} ${rawStreet} ${rawCity} ${rawDistrict} ${rawSubregion}`.toLowerCase();

  for (const town of KARNATAKA_TOWNS) {
    // If user is far from Belagavi, never match the Belagavi Revenue Division label as Belagavi town
    if (town.name === 'Belagavi' && isFarFromBelagavi) {
      continue;
    }

    const townLower = town.name.toLowerCase();
    const aliasLower = town.name === 'Jamkhandi' ? 'jamakhandi' : townLower;

    if (allText.includes(townLower) || allText.includes(aliasLower)) {
      const addressParts = [
        rawName && !rawName.toLowerCase().includes(townLower) ? rawName : '',
        rawStreet && !rawStreet.toLowerCase().includes(townLower) ? rawStreet : '',
        town.name,
        town.district,
        postalCode,
      ]
        .filter(Boolean)
        .join(', ');

      return {
        town: town.name,
        district: town.district,
        state: 'Karnataka',
        formattedAddress: addressParts || `${town.name}, ${town.district}, Karnataka`,
        coords,
        postalCode: postalCode || undefined,
        isAccurate: true,
      };
    }
  }

  // 4. Coordinate proximity check against known town profiles
  let closestTown: KarnatakaTownProfile | null = null;
  let minDistance = Infinity;

  for (const town of KARNATAKA_TOWNS) {
    const dist = haversineDistanceKm(
      latitude,
      longitude,
      town.latitude,
      town.longitude
    );
    if (dist <= town.radiusKm && dist < minDistance) {
      minDistance = dist;
      closestTown = town;
    }
  }

  if (closestTown) {
    const filteredName = isBelagaviString(rawName) ? '' : rawName;
    const filteredStreet = isBelagaviString(rawStreet) ? '' : rawStreet;

    const parts = [
      filteredName,
      filteredStreet,
      closestTown.name,
      closestTown.district,
      postalCode,
    ]
      .filter(Boolean)
      .join(', ');

    return {
      town: closestTown.name,
      district: closestTown.district,
      state: 'Karnataka',
      formattedAddress: parts || `${closestTown.name}, ${closestTown.district}, Karnataka`,
      coords,
      postalCode: postalCode || undefined,
      isAccurate: true,
    };
  }

  // 5. Generic geocoding extraction (filtering out invalid Belagavi Division override)
  const candidateCity = !isBelagaviString(rawCity) ? rawCity : '';
  const candidateDistrict = !isBelagaviString(rawDistrict) ? rawDistrict : '';
  const candidateSubregion = !isBelagaviString(rawSubregion) ? rawSubregion : '';

  const detectedTown = candidateCity || candidateDistrict || candidateSubregion || 'Bagalkot';
  const detectedDistrict = candidateDistrict || (detectedTown === 'Jamkhandi' ? 'Bagalkot' : candidateSubregion || 'Bagalkot');

  const parts = [
    rawName,
    rawStreet,
    detectedTown,
    detectedDistrict !== detectedTown ? detectedDistrict : '',
    postalCode,
  ]
    .filter(Boolean)
    .join(', ');

  return {
    town: detectedTown,
    district: detectedDistrict,
    state: rawRegion || 'Karnataka',
    formattedAddress: parts || `${detectedTown}, Karnataka`,
    coords,
    postalCode: postalCode || undefined,
    isAccurate: false,
  };
}

/**
 * Requests location permission and retrieves current accurate GPS coordinates and geocoded locality.
 */
export async function getAccurateDeviceLocation(): Promise<{
  success: boolean;
  result?: GeocodedLocationResult;
  error?: string;
  status: 'granted' | 'denied' | 'disabled';
}> {
  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      return {
        success: false,
        status: 'disabled',
        error: 'Location services are disabled on your device. Please enable GPS in device settings.',
      };
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        success: false,
        status: 'denied',
        error: 'Location permission was denied. Please select your town manually or enable permission in app settings.',
      };
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    if (!position?.coords) {
      return {
        success: false,
        status: 'granted',
        error: 'Could not obtain GPS coordinates from device hardware.',
      };
    }

    const coords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    let reverseResult: Location.LocationGeocodedAddress | null = null;
    try {
      const results = await Location.reverseGeocodeAsync(coords);
      if (results && results.length > 0) {
        reverseResult = results[0];
      }
    } catch {
      // Reverse geocode failed silently; coords are still valid
    }

    const locationResult = resolveKarnatakaLocation(coords, reverseResult);

    return {
      success: true,
      status: 'granted',
      result: locationResult,
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'denied',
      error: err.message || 'Error occurred while detecting GPS location.',
    };
  }
}
