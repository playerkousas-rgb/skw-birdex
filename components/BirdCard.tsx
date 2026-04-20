import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableWithoutFeedback } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BirdSpecies } from '../lib/birdData';
import { Rarity, RARITY, COLORS } from '../lib/theme';
import RarityBadge from './RarityBadge';

interface Props {
  species: BirdSpecies;
  rarity: Rarity;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  unknown?: boolean;
  holographic?: boolean;   // 全息光影效果
  tiltEnabled?: boolean;   // 互動傾斜
}

export default function BirdCard({
  species, rarity, count, size = 'md', unknown,
  holographic = true, tiltEnabled = false,
}: Props) {
  const meta = RARITY[rarity];
  const w = size === 'sm' ? 110 : size === 'lg' ? 260 : 170;
  const h = size === 'sm' ? 150 : size === 'lg' ? 360 : 230;
  const emojiSize = size === 'sm' ? 40 : size === 'lg' ? 90 : 56;

  // 全息掃光動畫
  const shine = useRef(new Animated.Value(0)).current;
  // 整體微呼吸
  const breath = useRef(new Animated.Value(0)).current;
  // 點擊傾斜
  const tiltX = useRef(new Animated.Value(0)).current;
  const tiltY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (holographic && !unknown && size !== 'sm') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shine, { toValue: 1, duration: 3500, useNativeDriver: true, easing: Easing.linear }),
          Animated.delay(800),
        ])
      ).start();
    }
    Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 2500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(breath, { toValue: 0, duration: 2500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, [holographic, unknown, size]);

  const shineX = shine.interpolate({ inputRange: [0, 1], outputRange: [-w, w * 1.8] });
  const glowOpacity = breath.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.8] });

  const handlePress = () => {
    if (!tiltEnabled) return;
    Animated.sequence([
      Animated.timing(tiltY, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(tiltY, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const rotateY = tiltY.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '8deg'] });

  if (unknown) {
    return (
      <View style={[styles.card, styles.cardUnknown, { width: w, height: h }]}>
        <View style={styles.holoBorder} />
        <Text style={{ fontSize: emojiSize, color: COLORS.muted, opacity: 0.4 }}>?</Text>
        <Text style={[styles.unknownText, { fontSize: size === 'sm' ? 10 : 12 }]}>尚未解鎖</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <Animated.View
        style={[
          styles.card,
          {
            width: w, height: h,
            borderColor: meta.color,
            transform: [{ perspective: 1000 }, { rotateY }],
          },
        ]}
      >
        {/* 外發光 */}
        <Animated.View
          style={[
            styles.outerGlow,
            {
              width: w + 8, height: h + 8,
              shadowColor: meta.glow, shadowOpacity: glowOpacity,
            },
          ]}
          pointerEvents="none"
        />

        {/* 主背景漸層 */}
        <LinearGradient
          colors={meta.gradient}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* 全息底紋（斜線格）*/}
        {holographic && size !== 'sm' && (
          <View style={StyleSheet.absoluteFill}>
            {Array.from({ length: 8 }).map((_, i) => (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  top: -h, left: i * (w / 4) - w / 2,
                  width: 1, height: h * 3,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  transform: [{ rotate: '30deg' }],
                }}
              />
            ))}
          </View>
        )}

        {/* 掃光 */}
        {holographic && size !== 'sm' && (
          <Animated.View
            style={{
              position: 'absolute',
              top: -h * 0.5, width: 40, height: h * 2,
              backgroundColor: 'rgba(255,255,255,0.25)',
              transform: [{ translateX: shineX }, { rotate: '20deg' }],
            }}
            pointerEvents="none"
          />
        )}

        {/* 第二層掃光 (延遲) */}
        {holographic && size === 'lg' && (
          <Animated.View
            style={{
              position: 'absolute',
              top: -h * 0.5, width: 20, height: h * 2,
              backgroundColor: meta.glow,
              opacity: 0.15,
              transform: [
                { translateX: Animated.subtract(shineX, 60) as any },
                { rotate: '20deg' },
              ],
            }}
            pointerEvents="none"
          />
        )}

        {/* 內框 */}
        <View style={styles.holoBorder} pointerEvents="none" />

        {/* 頭部 */}
        <View style={styles.header}>
          <Text style={[styles.no, { fontSize: size === 'sm' ? 9 : 11 }]}>
            No.{String(species.id).padStart(3, '0')}
          </Text>
          <RarityBadge rarity={rarity} size={size === 'sm' ? 'sm' : 'md'} />
        </View>

        {/* 中央圖像 */}
        <View style={styles.center}>
          {/* 光圈 */}
          <Animated.View
            style={[
              styles.emojiHalo,
              {
                width: emojiSize * 2, height: emojiSize * 2,
                borderRadius: emojiSize,
                backgroundColor: meta.color,
                opacity: breath.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.25] }),
              },
            ]}
          />
          <View
            style={[
              styles.emojiRing,
              {
                width: emojiSize * 1.6, height: emojiSize * 1.6,
                borderRadius: emojiSize * 0.8,
                borderColor: meta.color,
                backgroundColor: '#00000055',
              },
            ]}
          >
            <Text style={{ fontSize: emojiSize }}>{species.emoji}</Text>
          </View>
        </View>

        {/* 底部資訊 */}
        <View style={styles.footer}>
          <Text
            style={[styles.name, { fontSize: size === 'sm' ? 12 : size === 'lg' ? 20 : 15 }]}
            numberOfLines={1}
          >
            {species.name}
          </Text>

          <Text
            style={[styles.sci, { fontSize: size === 'sm' ? 9 : 10 }]}
            numberOfLines={1}
          >
            {species.scientificName}
          </Text>
          {count !== undefined && size !== 'sm' && (
            <View style={styles.countPill}>
              <Ionicons name="camera" size={10} color="#fff" />
              <Text style={styles.countText}>× {count}</Text>
            </View>
          )}
        </View>

        {/* 小卡右上角計數徽章 */}
        {count !== undefined && size === 'sm' && count > 0 && (
          <View style={[styles.smallCountPill, { borderColor: meta.color, shadowColor: meta.glow }]}>
            <Text style={styles.smallCountText}>×{count}</Text>
          </View>
        )}

        {/* 角落裝飾 */}
        {size !== 'sm' && (
          <>
            <View style={[styles.corner, { top: 6, left: 6, borderTopWidth: 2, borderLeftWidth: 2, borderColor: meta.color }]} />
            <View style={[styles.corner, { top: 6, right: 6, borderTopWidth: 2, borderRightWidth: 2, borderColor: meta.color }]} />
            <View style={[styles.corner, { bottom: 6, left: 6, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: meta.color }]} />
            <View style={[styles.corner, { bottom: 6, right: 6, borderBottomWidth: 2, borderRightWidth: 2, borderColor: meta.color }]} />
          </>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 2,
    overflow: 'hidden',
    elevation: 8,
  },
  outerGlow: {
    position: 'absolute', top: -4, left: -4,
    borderRadius: 16,
    shadowRadius: 16, shadowOffset: { width: 0, height: 0 },
  },
  cardUnknown: {
    backgroundColor: '#161B33',
    borderColor: '#242C4D',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowOpacity: 0,
  },
  holoBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 10, paddingTop: 10,
  },
  no: { color: 'rgba(255,255,255,0.8)', fontWeight: '900', letterSpacing: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emojiHalo: { position: 'absolute' },
  emojiRing: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  footer: {
    paddingHorizontal: 10, paddingBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', gap: 1, paddingTop: 8,
  },
  name: { color: '#fff', fontWeight: '900', letterSpacing: 1 },
  nameEn: { color: 'rgba(255,255,255,0.75)', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  sci: { color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' },
  countPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 999, marginTop: 3,
  },
  countText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  smallCountPill: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    shadowOpacity: 0.8, shadowRadius: 3,
  },
  smallCountText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  unknownText: { color: '#6A72A0', fontWeight: '800', letterSpacing: 1 },
  corner: { position: 'absolute', width: 10, height: 10 },
});
