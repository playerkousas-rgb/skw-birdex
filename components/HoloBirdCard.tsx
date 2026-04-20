import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
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
  flipped?: boolean;
  onFlip?: () => void;
  unknown?: boolean;
  enableHolo?: boolean;  // 全息特效（SR+ 自動啟用）
}

// 全息卡牌 — 含 3D 翻轉、光影掃描、星塵粒子
export default function HoloBirdCard({
  species, rarity, count, size = 'md', flipped, onFlip, unknown, enableHolo,
}: Props) {
  const flipAnim = useRef(new Animated.Value(flipped ? 1 : 0)).current;
  const holoShift = useRef(new Animated.Value(0)).current;
  const shineX = useRef(new Animated.Value(-1)).current;
  const floatY = useRef(new Animated.Value(0)).current;

  const meta = RARITY[rarity];
  const isHolo = enableHolo !== false && ['SR', 'SSR', 'UR', 'LR'].includes(rarity);

  const w = size === 'sm' ? 110 : size === 'lg' ? 260 : 180;
  const h = size === 'sm' ? 160 : size === 'lg' ? 380 : 250;

  useEffect(() => {
    Animated.timing(flipAnim, {
      toValue: flipped ? 1 : 0,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease),
    }).start();
  }, [flipped]);

  useEffect(() => {
    if (isHolo) {
      // 全息色彩循環
      Animated.loop(
        Animated.timing(holoShift, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
          easing: Easing.linear,
        })
      ).start();
      // 光影掃描
      Animated.loop(
        Animated.sequence([
          Animated.timing(shineX, { toValue: 1, duration: 2500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.delay(1500),
          Animated.timing(shineX, { toValue: -1, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    }
    // 飄浮
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: 1, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(floatY, { toValue: 0, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, [isHolo]);

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const frontOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 0.51, 1], outputRange: [1, 1, 0, 0] });
  const backOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 0.51, 1], outputRange: [0, 0, 1, 1] });
  const holoHue = holoShift.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: ['0deg', '90deg', '180deg', '270deg', '360deg'] });
  const shineTranslate = shineX.interpolate({ inputRange: [-1, 1], outputRange: [-w * 1.5, w * 1.5] });
  const floatTransform = floatY.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });

  if (unknown) {
    return (
      <View style={[styles.card, styles.cardUnknown, { width: w, height: h }]}>
        <View style={styles.holoBorder} />
        <Ionicons name="help" size={w * 0.3} color={COLORS.muted} style={{ opacity: 0.3 }} />
        <Text style={[styles.unknownText, { fontSize: size === 'sm' ? 10 : 12 }]}>尚未解鎖</Text>
      </View>
    );
  }

  const Inner = (
    <Animated.View style={{ transform: [{ translateY: floatTransform }] }}>
      <View style={{ width: w, height: h }}>
        {/* Front */}
        <Animated.View
          style={[
            styles.card,
            {
              width: w, height: h,
              borderColor: meta.color,
              shadowColor: meta.glow,
              transform: [{ perspective: 1000 }, { rotateY: frontRotate }],
              opacity: frontOpacity,
              position: 'absolute',
              backfaceVisibility: 'hidden',
            },
          ]}
        >
          <LinearGradient
            colors={meta.gradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* 全息層 */}
          {isHolo && (
            <>
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  { opacity: 0.3, transform: [{ rotate: holoHue }] },
                ]}
              >
                <LinearGradient
                  colors={['#FF006E', '#8338EC', '#3A86FF', '#06FFA5', '#FFBE0B', '#FF006E']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>

              {/* 光影掃描 */}
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <Animated.View
                  style={{
                    position: 'absolute',
                    width: w * 0.5, height: h * 2,
                    top: -h * 0.5, left: 0,
                    transform: [{ translateX: shineTranslate }, { rotate: '25deg' }],
                  }}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.5)', 'transparent']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              </View>

              {/* 星塵粒子 */}
              {size !== 'sm' && Array.from({ length: 8 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.sparkle,
                    {
                      top: `${10 + (i * 11) % 80}%`,
                      left: `${15 + (i * 17) % 75}%`,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 8, color: meta.glow, opacity: 0.8 }}>✦</Text>
                </View>
              ))}
            </>
          )}

          {/* 邊框裝飾 */}
          <View style={[styles.innerBorder, { borderColor: 'rgba(255,255,255,0.2)' }]} />

          {/* 頭部 */}
          <View style={styles.header}>
            <Text style={[styles.no, { fontSize: size === 'sm' ? 9 : 11 }]}>
              No.{String(species.id).padStart(3, '0')}
            </Text>
            <RarityBadge rarity={rarity} size={size === 'sm' ? 'sm' : 'md'} />
          </View>

          {/* 中央圖示 */}
          <View style={styles.center}>
            <View
              style={[
                styles.emojiRing,
                {
                  width: (size === 'sm' ? 60 : size === 'lg' ? 140 : 90),
                  height: (size === 'sm' ? 60 : size === 'lg' ? 140 : 90),
                  borderRadius: (size === 'sm' ? 30 : size === 'lg' ? 70 : 45),
                  borderColor: meta.color,
                  backgroundColor: '#00000055',
                },
              ]}
            >
              {species.photoUrl ? (
                // 預留照片位
                <Text style={{ fontSize: size === 'sm' ? 34 : size === 'lg' ? 80 : 52 }}>{species.emoji}</Text>
              ) : (
                <Text style={{ fontSize: size === 'sm' ? 34 : size === 'lg' ? 80 : 52 }}>{species.emoji}</Text>
              )}
            </View>
          </View>

          {/* 底部 */}
          <View style={styles.footer}>
            <Text
              style={[styles.name, { fontSize: size === 'sm' ? 12 : size === 'lg' ? 22 : 16 }]}
              numberOfLines={1}
            >
              {species.name}
            </Text>
            <Text
              style={[styles.sci, { fontSize: size === 'sm' ? 9 : 11 }]}
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
            {size === 'lg' && onFlip && (
              <View style={styles.flipHint}>
                <Ionicons name="sync" size={10} color="rgba(255,255,255,0.7)" />
                <Text style={styles.flipHintText}>點擊翻面</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Back */}
        <Animated.View
          style={[
            styles.card,
            styles.cardBack,
            {
              width: w, height: h,
              borderColor: meta.color,
              shadowColor: meta.glow,
              transform: [{ perspective: 1000 }, { rotateY: backRotate }],
              opacity: backOpacity,
              position: 'absolute',
              backfaceVisibility: 'hidden',
            },
          ]}
        >
          <LinearGradient
            colors={['#0A0E1F', meta.gradient[1], '#0A0E1F']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.backContent}>
            <View style={styles.backHeader}>
              <Ionicons name="document-text" size={14} color={meta.color} />
              <Text style={[styles.backTitle, { color: meta.color }]}>詳細資料</Text>
            </View>
            <BackRow label="學名" value={species.scientificName} italic />
            <BackRow label="科別" value={species.family} />
            <BackRow label="體長" value={species.size} />
            <BackRow label="食性" value={species.diet} />
            <BackRow label="棲地" value={species.habitat.join('、')} />
            <BackRow label="叫聲" value={species.call} />
            <BackRow label="季節" value={species.season} />

            <View style={styles.factBackBox}>
              <Ionicons name="bulb" size={11} color={COLORS.yellow} />
              <Text style={styles.factBackText} numberOfLines={4}>
                {species.funFact}
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );

  return onFlip ? (
    <TouchableOpacity onPress={onFlip} activeOpacity={0.9}>
      {Inner}
    </TouchableOpacity>
  ) : Inner;
}

