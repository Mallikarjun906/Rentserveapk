// Administrator Secure Sign-In Screen (/admin/login) with Lucide Icons

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ShieldCheck, Lock, Eye, EyeOff, LogIn } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Logo } from '../../components/common/Logo';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useAuth } from '../../context/AuthContext';

interface AdminLoginScreenProps {
  onBackToApp: () => void;
  onSuccess: () => void;
}

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({
  onBackToApp,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const { adminLogin } = useAuth();
  const [identifier, setIdentifier] = useState('demo.admin@nukrentserve.com');
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
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <Header
        title="Admin Portal"
        subtitle="Restricted Security Access"
        onBack={onBackToApp}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
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
            <Lock size={18} color="#92400E" style={{ marginRight: 8, marginTop: 1 }} />
            <Text style={styles.warningText}>
              Restricted Area: Authorized personnel only. Every sign-in attempt and action is permanently recorded in the audit log.
            </Text>
          </View>

          {error ? <ErrorBanner message={error} onRetry={handleAdminLogin} /> : null}

          {/* Form Card */}
          <View style={[styles.card, SHADOWS.card]}>
            <Input
              label="Admin Email or Username"
              placeholder="e.g. admin@nukrentserve.com"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Input
              label="Password"
              placeholder="••••••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={COLORS.mute} />
                  ) : (
                    <Eye size={20} color={COLORS.mute} />
                  )}
                </TouchableOpacity>
              }
            />

            <Button
              title="Authenticate Administrator"
              onPress={handleAdminLogin}
              variant="dark"
              size="lg"
              fullWidth
              loading={loading}
              icon={<ShieldCheck size={18} color={COLORS.white} style={{ marginRight: 8 }} />}
              style={styles.submitBtn}
            />

            <TouchableOpacity onPress={onBackToApp} style={styles.backLink}>
              <Text style={styles.backLinkText}>← Return to Public Application</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.paper },
  keyboard: { flex: 1 },
  scroll: { padding: 18, justifyContent: 'center', flexGrow: 1, paddingBottom: 36 },
  header: { alignItems: 'center', marginBottom: 18 },
  badgeRow: { marginBottom: 10 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.ink, marginTop: 10 },
  sub: { fontSize: 13, color: COLORS.mute, marginTop: 4, textAlign: 'center', lineHeight: 18 },
  securityWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
    flex: 1,
    lineHeight: 17,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1.5,
    borderColor: COLORS.line,
  },
  submitBtn: {
    marginTop: 8,
    marginBottom: 12,
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  backLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.mute,
  },
});
