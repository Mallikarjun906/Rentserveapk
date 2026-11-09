// Central Notifications Screen with Category Filters, Unread Badges & Real-Time Sync

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  Car,
  Calendar,
  MessageSquare,
  Building2,
  ShieldCheck,
  Sliders,
  CheckCircle2,
  Clock,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { useLocalization } from '../../context/LocalizationContext';
import { useAuth } from '../../context/AuthContext';
import {
  notificationApi,
  NotificationItem,
  NotificationCategory,
} from '../../api/notificationApi';
import { getSocket } from '../../services/socketService';
import { Modal } from '../../components/common/Modal';

interface NotificationsScreenProps {
  onBack: () => void;
  onNavigate?: (screen: string, params?: any) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onBack,
  onNavigate,
}) => {
  const { t, language } = useLocalization();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [prefModalOpen, setPrefModalOpen] = useState<boolean>(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationApi.getNotifications(selectedCategory);
      setNotifications(res.items);
      setUnreadCount(res.unreadCount);
    } catch {
      // Keep existing state on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time notification socket listener
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewNotification = () => {
      fetchNotifications();
    };

    socket.on('notification:new', handleNewNotification);
    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [fetchNotifications]);

  const handleMarkAsRead = async (item: NotificationItem) => {
    if (item.isRead) return;
    try {
      await notificationApi.markAsRead(item._id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      Alert.alert(t('Error', 'ದೋಷ'), t('Failed to update notifications', 'ನವೀಕರಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {}
  };

  const handleItemPress = (item: NotificationItem) => {
    handleMarkAsRead(item);

    // Deep linking to relevant screen
    if (!onNavigate) return;

    if (item.category === 'ride' && item.data?.tripId) {
      onNavigate('live-tracking', { tripId: item.data.tripId });
    } else if (item.category === 'message') {
      if (item.data?.conversationId) {
        onNavigate('chat', { conversationId: item.data.conversationId });
      } else {
        onNavigate('messages');
      }
    } else if (item.category === 'booking') {
      onNavigate('bookings');
    } else if (item.category === 'property' && item.data?.propertyId) {
      onNavigate('property', { propertyId: item.data.propertyId });
    } else if (item.category === 'verification') {
      if (user?.role === 'driver') onNavigate('driver-profile');
      else if (user?.role === 'provider') onNavigate('provider-profile');
      else if (user?.role === 'student') onNavigate('student-dashboard');
      else if (user?.role === 'admin') onNavigate('admin-dashboard');
    }
  };

  const renderCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'ride':
        return <Car size={18} color={COLORS.brand} />;
      case 'booking':
        return <Calendar size={18} color={COLORS.brand} />;
      case 'message':
        return <MessageSquare size={18} color={COLORS.brand} />;
      case 'property':
        return <Building2 size={18} color={COLORS.brand} />;
      case 'verification':
        return <ShieldCheck size={18} color={COLORS.brand} />;
      default:
        return <Bell size={18} color={COLORS.brand} />;
    }
  };

  const categories = [
    { key: 'all', label: language === 'kn' ? 'ಎಲ್ಲಾ' : 'All' },
    { key: 'ride', label: language === 'kn' ? 'ಸವಾರಿ' : 'Rides' },
    { key: 'booking', label: language === 'kn' ? 'ಬುಕಿಂಗ್' : 'Bookings' },
    { key: 'message', label: language === 'kn' ? 'ಸಂದೇಶ' : 'Messages' },
    { key: 'property', label: language === 'kn' ? 'ಬಾಡಿಗೆ' : 'Properties' },
    { key: 'verification', label: language === 'kn' ? 'ಪರಿಶೀಲನೆ' : 'Verification' },
  ];

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          accessibilityLabel="Back"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={22} color={COLORS.ink} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>
            {language === 'kn' ? 'ಅಧಿಸೂಚನೆಗಳು' : 'Notifications'}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.unreadPill}>
              <Text style={styles.unreadPillText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllRead}
              style={styles.iconActionBtn}
              accessibilityLabel="Mark all as read"
            >
              <CheckCheck size={20} color={COLORS.brand} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter Chips */}
      <View style={styles.categoryScrollWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(c) => c.key}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => {
            const active = selectedCategory === item.key;
            return (
              <TouchableOpacity
                onPress={() => setSelectedCategory(item.key)}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
              >
                <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchNotifications();
              }}
              tintColor={COLORS.brand}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconCircle}>
                <BellOff size={36} color={COLORS.mute} />
              </View>
              <Text style={styles.emptyTitle}>
                {language === 'kn' ? 'ಯಾವುದೇ ಅಧಿಸೂಚನೆಗಳಿಲ್ಲ' : 'No notifications yet'}
              </Text>
              <Text style={styles.emptySub}>
                {language === 'kn'
                  ? 'ಬುಕಿಂಗ್ ಮತ್ತು ನವೀಕರಣಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ'
                  : 'Updates regarding your bookings and rides will appear here.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, !item.isRead && styles.cardUnread]}
              onPress={() => handleItemPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.categoryBadge}>
                  {renderCategoryIcon(item.category)}
                  <Text style={styles.categoryBadgeText}>
                    {item.category.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.timeWrap}>
                  <Clock size={12} color={COLORS.mute} />
                  <Text style={styles.timeText}>
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  {!item.isRead && <View style={styles.unreadDot} />}
                </View>
              </View>

              <Text style={[styles.cardTitle, !item.isRead && styles.cardTitleBold]}>
                {item.title}
              </Text>
              <Text style={styles.cardDesc}>{item.description}</Text>

              <View style={styles.cardFooter}>
                <TouchableOpacity
                  onPress={() => handleDelete(item._id)}
                  style={styles.deleteBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={14} color={COLORS.mute} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderColor: COLORS.line,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.paper,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ink,
  },
  unreadPill: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  unreadPillText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconActionBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brandTint,
  },
  categoryScrollWrap: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderColor: COLORS.line,
  },
  categoryList: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  categoryChipActive: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  categoryChipTextActive: {
    color: COLORS.white,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    ...SHADOWS.card,
  },
  cardUnread: {
    borderColor: COLORS.brand,
    backgroundColor: '#FAFDFB',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.brand,
    letterSpacing: 0.5,
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: COLORS.mute,
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.brand,
    marginLeft: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 4,
  },
  cardTitleBold: {
    fontWeight: '800',
  },
  cardDesc: {
    fontSize: 13,
    color: COLORS.inkLight,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  deleteBtn: {
    padding: 4,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.paper,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.mute,
    textAlign: 'center',
    lineHeight: 18,
  },
});
