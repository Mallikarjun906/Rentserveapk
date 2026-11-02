// In-Trip & In-Service Chat Screen (Connected to real backend messaging)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { useLocalization } from '../../context/LocalizationContext';
import { useAuth } from '../../context/AuthContext';
import { chatApi, ChatMessage } from '../../api/chatApi';

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
      if (!isSilent) setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadMessages();
    if (!bookingId) return;
    // 3-second real-time polling fallback
    const interval = setInterval(() => {
      loadMessages(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [loadMessages, bookingId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || sending) return;

    if (!bookingId) {
      setError('Cannot send message: no active conversation or booking thread ID was found.');
      return;
    }

    setSending(true);
    try {
      const saved = await chatApi.sendMessage(bookingId, text);
      setMessages((prev) => [...prev, saved]);
      setInput('');
      setError('');
    } catch (e: any) {
      setError(e.message || 'Message delivery failed. Please retry.');
    } finally {
      setSending(false);
    }
  };

  const cannedReplies = [
    t('I am at the location', 'ನಾನು ಸ್ಥಳದಲ್ಲಿದ್ದೇನೆ'),
    t('Reaching in 2 minutes', '2 ನಿಮಿಷದಲ್ಲಿ ಬರುತ್ತಿದ್ದೇನೆ'),
    t('Please call me', 'ದಯವಿಟ್ಟು ಕರೆ ಮಾಡಿ'),
    t('Cash / UPI payment ready', 'ಪಾವತಿ ಸಿದ್ಧವಿದೆ'),
  ];

  const formatMessageTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isMyMessage = (m: ChatMessage) => {
    const senderId = m.senderId?._id || m.senderId?.id || m.senderId;
    return String(senderId) === String(user?.id || user?._id);
  };

  return (
    <SafeAreaView style={styles.safe}>
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
            >
              <Text style={styles.callIcon}>📞</Text>
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
            <Text style={styles.errorText}>⚠️ {error}</Text>
            {bookingId ? (
              <TouchableOpacity onPress={() => loadMessages()} style={styles.retryBtn}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {loading && messages.length === 0 ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={COLORS.crimson} />
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
                <Text style={styles.emptyChatIcon}>💬</Text>
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
                      <Text
                        style={[
                          styles.timeText,
                          isMe ? styles.myTime : styles.otherTime,
                        ]}
                      >
                        {formatMessageTime(m.createdAt)} {isMe ? (m.readAt ? '✓✓' : '✓') : ''}
                      </Text>
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
              >
                <Text style={styles.cannedText}>{reply}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bottom Input Row */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder={t('Type a message...', 'ಸಂದೇಶ ಬರೆಯಿರಿ...')}
            placeholderTextColor={COLORS.muteLight}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleSend()}
            editable={!sending}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.sendText}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
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
    color: COLORS.inkMuted,
    fontSize: 14,
  },
  errorBox: {
    padding: 16,
    backgroundColor: COLORS.white,
    margin: 16,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.crimson,
    fontSize: 14,
    marginBottom: 8,
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.brandTint,
    borderRadius: RADIUS.sm,
  },
  retryBtnText: {
    color: COLORS.crimson,
    fontWeight: '700',
    fontSize: 12,
  },
  messagesScroll: {
    padding: 16,
    flexGrow: 1,
  },
  emptyChatBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyChatIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyChatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 4,
  },
  emptyChatSub: {
    fontSize: 13,
    color: COLORS.inkMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  bubbleContainer: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  myContainer: {
    justifyContent: 'flex-end',
  },
  otherContainer: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
  },
  myBubble: {
    backgroundColor: COLORS.crimson,
    borderBottomRightRadius: 2,
  },
  otherBubble: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderBottomLeftRadius: 2,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.crimson,
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
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTime: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  otherTime: {
    color: COLORS.inkMuted,
  },
  cannedContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    backgroundColor: COLORS.white,
    paddingVertical: 8,
  },
  cannedScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  cannedChip: {
    backgroundColor: COLORS.brandTint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.crimson,
    marginRight: 6,
  },
  cannedText: {
    color: COLORS.crimson,
    fontSize: 12,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.ink,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.crimson,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.line,
  },
  sendText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.brandTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callIcon: {
    fontSize: 16,
  },
});
