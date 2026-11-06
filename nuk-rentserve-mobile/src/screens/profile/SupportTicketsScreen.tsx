// Support, Dispute Resolution & Emergency SOS Screen

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { AlertTriangle, CheckCircle2, Phone } from 'lucide-react-native';
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
    <View style={styles.container}>
      <Header
        title={t('Help & Dispute Resolution', 'ಸಹಾಯ ಮತ್ತು ದೂರು')}
        subtitle="We respond within 2 working days"
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Emergency Alert Box */}
        <View style={styles.emergencyBanner}>
          <AlertTriangle size={20} color={COLORS.crimson} />
          <View style={styles.emergencyCol}>
            <Text style={styles.emergencyTitle}>Immediate Safety Emergency?</Text>
            <Text style={styles.emergencySub}>
              Call Karnataka State Police Emergency directly at 112.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.call112Btn}
            onPress={() => Linking.openURL('tel:112')}
            activeOpacity={0.8}
          >
            <Phone size={12} color={COLORS.white} />
            <Text style={styles.call112Text}>Call 112</Text>
          </TouchableOpacity>
        </View>

        {submitted ? (
          <View style={[styles.card, styles.successCard, SHADOWS.card]}>
            <CheckCircle2 size={40} color={COLORS.ok} />
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
    paddingBottom: 40,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  emergencyCol: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.crimson,
  },
  emergencySub: {
    fontSize: 11,
    color: COLORS.mute,
    marginTop: 2,
  },
  call112Btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.crimson,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  call112Text: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  successCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ink,
    marginTop: 10,
  },
  ticketNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.brand,
    marginTop: 4,
  },
  successMessage: {
    fontSize: 13,
    color: COLORS.mute,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  doneBtn: {
    minWidth: 120,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.mute,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  catChipActive: {
    backgroundColor: COLORS.brandTint,
    borderColor: COLORS.brand,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink,
  },
  catChipTextActive: {
    color: COLORS.brand,
    fontWeight: '800',
  },
  submitBtn: {
    marginTop: 10,
  },
});
