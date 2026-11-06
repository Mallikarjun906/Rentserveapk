// Global Screen Container with Resilient Safe-Area & Android Edge-to-Edge Support

import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';

export interface ScreenContainerProps {
  children: React.ReactNode;
  /** Add padding for status bar / notch. Default: true */
  topSafe?: boolean;
  /** Add padding for bottom gesture indicator / navigation bar. Default: false */
  bottomSafe?: boolean;
  /** Status bar text style: 'dark' (for light bg) or 'light' (for dark bg). Default: 'dark' */
  statusBarStyle?: 'dark' | 'light';
  /** Background color of the container screen. Default: COLORS.paper */
  backgroundColor?: string;
  /** Optional additional container styling */
  style?: StyleProp<ViewStyle>;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  topSafe = true,
  bottomSafe = false,
  statusBarStyle = 'dark',
  backgroundColor = COLORS.paper,
  style,
}) => {
  const insets = useSafeAreaInsets();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor,
    paddingTop: topSafe ? insets.top : 0,
    paddingBottom: bottomSafe ? Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8) : 0,
  };

  return (
    <View style={[styles.root, containerStyle, style]}>
      <StatusBar
        style={statusBarStyle}
        translucent
        backgroundColor="transparent"
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
