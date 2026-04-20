import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { COLORS, Rarity, RARITY, RARITY_ORDER } from '../lib/theme';
import { useBirds } from '../lib/BirdContext';
import BirdCard from '../components/BirdCard';
import { RootStackParamList } from '../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;

export default function GalleryScreen() {
  const nav = useNavigation<Nav>();
  const { allSpecies, internalCount, remoteCount } = useBirds();
  const [previewRarity, setPreviewRarity] = useState<Rarity>('UC');
  const [filter, setFilter] = useState<'all' | 'internal' | 'remote'>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return allSpecies;
    return allSpecies.filter((s) => s.source === filter || (!s.source && filter === 'internal'));
  }, [allSpecies, filter]);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <LinearGradient colors={['#12152E', '#05070F']} style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerSub}>FULL GALLERY</Text>
              <Text style={styles.headerTitle}>全部卡牌總覽</Text>
            </View>
            <View style={styles.countBox}>
              <Text style={styles.countNum}>{allSpecies.length}</Text>
              <Text style={styles.countLabel}>張卡</Text>
            </View>
          </View>

          {/* 資料來源篩選 */}
          <View style={styles.filters}>
            <Filter label={`全部 ${allSpecies.length}`} active={filter === 'all'} onPress={() => setFilter('all')} />
            <Filter label={`內建 ${internalCount}`} active={filter === 'internal'} onPress={() => setFilter('internal')} color={COLORS.neon} />
            {remoteCount > 0 && (
              <Filter label={`後台 ${remoteCount}`} active={filter === 'remote'} onPress={() => setFilter('remote')} color={COLORS.purple} />
            )}
          </View>
        </LinearGradient>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* 稀有度預覽區 */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>🎨 稀有度視覺預覽</Text>
          <Text style={styles.sectionHint}>
            同一張卡片在不同稀有度下會呈現不同霓虹色，點擊可切換預覽
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rarityChipsRow}
          >
            {RARITY_ORDER.map((r) => {
              const meta = RARITY[r];
              return (
                <TouchableOpacity
                  key={r}
                  onPress={() => setPreviewRarity(r)}
                  style={[
                    styles.rarityPreviewChip,
                    previewRarity === r && { borderColor: meta.color, shadowColor: meta.glow, shadowOpacity: 0.8, shadowRadius: 8 },
                  ]}
                >
                  <LinearGradient
                    colors={meta.gradient}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.rarityPreviewText}>{meta.label}</Text>
                  <Text style={styles.rarityPreviewCn}>{meta.cn}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 預覽卡片區 */}
          <View style={styles.previewCards}>
            {allSpecies.slice(0, 3).map((s) => (
              <BirdCard
                key={s.id}
                species={s}
                rarity={previewRarity}
                count={RARITY[previewRarity].threshold}
                size="sm"
              />
            ))}
          </View>
          <Text style={styles.previewCaption}>
            ▲ 以前 3 隻鳥示範 {RARITY[previewRarity].label} ({RARITY[previewRarity].cn}) 稀有度的卡片樣式
          </Text>
        </View>

        {/* 全部 30 張卡 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📚 全部卡牌（{filtered.length} 張）</Text>
          </View>

          <View style={styles.grid}>
            {filtered.map((s) => {
              // 依 ID 分配展示用的稀有度（只是預覽效果）
              const demoRarity = demoRarityFor(s.id);
              return (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => nav.navigate('BirdDetail', { speciesId: s.id })}
                  activeOpacity={0.85}
                  style={{ marginBottom: 10 }}
                >
                  <View style={{ position: 'relative' }}>
                    <BirdCard
                      species={s}
                      rarity={demoRarity}
                      count={RARITY[demoRarity].threshold}
                      size="sm"
                    />
                    {s.source === 'remote' && (
                      <View style={styles.remoteBadge}>
                        <Ionicons name="cloud-done" size={8} color="#fff" />
                        <Text style={styles.remoteBadgeText}>REMOTE</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Filter({
  label, active, onPress, color = COLORS.neon,
}: { label: string; active: boolean; onPress: () => void; color?: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.filterChip,
        active && { backgroundColor: color + '22', borderColor: color },
      ]}
    >
      <Text style={[styles.filterText, active && { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// 展示用：依 ID 分配預覽稀有度，讓畫面有各種稀有度
function demoRarityFor(id: number): Rarity {
  const mod = id % 7;
  const map: Rarity[] = ['UC', 'C', 'R', 'SR', 'SSR', 'UR', 'LR'];
  return map[mod];
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 14, paddingTop: 6, paddingBottom: 12 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerSub: { color: COLORS.neon, fontSize: 10, letterSpacing: 3, fontWeight: '900' },
  headerTitle: { color: COLORS.text, fontSize: 20, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
  countBox: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.neon + '55',
  },
  countNum: { color: COLORS.neon, fontSize: 18, fontWeight: '900' },
  countLabel: { color: COLORS.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  filters: {
    flexDirection: 'row', gap: 6, marginTop: 10,
  },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1,
    backgroundColor: COLORS.surface, borderColor: COLORS.border,
  },
  filterText: { color: COLORS.textSoft, fontSize: 11, fontWeight: '900', letterSpacing: 1 },

  previewSection: {
    margin: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  sectionTitle: { color: COLORS.text, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  sectionHint: { color: COLORS.muted, fontSize: 11, marginTop: 4, fontWeight: '600' },

  rarityChipsRow: { gap: 6, paddingVertical: 12 },
  rarityPreviewChip: {
    width: 70, height: 52, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
    overflow: 'hidden',
  },
  rarityPreviewText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  rarityPreviewCn: { color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '700', marginTop: 2 },

  previewCards: {
    flexDirection: 'row', gap: 8, justifyContent: 'space-between', marginTop: 4,
  },
  previewCaption: {
    color: COLORS.muted, fontSize: 10, marginTop: 10,
    textAlign: 'center', fontWeight: '600',
  },

  section: { paddingHorizontal: 14 },
  sectionHeader: { marginBottom: 10 },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 8, justifyContent: 'space-between',
  },
  remoteBadge: {
    position: 'absolute', top: 6, right: 6,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: COLORS.purple,
    paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: 4,
  },
  remoteBadgeText: { color: '#fff', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
});
