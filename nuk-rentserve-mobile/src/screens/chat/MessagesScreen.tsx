// Conversations List Screen (Connected to real backend chat)

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { AlertCircle, MessageSquare } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { EmptyState } from '../../components/common/EmptyState';
import { useLocalization } from '../../context/LocalizationContext';
import { chatApi, ConversationThread } from '../../api/chatApi';

interface MessagesScreenProps {
  onOpenChat: (thread: ConversationThread) => void;
}

export const MessagesScreen: React.FC<MessagesScreenProps> = ({ onOpenChat }) => {
  const { t } = useLocalization();
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadConversations = useCallback(async (isSilent = false) => {
    if (!isSilent) setError('');
    try {
      const data = await chatApi.getConversations();
      setThreads(data);
    } catch (e: any) {
      if (!isSilent) setError(e.message || 'Could not load conversations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    // 5-second polling interval for real-time conversation updates
    const timer = setInterval(() => {
      loadConversations(true);
    }, 5000);
    return () => clearInterval(timer);
  }, [loadConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <Header
        title={t('tabMessages', 'ಸಂದೇಶಗಳು')}
        subtitle="Chat with your drivers, customers & providers"
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.brand} />}
      >
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={COLORS.brand} />
            <Text style={styles.loadingText}>Loading conversations…</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <AlertCircle size={32} color={COLORS.bad} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadConversations()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : threads.length === 0 ? (
          <EmptyState
            title="No Active Conversations"
            description="When you contact a driver, service provider, or property owner, your direct messages and updates will appear here."
            actionLabel="Refresh"
            onAction={() => loadConversations()}
          />
        ) : (
          threads.map((thread) => (
            <TouchableOpacity
              key={thread.id}
              style={[styles.threadCard, SHADOWS.card]}
              onPress={() => onOpenChat(thread)}
              activeOpacity={0.85}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{thread.name ? thread.name.charAt(0).toUpperCase() : '?'}</Text>
              </View>

              <View style={styles.infoCol}>
                <View style={styles.topRow}>
                  <Text style={styles.name}>{thread.name}</Text>
                  <Text style={styles.time}>{formatTime(thread.time)}</Text>
                </View>

                <Text style={styles.role}>{thread.role}</Text>
                <Text
                  style={[
                    styles.lastMsg,
                    thread.unread ? styles.unreadMsg : null,
                  ]}
                  numberOfLines={1}
                >
                  {thread.lastMessage}
                </Text>
              </View>

              {thread.unread ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{thread.unread}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
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
    paddingBottom: 60,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.mute,
  },
  errorText: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.bad,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  retryBtn: {
    backgroundColor: COLORS.brandTint,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.brand,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brand,
  },
  threadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.brand,
  },
  infoCol: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
  },
  time: {
    fontSize: 11,
    color: COLORS.mute,
  },
  role: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.brand,
    marginBottom: 3,
  },
  lastMsg: {
    fontSize: 13,
    color: COLORS.mute,
  },
  unreadMsg: {
    color: COLORS.ink,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: COLORS.brand,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
  },
});
