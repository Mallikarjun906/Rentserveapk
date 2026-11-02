// Location & GPS Permission Context

import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { CONFIG } from '../constants/config';

interface LocationContextType {
  coords: { latitude: number; longitude: number };
  cityName: string;
  setCityName: (name: string) => void;
  hasPermission: boolean | null;
  isLoadingLocation: boolean;
  requestPermission: () => Promise<boolean>;
  refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType>({
  coords: CONFIG.DEFAULT_LOCATION,
  cityName: 'Bagalkot',
  setCityName: () => {},
  hasPermission: null,
  isLoadingLocation: false,
  requestPermission: async () => false,
  refreshLocation: async () => {},
});

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: CONFIG.DEFAULT_LOCATION.latitude,
    longitude: CONFIG.DEFAULT_LOCATION.longitude,
  });
  const [cityName, setCityName] = useState<string>('Bagalkot');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const requestPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      if (granted) {
        await refreshLocation();
      }
      return granted;
    } catch {
      setHasPermission(false);
      return false;
    }
  };

  const refreshLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (loc && loc.coords) {
        setCoords({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        // Reverse geocode to find city
        const reverse = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (reverse && reverse.length > 0) {
          const place = reverse[0];
          const foundCity = place.city || place.subregion || place.district || 'Bagalkot';
          setCityName(foundCity);
        }
      }
    } catch (err) {
      console.warn('GPS location lookup fell back to default:', err);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        setHasPermission(status === 'granted');
        if (status === 'granted') {
          refreshLocation();
        }
      } catch {}
    })();
  }, []);

  return (
    <LocationContext.Provider
      value={{
        coords,
        cityName,
        setCityName,
        hasPermission,
        isLoadingLocation,
        requestPermission,
        refreshLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => useContext(LocationContext);
