// Property Owner Portal & Listing Management Dashboard

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { formatINR } from '../../utils/formatters';
import { useLocalization } from '../../context/LocalizationContext';

interface OwnerProperty {
  id: string;
  title: string;
  type: string;
  rent: number;
  deposit: number;
  location: string;
  status: 'published' | 'rented' | 'draft';
  visits: number;
}

interface OwnerDashboardScreenProps {
  onBack: () => void;
}

export const OwnerDashboardScreen: React.FC<OwnerDashboardScreenProps> = ({
  onBack,
}) => {
  const { t } = useLocalization();

  const [properties, setProperties] = useState<OwnerProperty[]>([
    {
      id: 'p1',
      title: '2 BHK near Navanagar Main Road',
      type: 'House',
      rent: 9500,
      deposit: 30000,
      location: 'Navanagar, Bagalkot',
      status: 'published',
      visits: 4,
    },
    {
      id: 'p4',
      title: 'Ground-floor shop on Station Road',
      type: 'Shop',
      rent: 14000,
      deposit: 70000,
      location: 'Station Road, Hubballi',
      status: 'rented',
      visits: 12,
    },
  ]);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('House');
  const [newRent, setNewRent] = useState('');
  const [newDeposit, setNewDeposit] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const handleAddProperty = () => {
    if (!newTitle.trim() || !newRent) return;
    const item: OwnerProperty = {
      id: 'prop-' + Date.now(),
      title: newTitle.trim(),
      type: newType,
      rent: parseInt(newRent, 10) || 5000,
      deposit: parseInt(newDeposit, 10) || 15000,
      location: newAddress || 'Bagalkot',
      status: 'published',
      visits: 0,
    };
    setProperties([item, ...properties]);
    setAddModalOpen(false);
    setNewTitle('');
    setNewRent('');
    setNewDeposit('');
    setNewAddress('');
  };

  const toggleStatus = (id: string) => {
    setProperties((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: p.status === 'published' ? 'rented' : 'published',
            }
          : p
      )
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header
        title={t('ownerDashboard', 'ಆಸ್ತಿ ಮಾಲೀಕರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್')}
        subtitle="Manage your houses, rooms & tenant visits"
        onBack={onBack}
        rightAction={
          <Button
            title="+ Add"
            onPress={() => setAddModalOpen(true)}
            variant="yellow"
            size="sm"
          />
        }
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, SHADOWS.card]}>
            <Text style={styles.statLabel}>Total Listings</Text>
            <Text style={styles.statValue}>{properties.length}</Text>
          </View>
          <View style={[styles.statBox, SHADOWS.card]}>
            <Text style={styles.statLabel}>Tenant Visits</Text>
            <Text style={styles.statValue}>16</Text>
          </View>
          <View style={[styles.statBox, SHADOWS.card]}>
            <Text style={styles.statLabel}>Active Rented</Text>
            <Text style={styles.statValue}>1</Text>
          </View>
        </View>

        {/* Listings List */}
        <Text style={styles.sectionTitle}>{t('My Listed Properties', 'ನನ್ನ ಪಟ್ಟಿಗಳು')}</Text>

        {properties.map((p) => (
          <View key={p.id} style={[styles.propertyCard, SHADOWS.card]}>
            <View style={styles.propTop}>
              <Badge tone="sun" label={p.type} />
              <TouchableOpacity onPress={() => toggleStatus(p.id)}>
                <Badge
                  tone={p.status === 'published' ? 'ok' : 'mute'}
                  label={p.status === 'published' ? '● Available' : 'Rented'}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.propTitle}>{p.title}</Text>
            <Text style={styles.propLoc}>📍 {p.location}</Text>

            <View style={styles.propFooter}>
              <View>
                <Text style={styles.rentText}>
                  {formatINR(p.rent)} <Text style={styles.periodText}>/ mo</Text>
                </Text>
                <Text style={styles.depositText}>
                  Deposit: {formatINR(p.deposit)}
                </Text>
              </View>

              <View style={styles.visitsCol}>
                <Text style={styles.visitsCount}>👀 {p.visits} visits</Text>
                <TouchableOpacity
                  style={styles.toggleBtn}
                  onPress={() => toggleStatus(p.id)}
                >
                  <Text style={styles.toggleBtnText}>
                    {p.status === 'published' ? 'Mark Rented' : 'Mark Available'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Add Property Modal */}
      <Modal
        visible={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={t('Add New Property', 'ಹೊಸ ಆಸ್ತಿ ಸೇರಿಸಿ')}
        footer={
          <>
            <Button
              title={t('cancel', 'ರದ್ದು')}
              onPress={() => setAddModalOpen(false)}
              variant="outline"
              size="sm"
            />
            <Button
              title={t('Publish Listing', 'ಪ್ರಕಟಿಸಿ')}
              onPress={handleAddProperty}
              variant="primary"
              size="sm"
            />
          </>
        }
      >
        <Input
          label={t('Property Title', 'ಶೀರ್ಷಿಕೆ')}
          placeholder="e.g. 2 BHK House with Garden"
          value={newTitle}
          onChangeText={setNewTitle}
        />
        <View style={styles.typeRow}>
          {['House', 'Room', 'PG', 'Shop'].map((tType) => (
            <TouchableOpacity
              key={tType}
              style={[
                styles.typeChip,
                newType === tType && styles.typeChipActive,
              ]}
              onPress={() => setNewType(tType)}
            >
              <Text
                style={[
                  styles.typeChipText,
                  newType === tType && styles.typeChipTextActive,
                ]}
              >
                {tType}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.twoInputs}>
          <View style={styles.halfInput}>
            <Input
              label={t('Monthly Rent (₹)', 'ಮಾಸಿಕ ಬಾಡಿಗೆ')}
              placeholder="9500"
              keyboardType="number-pad"
              value={newRent}
              onChangeText={setNewRent}
            />
          </View>
          <View style={styles.halfInput}>
            <Input
              label={t('Security Deposit (₹)', 'ಠೇವಣಿ')}
              placeholder="30000"
              keyboardType="number-pad"
              value={newDeposit}
              onChangeText={setNewDeposit}
            />
          </View>
        </View>

        <Input
          label={t('Address & Locality', 'ವಿಳಾಸ')}
          placeholder="e.g. Vidyagiri, Bagalkot"
          value={newAddress}
          onChangeText={setNewAddress}
        />
      </Modal>
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
    paddingBottom: 60,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.mute,
    fontWeight: '700',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.ink,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 12,
  },
  propertyCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 12,
  },
  propTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  propTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
  },
  propLoc: {
    fontSize: 12,
    color: COLORS.mute,
    marginTop: 2,
    marginBottom: 12,
  },
  propFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingTop: 10,
  },
  rentText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.brand,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.mute,
  },
  depositText: {
    fontSize: 11,
    color: COLORS.mute,
    marginTop: 2,
  },
  visitsCol: {
    alignItems: 'flex-end',
  },
  visitsCount: {
    fontSize: 11,
    color: COLORS.mute,
    fontWeight: '600',
    marginBottom: 6,
  },
  toggleBtn: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  typeChipActive: {
    backgroundColor: COLORS.sun,
    borderColor: COLORS.sunDeep,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  typeChipTextActive: {
    color: COLORS.ink,
  },
  twoInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
});
