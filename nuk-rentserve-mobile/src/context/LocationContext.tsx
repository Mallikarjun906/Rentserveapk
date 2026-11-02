// Location & GPS Permission Context with Accurate Reverse Geocoding & Default Fallback Transparency

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { CONFIG } from '../constants/config';

interface LocationContextType {
  coords: { latitude: number; longitude: number };
  cityName: string;
  detectedAddress: string;
  isDefaultFallback: boolean;
  hasPermission: boolean | null;
  isLoadingLocation: boolean;
  locationError: string | null;
  setCityName: (name: string) => void;
  setManualLocation: (cityName: string, coords?: { latitude: number; longitude: number }) => void;
  editAddress: (address: string) => void;
  detectCurrentLocation: (explainFirst?: boolean) => Promise<boolean>;
  refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType>({
  coords: CONFIG.DEFAULT_LOCATION,
  cityName: 'Bagalkot',
  detectedAddress: 'Bagalkot, Karnataka',
  isDefaultFallback: true,
  hasPermission: null,
  isLoadingLocation: false,
  locationError: null,
  setCityName: () => {},
  setManualLocation: () => {},
  editAddress: () => {},
  detectCurrentLocation: async () => false,
  refreshLocation: async () => {},
});

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: CONFIG.DEFAULT_LOCATION.latitude,
    longitude: CONFIG.DEFAULT_LOCATION.longitude,
  });
  const [cityName, setCityNameState] = useState<string>('Bagalkot');
  const [detectedAddress, setDetectedAddress] = useState<string>('Bagalkot, Karnataka (Default Service Area)');
  const [isDefaultFallback, setIsDefaultFallback] = useState<boolean>(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const detectCurrentLocation = async (explainFirst = false): Promise<boolean> => {
    setIsLoadingLocation(true);
    setLocationError(null);

    try {
      if (explainFirst) {
        // User-friendly explanation before requesting system prompt
        Alert.alert(
          'Location Access',
          'NUK RentServe uses your GPS location to display accurate nearby rental homes, find available auto drivers, and calculate fair point-to-point transit fares.'
        );
      }

      // Check if location services are enabled on device
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setLocationError('Device GPS/Location services are disabled. Please enable GPS in device settings.');
        setIsDefaultFallback(true);
        Alert.alert(
          'GPS Disabled',
          'Please enable GPS / Location services on your device to detect your real location.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Request foreground location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);

      if (!granted) {
        setLocationError('Location permission was denied. Using default service area.');
        setIsDefaultFallback(true);
        return false;
      }

      // Fetch accurate GPS coordinates with timeout handling
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (position?.coords) {
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });
        setIsDefaultFallback(false);

        // Reverse geocode coordinates to get a human-readable address
        try {
          const reverseResults = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });

          if (reverseResults && reverseResults.length > 0) {
            const place = reverseResults[0];
            const foundCity =
              place.city || place.subregion || place.district || place.region || 'Bagalkot';
            const formatted = [
              place.name,
              place.street,
              place.subregion || place.district,
              place.city,
            ]
              .filter(Boolean)
              .join(', ');

            setCityNameState(foundCity);
            setDetectedAddress(formatted || `${foundCity}, Karnataka`);
          } else {
            setDetectedAddress(`GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch {
          setDetectedAddress(`GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }

        return true;
      }

      return false;
    } catch (err: any) {
      const msg = err.message || 'Unable to retrieve current location.';
      setLocationError(msg);
      setIsDefaultFallback(true);
      return false;
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const refreshLocation = async () => {
    await detectCurrentLocation(false);
  };

  const setManualLocation = (
    chosenCity: string,
    manualCoords?: { latitude: number; longitude: number }
  ) => {
    setCityNameState(chosenCity);
    setIsDefaultFallback(false);
    setLocationError(null);
    if (manualCoords) {
      setCoords(manualCoords);
      setDetectedAddress(`${chosenCity}, Karnataka`);
    } else {
      setDetectedAddress(`${chosenCity}, Karnataka (Manual Area)`);
    }
  };

  const editAddress = (newAddress: string) => {
    setDetectedAddress(newAddress);
    setIsDefaultFallback(false);
  };

  const setCityName = (name: string) => {
    setManualLocation(name);
  };

  useEffect(() => {
    // Check initial permission on startup without blocking
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        setHasPermission(status === 'granted');
        if (status === 'granted') {
          await detectCurrentLocation(false);
        } else {
          // Maintain default Bagalkot service area transparently
          setIsDefaultFallback(true);
          setDetectedAddress('Bagalkot, Karnataka (Default Service Area)');
        }
      } catch {
        setIsDefaultFallback(true);
      }
    })();
  }, []);

  return (
    <LocationContext.Provider
      value={{
        coords,
        cityName,
        detectedAddress,
        isDefaultFallback,
        hasPermission,
        isLoadingLocation,
        locationError,
        setCityName,
        setManualLocation,
        editAddress,
        detectCurrentLocation,
        refreshLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => useContext(LocationContext);
