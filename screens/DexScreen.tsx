import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

import { COLORS, Rarity, RARITY, RARITY_ORDER } from '../lib/theme';
import { useBirds } from '../lib/BirdContext';
import BirdCard from '../components/BirdCard';
import { RootStackParamList } from '../App';
import { BirdSpecies } from '../lib/birdData';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const VIEW_FILTERS = ['ALL', 'OWNED', 'LOCKED'] as const;

export default function DexScreen() {
  const nav = useNavigation<Nav>();
  const {
    allSpecies, isCaught, getRecord, getSpeciesRarity,
    caughtSpeciesCount, totalSpeciesCount, level, xp, levelProgress,
  } = useBirds();

  const [query, setQuery] = useState('');
  const [viewFilter, setViewFilter] = useState<typeof VIEW_FILTERS[number]>('ALL');
  const [rarityFilter, setRarityFilter] = useState<Rarity | 'ALL'>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    return allSpecies.filter((s) => {
      const matchQuery =
        !query ||
        s.name.includes(query) ||
        s.scientificName.toLowerCase().includes(query.toLowerCase()) ||
        s.family.includes(query) ||
        String(s.id).includes(query);
      const caught = isCaught(s.id);
      const matchView =
        viewFilter === 'ALL' ||
        (viewFilter === 'OWNED' && caught) ||
        (viewFilter === 'LOCKED' && !caught);
      const rarity = getSpeciesRarity(s.id);
      const matchRarity = rarityFilter === 'ALL' || rarity === rarityFilter;
      return matchQuery && matchView && matchRarity;
    });
  }, [allSpecies, query, viewFilter, rarityFilter, isCaught, getSpeciesRarity]);

  const grouped = useMemo(() => {
    const map = new Map<number, BirdSpecies[]>();
    filtered.forEach((s) => {
      if (!map.has(s.pack)) map.set(s.pack, []);
      map.get(s.pack)!.push(s);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filtered]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  };

  const completion = totalSpeciesCount ? caughtSpeciesCount / totalSpeciesCount : 0;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <LinearGradient
          colors={['#12152E', '#05070F']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerSub}>BIRD-DEX · v3.0</Text>
              <Text style={styles.headerTitle}>圖鑑收集</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity
                style={styles.galleryHeaderBtn}
                onPress={() => nav.navigate('Gallery')}
              >
                <Ionicons name="albums" size={13} color={COLORS.neon} />
                <Text style={styles.galleryHeaderBtnText}>全卡牌</Text>
              </TouchableOpacity>
              <View style={styles.levelPill}>
                <Ionicons name="trophy" size={14} color={COLORS.yellow} />
                <Text style={styles.levelText}>LV.{level}</Text>
              </View>
            </View>
          </View>

          {/* 進度卡 */}
          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <View style={styles.progressItem}>
                <Text style={styles.progressLabel}>物種</Text>
                <Text style={styles.progressNum}>
                  {caughtSpeciesCount}<Text style={styles.progressNumDim}>/{totalSpeciesCount}</Text>
                </Text>
              </View>
              <View style={styles.divV} />
              <View style={styles.progressItem}>
                <Text style={styles.progressLabel}>XP</Text>
                <Text style={styles.progressNum}>{xp}</Text>
              </View>
              <View style={styles.divV} />
              <View style={styles.progressItem}>
                <Text style={styles.progressLabel}>下一級</Text>
                <Text style={styles.progressNum}>
                  {levelProgress.xpToNext}
                  <Text style={styles.progressNumDim}> XP</Text>
                </Text>
              </View>
            </View>
            <View style={styles.track}>
              <LinearGradient
                colors={[COLORS.neon, COLORS.purple]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.trackFill, { width: `${completion * 100}%` }]}
              />
            </View>
          </View>
        </LinearGradient>

        {/* 搜尋 */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={COLORS.muted} />
          <TextInput
            style={styles.search}
            placeholder="搜尋鳥名、學名、科別、編號..."
            placeholderTextColor={COLORS.muted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* 篩選 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {VIEW_FILTERS.map((f) => (
            <Chip key={f} label={f} active={viewFilter === f} onPress={() => setViewFilter(f)} />
          ))}
          <View style={styles.chipDivider} />
          <Chip label="ALL" active={rarityFilter === 'ALL'} onPress={() => setRarityFilter('ALL')} />
          {RARITY_ORDER.map((r) => (
            <Chip
              key={r}
              label={r}
              active={rarityFilter === r}
              onPress={() => setRarityFilter(r)}
              dotColor={RARITY[r].color}
            />
          ))}
        </ScrollView>
      </SafeAreaView>

      <FlatList
        data={grouped}
        keyExtractor={(item) => `pack-${item[0]}`}
        contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.neon} />}
        renderItem={({ item }) => {
          const [pack, birds] = item;
          const caughtIn = birds.filter((b) => isCaught(b.id)).length;
          return (
            <View style={{ marginBottom: 18 }}>
              <View style={styles.packHeader}>
                <View style={styles.packBadge}>
                  <Ionicons name="server" size={12} color={COLORS.neon} />
                  <Text style={styles.packBadgeText}>PACK {pack}</Text>
                </View>
                <Text style={styles.packTitle}>
                  No.{(pack - 1) * 10 + 1} — {pack * 10}
                </Text>
                <Text style={styles.packCount}>{caughtIn}/{birds.length}</Text>
              </View>
              <View style={styles.grid}>
                {birds.map((b) => {
                  const caught = isCaught(b.id);
                  const rec = getRecord(b.id);
                  const rarity = getSpeciesRarity(b.id);
                  return (
                    <TouchableOpacity
                      key={b.id}
                      onPress={() => nav.navigate('BirdDetail', { speciesId: b.id })}
                      activeOpacity={0.85}
                      style={styles.cardWrap}
                    >
                      <BirdCard
                        species={b}
                        rarity={rarity || 'UC'}
                        count={rec?.count}
                        size="sm"
                        unknown={!caught}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search" size={42} color={COLORS.muted} />
            <Text style={styles.emptyText}>找不到符合的鳥類</Text>
            <Text style={styles.emptyHint}>調整篩選或到 NOTION 同步更多資料</Text>
          </View>
        }
      />
    </View>
  );
}

function Chip({
  label, active, onPress, dotColor,
}: { label: string; active: boolean; onPress: () => void; dotColor?: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      activeOpacity={0.8}
    >
      {dotColor && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dotColor }} />}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerSub: { color: COLORS.neon, fontSize: 10, letterSpacing: 3, fontWeight: '900' },
  headerTitle: { color: COLORS.text, fontSize: 26, fontWeight: '900', letterSpacing: 2, marginTop: 2 },
  levelPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.surface, borderColor: COLORS.yellow + '55', borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  levelText: { color: COLORS.yellow, fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  galleryHeaderBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.surface, borderColor: COLORS.neon + '55', borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  galleryHeaderBtnText: { color: COLORS.neon, fontWeight: '900', fontSize: 11, letterSpacing: 1 },

  progressCard: {
    marginTop: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 14, padding: 12,
    borderColor: COLORS.border, borderWidth: 1,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center' },
  progressItem: { flex: 1, alignItems: 'center', gap: 2 },
  progressLabel: { color: COLORS.muted, fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  progressNum: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  progressNumDim: { color: COLORS.muted, fontWeight: '600', fontSize: 12 },
  divV: { width: 1, height: 28, backgroundColor: COLORS.border },
  track: { height: 5, backgroundColor: COLORS.surfaceAlt, borderRadius: 3, overflow: 'hidden', marginTop: 10 },
  trackFill: { height: '100%' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 14, marginTop: 12,
    paddingHorizontal: 12, height: 42,
    backgroundColor: COLORS.surface, borderRadius: 12,
    borderColor: COLORS.border, borderWidth: 1,
  },
  search: { flex: 1, color: COLORS.text, fontSize: 13 },

  chipRow: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8, gap: 6, alignItems: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1,
    backgroundColor: COLORS.surface, borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.neon + '22', borderColor: COLORS.neon },
  chipText: { color: COLORS.muted, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  chipTextActive: { color: COLORS.neon },
  chipDivider: { width: 1, height: 16, backgroundColor: COLORS.border, marginHorizontal: 4 },

  packHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 4, marginBottom: 10,
  },
  packBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.neon + '22',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, borderWidth: 1, borderColor: COLORS.neon + '55',
  },
  packBadgeText: { color: COLORS.neon, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  packTitle: { color: COLORS.text, fontSize: 13, fontWeight: '900', letterSpacing: 1, flex: 1 },
  packCount: { color: COLORS.textSoft, fontSize: 12, fontWeight: '800' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' },
  cardWrap: { marginBottom: 4 },

  empty: { alignItems: 'center', padding: 40, gap: 8 },
  emptyText: { color: COLORS.text, fontSize: 14, fontWeight: '900' },
  emptyHint: { color: COLORS.muted, fontSize: 12, textAlign: 'center' },
});
