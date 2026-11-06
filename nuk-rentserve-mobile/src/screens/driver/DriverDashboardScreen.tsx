// Driver Workspace & Live Real-Time Dispatch Radar Dashboard (/driver/dashboard)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Linking,
  Platform,
} from 'react-native';
import {
  Car,
  MapPin,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  Eye,
  Radio,
  RadioTower,
  Banknote,
  AlertTriangle,
  ArrowRight,
  Phone,
  MessageSquare,
  Navigation,
  RotateCw,
  User as UserIcon,
  Check,
  X,
  History,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { formatINR } from '../../utils/formatters';
import { useLocalization } from '../../context/LocalizationContext';
import { useAuth } from '../../context/AuthContext';
import { transportApi, TransportBooking } from '../../api/transportApi';
import { authApi } from '../../api/authApi';
import { DocumentViewerModal, DocumentItem } from '../../components/common/DocumentViewerModal';
import { CONFIG } from '../../constants/config';

interface DriverDashboardScreenProps {
  onBack?: () => void;
  onNavigateOnboarding?: () => void;
  onOpenChat?: (params: { bookingId: string; name: string; role: string; phone?: string }) => void;
}

export const DriverDashboardScreen: React.FC<DriverDashboardScreenProps> = ({
  onBack,
  onNavigateOnboarding,
  onOpenChat,
}) => {
  const { t } = useLocalization();
  const { user } = useAuth();

  const [isOnline, setIsOnline] = useState<boolean>(user?.isOnline !== false);
  const [onlineUpdating, setOnlineUpdating] = useState<boolean>(false);
  const [approvalStatus, setApprovalStatus] = useState<'Approved' | 'Pending verification' | 'Rejected'>('Approved');

  // Live Orders & Trips State
  const [incomingRequests, setIncomingRequests] = useState<TransportBooking[]>([]);
  const [activeTrip, setActiveTrip] = useState<TransportBooking | null>(null);
  const [completedHistory, setCompletedHistory] = useState<TransportBooking[]>([]);

  // Loading & Feedback
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [actionId, setActionId] = useState<string>('');
  const [tripStatusUpdating, setTripStatusUpdating] = useState<boolean>(false);

  // Active sub-tab: 'live' | 'active' | 'history'
  const [subTab, setSubTab] = useState<'live' | 'active' | 'history'>('live');

  // In-Screen Document Previewer
  const [docViewerOpen, setDocViewerOpen] = useState(false);
  const [previewDocs, setPreviewDocs] = useState<DocumentItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  const pollingRef = useRef<any>(null);

  // Sync Data from Backend
  const syncDriverData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsPolling(true);

    try {
      const [availRes, assignedRes, historyRes, meRes] = await Promise.allSettled([
        transportApi.getAvailableRequests(),
        transportApi.getAssignedTrip(),
        transportApi.getDriverHistory(),
        authApi.getMe(),
      ]);

      if (availRes.status === 'fulfilled') {
        const items = Array.isArray(availRes.value) ? availRes.value : [];
        setIncomingRequests(items);
      }

      if (assignedRes.status === 'fulfilled') {
        setActiveTrip(assignedRes.value);
        if (assignedRes.value && subTab === 'live') {
          // Auto-switch to active trip view when a trip is in progress
          setSubTab('active');
        }
      }

      if (historyRes.status === 'fulfilled') {
        const allHistory = Array.isArray(historyRes.value) ? historyRes.value : [];
        const completed = allHistory.filter((x: any) => x.status === 'completed');
        setCompletedHistory(completed);
      }

      if (meRes.status === 'fulfilled' && meRes.value) {
        const u = meRes.value;
        if (u.approvalStatus === 'approved') setApprovalStatus('Approved');
        else if (u.approvalStatus === 'rejected') setApprovalStatus('Rejected');
        else setApprovalStatus('Pending verification');

        if (typeof u.isOnline === 'boolean') {
          setIsOnline(u.isOnline);
        }
      }
    } catch {
      // Error handled silently on background poll
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsPolling(false);
    }
  }, [subTab]);

  // Initial Load & 5-Second Real-Time Polling Loop (Socket.IO fallback)
  useEffect(() => {
    syncDriverData();

    if (isOnline) {
      pollingRef.current = setInterval(() => {
        syncDriverData(true);
      }, 5000);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOnline, syncDriverData]);

  // Handle Online / Offline Switch
  const handleToggleOnline = async (val: boolean) => {
    setOnlineUpdating(true);
    setIsOnline(val);
    try {
      await authApi.updateMe({ isOnline: val });
      if (!val) {
        setIncomingRequests([]);
      } else {
        syncDriverData();
      }
    } catch (e: any) {
      Alert.alert('Status Error', e.message || 'Could not update online status.');
      setIsOnline(!val);
    } finally {
      setOnlineUpdating(false);
    }
  };

  // Accept Order (Strict Atomic Guard against race conditions)
  const handleAcceptOrder = async (booking: TransportBooking) => {
    setActionId(booking._id);
    try {
      await transportApi.updateStatus(booking._id, 'accepted');
      Alert.alert(
        t('Order Accepted!', 'ಆರ್ಡರ್ ಸ್ವೀಕರಿಸಲಾಗಿದೆ!'),
        t('Proceed to pickup location. You can now chat or call the customer directly.', 'ಪಿಕ್‌ಅಪ್ ಸ್ಥಳಕ್ಕೆ ತೆರಳಿ.')
      );
      setIncomingRequests((prev) => prev.filter((x) => x._id !== booking._id));
      setActiveTrip({ ...booking, status: 'accepted' });
      setSubTab('active');
      syncDriverData(true);
    } catch (e: any) {
      // If another driver already claimed it, backend returns 409
      Alert.alert(
        t('Order Unavailable', 'ಆರ್ಡರ್ ಲಭ್ಯವಿಲ್ಲ'),
        e.message || 'This ride was already accepted by another driver or has expired.'
      );
      setIncomingRequests((prev) => prev.filter((x) => x._id !== booking._id));
    } finally {
      setActionId('');
    }
  };

  // Reject / Decline Order (Advances sequential queue)
  const handleRejectOrder = async (bookingId: string) => {
    setActionId(bookingId);
    try {
      await transportApi.updateStatus(bookingId, 'rejected');
      setIncomingRequests((prev) => prev.filter((x) => x._id !== bookingId));
    } catch (e: any) {
      Alert.alert('Action Notice', e.message || 'Request removed from your queue.');
      setIncomingRequests((prev) => prev.filter((x) => x._id !== bookingId));
    } finally {
      setActionId('');
    }
  };

  // Start Ride (Move status to 'in_progress')
  const handleStartRide = async (bookingId: string) => {
    setTripStatusUpdating(true);
    try {
      await transportApi.updateStatus(bookingId, 'in_progress');
      if (activeTrip) {
        setActiveTrip({ ...activeTrip, status: 'in_progress' });
      }
      Alert.alert(
        t('Trip Started', 'ಟ್ರಿಪ್ ಆರಂಭವಾಗಿದೆ'),
        t('Drive safely to the destination. Collect fare at dropoff.', 'ಗಮ್ಯಸ್ಥಾನಕ್ಕೆ ತಲುಪಿ.')
      );
      syncDriverData(true);
    } catch (e: any) {
      Alert.alert('Update Failed', e.message || 'Could not start trip.');
    } finally {
      setTripStatusUpdating(false);
    }
  };

  // Complete Ride (Move status to 'completed' & record genuine earnings)
  const handleCompleteRide = async (bookingId: string) => {
    setTripStatusUpdating(true);
    try {
      await transportApi.updateStatus(bookingId, 'completed');
      Alert.alert(
        t('Trip Completed!', 'ಟ್ರಿಪ್ ಪೂರ್ಣಗೊಂಡಿದೆ!'),
        t('Cash collection confirmed. This trip has been added to your earnings history.', 'ಗಳಿಕೆ ನವೀಕರಿಸಲಾಗಿದೆ.')
      );
      setActiveTrip(null);
      setSubTab('history');
      syncDriverData();
    } catch (e: any) {
      Alert.alert('Update Failed', e.message || 'Could not complete trip.');
    } finally {
      setTripStatusUpdating(false);
    }
  };

  // Open External Navigation (Google Maps)
  const openNavigation = (address: string) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(address)}`,
      android: `google.navigation:q=${encodeURIComponent(address)}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,
    });
    Linking.openURL(url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`).catch(() => {
      Alert.alert('Maps Error', 'Could not open map navigation.');
    });
  };

  // Open Document Preview Modal
  const openDriverDocument = (docType: string, title: string, isPdf = false) => {
    const list: DocumentItem[] = [
      {
        id: `driver-${docType}`,
        docType,
        title,
        url: `${CONFIG.API_BASE_URL}/documents/mine/${docType}`,
        isPdf,
        format: isPdf ? 'pdf' : 'jpg',
      },
    ];
    setPreviewDocs(list);
    setPreviewIndex(0);
    setDocViewerOpen(true);
  };

  // Calculate genuine earnings summary from real completed trips
  const totalEarnings = completedHistory.reduce((sum, item) => sum + (Number(item.fare) || 0), 0);
  const totalRides = completedHistory.length;

  const vehicleSubtitle = user?.vehicleNumber
    ? `${user.vehicleNumber} · ${user.vehicleModel || 'Driver'}`
    : 'NUK Verified Driver';

  return (
    <View style={styles.container}>
      <Header
        title={t('driverDashboard', 'ಚಾಲಕರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್')}
        subtitle={vehicleSubtitle}
        onBack={onBack}
        rightAction={
          <View style={styles.onlineToggleRow}>
            {onlineUpdating ? (
              <ActivityIndicator size="small" color={COLORS.brand} style={{ marginRight: 6 }} />
            ) : (
              <Text style={[styles.onlineLabel, isOnline ? styles.textOk : styles.textMute]}>
                {isOnline ? t('goOnline', 'ಆನ್‌ಲೈನ್') : t('goOffline', 'ಆಫ್‌ಲೈನ್')}
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
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              syncDriverData();
            }}
            tintColor={COLORS.brand}
          />
        }
      >
        {/* Verification Alert Banner */}
        {approvalStatus === 'Approved' ? (
          <View style={[styles.alertBanner, styles.alertApproved]}>
            <CheckCircle2 size={16} color={COLORS.ok} />
            <Text style={styles.alertText}>
              All documents approved. Live 5 km GPS dispatch active.
            </Text>
            {isPolling && <ActivityIndicator size="small" color={COLORS.ok} style={{ marginLeft: 6 }} />}
          </View>
        ) : (
          <View style={[styles.alertBanner, styles.alertPending]}>
            <Clock size={16} color="#D97706" />
            <Text style={styles.alertText}>
              Verification in progress. Tap to review credentials.
            </Text>
            {onNavigateOnboarding && (
              <TouchableOpacity onPress={onNavigateOnboarding} style={styles.alertLinkRow}>
                <Text style={styles.alertLink}>Review</Text>
                <ArrowRight size={12} color="#D97706" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Genuine Earnings & Rides Summary Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, SHADOWS.card]}>
            <Text style={styles.statLabel}>{t('todayEarnings', 'ಗಳಿಕೆ ಮೊತ್ತ')}</Text>
            <Text style={styles.statNumber}>{formatINR(totalEarnings)}</Text>
            <Text style={styles.statNote}>Direct cash & UPI collected</Text>
          </View>
          <View style={[styles.statCard, SHADOWS.card]}>
            <Text style={styles.statLabel}>{t('todayRides', 'ಪೂರ್ಣಗೊಂಡ ಸವಾರಿ')}</Text>
            <Text style={styles.statNumber}>{totalRides}</Text>
            <Text style={styles.statNote}>100% Commission-free</Text>
          </View>
        </View>

        {/* Tab Selection Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, subTab === 'live' && styles.tabBtnActive]}
            onPress={() => setSubTab('live')}
            activeOpacity={0.8}
          >
            <RadioTower size={14} color={subTab === 'live' ? COLORS.brand : COLORS.mute} style={{ marginRight: 6 }} />
            <Text style={[styles.tabText, subTab === 'live' && styles.tabTextActive]}>
              Live Orders ({incomingRequests.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, subTab === 'active' && styles.tabBtnActive]}
            onPress={() => setSubTab('active')}
            activeOpacity={0.8}
          >
            <Car size={14} color={subTab === 'active' ? COLORS.brand : COLORS.mute} style={{ marginRight: 6 }} />
            <Text style={[styles.tabText, subTab === 'active' && styles.tabTextActive]}>
              Active Trip {activeTrip ? '•' : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, subTab === 'history' && styles.tabBtnActive]}
            onPress={() => setSubTab('history')}
            activeOpacity={0.8}
          >
            <History size={14} color={subTab === 'history' ? COLORS.brand : COLORS.mute} style={{ marginRight: 6 }} />
            <Text style={[styles.tabText, subTab === 'history' && styles.tabTextActive]}>
              History ({completedHistory.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: LIVE ORDERS */}
        {subTab === 'live' && (
          <View>
            <View style={styles.sectionHeader}>
              <View style={styles.radarStatusRow}>
                <Radio size={14} color={isOnline ? COLORS.ok : COLORS.mute} />
                <Text style={styles.sectionTitle}>
                  {isOnline ? 'Real-Time Incoming Orders' : 'Radar Offline'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => syncDriverData(true)}
                style={styles.refreshRow}
                disabled={!isOnline}
                activeOpacity={0.7}
              >
                <RotateCw size={12} color={isOnline ? COLORS.brand : COLORS.mute} />
                <Text style={[styles.refreshText, !isOnline && { color: COLORS.mute }]}>Refresh</Text>
              </TouchableOpacity>
            </View>

            {!isOnline ? (
              <View style={[styles.card, styles.centerCard, SHADOWS.card]}>
                <RadioTower size={40} color={COLORS.mute} />
                <Text style={styles.offlineTitle}>You are currently Offline</Text>
                <Text style={styles.offlineSub}>
                  Switch Online at the top right to receive live ride orders in Bagalkot.
                </Text>
                <Button
                  title="Switch Online Now"
                  onPress={() => handleToggleOnline(true)}
                  variant="primary"
                  size="sm"
                  style={{ marginTop: 14 }}
                />
              </View>
            ) : incomingRequests.length === 0 ? (
              <EmptyState
                title="No Incoming Ride Orders Right Now"
                description="Live 5 km radar is scanning. When a customer nearby books an auto or taxi, the ride request will appear here instantly."
                actionLabel="Scan Again"
                onAction={() => syncDriverData()}
              />
            ) : (
              incomingRequests.map((req) => {
                const customer = typeof req.customerId === 'object' ? req.customerId : null;
                const custName = customer?.name || 'Customer';
                const custPhone = customer?.phone;
                const reqFare = req.fare ? Number(req.fare) : 60;

                return (
                  <View key={req._id || req.id} style={[styles.requestCard, SHADOWS.card]}>
                    <View style={styles.reqTop}>
                      <Badge tone="crimson" label={(req.vehicleType || 'Auto').toUpperCase()} />
                      <Text style={styles.etaText}>
                        {new Date(req.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>

                    {/* Customer Info */}
                    <View style={styles.custRow}>
                      <UserIcon size={14} color={COLORS.ink} />
                      <Text style={styles.custName}>{custName}</Text>
                      {custPhone ? (
                        <TouchableOpacity
                          onPress={() => Linking.openURL(`tel:${custPhone}`)}
                          style={styles.phonePill}
                          activeOpacity={0.7}
                        >
                          <Phone size={12} color={COLORS.brand} />
                          <Text style={styles.phonePillText}>Call</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    {/* Pickup & Dropoff Route */}
                    <View style={styles.addressRow}>
                      <MapPin size={15} color={COLORS.ok} />
                      <Text style={styles.fromText}>
                        Pickup: <Text style={styles.bold}>{req.pickup}</Text>
                      </Text>
                    </View>
                    <View style={styles.addressRow}>
                      <MapPin size={15} color={COLORS.brand} />
                      <Text style={styles.toText}>
                        Dropoff: <Text style={styles.bold}>{req.destination}</Text>
                      </Text>
                    </View>

                    {req.details ? (
                      <View style={styles.noteBox}>
                        <Text style={styles.noteText}>"{req.details}"</Text>
                      </View>
                    ) : null}

                    {/* Fare & Accept/Reject Controls */}
                    <View style={styles.reqFooter}>
                      <View>
                        <Text style={styles.fareLabel}>Cash to Collect</Text>
                        <Text style={styles.fareText}>{formatINR(reqFare)}</Text>
                      </View>

                      <View style={styles.actionButtons}>
                        <Button
                          title="Decline"
                          onPress={() => handleRejectOrder(req._id)}
                          variant="outline"
                          size="sm"
                          disabled={actionId === req._id}
                          style={styles.actionBtnDecline}
                        />
                        <Button
                          title={actionId === req._id ? 'Accepting…' : 'Accept Ride'}
                          onPress={() => handleAcceptOrder(req)}
                          variant="primary"
                          size="sm"
                          disabled={Boolean(actionId)}
                          style={styles.actionBtnAccept}
                        />
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* TAB 2: ACTIVE RIDE / TRIP WORKFLOW */}
        {subTab === 'active' && (
          <View>
            {!activeTrip ? (
              <EmptyState
                title="No Active Trip in Progress"
                description="Accept a ride order from the 'Live Orders' tab to start navigation and pickup."
                actionLabel="View Live Orders"
                onAction={() => setSubTab('live')}
              />
            ) : (
              <View style={[styles.activeTripCard, SHADOWS.card]}>
                {/* Active Trip Header */}
                <View style={styles.activeTop}>
                  <Badge
                    tone={activeTrip.status === 'in_progress' ? 'warn' : 'ok'}
                    dot
                    label={activeTrip.status === 'in_progress' ? 'Trip In Progress' : 'Accepted • Heading to Pickup'}
                  />
                  <Text style={styles.fareHighlight}>
                    {formatINR(Number(activeTrip.fare) || 70)}
                  </Text>
                </View>

                {/* Customer Details & Actions */}
                {(() => {
                  const cust = typeof activeTrip.customerId === 'object' ? activeTrip.customerId : null;
                  const cName = cust?.name || 'Customer';
                  const cPhone = cust?.phone;
                  return (
                    <View style={styles.activeCustBox}>
                      <View style={styles.activeCustLeft}>
                        <UserIcon size={16} color={COLORS.brand} />
                        <View>
                          <Text style={styles.activeCustName}>{cName}</Text>
                          <Text style={styles.activeCustSub}>Passenger Contact</Text>
                        </View>
                      </View>

                      <View style={styles.activeCustActions}>
                        {cPhone ? (
                          <TouchableOpacity
                            style={styles.callIconBtn}
                            onPress={() => Linking.openURL(`tel:${cPhone}`)}
                            activeOpacity={0.8}
                          >
                            <Phone size={16} color={COLORS.white} />
                          </TouchableOpacity>
                        ) : null}

                        {onOpenChat && (
                          <TouchableOpacity
                            style={styles.chatIconBtn}
                            onPress={() =>
                              onOpenChat({
                                bookingId: activeTrip._id,
                                name: cName,
                                role: 'Customer',
                                phone: cPhone,
                              })
                            }
                            activeOpacity={0.8}
                          >
                            <MessageSquare size={16} color={COLORS.white} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })()}

                {/* Pickup Section with Navigation */}
                <View style={styles.routeItemBox}>
                  <View style={styles.routeHeaderRow}>
                    <MapPin size={16} color={COLORS.ok} />
                    <Text style={styles.routeRoleTitle}>Pickup Location</Text>
                  </View>
                  <Text style={styles.routeAddressText}>{activeTrip.pickup}</Text>
                  <TouchableOpacity
                    style={styles.navBtn}
                    onPress={() => openNavigation(activeTrip.pickup)}
                    activeOpacity={0.8}
                  >
                    <Navigation size={14} color={COLORS.brand} />
                    <Text style={styles.navBtnText}>Navigate to Pickup (Google Maps)</Text>
                  </TouchableOpacity>
                </View>

                {/* Destination Section with Navigation */}
                <View style={styles.routeItemBox}>
                  <View style={styles.routeHeaderRow}>
                    <MapPin size={16} color={COLORS.brand} />
                    <Text style={styles.routeRoleTitle}>Dropoff Destination</Text>
                  </View>
                  <Text style={styles.routeAddressText}>{activeTrip.destination}</Text>
                  <TouchableOpacity
                    style={styles.navBtn}
                    onPress={() => openNavigation(activeTrip.destination)}
                    activeOpacity={0.8}
                  >
                    <Navigation size={14} color={COLORS.brand} />
                    <Text style={styles.navBtnText}>Navigate to Dropoff (Google Maps)</Text>
                  </TouchableOpacity>
                </View>

                {/* Cash Notice */}
                <View style={styles.cashNoticeRow}>
                  <Banknote size={16} color={COLORS.ok} />
                  <Text style={styles.cashNotice}>
                    Collect {formatINR(Number(activeTrip.fare) || 70)} directly in cash or UPI
                  </Text>
                </View>

                {/* Status Progress Button */}
                {activeTrip.status === 'accepted' ? (
                  <Button
                    title="✓ Passenger Picked Up (Start Trip)"
                    onPress={() => handleStartRide(activeTrip._id)}
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={tripStatusUpdating}
                    style={styles.tripActionButton}
                  />
                ) : (
                  <Button
                    title="✓ Complete Ride & Confirm Cash"
                    onPress={() => handleCompleteRide(activeTrip._id)}
                    variant="yellow"
                    size="lg"
                    fullWidth
                    loading={tripStatusUpdating}
                    style={styles.tripActionButton}
                  />
                )}
              </View>
            )}
          </View>
        )}

        {/* TAB 3: COMPLETED TRIP HISTORY */}
        {subTab === 'history' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Completed Ride History</Text>
              <Text style={styles.historyCountText}>{completedHistory.length} completed</Text>
            </View>

            {completedHistory.length === 0 ? (
              <EmptyState
                title="No Completed Rides Yet"
                description="When you complete rides, your trip log and collected cash amounts will be securely tracked here."
              />
            ) : (
              completedHistory.map((trip) => {
                const customer = typeof trip.customerId === 'object' ? trip.customerId : null;
                const cName = customer?.name || 'Customer';
                return (
                  <View key={trip._id || trip.id} style={[styles.historyCard, SHADOWS.card]}>
                    <View style={styles.historyTopRow}>
                      <Badge tone="ok" label="COMPLETED" />
                      <Text style={styles.historyDate}>
                        {new Date(trip.createdAt).toLocaleDateString()}
                      </Text>
                    </View>

                    <Text style={styles.historyCustomer}>{cName}</Text>
                    <Text style={styles.historyRoute}>
                      {trip.pickup} → <Text style={styles.bold}>{trip.destination}</Text>
                    </Text>

                    <View style={styles.historyBottomRow}>
                      <Text style={styles.historyFareLabel}>Collected:</Text>
                      <Text style={styles.historyFare}>{formatINR(Number(trip.fare) || 0)}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Driver Verification Documents Card */}
        <View style={[styles.docSectionCard, SHADOWS.card]}>
          <View style={styles.docSectionHeader}>
            <ShieldCheck size={18} color={COLORS.brand} />
            <Text style={styles.docSectionHeading}>
              {t('Driver Documents & Credentials', 'ಚಾಲಕರ ಪರವಾನಗಿ ಮತ್ತು ದಾಖಲೆಗಳು')}
            </Text>
          </View>
          <Text style={styles.docSectionSub}>
            Private authenticated documents verified by NUK desk. Tap to view:
          </Text>

          <View style={styles.docGrid}>
            <TouchableOpacity
              style={[styles.docCard, styles.docCardPdf]}
              onPress={() =>
                openDriverDocument(
                  'drivingLicenceDocument',
                  'Driving Licence (DL) - Verified Document',
                  false
                )
              }
              activeOpacity={0.7}
            >
              <FileText size={20} color={COLORS.brand} />
              <View style={styles.docCardInfo}>
                <Text style={styles.docCardTitle}>Driving Licence (DL)</Text>
                <Text style={styles.docCardSub}>Commercial transport licence copy</Text>
              </View>
              <View style={styles.docPreviewPill}>
                <Eye size={12} color={COLORS.brand} />
                <Text style={styles.docPreviewText}>Preview</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.docCard}
              onPress={() =>
                openDriverDocument(
                  'vehicleRcDocument',
                  'Vehicle Registration Certificate (RC)',
                  false
                )
              }
              activeOpacity={0.7}
            >
              <ImageIcon size={20} color="#2563EB" />
              <View style={styles.docCardInfo}>
                <Text style={styles.docCardTitle}>Vehicle RC Document</Text>
                <Text style={styles.docCardSub}>Vehicle registration paper</Text>
              </View>
              <View style={styles.docPreviewPill}>
                <Eye size={12} color={COLORS.brand} />
                <Text style={styles.docPreviewText}>Preview</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        visible={docViewerOpen}
        documents={previewDocs}
        currentIndex={previewIndex}
        onSelectIndex={setPreviewIndex}
        onClose={() => setDocViewerOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  onlineToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  onlineLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginRight: 6,
  },
  textOk: {
    color: COLORS.ok,
  },
  textMute: {
    color: COLORS.mute,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.lg,
    marginBottom: 14,
  },
  alertApproved: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  alertPending: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  alertText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
    marginLeft: 8,
    flex: 1,
  },
  alertLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  alertLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.mute,
    fontWeight: '600',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.ink,
    marginTop: 4,
  },
  statNote: {
    fontSize: 10,
    color: COLORS.mute,
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  tabBtnActive: {
    backgroundColor: COLORS.brandTint,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.mute,
  },
  tabTextActive: {
    color: COLORS.brand,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  radarStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
  },
  refreshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brand,
  },
  historyCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.mute,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 14,
  },
  centerCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
    marginTop: 10,
  },
  offlineSub: {
    fontSize: 12,
    color: COLORS.mute,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
  requestCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    marginBottom: 12,
  },
  reqTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  etaText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brand,
  },
  custRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  custName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
    flex: 1,
  },
  phonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.brandTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  phonePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.brand,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  fromText: {
    fontSize: 13,
    color: COLORS.ink,
    flex: 1,
  },
  toText: {
    fontSize: 13,
    color: COLORS.ink,
    flex: 1,
  },
  bold: {
    fontWeight: '800',
  },
  noteBox: {
    backgroundColor: COLORS.paper,
    padding: 8,
    borderRadius: RADIUS.md,
    marginTop: 6,
    marginBottom: 6,
  },
  noteText: {
    fontSize: 12,
    color: COLORS.mute,
    fontStyle: 'italic',
  },
  reqFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  fareLabel: {
    fontSize: 11,
    color: COLORS.mute,
  },
  fareText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.ink,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnDecline: {
    minWidth: 74,
  },
  actionBtnAccept: {
    minWidth: 104,
  },
  activeTripCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.brand,
    marginBottom: 16,
  },
  activeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fareHighlight: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.ok,
  },
  activeCustBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.paper,
    padding: 10,
    borderRadius: RADIUS.lg,
    marginBottom: 14,
  },
  activeCustLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activeCustName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
  activeCustSub: {
    fontSize: 11,
    color: COLORS.mute,
  },
  activeCustActions: {
    flexDirection: 'row',
    gap: 8,
  },
  callIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.ok,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeItemBox: {
    backgroundColor: COLORS.paper,
    padding: 12,
    borderRadius: RADIUS.lg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  routeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  routeRoleTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.ink,
  },
  routeAddressText: {
    fontSize: 13,
    color: COLORS.ink,
    fontWeight: '600',
    marginBottom: 8,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.brand,
  },
  navBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.brand,
  },
  cashNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: RADIUS.md,
    marginTop: 4,
    marginBottom: 14,
  },
  cashNotice: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.ok,
  },
  tripActionButton: {
    marginTop: 4,
  },
  historyCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 10,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyDate: {
    fontSize: 11,
    color: COLORS.mute,
  },
  historyCustomer: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 4,
  },
  historyRoute: {
    fontSize: 13,
    color: COLORS.ink,
    marginBottom: 8,
  },
  historyBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingTop: 6,
  },
  historyFareLabel: {
    fontSize: 12,
    color: COLORS.mute,
  },
  historyFare: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.ok,
  },
  docSectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginTop: 10,
  },
  docSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  docSectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
  docSectionSub: {
    fontSize: 12,
    color: COLORS.mute,
    marginBottom: 12,
  },
  docGrid: {
    gap: 8,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.paper,
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  docCardPdf: {
    borderColor: '#FED7AA',
  },
  docCardInfo: {
    flex: 1,
    marginLeft: 10,
  },
  docCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  docCardSub: {
    fontSize: 11,
    color: COLORS.mute,
    marginTop: 2,
  },
  docPreviewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  docPreviewText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brand,
  },
});
