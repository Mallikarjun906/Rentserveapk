// Authentication, Separate Registrations, and User Profile API Service

import { apiClient } from './client';
import { Storage } from '../utils/storage';

export type UserRole = 'customer' | 'owner' | 'provider' | 'driver' | 'student' | 'admin';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  location?: string;
  approvalStatus?: ApprovalStatus;
  rejectionReason?: string;
  isActive?: boolean;
  isOnline?: boolean;
  vehicleNumber?: string;
  vehicleModel?: string;
  collegeName?: string;
  profileImage?: { url: string };
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
  applicationId?: string;
  applicationStatus?: ApprovalStatus;
  message?: string;
}

export const authApi = {
  // Login with Email or Phone & Password
  async login(login: string, password: string): Promise<AuthResponse> {
    const res: any = await apiClient.post('/auth/login', {
      email: login,
      identifier: login,
      login,
      password,
    });
    return res.data || res;
  },

  // Dedicated Admin Login (strict role check)
  async adminLogin(login: string, password: string): Promise<AuthResponse> {
    const res: any = await apiClient.post('/admin/login', { email: login, identifier: login, password });
    return res.data || res;
  },

  // Google OAuth Login
  async googleLogin(credential: string): Promise<AuthResponse> {
    const res: any = await apiClient.post('/auth/google', { credential });
    return res.data || res;
  },

  // 1. Customer Registration
  async registerCustomer(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword?: string;
    address?: string;
    city?: string;
    terms: boolean;
  }): Promise<AuthResponse> {
    const res: any = await apiClient.post('/auth/register/customer', data);
    return res.data || res;
  },

  // 2. Driver Registration (multipart)
  async registerDriver(formData: FormData): Promise<AuthResponse> {
    const res: any = await apiClient.post('/auth/register/driver', formData);
    return res.data || res;
  },

  // 3. Student Registration (multipart)
  async registerStudent(formData: FormData): Promise<AuthResponse> {
    const res: any = await apiClient.post('/auth/register/student', formData);
    return res.data || res;
  },

  // 4. Provider Registration (multipart)
  async registerProvider(formData: FormData): Promise<AuthResponse> {
    const res: any = await apiClient.post('/auth/register/provider', formData);
    return res.data || res;
  },

  // 5. Property Owner Registration (JSON or FormData)
  async registerOwner(data: any): Promise<AuthResponse> {
    const res: any = await apiClient.post('/auth/register/owner', data);
    return res.data || res;
  },

  // Dedicated Profile Photo Upload
  async uploadProfilePhoto(formData: FormData): Promise<{ user: User; profileImage: { url: string } }> {
    const res: any = await apiClient.post('/users/me/photo', formData);
    return res.data || res;
  },

  // Backward compatible register
  async register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    location: string;
  }): Promise<AuthResponse> {
    const res: any = await apiClient.post('/auth/register', data);
    return res.data || res;
  },

  // Resubmit rejected documents
  async resubmitDocuments(formData: FormData): Promise<{ status: string }> {
    const res: any = await apiClient.post('/documents/resubmit', formData);
    return res.data || res;
  },

  // Send OTP
  async sendOtp(phone: string): Promise<{ success: boolean; message: string }> {
    const res: any = await apiClient.post('/auth/send-otp', { phone });
    return res.data || res;
  },

  // Verify OTP
  async verifyOtp(phone: string, otp: string): Promise<{ success: boolean; message: string }> {
    const res: any = await apiClient.post('/auth/verify-otp', { phone, otp });
    return res.data || res;
  },

  // Forgot Password
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const res: any = await apiClient.post('/auth/forgot-password', { email });
    return res.data || res;
  },

  // Reset Password
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res: any = await apiClient.post('/auth/reset-password', { token, newPassword });
    return res.data || res;
  },

  // Logout
  async logout(): Promise<void> {
    try {
      const refreshToken = await Storage.getRefreshToken();
      await apiClient.post('/auth/logout', { refreshToken });
    } catch {}
  },

  // Get Current User Profile
  async getMe(): Promise<User> {
    const res: any = await apiClient.get('/users/me');
    return res.data || res;
  },

  // Get Current User's Verification Application & Document Availability
  async getMyApplication(): Promise<any> {
    const res: any = await apiClient.get('/documents/my-application');
    return res.data || res;
  },

  // Update Profile
  async updateMe(data: Partial<User> | FormData | any): Promise<User> {
    const res: any = await apiClient.patch('/users/me', data);
    return res.data || res;
  },
};
