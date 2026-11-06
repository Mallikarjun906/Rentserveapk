// Standardized Top Navigation Header with Lucide Icons, Inset Spacing & Safe-Area Support

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  dark?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightAction,
  dark = false,
  style,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top + (Platform.OS === 'android' ? 8 : 6) },
        dark ? styles.headerDark : styles.headerLight,
        style,
      ]}
    >
      <View style={styles.leftRow}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back"
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft
              size={22}
              color={dark ? COLORS.white : COLORS.ink}
              strokeWidth={2.4}
            />
          </TouchableOpacity>
        ) : null}

        <View style={styles.titleContainer}>
          <Text
            style={[styles.title, dark && styles.textWhite]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[styles.subtitle, dark ? styles.subtitleDark : styles.subtitleLight]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {rightAction ? <View style={styles.rightAction}>{rightAction}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerLight: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  headerDark: {
    backgroundColor: COLORS.brand,
  },
  leftRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: 'transparent',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  subtitleLight: {
    color: COLORS.mute,
  },
  subtitleDark: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  textWhite: {
    color: COLORS.white,
  },
  rightAction: {
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
