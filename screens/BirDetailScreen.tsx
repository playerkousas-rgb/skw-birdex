import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  COLORS, Rarity, RARITY, RARITY_ORDER,
  getRarityByCount, getNextRarityInfo,
} from '../lib/theme';
import { useBirds } from '../lib/BirdContext';
import HoloBirdCard from '../components/HoloBirdCard';
import RarityBadge from '../components/RarityBadge';
import { RootStackParamList } from '../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function BirdDetailScreen() {
  const [flipped, setFlipped] = useState(false);
  const route = useRoute<RouteProp<RootStackParamList, 'BirdDetail'>>();
  const nav = useNavigation<Nav>();
  const { allSpecies, isCaught, getRecord } = useBirds();
  const species = allSpecies.find((s) => s.id === route.params.speciesId)!;
  const captured = isCaught(species.id);
  const rec = getRecord(species.id);
  const rarity = rec ? getRarityByCount(rec.count) : 'UC';
  const next = rec ? getNextRarityInfo(rec.count) : { needed: RARITY.C.threshold, progress: 0 };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[species.baseColor + '66', '#0A0E1F', '#05070F']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.iconBtn}>
            <Ionicons name="chevron-down" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>資料卡 · Notion SYNCED</Text>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="share-outline" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Hero 卡片 */}
          <View style={styles.hero}>
            <Text style={styles.bigNo}>#{String(species.id).padStart(3, '0')}</Text>
            <HoloBirdCard
              species={species}
              rarity={rarity}
              count={rec?.count}
              size="lg"
              unknown={!captured}
              flipped={flipped}
              onFlip={captured ? () => setFlipped(!flipped) : undefined}
            />
          </View>

          {captured ? (
            <>
              {/* 稀有度進化進度 */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="trending-up" size={16} color={RARITY[rarity].color} />
                  <Text style={styles.sectionTitle}>CARD EVOLUTION</Text>
                </View>

                <View style={styles.evolutionCard}>
                  {/* 目前 / 下一級 */}
                  <View style={styles.evoRow}>
                    <View style={styles.evoItem}>
                      <Text style={styles.evoLabel}>當前</Text>
                      <RarityBadge rarity={rarity} size="md" showStars />
                    </View>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.muted} />
                    <View style={styles.evoItem}>
                      <Text style={styles.evoLabel}>下一階</Text>
                      {next.next ? (
                        <RarityBadge rarity={next.next} size="md" showStars />
                      ) : (
                        <View style={styles.maxPill}>
                          <Ionicons name="star" size={12} color={COLORS.yellow} />
                          <Text style={styles.maxText}>MAX</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.evoItem}>
                      <Text style={styles.evoLabel}>還需</Text>
                      <Text style={styles.evoNeed}>
                        {next.next ? `+${next.needed}` : '已滿級'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.evoTrack}>
                    <LinearGradient
                      colors={[RARITY[rarity].color, next.next ? RARITY[next.next].color : COLORS.yellow]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={[styles.evoFill, { width: `${next.progress * 100}%` }]}
                    />
                  </View>

                  {/* 所有等級進度條 */}
                  <View style={styles.tierList}>
                    {RARITY_ORDER.map((r) => {
                      const meta = RARITY[r];
                      const achieved = rec!.count >= meta.threshold;
                      return (
                        <View key={r} style={[styles.tierRow, !achieved && styles.tierRowLocked]}>
                          <View style={{ width: 44 }}>
                            <RarityBadge rarity={r} size="sm" />
                          </View>
                          <Text style={[styles.tierLabel, !achieved && { color: COLORS.muted }]}>
                            {meta.cn}
                          </Text>
                          <Text style={[styles.tierThreshold, !achieved && { color: COLORS.muted }]}>
                            {meta.threshold} 次
                          </Text>
                          {achieved ? (
                            <Ionicons name="checkmark-circle" size={14} color={COLORS.green} />
                          ) : (
                            <Ionicons name="lock-closed" size={12} color={COLORS.muted} />
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* 有趣小知識 */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="bulb" size={16} color={COLORS.yellow} />
                  <Text style={styles.sectionTitle}>FUN FACT</Text>
                </View>
                <View style={styles.factCard}>
                  <Text style={styles.factText}>{species.funFact}</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.lockedBanner}>
              <Ionicons name="lock-closed" size={20} color={COLORS.muted} />
              <Text style={styles.lockedText}>
                尚未捕捉 · 拍到這種鳥才能查看完整資料
              </Text>
            </View>
          )}

          {/* 資料卡內容結構（Notion 展示） */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={16} color={COLORS.neon} />
              <Text style={styles.sectionTitle}>BIRD DATA SHEET</Text>
              <View style={styles.notionTag}>
                <Ionicons name="cloud-done" size={10} color={COLORS.green} />
                <Text style={styles.notionTagText}>Notion</Text>
              </View>
            </View>

            <View style={styles.dataSheet}>
              <DataRow label="鳥名" value={species.name} />
              <DataRow label="學名" value={species.scientificName} italic />
              <DataRow label="科別" value={species.family} />
              <DataRow label="目" value={species.order} />
              <DataRow label="體長" value={species.size} />
              <DataRow label="棲地" value={species.habitat.join('、')} />
              <DataRow label="食性" value={species.diet} />
              <DataRow label="鳴聲" value={species.call} />
              <DataRow label="分布" value={species.region} />
              <DataRow label="季節" value={species.season} />
              {captured && <DataRow label="特徵" value={species.features} />}
              <DataRow
                label="AI 辨識"
                value={
                  species.aiRecognizable
                    ? `可辨識 (${Math.round((species.aiConfidence || 0) * 100)}%)`
                    : '不可辨識 → 自動抽卡'
                }
                valueColor={species.aiRecognizable ? COLORS.green : COLORS.purple}
              />
              <DataRow label="Notion ID" value={species.notionId} mono />
              <DataRow label="資料包" value={`Pack ${species.pack}`} last />
            </View>
          </View>

          {/* 生態描述 */}
          {captured && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="reader" size={16} color={COLORS.purple} />
                <Text style={styles.sectionTitle}>DESCRIPTION</Text>
              </View>
              <Text style={styles.description}>{species.description}</Text>
            </View>
          )}

          {/* 捕捉統計 */}
          {captured && rec && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="stats-chart" size={16} color={COLORS.green} />
                <Text style={styles.sectionTitle}>CAPTURE STATS</Text>
              </View>
              <View style={styles.statsRow}>
                <StatBox label="總捕捉" value={rec.count} icon="camera" color={COLORS.neon} />
                <StatBox label="拍攝次數" value={rec.photosCount} icon="image" color={COLORS.purple} />
                <StatBox
                  label="首捕日期"
                  valueStr={new Date(rec.firstCaughtAt).toLocaleDateString()}
                  icon="calendar"
                  color={COLORS.yellow}
                />
              </View>
            </View>
          )}

          {/* Tags */}
          {captured && (
            <View style={styles.section}>
              <View style={styles.tagWrap}>
                {species.tags.map((t) => (
                  <View key={t} style={styles.tag}>
                    <Text style={styles.tagText}>#{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ⭐ 資料來源 */}
          {captured && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="link" size={16} color={COLORS.green} />
                <Text style={styles.sectionTitle}>資料來源</Text>
                <View style={styles.sourceCountPill}>
                  <Text style={styles.sourceCountText}>{COMMON_SOURCES.length}</Text>
                </View>
              </View>
              <Text style={styles.sourceHint}>
                想知道更多？點擊以下連結查找詳細鳥類資料
              </Text>
              {COMMON_SOURCES.map((src, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.sourceRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    Linking.openURL(src.url).catch(() =>
                      Alert.alert('無法開啟連結', src.url)
                    );
                  }}
                >
                  <View
                    style={[
                      styles.sourceIcon,
                      { backgroundColor: sourceTypeColor(src.type) + '22', borderColor: sourceTypeColor(src.type) },
                    ]}
                  >
                    <Ionicons name={sourceTypeIcon(src.type)} size={14} color={sourceTypeColor(src.type)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sourceName}>{src.name}</Text>
                    {src.desc && <Text style={styles.sourceDesc}>{src.desc}</Text>}
                    <Text style={styles.sourceUrl}>{src.url}</Text>
                  </View>
                  <Ionicons name="open-outline" size={16} color={COLORS.muted} />
                </TouchableOpacity>
              ))}

              {/* 直接搜尋此鳥按鈕 */}
              <TouchableOpacity
                style={styles.quickSearchBtn}
                onPress={() => {
                  const q = encodeURIComponent(species.scientificName);
                  Linking.openURL(`https://ebird.org/species/${species.merlinCode || ''}`).catch(() =>
                    Linking.openURL(`https://www.google.com/search?q=${q}`)
                  );
                }}
              >
                <Ionicons name="search" size={14} color={COLORS.neon} />
                <Text style={styles.quickSearchText}>
                  搜尋「{species.name}」更多資料
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Copyright */}
          <View style={styles.copyright}>
            <Text style={styles.copyrightText}>
              © 2026 SKWSCOUT · 所有資料僅供教育用途
            </Text>
            <Text style={styles.copyrightSub}>
              資料來源：Merlin Bird ID / eBird / HKBWS / iNaturalist
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function sourceTypeIcon(type: string): any {
  switch (type) {
    case 'official': return 'shield-checkmark';
    case 'academic': return 'school';
    case 'community': return 'people';
    case 'media': return 'newspaper';
    default: return 'link';
  }
}
function sourceTypeColor(type: string): string {
  switch (type) {
    case 'official': return COLORS.green;
    case 'academic': return COLORS.purple;
    case 'community': return COLORS.neon;
    case 'media': return COLORS.yellow;
    default: return COLORS.textSoft;
  }
}

function DataRow({
  label, value, italic, mono, last, valueColor,
}: {
  label: string; value: string; italic?: boolean; mono?: boolean; last?: boolean; valueColor?: string;
}) {
  return (
    <View style={[dataStyles.row, !last && dataStyles.border]}>
      <Text style={dataStyles.label}>{label}</Text>
      <Text
        style={[
          dataStyles.value,
          italic && { fontStyle: 'italic' },
          mono && { fontFamily: 'monospace', fontSize: 11 },
          valueColor && { color: valueColor },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const dataStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, gap: 12 },
  border: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  label: { color: COLORS.muted, fontSize: 12, fontWeight: '700', width: 80 },
  value: { color: COLORS.text, fontSize: 12, fontWeight: '700', flex: 1, textAlign: 'right' },
});

function StatBox({
  label, value, valueStr, icon, color,
}: { label: string; value?: number; valueStr?: string; icon: any; color: string }) {
  return (
    <View style={[statStyles.box, { borderColor: color + '55' }]}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={statStyles.label}>{label}</Text>
      <Text style={statStyles.val}>{valueStr ?? value}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  box: {
    flex: 1, backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 10, gap: 4, alignItems: 'center',
    borderWidth: 1,
  },
  label: { color: COLORS.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  val: { color: COLORS.text, fontSize: 14, fontWeight: '900' },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 6,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { color: COLORS.text, fontSize: 11, fontWeight: '900', letterSpacing: 2 },

  hero: { alignItems: 'center', paddingVertical: 16, position: 'relative' },
  bigNo: {
    position: 'absolute', top: 10,
    color: 'rgba(255,255,255,0.04)', fontSize: 120,
    fontWeight: '900', letterSpacing: 4,
  },

  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionTitle: { color: COLORS.text, fontSize: 12, fontWeight: '900', letterSpacing: 2, flex: 1 },
  notionTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.green + '22',
    borderColor: COLORS.green + '55', borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  notionTagText: { color: COLORS.green, fontSize: 9, fontWeight: '900', letterSpacing: 1 },

  evolutionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14, padding: 12,
    borderColor: COLORS.border, borderWidth: 1,
  },
  evoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  evoItem: { flex: 1, alignItems: 'center', gap: 4 },
  evoLabel: { color: COLORS.muted, fontSize: 9, letterSpacing: 2, fontWeight: '900' },
  evoNeed: { color: COLORS.yellow, fontSize: 15, fontWeight: '900' },
  maxPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.yellow + '22',
    borderColor: COLORS.yellow, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
  },
  maxText: { color: COLORS.yellow, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  evoTrack: { height: 6, backgroundColor: COLORS.surfaceAlt, borderRadius: 3, overflow: 'hidden' },
  evoFill: { height: '100%' },

  tierList: { marginTop: 12, gap: 4 },
  tierRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 6, paddingHorizontal: 6,
    backgroundColor: COLORS.surfaceAlt, borderRadius: 8,
  },
  tierRowLocked: { opacity: 0.5 },
  tierLabel: { color: COLORS.text, fontSize: 12, fontWeight: '800', flex: 1 },
  tierThreshold: { color: COLORS.textSoft, fontSize: 11, fontWeight: '700' },

  factCard: {
    backgroundColor: COLORS.yellow + '11',
    borderLeftColor: COLORS.yellow, borderLeftWidth: 3,
    borderRadius: 10, padding: 12,
  },
  factText: { color: COLORS.text, fontSize: 13, lineHeight: 20, fontWeight: '600' },

  lockedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 10,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 10,
  },
  lockedText: { color: COLORS.textSoft, fontSize: 12, fontWeight: '700', flex: 1 },

  dataSheet: {
    backgroundColor: COLORS.surface,
    borderRadius: 14, padding: 14,
    borderColor: COLORS.border, borderWidth: 1,
  },

  description: {
    color: COLORS.text, fontSize: 13, lineHeight: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 12,
    borderColor: COLORS.border, borderWidth: 1,
  },

  statsRow: { flexDirection: 'row', gap: 8 },

  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  // 資料來源
  sourceCountPill: {
    backgroundColor: COLORS.green + '22',
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 6, borderWidth: 1, borderColor: COLORS.green,
  },
  sourceCountText: { color: COLORS.green, fontSize: 10, fontWeight: '900' },
  sourceHint: { color: COLORS.muted, fontSize: 11, marginBottom: 8, fontWeight: '600' },
  sourceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 10,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 6,
  },
  sourceIcon: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  sourceName: { color: COLORS.text, fontSize: 13, fontWeight: '900' },
  sourceDesc: { color: COLORS.textSoft, fontSize: 11, marginTop: 2, fontWeight: '600' },
  sourceUrl: { color: COLORS.neon, fontSize: 9, fontFamily: 'monospace', marginTop: 3 },

  quickSearchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, marginTop: 6,
    backgroundColor: COLORS.neon + '11',
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.neon + '55',
  },
  quickSearchText: { color: COLORS.neon, fontSize: 12, fontWeight: '900', letterSpacing: 1 },

  copyright: {
    paddingHorizontal: 18, paddingTop: 24, alignItems: 'center', gap: 4,
  },
  copyrightText: { color: COLORS.textSoft, fontSize: 11, fontWeight: '700' },
  copyrightSub: { color: COLORS.muted, fontSize: 10, fontWeight: '600' },
  tag: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999, borderColor: COLORS.border, borderWidth: 1,
  },
  tagText: { color: COLORS.neon, fontSize: 11, fontWeight: '800' },
});
