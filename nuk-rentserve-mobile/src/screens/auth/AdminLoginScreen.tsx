// Administrator Secure Sign-In Screen (/admin/login)

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Logo } from '../../components/common/Logo';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { authApi } from '../../api/authApi';
import { Storage } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';

interface AdminLoginScreenProps {
  onBackToApp: () => void;
  onSuccess: () => void;
}

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({
  onBackToApp,
  onSuccess,
}) => {
  const { t } = useLocalization();
  const { adminLogin } = useAuth();
  const [identifier, setIdentifier] = useState('admin@nukrentserve.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdminLogin = async () => {
    if (!identifier.trim()) {
      setError('Please enter administrator email or username.');
      return;
    }
    if (!password) {
      setError('Please enter your administrator password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await adminLogin(identifier.trim(), password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Administrator authentication failed. Access denied.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <Badge tone="ok" label="SECURITY CLEARANCE REQUIRED" />
            </View>
            <Logo size={52} />
            <Text style={styles.title}>Administrator Portal</Text>
            <Text style={styles.sub}>
              Verification desk, registrations review & platform governance
            </Text>
          </View>

          {/* Security Alert Banner */}
          <View style={styles.securityWarning}>
            <Text style={styles.warningIcon}>🔒</Text>
            <Text style={styles.warningText}>
              Restricted Area: Authorized personnel only. Every sign-in attempt and action is permanently recorded in the audit log.
            </Text>
          </View>

          {error ? <ErrorBanner message={error} onRetry={handleAdminLogin} /> : null}

          {/* Form Card */}
          <View style={[styles.formCard, SHADOWS.card]}>
            <Input
              label="Administrator Email / Login ID"
              placeholder="admin@nukrentserve.com"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Input
              label="Master Password"
              placeholder="••••••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              }
            />

            <Button
              title="Authenticate & Open Console"
              onPress={handleAdminLogin}
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              style={styles.submitBtn}
            />

            <Button
              title="Return to Main Application"
              onPress={onBackToApp}
              variant="outline"
              size="md"
              fullWidth
              style={styles.backBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  keyboard: { flex: 1 },
  scroll: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 20 },
  badgeRow: { marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '900', color: COLORS.white, marginTop: 12 },
  sub: { fontSize: 13, color: '#94A3B8', marginTop: 4, textAlign: 'center', maxWidth: 300 },
  securityWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 20,
  },
  warningIcon: { fontSize: 20, marginRight: 8 },
  warningText: { fontSize: 12, color: '#FCA5A5', flex: 1, lineHeight: 18, fontWeight: '600' },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 24,
    borderWidth: 1.5,
    borderColor: COLORS.line,
  },
  toggleText: { fontSize: 13, fontWeight: '700', color: COLORS.brand },
  submitBtn: { marginTop: 12, marginBottom: 10 },
  backBtn: { borderColor: COLORS.line },
});