function BackRow({ label, value, italic }: { label: string; value: string; italic?: boolean }) {
  return (
    <View style={styles.backRow}>
      <Text style={styles.backLabel}>{label}</Text>
      <Text style={[styles.backValue, italic && { fontStyle: 'italic' }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    shadowOpacity: 0.7,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  cardUnknown: {
    backgroundColor: '#161B33',
    borderColor: '#242C4D',
    alignItems: 'center', justifyContent: 'center',
    gap: 6,
    shadowOpacity: 0,
  },
  cardBack: {
    backgroundColor: '#0A0E1F',
  },
  holoBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
  },
  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    margin: 4,
    borderWidth: 1,
    borderRadius: 12,
  },
  sparkle: { position: 'absolute' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 10, paddingTop: 10,
  },
  no: { color: 'rgba(255,255,255,0.9)', fontWeight: '900', letterSpacing: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emojiRing: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  footer: {
    paddingHorizontal: 10, paddingBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', gap: 3, paddingTop: 8,
  },
  name: { color: '#fff', fontWeight: '900', letterSpacing: 1 },
  sci: { color: 'rgba(255,255,255,0.75)', fontStyle: 'italic' },
  countPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999, marginTop: 3,
  },
  countText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  flipHint: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    marginTop: 4,
  },
  flipHintText: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '600' },
  unknownText: { color: '#6A72A0', fontWeight: '800', letterSpacing: 1 },

  backContent: { flex: 1, padding: 14, gap: 4 },
  backHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  backTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  backRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  backLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700' },
  backValue: { color: '#fff', fontSize: 11, fontWeight: '800', maxWidth: '60%' },
  factBackBox: {
    marginTop: 10, padding: 8,
    backgroundColor: 'rgba(255,215,64,0.1)',
    borderLeftWidth: 2, borderLeftColor: COLORS.yellow,
    borderRadius: 6,
    flexDirection: 'row', gap: 5, alignItems: 'flex-start',
  },
  factBackText: { color: 'rgba(255,255,255,0.9)', fontSize: 10, lineHeight: 14, flex: 1, fontWeight: '600' },
});
