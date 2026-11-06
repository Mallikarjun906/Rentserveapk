// Student Rental Partner Hub with Zero-Platform-Commission Ledger

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
} from 'react-native';
import {
  GraduationCap,
  FileText,
  Eye,
  Image as ImageIcon,
  Award,
  Share2,
  CheckCircle2,
  Building2,
  Plus,
  ArrowRight,
  ShieldCheck,
  MapPin,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useLocalization } from '../../context/LocalizationContext';
import { useAuth } from '../../context/AuthContext';
import { DocumentViewerModal, DocumentItem } from '../../components/common/DocumentViewerModal';
import { CONFIG } from '../../constants/config';

interface StudentDashboardScreenProps {
  onBack: () => void;
  onAddProperty: () => void;
}

export const StudentDashboardScreen: React.FC<StudentDashboardScreenProps> = ({
  onBack,
  onAddProperty,
}) => {
  const { t } = useLocalization();
  const { user } = useAuth();

  const [copied, setCopied] = useState(false);
  const studentSlug = user?.name ? user.name.toLowerCase().replace(/\s+/g, '-') : 'student';
  const referralUrl = `https://nukrentserve.in/r/${studentSlug}`;

  // In-Screen Document Viewer State
  const [docViewerOpen, setDocViewerOpen] = useState(false);
  const [previewDocs, setPreviewDocs] = useState<DocumentItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  const openStudentDoc = (docType: string, title: string, isPdf: boolean = false) => {
    const list: DocumentItem[] = [
      {
        id: `student-${docType}`,
        docType,
        title,
        url: `${CONFIG.API_BASE_URL}/documents/mine/${docType}`,
        isPdf,
        format: isPdf ? 'pdf' : 'jpg',
      },
    ];
    setPreviewDocs(list);
    setPreviewIndex(0);
    setDocViewerOpen(true);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Find student rooms, PGs & houses in Bagalkot on NUK RentServe: ${referralUrl}`,
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const studentName = user?.name || 'Student Partner';
  const collegeName = user?.collegeName || 'BVVS Engineering College · Bagalkot';

  return (
    <View style={styles.container}>
      <Header
        title={t('studentDashboard', 'ವಿದ್ಯಾರ್ಥಿ ಪಾಲುದಾರ ಹಬ್')}
        subtitle={`${studentName} · ${collegeName}`}
        onBack={onBack}
        rightAction={
          <Button
            title="+ List"
            onPress={onAddProperty}
            variant="yellow"
            size="sm"
          />
        }
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Student Verification Header Card */}
        <View style={[styles.card, SHADOWS.card]}>
          <View style={styles.studentHeader}>
            <View style={styles.avatar}>
              <GraduationCap size={28} color={COLORS.brand} />
            </View>
            <View style={styles.studentInfo}>
              <View style={styles.titleRow}>
                <Text style={styles.studentName}>{studentName}</Text>
                <Badge tone="ok" label="Verified Partner" />
              </View>
              <Text style={styles.collegeName}>{collegeName}</Text>
            </View>
          </View>
        </View>

        {/* Student Verification Documents & Credentials Card */}
        <View style={[styles.card, SHADOWS.card]}>
          <View style={styles.cardHeaderRow}>
            <ShieldCheck size={18} color={COLORS.brand} />
            <Text style={styles.cardTitle}>
              {t('Student Verification Documents', 'ವಿದ್ಯಾರ್ಥಿ ಪರಿಶೀಲನಾ ದಾಖಲೆಗಳು')}
            </Text>
          </View>
          <Text style={styles.referralSub}>
            Private college credentials verified by administration. Tap to preview:
          </Text>

          <View style={{ gap: 8 }}>
            <TouchableOpacity
              style={styles.docRowItem}
              onPress={() =>
                openStudentDoc('studentIdCardDocument', 'College Student ID Card (Masked)', false)
              }
              activeOpacity={0.7}
            >
              <View style={styles.docRowLeft}>
                <FileText size={20} color={COLORS.brand} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.docRowTitle}>College Student ID Card</Text>
                  <Text style={styles.docRowSubtitle}>Official institutional identity card</Text>
                </View>
              </View>
              <View style={styles.previewActionPill}>
                <Eye size={12} color={COLORS.white} />
                <Text style={styles.previewActionText}>Preview</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.docRowItem}
              onPress={() =>
                openStudentDoc('aadhaarDocument', 'Identity Verification (Masked Aadhaar)', false)
              }
              activeOpacity={0.7}
            >
              <View style={styles.docRowLeft}>
                <ImageIcon size={20} color="#2563EB" />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.docRowTitle}>Govt ID / Aadhaar</Text>
                  <Text style={styles.docRowSubtitle}>Masked national identity copy</Text>
                </View>
              </View>
              <View style={styles.previewActionPill}>
                <Eye size={12} color={COLORS.white} />
                <Text style={styles.previewActionText}>Preview</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transparent Commission Policy Banner */}
        <View style={[styles.policyBanner, SHADOWS.card]}>
          <View style={styles.policyHeaderRow}>
            <Award size={18} color={COLORS.brand} />
            <Text style={styles.policyHeading}>
              {t('100% Student Commission Policy', 'ನೇರ ವಿದ್ಯಾರ್ಥಿ ಕಮಿಷನ್ ನೀತಿ')}
            </Text>
          </View>
          <Text style={styles.policyBody}>
            {t(
              'Owner and renter pay commission directly to you. NUK RentServe retains ₹0 platform fee from rental deals.',
              'ಮಾಲೀಕರು ಮತ್ತು ಬಾಡಿಗೆದಾರರು ಕಮಿಷನ್ ಹಣವನ್ನು ನೇರವಾಗಿ ನಿಮಗೆ ಪಾವತಿಸುತ್ತಾರೆ. NUK RentServe ₹0 ಕಮಿಷನ್ ಪಡೆಯುತ್ತದೆ.'
            )}
          </Text>
          <View style={styles.policyRow}>
            <View style={styles.policyCol}>
              <Text style={styles.policyLabel}>Owner Pays Student</Text>
              <Text style={styles.policyValue}>100%</Text>
            </View>
            <View style={styles.policyCol}>
              <Text style={styles.policyLabel}>Renter Pays Student</Text>
              <Text style={styles.policyValue}>100%</Text>
            </View>
            <View style={[styles.policyCol, styles.policyHighlight]}>
              <Text style={styles.policyLabel}>NUK Retains</Text>
              <Text style={styles.policyValueZero}>₹0</Text>
            </View>
          </View>
        </View>

        {/* Commission Financial Ledger */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, SHADOWS.card]}>
            <Text style={styles.statLabel}>
              {t('expectedCommission', 'ನಿರೀಕ್ಷಿತ ಕಮಿಷನ್')}
            </Text>
            <Text style={styles.statAmountExpected}>₹0</Text>
            <Text style={styles.statSub}>Awaiting tenant possession</Text>
          </View>

          <View style={[styles.statCard, SHADOWS.card]}>
            <Text style={styles.statLabel}>
              {t('receivedCommission', 'ಪಡೆದ ಕಮಿಷನ್')}
            </Text>
            <Text style={styles.statAmountReceived}>₹0</Text>
            <Text style={styles.statSub}>Directly collected</Text>
          </View>
        </View>

        {/* Referral Link Card */}
        <View style={[styles.card, SHADOWS.card]}>
          <Text style={styles.cardTitle}>
            {t('referralLink', 'ನಿಮ್ಮ ರೆಫರಲ್ ಲಿಂಕ್')}
          </Text>
          <Text style={styles.referralSub}>
            Share with students and property owners in Bagalkot:
          </Text>

          <View style={styles.referralBox}>
            <Text style={styles.referralLinkText} numberOfLines={1}>{referralUrl}</Text>
            <TouchableOpacity onPress={handleShare} style={styles.copyBtn} activeOpacity={0.8}>
              <Share2 size={13} color={COLORS.white} />
              <Text style={styles.copyBtnText}>
                {copied ? 'Shared' : 'Share'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.referralStats}>
            <View style={styles.refStat}>
              <Text style={styles.refStatNum}>0</Text>
              <Text style={styles.refStatLabel}>Clicks</Text>
            </View>
            <View style={styles.refStat}>
              <Text style={styles.refStatNum}>0</Text>
              <Text style={styles.refStatLabel}>Sign-ups</Text>
            </View>
            <View style={styles.refStat}>
              <Text style={styles.refStatNum}>0</Text>
              <Text style={styles.refStatLabel}>Enquiries</Text>
            </View>
          </View>
        </View>

        {/* Student Property Listings Section */}
        <Text style={styles.sectionHeading}>
          {t('My Partner Listings', 'ನನ್ನ ಪಾಲುದಾರ ಪಟ್ಟಿಗಳು')}
        </Text>

        <View style={[styles.card, styles.emptyListingsCard]}>
          <Building2 size={32} color={COLORS.muteLight} />
          <Text style={styles.emptyListingsTitle}>No partner listings yet</Text>
          <Text style={styles.emptyListingsSub}>
            Help property owners find student tenants and earn 100% of the brokerage directly.
          </Text>
          <Button
            title="+ Add Student Listing"
            onPress={onAddProperty}
            variant="outline"
            size="sm"
            style={{ marginTop: 12 }}
          />
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Student In-Screen Document Viewer Modal */}
      <DocumentViewerModal
        visible={docViewerOpen}
        onClose={() => setDocViewerOpen(false)}
        documents={previewDocs}
        currentIndex={previewIndex}
        onSelectIndex={setPreviewIndex}
        canReview={false}
      />
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
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 16,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  studentInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
  },
  collegeName: {
    fontSize: 12,
    color: COLORS.mute,
    fontWeight: '500',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
  referralSub: {
    fontSize: 12,
    color: COLORS.mute,
    lineHeight: 16,
    marginBottom: 12,
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
    backgroundColor: COLORS.brand,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
  },
  previewActionText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
  policyBanner: {
    backgroundColor: COLORS.brandTint,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    marginBottom: 16,
  },
  policyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  policyHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.brand,
  },
  policyBody: {
    fontSize: 12,
    color: COLORS.ink,
    lineHeight: 18,
    marginBottom: 14,
  },
  policyRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  policyCol: {
    flex: 1,
    alignItems: 'center',
  },
  policyHighlight: {
    borderLeftWidth: 1,
    borderLeftColor: COLORS.line,
  },
  policyLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.mute,
    textTransform: 'uppercase',
  },
  policyValue: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.ok,
    marginTop: 2,
  },
  policyValueZero: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.brand,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.mute,
  },
  statAmountExpected: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.sun,
    marginVertical: 4,
  },
  statAmountReceived: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.ok,
    marginVertical: 4,
  },
  statSub: {
    fontSize: 10,
    color: COLORS.mute,
  },
  referralBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.md,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 14,
  },
  referralLinkText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.brand,
    fontWeight: '600',
    paddingHorizontal: 6,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.brand,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.white,
  },
  referralStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingTop: 12,
  },
  refStat: {
    alignItems: 'center',
  },
  refStatNum: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
  },
  refStatLabel: {
    fontSize: 11,
    color: COLORS.mute,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 12,
  },
  emptyListingsCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  emptyListingsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
    marginTop: 10,
  },
  emptyListingsSub: {
    fontSize: 12,
    color: COLORS.mute,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
