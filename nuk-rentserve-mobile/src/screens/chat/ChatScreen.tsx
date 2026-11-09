// In-Trip & In-Service Chat Screen (Connected to real backend messaging)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Phone,
  Send,
  MessageSquare,
  AlertCircle,
  Check,
  CheckCheck,
} from 'lucide-react-native';
import { COLORS, RADIUS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { useLocalization } from '../../context/LocalizationContext';
import { useAuth } from '../../context/AuthContext';
import { chatApi, ChatMessage } from '../../api/chatApi';
import { getOrConnectSocket, joinChatRoom, leaveChatRoom } from '../../services/socketService';

interface ChatScreenProps {
  recipientName: string;
  recipientRole?: string;
  recipientPhone?: string;
  bookingId?: string;
  onBack: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  recipientName,
  recipientRole = 'Driver / Provider',
  recipientPhone,
  bookingId,
  onBack,
}) => {
  const { t } = useLocalization();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async (isSilent = false) => {
    if (!bookingId) {
      if (!isSilent) setError('No conversation thread ID provided. Please open chat from a booking or provider profile.');
      setLoading(false);
      return;
    }
    if (!isSilent) setError('');
    try {
      const items = await chatApi.getMessages(bookingId);
      setMessages(items);
    } catch (e: any) {
      if (!isSilent) setError(e.message || 'Could not load messages.');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  // Real-Time Socket.IO Message Listener
  useEffect(() => {
    if (!bookingId) return;

    let isMounted = true;
    let socket: any = null;

    (async () => {
      try {
        socket = await getOrConnectSocket();
        if (!isMounted || !socket) return;

        joinChatRoom(bookingId);

        const handleNewMessage = (msg: ChatMessage) => {
          if (!msg || !msg._id) return;
          setMessages((prev) => {
            const alreadyExists = prev.some((m) => m._id === msg._id || (m.id && m.id === msg.id));
            if (alreadyExists) return prev;
            return [...prev, msg];
          });
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        };

        socket.on('chat:new_message', handleNewMessage);
      } catch {}
    })();

    return () => {
      isMounted = false;
      leaveChatRoom(bookingId);
      if (socket) {
        socket.off('chat:new_message');
      }
    };
  }, [bookingId]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(() => {
      loadMessages(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || !bookingId || sending) return;

    setSending(true);
    try {
      const sentMsg = await chatApi.sendMessage(bookingId, textToSend);
      setMessages((prev) => [...prev, sentMsg]);
      setInput('');
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (e: any) {
      setError(e.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const cannedReplies = [
    t('cannedOnMyWay', 'I am on my way.'),
    t('cannedArrived', 'I have arrived at the location.'),
    t('cannedCallMe', 'Please call me when free.'),
    t('cannedThankYou', 'Thank you!'),
  ];

  const formatMessageTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isMyMessage = (m: ChatMessage) => {
    const senderId = typeof m.senderId === 'object' ? m.senderId?._id : m.senderId;
    return String(senderId) === String(user?.id || user?._id);
  };

  return (
    <View style={styles.container}>
      <Header
        title={recipientName}
        subtitle={recipientRole}
        onBack={onBack}
        rightAction={
          recipientPhone ? (
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${recipientPhone}`)}
              style={styles.callBtn}
              accessibilityLabel={`Call ${recipientName}`}
              activeOpacity={0.8}
            >
              <Phone size={16} color={COLORS.brand} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        style={styles.flex}
      >
        {error ? (
          <View style={styles.errorBox}>
            <AlertCircle size={16} color={COLORS.bad} />
            <Text style={styles.errorText}>{error}</Text>
            {bookingId ? (
              <TouchableOpacity onPress={() => loadMessages()} style={styles.retryBtn}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {loading && messages.length === 0 ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={COLORS.brand} />
            <Text style={styles.loadingText}>Loading conversation history…</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.messagesScroll}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyChatBox}>
                <MessageSquare size={36} color={COLORS.muteLight} />
                <Text style={styles.emptyChatTitle}>Start Your Conversation</Text>
                <Text style={styles.emptyChatSub}>
                  Messages sent here are private and persistent between you and {recipientName}.
                </Text>
              </View>
            ) : (
              messages.map((m) => {
                const isMe = isMyMessage(m);
                return (
                  <View
                    key={m._id || m.id || Math.random().toString()}
                    style={[
                      styles.bubbleContainer,
                      isMe ? styles.myContainer : styles.otherContainer,
                    ]}
                  >
                    <View
                      style={[
                        styles.bubble,
                        isMe ? styles.myBubble : styles.otherBubble,
                      ]}
                    >
                      {!isMe && m.senderId?.name ? (
                        <Text style={styles.senderName}>{m.senderId.name}</Text>
                      ) : null}
                      <Text
                        style={[
                          styles.bubbleText,
                          isMe ? styles.myText : styles.otherText,
                        ]}
                      >
                        {m.message}
                      </Text>
                      <View style={styles.metaRow}>
                        <Text
                          style={[
                            styles.timeText,
                            isMe ? styles.myTime : styles.otherTime,
                          ]}
                        >
                          {formatMessageTime(m.createdAt)}
                        </Text>
                        {isMe && (
                          m.readAt ? (
                            <CheckCheck size={12} color="rgba(255,255,255,0.85)" />
                          ) : (
                            <Check size={12} color="rgba(255,255,255,0.7)" />
                          )
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* Quick Canned Reply Chips */}
        <View style={styles.cannedContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cannedScroll}
          >
            {cannedReplies.map((reply, i) => (
              <TouchableOpacity
                key={i}
                style={styles.cannedChip}
                onPress={() => handleSend(reply)}
                disabled={sending}
                activeOpacity={0.8}
              >
                <Text style={styles.cannedText}>{reply}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bottom Input Row with Safe-Area clearance */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TextInput
            style={styles.input}
            placeholder={t('Type a message...', 'ಸಂದೇಶ ಬರೆಯಿರಿ...')}
            placeholderTextColor={COLORS.mute}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleSend()}
            editable={!sending}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!input.trim() || sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Send size={16} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  flex: {
    flex: 1,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.mute,
    fontSize: 14,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: COLORS.white,
    margin: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: COLORS.bad,
    fontSize: 13,
    flex: 1,
  },
  retryBtn: {
    backgroundColor: COLORS.brandTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brand,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesScroll: {
    padding: 16,
    paddingBottom: 10,
  },
  emptyChatBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyChatTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
    marginTop: 12,
  },
  emptyChatSub: {
    fontSize: 12,
    color: COLORS.mute,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 30,
  },
  bubbleContainer: {
    marginBottom: 10,
    flexDirection: 'row',
  },
  myContainer: {
    justifyContent: 'flex-end',
  },
  otherContainer: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
  },
  myBubble: {
    backgroundColor: COLORS.brand,
    borderBottomRightRadius: 2,
  },
  otherBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brand,
    marginBottom: 2,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  myText: {
    color: COLORS.white,
  },
  otherText: {
    color: COLORS.ink,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
  },
  myTime: {
    color: 'rgba(255,255,255,0.75)',
  },
  otherTime: {
    color: COLORS.mute,
  },
  cannedContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  cannedScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  cannedChip: {
    backgroundColor: COLORS.paper,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  cannedText: {
    fontSize: 12,
    color: COLORS.ink,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.paper,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    fontSize: 14,
    color: COLORS.ink,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.muteLight,
  },
});
