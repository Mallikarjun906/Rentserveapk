// Services, Categories, Enquiries, Reviews, and Support API Service

import { apiClient } from './client';

export interface ServiceCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

export interface ServiceListing {
  _id: string;
  id?: string;
  providerId: {
    _id: string;
    name: string;
    phone?: string;
    profileImage?: { url: string };
  };
  categoryId: ServiceCategory | string;
  title: string;
  description: string;
  location: string;
  priceRange: { min: number; max: number };
  payUnit: 'hour' | 'day' | 'week' | 'month' | 'fixed';
  workHours?: string;
  images?: Array<{ url: string }>;
  availability: boolean;
  status: string;
}

export interface Review {
  _id: string;
  reviewerId: { _id: string; name: string };
  listingId: string;
  listingType: 'service' | 'property';
  rating: number;
  comment: string;
  createdAt: string;
}

export const serviceApi = {
  // Fetch active service categories
  async getCategories(): Promise<ServiceCategory[]> {
    const res: any = await apiClient.get('/categories');
    return Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
  },

  // Fetch verified service listings
  async getServices(params?: { category?: string; location?: string }): Promise<ServiceListing[]> {
    const res: any = await apiClient.get('/services', { params });
    if (Array.isArray(res.data)) return res.data;
    if (res.data?.services) return res.data.services;
    if (Array.isArray(res)) return res;
    return [];
  },

  // Get single service details
  async getService(id: string): Promise<ServiceListing> {
    const res: any = await apiClient.get(`/services/${id}`);
    return res.data || res;
  },

  // Customer creates enquiry
  async createEnquiry(data: {
    listingId: string;
    listingType: 'service' | 'property';
    message: string;
  }): Promise<any> {
    const res: any = await apiClient.post('/enquiries', data);
    return res.data || res;
  },

  // Get reviews
  async getReviews(listingId: string, listingType: 'service' | 'property'): Promise<Review[]> {
    const res: any = await apiClient.get('/reviews', { params: { listingId, listingType } });
    return Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
  },

  // Post review
  async createReview(data: {
    listingId: string;
    listingType: 'service' | 'property';
    rating: number;
    comment: string;
  }): Promise<Review> {
    const res: any = await apiClient.post('/reviews', data);
    return res.data || res;
  },

  // Submit support ticket
  async createSupportTicket(data: {
    subject: string;
    category: 'account' | 'application' | 'booking' | 'payment' | 'technical' | 'other';
    message: string;
  }): Promise<any> {
    const res: any = await apiClient.post('/support', data);
    return res.data || res;
  },

  // View my support tickets
  async getMyTickets(): Promise<any[]> {
    const res: any = await apiClient.get('/support/mine');
    return Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
  },
};
