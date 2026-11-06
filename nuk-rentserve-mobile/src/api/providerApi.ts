// Service Provider & Driver Registration API Service

import { apiClient } from './client';

export interface ProviderApplication {
  _id: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  dob?: string;
  category: string;
  experience?: string;
  price?: string;
  address?: string;
  city?: string;
  taluk?: string;
  district?: string;
  status: 'pending' | 'info' | 'approved' | 'rejected';
  verificationStatus?: 'pending' | 'info' | 'approved' | 'rejected' | 'verified';
  reviewNote?: string;
  profileImage?: { url: string };
  vehicleImages?: Array<{ url: string }>;
  locationCoordinates?: { latitude: number; longitude: number };
  createdAt: string;
}

export interface ProviderServiceRequest {
  _id: string;
  id?: string;
  customerId: {
    _id: string;
    id?: string;
    name: string;
    phone?: string;
    email?: string;
    location?: string;
  };
  serviceId?: any;
  bookingType: string;
  category: string;
  serviceCategory?: string;
  location: string;
  scheduledDate?: string;
  message?: string;
  details?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  rejectionReason?: string;
  createdAt: string;
}

export const providerApi = {
  // Provider / Driver submits multi-part onboarding application
  async register(formData: FormData): Promise<any> {
    // Note: Do NOT set Content-Type header manually for FormData; networking library adds boundary
    const res: any = await apiClient.post('/auth/register/provider', formData);
    return res.data || res;
  },

  // Approved provider gets their profile
  async getMyProfile(): Promise<any> {
    const res: any = await apiClient.get('/providers/me');
    return res.data || res;
  },

  // Update profile
  async updateMyProfile(data: any): Promise<any> {
    const res: any = await apiClient.patch('/providers/me', data);
    return res.data || res;
  },

  // Get incoming customer requests
  async getReceivedRequests(): Promise<ProviderServiceRequest[]> {
    const res: any = await apiClient.get('/bookings/received');
    return Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
  },

  // Get accepted bookings assigned to provider
  async getMyAcceptedBookings(): Promise<ProviderServiceRequest[]> {
    const res: any = await apiClient.get('/bookings/mine');
    return Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
  },

  // Accept, reject, or update request status
  async respondToRequest(
    id: string,
    status: 'accepted' | 'rejected' | 'in_progress' | 'completed',
    reason?: string
  ): Promise<any> {
    const res: any = await apiClient.patch(`/bookings/${id}/status`, { status, reason });
    return res.data || res;
  },

  // Update GPS location for nearby request matching
  async updateLocation(coords: { latitude: number; longitude: number }): Promise<any> {
    const res: any = await apiClient.patch('/transport-bookings/location', {
      locationCoordinates: coords,
    });
    return res.data || res;
  },

  // Get provider's service listings
  async getMyServices(): Promise<any[]> {
    const res: any = await apiClient.get('/services/mine');
    return Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
  },
};
