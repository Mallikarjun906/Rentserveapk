// Student Rental Partner Hub with Zero-Platform-Commission Ledger

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Share,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useLocalization } from '../../context/LocalizationContext';
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

  const [copied, setCopied] = useState(false);
  const referralUrl = 'https://nukrentserve.in/r/ananya-p';

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

  return (
    <SafeAreaView style={styles.safe}>
      <Header
        title={t('studentDashboard', 'ವಿದ್ಯಾರ್ಥಿ ಪಾಲುದಾರ ಹಬ್')}
        subtitle="Ananya Patil · BVVS Engineering College"
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
              <Text style={styles.avatarText}>🎓</Text>
            </View>
            <View style={styles.studentInfo}>
              <View style={styles.titleRow}>
                <Text style={styles.studentName}>Ananya Patil</Text>
                <Badge tone="ok" label="Verified Student" />
              </View>
              <Text style={styles.collegeName}>
                BVVS Engineering College · Bagalkot
              </Text>
            </View>
          </View>
        </View>

        {/* Student Verification Documents & Credentials Card */}
        <View style={[styles.card, SHADOWS.card]}>
          <Text style={styles.cardTitle}>
            📑 {t('Student Verification Documents', 'ವಿದ್ಯಾರ್ಥಿ ಪರಿಶೀಲನಾ ದಾಖಲೆಗಳು')}
          </Text>
          <Text style={styles.referralSub}>
            Private college credentials verified by administration. Tap to preview in screen:
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
                <Text style={styles.docRowIcon}>🎓</Text>
                <View>
                  <Text style={styles.docRowTitle}>College Student ID Card</Text>
                  <Text style={styles.docRowSubtitle}>BVVS College ID Card - 2BA21CS045</Text>
                </View>
              </View>
              <Text style={styles.previewActionPill}>👁️ Preview</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.docRowItem}
              onPress={() =>
                openStudentDoc('aadhaarDocument', 'Identity Verification (Masked Aadhaar)', false)
              }
              activeOpacity={0.7}
            >
              <View style={styles.docRowLeft}>
                <Text style={styles.docRowIcon}>🖼️</Text>
                <View>
                  <Text style={styles.docRowTitle}>Govt ID / Aadhaar</Text>
                  <Text style={styles.docRowSubtitle}>Masked national identity copy</Text>
                </View>
              </View>
              <Text style={styles.previewActionPill}>👁️ Preview</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transparent Commission Policy Banner */}
        <View style={[styles.policyBanner, SHADOWS.card]}>
          <Text style={styles.policyHeading}>
            🤝 {t('100% Student Commission Policy', 'ನೇರ ವಿದ್ಯಾರ್ಥಿ ಕಮಿಷನ್ ನೀತಿ')}
          </Text>
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
            <Text style={styles.statAmountExpected}>₹14,500</Text>
            <Text style={styles.statSub}>Awaiting tenant possession</Text>
          </View>

          <View style={[styles.statCard, SHADOWS.card]}>
            <Text style={styles.statLabel}>
              {t('receivedCommission', 'ಪಡೆದ ಕಮಿಷನ್')}
            </Text>
            <Text style={styles.statAmountReceived}>₹21,000</Text>
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
            <Text style={styles.referralLinkText}>{referralUrl}</Text>
            <TouchableOpacity onPress={handleShare} style={styles.copyBtn}>
              <Text style={styles.copyBtnText}>
                {copied ? '✓ Shared' : 'Share 🔗'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.referralStats}>
            <View style={styles.refStat}>
              <Text style={styles.refStatNum}>184</Text>
              <Text style={styles.refStatLabel}>Clicks</Text>
            </View>
            <View style={styles.refStat}>
              <Text style={styles.refStatNum}>23</Text>
              <Text style={styles.refStatLabel}>Sign-ups</Text>
            </View>
            <View style={styles.refStat}>
              <Text style={styles.refStatNum}>11</Text>
              <Text style={styles.refStatLabel}>Enquiries</Text>
            </View>
          </View>
        </View>

        {/* Student Property Listings */}
        <Text style={styles.sectionHeading}>
          {t('My Partner Listings', 'ನನ್ನ ಪಾಲುದಾರ ಪಟ್ಟಿಗಳು')} (3)
        </Text>

        {[
          {
            title: 'Single room for students near BVVS',
            loc: 'Vidyagiri, Bagalkot',
            rent: 3200,
            status: 'Agreement signed',
            commission: '₹3,200',
          },
          {
            title: '1 BHK with parking, Vidyanagar',
            loc: 'Vidyanagar, Dharwad',
            rent: 7200,
            status: 'Visit scheduled',
            commission: '₹3,600',
          },
        ].map((item, i) => (
          <View key={i} style={[styles.listingItem, SHADOWS.card]}>
            <View style={styles.itemTop}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Badge tone="info" label={item.status} />
            </View>
            <Text style={styles.itemLoc}>📍 {item.loc}</Text>
            <View style={styles.itemBottom}>
              <Text style={styles.itemRent}>Rent: ₹{item.rent}/mo</Text>
              <Text style={styles.itemComm}>
                Expected Comm: <Text style={styles.commVal}>{item.commission}</Text>
              </Text>
            </View>
          </View>
        ))}

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.paper,
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
  avatarText: {
    fontSize: 24,
  },
  studentInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
  },
  collegeName: {
    fontSize: 12,
    color: COLORS.mute,
    marginTop: 2,
  },
  policyBanner: {
    backgroundColor: COLORS.paper,
    borderWidth: 1.5,
    borderColor: COLORS.sun,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 16,
  },
  policyHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 6,
  },
  policyBody: {
    fontSize: 12,
    color: COLORS.ink,
    lineHeight: 17,
    marginBottom: 14,
  },
  policyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  policyCol: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 10,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  policyHighlight: {
    borderColor: COLORS.ok,
    backgroundColor: COLORS.okTint,
  },
  policyLabel: {
    fontSize: 10,
    color: COLORS.mute,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  policyValue: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.ink,
  },
  policyValueZero: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.ok,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
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
    fontSize: 20,
    fontWeight: '900',
    color: '#D97706',
    marginVertical: 4,
  },
  statAmountReceived: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.ok,
    marginVertical: 4,
  },
  statSub: {
    fontSize: 10,
    color: COLORS.mute,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 4,
  },
  referralSub: {
    fontSize: 12,
    color: COLORS.mute,
    marginBottom: 12,
  },
  referralBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 14,
  },
  referralLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brand,
    flex: 1,
  },
  copyBtn: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  referralStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingTop: 10,
  },
  refStat: {
    flex: 1,
    alignItems: 'center',
  },
  refStatNum: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.ink,
  },
  refStatLabel: {
    fontSize: 11,
    color: COLORS.mute,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 12,
  },
  listingItem: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 10,
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
    flex: 1,
    marginRight: 8,
  },
  itemLoc: {
    fontSize: 12,
    color: COLORS.mute,
    marginBottom: 8,
  },
  itemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingTop: 8,
  },
  itemRent: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  itemComm: {
    fontSize: 12,
    color: COLORS.mute,
  },
  commVal: {
    fontWeight: '800',
    color: COLORS.ok,
  },
});
