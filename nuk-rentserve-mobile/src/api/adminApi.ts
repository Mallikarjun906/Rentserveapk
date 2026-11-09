// Administrator Control Console API Service

import { apiClient } from './client';

export interface AdminStats {
  totalUsers: number;
  activeCustomers?: number;
  registeredProviders?: number;
  propertyOwners?: number;
  studentPartners?: number;
  registeredDrivers?: number;
  totalServices: number;
  totalProperties: number;
  totalBookings?: number;
  pendingBookings?: number;
  completedBookings?: number;
  cancelledBookings?: number;
  pendingProviders: number;
  pendingDrivers: number;
  pendingStudents: number;
  approvedProviders: number;
  approvedDrivers: number;
  approvedStudents: number;
  rejectedApplications: number;
  suspendedAccounts: number;
  supportRequests?: number;
}

export interface ApplicationRecord {
  id: string;
  _id?: string;
  userId: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    approvalStatus: string;
    location: string;
    isActive: boolean;
  };
  applicationType: 'provider' | 'driver' | 'student';
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  city: string;
  taluk?: string;
  district?: string;
  category?: string;
  experience?: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'info';
  reviewNote?: string;
  rejectionReason?: string;
  documentVerificationStatus: 'pending' | 'approved' | 'rejected';
  resubmittedAt?: string;

  // Driver details
  drivingLicenceNumber?: string;
  vehicleType?: string;
  vehicleRegistrationNumber?: string;

  // Student details
  collegeName?: string;
  studentIdNumber?: string;

  // Document availability
  hasAadhaar: boolean;
  hasDrivingLicence: boolean;
  hasAddressProof: boolean;
  hasVehicleRc: boolean;
  hasStudentIdCard: boolean;
  profileImage?: string;

  createdAt: string;
  updatedAt: string;
}

export interface AuditLogItem {
  _id: string;
  id?: string;
  adminName?: string;
  adminEmail?: string;
  action: string;
  targetUserEmail?: string;
  targetRole?: string;
  details?: string;
  reason?: string;
  createdAt: string;
}

export const adminApi = {
  // 1. Get complete overview statistics
  async getStats(): Promise<AdminStats> {
    const res: any = await apiClient.get('/admin/stats');
    return res.data || res;
  },

  // 2. List applications by type ('provider' | 'driver' | 'student' | 'all') and status
  async getApplications(params?: {
    type?: string;
    status?: string;
  }): Promise<ApplicationRecord[]> {
    const res: any = await apiClient.get('/admin/applications', { params });
    return Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
  },

  // Backward compatible method for provider applications
  async getProviderApplications(): Promise<ApplicationRecord[]> {
    return this.getApplications({ type: 'provider' });
  },

  // 3. Review & decide on application (approve, reject, info)
  async decideApplication(
    id: string,
    data: {
      decision?: 'approve' | 'reject' | 'info';
      status?: 'approved' | 'rejected' | 'info';
      reason?: string;
      note?: string;
    }
  ): Promise<any> {
    const res: any = await apiClient.patch(`/admin/applications/${id}`, data);
    return res.data || res;
  },

  // 4. List platform users
  async getUsers(params?: { role?: string; status?: string; page?: number }): Promise<any> {
    const res: any = await apiClient.get('/admin/users', { params });
    return res.data?.users || (Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : []);
  },

  // 5. Toggle user active status
  async setUserStatus(id: string, isActive: boolean): Promise<any> {
    const res: any = await apiClient.patch(`/admin/users/${id}/status`, { isActive });
    return res.data || res;
  },

  // 6. Suspend or unsuspend user
  async suspendUser(id: string, action: 'suspend' | 'unsuspend', reason: string): Promise<any> {
    const res: any = await apiClient.patch(`/admin/users/${id}/suspend`, { action, reason });
    return res.data || res;
  },

  // 7. Get activity & audit logs
  async getAuditLogs(page: number = 1): Promise<AuditLogItem[]> {
    const res: any = await apiClient.get('/admin/audit-logs', { params: { page } });
    return res.data?.logs || (Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : []);
  },
};
