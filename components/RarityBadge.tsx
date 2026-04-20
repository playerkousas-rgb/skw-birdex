import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Rarity, RARITY } from '../lib/theme';

export default function RarityBadge({
  rarity, size = 'md', showStars = false,
}: { rarity: Rarity; size?: 'sm' | 'md' | 'lg'; showStars?: boolean }) {
  const meta = RARITY[rarity];
  const pad = size === 'sm' ? { px: 6, py: 2 } : size === 'lg' ? { px: 12, py: 5 } : { px: 8, py: 3 };
  const fs = size === 'sm' ? 9 : size === 'lg' ? 14 : 11;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <LinearGradient
        colors={meta.gradient}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[
          styles.badge,
          {
            paddingHorizontal: pad.px, paddingVertical: pad.py,
            shadowColor: meta.glow,
            borderColor: meta.color,
          },
        ]}
      >
        <Text style={[styles.text, { fontSize: fs, color: '#fff', textShadowColor: meta.glow }]}>
          {meta.label}
        </Text>
      </LinearGradient>
      {showStars && (
        <View style={{ flexDirection: 'row' }}>
          {Array.from({ length: meta.stars }).map((_, i) => (
            <Text key={i} style={{ color: meta.color, fontSize: fs - 1, textShadowColor: meta.glow, textShadowRadius: 4 }}>★</Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    borderWidth: 1,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  text: {
    fontWeight: '900',
    letterSpacing: 1.5,
    textShadowRadius: 8,
  },
});
