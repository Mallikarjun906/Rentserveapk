// Property Owner Portal & Listing Management Dashboard

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import {
  Home,
  Plus,
  MapPin,
  Building2,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  LogOut,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { formatINR } from '../../utils/formatters';
import { useLocalization } from '../../context/LocalizationContext';
import { useAuth } from '../../context/AuthContext';
import { rentalApi, Property } from '../../api/rentalApi';
import { confirmAction } from '../../utils/confirmAlert';

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
  onLogout?: () => void;
}

export const OwnerDashboardScreen: React.FC<OwnerDashboardScreenProps> = ({
  onBack,
  onLogout,
}) => {
  const { t } = useLocalization();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    confirmAction(
      t('Logout', 'ಲಾಗ್ ಔಟ್'),
      t('Are you sure you want to sign out?', 'ನೀವು ಖಚಿತವಾಗಿ ಲಾಗ್ ಔಟ್ ಮಾಡಲು ಬಯಸುವಿರಾ?'),
      async () => {
        await logout();
        if (onLogout) onLogout();
        else onBack();
      },
      'Sign Out'
    );
  };

  const [properties, setProperties] = useState<OwnerProperty[]>([]);
  const [loading, setLoading] = useState(true);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('House');
  const [newRent, setNewRent] = useState('');
  const [newDeposit, setNewDeposit] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    rentalApi
      .getProperties()
      .then((res) => {
        if (!active) return;
        if (Array.isArray(res) && res.length > 0) {
          setProperties(
            res.map((p: any) => ({
              id: p._id || p.id,
              title: p.title || 'Residential Property',
              type: p.type || 'House',
              rent: p.rent || 5000,
              deposit: p.deposit || 15000,
              location: p.location || p.address || 'Bagalkot',
              status: (p.status as any) || 'published',
              visits: 0,
            }))
          );
        } else {
          setProperties([]);
        }
      })
      .catch(() => {
        if (active) setProperties([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleAddProperty = async () => {
    if (!newTitle.trim() || !newRent) {
      Alert.alert('Required Fields', 'Please enter a property title and monthly rent.');
      return;
    }
    setSubmitting(true);
    try {
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
      Alert.alert('Listing Created', 'Your rental listing has been registered.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not add property listing.');
    } finally {
      setSubmitting(false);
    }
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
    <View style={styles.container}>
      <Header
        title={t('ownerDashboard', 'ಆಸ್ತಿ ಮಾಲೀಕರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್')}
        subtitle="Manage your houses, rooms & tenant visits"
        onBack={onBack}
        rightAction={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Button
              title="+ Add"
              onPress={() => setAddModalOpen(true)}
              variant="yellow"
              size="sm"
            />
            <TouchableOpacity
              onPress={handleLogout}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: '#FEE2E2',
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: RADIUS.full,
                borderWidth: 1,
                borderColor: '#FECACA',
              }}
              accessibilityLabel="Sign Out"
            >
              <LogOut size={13} color={COLORS.bad} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: COLORS.bad }}>Sign Out</Text>
            </TouchableOpacity>
          </View>
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
            <Text style={styles.statLabel}>Tenant Enquiries</Text>
            <Text style={styles.statValue}>0</Text>
          </View>
          <View style={[styles.statBox, SHADOWS.card]}>
            <Text style={styles.statLabel}>Active Rented</Text>
            <Text style={styles.statValue}>
              {properties.filter((p) => p.status === 'rented').length}
            </Text>
          </View>
        </View>

        {/* Listings List */}
        <Text style={styles.sectionTitle}>{t('My Listed Properties', 'ನನ್ನ ಪಟ್ಟಿಗಳು')}</Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.brand} />
            <Text style={styles.loadingText}>Loading property listings…</Text>
          </View>
        ) : properties.length === 0 ? (
          <View style={[styles.emptyCard, SHADOWS.card]}>
            <Building2 size={36} color={COLORS.muteLight} />
            <Text style={styles.emptyTitle}>No properties listed yet</Text>
            <Text style={styles.emptySub}>
              Tap '+ Add' above to publish houses, rooms, PGs, or commercial shops in Karnataka.
            </Text>
          </View>
        ) : (
          properties.map((p) => (
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
              <View style={styles.locRow}>
                <MapPin size={13} color={COLORS.mute} />
                <Text style={styles.propLoc}>{p.location}</Text>
              </View>

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
                  <View style={styles.visitsRow}>
                    <Eye size={12} color={COLORS.mute} />
                    <Text style={styles.visitsCount}>{p.visits} visits</Text>
                  </View>
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
          ))
        )}

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
              loading={submitting}
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

        <View style={styles.row}>
          <View style={styles.col}>
            <Input
              label={t('Monthly Rent (₹)', 'ಮಾಸಿಕ ಬಾಡಿಗೆ (₹)')}
              placeholder="9500"
              keyboardType="numeric"
              value={newRent}
              onChangeText={setNewRent}
            />
          </View>
          <View style={styles.col}>
            <Input
              label={t('Deposit (₹)', 'ಮುಂಗಡ ಠೇವಣಿ (₹)')}
              placeholder="30000"
              keyboardType="numeric"
              value={newDeposit}
              onChangeText={setNewDeposit}
            />
          </View>
        </View>

        <Input
          label={t('Address / Locality', 'ವಿಳಾಸ / ಪ್ರದೇಶ')}
          placeholder="e.g. Navanagar Main Road, Bagalkot"
          value={newAddress}
          onChangeText={setNewAddress}
        />
      </Modal>
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
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.mute,
    textTransform: 'uppercase',
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
  loadingBox: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.mute,
    marginTop: 8,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.mute,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  propertyCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 14,
  },
  propTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  propTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginBottom: 12,
  },
  propLoc: {
    fontSize: 12,
    color: COLORS.mute,
  },
  propFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  rentText: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.ink,
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
  visitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  visitsCount: {
    fontSize: 11,
    color: COLORS.mute,
    fontWeight: '600',
  },
  toggleBtn: {
    backgroundColor: COLORS.paper,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 10,
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
    backgroundColor: COLORS.brandTint,
    borderColor: COLORS.brand,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  typeChipTextActive: {
    color: COLORS.brand,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
  },
});
