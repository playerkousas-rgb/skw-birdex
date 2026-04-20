import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { COLORS, Rarity, RARITY } from '../lib/theme';
import { useBirds } from '../lib/BirdContext';
import { FakemonCard, POSE_META, TYPE_META, BirdPose } from '../lib/fakemonEngine';
import { loadFakemonCards, clearFakemonCards } from '../lib/fakemonStore';
import { RootStackParamList } from '../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function FakemonGalleryScreen() {
  const nav = useNavigation<Nav>();
  const { allSpecies, getSpeciesRarity } = useBirds();
  const [cards, setCards] = useState<FakemonCard[]>([]);
  const [filterPose, setFilterPose] = useState<BirdPose | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const c = await loadFakemonCards();
    setCards(c);
  };

  useFocusEffect(React.useCallback(() => { load(); }, []));

  const filtered = useMemo(() => {
    if (filterPose === 'all') return cards;
    return cards.filter((c) => c.pose === filterPose);
  }, [cards, filterPose]);

  const poseCount: Record<string, number> = {};
  cards.forEach((c) => { poseCount[c.pose] = (poseCount[c.pose] || 0) + 1; });

  const totalFakemon = cards.length;
  const uniqueSpecies = new Set(cards.map((c) => c.speciesId)).size;

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#1A0F2E', '#05070F']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.topSub}>FAKEMON COLLECTION</Text>
            <Text style={styles.topTitle}>我的 Fakemon</Text>
          </View>
          <View style={styles.countBadge}>
            <Ionicons name="sparkles" size={12} color={COLORS.pink} />
            <Text style={styles.countText}>{totalFakemon}</Text>
          </View>
        </View>

        {/* 統計 */}
        <View style={styles.stats}>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: COLORS.pink }]}>{totalFakemon}</Text>
            <Text style={styles.statLabel}>總卡片</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: COLORS.neon }]}>{uniqueSpecies}</Text>
            <Text style={styles.statLabel}>不同鳥種</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: COLORS.purple }]}>
              {Object.keys(poseCount).length}
            </Text>
            <Text style={styles.statLabel}>姿態類型</Text>
          </View>
        </View>

        {/* 姿態篩選 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <TouchableOpacity
            style={[styles.filterChip, filterPose === 'all' && styles.filterActive]}
            onPress={() => setFilterPose('all')}
          >
            <Text style={[styles.filterText, filterPose === 'all' && { color: COLORS.pink }]}>
              全部 ({totalFakemon})
            </Text>
          </TouchableOpacity>
          {(Object.keys(POSE_META) as BirdPose[]).filter((p) => poseCount[p] > 0).map((p) => {
            const meta = POSE_META[p];
            return (
              <TouchableOpacity
                key={p}
                style={[
                  styles.filterChip,
                  filterPose === p && { borderColor: meta.color, backgroundColor: meta.color + '22' },
                ]}
                onPress={() => setFilterPose(p)}
              >
                <Ionicons name={meta.icon as any} size={11} color={filterPose === p ? meta.color : COLORS.textSoft} />
                <Text
                  style={[
                    styles.filterText,
                    filterPose === p && { color: meta.color },
                  ]}
                >
                  {meta.name} ({poseCount[p]})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.pink} />}
        >
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="sparkles-outline" size={48} color={COLORS.muted} />
              <Text style={styles.emptyTitle}>還沒有 Fakemon 卡</Text>
              <Text style={styles.emptyHint}>
                到「捕捉」頁拍下鳥類照片，{'\n'}AI 會自動幫你生成專屬 Fakemon！
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => nav.goBack()}
              >
                <LinearGradient colors={[COLORS.pink, COLORS.purple]} style={StyleSheet.absoluteFill} />
                <Ionicons name="camera" size={14} color="#fff" />
                <Text style={styles.emptyBtnText}>開始拍攝</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.grid}>
              {filtered.map((card) => {
                const species = allSpecies.find((s) => s.id === card.speciesId);
                if (!species) return null;
                const rarity = getSpeciesRarity(species.id) || 'UC';
                const meta = RARITY[rarity];
                const poseMeta = POSE_META[card.pose];
                return (
                  <TouchableOpacity
                    key={card.id}
                    style={[
                      styles.card,
                      { borderColor: meta.color, shadowColor: meta.glow },
                    ]}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={meta.gradient}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    {/* 頂部 */}
                    <View style={styles.cardTop}>
                      <Text style={styles.cardNo}>#{String(species.id).padStart(3, '0')}</Text>
                      <View style={styles.hpPill}>
                        <Text style={styles.hpText}>HP {card.hp}</Text>
                      </View>
                    </View>
                    {/* 圖 */}
                    <View style={[styles.cardArt, { backgroundColor: species.baseColor + '44' }]}>
                      <Text style={{ fontSize: 42 }}>{species.emoji}</Text>
                      <View style={styles.poseTag}>
                        <Ionicons name={poseMeta.icon as any} size={8} color="#fff" />
                        <Text style={styles.poseTagText}>{poseMeta.name}</Text>
                      </View>
                    </View>
                    {/* 名字 */}
                    <Text style={styles.cardName} numberOfLines={1}>{species.name}</Text>
                    {/* 屬性 */}
                    <View style={styles.typesRow}>
                      {card.types.slice(0, 2).map((t) => {
                        const tm = TYPE_META[t];
                        return (
                          <View key={t} style={[styles.typePill, { backgroundColor: tm.color }]}>
                            <Text style={styles.typePillText}>{tm.emoji}</Text>
                          </View>
                        );
                      })}
                    </View>
                    {/* 底部 */}
                    <View style={styles.cardFoot}>
                      <Text style={styles.rarityLabel}>{rarity}</Text>
                      <Text style={styles.timeLabel}>
                        {new Date(card.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* 說明卡 */}
          {filtered.length > 0 && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={14} color={COLORS.pink} />
              <Text style={styles.infoText}>
                每張 Fakemon 都是 AI 根據你的拍攝照片即時生成的專屬卡。
                同一隻鳥拍不同姿態會產生不同造型的 Fakemon！
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  topSub: { color: COLORS.pink, fontSize: 10, letterSpacing: 3, fontWeight: '900' },
  topTitle: { color: COLORS.text, fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  countBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.surface, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: COLORS.pink + '55',
  },
  countText: { color: COLORS.pink, fontSize: 13, fontWeight: '900' },

  stats: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 14, marginVertical: 10,
    backgroundColor: COLORS.surface, borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontSize: 20, fontWeight: '900' },
  statLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  statDiv: { width: 1, height: 28, backgroundColor: COLORS.border },

  filterRow: { paddingHorizontal: 14, paddingBottom: 8, gap: 5 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1, borderColor: COLORS.border,
  },
  filterActive: { borderColor: COLORS.pink, backgroundColor: COLORS.pink + '22' },
  filterText: { color: COLORS.textSoft, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 8, justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    borderRadius: 12, padding: 8,
    borderWidth: 2, overflow: 'hidden',
    shadowOpacity: 0.7, shadowRadius: 8,
    marginBottom: 4,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 6,
  },
  cardNo: { color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  hpPill: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  hpText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  cardArt: {
    aspectRatio: 1.2,
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    position: 'relative', marginBottom: 6,
  },
  poseTag: {
    position: 'absolute', bottom: 4, left: 4,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3,
  },
  poseTagText: { color: '#fff', fontSize: 8, fontWeight: '900' },
  cardName: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  typesRow: { flexDirection: 'row', gap: 3, marginTop: 3 },
  typePill: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  typePillText: { fontSize: 10 },
  cardFoot: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 4, paddingTop: 4,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)',
  },
  rarityLabel: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  timeLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 8 },

  empty: {
    alignItems: 'center', padding: 40, gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  emptyTitle: { color: COLORS.text, fontSize: 14, fontWeight: '900' },
  emptyHint: { color: COLORS.muted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12,
    overflow: 'hidden', marginTop: 10,
  },
  emptyBtnText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },

  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: COLORS.surface, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: COLORS.pink + '33',
    marginTop: 14,
  },
  infoText: { color: COLORS.textSoft, fontSize: 11, fontWeight: '600', lineHeight: 17, flex: 1 },
});
