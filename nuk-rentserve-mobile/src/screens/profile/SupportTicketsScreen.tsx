// Support, Dispute Resolution & Emergency SOS Screen

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { AlertTriangle, CheckCircle2, Phone, Clock, MessageSquare } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useLocalization } from '../../context/LocalizationContext';
import { apiClient } from '../../api/client';

interface SupportTicketsScreenProps {
  onBack: () => void;
}

export const SupportTicketsScreen: React.FC<SupportTicketsScreenProps> = ({
  onBack,
}) => {
  const { t } = useLocalization();

  const [categoryLabel, setCategoryLabel] = useState('A ride or driver issue');
  const [bookingRef, setBookingRef] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const categoryMap: Record<string, 'booking' | 'payment' | 'account' | 'technical' | 'application' | 'other'> = {
    'A ride or driver issue': 'booking',
    'A rental listing': 'booking',
    'A service provider': 'booking',
    'Payment query': 'payment',
    'Account & data': 'account',
    'Technical problem': 'technical',
  };

  const categories = Object.keys(categoryMap);

  const loadMyTickets = async () => {
    setLoadingTickets(true);
    try {
      const res: any = await apiClient.get('/support/my');
      const items = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
      setMyTickets(items);
    } catch {
      // Handled silently
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    loadMyTickets();
  }, []);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert(t('Required', 'ಅಗತ್ಯವಿದೆ'), t('Please describe your query or problem.', 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ವಿವರಿಸಿ.'));
      return;
    }

    setSubmitting(true);
    const backendCategory = categoryMap[categoryLabel] || 'other';
    const fullMessage = bookingRef.trim()
      ? `[Ref: ${bookingRef.trim()}] ${description.trim()}`
      : description.trim();

    try {
      const res: any = await apiClient.post('/support', {
        category: backendCategory,
        subject: categoryLabel,
        message: fullMessage,
      });

      const ticket = res.data || res;
      setTicketId(ticket._id || ticket.id || 'SUBMITTED');
      setSubmitted(true);
      loadMyTickets();
    } catch (err: any) {
      Alert.alert(
        t('Submission Failed', 'ಸಲ್ಲಿಕೆ ವಿಫಲವಾಗಿದೆ'),
        err.message || t('Could not submit support ticket. Please check your internet connection.', 'ದಯವಿಟ್ಟು ಮರುಪ್ರಯತ್ನಿಸಿ.')
      );
    } finally {
      setSubmitting(false);
    }
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
              Our support team has received your details and logged it in our system. We will investigate within 2 business days and contact you if needed.
            </Text>
            <Button
              title="Create Another Ticket"
              onPress={() => {
                setSubmitted(false);
                setDescription('');
                setBookingRef('');
              }}
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
                    categoryLabel === c && styles.catChipActive,
                  ]}
                  onPress={() => setCategoryLabel(c)}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      categoryLabel === c && styles.catChipTextActive,
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
              title={submitting ? 'Submitting...' : 'Submit Report'}
              onPress={handleSubmit}
              variant="primary"
              size="lg"
              fullWidth
              disabled={submitting}
              style={styles.submitBtn}
            />
          </View>
        )}

        {/* Existing User Support Tickets */}
        {myTickets.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Your Previous Support Tickets</Text>
            {myTickets.map((t) => (
              <View key={t._id || t.id} style={[styles.ticketItem, SHADOWS.card]}>
                <View style={styles.ticketHeader}>
                  <Text style={styles.ticketSubject}>{t.subject || t.category}</Text>
                  <Text
                    style={[
                      styles.statusPill,
                      t.status === 'resolved' ? styles.statusResolved : styles.statusOpen,
                    ]}
                  >
                    {t.status?.toUpperCase() || 'OPEN'}
                  </Text>
                </View>
                <Text style={styles.ticketMsg} numberOfLines={2}>
                  {t.message}
                </Text>
                {t.adminNote ? (
                  <Text style={styles.adminNote}>Support Reply: {t.adminNote}</Text>
                ) : null}
              </View>
            ))}
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
  historySection: {
    marginTop: 24,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 12,
  },
  ticketItem: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ticketSubject: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
    flex: 1,
  },
  statusPill: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusOpen: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
  },
  statusResolved: {
    backgroundColor: '#D1FAE5',
    color: '#059669',
  },
  ticketMsg: {
    fontSize: 12,
    color: COLORS.mute,
    lineHeight: 16,
  },
  adminNote: {
    fontSize: 11,
    color: COLORS.brand,
    marginTop: 6,
    fontStyle: 'italic',
  },
});
