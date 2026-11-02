
// NUK RentServe System Configuration & Defaults

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Production backend URL
export const PROD_API_BASE_URL =
  'https://rentserveapk.onrender.com/api/v1';

// Local development computer IP
export const LOCAL_COMPUTER_IP = '172.16.11.62';

export function resolveApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  // 1. Always prioritize the configured production/remote URL
  if (
    envUrl &&
    !envUrl.includes('localhost') &&
    !envUrl.includes('127.0.0.1')
  ) {
    return envUrl.replace(/\/+$/, '');
  }

  // 2. Resolve Expo development host
  const expoHostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any)?.manifest?.debuggerHost ||
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri;

  const detectedHost = expoHostUri
    ? expoHostUri.split(':')[0]
    : null;

  // 3. Android local development
  if (Platform.OS === 'android') {
    if (
      !detectedHost ||
      detectedHost === 'localhost' ||
      detectedHost === '127.0.0.1'
    ) {
      return 'http://10.0.2.2:5000/api/v1';
    }

    return `http://${detectedHost}:5000/api/v1`;
  }

  // 4. iOS local development
  if (Platform.OS === 'ios') {
    if (
      detectedHost &&
      detectedHost !== 'localhost' &&
      detectedHost !== '127.0.0.1'
    ) {
      return `http://${detectedHost}:5000/api/v1`;
    }

    return 'http://localhost:5000/api/v1';
  }

  // 5. Web local development
  if (
    Platform.OS === 'web' &&
    typeof globalThis !== 'undefined' &&
    (globalThis as any).window?.location
  ) {
    const host =
      (globalThis as any).window.location.hostname || 'localhost';

    return `http://${host}:5000/api/v1`;
  }

  // 6. Production fallback
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

  // Supported Cities
  SUPPORTED_CITIES: [
    'Bagalkot',
    'Belagavi',
    'Hubballi',
    'Dharwad',
    'Vijayapura',
    'Gadag',
    'Koppal',
  ],
};
