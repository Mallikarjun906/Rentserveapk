// Service Provider Professional Portal & Operations Dashboard
// Designed specifically for Carpenters, Plumbers, Electricians, Painters, Technicians and Registered Professionals

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Linking,
  Switch,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import {
  Wrench,
  MapPin,
  ShieldCheck,
  FileText,
  Eye,
  User as UserIcon,
  Calendar,
  Phone,
  MessageSquare,
  RotateCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Banknote,
  LogOut,
  HelpCircle,
  Briefcase,
  Star,
  Plus,
  Trash2,
  ChevronRight,
  Send,
  LayoutDashboard,
  Check,
  X,
  AlertCircle,
  Radio,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { EmptyState } from '../../components/common/EmptyState';
import { formatINR } from '../../utils/formatters';
import { useLocalization } from '../../context/LocalizationContext';
import { useAuth } from '../../context/AuthContext';
import { providerApi, ProviderServiceRequest } from '../../api/providerApi';
import { authApi } from '../../api/authApi';
import { chatApi, ConversationThread } from '../../api/chatApi';
import { DocumentViewerModal, DocumentItem } from '../../components/common/DocumentViewerModal';
import { CONFIG } from '../../constants/config';
import { confirmAction } from '../../utils/confirmAlert';

export type ProviderTabType = 'dashboard' | 'requests' | 'jobs' | 'messages' | 'profile';

interface ProviderDashboardScreenProps {
  initialTab?: 'dashboard' | 'requests' | 'jobs' | 'messages' | 'profile' | 'services';
  onBack?: () => void;
  onOpenChat: (params: { bookingId: string; name: string; role: string; phone?: string }) => void;
  onLogout?: () => void;
  onNavigateSupport?: () => void;
}

export const ProviderDashboardScreen: React.FC<ProviderDashboardScreenProps> = ({
  initialTab,
  onBack,
  onOpenChat,
  onLogout,
  onNavigateSupport,
}) => {
  const { t } = useLocalization();
  const { user, token, logout } = useAuth();

  // Active Tab: dashboard | requests | jobs | messages | profile
  const [activeTab, setActiveTab] = useState<ProviderTabType>(() => {
    if (initialTab === 'services') return 'profile';
    if (initialTab && ['dashboard', 'requests', 'jobs', 'messages', 'profile'].includes(initialTab)) {
      return initialTab as ProviderTabType;
    }
    return 'dashboard';
  });

  // Jobs Filter: ongoing | completed
  const [jobsFilter, setJobsFilter] = useState<'ongoing' | 'completed'>('ongoing');

  // Core Data
  const [profile, setProfile] = useState<any>(null);
  const [requests, setRequests] = useState<ProviderServiceRequest[]>([]);
  const [acceptedBookings, setAcceptedBookings] = useState<ProviderServiceRequest[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [conversations, setConversations] = useState<ConversationThread[]>([]);

  // Status & Actions
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [onlineUpdating, setOnlineUpdating] = useState<boolean>(false);
  const [locUpdating, setLocUpdating] = useState<boolean>(false);
  const [locNotice, setLocNotice] = useState<string>('');
  const [actionId, setActionId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Modals
  const [servicesModalOpen, setServicesModalOpen] = useState<boolean>(false);
  const [enquiriesModalOpen, setEnquiriesModalOpen] = useState<boolean>(false);
  const [supportModalOpen, setSupportModalOpen] = useState<boolean>(false);
  const [docModalOpen, setDocModalOpen] = useState<boolean>(false);
  const [previewDocs, setPreviewDocs] = useState<DocumentItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number>(0);

  // Form states for adding a new service
  const [newServiceTitle, setNewServiceTitle] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceMinPrice, setNewServiceMinPrice] = useState('350');
  const [newServiceMaxPrice, setNewServiceMaxPrice] = useState('800');
  const [savingService, setSavingService] = useState(false);

  // Form states for enquiries reply
  const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replying, setReplying] = useState(false);

  // Form states for support ticket
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [submittingSupport, setSubmittingSupport] = useState(false);

  // Sync initial tab if it changes externally
  useEffect(() => {
    if (initialTab === 'services') setActiveTab('profile');
    else if (initialTab && ['dashboard', 'requests', 'jobs', 'messages', 'profile'].includes(initialTab)) {
      setActiveTab(initialTab as ProviderTabType);
    }
  }, [initialTab]);

  // Master Data Fetch
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const [profRes, reqRes, accRes, servRes, enqRes, convRes, meRes] = await Promise.allSettled([
        providerApi.getMyProfile(),
        providerApi.getReceivedRequests(),
        providerApi.getMyAcceptedBookings(),
        providerApi.getMyServices(),
        providerApi.getReceivedEnquiries(),
        chatApi.getConversations(),
        authApi.getMe(),
      ]);

      if (profRes.status === 'fulfilled') {
        setProfile(profRes.value);
        if (typeof profRes.value?.availability === 'boolean') {
          setIsOnline(profRes.value.availability);
        }
      }
      if (reqRes.status === 'fulfilled') {
        const items = Array.isArray(reqRes.value) ? reqRes.value : [];
        setRequests(items.filter((r) => r.status === 'pending'));
      }
      if (accRes.status === 'fulfilled') {
        setAcceptedBookings(Array.isArray(accRes.value) ? accRes.value : []);
      }
      if (servRes.status === 'fulfilled') {
        setServices(Array.isArray(servRes.value) ? servRes.value : []);
      }
      if (enqRes.status === 'fulfilled') {
        setEnquiries(Array.isArray(enqRes.value) ? enqRes.value : []);
      }
      if (convRes.status === 'fulfilled') {
        setConversations(Array.isArray(convRes.value) ? convRes.value : []);
      }
      if (meRes.status === 'fulfilled' && typeof meRes.value?.isOnline === 'boolean') {
        setIsOnline(meRes.value.isOnline);
      }
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      loadData(true);
    }, 12000);
    return () => clearInterval(timer);
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleToggleOnline = async (val: boolean) => {
    if (onlineUpdating) return;
    setOnlineUpdating(true);
    const previous = isOnline;
    setIsOnline(val);

    try {
      await authApi.updateMe({ isOnline: val });
      try {
        await providerApi.updateMyProfile({ availability: val });
      } catch {}

      if (!val) {
        setRequests([]);
      } else {
        loadData(true);
      }
    } catch (e: any) {
      setIsOnline(previous);
      Alert.alert('Status Error', e.message || 'Could not update online status. Please check your connection.');
    } finally {
      setOnlineUpdating(false);
    }
  };

  const handleRefreshLocation = async () => {
    setLocUpdating(true);
    setLocNotice('');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Permission Needed', 'Allow location access so customers nearby can find your services.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await providerApi.updateLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      setLocNotice(`GPS location updated (${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)})`);
      setTimeout(() => setLocNotice(''), 4000);
    } catch (e: any) {
      Alert.alert('GPS Notice', e.message || 'Could not fetch current device position.');
    } finally {
      setLocUpdating(false);
    }
  };

  const handleRespond = async (bookingId: string, decision: 'accepted' | 'rejected') => {
    setActionId(bookingId);
    try {
      await providerApi.respondToRequest(bookingId, decision);
      Alert.alert(
        decision === 'accepted' ? 'Request Accepted' : 'Request Declined',
        decision === 'accepted'
          ? 'You have accepted the customer request. You can now coordinate or start the job.'
          : 'The request has been declined.'
      );
      loadData(true);
    } catch (e: any) {
      Alert.alert('Action Failed', e.message || 'Could not update request.');
    } finally {
      setActionId('');
    }
  };

  const handleUpdateJobStatus = async (bookingId: string, status: 'in_progress' | 'completed') => {
    setActionId(bookingId);
    try {
      await providerApi.respondToRequest(bookingId, status);
      Alert.alert(
        status === 'in_progress' ? 'Job Started' : 'Job Completed',
        status === 'in_progress'
          ? 'Job marked as In Progress. Continue work and coordinate with customer.'
          : 'Job marked Completed. Total earnings and history updated.'
      );
      loadData(true);
    } catch (e: any) {
      Alert.alert('Update Failed', e.message || 'Could not update job status.');
    } finally {
      setActionId('');
    }
  };

  const handleAddService = async () => {
    if (!newServiceTitle.trim()) {
      Alert.alert('Title Required', 'Please enter a name for this service offering.');
      return;
    }
    setSavingService(true);
    try {
      await providerApi.createService({
        title: newServiceTitle.trim(),
        description: newServiceDesc.trim() || 'Professional repair and installation service.',
        priceRange: {
          min: Number(newServiceMinPrice) || 350,
          max: Number(newServiceMaxPrice) || 800,
        },
        location: profile?.address || profile?.city || user?.location || 'Bagalkot',
      });
      Alert.alert('Service Added', 'Your service offering has been registered.');
      setNewServiceTitle('');
      setNewServiceDesc('');
      setServicesModalOpen(false);
      loadData(true);
    } catch (e: any) {
      Alert.alert('Failed to Add Service', e.message || 'Could not save service listing.');
    } finally {
      setSavingService(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    confirmAction(
      'Delete Service',
      'Are you sure you want to remove this service offering?',
      async () => {
        try {
          await providerApi.deleteService(serviceId);
          loadData(true);
        } catch (e: any) {
          Alert.alert('Error', e.message || 'Could not remove service.');
        }
      },
      'Delete'
    );
  };

  const handleReplyEnquiry = async () => {
    if (!selectedEnquiry?._id) return;
    if (!replyMessage.trim()) {
      Alert.alert('Message Required', 'Please enter your reply to the customer.');
      return;
    }
    setReplying(true);
    try {
      await providerApi.replyEnquiry(selectedEnquiry._id, 'replied', replyMessage.trim());
      Alert.alert('Reply Sent', 'Your response has been sent to the customer.');
      setSelectedEnquiry(null);
      setReplyMessage('');
      loadData(true);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not send reply.');
    } finally {
      setReplying(false);
    }
  };

  const handleCreateSupportTicket = async () => {
    if (!supportSubject.trim() || !supportMessage.trim()) {
      Alert.alert('Details Required', 'Please fill in both subject and description.');
      return;
    }
    setSubmittingSupport(true);
    try {
      await providerApi.createSupportTicket({
        subject: supportSubject.trim(),
        message: supportMessage.trim(),
        category: 'provider_help',
      });
      Alert.alert('Ticket Submitted', 'Our desk will review your query and contact you.');
      setSupportSubject('');
      setSupportMessage('');
      setSupportModalOpen(false);
    } catch (e: any) {
      Alert.alert('Support Notice', e.message || 'Could not submit support ticket.');
    } finally {
      setSubmittingSupport(false);
    }
  };

  const openDocumentPreview = (docType: string, title: string, isPdf = false) => {
    const list: DocumentItem[] = [
      {
        id: `provider-${docType}`,
        docType,
        title,
        url: `${CONFIG.API_BASE_URL}/documents/mine/${docType}?token=${token}`,
        isPdf,
        format: isPdf ? 'pdf' : 'jpg',
      },
    ];
    setPreviewDocs(list);
    setPreviewIndex(0);
    setDocModalOpen(true);
  };

  const handleLogout = () => {
    confirmAction(
      'Sign Out',
      'Are you sure you want to sign out from your provider portal?',
      async () => {
        await logout();
        if (onLogout) onLogout();
        else if (onBack) onBack();
      },
      'Sign Out'
    );
  };

  // Filter Bookings
  const ongoingJobs = acceptedBookings.filter(
    (b) => b.status === 'accepted' || (b.status as any) === 'in_progress'
  );
  const completedJobs = acceptedBookings.filter((b) => b.status === 'completed');

  // KPI Calculations
  const totalCompletedEarnings = completedJobs.length * 350; // Standard baseline fee per completed job
  const appStatus = profile?.verificationStatus || profile?.status || user?.approvalStatus || 'pending';
  const tradeCategory = profile?.category || (user as any)?.serviceCategory || 'General Technician';
  const providerDisplayName = profile?.fullName || profile?.displayName || user?.name || 'Service Partner';

  const statusTone: 'ok' | 'bad' | 'sun' =
    appStatus === 'approved' || appStatus === 'verified'
      ? 'ok'
      : appStatus === 'rejected'
      ? 'bad'
      : 'sun';

  return (
    <View style={styles.container}>
      {/* Dedicated Provider Header */}
      <Header
        title={t('providerPortal', 'ಸೇವಾ ಪೂರೈಕೆದಾರರ ಪೋರ್ಟಲ್')}
        subtitle={`${providerDisplayName} · ${tradeCategory}`}
        onBack={onBack}
        rightAction={
          <View style={styles.headerRightRow}>
            {/* Online / Offline Live Switch */}
            <View style={styles.onlineToggleRow}>
              {onlineUpdating ? (
                <ActivityIndicator size="small" color={COLORS.brand} style={{ marginRight: 4 }} />
              ) : (
                <Text style={[styles.onlineLabel, isOnline ? styles.textOk : styles.textMute]}>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              )}
              <Switch
                value={isOnline}
                onValueChange={handleToggleOnline}
                trackColor={{ false: '#D1D5DB', true: COLORS.okTint }}
                thumbColor={isOnline ? COLORS.ok : '#9CA3AF'}
                disabled={onlineUpdating}
              />
            </View>

            {/* GPS Location Refresh */}
            <TouchableOpacity
              onPress={handleRefreshLocation}
              style={styles.locIconBtn}
              disabled={locUpdating}
              activeOpacity={0.8}
              accessibilityLabel="Update GPS Location"
            >
              {locUpdating ? (
                <ActivityIndicator size="small" color={COLORS.brand} />
              ) : (
                <MapPin size={17} color={COLORS.brand} />
              )}
            </TouchableOpacity>

            {/* Support Desk */}
            <TouchableOpacity
              onPress={() => {
                if (onNavigateSupport) onNavigateSupport();
                else setSupportModalOpen(true);
              }}
              style={styles.supportIconBtn}
              accessibilityLabel="Help and Support"
            >
              <HelpCircle size={16} color={COLORS.ink} />
            </TouchableOpacity>

            {/* Sign Out */}
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutIconBtn}
              accessibilityLabel="Sign Out"
            >
              <LogOut size={14} color={COLORS.bad} />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Top Segmented Navigation Tabs */}
      <View style={styles.topTabBar}>
        <TouchableOpacity
          style={[styles.topTabItem, activeTab === 'dashboard' && styles.topTabItemActive]}
          onPress={() => setActiveTab('dashboard')}
          activeOpacity={0.7}
        >
          <LayoutDashboard size={15} color={activeTab === 'dashboard' ? COLORS.brand : COLORS.mute} />
          <Text style={[styles.topTabText, activeTab === 'dashboard' && styles.topTabTextActive]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTabItem, activeTab === 'requests' && styles.topTabItemActive]}
          onPress={() => setActiveTab('requests')}
          activeOpacity={0.7}
        >
          <Clock size={15} color={activeTab === 'requests' ? COLORS.brand : COLORS.mute} />
          <Text style={[styles.topTabText, activeTab === 'requests' && styles.topTabTextActive]}>
            Requests ({requests.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTabItem, activeTab === 'jobs' && styles.topTabItemActive]}
          onPress={() => setActiveTab('jobs')}
          activeOpacity={0.7}
        >
          <Briefcase size={15} color={activeTab === 'jobs' ? COLORS.brand : COLORS.mute} />
          <Text style={[styles.topTabText, activeTab === 'jobs' && styles.topTabTextActive]}>
            Jobs ({ongoingJobs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTabItem, activeTab === 'messages' && styles.topTabItemActive]}
          onPress={() => setActiveTab('messages')}
          activeOpacity={0.7}
        >
          <MessageSquare size={15} color={activeTab === 'messages' ? COLORS.brand : COLORS.mute} />
          <Text style={[styles.topTabText, activeTab === 'messages' && styles.topTabTextActive]}>
            Messages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTabItem, activeTab === 'profile' && styles.topTabItemActive]}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.7}
        >
          <UserIcon size={15} color={activeTab === 'profile' ? COLORS.brand : COLORS.mute} />
          <Text style={[styles.topTabText, activeTab === 'profile' && styles.topTabTextActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.brand} />}
      >
        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <View>
            {/* Verification Status Banner */}
            <View style={[styles.welcomeBanner, SHADOWS.card]}>
              <View style={styles.welcomeBannerTop}>
                <View style={styles.avatarPill}>
                  <Wrench size={20} color={COLORS.brand} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.welcomeGreeting}>Service Professional Desk</Text>
                  <Text style={styles.welcomeName}>{providerDisplayName}</Text>
                  <Text style={styles.welcomeCategory}>{tradeCategory}</Text>
                </View>
                <Badge tone={statusTone} label={String(appStatus).toUpperCase()} />
              </View>

              <Text style={styles.welcomeNote}>
                {appStatus === 'approved' || appStatus === 'verified'
                  ? 'Your trade verification is active. Direct service requests in your locality are routed to your desk.'
                  : appStatus === 'rejected'
                  ? 'Your profile verification requires administrator attention. Please tap Support.'
                  : 'Your trade identity is under desk verification. You will be alerted upon approval.'}
              </Text>

              {locNotice ? (
                <View style={styles.locNoticeRow}>
                  <CheckCircle2 size={13} color={COLORS.ok} />
                  <Text style={styles.locNoticeText}>{locNotice}</Text>
                </View>
              ) : null}
            </View>

            {/* 6 Core KPI Cards (2x3 Grid) */}
            <View style={styles.kpiGrid}>
              <TouchableOpacity
                style={[styles.kpiCard, SHADOWS.card]}
                onPress={() => setActiveTab('requests')}
                activeOpacity={0.8}
              >
                <View style={styles.kpiCardHeader}>
                  <Text style={styles.kpiLabel}>New Requests</Text>
                  <Clock size={15} color={requests.length > 0 ? COLORS.bad : COLORS.mute} />
                </View>
                <Text style={[styles.kpiNumber, requests.length > 0 ? { color: COLORS.bad } : null]}>
                  {requests.length}
                </Text>
                <Text style={styles.kpiSub}>Pending approval</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.kpiCard, SHADOWS.card]}
                onPress={() => {
                  setJobsFilter('ongoing');
                  setActiveTab('jobs');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.kpiCardHeader}>
                  <Text style={styles.kpiLabel}>Ongoing Jobs</Text>
                  <Briefcase size={15} color={COLORS.brand} />
                </View>
                <Text style={styles.kpiNumber}>{ongoingJobs.length}</Text>
                <Text style={styles.kpiSub}>Active appointments</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.kpiCard, SHADOWS.card]}
                onPress={() => {
                  setJobsFilter('completed');
                  setActiveTab('jobs');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.kpiCardHeader}>
                  <Text style={styles.kpiLabel}>Completed Jobs</Text>
                  <CheckCircle2 size={15} color={COLORS.ok} />
                </View>
                <Text style={styles.kpiNumber}>{completedJobs.length}</Text>
                <Text style={styles.kpiSub}>Jobs successfully finished</Text>
              </TouchableOpacity>

              <View style={[styles.kpiCard, SHADOWS.card]}>
                <View style={styles.kpiCardHeader}>
                  <Text style={styles.kpiLabel}>Total Earnings</Text>
                  <Banknote size={15} color={COLORS.ok} />
                </View>
                <Text style={styles.kpiNumber}>{formatINR(totalCompletedEarnings)}</Text>
                <Text style={styles.kpiSub}>Direct client payments</Text>
              </View>

              <TouchableOpacity
                style={[styles.kpiCard, SHADOWS.card]}
                onPress={() => setEnquiriesModalOpen(true)}
                activeOpacity={0.8}
              >
                <View style={styles.kpiCardHeader}>
                  <Text style={styles.kpiLabel}>Customer Enquiries</Text>
                  <MessageSquare size={15} color={COLORS.brand} />
                </View>
                <Text style={styles.kpiNumber}>{enquiries.length}</Text>
                <Text style={styles.kpiSub}>Pre-booking queries</Text>
              </TouchableOpacity>

              <View style={[styles.kpiCard, SHADOWS.card]}>
                <View style={styles.kpiCardHeader}>
                  <Text style={styles.kpiLabel}>Quality Rating</Text>
                  <Star size={15} color="#D97706" />
                </View>
                <Text style={styles.kpiNumber}>4.9</Text>
                <Text style={styles.kpiSub}>Local Professional</Text>
              </View>
            </View>

            {/* Quick Action Pills */}
            <View style={styles.quickActionRow}>
              <TouchableOpacity
                style={styles.quickActionPill}
                onPress={() => setServicesModalOpen(true)}
                activeOpacity={0.8}
              >
                <Plus size={14} color={COLORS.brand} />
                <Text style={styles.quickActionText}>Manage Services ({services.length})</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionPill}
                onPress={() => setEnquiriesModalOpen(true)}
                activeOpacity={0.8}
              >
                <MessageSquare size={14} color={COLORS.brand} />
                <Text style={styles.quickActionText}>Queries ({enquiries.length})</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionPill}
                onPress={() => openDocumentPreview('aadhaarDocument', 'Identity Proof (Govt ID)', false)}
                activeOpacity={0.8}
              >
                <FileText size={14} color={COLORS.brand} />
                <Text style={styles.quickActionText}>My Documents</Text>
              </TouchableOpacity>
            </View>

            {/* Recent Incoming Requests Spotlight */}
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Clock size={16} color={COLORS.brand} />
                <Text style={styles.sectionTitle}>Recent Service Requests</Text>
              </View>
              {requests.length > 0 && (
                <TouchableOpacity onPress={() => setActiveTab('requests')}>
                  <Text style={styles.sectionLink}>View All ({requests.length})</Text>
                </TouchableOpacity>
              )}
            </View>

            {requests.length === 0 ? (
              <View style={[styles.emptyBox, SHADOWS.card]}>
                <CheckCircle2 size={32} color={COLORS.ok} />
                <Text style={styles.emptyTitle}>No Pending Requests</Text>
                <Text style={styles.emptyDesc}>
                  Your inbox is clear. Incoming customer requests in Bagalkot will arrive here in real time.
                </Text>
                <Button
                  title="Check Live Status"
                  variant="outline"
                  size="sm"
                  onPress={() => loadData(true)}
                  style={{ marginTop: 10 }}
                />
              </View>
            ) : (
              requests.slice(0, 3).map((req) => (
                <View key={req._id || req.id} style={[styles.requestCard, SHADOWS.card]}>
                  <View style={styles.reqTopRow}>
                    <Badge tone="crimson" label={req.category || tradeCategory} />
                    <Text style={styles.reqTime}>
                      {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>

                  <View style={styles.infoLine}>
                    <UserIcon size={14} color={COLORS.ink} />
                    <Text style={styles.reqCustomerName}>{req.customerId?.name || 'Customer'}</Text>
                  </View>

                  <View style={styles.infoLine}>
                    <MapPin size={14} color={COLORS.brand} />
                    <Text style={styles.reqLocation}>{req.location || 'Bagalkot, Karnataka'}</Text>
                  </View>

                  {req.details || req.message ? (
                    <View style={styles.reqMsgBox}>
                      <Text style={styles.reqMsgText}>"{req.details || req.message}"</Text>
                    </View>
                  ) : null}

                  {req.scheduledDate ? (
                    <View style={styles.infoLine}>
                      <Calendar size={13} color={COLORS.mute} />
                      <Text style={styles.reqDate}>Scheduled: {req.scheduledDate}</Text>
                    </View>
                  ) : null}

                  <View style={styles.reqActionRow}>
                    <Button
                      title="Decline"
                      onPress={() => handleRespond(req._id, 'rejected')}
                      variant="outline"
                      size="sm"
                      disabled={Boolean(actionId)}
                      style={styles.actionBtnDecline}
                    />
                    <Button
                      title={actionId === req._id ? 'Accepting…' : 'Accept Request'}
                      onPress={() => handleRespond(req._id, 'accepted')}
                      variant="primary"
                      size="sm"
                      disabled={Boolean(actionId)}
                      style={styles.actionBtnAccept}
                    />
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 2: ALL NEW REQUESTS */}
        {activeTab === 'requests' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Clock size={16} color={COLORS.brand} />
                <Text style={styles.sectionTitle}>Customer Service Requests</Text>
              </View>
              <TouchableOpacity onPress={() => loadData(true)} style={styles.refreshBtn}>
                <RotateCw size={12} color={COLORS.brand} />
                <Text style={styles.refreshBtnText}>Refresh</Text>
              </TouchableOpacity>
            </View>

            {!isOnline ? (
              <View style={[styles.offlineCard, SHADOWS.card]}>
                <AlertCircle size={36} color={COLORS.mute} />
                <Text style={styles.offlineTitle}>You are currently Offline</Text>
                <Text style={styles.offlineSub}>
                  Switch Online at the top right to receive incoming customer requests.
                </Text>
                <Button
                  title="Switch Online"
                  variant="primary"
                  size="sm"
                  onPress={() => handleToggleOnline(true)}
                  style={{ marginTop: 12 }}
                />
              </View>
            ) : requests.length === 0 ? (
              <EmptyState
                title="No Pending Requests"
                description="When customers book your trade services, requests will appear here with full requirements and location."
                actionLabel="Refresh Requests"
                onAction={() => loadData(true)}
              />
            ) : (
              requests.map((req) => (
                <View key={req._id || req.id} style={[styles.requestCard, SHADOWS.card]}>
                  <View style={styles.reqTopRow}>
                    <Badge tone="crimson" label={req.category || tradeCategory} />
                    <Text style={styles.reqTime}>
                      {new Date(req.createdAt).toLocaleDateString()} ·{' '}
                      {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>

                  <View style={styles.infoLine}>
                    <UserIcon size={14} color={COLORS.ink} />
                    <Text style={styles.reqCustomerName}>{req.customerId?.name || 'Customer'}</Text>
                  </View>

                  {req.customerId?.phone ? (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${req.customerId?.phone}`)}
                      style={styles.phoneLink}
                    >
                      <Phone size={13} color={COLORS.brand} />
                      <Text style={styles.phoneLinkText}>{req.customerId?.phone}</Text>
                    </TouchableOpacity>
                  ) : null}

                  <View style={styles.infoLine}>
                    <MapPin size={14} color={COLORS.brand} />
                    <Text style={styles.reqLocation}>{req.location || 'Bagalkot, Karnataka'}</Text>
                  </View>

                  {req.details || req.message ? (
                    <View style={styles.reqMsgBox}>
                      <Text style={styles.reqMsgTitle}>Requirement Details:</Text>
                      <Text style={styles.reqMsgText}>{req.details || req.message}</Text>
                    </View>
                  ) : null}

                  {req.scheduledDate ? (
                    <View style={styles.infoLine}>
                      <Calendar size={13} color={COLORS.mute} />
                      <Text style={styles.reqDate}>Preferred Schedule: {req.scheduledDate}</Text>
                    </View>
                  ) : null}

                  <View style={styles.reqActionRow}>
                    <Button
                      title="Decline"
                      onPress={() => handleRespond(req._id, 'rejected')}
                      variant="outline"
                      size="sm"
                      disabled={Boolean(actionId)}
                      style={styles.actionBtnDecline}
                    />
                    <Button
                      title={actionId === req._id ? 'Accepting…' : 'Accept Request'}
                      onPress={() => handleRespond(req._id, 'accepted')}
                      variant="primary"
                      size="sm"
                      disabled={Boolean(actionId)}
                      style={styles.actionBtnAccept}
                    />
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 3: JOBS (ONGOING & COMPLETED) */}
        {activeTab === 'jobs' && (
          <View>
            {/* Filter Toggle: Ongoing vs Completed */}
            <View style={styles.jobsSubTabBar}>
              <TouchableOpacity
                style={[styles.jobsSubTab, jobsFilter === 'ongoing' && styles.jobsSubTabActive]}
                onPress={() => setJobsFilter('ongoing')}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.jobsSubTabText, jobsFilter === 'ongoing' && styles.jobsSubTabTextActive]}
                >
                  Ongoing Jobs ({ongoingJobs.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.jobsSubTab, jobsFilter === 'completed' && styles.jobsSubTabActive]}
                onPress={() => setJobsFilter('completed')}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.jobsSubTabText, jobsFilter === 'completed' && styles.jobsSubTabTextActive]}
                >
                  Completed History ({completedJobs.length})
                </Text>
              </TouchableOpacity>
            </View>

            {jobsFilter === 'ongoing' && (
              <View>
                {ongoingJobs.length === 0 ? (
                  <EmptyState
                    title="No Ongoing Jobs"
                    description="When you accept customer requests, they appear here. You can start the job, navigate, chat, or mark it completed."
                  />
                ) : (
                  ongoingJobs.map((b) => (
                    <View key={b._id || b.id} style={[styles.jobCard, SHADOWS.card]}>
                      <View style={styles.jobTopRow}>
                        <Badge
                          tone={b.status === 'accepted' ? 'ok' : 'warn'}
                          label={b.status === 'accepted' ? 'ACCEPTED' : 'IN PROGRESS'}
                        />
                        <Text style={styles.jobDate}>
                          {new Date(b.createdAt).toLocaleDateString()}
                        </Text>
                      </View>

                      <View style={styles.infoLine}>
                        <UserIcon size={14} color={COLORS.ink} />
                        <Text style={styles.jobCustomerName}>{b.customerId?.name || 'Customer'}</Text>
                      </View>

                      {b.customerId?.phone ? (
                        <TouchableOpacity
                          onPress={() => Linking.openURL(`tel:${b.customerId?.phone}`)}
                          style={styles.phoneLink}
                        >
                          <Phone size={13} color={COLORS.brand} />
                          <Text style={styles.phoneLinkText}>{b.customerId?.phone}</Text>
                        </TouchableOpacity>
                      ) : null}

                      <View style={styles.infoLine}>
                        <MapPin size={14} color={COLORS.mute} />
                        <Text style={styles.jobLocation}>{b.location || 'Bagalkot'}</Text>
                      </View>

                      <View style={styles.infoLine}>
                        <Wrench size={14} color={COLORS.mute} />
                        <Text style={styles.jobCategory}>{b.category || tradeCategory}</Text>
                      </View>

                      {b.details || b.message ? (
                        <View style={styles.jobDetailsBox}>
                          <Text style={styles.jobDetailsText}>"{b.details || b.message}"</Text>
                        </View>
                      ) : null}

                      {/* Action Bar */}
                      <View style={styles.jobActionsGrid}>
                        {/* Direct Chat */}
                        <TouchableOpacity
                          style={styles.chatBtn}
                          onPress={() =>
                            onOpenChat({
                              bookingId: b._id,
                              name: b.customerId?.name || 'Customer',
                              role: b.category || 'Service Customer',
                              phone: b.customerId?.phone,
                            })
                          }
                          activeOpacity={0.8}
                        >
                          <MessageSquare size={14} color={COLORS.white} />
                          <Text style={styles.chatBtnText}>Chat</Text>
                        </TouchableOpacity>

                        {/* Status Progression */}
                        {b.status === 'accepted' ? (
                          <Button
                            title="Start Job"
                            onPress={() => handleUpdateJobStatus(b._id, 'in_progress')}
                            variant="primary"
                            size="sm"
                            loading={actionId === b._id}
                            style={{ flex: 1 }}
                          />
                        ) : (
                          <Button
                            title="Mark Completed"
                            onPress={() => handleUpdateJobStatus(b._id, 'completed')}
                            variant="primary"
                            size="sm"
                            loading={actionId === b._id}
                            style={{ flex: 1 }}
                          />
                        )}
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {jobsFilter === 'completed' && (
              <View>
                {completedJobs.length === 0 ? (
                  <EmptyState
                    title="No Completed Jobs Yet"
                    description="Jobs marked as completed will be recorded here with payment earnings history."
                  />
                ) : (
                  completedJobs.map((b) => (
                    <View key={b._id || b.id} style={[styles.completedCard, SHADOWS.card]}>
                      <View style={styles.jobTopRow}>
                        <Badge tone="ok" label="COMPLETED" />
                        <Text style={styles.jobDate}>
                          {new Date(b.createdAt).toLocaleDateString()}
                        </Text>
                      </View>

                      <Text style={styles.completedCustomer}>{b.customerId?.name || 'Customer'}</Text>
                      <Text style={styles.completedCategory}>{b.category || tradeCategory}</Text>
                      <Text style={styles.completedLocation}>{b.location || 'Bagalkot'}</Text>

                      <View style={styles.completedPaymentRow}>
                        <Text style={styles.paymentLabel}>Direct Customer Settlement:</Text>
                        <Text style={styles.paymentValue}>₹350</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        )}

        {/* TAB 4: CUSTOMER COMMUNICATIONS / MESSAGES */}
        {activeTab === 'messages' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MessageSquare size={16} color={COLORS.brand} />
                <Text style={styles.sectionTitle}>Customer Conversations</Text>
              </View>
              <TouchableOpacity onPress={() => loadData(true)} style={styles.refreshBtn}>
                <RotateCw size={12} color={COLORS.brand} />
                <Text style={styles.refreshBtnText}>Refresh</Text>
              </TouchableOpacity>
            </View>

            {/* List Active Chat Threads */}
            {conversations.length > 0 ? (
              conversations.map((thread) => (
                <TouchableOpacity
                  key={thread.id || thread.bookingId}
                  style={[styles.threadCard, SHADOWS.card]}
                  onPress={() =>
                    onOpenChat({
                      bookingId: thread.bookingId,
                      name: thread.name || 'Customer',
                      role: thread.role || 'Service Customer',
                      phone: thread.phone,
                    })
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.threadAvatar}>
                    <UserIcon size={18} color={COLORS.brand} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={styles.threadTop}>
                      <Text style={styles.threadName}>{thread.name || 'Customer'}</Text>
                      <Text style={styles.threadTime}>{thread.time || ''}</Text>
                    </View>
                    <Text style={styles.threadMsg} numberOfLines={1}>
                      {thread.lastMessage || 'Direct service discussion'}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={COLORS.mute} />
                </TouchableOpacity>
              ))
            ) : null}

            {/* Direct Connect from Accepted / Ongoing Jobs */}
            {ongoingJobs.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.subSectionTitle}>Active Job Customers:</Text>
                {ongoingJobs.map((b) => (
                  <TouchableOpacity
                    key={`active-job-${b._id}`}
                    style={[styles.threadCard, SHADOWS.card]}
                    onPress={() =>
                      onOpenChat({
                        bookingId: b._id,
                        name: b.customerId?.name || 'Customer',
                        role: b.category || 'Service Customer',
                        phone: b.customerId?.phone,
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.threadAvatar}>
                      <UserIcon size={18} color={COLORS.brand} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.threadName}>{b.customerId?.name || 'Customer'}</Text>
                      <Text style={styles.threadMsg}>
                        {b.category || tradeCategory} · {b.location || 'Bagalkot'}
                      </Text>
                    </View>
                    <Button
                      title="Chat"
                      variant="primary"
                      size="sm"
                      onPress={() =>
                        onOpenChat({
                          bookingId: b._id,
                          name: b.customerId?.name || 'Customer',
                          role: b.category || 'Service Customer',
                          phone: b.customerId?.phone,
                        })
                      }
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {conversations.length === 0 && ongoingJobs.length === 0 && (
              <EmptyState
                title="No Active Messages"
                description="When customers send inquiries or you accept a service booking, direct conversations will appear here."
              />
            )}
          </View>
        )}

        {/* TAB 5: PROFILE & BUSINESS MANAGEMENT */}
        {activeTab === 'profile' && (
          <View>
            {/* Business Profile Card */}
            <View style={[styles.profileCard, SHADOWS.card]}>
              <View style={styles.profileHeader}>
                <View style={styles.profileAvatarBig}>
                  <Wrench size={26} color={COLORS.brand} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.profileNameBig}>{providerDisplayName}</Text>
                  <Text style={styles.profileCategoryBig}>{tradeCategory}</Text>
                  <Badge tone={statusTone} label={String(appStatus).toUpperCase()} />
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>Experience:</Text>
                <Text style={styles.metaVal}>{profile?.experienceYears || 3} Years</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>Service Area:</Text>
                <Text style={styles.metaVal}>
                  {profile?.serviceArea || profile?.address || 'Bagalkot District'}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>Registered Phone:</Text>
                <Text style={styles.metaVal}>{user?.phone || 'Not specified'}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>Email:</Text>
                <Text style={styles.metaVal}>{user?.email || 'Not specified'}</Text>
              </View>
            </View>

            {/* Business Management Hub */}
            <View style={[styles.menuCard, SHADOWS.card]}>
              <Text style={styles.menuCardTitle}>Business & Operations</Text>

              {/* My Services & Rates */}
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => setServicesModalOpen(true)}
                activeOpacity={0.7}
              >
                <View style={styles.menuRowLeft}>
                  <Wrench size={18} color={COLORS.brand} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.menuRowTitle}>My Services & Rates</Text>
                    <Text style={styles.menuRowSub}>
                      {services.length} active service listings
                    </Text>
                  </View>
                </View>
                <ChevronRight size={16} color={COLORS.mute} />
              </TouchableOpacity>

              {/* Customer Enquiries */}
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => setEnquiriesModalOpen(true)}
                activeOpacity={0.7}
              >
                <View style={styles.menuRowLeft}>
                  <MessageSquare size={18} color="#2563EB" />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.menuRowTitle}>Customer Queries & Enquiries</Text>
                    <Text style={styles.menuRowSub}>
                      {enquiries.length} received inquiries
                    </Text>
                  </View>
                </View>
                <ChevronRight size={16} color={COLORS.mute} />
              </TouchableOpacity>

              {/* Verified Documents */}
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() =>
                  openDocumentPreview('aadhaarDocument', 'Identity Document (Govt ID)', false)
                }
                activeOpacity={0.7}
              >
                <View style={styles.menuRowLeft}>
                  <FileText size={18} color={COLORS.ok} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.menuRowTitle}>Verified ID & Credentials</Text>
                    <Text style={styles.menuRowSub}>Govt ID / Aadhaar and Address Proof</Text>
                  </View>
                </View>
                <ChevronRight size={16} color={COLORS.mute} />
              </TouchableOpacity>

              {/* Support Desk */}
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => {
                  if (onNavigateSupport) onNavigateSupport();
                  else setSupportModalOpen(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.menuRowLeft}>
                  <HelpCircle size={18} color={COLORS.ink} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.menuRowTitle}>Help & Support Desk</Text>
                    <Text style={styles.menuRowSub}>Submit queries or contact NUK Helpline</Text>
                  </View>
                </View>
                <ChevronRight size={16} color={COLORS.mute} />
              </TouchableOpacity>
            </View>

            {/* Sign Out Button */}
            <TouchableOpacity
              style={[styles.signOutBtn, SHADOWS.card]}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <LogOut size={16} color={COLORS.bad} />
              <Text style={styles.signOutBtnText}>Sign Out from Provider Account</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* MODAL: MY SERVICES & RATES */}
      <Modal
        visible={servicesModalOpen}
        onClose={() => setServicesModalOpen(false)}
        title="My Services & Rates"
      >
        <ScrollView style={{ maxHeight: 420 }}>
          <Text style={styles.modalSectionTitle}>Active Services Offered:</Text>
          {services.length === 0 ? (
            <Text style={styles.modalEmptyText}>
              No custom services added yet. The default {tradeCategory} service listing is active.
            </Text>
          ) : (
            services.map((item) => (
              <View key={item._id || item.id} style={styles.serviceItemCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceItemTitle}>{item.title || item.name}</Text>
                  <Text style={styles.serviceItemDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <Text style={styles.serviceItemRate}>
                    Rate: ₹{item.priceRange?.min || 350} – ₹{item.priceRange?.max || 800} / visit
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteService(item._id || item.id)}
                  style={styles.serviceDeleteBtn}
                  accessibilityLabel="Delete Service"
                >
                  <Trash2 size={16} color={COLORS.bad} />
                </TouchableOpacity>
              </View>
            ))
          )}

          <View style={styles.divider} />

          <Text style={styles.modalSectionTitle}>Add New Service Offering:</Text>
          <View style={{ gap: 10, marginTop: 6 }}>
            <Input
              label="Service Name"
              value={newServiceTitle}
              onChangeText={setNewServiceTitle}
              placeholder="e.g. Ceiling Fan Repair & Installation"
            />
            <Input
              label="Description / Scope"
              value={newServiceDesc}
              onChangeText={setNewServiceDesc}
              placeholder="e.g. Motor rewinding, capacitor change, hanging bracket install"
              textarea
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Min Rate (₹)"
                  value={newServiceMinPrice}
                  onChangeText={setNewServiceMinPrice}
                  placeholder="350"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Max Rate (₹)"
                  value={newServiceMaxPrice}
                  onChangeText={setNewServiceMaxPrice}
                  placeholder="800"
                  keyboardType="numeric"
                />
              </View>
            </View>
            <Button
              title={savingService ? 'Adding Service…' : 'Add Service Offering'}
              variant="primary"
              onPress={handleAddService}
              disabled={savingService}
            />
          </View>
        </ScrollView>
      </Modal>

      {/* MODAL: CUSTOMER ENQUIRIES */}
      <Modal
        visible={enquiriesModalOpen}
        onClose={() => {
          setEnquiriesModalOpen(false);
          setSelectedEnquiry(null);
        }}
        title="Customer Enquiries"
      >
        <ScrollView style={{ maxHeight: 420 }}>
          {selectedEnquiry ? (
            <View style={{ gap: 12 }}>
              <Text style={styles.modalSectionTitle}>Reply to Customer Enquiry:</Text>
              <View style={styles.enquiryDetailsBox}>
                <Text style={styles.enquirySenderName}>
                  From: {selectedEnquiry.customerId?.name || 'Customer'}
                </Text>
                <Text style={styles.enquiryMessageText}>"{selectedEnquiry.message}"</Text>
              </View>
              <Input
                label="Your Response"
                value={replyMessage}
                onChangeText={setReplyMessage}
                placeholder="Type your reply to the customer..."
                textarea
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setSelectedEnquiry(null)}
                  style={{ flex: 1 }}
                />
                <Button
                  title={replying ? 'Sending…' : 'Send Reply'}
                  variant="primary"
                  onPress={handleReplyEnquiry}
                  disabled={replying}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ) : enquiries.length === 0 ? (
            <Text style={styles.modalEmptyText}>No customer queries received at this time.</Text>
          ) : (
            enquiries.map((enq) => (
              <View key={enq._id || enq.id} style={styles.enquiryItemCard}>
                <View style={styles.enquiryItemTop}>
                  <Text style={styles.enquiryItemCustomer}>
                    {enq.customerId?.name || 'Interested Customer'}
                  </Text>
                  <Badge
                    tone={enq.status === 'replied' ? 'ok' : 'sun'}
                    label={String(enq.status || 'NEW').toUpperCase()}
                  />
                </View>
                <Text style={styles.enquiryItemMsg}>"{enq.message}"</Text>
                {enq.phone || enq.customerId?.phone ? (
                  <Text style={styles.enquiryItemPhone}>
                    Phone: {enq.phone || enq.customerId?.phone}
                  </Text>
                ) : null}
                <Button
                  title="Reply to Customer"
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    setSelectedEnquiry(enq);
                    setReplyMessage('');
                  }}
                  style={{ marginTop: 8 }}
                />
              </View>
            ))
          )}
        </ScrollView>
      </Modal>

      {/* MODAL: SUPPORT DESK */}
      <Modal
        visible={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
        title="Help & Support Desk"
      >
        <ScrollView style={{ maxHeight: 420 }}>
          <Text style={styles.modalSectionTitle}>Direct NUK Helpline:</Text>
          <TouchableOpacity
            style={styles.helplineCallBox}
            onPress={() => Linking.openURL('tel:9876543210')}
            activeOpacity={0.8}
          >
            <Phone size={18} color={COLORS.brand} />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.helplineTitle}>Call NUK Partner Support</Text>
              <Text style={styles.helplinePhone}>+91 98765 43210 (Bagalkot Desk)</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.modalSectionTitle}>Raise a Support Query:</Text>
          <View style={{ gap: 10, marginTop: 6 }}>
            <Input
              label="Subject"
              value={supportSubject}
              onChangeText={setSupportSubject}
              placeholder="e.g. Bank settlement / Document update"
            />
            <Input
              label="Description"
              value={supportMessage}
              onChangeText={setSupportMessage}
              placeholder="Describe your query in detail..."
              textarea
            />
            <Button
              title={submittingSupport ? 'Submitting…' : 'Submit Support Request'}
              variant="primary"
              onPress={handleCreateSupportTicket}
              disabled={submittingSupport}
            />
          </View>
        </ScrollView>
      </Modal>

      {/* DOCUMENT VIEWER MODAL */}
      <DocumentViewerModal
        visible={docModalOpen}
        documents={previewDocs}
        currentIndex={previewIndex}
        onSelectIndex={setPreviewIndex}
        onClose={() => setDocModalOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paper },
  scroll: { padding: 16, paddingBottom: 60 },

  // Header Right Actions
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  onlineLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginRight: 4,
  },
  textOk: { color: COLORS.ok },
  textMute: { color: COLORS.mute },
  locIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  supportIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  logoutIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },

  // Top Segmented Bar
  topTabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    paddingHorizontal: 8,
  },
  topTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  topTabItemActive: {
    borderBottomColor: COLORS.brand,
  },
  topTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.mute,
  },
  topTabTextActive: {
    color: COLORS.brand,
    fontWeight: '800',
  },

  // Welcome Banner
  welcomeBanner: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 14,
  },
  welcomeBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.brandTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeGreeting: {
    fontSize: 11,
    color: COLORS.mute,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  welcomeName: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.ink,
    marginTop: 1,
  },
  welcomeCategory: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brand,
    marginTop: 1,
  },
  welcomeNote: {
    fontSize: 13,
    color: COLORS.ink,
    lineHeight: 18,
    marginTop: 10,
  },
  locNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: COLORS.okTint,
    padding: 6,
    borderRadius: RADIUS.sm,
  },
  locNoticeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ok,
  },

  // KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  kpiCard: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  kpiCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.mute,
    textTransform: 'uppercase',
  },
  kpiNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.ink,
    marginTop: 6,
  },
  kpiSub: {
    fontSize: 11,
    color: COLORS.mute,
    marginTop: 2,
  },

  // Quick Action Row
  quickActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  quickActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.brandTint,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.brand,
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.brand,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 8,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.brand,
  },

  // Empty Box
  emptyBox: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 12,
    color: COLORS.mute,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },

  // Request Card
  requestCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  reqTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reqTime: {
    fontSize: 11,
    color: COLORS.mute,
    fontWeight: '600',
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 4,
  },
  reqCustomerName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
  reqLocation: {
    fontSize: 13,
    color: COLORS.ink,
    flex: 1,
  },
  reqDate: {
    fontSize: 12,
    color: COLORS.mute,
  },
  phoneLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  phoneLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brand,
  },
  reqMsgBox: {
    backgroundColor: COLORS.paper,
    padding: 10,
    borderRadius: RADIUS.md,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  reqMsgTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.mute,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  reqMsgText: {
    fontSize: 13,
    color: COLORS.ink,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  reqActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionBtnDecline: {
    flex: 1,
  },
  actionBtnAccept: {
    flex: 2,
  },

  // Offline Card
  offlineCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
  },
  offlineTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
    marginTop: 10,
  },
  offlineSub: {
    fontSize: 13,
    color: COLORS.mute,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },

  // Jobs Sub Tab Bar
  jobsSubTabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  jobsSubTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  jobsSubTabActive: {
    backgroundColor: COLORS.brand,
  },
  jobsSubTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.mute,
  },
  jobsSubTabTextActive: {
    color: COLORS.white,
    fontWeight: '800',
  },

  // Job Card (Ongoing)
  jobCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  jobTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobDate: {
    fontSize: 11,
    color: COLORS.mute,
    fontWeight: '600',
  },
  jobCustomerName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
  jobLocation: {
    fontSize: 13,
    color: COLORS.ink,
  },
  jobCategory: {
    fontSize: 13,
    color: COLORS.brand,
    fontWeight: '600',
  },
  jobDetailsBox: {
    backgroundColor: COLORS.paper,
    padding: 8,
    borderRadius: RADIUS.sm,
    marginVertical: 8,
  },
  jobDetailsText: {
    fontSize: 12,
    color: COLORS.ink,
    fontStyle: 'italic',
  },
  jobActionsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
  },
  chatBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },

  // Completed Card
  completedCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  completedCustomer: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
    marginTop: 4,
  },
  completedCategory: {
    fontSize: 12,
    color: COLORS.mute,
    marginTop: 1,
  },
  completedLocation: {
    fontSize: 12,
    color: COLORS.mute,
    marginTop: 1,
  },
  completedPaymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  paymentLabel: {
    fontSize: 12,
    color: COLORS.mute,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.ok,
  },

  // Communications / Messages
  threadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  threadAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.brandTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  threadTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  threadName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ink,
  },
  threadTime: {
    fontSize: 11,
    color: COLORS.mute,
  },
  threadMsg: {
    fontSize: 12,
    color: COLORS.mute,
    marginTop: 2,
  },

  // Profile Card
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 14,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatarBig: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.brandTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileNameBig: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.ink,
  },
  profileCategoryBig: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brand,
    marginVertical: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  metaKey: {
    fontSize: 13,
    color: COLORS.mute,
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },

  // Business Menu Hub
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 14,
  },
  menuCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuRowTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
  menuRowSub: {
    fontSize: 12,
    color: COLORS.mute,
    marginTop: 1,
  },

  signOutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  signOutBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.bad,
  },

  // Modals Styling
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ink,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  modalEmptyText: {
    fontSize: 13,
    color: COLORS.mute,
    fontStyle: 'italic',
    marginVertical: 8,
  },
  serviceItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.paper,
    padding: 10,
    borderRadius: RADIUS.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  serviceItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
  serviceItemDesc: {
    fontSize: 12,
    color: COLORS.mute,
    marginTop: 2,
  },
  serviceItemRate: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brand,
    marginTop: 3,
  },
  serviceDeleteBtn: {
    padding: 8,
  },

  enquiryItemCard: {
    backgroundColor: COLORS.paper,
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  enquiryItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  enquiryItemCustomer: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ink,
  },
  enquiryItemMsg: {
    fontSize: 13,
    color: COLORS.ink,
    fontStyle: 'italic',
    marginTop: 6,
    lineHeight: 18,
  },
  enquiryItemPhone: {
    fontSize: 12,
    color: COLORS.mute,
    marginTop: 4,
  },
  enquiryDetailsBox: {
    backgroundColor: COLORS.paper,
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  enquirySenderName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ink,
  },
  enquiryMessageText: {
    fontSize: 13,
    color: COLORS.ink,
    fontStyle: 'italic',
    marginTop: 4,
  },

  helplineCallBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.brandTint,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#FED7AA',
    marginVertical: 6,
  },
  helplineTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.brand,
  },
  helplinePhone: {
    fontSize: 12,
    color: COLORS.ink,
    marginTop: 2,
  },
});
