// Active Transport Ride & Live Tracking Context

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Coordinates, LiveLocation, transportApi, TransportBooking } from '../api/transportApi';
import { CONFIG } from '../constants/config';
import { calculateAutoFare } from '../utils/fareCalculator';

export type RidePhase =
  | 'idle'
  | 'calculating'
  | 'options'
  | 'searching'
  | 'accepted'
  | 'arriving'
  | 'riding'
  | 'completed'
  | 'cancelled';

interface ActiveRideContextType {
  phase: RidePhase;
  setPhase: (p: RidePhase) => void;
  activeBooking: TransportBooking | null;
  pickupName: string;
  setPickupName: (name: string) => void;
  pickupCoords: Coordinates;
  setPickupCoords: (c: Coordinates) => void;
  destName: string;
  setDestName: (name: string) => void;
  destCoords: Coordinates;
  setDestCoords: (c: Coordinates) => void;
  estimatedKm: number;
  setEstimatedKm: (km: number) => void;
  suggestedFare: number;
  offeredFare: number;
  adjustOffer: (delta: number) => void;
  driverTracking: LiveLocation | null;
  startSearch: () => Promise<void>;
  cancelRide: () => Promise<void>;
  resetRide: () => void;
}

const ActiveRideContext = createContext<ActiveRideContextType>({
  phase: 'idle',
  setPhase: () => {},
  activeBooking: null,
  pickupName: 'Navanagar Main Road, Bagalkot',
  setPickupName: () => {},
  pickupCoords: CONFIG.DEFAULT_LOCATION,
  setPickupCoords: () => {},
  destName: '',
  setDestName: () => {},
  destCoords: CONFIG.DEFAULT_LOCATION,
  setDestCoords: () => {},
  estimatedKm: 3.5,
  setEstimatedKm: () => {},
  suggestedFare: 60,
  offeredFare: 60,
  adjustOffer: () => {},
  driverTracking: null,
  startSearch: async () => {},
  cancelRide: async () => {},
  resetRide: () => {},
});

export const ActiveRideProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [phase, setPhase] = useState<RidePhase>('idle');
  const [activeBooking, setActiveBooking] = useState<TransportBooking | null>(null);

  const [pickupName, setPickupName] = useState('Navanagar Main Road, Bagalkot');
  const [pickupCoords, setPickupCoords] = useState<Coordinates>(CONFIG.DEFAULT_LOCATION);

  const [destName, setDestName] = useState('');
  const [destCoords, setDestCoords] = useState<Coordinates>({
    latitude: CONFIG.DEFAULT_LOCATION.latitude + 0.02,
    longitude: CONFIG.DEFAULT_LOCATION.longitude + 0.02,
  });

  const [estimatedKm, setEstimatedKmState] = useState(3.5);
  const [suggestedFare, setSuggestedFare] = useState(60);
  const [offeredFare, setOfferedFare] = useState(60);
  const [driverTracking, setDriverTracking] = useState<LiveLocation | null>(null);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const setEstimatedKm = (km: number) => {
    setEstimatedKmState(km);
    const fare = calculateAutoFare(km);
    setSuggestedFare(fare);
    setOfferedFare(fare);
  };

  const adjustOffer = (delta: number) => {
    setOfferedFare((prev) => Math.max(CONFIG.AUTO_FARE.baseFare, prev + delta));
  };

  const startSearch = async () => {
    setPhase('searching');
    try {
      const booking = await transportApi.createBooking({
        vehicleType: 'auto',
        pickup: pickupName,
        destination: destName || 'Bagalkot Bus Stand',
        scheduledAt: new Date(Date.now() + 60000).toISOString(),
        details: `Customer offered fare: ₹${offeredFare}`,
        pickupCoordinates: pickupCoords,
        destinationCoordinates: destCoords,
      });
      setActiveBooking(booking);
    } catch (err) {
      console.warn('Booking creation offline fallback simulation:', err);
      // Simulate booking object for offline/demo reliability
      setActiveBooking({
        _id: 'auto-' + Date.now(),
        customerId: 'demo-user',
        vehicleType: 'auto',
        pickup: pickupName,
        destination: destName || 'Bagalkot Bus Stand',
        scheduledAt: new Date().toISOString(),
        status: 'pending',
        fare: offeredFare,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const cancelRide = async () => {
    if (activeBooking?._id) {
      try {
        await transportApi.updateStatus(activeBooking._id, 'cancelled');
      } catch {}
    }
    resetRide();
  };

  const resetRide = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setPhase('idle');
    setActiveBooking(null);
    setDriverTracking(null);
  };

  // Tracking Poller (queries tracking snapshot every 4s when trip is active)
  useEffect(() => {
    const isTrackingPhase = ['searching', 'accepted', 'arriving', 'riding'].includes(phase);
    if (!isTrackingPhase || !activeBooking?._id) {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    pollTimerRef.current = setInterval(async () => {
      try {
        const update = await transportApi.getTracking(activeBooking._id);
        if (update) {
          setActiveBooking(update);
          if (update.liveLocation) {
            setDriverTracking(update.liveLocation);
          }
          if (update.status === 'accepted' && phase === 'searching') {
            setPhase('accepted');
          } else if (update.status === 'in_progress' && phase !== 'riding') {
            setPhase('riding');
          } else if (update.status === 'completed' && phase !== 'completed') {
            setPhase('completed');
          }
        }
      } catch {}
    }, CONFIG.GPS_POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [phase, activeBooking?._id]);

  return (
    <ActiveRideContext.Provider
      value={{
        phase,
        setPhase,
        activeBooking,
        pickupName,
        setPickupName,
        pickupCoords,
        setPickupCoords,
        destName,
        setDestName,
        destCoords,
        setDestCoords,
        estimatedKm,
        setEstimatedKm,
        suggestedFare,
        offeredFare,
        adjustOffer,
        driverTracking,
        startSearch,
        cancelRide,
        resetRide,
      }}
    >
      {children}
    </ActiveRideContext.Provider>
  );
};

export const useActiveRide = () => useContext(ActiveRideContext);
