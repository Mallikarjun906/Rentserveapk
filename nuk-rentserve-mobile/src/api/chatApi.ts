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
  readAt?: string | null;
}

export interface ConversationThread {
  id: string;
  bookingId: string;
  bookingType: 'transport' | 'service' | 'property' | 'direct';
  name: string;
  role: string;
  phone?: string;
  lastMessage: string;
  time: string;
  unread?: number;
  status?: string;
}

export interface ConversationInitResponse {
  conversationId: string;
  id: string;
  bookingId: string;
  recipient: {
    id: string;
    name: string;
    role: string;
    phone: string;
  };
  conversation?: any;
}

export const chatApi = {
  // Fetch all active conversation threads for current user
  async getConversations(): Promise<ConversationThread[]> {
    try {
      const res: any = await apiClient.get('/chat/conversations');
      const items = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
      return items;
    } catch (err: any) {
      console.warn('Failed to load conversations:', err.message);
      return [];
    }
  },

  // Get or create a direct conversation with a service provider or property owner
  async getOrCreateConversation(params: {
    recipientId: string;
    serviceId?: string;
    propertyId?: string;
    title?: string;
  }): Promise<ConversationInitResponse> {
    const res: any = await apiClient.post('/chat/conversation', params);
    const data = res.data || res;
    return {
      conversationId: data.conversationId || data.id || data.bookingId,
      id: data.id || data.conversationId || data.bookingId,
      bookingId: data.bookingId || data.conversationId || data.id,
      recipient: data.recipient || {
        id: params.recipientId,
        name: 'Provider / Contact',
        role: 'Service',
        phone: '',
      },
      conversation: data.conversation,
    };
  },

  // Fetch conversation messages for a booking or conversation
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

  // Send message - preserves errors so UI can show failure and allow retry
  async sendMessage(bookingId: string, message: string): Promise<ChatMessage> {
    const res: any = await apiClient.post(`/chat/${bookingId}/messages`, { message });
    return res.data || res;
  },
};
