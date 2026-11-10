
// NUK RentServe System Configuration & Defaults

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Production backend URL
export const PROD_API_BASE_URL =
  'https://rentserveapk.onrender.com/api/v1';

export function resolveApiBaseUrl(): string {
  // 1. If explicit local development is requested via environment variable, use local backend
  if (process.env.EXPO_PUBLIC_USE_LOCAL_BACKEND === 'true') {
    return 'http://localhost:5000/api/v1';
  }

  // 2. If explicit custom URL is provided via environment variable, sanitize and use it
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (
    envUrl &&
    envUrl.trim().length > 0 &&
    !envUrl.includes('localhost') &&
    !envUrl.includes('127.0.0.1') &&
    !envUrl.includes('10.0.2.2')
  ) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // 3. If explicit manifest extra apiUrl is provided, sanitize and use it
  const manifestApiUrl = Constants.expoConfig?.extra?.apiUrl;
  if (
    manifestApiUrl &&
    !manifestApiUrl.includes('localhost') &&
    !manifestApiUrl.includes('127.0.0.1') &&
    !manifestApiUrl.includes('10.0.2.2')
  ) {
    return manifestApiUrl.replace(/\/+$/, '');
  }

  // 4. Safe default: Always use the live production Render backend across all devices & platforms
  return PROD_API_BASE_URL;
}

export const CONFIG = {
  API_BASE_URL: resolveApiBaseUrl(),

  // App Details
  APP_NAME: 'NUK RentServe',
  APP_VERSION: '1.0.0',
  TERMS_VERSION: 'v2.1',

  // Default Location
  DEFAULT_LOCATION: {
    latitude: 16.1853,
    longitude: 75.6968,
    name: 'Bagalkot, Karnataka',
  },

  // Auto Fare Formula
  AUTO_FARE: {
    baseFare: 30,
    baseKm: 1.5,
    perKmRate: 15,
    roundStep: 5,
  },

  // Timers & Polling
  DISPATCH_TIMEOUT_SECONDS: 30,
  GPS_POLL_INTERVAL_MS: 4000,
  DRIVER_GPS_BROADCAST_MS: 4000,

  // Vehicle Categories
  VEHICLE_TYPES: {
    auto: {
      key: 'auto',
      title: 'Auto Rickshaw',
      titleKn: 'ಆಟೋ ರಿಕ್ಷಾ',
      backendCategory: 'Auto',
      icon: 'bike',
      capacity: '3 passengers',
    },

    car: {
      key: 'car',
      title: 'Passenger Car',
      titleKn: 'ಕಾರು ಪ್ರಯಾಣ',
      backendCategory: 'Passenger car',
      icon: 'car',
      capacity: '4-7 passengers',
    },

    'goods-van': {
      key: 'goods-van',
      title: 'Goods Van',
      titleKn: 'ಗೂಡ್ಸ್ ವ್ಯಾನ್',
      backendCategory: 'Goods van',
      icon: 'truck',
      capacity: 'Up to 1.5 tons',
    },
  },

  // Property Rental Types
  PROPERTY_TYPES: [
    { key: 'house', label: 'House', labelKn: 'ಮನೆ' },
    { key: 'room', label: 'Room', labelKn: 'ರೂಮ್' },
    { key: 'PG', label: 'PG / Hostel', labelKn: 'ಪಿಜಿ' },
    { key: 'shop', label: 'Commercial Shop', labelKn: 'ಅಂಗಡಿ' },
  ],

  // Supported Cities & Taluks across North Karnataka
  SUPPORTED_CITIES: [
    'Jamkhandi',
    'Bagalkot',
    'Mudhol',
    'Badami',
    'Ilkal',
    'Guledgudda',
    'Bilgi',
    'Vijayapura',
    'Belagavi',
    'Hubballi',
    'Dharwad',
    'Gadag',
    'Koppal',
  ],
};
