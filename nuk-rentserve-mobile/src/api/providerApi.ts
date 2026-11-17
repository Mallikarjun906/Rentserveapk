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

  // Get single provider public profile
  async getProvider(id: string): Promise<any> {
    const res: any = await apiClient.get(`/providers/${id}`);
    return res.data || res;
  },

  // Fetch public approved service providers
  async getPublicProviders(params?: { category?: string; city?: string; limit?: number }): Promise<any[]> {
    try {
      const res: any = await apiClient.get('/providers', { params });
      if (Array.isArray(res.data?.items)) return res.data.items;
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res?.items)) return res.items;
      if (Array.isArray(res)) return res;
      return [];
    } catch {
      return [];
    }
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
    try {
      const res: any = await apiClient.get('/services/mine');
      return Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  // Create a service listing
  async createService(data: any): Promise<any> {
    const res: any = await apiClient.post('/services', data);
    return res.data || res;
  },

  // Update a service listing
  async updateService(id: string, data: any): Promise<any> {
    const res: any = await apiClient.patch(`/services/${id}`, data);
    return res.data || res;
  },

  // Delete a service listing
  async deleteService(id: string): Promise<any> {
    const res: any = await apiClient.delete(`/services/${id}`);
    return res.data || res;
  },

  // Get customer enquiries received for listings
  async getReceivedEnquiries(): Promise<any[]> {
    try {
      const res: any = await apiClient.get('/enquiries/received');
      return Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  // Update enquiry status / reply
  async replyEnquiry(id: string, status: string, replyMessage?: string): Promise<any> {
    const res: any = await apiClient.patch(`/enquiries/${id}/status`, { status, replyMessage });
    return res.data || res;
  },

  // Get support tickets
  async getSupportTickets(): Promise<any[]> {
    try {
      const res: any = await apiClient.get('/support/mine');
      return Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  // Submit a support ticket
  async createSupportTicket(data: { subject: string; message: string; category?: string }): Promise<any> {
    const res: any = await apiClient.post('/support', data);
    return res.data || res;
  },
};
