// Real-Time Socket.IO Service for Mobile Client
// Handles Live Ride Dispatch, Real-Time Driver Location Tracking, and Instant In-Trip/Provider Chat

import { io, Socket } from 'socket.io-client';
import { CONFIG } from '../constants/config';
import { Storage } from '../utils/storage';

let socket: Socket | null = null;
let currentToken: string | null = null;

function getSocketServerUrl(): string {
  const base = CONFIG.API_BASE_URL;
  return base.replace(/\/api\/v1\/?$/, '');
}

/**
 * Connect to Socket.IO server with JWT authentication
 */
export async function getOrConnectSocket(): Promise<Socket> {
  const token = await Storage.getToken();

  if (socket && socket.connected && currentToken === token) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentToken = token;
  const serverUrl = getSocketServerUrl();

  socket = io(serverUrl, {
    auth: { token: token || undefined },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 2000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    // Socket connected
  });

  socket.on('connect_error', () => {
    // Socket connection error handled gracefully
  });

  return socket;
}

/**
 * Returns current socket if initialized
 */
export function getSocketInstance(): Socket | null {
  return socket;
}

/**
 * Disconnect socket cleanly on logout
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
}

/**
 * Driver broadcasts their live GPS coordinates
 */
export function emitDriverLocation(data: {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  bookingId?: string;
}): void {
  if (socket && socket.connected) {
    socket.emit('driver:location_update', data);
  }
}

/**
 * Driver toggles their online dispatch availability
 */
export function emitDriverToggleOnline(isOnline: boolean): void {
  if (socket && socket.connected) {
    socket.emit('driver:toggle_online', { isOnline });
  }
}

/**
 * Customer or Driver joins trip tracking room
 */
export function joinTripRoom(bookingId: string): void {
  if (socket && socket.connected && bookingId) {
    socket.emit('trip:join', { bookingId });
  }
}

export function leaveTripRoom(bookingId: string): void {
  if (socket && socket.connected && bookingId) {
    socket.emit('trip:leave', { bookingId });
  }
}

/**
 * Join conversation room for instant messaging
 */
export function joinChatRoom(roomId: string): void {
  if (socket && socket.connected && roomId) {
    socket.emit('chat:join', { conversationId: roomId });
  }
}

export function leaveChatRoom(roomId: string): void {
  if (socket && socket.connected && roomId) {
    socket.emit('chat:leave', { conversationId: roomId });
  }
}
