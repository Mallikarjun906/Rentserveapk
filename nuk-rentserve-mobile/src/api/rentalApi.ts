// Rental Properties and Property Bookings API Service

import { apiClient } from './client';

export interface PropertyImage {
  _id?: string;
  url: string;
  publicId: string;
}

export interface Property {
  _id: string;
  id?: string;
  ownerId: string | { _id: string; name: string; phone?: string };
  type: 'house' | 'shop' | 'room' | 'PG';
  title: string;
  description: string;
  rent: number;
  deposit: number;
  rentPeriod: 'day' | 'week' | 'month';
  address: string;
  location: string;
  facilities: string[];
  images: PropertyImage[];
  availability: boolean;
  status: 'draft' | 'published' | 'rented' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface RentalBooking {
  _id: string;
  id?: string;
  customerId: string | { _id: string; name: string; phone?: string };
  ownerId: string | { _id: string; name: string; phone?: string };
  propertyId: string | Property;
  requestedMoveInDate: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
}

export const rentalApi = {
  // Public search for properties with filters
  async getProperties(params?: {
    type?: string;
    location?: string;
    minRent?: number;
    maxRent?: number;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<Property[]> {
    const res: any = await apiClient.get('/properties', { params });
    // Handles array or { properties: [] } envelope
    if (Array.isArray(res.data)) return res.data;
    if (res.data?.properties) return res.data.properties;
    if (Array.isArray(res)) return res;
    return [];
  },

  // Get single property details
  async getProperty(id: string): Promise<Property> {
    const res: any = await apiClient.get(`/properties/${id}`);
    return res.data || res;
  },

  // Owner creates new property listing (supports multipart image uploads)
  async createProperty(formData: FormData): Promise<Property> {
    const res: any = await apiClient.post('/properties', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data || res;
  },

  // Owner updates property listing
  async updateProperty(id: string, formData: FormData): Promise<Property> {
    const res: any = await apiClient.patch(`/properties/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data || res;
  },

  // Customer requests property visit / move-in or service booking
  async requestBooking(data: {
    propertyId?: string;
    serviceId?: string;
    bookingType?: 'property' | 'service';
    category?: string;
    ownerId?: string;
    providerId?: string;
    requestedMoveInDate?: string;
    scheduledDate?: string;
    message?: string;
    details?: string;
    location?: string;
  }): Promise<any> {
    const res: any = await apiClient.post('/bookings', data);
    return res.data || res;
  },

  // Alias for createBooking
  async createBooking(data: {
    propertyId?: string;
    serviceId?: string;
    bookingType?: 'property' | 'service';
    category?: string;
    ownerId?: string;
    providerId?: string;
    requestedMoveInDate?: string;
    scheduledDate?: string;
    message?: string;
    details?: string;
    location?: string;
  }): Promise<any> {
    return this.requestBooking(data);
  },

  // Customer gets their rental bookings
  async getMyBookings(): Promise<RentalBooking[]> {
    const res: any = await apiClient.get('/bookings/mine');
    return Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
  },

  // Alias for getMyRentalBookings
  async getMyRentalBookings(): Promise<RentalBooking[]> {
    return this.getMyBookings();
  },

  // Owner gets received booking requests
  async getReceivedBookings(): Promise<RentalBooking[]> {
    const res: any = await apiClient.get('/bookings/received');
    return Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
  },

  // Owner or Provider updates booking status
  async updateBookingStatus(
    id: string,
    status: 'accepted' | 'rejected' | 'cancelled' | 'completed',
    reason?: string
  ): Promise<any> {
    const res: any = await apiClient.patch(`/bookings/${id}/status`, { status, reason });
    return res.data || res;
  },
};
