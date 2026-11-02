// Saved & Bookmarked Rental Properties Screen (Connected to backend)

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { PropertyCard, PropertyCardItem } from '../../components/rentals/PropertyCard';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import { rentalApi } from '../../api/rentalApi';

interface SavedListingsScreenProps {
  onBack: () => void;
  onSelectProperty: (id: string) => void;
  onExplore: () => void;
}

export const SavedListingsScreen: React.FC<SavedListingsScreenProps> = ({
  onBack,
  onSelectProperty,
  onExplore,
}) => {
  const { t } = useLocalization();
  const { savedIds, toggleSaved, isSaved } = useAuth();
  const [allProperties, setAllProperties] = useState<PropertyCardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProperties() {
      setLoading(true);
      try {
        const res = await rentalApi.getProperties();
        if (Array.isArray(res)) {
          setAllProperties(
            res.map((p: any) => ({
              id: p._id || p.id,
              _id: p._id || p.id,
              title: p.title,
              type: p.type || 'House',
              rent: p.rent,
              deposit: p.deposit || 0,
              location: p.location || p.address || 'Bagalkot',
              address: p.address || '',
              facilities: p.facilities || [],
              isStudentPartner: p.type === 'PG' || p.type === 'Room',
              listerName: p.ownerId?.name || 'Owner',
              images: p.images || [],
            }))
          );
        }
      } catch (e) {
        // Handled silently
      } finally {
        setLoading(false);
      }
    }
    loadProperties();
  }, []);

  const savedListings = allProperties.filter((p) => isSaved(p.id || ''));

  return (
    <SafeAreaView style={styles.safe}>
      <Header
        title={t('Saved Properties', 'ಉಳಿಸಿದ ಆಸ್ತಿಗಳು')}
        subtitle={`${savedListings.length} saved houses, rooms & PGs`}
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.crimson} />
            <Text style={{ marginTop: 12, color: COLORS.inkMuted }}>Loading your saved properties…</Text>
          </View>
        ) : savedListings.length === 0 ? (
          <EmptyState
            title={t('No saved properties yet', 'ಯಾವುದೇ ಉಳಿಸಿದ ಆಸ್ತಿಗಳಿಲ್ಲ')}
            description={t(
              'Tap the heart icon on any property in Explore to save it here for quick access.',
              'ಆಸ್ತಿಯ ಮೇಲಿರುವ ಹಾರ್ಟ್ ಐಕಾನ್ ಒತ್ತಿ ಇಲ್ಲಿ ಉಳಿಸಿಕೊಳ್ಳಿ.'
            )}
            actionLabel={t('Explore Properties', 'ಆಸ್ತಿಗಳನ್ನು ಹುಡುಕಿ')}
            onAction={onExplore}
          />
        ) : (
          savedListings.map((p) => (
            <PropertyCard
              key={p.id}
              item={p}
              onPress={() => onSelectProperty(p.id || '')}
              isSaved={true}
              onToggleSaved={() => toggleSaved(p.id || '')}
            />
          ))
        )}
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
    paddingBottom: 60,
  },
});
