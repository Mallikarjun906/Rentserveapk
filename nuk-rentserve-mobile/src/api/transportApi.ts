// Transport, Auto Rides, Car Trips, and Goods Van API Service

import { apiClient } from './client';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LiveLocation extends Coordinates {
  accuracy?: number;
  heading?: number;
  speed?: number;
  updatedAt?: string;
}

export interface TransportBooking {
  _id: string;
  id?: string;
  customerId: string | { _id: string; name: string; phone?: string };
  providerId?: string | { _id: string; name: string; phone?: string; profileImage?: { url: string } };
  vehicleType: 'auto' | 'car' | 'goods-van';
  pickup: string;
  destination: string;
  scheduledAt: string;
  details?: string;
  pickupCoordinates?: Coordinates;
  destinationCoordinates?: Coordinates;
  liveLocation?: LiveLocation;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'declined' | 'unmatched';
  fare?: number;
  createdAt: string;
  updatedAt: string;
}

export interface NearbyDriver {
  id: string;
  vehicleType: string;
  vehicleModel: string;
  approximateDistanceKm: number | null;
  estimatedEtaMinutes: number | null;
  area: string;
  isOnline: boolean;
}

export interface NearbyDriversResponse {
  count: number;
  drivers: NearbyDriver[];
  searchRadiusKm: number;
}

export const transportApi = {
  // Query nearby available online drivers based on genuine backend records
  async getNearbyDrivers(params?: {
    latitude?: number;
    longitude?: number;
    vehicleType?: 'auto' | 'car' | 'goods-van';
    radiusKm?: number;
  }): Promise<NearbyDriversResponse> {
    const query = new URLSearchParams();
    if (params?.latitude != null) query.append('latitude', String(params.latitude));
    if (params?.longitude != null) query.append('longitude', String(params.longitude));
    if (params?.vehicleType) query.append('vehicleType', params.vehicleType);
    if (params?.radiusKm != null) query.append('radiusKm', String(params.radiusKm));

    const qs = query.toString();
    const res: any = await apiClient.get(`/transport-bookings/nearby-drivers${qs ? `?${qs}` : ''}`);
    return res.data || res;
  },
  // Customer creates a new auto or scheduled transport request
  async createBooking(data: {
    vehicleType: 'auto' | 'car' | 'goods-van';
    pickup: string;
    destination: string;
    scheduledAt: string;
    details?: string;
    pickupCoordinates?: Coordinates;
    destinationCoordinates?: Coordinates;
  }): Promise<TransportBooking> {
    const res: any = await apiClient.post('/transport-bookings', data);
    return res.data || res;
  },

  // Customer fetches their transport bookings
  async getMyBookings(): Promise<TransportBooking[]> {
    const res: any = await apiClient.get('/transport-bookings/mine');
    return res.data || res;
  },

  // Driver fetches available requests in their 5 km queue
  async getAvailableRequests(): Promise<TransportBooking[]> {
    const res: any = await apiClient.get('/transport-bookings/available');
    return res.data || res;
  },

  // Driver fetches their currently assigned active booking
  async getAssignedTrip(): Promise<TransportBooking | null> {
    const res: any = await apiClient.get('/transport-bookings/assigned');
    const items = res.data || res;
    if (Array.isArray(items)) {
      return items.length > 0 ? items[0] : null;
    }
    return items || null;
  },

  // Driver fetches all trips assigned to them (accepted, in_progress, completed history)
  async getDriverHistory(): Promise<TransportBooking[]> {
    const res: any = await apiClient.get('/transport-bookings/mine');
    const items = res.data || res;
    return Array.isArray(items) ? items : [];
  },

  // Customer or Driver polls the real-time tracking snapshot
  async getTracking(bookingId: string): Promise<TransportBooking> {
    const res: any = await apiClient.get(`/transport-bookings/${bookingId}/tracking`);
    return res.data || res;
  },

  // Driver broadcasts their live trip GPS coordinates (throttled ~4s)
  async updateTripLocation(
    bookingId: string,
    data: {
      locationCoordinates: Coordinates;
      accuracy?: number;
      heading?: number;
      speed?: number;
    }
  ): Promise<any> {
    const res: any = await apiClient.patch(`/transport-bookings/${bookingId}/location`, data);
    return res.data || res;
  },

  // Driver updates their general online dispatch location
  async updateDriverOnlineLocation(coords: Coordinates): Promise<any> {
    const res: any = await apiClient.patch('/transport-bookings/location', {
      locationCoordinates: coords,
    });
    return res.data || res;
  },

  // Update trip status (accept, start, complete, cancel, reject)
  async updateStatus(
    bookingId: string,
    status: 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'rejected'
  ): Promise<any> {
    const res: any = await apiClient.patch(`/transport-bookings/${bookingId}/status`, {
      status,
    });
    return res.data || res;
  },
};
