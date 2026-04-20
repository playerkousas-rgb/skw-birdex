import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { COLORS, RARITY, RARITY_ORDER } from '../lib/theme';
import { useBirds } from '../lib/BirdContext';
import { RootStackParamList } from '../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function WelcomeScreen() {
  const nav = useNavigation<Nav>();
  const { markWelcomeSeen } = useBirds();
  const pulse = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(float, { toValue: 0, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, []);

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });
  const floatY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  const start = () => {
    markWelcomeSeen();
    nav.reset({ index: 0, routes: [{ name: 'Tabs' }] });
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[COLORS.bg, '#12152E', COLORS.bg]}
        style={StyleSheet.absoluteFill}
      />

      {/* 裝飾網格 */}
      <View style={styles.grid} pointerEvents="none">
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={`h${i}`} style={[styles.gridLine, { top: (i + 1) * 60 }]} />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={`v${i}`} style={[styles.gridLineV, { left: (i + 1) * 70 }]} />
        ))}
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Logo */}
          <View style={styles.heroWrap}>
            <Animated.View
              style={[
                styles.pulseRing,
                { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
              ]}
            />
            <Animated.View style={[styles.hero, { transform: [{ translateY: floatY }] }]}>
              <LinearGradient
                colors={[COLORS.neon + '33', COLORS.purple + '33']}
                style={styles.heroBg}
              >
                <Text style={{ fontSize: 90 }}>🪶</Text>
              </LinearGradient>
            </Animated.View>
          </View>

          <Text style={styles.title}>BIRD-DEX</Text>
          <View style={styles.titleBar} />
          <Text style={styles.subtitle}>兒童賞鳥捕捉器 · 教育卡牌收集</Text>

          {/* 特色 */}
          <View style={styles.features}>
            <Feature
              icon="scan-circle"
              color={COLORS.neon}
              title="AI 即時辨識"
              desc="拍到鳥 → 自動識別鳥種並發放專屬卡片"
            />
            <Feature
              icon="dice"
              color={COLORS.purple}
              title="辨識失敗也能玩"
              desc="識別不到？改用抽卡機制，永遠有驚喜"
            />
            <Feature
              icon="trending-up"
              color={COLORS.green}
              title="卡片稀有度會成長"
              desc="拍越多同種鳥，卡片從 UC 一路進化到 LR"
            />
            <Feature
              icon="trophy"
              color={COLORS.yellow}
              title="職稱 × XP × 等級"
              desc="認識新鳥種解鎖職稱，XP 累積升等級"
            />
          </View>

          {/* 稀有度展示 */}
          <View style={styles.rarityShowcase}>
            <Text style={styles.rarityTitle}>卡片稀有度系統</Text>
            <View style={styles.rarityRow}>
              {RARITY_ORDER.map((r) => {
                const meta = RARITY[r];
                return (
                  <View
                    key={r}
                    style={[
                      styles.rarityPill,
                      { borderColor: meta.color, shadowColor: meta.glow },
                    ]}
                  >
                    <LinearGradient colors={meta.gradient} style={StyleSheet.absoluteFill} />
                    <Text style={styles.rarityPillText}>{meta.label}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.raritySub}>UC → C → R → SR → SSR → UR → LR</Text>
          </View>

          <TouchableOpacity style={styles.startBtn} onPress={start} activeOpacity={0.8}>
            <LinearGradient
              colors={[COLORS.neon, COLORS.purpleDark]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.startBtnInner}
            >
              <Ionicons name="power" size={22} color="#fff" />
              <Text style={styles.startText}>START MISSION</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.note}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.green} />
            <Text style={styles.noteText}>
              完全免費 · 無廣告 · 資料儲存本機 · Notion 後台管理
            </Text>
          </View>

          <Text style={styles.copyrightText}>
            © 2026 SKWSCOUT · BIRD-DEX v3.0
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Feature({ icon, color, title, desc }: { icon: any; color: string; title: string; desc: string }) {
  return (
    <View style={[fs.card, { borderColor: color + '55', shadowColor: color }]}>
      <View style={[fs.icon, { backgroundColor: color + '22', borderColor: color }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={fs.title}>{title}</Text>
        <Text style={fs.desc}>{desc}</Text>
      </View>
    </View>
  );
}

const fs = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.surface,
    padding: 12, borderRadius: 14,
    borderWidth: 1, marginBottom: 8,
    shadowOpacity: 0.2, shadowRadius: 8,
  },
  icon: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  title: { color: COLORS.text, fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  desc: { color: COLORS.textSoft, fontSize: 11, marginTop: 2 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  grid: { ...StyleSheet.absoluteFillObject, opacity: 0.06 },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: COLORS.neon },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: COLORS.neon },

  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },

  heroWrap: { alignItems: 'center', justifyContent: 'center', height: 200, marginTop: 10 },
  pulseRing: {
    position: 'absolute',
    width: 200, height: 200, borderRadius: 100,
    borderWidth: 2, borderColor: COLORS.neon,
  },
  hero: { alignItems: 'center', justifyContent: 'center' },
  heroBg: {
    width: 170, height: 170, borderRadius: 85,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: COLORS.neon,
    shadowColor: COLORS.neon, shadowOpacity: 0.6, shadowRadius: 20,
  },

  title: {
    textAlign: 'center', fontSize: 42, fontWeight: '900',
    color: COLORS.text, letterSpacing: 8, marginTop: 16,
    textShadowColor: COLORS.neon, textShadowRadius: 20,
  },
  titleBar: {
    height: 3, width: 80, alignSelf: 'center',
    backgroundColor: COLORS.neon, marginTop: 6,
    shadowColor: COLORS.neon, shadowOpacity: 0.8, shadowRadius: 8,
  },
  subtitle: {
    textAlign: 'center', fontSize: 13, color: COLORS.textSoft,
    marginTop: 8, marginBottom: 22, letterSpacing: 2, fontWeight: '600',
  },

  features: { marginBottom: 16 },

  rarityShowcase: {
    backgroundColor: COLORS.surface,
    borderRadius: 16, padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  rarityTitle: { color: COLORS.text, fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 10 },
  rarityRow: { flexDirection: 'row', gap: 5, justifyContent: 'space-between' },
  rarityPill: {
    flex: 1,
    height: 28, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, overflow: 'hidden',
    shadowOpacity: 0.8, shadowRadius: 4,
  },
  rarityPillText: {
    color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 2,
  },
  raritySub: { color: COLORS.muted, fontSize: 10, marginTop: 8, textAlign: 'center', letterSpacing: 1 },

  startBtn: {
    borderRadius: 16, overflow: 'hidden',
    shadowColor: COLORS.neon, shadowOpacity: 0.5, shadowRadius: 14,
    elevation: 8,
  },
  startBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, gap: 10,
  },
  startText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 4 },

  techBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 10, paddingVertical: 10,
    backgroundColor: COLORS.purple + '11',
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.purple + '55',
  },
  techBtnText: { color: COLORS.purple, fontSize: 11, letterSpacing: 1, fontWeight: '900' },

  note: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 14,
  },
  noteText: { color: COLORS.muted, fontSize: 10, letterSpacing: 1, fontWeight: '700' },
  copyrightText: {
    color: COLORS.muted, fontSize: 10, letterSpacing: 1,
    textAlign: 'center', marginTop: 12, fontWeight: '700',
  },
});
