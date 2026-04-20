import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../lib/theme';

interface Props {
  emoji: string;
  color: string;
  size?: number;
  unknown?: boolean;
  rounded?: boolean;
}

export default function BirdSilhouette({
  emoji, color, size = 80, unknown, rounded = true,
}: Props) {
  const display = unknown ? '?' : emoji;
  const borderRadius = rounded ? size / 2 : 20;
  return (
    <View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: unknown ? '#F0E6D0' : color + '33',
          borderColor: unknown ? COLORS.border : color,
        },
      ]}
    >
      <Text
        style={{
          fontSize: size * 0.5,
          opacity: unknown ? 0.4 : 1,
          color: unknown ? COLORS.muted : undefined,
        }}
      >
        {display}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});
