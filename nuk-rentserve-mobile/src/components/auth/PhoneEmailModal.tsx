// Official Phone.Email Mobile OTP Authentication Modal
// Embedded WebView for React Native (Android / iOS) & Universal Web iframe/popup support

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  SafeAreaView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { X, ShieldCheck } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { useLocalization } from '../../context/LocalizationContext';

export interface PhoneEmailResult {
  token?: string;
  user_json_url?: string;
  phone?: string;
  countryCode?: string;
}

interface PhoneEmailModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (result: PhoneEmailResult) => void;
  onError: (errorMessage: string) => void;
  phone?: string;
  purpose?: string;
}

export const PhoneEmailModal: React.FC<PhoneEmailModalProps> = ({
  visible,
  onClose,
  onSuccess,
  onError,
  phone = '',
  purpose = 'customer-login',
}) => {
  const { t } = useLocalization();
  const [loading, setLoading] = useState(true);

  // Generate a transient device identifier for this authentication attempt
  const [deviceId] = useState(() => 'rn_' + Math.random().toString(36).substring(2, 12));

  const clientId =
    process.env.EXPO_PUBLIC_PHONE_EMAIL_CLIENT_ID || '18875442659397262084';

  const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '';

  // Official Phone.email authentication URI
  let authUrl = `https://auth.phone.email/log-in?client_id=${clientId}&auth_type=4&device=${deviceId}`;
  if (cleanPhone && cleanPhone.length === 10) {
    authUrl += `&country_code=+91&phone_no=${cleanPhone}`;
  }

  // Handle Web message / listener
  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;

    const win: any = typeof globalThis !== 'undefined' ? (globalThis as any).window : null;
    if (!win) return;

    const handleWebMessage = (event: any) => {
      try {
        if (!event.data) return;
        let data = event.data;
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch {
            // raw string
          }
        }

        if (typeof data === 'object') {
          if (data.user_json_url || data.token || data.jwt) {
            onSuccess({
              token: data.token || data.jwt || '',
              user_json_url: data.user_json_url || '',
              phone: data.user_phone_number || data.phone_no || '',
              countryCode: data.user_country_code || data.country_code || '+91',
            });
            onClose();
          }
        } else if (typeof data === 'string' && data.startsWith('ey')) {
          onSuccess({ token: data });
          onClose();
        }
      } catch (err: any) {
        onError(err.message || 'Verification failed');
      }
    };

    win.phoneEmailListener = (userObj: any) => {
      if (userObj && (userObj.user_json_url || userObj.token)) {
        onSuccess({
          user_json_url: userObj.user_json_url,
          token: userObj.token,
          phone: userObj.user_phone_number || '',
          countryCode: userObj.user_country_code || '+91',
        });
        onClose();
      }
    };

    win.addEventListener('message', handleWebMessage);
    return () => {
      win.removeEventListener('message', handleWebMessage);
    };
  }, [visible, onSuccess, onError, onClose]);

  // Handle React Native WebView onMessage
  const handleMessage = (event: any) => {
    try {
      const raw = event.nativeEvent.data;
      if (!raw) return;

      let token = '';
      let user_json_url = '';
      let verifiedPhone = '';
      let countryCode = '+91';

      try {
        const parsed = JSON.parse(raw);
        token = parsed.token || parsed.jwt || parsed.access_token || '';
        user_json_url = parsed.user_json_url || '';
        verifiedPhone =
          parsed.user_phone_number ||
          parsed.user_phone_no ||
          parsed.phone_number ||
          parsed.phone_no ||
          parsed.phone ||
          '';
        countryCode =
          parsed.user_country_code ||
          parsed.country_code ||
          '+91';
      } catch {
        if (typeof raw === 'string') {
          if (raw.startsWith('ey')) {
            token = raw;
          } else if (raw.startsWith('http')) {
            user_json_url = raw;
          }
        }
      }

      if (token || user_json_url) {
        onSuccess({
          token,
          user_json_url,
          phone: verifiedPhone,
          countryCode,
        });
        onClose();
      }
    } catch (err: any) {
      onError(err.message || 'Failed to process authentication result.');
    }
  };

  // Handle URL changes / redirects inside WebView
  const handleNavigationStateChange = (navState: any) => {
    const url = navState?.url;
    if (!url) return;

    if (url.includes('user_json_url=') || url.includes('jwt=') || url.includes('token=')) {
      try {
        const matchJson = url.match(/[?&]user_json_url=([^&]+)/);
        const matchToken = url.match(/[?&](?:token|jwt)=([^&]+)/);
        if (matchJson || matchToken) {
          onSuccess({
            user_json_url: matchJson ? decodeURIComponent(matchJson[1]) : '',
            token: matchToken ? decodeURIComponent(matchToken[1]) : '',
          });
          onClose();
        }
      } catch (e: any) {
        onError(e.message || 'Error processing authentication callback.');
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <ShieldCheck size={20} color={COLORS.brand} style={styles.headerIcon} />
            <Text style={styles.headerTitle}>
              {t('Secure Phone.Email Verification', 'ಸುರಕ್ಷಿತ ಮೊಬೈಲ್ OTP ಪರಿಶೀಲನೆ')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityLabel="Close"
          >
            <X size={22} color={COLORS.ink} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.body}>
          {Platform.OS === 'web' ? (
            <iframe
              src={authUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              } as any}
              title="Phone.Email OTP Verification"
              onLoad={() => setLoading(false)}
            />
          ) : (
            <WebView
              source={{ uri: authUrl }}
              style={styles.webView}
              onMessage={handleMessage}
              onNavigationStateChange={handleNavigationStateChange}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={COLORS.brand} />
                  <Text style={styles.loadingText}>
                    {t('Connecting to Phone.email...', 'Phone.email ಗೆ ಸಂಪರ್ಕಿಸಲಾಗುತ್ತಿದೆ...')}
                  </Text>
                </View>
              )}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              originWhitelist={['*']}
            />
          )}

          {loading && Platform.OS === 'web' && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={COLORS.brand} />
              <Text style={styles.loadingText}>
                {t('Connecting to Phone.email...', 'Phone.email ಗೆ ಸಂಪರ್ಕಿಸಲಾಗುತ್ತಿದೆ...')}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    backgroundColor: COLORS.canvas,
    ...SHADOWS.soft,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink,
  },
  closeButton: {
    padding: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.paper,
  },
  body: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.mute,
    fontWeight: '500',
  },
});
