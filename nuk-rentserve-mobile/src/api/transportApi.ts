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

export const transportApi = {
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
    return res.data || res;
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
