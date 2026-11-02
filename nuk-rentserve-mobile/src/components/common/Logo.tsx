// NUK RentServe Brand Logo (Karnataka Crimson & Sun Gold)

import React from 'react';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';

interface LogoProps {
  size?: number;
  mono?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 44, mono = false }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 48 48">
        {/* Rounded Crimson Shield */}
        <Rect width={48} height={48} rx={12} fill={mono ? '#FFFFFF' : '#D71920'} />
        {/* Golden Karnataka Canopy / Roofline */}
        <Path
          d="M8 20 L24 9 L40 20"
          fill="none"
          stroke="#FFC928"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* White / Crimson Monogram (NUK) */}
        <Path
          d="M15 38 V24 L33 38 V24"
          fill="none"
          stroke={mono ? '#D71920' : '#FFFFFF'}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Sun Gold Accent Dot */}
        <Circle cx={24} cy={16} r={2} fill="#FFC928" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
