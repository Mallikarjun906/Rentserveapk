// User Profile & Role-Based Workspace Access Screen

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  User,
  Phone,
  MapPin,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Wrench,
  Car,
  Home,
  GraduationCap,
  Heart,
  HelpCircle,
  FileText,
  Globe,
  LogOut,
  ChevronRight,
  Eye,
  Camera,
  Image as ImageIcon,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import { authApi } from '../../api/authApi';
import { DocumentViewerModal, DocumentItem } from '../../components/common/DocumentViewerModal';
import { appendFileToFormData } from '../../utils/fileUpload';
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
  const { user, role, logout, updateUser } = useAuth();
  const { language, setLanguage, t } = useLocalization();

  const [myApp, setMyApp] = useState<any | null>(null);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [previewDocs, setPreviewDocs] = useState<DocumentItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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

  const handlePickPhoto = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            t('Camera Permission Required', 'ಕ್ಯಾಮರಾ ಅನುಮತಿ ಅಗತ್ಯವಿದೆ'),
            t('Camera access is required to take a profile photo.', 'ಪ್ರೊಫೈಲ್ ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಲು ಕ್ಯಾಮರಾ ಅನುಮತಿ ಅಗತ್ಯ.')
          );
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            t('Gallery Permission Required', 'ಗ್ಯಾಲರಿ ಅನುಮತಿ ಅಗತ್ಯವಿದೆ'),
            t('Photo library access is required to select a profile photo.', 'ಪ್ರೊಫೈಲ್ ಫೋಟೋ ಆಯ್ಕೆ ಮಾಡಲು ಗ್ಯಾಲರಿ ಅನುಮತಿ ಅಗತ್ಯ.')
          );
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setUploadingPhoto(true);
        const formData = new FormData();
        await appendFileToFormData(formData, 'profileImage', {
          uri: asset.uri,
          name: asset.fileName || `profile-${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
          size: asset.fileSize,
          file: (asset as any).file,
        });

        const res = await authApi.uploadProfilePhoto(formData);
        if (res?.user) {
          await updateUser(res.user);
        } else if (res?.profileImage) {
          await updateUser({ profileImage: res.profileImage });
        }
        Alert.alert(
          t('Success', 'ಯಶಸ್ಸು'),
          t('Profile photo updated successfully!', 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಫೋಟೋ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!')
        );
      }
    } catch (err: any) {
      Alert.alert(
        t('Upload Failed', 'ಅಪ್‌ಲೋಡ್ ವಿಫಲವಾಗಿದೆ'),
        err.message || 'Could not update profile photo.'
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const promptPhotoChoice = () => {
    Alert.alert(
      t('Update Profile Photo', 'ಪ್ರೊಫೈಲ್ ಫೋಟೋ ನವೀಕರಿಸಿ'),
      t('Choose how you want to update your profile photo', 'ಫೋಟೋ ಆಯ್ಕೆ ವಿಧಾನವನ್ನು ಆರಿಸಿ'),
      [
        { text: t('Take Photo (Camera)', 'ಕ್ಯಾಮರಾ ಬಳಸಿ'), onPress: () => handlePickPhoto(true) },
        { text: t('Choose from Gallery', 'ಗ್ಯಾಲರಿಯಿಂದ ಆರಿಸಿ'), onPress: () => handlePickPhoto(false) },
        { text: t('Cancel', 'ರದ್ದುಮಾಡಿ'), style: 'cancel' },
      ]
    );
  };

  const userName = user?.name || 'NUK Member';
  const userPhone = user?.phone || 'Not provided';
  const userLocation = user?.location || 'Bagalkot';
  const userRole = user?.role || 'customer';
  const approvalStatus = user?.approvalStatus || 'approved';
  const rejectionReason = user?.rejectionReason || '';
  const avatarUrl =
    user?.profileImage?.url ||
    (myApp?.profileImage ? (typeof myApp.profileImage === 'string' ? myApp.profileImage : myApp.profileImage.url) : '');

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  return (
    <View style={styles.container}>
      <Header
        title={t('tabProfile', 'ಪ್ರೊಫೈಲ್')}
        subtitle="Account, Verified Role & Settings"
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* User Card */}
        <View style={[styles.userCard, SHADOWS.card]}>
          <View style={styles.userTop}>
            <TouchableOpacity
              style={styles.avatarWrap}
              onPress={promptPhotoChoice}
              activeOpacity={0.8}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.cameraPill}>
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Camera size={12} color={COLORS.white} />
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.userCol}>
              <Text style={styles.name}>{userName}</Text>
              <Text style={styles.phone}>{userPhone}</Text>
              <View style={styles.cityRow}>
                <MapPin size={12} color={COLORS.mute} />
                <Text style={styles.city}>{userLocation}, Karnataka</Text>
              </View>
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
            <View style={styles.noticeHeader}>
              <AlertTriangle size={16} color={COLORS.bad} />
              <Text style={styles.rejectionTitle}>Application Action Required</Text>
            </View>
            <Text style={styles.rejectionText}>
              Your documents were rejected: {rejectionReason || 'Please review guidelines and resubmit valid credentials.'}
            </Text>
            <Button
              title="Resubmit in Driver/Provider Workspace"
              onPress={userRole === 'driver' ? onNavigateDriverOnboarding : () => {}}
              variant="primary"
              size="sm"
              style={{ marginTop: 10 }}
            />
          </View>
        )}

        {/* Pending Approval Notice */}
        {approvalStatus === 'pending' && userRole !== 'customer' && (
          <View style={[styles.pendingNotice, SHADOWS.card]}>
            <View style={styles.noticeHeader}>
              <Clock size={16} color="#D97706" />
              <Text style={styles.pendingTitle}>Verification Under Review</Text>
            </View>
            <Text style={styles.pendingText}>
              Your registration documents are currently being reviewed by an administrator. Services and trip dispatch will be activated upon approval.
            </Text>
          </View>
        )}

        {/* My Verification Documents (In-Screen Preview) */}
        <View style={[styles.docPreviewCard, SHADOWS.card]}>
          <View style={styles.docCardHeader}>
            <ShieldCheck size={18} color={COLORS.brand} />
            <Text style={styles.docPreviewCardTitle}>
              {t('My Verification Documents', 'ನನ್ನ ಪರಿಶೀಲನಾ ದಾಖಲೆಗಳು')}
            </Text>
          </View>
          <Text style={styles.docPreviewCardSub}>
            Documents are stored in encrypted private storage. Tap below to preview:
          </Text>

          <View style={styles.docPreviewList}>
            <TouchableOpacity
              style={styles.docRowItem}
              onPress={() => openMyDocument('aadhaarDocument', 'My Aadhaar ID (Masked)', false)}
              activeOpacity={0.7}
            >
              <View style={styles.docRowLeft}>
                <ImageIcon size={18} color="#2563EB" />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.docRowTitle}>Aadhaar / Govt ID</Text>
                  <Text style={styles.docRowSubtitle}>Masked identity verification copy</Text>
                </View>
              </View>
              <View style={styles.previewActionPill}>
                <Eye size={12} color={COLORS.brand} />
                <Text style={styles.previewActionText}>Preview</Text>
              </View>
            </TouchableOpacity>

            {(userRole === 'driver' || myApp?.hasDrivingLicence) && (
              <TouchableOpacity
                style={[styles.docRowItem, styles.docRowItemPdf]}
                onPress={() =>
                  openMyDocument('drivingLicenceDocument', 'My Driving Licence (DL)', false)
                }
                activeOpacity={0.7}
              >
                <View style={styles.docRowLeft}>
                  <FileText size={18} color={COLORS.brand} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.docRowTitle}>Driving Licence (DL)</Text>
                    <Text style={styles.docRowSubtitle}>Commercial transport licence</Text>
                  </View>
                </View>
                <View style={styles.previewActionPill}>
                  <Eye size={12} color={COLORS.brand} />
                  <Text style={styles.previewActionText}>Preview</Text>
                </View>
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
                  <ImageIcon size={18} color="#059669" />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.docRowTitle}>Vehicle RC Document</Text>
                    <Text style={styles.docRowSubtitle}>Karnataka Transport Department RC</Text>
                  </View>
                </View>
                <View style={styles.previewActionPill}>
                  <Eye size={12} color={COLORS.brand} />
                  <Text style={styles.previewActionText}>Preview</Text>
                </View>
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
                  <GraduationCap size={18} color={COLORS.brand} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.docRowTitle}>Student ID Card</Text>
                    <Text style={styles.docRowSubtitle}>Verified college student card</Text>
                  </View>
                </View>
                <View style={styles.previewActionPill}>
                  <Eye size={12} color={COLORS.brand} />
                  <Text style={styles.previewActionText}>Preview</Text>
                </View>
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
              <View style={[styles.menuIconCircle, { backgroundColor: '#E0E7FF' }]}>
                <Wrench size={20} color="#4F46E5" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>
                  {t('providerDashboard', 'ಸೇವಾ ಪೂರೈಕೆದಾರರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್')}
                </Text>
                <Text style={styles.menuSub}>
                  Incoming customer requests & job management
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.mute} />
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
              <View style={[styles.menuIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Car size={20} color={COLORS.brand} />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>
                  {t('driverDashboard', 'ಚಾಲಕರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್')}
                </Text>
                <Text style={styles.menuSub}>
                  Auto, Car & Goods Van Dispatch Orders
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.mute} />
          </TouchableOpacity>
        )}

        {/* 3. Property Owner Portal (Owner only) */}
        {userRole === 'owner' && (
          <TouchableOpacity
            style={[styles.menuItem, SHADOWS.card]}
            onPress={onNavigateOwnerDashboard}
            activeOpacity={0.85}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Home size={20} color="#D97706" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>
                  {t('ownerDashboard', 'ಆಸ್ತಿ ಮಾಲೀಕರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್')}
                </Text>
                <Text style={styles.menuSub}>
                  Add properties, tenant visits & listings
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.mute} />
          </TouchableOpacity>
        )}

        {/* 4. Student Rental Partner Hub (Student only) */}
        {userRole === 'student' && (
          <TouchableOpacity
            style={[styles.menuItem, SHADOWS.card]}
            onPress={onNavigateStudentDashboard}
            activeOpacity={0.85}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <GraduationCap size={20} color={COLORS.brand} />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>
                  {t('studentDashboard', 'ವಿದ್ಯಾರ್ಥಿ ಪಾಲುದಾರ ಹಬ್')}
                </Text>
                <Text style={styles.menuSub}>
                  College rentals · 0% NUK platform fee
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.mute} />
          </TouchableOpacity>
        )}

        {/* 5. Administrator Console (Admin only) */}
        {userRole === 'admin' && (
          <TouchableOpacity
            style={[styles.menuItem, SHADOWS.card]}
            onPress={onNavigateAdminDashboard}
            activeOpacity={0.85}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: '#1E293B' }]}>
                <Shield size={20} color={COLORS.sun} />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>
                  {t('adminDashboard', 'ನಿರ್ವಾಹಕರ ಕಂಟ್ರೋಲ್ ಪ್ಯಾನೆಲ್')}
                </Text>
                <Text style={styles.menuSub}>
                  12-Section Verification & Governance Desk
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.mute} />
          </TouchableOpacity>
        )}

        {/* Customer Quick Links */}
        {userRole === 'customer' && (
          <View style={[styles.menuItem, SHADOWS.card]}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: COLORS.brandTint }]}>
                <User size={20} color={COLORS.brand} />
              </View>
              <View style={styles.menuTextCol}>
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
            <View style={[styles.menuIconCircle, { backgroundColor: '#F3F4F6' }]}>
              <Globe size={20} color={COLORS.ink} />
            </View>
            <View style={styles.menuTextCol}>
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
          activeOpacity={0.85}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.menuIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <Heart size={20} color={COLORS.brand} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>
                {t('Saved Properties', 'ಉಳಿಸಿದ ಆಸ್ತಿಗಳು')}
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={COLORS.mute} />
        </TouchableOpacity>

        {/* Support Tickets */}
        <TouchableOpacity
          style={[styles.menuItem, SHADOWS.card]}
          onPress={onNavigateSupport}
          activeOpacity={0.85}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.menuIconCircle, { backgroundColor: '#E0E7FF' }]}>
              <HelpCircle size={20} color="#4F46E5" />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>
                {t('Help & Support', 'ಸಹಾಯ ಮತ್ತು ಬೆಂಬಲ')}
              </Text>
              <Text style={styles.menuSub}>
                Bagalkot desk · +91 98450 12345
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={COLORS.mute} />
        </TouchableOpacity>

        {/* Terms & Conditions */}
        <TouchableOpacity
          style={[styles.menuItem, SHADOWS.card]}
          onPress={() => onNavigateTerms(role)}
          activeOpacity={0.85}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.menuIconCircle, { backgroundColor: '#F3F4F6' }]}>
              <FileText size={20} color={COLORS.ink} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>
                {t('Terms & Legal', 'ನಿಯಮಗಳು ಮತ್ತು ಕಾನೂನು')}
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={COLORS.mute} />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paper },
  scroll: { padding: 16, paddingBottom: 60 },
  userCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    marginBottom: 16,
  },
  userTop: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: COLORS.brand,
    backgroundColor: COLORS.paper,
  },
  cameraPill: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.brand,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '900', color: COLORS.white },
  userCol: { flex: 1 },
  name: { fontSize: 18, fontWeight: '900', color: COLORS.ink },
  phone: { fontSize: 13, color: COLORS.mute, marginTop: 2 },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  city: { fontSize: 12, color: COLORS.mute },
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
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
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
  pendingTitle: { fontSize: 13, fontWeight: '800', color: '#D97706' },
  pendingText: { fontSize: 12, color: COLORS.ink, marginTop: 4, lineHeight: 18 },
  docPreviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    marginBottom: 16,
  },
  docCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  docPreviewCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.brandTint,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
  },
  previewActionText: {
    color: COLORS.brand,
    fontSize: 11,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.mute,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 10,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  menuIconCircle: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextCol: {
    flex: 1,
  },
  menuTitle: { fontSize: 14, fontWeight: '800', color: COLORS.ink },
  menuSub: { fontSize: 11, color: COLORS.mute, marginTop: 2 },
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
