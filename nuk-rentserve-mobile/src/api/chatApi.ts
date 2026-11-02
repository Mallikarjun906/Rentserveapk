// Real-time Chat & In-Trip Messaging API Service

import { apiClient } from './client';

export interface ChatMessage {
  _id: string;
  id?: string;
  bookingId: string;
  senderId: {
    _id: string;
    id?: string;
    name: string;
    role: string;
  };
  message: string;
  createdAt: string;
}

export interface ConversationThread {
  id: string;
  bookingId: string;
  bookingType: 'transport' | 'service' | 'property';
  name: string;
  role: string;
  phone?: string;
  lastMessage: string;
  time: string;
  unread?: number;
  status?: string;
}

export const chatApi = {
  // Fetch all active conversation threads for current user
  async getConversations(): Promise<ConversationThread[]> {
    try {
      const res: any = await apiClient.get('/chat/conversations');
      const items = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
      return items;
    } catch {
      return [];
    }
  },

  // Fetch conversation messages for a booking
  async getMessages(bookingId: string): Promise<ChatMessage[]> {
    try {
      const res: any = await apiClient.get(`/chat/${bookingId}/messages`);
      return Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
    } catch {
      // Fallback for transport bookings
      try {
        const res: any = await apiClient.get(`/transport-bookings/${bookingId}/messages`);
        return Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    }
  },

  // Send message
  async sendMessage(bookingId: string, message: string): Promise<ChatMessage> {
    try {
      const res: any = await apiClient.post(`/chat/${bookingId}/messages`, { message });
      return res.data || res;
    } catch {
      // Fallback for transport bookings
      const res: any = await apiClient.post(`/transport-bookings/${bookingId}/messages`, { message });
      return res.data || res;
    }
  },
};
