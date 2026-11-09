// Location & GPS Permission Context with Accurate Reverse Geocoding & Transparency

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { CONFIG } from '../constants/config';
import { resolveKarnatakaLocation } from '../utils/reverseGeocoding';

export type LocationMode = 'gps' | 'manual' | 'profile' | 'none';

interface LocationContextType {
  coords: { latitude: number; longitude: number };
  cityName: string;
  town: string;
  district: string;
  detectedAddress: string;
  locationMode: LocationMode;
  isGpsDetected: boolean;
  isManual: boolean;
  isDefaultFallback: boolean;
  gpsAccuracy: string;
  hasPermission: boolean | null;
  isLoadingLocation: boolean;
  locationError: string | null;
  setCityName: (name: string) => void;
  setManualLocation: (
    cityName: string,
    coords?: { latitude: number; longitude: number },
    district?: string
  ) => void;
  editAddress: (address: string) => void;
  detectCurrentLocation: (explainFirst?: boolean) => Promise<boolean>;
  refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType>({
  coords: CONFIG.DEFAULT_LOCATION,
  cityName: 'Jamkhandi',
  town: 'Jamkhandi',
  district: 'Bagalkot',
  detectedAddress: 'Select location or enable GPS',
  locationMode: 'none',
  isGpsDetected: false,
  isManual: false,
  isDefaultFallback: true,
  gpsAccuracy: '',
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
  const [cityName, setCityNameState] = useState<string>('Jamkhandi');
  const [town, setTown] = useState<string>('Jamkhandi');
  const [district, setDistrict] = useState<string>('Bagalkot');
  const [detectedAddress, setDetectedAddress] = useState<string>('Select location or enable GPS');
  const [locationMode, setLocationMode] = useState<LocationMode>('none');
  const [isDefaultFallback, setIsDefaultFallback] = useState<boolean>(true);
  const [gpsAccuracy, setGpsAccuracy] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const detectCurrentLocation = async (explainFirst = false): Promise<boolean> => {
    setIsLoadingLocation(true);
    setLocationError(null);

    try {
      if (explainFirst) {
        Alert.alert(
          'Location Access',
          'NUK RentServe uses your device GPS to display accurate nearby rental homes, find available auto drivers, and calculate fair point-to-point transit fares.'
        );
      }

      // Check if location services are enabled on device
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setLocationError('Device GPS/Location services are turned off. Please enable GPS in device settings or select your town manually.');
        setLocationMode('none');
        setIsDefaultFallback(true);
        Alert.alert(
          'GPS Disabled',
          'Please turn on GPS/Location services on your device to detect your current location.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Request foreground location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);

      if (!granted) {
        setLocationError('Location permission was not granted. Please select your town manually.');
        setLocationMode('none');
        setIsDefaultFallback(true);
        return false;
      }

      // Fetch accurate GPS coordinates
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      if (position?.coords) {
        const { latitude, longitude, accuracy } = position.coords;
        setCoords({ latitude, longitude });
        setGpsAccuracy(accuracy ? `±${Math.round(accuracy)}m` : 'High accuracy');
        setLocationMode('gps');
        setIsDefaultFallback(false);

        // Reverse geocode coordinates using accurate Karnataka resolver
        try {
          const reverseResults = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });

          const first = reverseResults && reverseResults.length > 0 ? reverseResults[0] : null;
          const resolved = resolveKarnatakaLocation({ latitude, longitude }, first);

          setCityNameState(resolved.town);
          setTown(resolved.town);
          setDistrict(resolved.district);
          setDetectedAddress(resolved.formattedAddress);
        } catch {
          const resolved = resolveKarnatakaLocation({ latitude, longitude }, null);
          setCityNameState(resolved.town);
          setTown(resolved.town);
          setDistrict(resolved.district);
          setDetectedAddress(resolved.formattedAddress);
        }

        return true;
      }

      return false;
    } catch (err: any) {
      const msg = err.message || 'Unable to retrieve GPS location.';
      setLocationError(msg);
      setLocationMode('none');
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
    manualCoords?: { latitude: number; longitude: number },
    chosenDistrict?: string
  ) => {
    setCityNameState(chosenCity);
    setTown(chosenCity);
    const dName = chosenDistrict || (chosenCity === 'Jamkhandi' || chosenCity === 'Mudhol' ? 'Bagalkot' : chosenCity);
    setDistrict(dName);
    setLocationMode('manual');
    setIsDefaultFallback(false);
    setLocationError(null);
    setGpsAccuracy('Manual selection');

    if (manualCoords) {
      setCoords(manualCoords);
      setDetectedAddress(`${chosenCity}, ${dName}, Karnataka`);
    } else {
      setDetectedAddress(`${chosenCity}, ${dName}, Karnataka (Manual Area)`);
    }
  };

  const editAddress = (newAddress: string) => {
    setDetectedAddress(newAddress);
    setLocationMode('manual');
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
          setLocationMode('none');
          setIsDefaultFallback(true);
          setDetectedAddress('Enable GPS or select your town');
        }
      } catch {
        setLocationMode('none');
        setIsDefaultFallback(true);
      }
    })();
  }, []);

  return (
    <LocationContext.Provider
      value={{
        coords,
        cityName,
        town,
        district,
        detectedAddress,
        locationMode,
        isGpsDetected: locationMode === 'gps',
        isManual: locationMode === 'manual',
        isDefaultFallback,
        gpsAccuracy,
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
