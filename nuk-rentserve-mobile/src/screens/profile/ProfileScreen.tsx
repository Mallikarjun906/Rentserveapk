// User Profile & Role-Based Workspace Access Screen

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import { authApi } from '../../api/authApi';
import { DocumentViewerModal, DocumentItem } from '../../components/common/DocumentViewerModal';
import { CONFIG } from '../../constants/config';

interface ProfileScreenProps {
  onNavigateProviderDashboard?: () => void;
  onNavigateDriverDashboard: () => void;
  onNavigateDriverOnboarding: () => void;
  onNavigateOwnerDashboard: () => void;
  onNavigateStudentDashboard: () => void;
  onNavigateAdminDashboard: () => void;
  onNavigateSaved: () => void;
  onNavigateSupport: () => void;
  onNavigateTerms: (role: string) => void;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onNavigateProviderDashboard,
  onNavigateDriverDashboard,
  onNavigateDriverOnboarding,
  onNavigateOwnerDashboard,
  onNavigateStudentDashboard,
  onNavigateAdminDashboard,
  onNavigateSaved,
  onNavigateSupport,
  onNavigateTerms,
  onLogout,
}) => {
  const { user, role, logout } = useAuth();
  const { language, setLanguage, t } = useLocalization();

  const [resubmitting, setResubmitting] = useState(false);
  const [myApp, setMyApp] = useState<any | null>(null);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [previewDocs, setPreviewDocs] = useState<DocumentItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  React.useEffect(() => {
    let active = true;
    authApi
      .getMyApplication()
      .then((app) => {
        if (active && app) setMyApp(app);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user]);

  const openMyDocument = (docType: string, title: string, isPdf: boolean = false) => {
    const list: DocumentItem[] = [
      {
        id: `my-${docType}`,
        docType,
        title,
        url: `${CONFIG.API_BASE_URL}/documents/mine/${docType}`,
        isPdf,
        format: isPdf ? 'pdf' : 'jpg',
      },
    ];
    setPreviewDocs(list);
    setPreviewIndex(0);
    setDocModalOpen(true);
  };

  const userName = user?.name || 'Basavaraj Patil';
  const userPhone = user?.phone || '+91 98450 12345';
  const userLocation = user?.location || 'Bagalkot';
  const userRole = user?.role || 'customer';
  const approvalStatus = user?.approvalStatus || 'approved';
  const rejectionReason = user?.rejectionReason || '';

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  const handleResubmitMock = async () => {
    setResubmitting(true);
    try {
      const formData = new FormData();
      formData.append('document', {
        uri: 'file://mock/resubmitted.jpg',
        name: 'resubmitted-document.jpg',
        type: 'image/jpeg',
      } as any);
      await authApi.resubmitDocuments(formData);
      Alert.alert(
        'Documents Resubmitted',
        'Your replacement documents have been submitted to the administrator for review.'
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Resubmission failed.');
    } finally {
      setResubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header
        title={t('tabProfile', 'ಪ್ರೊಫೈಲ್')}
        subtitle="Account, Verified Role & Settings"
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* User Card */}
        <View style={[styles.userCard, SHADOWS.card]}>
          <View style={styles.userTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userName.charAt(0)}</Text>
            </View>
            <View style={styles.userCol}>
              <Text style={styles.name}>{userName}</Text>
              <Text style={styles.phone}>{userPhone}</Text>
              <Text style={styles.city}>📍 {userLocation}, Karnataka</Text>
            </View>
          </View>

          {/* Verified Role and Approval Status Row */}
          <View style={styles.roleRow}>
            <View style={styles.roleLeft}>
              <Text style={styles.roleLabel}>Role:</Text>
              <Badge tone="ok" label={userRole.toUpperCase()} />
            </View>
            <Badge
              tone={
                approvalStatus === 'approved'
                  ? 'ok'
                  : approvalStatus === 'rejected'
                  ? 'bad'
                  : 'sun'
              }
              label={approvalStatus.toUpperCase()}
            />
          </View>
        </View>

        {/* Rejection / Resubmission Notice */}
        {approvalStatus === 'rejected' && (
          <View style={[styles.rejectionNotice, SHADOWS.card]}>
            <Text style={styles.rejectionTitle}>⚠️ Application Action Required</Text>
            <Text style={styles.rejectionText}>
              Your documents were rejected: {rejectionReason || 'Please review guidelines and resubmit valid credentials.'}
            </Text>
            <Button
              title="Resubmit Replacement Documents"
              onPress={handleResubmitMock}
              variant="primary"
              size="sm"
              loading={resubmitting}
              style={{ marginTop: 10 }}
            />
          </View>
        )}

        {/* Pending Approval Notice */}
        {approvalStatus === 'pending' && userRole !== 'customer' && (
          <View style={[styles.pendingNotice, SHADOWS.card]}>
            <Text style={styles.pendingTitle}>⏳ Verification Under Review</Text>
            <Text style={styles.pendingText}>
              Your registration documents are currently being reviewed by an administrator. Services and trip dispatch will be activated upon approval.
            </Text>
          </View>
        )}

        {/* My Verification Documents (In-Screen Preview) */}
        <View style={[styles.docPreviewCard, SHADOWS.card]}>
          <Text style={styles.docPreviewCardTitle}>
            📑 {t('My Verification Documents', 'ನನ್ನ ಪರಿಶೀಲನಾ ದಾಖಲೆಗಳು')}
          </Text>
          <Text style={styles.docPreviewCardSub}>
            Documents are stored in encrypted private storage. Tap below to preview in-screen:
          </Text>

          <View style={styles.docPreviewList}>
            <TouchableOpacity
              style={styles.docRowItem}
              onPress={() => openMyDocument('aadhaarDocument', 'My Aadhaar ID (Masked)', false)}
              activeOpacity={0.7}
            >
              <View style={styles.docRowLeft}>
                <Text style={styles.docRowIcon}>🖼️</Text>
                <View>
                  <Text style={styles.docRowTitle}>Aadhaar / Govt ID</Text>
                  <Text style={styles.docRowSubtitle}>Masked identity verification copy</Text>
                </View>
              </View>
              <Text style={styles.previewActionPill}>👁️ Preview</Text>
            </TouchableOpacity>

            {(userRole === 'driver' || myApp?.hasDrivingLicence) && (
              <TouchableOpacity
                style={[styles.docRowItem, styles.docRowItemPdf]}
                onPress={() =>
                  openMyDocument('drivingLicenceDocument', 'My Driving Licence (DL)', true)
                }
                activeOpacity={0.7}
              >
                <View style={styles.docRowLeft}>
                  <Text style={styles.docRowIcon}>📄</Text>
                  <View>
                    <Text style={styles.docRowTitle}>Driving Licence (DL)</Text>
                    <Text style={styles.docRowSubtitle}>Multi-page commercial licence PDF</Text>
                  </View>
                </View>
                <Text style={styles.previewActionPill}>👁️ Preview</Text>
              </TouchableOpacity>
            )}

            {(userRole === 'driver' || myApp?.hasVehicleRc) && (
              <TouchableOpacity
                style={styles.docRowItem}
                onPress={() =>
                  openMyDocument('vehicleRcDocument', 'My Vehicle Registration Certificate (RC)', false)
                }
                activeOpacity={0.7}
              >
                <View style={styles.docRowLeft}>
                  <Text style={styles.docRowIcon}>🖼️</Text>
                  <View>
                    <Text style={styles.docRowTitle}>Vehicle RC Document</Text>
                    <Text style={styles.docRowSubtitle}>Karnataka Transport Department RC</Text>
                  </View>
                </View>
                <Text style={styles.previewActionPill}>👁️ Preview</Text>
              </TouchableOpacity>
            )}

            {(userRole === 'student' || myApp?.hasStudentIdCard) && (
              <TouchableOpacity
                style={styles.docRowItem}
                onPress={() =>
                  openMyDocument('studentIdCardDocument', 'My College Student ID Card', false)
                }
                activeOpacity={0.7}
              >
                <View style={styles.docRowLeft}>
                  <Text style={styles.docRowIcon}>🎓</Text>
                  <View>
                    <Text style={styles.docRowTitle}>Student ID Card</Text>
                    <Text style={styles.docRowSubtitle}>Verified college student card</Text>
                  </View>
                </View>
                <Text style={styles.previewActionPill}>👁️ Preview</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Dedicated Role Workspaces Section (Strict RBAC Display) */}
        <Text style={styles.sectionTitle}>
          {t('Dedicated Workspaces', 'ವಿಶೇಷ ಕಾರ್ಯಕ್ಷೇತ್ರಗಳು')}
        </Text>

        {/* 1. Provider Workspace (Provider only) */}
        {userRole === 'provider' && onNavigateProviderDashboard && (
          <TouchableOpacity
            style={[styles.menuItem, SHADOWS.card]}
            onPress={onNavigateProviderDashboard}
            activeOpacity={0.85}
          >
            <View style={styles.menuLeft}>
              <Text style={styles.menuEmoji}>🛠️</Text>
              <View>
                <Text style={styles.menuTitle}>
                  {t('providerDashboard', 'ಸೇವಾ ಪೂರೈಕೆದಾರರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್')}
                </Text>
                <Text style={styles.menuSub}>
                  Incoming customer requests & job management
                </Text>
              </View>
            </View>
            <Text style={styles.chevron}>→</Text>
          </TouchableOpacity>
        )}

        {/* 2. Driver Workspace (Driver only) */}
        {userRole === 'driver' && (
          <TouchableOpacity
            style={[styles.menuItem, SHADOWS.card]}
            onPress={onNavigateDriverDashboard}
            activeOpacity={0.85}
          >
            <View style={styles.menuLeft}>
              <Text style={styles.menuEmoji}>🛞</Text>
              <View>
                <Text style={styles.menuTitle}>
                  {t('driverDashboard', 'ಚಾಲಕರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್')}
                </Text>
                <Text style={styles.menuSub}>
                  Auto, Car & Goods Van Dispatch Orders
                </Text>
              </View>
            </View>
            <Text style={styles.chevron}>→</Text>
          </TouchableOpacity>
        )}

        {/* 2. Property Owner Portal (Owner only) */}
        {userRole === 'owner' && (
          <TouchableOpacity
            style={[styles.menuItem, SHADOWS.card]}
            onPress={onNavigateOwnerDashboard}
            activeOpacity={0.85}
          >
            <View style={styles.menuLeft}>
              <Text style={styles.menuEmoji}>🏡</Text>
              <View>
                <Text style={styles.menuTitle}>
                  {t('ownerDashboard', 'ಆಸ್ತಿ ಮಾಲೀಕರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್')}
                </Text>
                <Text style={styles.menuSub}>
                  Add properties, tenant visits & listings
                </Text>
              </View>
            </View>
            <Text style={styles.chevron}>→</Text>
          </TouchableOpacity>
        )}

        {/* 3. Student Rental Partner Hub (Student only) */}
        {userRole === 'student' && (
          <TouchableOpacity
            style={[styles.menuItem, SHADOWS.card]}
            onPress={onNavigateStudentDashboard}
            activeOpacity={0.85}
          >
            <View style={styles.menuLeft}>
              <Text style={styles.menuEmoji}>🎓</Text>
              <View>
                <Text style={styles.menuTitle}>
                  {t('studentDashboard', 'ವಿದ್ಯಾರ್ಥಿ ಪಾಲುದಾರ ಹಬ್')}
                </Text>
                <Text style={styles.menuSub}>
                  College rentals · 0% NUK platform fee
                </Text>
              </View>
            </View>
            <Text style={styles.chevron}>→</Text>
          </TouchableOpacity>
        )}

        {/* 4. Administrator Console (Admin only) */}
        {userRole === 'admin' && (
          <TouchableOpacity
            style={[styles.menuItem, SHADOWS.card]}
            onPress={onNavigateAdminDashboard}
            activeOpacity={0.85}
          >
            <View style={styles.menuLeft}>
              <Text style={styles.menuEmoji}>🛡️</Text>
              <View>
                <Text style={styles.menuTitle}>
                  {t('adminDashboard', 'ನಿರ್ವಾಹಕರ ಕಂಟ್ರೋಲ್ ಪ್ಯಾನೆಲ್')}
                </Text>
                <Text style={styles.menuSub}>
                  12-Section Verification & Governance Desk
                </Text>
              </View>
            </View>
            <Text style={styles.chevron}>→</Text>
          </TouchableOpacity>
        )}

        {/* Customer Quick Links */}
        {userRole === 'customer' && (
          <View style={[styles.menuItem, SHADOWS.card]}>
            <View style={styles.menuLeft}>
              <Text style={styles.menuEmoji}>👤</Text>
              <View>
                <Text style={styles.menuTitle}>Customer Profile</Text>
                <Text style={styles.menuSub}>
                  Full access to book rides, rentals & local services
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Preferences & Support */}
        <Text style={styles.sectionTitle}>
          {t('Preferences & Support', 'ಆದ್ಯತೆಗಳು ಮತ್ತು ಬೆಂಬಲ')}
        </Text>

        {/* Language Toggle Row */}
        <View style={[styles.menuItem, SHADOWS.card]}>
          <View style={styles.menuLeft}>
            <Text style={styles.menuEmoji}>🌐</Text>
            <View>
              <Text style={styles.menuTitle}>{t('Language', 'ಭಾಷೆ')}</Text>
              <Text style={styles.menuSub}>
                {language === 'kn' ? 'ಕನ್ನಡ (Kannada)' : 'English'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.langPill}
            onPress={() => setLanguage(language === 'en' ? 'kn' : 'en')}
          >
            <Text style={styles.langPillText}>
              {language === 'en' ? 'ಕನ್ನಡಕ್ಕೆ ಬದಲಿಸಿ' : 'Switch to English'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Saved Listings */}
        <TouchableOpacity
          style={[styles.menuItem, SHADOWS.card]}
          onPress={onNavigateSaved}
        >
          <View style={styles.menuLeft}>
            <Text style={styles.menuEmoji}>❤️</Text>
            <Text style={styles.menuTitle}>
              {t('Saved Properties', 'ಉಳಿಸಿದ ಆಸ್ತಿಗಳು')}
            </Text>
          </View>
          <Text style={styles.chevron}>→</Text>
        </TouchableOpacity>

        {/* Support Tickets */}
        <TouchableOpacity
          style={[styles.menuItem, SHADOWS.card]}
          onPress={onNavigateSupport}
        >
          <View style={styles.menuLeft}>
            <Text style={styles.menuEmoji}>🎧</Text>
            <View>
              <Text style={styles.menuTitle}>
                {t('Help & Support', 'ಸಹಾಯ ಮತ್ತು ಬೆಂಬಲ')}
              </Text>
              <Text style={styles.menuSub}>
                Bagalkot desk · +91 98450 12345
              </Text>
            </View>
          </View>
          <Text style={styles.chevron}>→</Text>
        </TouchableOpacity>

        {/* Terms & Conditions */}
        <TouchableOpacity
          style={[styles.menuItem, SHADOWS.card]}
          onPress={() => onNavigateTerms(role)}
        >
          <View style={styles.menuLeft}>
            <Text style={styles.menuEmoji}>📋</Text>
            <Text style={styles.menuTitle}>
              {t('Terms & Legal', 'ನಿಯಮಗಳು ಮತ್ತು ಕಾನೂನು')}
            </Text>
          </View>
          <Text style={styles.chevron}>→</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <Button
          title={t('Logout', 'ಲಾಗ್‌ಔಟ್')}
          onPress={handleLogout}
          variant="outline"
          size="md"
          fullWidth
          style={styles.logoutBtn}
        />
      </ScrollView>

      {/* In-Screen Document Preview Modal */}
      <DocumentViewerModal
        visible={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        documents={previewDocs}
        currentIndex={previewIndex}
        onSelectIndex={setPreviewIndex}
        canReview={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.paper },
  docPreviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    marginBottom: 16,
  },
  docPreviewCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 4,
  },
  docPreviewCardSub: {
    fontSize: 12,
    color: COLORS.mute,
    lineHeight: 16,
    marginBottom: 12,
  },
  docPreviewList: {
    gap: 8,
  },
  docRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.paper,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 10,
  },
  docRowItemPdf: {
    borderColor: '#BFDBFE',
    backgroundColor: '#F0F7FF',
  },
  docRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  docRowIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  docRowTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ink,
  },
  docRowSubtitle: {
    fontSize: 11,
    color: COLORS.mute,
    marginTop: 1,
  },
  previewActionPill: {
    backgroundColor: COLORS.brand,
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
  },
  scroll: { padding: 20, paddingBottom: 110 },
  userCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    marginBottom: 16,
  },
  userTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: { fontSize: 22, fontWeight: '900', color: COLORS.white },
  userCol: { flex: 1 },
  name: { fontSize: 18, fontWeight: '900', color: COLORS.ink },
  phone: { fontSize: 13, color: COLORS.mute, marginTop: 2 },
  city: { fontSize: 12, color: COLORS.mute, marginTop: 2 },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: COLORS.line,
  },
  roleLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roleLabel: { fontSize: 13, fontWeight: '700', color: COLORS.ink },
  rejectionNotice: {
    backgroundColor: COLORS.badTint,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.bad,
    marginBottom: 16,
  },
  rejectionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.bad },
  rejectionText: { fontSize: 12, color: COLORS.ink, marginTop: 4, lineHeight: 18 },
  pendingNotice: {
    backgroundColor: COLORS.sunTint,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.sun,
    marginBottom: 16,
  },
  pendingTitle: { fontSize: 13, fontWeight: '800', color: COLORS.ink },
  pendingText: { fontSize: 12, color: COLORS.mute, marginTop: 4, lineHeight: 18 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.mute,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    marginBottom: 10,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  menuEmoji: { fontSize: 24, marginRight: 14 },
  menuTitle: { fontSize: 15, fontWeight: '800', color: COLORS.ink },
  menuSub: { fontSize: 12, color: COLORS.mute, marginTop: 2 },
  chevron: { fontSize: 18, fontWeight: '700', color: COLORS.mute },
  langPill: {
    backgroundColor: COLORS.sunTint,
    borderWidth: 1,
    borderColor: COLORS.sun,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
  },
  langPillText: { fontSize: 11, fontWeight: '800', color: COLORS.ink },
  logoutBtn: { marginTop: 14, borderColor: COLORS.bad, backgroundColor: COLORS.badTint },
});
