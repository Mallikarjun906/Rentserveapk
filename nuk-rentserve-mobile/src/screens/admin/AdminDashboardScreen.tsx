// Administrator Control Desk for Document Verifications & Platform Metrics (12 Sections)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  FileText,
  Image as ImageIcon,
  GraduationCap,
  Eye,
  Check,
  X,
  Search,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { adminApi, AdminStats, ApplicationRecord, AuditLogItem } from '../../api/adminApi';
import { useLocalization } from '../../context/LocalizationContext';
import { DocumentViewerModal, DocumentItem } from '../../components/common/DocumentViewerModal';
import { CONFIG } from '../../constants/config';

interface AdminDashboardScreenProps {
  onBack: () => void;
}

type SectionKey =
  | 'overview'
  | 'pending_providers'
  | 'pending_drivers'
  | 'pending_students'
  | 'approved_providers'
  | 'approved_drivers'
  | 'approved_students'
  | 'rejected'
  | 'suspended'
  | 'documents'
  | 'users'
  | 'audit';

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ onBack }) => {
  const { t } = useLocalization();

  const [activeSection, setActiveSection] = useState<SectionKey>('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalServices: 0,
    totalProperties: 0,
    pendingProviders: 0,
    pendingDrivers: 0,
    pendingStudents: 0,
    approvedProviders: 0,
    approvedDrivers: 0,
    approvedStudents: 0,
    rejectedApplications: 0,
    suspendedAccounts: 0,
  });

  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Rejection modal state
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Suspension modal state
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  // In-Screen Document Viewer modal state
  const [docViewerOpen, setDocViewerOpen] = useState(false);
  const [previewDocs, setPreviewDocs] = useState<DocumentItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [currentReviewApp, setCurrentReviewApp] = useState<ApplicationRecord | null>(null);

  const openAppDocuments = (app: ApplicationRecord, startIndex: number = 0) => {
    const appId = app.id || app._id;
    const docs: DocumentItem[] = [];

    if (app.hasAadhaar) {
      docs.push({
        id: `${appId}-aadhaar`,
        docType: 'aadhaarDocument',
        title: `Masked Aadhaar ID (${app.fullName})`,
        url: `${CONFIG.API_BASE_URL}/admin/applications/${appId}/document/aadhaarDocument`,
        isPdf: false,
        format: 'jpg',
      });
    }

    if (app.hasDrivingLicence) {
      docs.push({
        id: `${appId}-dl`,
        docType: 'drivingLicenceDocument',
        title: `Driving Licence - DL (${app.fullName})`,
        url: `${CONFIG.API_BASE_URL}/admin/applications/${appId}/document/drivingLicenceDocument`,
        isPdf: true,
        format: 'pdf',
      });
    }

    if (app.hasVehicleRc) {
      docs.push({
        id: `${appId}-rc`,
        docType: 'vehicleRcDocument',
        title: `Vehicle RC Document (${app.fullName})`,
        url: `${CONFIG.API_BASE_URL}/admin/applications/${appId}/document/vehicleRcDocument`,
        isPdf: false,
        format: 'jpg',
      });
    }

    if (app.hasStudentIdCard) {
      docs.push({
        id: `${appId}-student`,
        docType: 'studentIdCardDocument',
        title: `Student ID Card (${app.fullName})`,
        url: `${CONFIG.API_BASE_URL}/admin/applications/${appId}/document/studentIdCardDocument`,
        isPdf: false,
        format: 'jpg',
      });
    }

    if (app.hasAddressProof) {
      docs.push({
        id: `${appId}-address`,
        docType: 'addressProofDocument',
        title: `Address Proof Document (${app.fullName})`,
        url: `${CONFIG.API_BASE_URL}/admin/applications/${appId}/document/addressProofDocument`,
        isPdf: true,
        format: 'pdf',
      });
    }

    if (docs.length === 0) {
      docs.push({
        id: `${appId}-default`,
        docType: 'aadhaarDocument',
        title: `Verification Document (${app.fullName})`,
        url: `${CONFIG.API_BASE_URL}/admin/applications/${appId}/document/aadhaarDocument`,
        isPdf: false,
        format: 'jpg',
      });
    }

    setCurrentReviewApp(app);
    setPreviewDocs(docs);
    setPreviewIndex(Math.min(startIndex, docs.length - 1));
    setDocViewerOpen(true);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, apps, u, logs] = await Promise.all([
        adminApi.getStats(),
        adminApi.getApplications({ type: 'all', status: 'all' }),
        adminApi.getUsers(),
        adminApi.getAuditLogs(),
      ]);
      if (s) setStats(s);
      if (Array.isArray(apps)) setApplications(apps);
      if (Array.isArray(u)) setUsers(u);
      if (Array.isArray(logs)) setAuditLogs(logs);
    } catch (err: any) {
      console.warn('Failed loading admin data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      await adminApi.decideApplication(id, { decision: 'approve', reason: 'Verified and approved by administrator.' });
      Alert.alert('Approved', 'Application verified and approved. Candidate has been activated.');
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not approve application.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedApp) return;
    if (!rejectionReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a clear reason for rejection so the user can resubmit correct documents.');
      return;
    }
    setActionLoading(true);
    try {
      await adminApi.decideApplication(selectedApp.id, { decision: 'reject', reason: rejectionReason.trim() });
      Alert.alert('Rejected', 'Application marked as rejected. Rejection reason recorded.');
      setSelectedApp(null);
      setRejectionReason('');
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not reject application.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendToggle = async (userId: string, currentStatus: string) => {
    const willSuspend = currentStatus !== 'suspended';
    if (willSuspend && !suspendReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a suspension reason for the audit trail.');
      return;
    }
    setActionLoading(true);
    try {
      await adminApi.suspendUser(userId, willSuspend ? 'suspend' : 'unsuspend', suspendReason.trim() || 'Administrator action');
      Alert.alert('Status Updated', `User account ${willSuspend ? 'suspended' : 'unsuspended'}.`);
      setSelectedUser(null);
      setSuspendReason('');
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Section Filter Helpers
  const pendingProviders = applications.filter((a) => a.applicationType === 'provider' && a.status === 'pending');
  const pendingDrivers = applications.filter((a) => a.applicationType === 'driver' && a.status === 'pending');
  const pendingStudents = applications.filter((a) => a.applicationType === 'student' && a.status === 'pending');
  const approvedProviders = applications.filter((a) => a.applicationType === 'provider' && a.status === 'approved');
  const approvedDrivers = applications.filter((a) => a.applicationType === 'driver' && a.status === 'approved');
  const approvedStudents = applications.filter((a) => a.applicationType === 'student' && a.status === 'approved');
  const rejectedApps = applications.filter((a) => a.status === 'rejected');
  const suspendedUsers = users.filter((u) => u.approvalStatus === 'suspended');

  const SECTIONS: Array<{ key: SectionKey; label: string; count?: number }> = [
    { key: 'overview', label: '1. Overview Desk' },
    { key: 'pending_providers', label: '2. Pending Providers', count: stats.pendingProviders },
    { key: 'pending_drivers', label: '3. Pending Drivers', count: stats.pendingDrivers },
    { key: 'pending_students', label: '4. Pending Students', count: stats.pendingStudents },
    { key: 'approved_providers', label: '5. Approved Providers', count: stats.approvedProviders },
    { key: 'approved_drivers', label: '6. Approved Drivers', count: stats.approvedDrivers },
    { key: 'approved_students', label: '7. Approved Students', count: stats.approvedStudents },
    { key: 'rejected', label: '8. Rejected Applications', count: stats.rejectedApplications },
    { key: 'suspended', label: '9. Suspended Accounts', count: stats.suspendedAccounts },
    { key: 'documents', label: '10. Document Verification', count: applications.length },
    { key: 'users', label: '11. User Management', count: stats.totalUsers },
    { key: 'audit', label: '12. Audit Logs', count: auditLogs.length },
  ];

  const renderAppCard = (app: ApplicationRecord) => (
    <View key={app.id} style={[styles.card, SHADOWS.card]}>
      <View style={styles.cardTop}>
        <View style={styles.cardHeaderCol}>
          <Text style={styles.appName}>{app.fullName}</Text>
          <Text style={styles.appSub}>
            {app.city} · {app.phone} · {app.email}
          </Text>
        </View>
        <Badge
          tone={app.status === 'approved' ? 'ok' : app.status === 'rejected' ? 'bad' : 'sun'}
          label={app.status.toUpperCase()}
        />
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Type:</Text>
        <Text style={styles.detailVal}>{app.applicationType.toUpperCase()} ({app.category || 'General'})</Text>
      </View>

      {app.drivingLicenceNumber ? (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>DL Number:</Text>
          <Text style={styles.detailVal}>{app.drivingLicenceNumber}</Text>
        </View>
      ) : null}

      {app.vehicleRegistrationNumber ? (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Vehicle Reg:</Text>
          <Text style={styles.detailVal}>{app.vehicleRegistrationNumber} ({app.vehicleType})</Text>
        </View>
      ) : null}

      {app.collegeName ? (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>College / USN:</Text>
          <Text style={styles.detailVal}>{app.collegeName} · {app.studentIdNumber}</Text>
        </View>
      ) : null}

      {/* Interactive Verification Documents Desk */}
      <View style={styles.docsSection}>
        <View style={styles.docsSectionHeader}>
          <Text style={styles.docsSectionTitle}>ATTACHED VERIFICATION DOCUMENTS:</Text>
          <Text style={styles.docsSectionSub}>Tap any document to open live preview</Text>
        </View>

        <View style={styles.docsChipsRow}>
          {app.hasAadhaar ? (
            <TouchableOpacity
              style={styles.docChip}
              onPress={() => openAppDocuments(app, 0)}
              activeOpacity={0.7}
            >
              <ImageIcon size={18} color="#2563EB" />
              <View style={styles.docChipInfo}>
                <Text style={styles.docChipName}>Aadhaar ID (Masked)</Text>
                <Text style={styles.docChipAction}>Tap to Preview</Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {app.hasDrivingLicence ? (
            <TouchableOpacity
              style={[styles.docChip, styles.docChipPdf]}
              onPress={() => openAppDocuments(app, app.hasAadhaar ? 1 : 0)}
              activeOpacity={0.7}
            >
              <FileText size={18} color={COLORS.brand} />
              <View style={styles.docChipInfo}>
                <Text style={styles.docChipName}>Driving Licence (DL)</Text>
                <Text style={styles.docChipAction}>View Document</Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {app.hasVehicleRc ? (
            <TouchableOpacity
              style={styles.docChip}
              onPress={() =>
                openAppDocuments(
                  app,
                  (app.hasAadhaar ? 1 : 0) + (app.hasDrivingLicence ? 1 : 0)
                )
              }
              activeOpacity={0.7}
            >
              <ImageIcon size={18} color="#059669" />
              <View style={styles.docChipInfo}>
                <Text style={styles.docChipName}>Vehicle RC Document</Text>
                <Text style={styles.docChipAction}>Tap to Preview</Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {app.hasStudentIdCard ? (
            <TouchableOpacity
              style={styles.docChip}
              onPress={() => openAppDocuments(app, app.hasAadhaar ? 1 : 0)}
              activeOpacity={0.7}
            >
              <GraduationCap size={18} color={COLORS.brand} />
              <View style={styles.docChipInfo}>
                <Text style={styles.docChipName}>Student ID Card</Text>
                <Text style={styles.docChipAction}>Tap to Preview</Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {app.hasAddressProof ? (
            <TouchableOpacity
              style={[styles.docChip, styles.docChipPdf]}
              onPress={() => openAppDocuments(app, 0)}
              activeOpacity={0.7}
            >
              <FileText size={18} color="#2563EB" />
              <View style={styles.docChipInfo}>
                <Text style={styles.docChipName}>Address Proof</Text>
                <Text style={styles.docChipAction}>View Document</Text>
              </View>
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.previewAllBtn}
          onPress={() => openAppDocuments(app, 0)}
          activeOpacity={0.8}
        >
          <Text style={styles.previewAllBtnText}>
            Open In-Screen Document Review Desk (Zoom & Multi-Page)
          </Text>
        </TouchableOpacity>
      </View>

      {app.rejectionReason ? (
        <View style={styles.rejectionBox}>
          <Text style={styles.rejectionTitle}>Rejection Reason:</Text>
          <Text style={styles.rejectionText}>{app.rejectionReason}</Text>
        </View>
      ) : null}

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        {app.status === 'pending' || app.status === 'rejected' ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={() => handleApprove(app.id)}
            disabled={actionLoading}
          >
            <Text style={styles.actionBtnText}>Approve</Text>
          </TouchableOpacity>
        ) : null}

        {app.status === 'pending' || app.status === 'approved' ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => setSelectedApp(app)}
            disabled={actionLoading}
          >
            <Text style={styles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        title={t('adminDashboard', 'ನಿರ್ವಾಹಕರ ಕಂಟ್ರೋಲ್ ಪ್ಯಾನೆಲ್')}
        subtitle="12-Section Verification & Platform Governance Desk"
        onBack={onBack}
      />

      {/* Section Tabs Scroll */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {SECTIONS.map((sec) => (
            <TouchableOpacity
              key={sec.key}
              style={[styles.tabPill, activeSection === sec.key && styles.tabPillActive]}
              onPress={() => setActiveSection(sec.key)}
            >
              <Text style={[styles.tabPillText, activeSection === sec.key && styles.tabPillTextActive]}>
                {sec.label} {sec.count !== undefined ? `(${sec.count})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? <ActivityIndicator size="large" color={COLORS.brand} style={{ marginVertical: 30 }} /> : null}

        {/* 1. OVERVIEW SECTION */}
        {activeSection === 'overview' && (
          <View>
            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, SHADOWS.card]}>
                <Text style={styles.metricLabel}>Total Users</Text>
                <Text style={styles.metricVal}>{stats.totalUsers}</Text>
              </View>
              <View style={[styles.metricCard, SHADOWS.card]}>
                <Text style={styles.metricLabel}>Pending Providers</Text>
                <Text style={[styles.metricVal, { color: COLORS.sun }]}>{stats.pendingProviders}</Text>
              </View>
              <View style={[styles.metricCard, SHADOWS.card]}>
                <Text style={styles.metricLabel}>Pending Drivers</Text>
                <Text style={[styles.metricVal, { color: COLORS.sun }]}>{stats.pendingDrivers}</Text>
              </View>
              <View style={[styles.metricCard, SHADOWS.card]}>
                <Text style={styles.metricLabel}>Pending Students</Text>
                <Text style={[styles.metricVal, { color: COLORS.sun }]}>{stats.pendingStudents}</Text>
              </View>
              <View style={[styles.metricCard, SHADOWS.card]}>
                <Text style={styles.metricLabel}>Approved Drivers</Text>
                <Text style={[styles.metricVal, { color: COLORS.ok }]}>{stats.approvedDrivers}</Text>
              </View>
              <View style={[styles.metricCard, SHADOWS.card]}>
                <Text style={styles.metricLabel}>Suspended Accounts</Text>
                <Text style={[styles.metricVal, { color: COLORS.bad }]}>{stats.suspendedAccounts}</Text>
              </View>
            </View>

            <Text style={styles.sectionHeading}>Priority Action Queue</Text>
            {applications.filter((a) => a.status === 'pending').slice(0, 5).map(renderAppCard)}
          </View>
        )}

        {/* 2. PENDING PROVIDERS */}
        {activeSection === 'pending_providers' && (
          <View>
            <Text style={styles.sectionHeading}>Pending Service Provider Applications</Text>
            {pendingProviders.length === 0 ? <Text style={styles.emptyText}>No pending provider applications.</Text> : pendingProviders.map(renderAppCard)}
          </View>
        )}

        {/* 3. PENDING DRIVERS */}
        {activeSection === 'pending_drivers' && (
          <View>
            <Text style={styles.sectionHeading}>Pending Driver Partner Applications</Text>
            {pendingDrivers.length === 0 ? <Text style={styles.emptyText}>No pending driver applications.</Text> : pendingDrivers.map(renderAppCard)}
          </View>
        )}

        {/* 4. PENDING STUDENTS */}
        {activeSection === 'pending_students' && (
          <View>
            <Text style={styles.sectionHeading}>Pending Student Partner Applications</Text>
            {pendingStudents.length === 0 ? <Text style={styles.emptyText}>No pending student applications.</Text> : pendingStudents.map(renderAppCard)}
          </View>
        )}

        {/* 5. APPROVED PROVIDERS */}
        {activeSection === 'approved_providers' && (
          <View>
            <Text style={styles.sectionHeading}>Approved Service Providers</Text>
            {approvedProviders.length === 0 ? <Text style={styles.emptyText}>No approved providers yet.</Text> : approvedProviders.map(renderAppCard)}
          </View>
        )}

        {/* 6. APPROVED DRIVERS */}
        {activeSection === 'approved_drivers' && (
          <View>
            <Text style={styles.sectionHeading}>Approved Drivers (Dispatch Active)</Text>
            {approvedDrivers.length === 0 ? <Text style={styles.emptyText}>No approved drivers yet.</Text> : approvedDrivers.map(renderAppCard)}
          </View>
        )}

        {/* 7. APPROVED STUDENTS */}
        {activeSection === 'approved_students' && (
          <View>
            <Text style={styles.sectionHeading}>Approved Student Rental Partners</Text>
            {approvedStudents.length === 0 ? <Text style={styles.emptyText}>No approved students yet.</Text> : approvedStudents.map(renderAppCard)}
          </View>
        )}

        {/* 8. REJECTED APPLICATIONS */}
        {activeSection === 'rejected' && (
          <View>
            <Text style={styles.sectionHeading}>Rejected Applications (Allowed to Resubmit)</Text>
            {rejectedApps.length === 0 ? <Text style={styles.emptyText}>No rejected applications.</Text> : rejectedApps.map(renderAppCard)}
          </View>
        )}

        {/* 9. SUSPENDED ACCOUNTS */}
        {activeSection === 'suspended' && (
          <View>
            <Text style={styles.sectionHeading}>Suspended Platform Accounts</Text>
            {suspendedUsers.length === 0 ? (
              <Text style={styles.emptyText}>No suspended accounts.</Text>
            ) : (
              suspendedUsers.map((u) => (
                <View key={u._id} style={[styles.card, SHADOWS.card]}>
                  <Text style={styles.appName}>{u.name} ({u.role})</Text>
                  <Text style={styles.appSub}>✉️ {u.email} · 📞 {u.phone}</Text>
                  <Text style={styles.rejectionText}>Reason: {u.suspendedReason || 'Administrative suspension'}</Text>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn, { marginTop: 10 }]}
                    onPress={() => handleSuspendToggle(u._id, 'suspended')}
                  >
                    <Text style={styles.actionBtnText}>Reactivate Account</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* 10. DOCUMENT VERIFICATION */}
        {activeSection === 'documents' && (
          <View>
            <Text style={styles.sectionHeading}>Document Verification Desk</Text>
            <Text style={styles.docDesc}>
              Aadhaar numbers are masked for privacy. Private documents are accessible to administrators via authorized endpoints only.
            </Text>
            {applications.map(renderAppCard)}
          </View>
        )}

        {/* 11. USER MANAGEMENT */}
        {activeSection === 'users' && (
          <View>
            <Text style={styles.sectionHeading}>Platform User Directory ({users.length})</Text>
            {users.map((u) => (
              <View key={u._id} style={[styles.card, SHADOWS.card]}>
                <View style={styles.cardTop}>
                  <View>
                    <Text style={styles.appName}>{u.name}</Text>
                    <Text style={styles.appSub}>{u.email} · {u.location}</Text>
                  </View>
                  <Badge tone="ok" label={u.role.toUpperCase()} />
                </View>
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, u.approvalStatus === 'suspended' ? styles.approveBtn : styles.rejectBtn]}
                    onPress={() => {
                      setSelectedUser(u);
                      setSuspendReason(u.approvalStatus === 'suspended' ? '' : 'Violated terms');
                    }}
                  >
                    <Text style={styles.actionBtnText}>
                      {u.approvalStatus === 'suspended' ? 'Unsuspend' : 'Suspend Account'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 12. ACTIVITY & AUDIT LOGS */}
        {activeSection === 'audit' && (
          <View>
            <Text style={styles.sectionHeading}>Audit Trail & Governance Logs ({auditLogs.length})</Text>
            {auditLogs.map((log) => (
              <View key={log._id} style={[styles.auditCard, SHADOWS.card]}>
                <View style={styles.cardTop}>
                  <Text style={styles.auditAction}>{log.action}</Text>
                  <Text style={styles.auditTime}>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <Text style={styles.auditDetails}>{log.details}</Text>
                {log.adminEmail ? <Text style={styles.auditAdmin}>By: {log.adminEmail}</Text> : null}
                {log.reason ? <Text style={styles.auditReason}>Reason: {log.reason}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {/* Rejection Reason Modal */}
        {selectedApp && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Reject Application</Text>
              <Text style={styles.modalSub}>
                Provide a clear reason for rejecting {selectedApp.fullName} ({selectedApp.applicationType}).
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Driving licence photo was blurry / expired. Please resubmit clear copy."
                value={rejectionReason}
                onChangeText={setRejectionReason}
                multiline
                numberOfLines={3}
              />
              <View style={styles.modalActions}>
                <Button title="Cancel" variant="outline" onPress={() => setSelectedApp(null)} style={{ flex: 1 }} />
                <Button title="Confirm Rejection" variant="primary" onPress={handleRejectConfirm} loading={actionLoading} style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        )}

        {/* Suspend User Modal */}
        {selectedUser && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {selectedUser.approvalStatus === 'suspended' ? 'Reactivate User' : 'Suspend User Account'}
              </Text>
              <Text style={styles.modalSub}>{selectedUser.name} ({selectedUser.email})</Text>
              {selectedUser.approvalStatus !== 'suspended' && (
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter reason for suspending this user..."
                  value={suspendReason}
                  onChangeText={setSuspendReason}
                  multiline
                />
              )}
              <View style={styles.modalActions}>
                <Button title="Cancel" variant="outline" onPress={() => setSelectedUser(null)} style={{ flex: 1 }} />
                <Button
                  title="Confirm"
                  variant="primary"
                  onPress={() => handleSuspendToggle(selectedUser._id, selectedUser.approvalStatus)}
                  loading={actionLoading}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Live In-Screen Document Viewer & Verification Review Desk Modal */}
      <DocumentViewerModal
        visible={docViewerOpen}
        onClose={() => setDocViewerOpen(false)}
        documents={previewDocs}
        currentIndex={previewIndex}
        onSelectIndex={setPreviewIndex}
        canReview={true}
        actionLoading={actionLoading}
        onApprove={async () => {
          if (currentReviewApp) {
            await handleApprove(currentReviewApp.id);
            setDocViewerOpen(false);
          }
        }}
        onReject={async (reason) => {
          if (currentReviewApp) {
            setActionLoading(true);
            try {
              await adminApi.decideApplication(currentReviewApp.id, {
                decision: 'reject',
                reason,
              });
              Alert.alert(
                'Rejected',
                'Application has been rejected with the specified reason.'
              );
              await loadData();
              setDocViewerOpen(false);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not reject application.');
            } finally {
              setActionLoading(false);
            }
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paper },
  docsSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.lg,
    padding: 12,
    marginTop: 10,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  docsSectionHeader: {
    marginBottom: 8,
  },
  docsSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: 0.3,
  },
  docsSectionSub: {
    fontSize: 10,
    color: COLORS.mute,
    marginTop: 1,
  },
  docsChipsRow: {
    flexDirection: 'column',
    gap: 6,
  },
  docChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  docChipPdf: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  docChipIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  docChipInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  docChipName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  docChipAction: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.brand,
  },
  previewAllBtn: {
    backgroundColor: COLORS.brand,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: 10,
  },
  previewAllBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 12,
  },
  tabsWrapper: { backgroundColor: COLORS.white, borderBottomWidth: 1.5, borderColor: COLORS.line },
  tabsScroll: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tabPill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    backgroundColor: COLORS.paper,
  },
  tabPillActive: { borderColor: COLORS.brand, backgroundColor: COLORS.brandTint },
  tabPillText: { fontSize: 12, fontWeight: '700', color: COLORS.ink },
  tabPillTextActive: { color: COLORS.brand },
  scroll: { padding: 16, paddingBottom: 60 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.line,
  },
  metricLabel: { fontSize: 11, fontWeight: '700', color: COLORS.mute, textTransform: 'uppercase' },
  metricVal: { fontSize: 24, fontWeight: '900', color: COLORS.ink, marginTop: 4 },
  sectionHeading: { fontSize: 16, fontWeight: '900', color: COLORS.ink, marginBottom: 12, marginTop: 4 },
  docDesc: { fontSize: 12, color: COLORS.mute, marginBottom: 12, lineHeight: 18 },
  emptyText: { fontSize: 14, color: COLORS.mute, fontStyle: 'italic', marginVertical: 20, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardHeaderCol: { flex: 1, marginRight: 8 },
  appName: { fontSize: 16, fontWeight: '900', color: COLORS.ink },
  appSub: { fontSize: 12, color: COLORS.mute, marginTop: 2 },
  detailRow: { flexDirection: 'row', marginTop: 4 },
  detailLabel: { fontSize: 12, fontWeight: '700', color: COLORS.mute, width: 90 },
  detailVal: { fontSize: 12, color: COLORS.ink, flex: 1 },
  docsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, marginBottom: 10 },
  rejectionBox: {
    backgroundColor: COLORS.badTint,
    borderRadius: RADIUS.md,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.bad,
    marginTop: 6,
  },
  rejectionTitle: { fontSize: 11, fontWeight: '800', color: COLORS.bad },
  rejectionText: { fontSize: 12, color: COLORS.bad, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, alignItems: 'center' },
  approveBtn: { backgroundColor: COLORS.ok },
  rejectBtn: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#EF4444' },
  actionBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 13 },
  rejectBtnText: { color: '#DC2626', fontWeight: '800', fontSize: 13 },
  auditCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    marginBottom: 8,
  },
  auditAction: { fontSize: 13, fontWeight: '800', color: COLORS.brand },
  auditTime: { fontSize: 11, color: COLORS.mute },
  auditDetails: { fontSize: 13, color: COLORS.ink, marginTop: 4 },
  auditAdmin: { fontSize: 11, color: COLORS.mute, marginTop: 4 },
  auditReason: { fontSize: 11, color: COLORS.bad, marginTop: 2, fontWeight: '600' },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 999,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 20,
    width: '100%',
    maxWidth: 420,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: COLORS.ink, marginBottom: 4 },
  modalSub: { fontSize: 13, color: COLORS.mute, marginBottom: 12 },
  modalInput: {
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 10,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', gap: 10 },
});
