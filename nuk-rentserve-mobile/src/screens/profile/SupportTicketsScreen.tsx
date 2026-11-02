// Support, Dispute Resolution & Emergency SOS Screen

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Linking,
  Alert,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useLocalization } from '../../context/LocalizationContext';

interface SupportTicketsScreenProps {
  onBack: () => void;
}

export const SupportTicketsScreen: React.FC<SupportTicketsScreenProps> = ({
  onBack,
}) => {
  const { t } = useLocalization();

  const [category, setCategory] = useState('A ride or driver issue');
  const [bookingRef, setBookingRef] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');

  const categories = [
    'A ride or driver issue',
    'A rental listing',
    'A service provider',
    'Payment query',
    'Account & data',
  ];

  const handleSubmit = () => {
    if (!description.trim()) {
      Alert.alert('Required', 'Please describe your query or problem.');
      return;
    }
    const id = 'RS-' + Math.floor(1000 + Math.random() * 9000);
    setTicketId(id);
    setSubmitted(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header
        title={t('Help & Dispute Resolution', 'ಸಹಾಯ ಮತ್ತು ದೂರು')}
        subtitle="We respond within 2 working days"
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Emergency Alert Box */}
        <View style={styles.emergencyBanner}>
          <Text style={styles.emergencyIcon}>🚨</Text>
          <View style={styles.emergencyCol}>
            <Text style={styles.emergencyTitle}>Immediate Safety Emergency?</Text>
            <Text style={styles.emergencySub}>
              Call Karnataka State Police Emergency directly at 112.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.call112Btn}
            onPress={() => Linking.openURL('tel:112')}
          >
            <Text style={styles.call112Text}>Call 112</Text>
          </TouchableOpacity>
        </View>

        {submitted ? (
          <View style={[styles.card, styles.successCard, SHADOWS.card]}>
            <Text style={styles.successEmoji}>✓</Text>
            <Text style={styles.successTitle}>Support Ticket Created</Text>
            <Text style={styles.ticketNumber}>Ticket #{ticketId}</Text>
            <Text style={styles.successMessage}>
              Our support team has received your details and will investigate within 2 business days. We may contact you via phone or email.
            </Text>
            <Button
              title="Done"
              onPress={onBack}
              variant="outline"
              size="md"
              style={styles.doneBtn}
            />
          </View>
        ) : (
          <View style={[styles.card, SHADOWS.card]}>
            <Text style={styles.fieldLabel}>What do you need help with?</Text>
            <View style={styles.categoryRow}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.catChip,
                    category === c && styles.catChipActive,
                  ]}
                  onPress={() => setCategory(c)}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      category === c && styles.catChipTextActive,
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Booking Reference (optional)"
              placeholder="e.g. CT-1182 or AUTO-9214"
              value={bookingRef}
              onChangeText={setBookingRef}
            />

            <Input
              label="Describe the issue in detail"
              placeholder="Please provide specifics of what happened..."
              textarea
              value={description}
              onChangeText={setDescription}
            />

            <Button
              title="Submit Report"
              onPress={handleSubmit}
              variant="primary"
              size="lg"
              fullWidth
              style={styles.submitBtn}
            />
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  scroll: {
    padding: 16,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.badTint,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    marginBottom: 16,
  },
  emergencyIcon: {
    fontSize: 26,
    marginRight: 10,
  },
  emergencyCol: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.badDeep,
  },
  emergencySub: {
    fontSize: 12,
    color: COLORS.bad,
    marginTop: 2,
  },
  call112Btn: {
    backgroundColor: COLORS.bad,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    marginLeft: 8,
  },
  call112Text: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.white,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  catChip: {
    backgroundColor: COLORS.paper,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  catChipActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink,
  },
  catChipTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: 8,
  },
  successCard: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  successEmoji: {
    fontSize: 44,
    color: COLORS.ok,
    marginBottom: 10,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ink,
  },
  ticketNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.brand,
    marginTop: 4,
    marginBottom: 10,
  },
  successMessage: {
    fontSize: 13,
    color: COLORS.mute,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  doneBtn: {
    minWidth: 140,
  },
});
