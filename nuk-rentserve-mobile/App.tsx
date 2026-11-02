// NUK RentServe Mobile Root Application Entrypoint

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LocalizationProvider } from './src/context/LocalizationContext';
import { AuthProvider } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';
import { ActiveRideProvider } from './src/context/ActiveRideContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <LocalizationProvider>
        <AuthProvider>
          <LocationProvider>
            <ActiveRideProvider>
              <StatusBar style="dark" />
              <RootNavigator />
            </ActiveRideProvider>
          </LocationProvider>
        </AuthProvider>
      </LocalizationProvider>
    </SafeAreaProvider>
  );
}
