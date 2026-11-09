// Push & In-App Notification Client API

import { apiClient } from './client';

export type NotificationCategory =
  | 'ride'
  | 'booking'
  | 'message'
  | 'property'
  | 'verification'
  | 'system';

export interface NotificationItem {
  _id: string;
  userId: string;
  role: string;
  category: NotificationCategory;
  title: string;
  description: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationPreferences {
  rideNotifications: boolean;
  bookingNotifications: boolean;
  messageNotifications: boolean;
  enquiryNotifications: boolean;
  rentalNotifications: boolean;
  promoNotifications: boolean;
  sound: boolean;
  vibration: boolean;
}

export const notificationApi = {
  getNotifications: async (
    category?: string,
    unreadOnly?: boolean,
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: NotificationItem[]; unreadCount: number }> => {
    const params: Record<string, any> = { page, limit };
    if (category && category !== 'all') params.category = category;
    if (unreadOnly) params.unreadOnly = 'true';

    const res: any = await apiClient.get('/notifications', { params });
    const payload = res.data?.data || res.data;
    return {
      items: Array.isArray(payload?.items) ? payload.items : [],
      unreadCount: typeof payload?.unreadCount === 'number' ? payload.unreadCount : 0,
    };
  },

  markAsRead: async (id: string): Promise<NotificationItem> => {
    const res: any = await apiClient.patch(`/notifications/${id}/read`);
    return res.data?.data || res.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch('/notifications/read-all');
  },

  deleteNotification: async (id: string): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },

  registerDeviceToken: async (token: string): Promise<void> => {
    await apiClient.post('/notifications/device-token', { token });
  },

  getPreferences: async (): Promise<NotificationPreferences> => {
    const res: any = await apiClient.get('/notifications/preferences');
    return (
      res.data?.data || {
        rideNotifications: true,
        bookingNotifications: true,
        messageNotifications: true,
        enquiryNotifications: true,
        rentalNotifications: true,
        promoNotifications: false,
        sound: true,
        vibration: true,
      }
    );
  },

  updatePreferences: async (
    prefs: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> => {
    const res: any = await apiClient.patch('/notifications/preferences', prefs);
    return res.data?.data || res.data;
  },
};
