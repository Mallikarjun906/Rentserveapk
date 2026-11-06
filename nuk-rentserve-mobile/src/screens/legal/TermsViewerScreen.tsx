// Bilingual Legal Terms and Privacy Policy Viewer Screen

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Badge } from '../../components/common/Badge';
import {
  COMMON_TERMS,
  ROLE_TERMS,
  PRIVACY_POLICY,
  TERMS_VERSION,
  TERMS_DATE,
} from '../../constants/terms';
import { useLocalization } from '../../context/LocalizationContext';

interface TermsViewerScreenProps {
  initialRole?: string;
  onBack: () => void;
}

export const TermsViewerScreen: React.FC<TermsViewerScreenProps> = ({
  initialRole = 'Customer',
  onBack,
}) => {
  const { language, setLanguage, t } = useLocalization();
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

  const roleDoc = ROLE_TERMS[selectedRole] || ROLE_TERMS.Customer;
  const isKn = language === 'kn';

  return (
    <View style={styles.container}>
      <Header
        title={isKn ? 'ನಿಯಮಗಳು ಮತ್ತು ಗೌಪ್ಯತೆ' : 'Terms & Privacy Policy'}
        subtitle={`Version ${TERMS_VERSION} · ${TERMS_DATE}`}
        onBack={onBack}
        rightAction={
          <TouchableOpacity
            style={styles.langSwitchBtn}
            onPress={() => setLanguage(isKn ? 'en' : 'kn')}
          >
            <Text style={styles.langSwitchText}>
              {isKn ? 'English' : 'ಕನ್ನಡ'}
            </Text>
          </TouchableOpacity>
        }
      />

      {/* Segmented Switcher: Terms of Service vs Privacy Policy */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'terms' && styles.tabBtnActive]}
          onPress={() => setActiveTab('terms')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'terms' && styles.tabTextActive,
            ]}
          >
            {isKn ? 'ಸೇವಾ ನಿಯಮಗಳು' : 'Terms of Service'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'privacy' && styles.tabBtnActive]}
          onPress={() => setActiveTab('privacy')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'privacy' && styles.tabTextActive,
            ]}
          >
            {isKn ? 'ಗೌಪ್ಯತಾ ನೀತಿ' : 'Privacy Policy'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Role Picker if on Terms Tab */}
      {activeTab === 'terms' && (
        <View style={styles.rolesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rolesScroll}>
            {Object.keys(ROLE_TERMS).map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.rolePill,
                  selectedRole === r && styles.rolePillActive,
                ]}
                onPress={() => setSelectedRole(r)}
              >
                <Text
                  style={[
                    styles.rolePillText,
                    selectedRole === r && styles.rolePillTextActive,
                  ]}
                >
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Document Header Card */}
        <View style={[styles.card, SHADOWS.card]}>
          <Badge tone="sun" label={`VERSION ${TERMS_VERSION}`} />
          <Text style={styles.docTitle}>
            {activeTab === 'terms'
              ? isKn
                ? roleDoc.title[1]
                : roleDoc.title[0]
              : isKn
              ? 'NUK RentServe ಗೌಪ್ಯತಾ ನೀತಿ'
              : 'NUK RentServe Privacy Policy'}
          </Text>
          <Text style={styles.docDate}>Effective: {TERMS_DATE}</Text>
        </View>

        {/* Clauses List */}
        {(activeTab === 'terms'
          ? [...roleDoc.secs, ...COMMON_TERMS]
          : PRIVACY_POLICY
        ).map((sec, idx) => (
          <View key={idx} style={[styles.clauseCard, SHADOWS.card]}>
            <Text style={styles.clauseHeading}>
              {isKn ? sec.h[1] : sec.h[0]}
            </Text>
            <Text style={styles.clauseBody}>
              {isKn ? sec.b[1] : sec.b[0]}
            </Text>
          </View>
        ))}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  langSwitchBtn: {
    backgroundColor: COLORS.brandTint,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  langSwitchText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.brand,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  tabBtnActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  rolesContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  rolesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  rolePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  rolePillActive: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  rolePillTextActive: {
    color: COLORS.white,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 14,
  },
  docTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.ink,
    marginTop: 8,
    marginBottom: 4,
  },
  docDate: {
    fontSize: 12,
    color: COLORS.mute,
    fontWeight: '600',
  },
  clauseCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 10,
  },
  clauseHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 6,
  },
  clauseBody: {
    fontSize: 13,
    color: COLORS.inkLight,
    lineHeight: 19,
  },
});
