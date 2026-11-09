// Dedicated Service Provider Profile Screen (1 of 2 Provider Main Tabs)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Wrench,
  Clock,
  FileCheck,
  ShieldCheck,
  AlertTriangle,
  LogOut,
  Edit3,
  ExternalLink,
  CheckCircle2,
  HelpCircle,
  FileText,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import { providerApi } from '../../api/providerApi';
import { authApi } from '../../api/authApi';
import { DocumentViewerModal, DocumentItem } from '../../components/common/DocumentViewerModal';
import { CONFIG } from '../../constants/config';
import { confirmAction } from '../../utils/confirmAlert';

interface ProviderMyProfileScreenProps {
  onBack?: () => void;
  onLogout: () => void;
  onNavigateTerms?: (role: string) => void;
  onNavigateSupport?: () => void;
}

export const ProviderMyProfileScreen: React.FC<ProviderMyProfileScreenProps> = ({
  onBack,
  onLogout,
  onNavigateTerms,
  onNavigateSupport,
}) => {
  const { user, logout } = useAuth();
  const { t } = useLocalization();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [myApp, setMyApp] = useState<any>(null);
  const [isAvailable, setIsAvailable] = useState(true);

  // Edit Profile Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCity, setEditCity] = useState('');
  const [saving, setSaving] = useState(false);

  // Document Viewer Modal
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [previewDocs, setPreviewDocs] = useState<DocumentItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      providerApi.getMyProfile(),
      authApi.getMyApplication(),
      authApi.getMe(),
    ]).then(([profRes, appRes, meRes]) => {
      if (!active) return;
      if (profRes.status === 'fulfilled' && profRes.value) {
        setProfile(profRes.value);
        setIsAvailable(profRes.value.availability !== false);
      }
      if (appRes.status === 'fulfilled' && appRes.value) {
        setMyApp(appRes.value);
      }
      if (meRes.status === 'fulfilled' && meRes.value) {
        setEditName(meRes.value.name || '');
        setEditPhone(meRes.value.phone || '');
        setEditCity(meRes.value.location || 'Bagalkot');
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleToggleAvailability = async (val: boolean) => {
    setIsAvailable(val);
    try {
      await providerApi.updateMyProfile({ availability: val });
    } catch {
      // Handled silently
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }
    setSaving(true);
    try {
      await authApi.updateMe({
        name: editName.trim(),
        phone: editPhone.trim(),
        location: editCity.trim(),
      });
      setEditModalOpen(false);
      Alert.alert('Success', 'Profile details updated.');
    } catch (e: any) {
      Alert.alert('Update Failed', e.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    confirmAction(
      t('Logout', 'ಲಾಗ್ ಔಟ್'),
      t('Are you sure you want to sign out?', 'ನೀವು ಖಚಿತವಾಗಿ ಲಾಗ್ ಔಟ್ ಮಾಡಲು ಬಯಸುವಿರಾ?'),
      async () => {
        await logout();
        onLogout();
      },
      'Sign Out'
    );
  };

  const openDocument = (docType: string, title: string) => {
    const list: DocumentItem[] = [
      {
        id: `provider-${docType}`,
        docType,
        title,
        url: `${CONFIG.API_BASE_URL}/documents/mine/${docType}`,
        isPdf: false,
        format: 'jpg',
      },
    ];
    setPreviewDocs(list);
    setPreviewIndex(0);
    setDocModalOpen(true);
  };

  const displayName = user?.name || profile?.name || 'Service Provider';
  const displayPhone = user?.phone || profile?.phone || '';
  const displayEmail = user?.email || profile?.email || '';
  const displayLocation = user?.location || profile?.address || 'Bagalkot, Karnataka';
  const approvalStatus = user?.approvalStatus || profile?.approvalStatus || 'pending';
  const rejectionReason = user?.rejectionReason || profile?.rejectionReason || '';

  const getApprovalBadge = () => {
    if (approvalStatus === 'approved') return <Badge tone="ok" label="Verified Provider" />;
    if (approvalStatus === 'rejected') return <Badge tone="bad" label="Verification Rejected" />;
    return <Badge tone="warn" label="Pending Admin Review" />;
  };

  return (
    <View style={styles.root}>
      <Header
        title={t('Provider Profile', 'ಸೇವಾ ಪೂರೈಕೆದಾರರ ಪ್ರೊಫೈಲ್')}
        subtitle="Account, credentials & availability"
        onBack={onBack}
        rightAction={
          <TouchableOpacity
            style={styles.editIconBtn}
            onPress={() => setEditModalOpen(true)}
            activeOpacity={0.7}
          >
            <Edit3 size={18} color={COLORS.ink} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={COLORS.brand} />
            <Text style={styles.loadingText}>Loading profile…</Text>
          </View>
        ) : (
          <>
            {/* Identity Card */}
            <View style={[styles.card, SHADOWS.card]}>
              <View style={styles.avatarRow}>
                <View style={styles.avatarBox}>
                  {user?.profileImage?.url ? (
                    <Image source={{ uri: user.profileImage.url }} style={styles.avatarImg} />
                  ) : (
                    <User size={36} color={COLORS.brand} />
                  )}
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.userName}>{displayName}</Text>
                  <View style={styles.badgeRow}>{getApprovalBadge()}</View>
                </View>
              </View>

              {/* Status Note */}
              {approvalStatus === 'rejected' && rejectionReason ? (
                <View style={styles.rejectionBox}>
                  <AlertTriangle size={16} color={COLORS.bad} style={{ marginRight: 6 }} />
                  <Text style={styles.rejectionText}>
                    Reason: {rejectionReason}
                  </Text>
                </View>
              ) : null}

              <View style={styles.divider} />

              {/* Contact Details */}
              <View style={styles.detailList}>
                {displayPhone ? (
                  <View style={styles.detailItem}>
                    <Phone size={16} color={COLORS.mute} style={styles.detailIcon} />
                    <Text style={styles.detailText}>{displayPhone}</Text>
                  </View>
                ) : null}

                {displayEmail ? (
                  <View style={styles.detailItem}>
                    <Mail size={16} color={COLORS.mute} style={styles.detailIcon} />
                    <Text style={styles.detailText}>{displayEmail}</Text>
                  </View>
                ) : null}

                <View style={styles.detailItem}>
                  <MapPin size={16} color={COLORS.mute} style={styles.detailIcon} />
                  <Text style={styles.detailText}>{displayLocation}</Text>
                </View>
              </View>
            </View>

            {/* Availability Toggle Card */}
            <View style={[styles.card, SHADOWS.card]}>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardHeading}>
                    {t('Availability Status', 'ಲಭ್ಯತೆ ಸ್ಥಿತಿ')}
                  </Text>
                  <Text style={styles.toggleSub}>
                    {isAvailable
                      ? t('Accepting new customer booking requests', 'ಗ್ರಾಹಕರ ಬುಕಿಂಗ್ ಸ್ವೀಕರಿಸಲಾಗುತ್ತಿದೆ')
                      : t('Currently paused / offline', 'ಪ್ರಸ್ತುತ ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದೆ')}
                  </Text>
                </View>
                <Switch
                  value={isAvailable}
                  onValueChange={handleToggleAvailability}
                  trackColor={{ false: COLORS.line, true: COLORS.brandTint }}
                  thumbColor={isAvailable ? COLORS.brand : '#D1D5DB'}
                />
              </View>
            </View>

            {/* Service Category & Experience Card */}
            <View style={[styles.card, SHADOWS.card]}>
              <Text style={styles.cardHeading}>
                {t('Trade & Expertise', 'ವೃತ್ತಿ ಮತ್ತು ಅನುಭವ')}
              </Text>
              <View style={styles.tradeRow}>
                <View style={styles.tradeChip}>
                  <Wrench size={14} color={COLORS.brand} style={{ marginRight: 6 }} />
                  <Text style={styles.tradeChipText}>
                    {myApp?.category || profile?.category || 'General Service'}
                  </Text>
                </View>
                <View style={styles.tradeChip}>
                  <Clock size={14} color={COLORS.info} style={{ marginRight: 6 }} />
                  <Text style={styles.tradeChipText}>
                    {myApp?.experience || '3+ years experience'}
                  </Text>
                </View>
              </View>

              {myApp?.description ? (
                <Text style={styles.descText}>{myApp.description}</Text>
              ) : null}
            </View>

            {/* Uploaded Verification Documents Card */}
            <View style={[styles.card, SHADOWS.card]}>
              <Text style={styles.cardHeading}>
                {t('Verified Identity Documents', 'ಪರಿಶೀಲಿಸಿದ ದಾಖಲೆಗಳು')}
              </Text>

              <TouchableOpacity
                style={styles.docRow}
                onPress={() => openDocument('aadhaarDocument', 'Government Identity ID')}
                activeOpacity={0.7}
              >
                <View style={styles.docLeft}>
                  <ShieldCheck size={20} color={COLORS.ok} style={{ marginRight: 10 }} />
                  <View>
                    <Text style={styles.docTitle}>Government ID / Aadhaar</Text>
                    <Text style={styles.docSub}>Masked private document</Text>
                  </View>
                </View>
                <ExternalLink size={16} color={COLORS.mute} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.docRow}
                onPress={() => openDocument('addressDocument', 'Address Proof')}
                activeOpacity={0.7}
              >
                <View style={styles.docLeft}>
                  <FileCheck size={20} color={COLORS.info} style={{ marginRight: 10 }} />
                  <View>
                    <Text style={styles.docTitle}>Address Proof / Workshop</Text>
                    <Text style={styles.docSub}>Location confirmation</Text>
                  </View>
                </View>
                <ExternalLink size={16} color={COLORS.mute} />
              </TouchableOpacity>
            </View>

            {/* Quick Links: Support & Terms */}
            <View style={[styles.card, SHADOWS.card]}>
              <Text style={styles.cardHeading}>
                {t('Help & Legal', 'ಸಹಾಯ ಮತ್ತು ನಿಯಮಗಳು')}
              </Text>

              {onNavigateSupport ? (
                <TouchableOpacity
                  style={styles.docRow}
                  onPress={onNavigateSupport}
                  activeOpacity={0.7}
                >
                  <View style={styles.docLeft}>
                    <HelpCircle size={20} color={COLORS.brand} style={{ marginRight: 10 }} />
                    <View>
                      <Text style={styles.docTitle}>{t('Support & Help Desk', 'ಗ್ರಾಹಕ ಬೆಂಬಲ')}</Text>
                      <Text style={styles.docSub}>Raise a support ticket or grievance</Text>
                    </View>
                  </View>
                  <ExternalLink size={16} color={COLORS.mute} />
                </TouchableOpacity>
              ) : null}

              {onNavigateTerms ? (
                <TouchableOpacity
                  style={styles.docRow}
                  onPress={() => onNavigateTerms('Service Provider')}
                  activeOpacity={0.7}
                >
                  <View style={styles.docLeft}>
                    <FileText size={20} color={COLORS.ink} style={{ marginRight: 10 }} />
                    <View>
                      <Text style={styles.docTitle}>{t('Terms of Service & Rules', 'ಸೇವಾ ನಿಯಮಗಳು')}</Text>
                      <Text style={styles.docSub}>Provider compliance & policies</Text>
                    </View>
                  </View>
                  <ExternalLink size={16} color={COLORS.mute} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Logout Action */}
            <TouchableOpacity
              style={[styles.logoutBtn, SHADOWS.card]}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <LogOut size={18} color={COLORS.bad} style={{ marginRight: 8 }} />
              <Text style={styles.logoutText}>{t('Sign Out', 'ಲಾಗ್ ಔಟ್')}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={t('Edit Profile', 'ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ')}
      >
        <Input
          label={t('Full Name', 'ಪೂರ್ಣ ಹೆಸರು')}
          value={editName}
          onChangeText={setEditName}
          placeholder="Basavaraj Patil"
        />
        <Input
          label={t('Mobile Number', 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ')}
          value={editPhone}
          onChangeText={setEditPhone}
          keyboardType="phone-pad"
          placeholder="9845012345"
        />
        <Input
          label={t('City / Town', 'ನಗರ')}
          value={editCity}
          onChangeText={setEditCity}
          placeholder="Bagalkot"
        />
        <Button
          title={t('Save Changes', 'ಉಳಿಸಿ')}
          onPress={handleSaveProfile}
          loading={saving}
          variant="primary"
          fullWidth
          style={{ marginTop: 12 }}
        />
      </Modal>

      {/* Document Viewer Modal */}
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
  root: { flex: 1, backgroundColor: COLORS.paper },
  scroll: { padding: 16, paddingBottom: 40 },
  centerBox: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: COLORS.mute, fontWeight: '600' },
  editIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    marginBottom: 14,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  avatarImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  infoCol: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.3,
  },
  badgeRow: {
    marginTop: 4,
    flexDirection: 'row',
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: RADIUS.md,
    marginTop: 12,
  },
  rejectionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.bad,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginVertical: 14,
  },
  detailList: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 10,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.ink,
    fontWeight: '600',
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleSub: {
    fontSize: 12,
    color: COLORS.mute,
    marginTop: 2,
  },
  tradeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  tradeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.paper,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  tradeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  descText: {
    fontSize: 13,
    color: COLORS.mute,
    lineHeight: 18,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  docLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  docSub: {
    fontSize: 11,
    color: COLORS.mute,
    marginTop: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.bad,
  },
});
