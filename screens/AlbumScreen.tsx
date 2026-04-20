import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { COLORS, RARITY } from '../lib/theme';
import { useBirds } from '../lib/BirdContext';
import BirdCard from '../components/BirdCard';
import { RootStackParamList } from '../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type GroupMode = 'time' | 'rarity' | 'family';

export default function AlbumScreen() {
  const nav = useNavigation<Nav>();
  const {
    allSpecies, records, getSpeciesRarity, getRecord, isCaught,
    caughtSpeciesCount, totalPhotos,
  } = useBirds();

  const [mode, setMode] = useState<GroupMode>('time');

  // 已收集的物種
  const collected = useMemo(() => {
    return allSpecies
      .filter((s) => isCaught(s.id))
      .map((s) => ({
        species: s,
        record: getRecord(s.id)!,
        rarity: getSpeciesRarity(s.id)!,
      }));
  }, [allSpecies, isCaught, getRecord, getSpeciesRarity, records]);

  // 分組
  const grouped = useMemo(() => {
    const groups: { key: string; label: string; color: string; items: typeof collected }[] = [];

    if (mode === 'time') {
      const sorted = [...collected].sort((a, b) => b.record.lastCaughtAt - a.record.lastCaughtAt);
      const today = new Date().setHours(0, 0, 0, 0);
      const week = today - 7 * 86400000;
      const month = today - 30 * 86400000;

      const todayItems = sorted.filter((c) => c.record.lastCaughtAt >= today);
      const weekItems = sorted.filter((c) => c.record.lastCaughtAt >= week && c.record.lastCaughtAt < today);
      const monthItems = sorted.filter((c) => c.record.lastCaughtAt >= month && c.record.lastCaughtAt < week);
      const earlier = sorted.filter((c) => c.record.lastCaughtAt < month);

      if (todayItems.length) groups.push({ key: 'today', label: '今天', color: COLORS.green, items: todayItems });
      if (weekItems.length) groups.push({ key: 'week', label: '本週', color: COLORS.neon, items: weekItems });
      if (monthItems.length) groups.push({ key: 'month', label: '本月', color: COLORS.purple, items: monthItems });
      if (earlier.length) groups.push({ key: 'earlier', label: '更早', color: COLORS.muted, items: earlier });
    } else if (mode === 'rarity') {
      const orderLR = ['LR', 'UR', 'SSR', 'SR', 'R', 'C', 'UC'] as const;
      orderLR.forEach((r) => {
        const items = collected.filter((c) => c.rarity === r);
        if (items.length) {
          groups.push({
            key: r,
            label: `${RARITY[r].label} · ${RARITY[r].cn}`,
            color: RARITY[r].color,
            items,
          });
        }
      });
    } else {
      const byFamily: Record<string, typeof collected> = {};
      collected.forEach((c) => {
        if (!byFamily[c.species.family]) byFamily[c.species.family] = [];
        byFamily[c.species.family].push(c);
      });
      Object.entries(byFamily).forEach(([family, items]) => {
        groups.push({ key: family, label: family, color: COLORS.neon, items });
      });
    }
    return groups;
  }, [collected, mode]);

  const bestRarityCount = useMemo(() => {
    const map: Record<string, number> = {};
    collected.forEach((c) => {
      map[c.rarity] = (map[c.rarity] || 0) + 1;
    });
    return map;
  }, [collected]);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <LinearGradient colors={['#12152E', '#05070F']} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerSub}>MY COLLECTION</Text>
              <Text style={styles.headerTitle}>我的相冊</Text>
            </View>
            <View style={styles.countBox}>
              <Text style={styles.countNum}>{collected.length}</Text>
              <Text style={styles.countLabel}>張卡</Text>
            </View>
          </View>

          {/* 快速統計 */}
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <Ionicons name="camera" size={12} color={COLORS.neon} />
              <Text style={styles.statValue}>{totalPhotos}</Text>
              <Text style={styles.statLabel}>總拍攝</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="grid" size={12} color={COLORS.purple} />
              <Text style={styles.statValue}>{caughtSpeciesCount}</Text>
              <Text style={styles.statLabel}>物種</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="diamond" size={12} color={COLORS.yellow} />
              <Text style={styles.statValue}>
                {(bestRarityCount.LR || 0) + (bestRarityCount.UR || 0) + (bestRarityCount.SSR || 0)}
              </Text>
              <Text style={styles.statLabel}>SSR+</Text>
            </View>
          </View>

          {/* 分組切換 */}
          <View style={styles.modeRow}>
            <ModeBtn label="依時間" icon="time" active={mode === 'time'} onPress={() => setMode('time')} />
            <ModeBtn label="依稀有度" icon="diamond" active={mode === 'rarity'} onPress={() => setMode('rarity')} />
            <ModeBtn label="依科別" icon="library" active={mode === 'family'} onPress={() => setMode('family')} />
          </View>
        </LinearGradient>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
        {collected.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="images-outline" size={56} color={COLORS.muted} />
            <Text style={styles.emptyTitle}>相冊還是空的</Text>
            <Text style={styles.emptyHint}>去 CAPTURE 分頁拍下第一張鳥鳥照片吧！</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => nav.goBack()}>
              <Ionicons name="camera" size={16} color={COLORS.neon} />
              <Text style={styles.emptyBtnText}>開始拍攝</Text>
            </TouchableOpacity>
          </View>
        ) : (
          grouped.map((g) => (
            <View key={g.key} style={{ marginBottom: 16 }}>
              <View style={styles.groupHeader}>
                <View style={[styles.groupDot, { backgroundColor: g.color }]} />
                <Text style={styles.groupTitle}>{g.label}</Text>
                <Text style={styles.groupCount}>{g.items.length} 張</Text>
              </View>
              <View style={styles.grid}>
                {g.items.map((c) => (
                  <TouchableOpacity
                    key={c.species.id}
                    onPress={() => nav.navigate('BirdDetail', { speciesId: c.species.id })}
                    activeOpacity={0.85}
                    style={{ marginBottom: 8 }}
                  >
                    <BirdCard
                      species={c.species}
                      rarity={c.rarity}
                      count={c.record.count}
                      size="sm"
                    />
                    {c.record.hotspotName && (
                      <View style={styles.locChip}>
                        <Ionicons name="location" size={8} color="#fff" />
                        <Text style={styles.locChipText} numberOfLines={1}>
                          {c.record.hotspotName}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function ModeBtn({ label, icon, active, onPress }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.modeBtn, active && styles.modeBtnActive]}
    >
      <Ionicons name={icon} size={12} color={active ? COLORS.neon : COLORS.textSoft} />
      <Text style={[styles.modeText, active && { color: COLORS.neon }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12 },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  headerSub: { color: COLORS.neon, fontSize: 10, letterSpacing: 3, fontWeight: '900' },
  headerTitle: { color: COLORS.text, fontSize: 22, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
  countBox: {
    alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: COLORS.surface, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.neon + '55',
    marginLeft: 'auto',
  },
  countNum: { color: COLORS.neon, fontSize: 20, fontWeight: '900' },
  countLabel: { color: COLORS.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  quickStats: {
    flexDirection: 'row', gap: 6, marginTop: 10,
  },
  statItem: {
    flex: 1, alignItems: 'center', gap: 2,
    backgroundColor: COLORS.surface,
    paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  statValue: { color: COLORS.text, fontSize: 16, fontWeight: '900' },
  statLabel: { color: COLORS.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  modeRow: {
    flexDirection: 'row', gap: 4, marginTop: 10,
    padding: 3, backgroundColor: COLORS.surface,
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 7, borderRadius: 7,
  },
  modeBtnActive: { backgroundColor: COLORS.neon + '22' },
  modeText: { color: COLORS.textSoft, fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  groupHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 8,
  },
  groupDot: { width: 10, height: 10, borderRadius: 5 },
  groupTitle: { color: COLORS.text, fontSize: 13, fontWeight: '900', letterSpacing: 1, flex: 1 },
  groupCount: {
    color: COLORS.textSoft, fontSize: 11, fontWeight: '800',
    backgroundColor: COLORS.surface, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start',
  },
  locChip: {
    position: 'absolute', bottom: 14, left: 6,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4,
    maxWidth: 100,
  },
  locChipText: { color: '#fff', fontSize: 8, fontWeight: '800' },

  empty: {
    alignItems: 'center', padding: 40, gap: 10,
    backgroundColor: COLORS.surface, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  emptyTitle: { color: COLORS.text, fontSize: 15, fontWeight: '900' },
  emptyHint: { color: COLORS.muted, fontSize: 12, textAlign: 'center' },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.neon + '22',
    borderWidth: 1, borderColor: COLORS.neon,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 10, marginTop: 6,
  },
  emptyBtnText: { color: COLORS.neon, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
});
