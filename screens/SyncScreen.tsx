import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { COLORS, RARITY, RARITY_ORDER } from '../lib/theme';
import { useBirds } from '../lib/BirdContext';
import { NOTION_MODULES, INTERNAL_SPECIES } from '../lib/birdData';
import { RootStackParamList } from '../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SyncScreen() {
  const nav = useNavigation<Nav>();
  const {
    syncFromNotion, syncHistory, allSpecies,
    internalCount, remoteCount, lastSyncAt, remoteOverrides,
  } = useBirds();
  const [syncing, setSyncing] = useState(false);

  const aiRecognizable = allSpecies.filter((s) => s.aiRecognizable).length;
  const aiNotRecognizable = allSpecies.length - aiRecognizable;

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await syncFromNotion();
      Alert.alert(
        '✓ SYNC COMPLETE',
        res.updated > 0 || res.added > 0
          ? `更新 ${res.updated} 筆 · 新增 ${res.added} 筆\n後台資料將優先使用`
          : '已為最新版本',
      );
    } catch {
      Alert.alert('✗ SYNC FAILED', '連線失敗，將使用內建資料');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <LinearGradient colors={['#12152E', '#05070F']} style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerSub}>NOTION BACKEND</Text>
              <Text style={styles.headerTitle}>後台管理</Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>READY</Text>
            </View>
          </View>
          <Text style={styles.headerDesc}>
            內建 30 種鳥已可直接玩 · 後台更新時優先使用新版本
          </Text>
        </LinearGradient>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* 資料狀態總覽 */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewRow}>
            <View style={styles.overviewItem}>
              <Ionicons name="cube" size={20} color={COLORS.neon} />
              <Text style={styles.overviewNum}>{internalCount}</Text>
              <Text style={styles.overviewLabel}>內建鳥種</Text>
              <Text style={styles.overviewSub}>App 啟動即可用</Text>
            </View>
            <View style={styles.divV} />
            <View style={styles.overviewItem}>
              <Ionicons name="cloud-done" size={20} color={COLORS.purple} />
              <Text style={[styles.overviewNum, { color: COLORS.purple }]}>{remoteCount}</Text>
              <Text style={styles.overviewLabel}>後台覆蓋</Text>
              <Text style={styles.overviewSub}>Notion 最新版本</Text>
            </View>
            <View style={styles.divV} />
            <View style={styles.overviewItem}>
              <Ionicons name="albums" size={20} color={COLORS.green} />
              <Text style={[styles.overviewNum, { color: COLORS.green }]}>{allSpecies.length}</Text>
              <Text style={styles.overviewLabel}>合併總數</Text>
              <Text style={styles.overviewSub}>實際可玩</Text>
            </View>
          </View>
          <View style={styles.lastSync}>
            <Ionicons name="time" size={11} color={COLORS.muted} />
            <Text style={styles.lastSyncText}>
              {lastSyncAt
                ? `上次同步：${new Date(lastSyncAt).toLocaleString()}`
                : '尚未從 Notion 同步 · 使用內建資料'}
            </Text>
          </View>
        </View>

        {/* 同步按鈕 */}
        <TouchableOpacity
          style={[styles.syncBtn, syncing && { opacity: 0.6 }]}
          onPress={handleSync}
          disabled={syncing}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[COLORS.neon, COLORS.purple]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.syncBtnInner}
          >
            {syncing ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.syncBtnText}>FETCHING FROM NOTION...</Text>
              </>
            ) : (
              <>
                <Ionicons name="sync" size={18} color="#fff" />
                <Text style={styles.syncBtnText}>從 NOTION 拉取最新資料</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.howItWorks}>
          <Ionicons name="information-circle" size={14} color={COLORS.neon} />
          <Text style={styles.howText}>
            🔄 運作機制：同 ID 資料以後台為準，後台新增的鳥種會自動加入圖鑑。即使網路失敗，內建資料仍可正常使用。
          </Text>
        </View>

        {/* Notion 可管理的 7 個模組 */}
        <Text style={styles.sectionTitle}>NOTION 可管理的資料模組</Text>
        <View style={styles.modulesGrid}>
          {NOTION_MODULES.map((m) => (
            <View
              key={m.key}
              style={[styles.moduleCard, { borderColor: m.color + '55', shadowColor: m.color }]}
            >
              <View style={[styles.moduleIcon, { backgroundColor: m.color + '22' }]}>
                <Ionicons name={m.icon as any} size={20} color={m.color} />
              </View>
              <Text style={styles.moduleName}>{m.name}</Text>
              <Text style={styles.moduleDesc}>{m.desc}</Text>
              <View style={styles.moduleFooter}>
                <Text style={[styles.moduleCount, { color: m.color }]}>{m.count} 筆</Text>
                <View style={styles.moduleFields}>
                  <Ionicons name="code" size={10} color={COLORS.muted} />
                  <Text style={styles.moduleFieldsText}>{m.fields.length} 個欄位</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* 已覆蓋的鳥種清單 */}
        {remoteCount > 0 && (
          <>
            <Text style={styles.sectionTitle}>REMOTE OVERRIDES · 後台已覆蓋</Text>
            <View style={styles.overrideCard}>
              {Object.values(remoteOverrides).map((s) => (
                <View key={s.id} style={styles.overrideRow}>
                  <Text style={styles.overrideEmoji}>{s.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.overrideName}>
                      #{String(s.id).padStart(3, '0')} {s.name}
                    </Text>
                    <Text style={styles.overrideMeta}>
                      更新於 {new Date(s.lastUpdated).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.remotePill}>
                    <Ionicons name="cloud-done" size={10} color={COLORS.purple} />
                    <Text style={styles.remotePillText}>REMOTE</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* AI 辨識統計 */}
        <Text style={styles.sectionTitle}>AI 辨識能力總覽</Text>
        <View style={styles.aiOverview}>
          <View style={[styles.aiBox, { borderColor: COLORS.green + '55' }]}>
            <Ionicons name="checkmark-circle" size={22} color={COLORS.green} />
            <Text style={[styles.aiNum, { color: COLORS.green }]}>{aiRecognizable}</Text>
            <Text style={styles.aiLabel}>可辨識</Text>
            <Text style={styles.aiHint}>拍到即自動發卡</Text>
          </View>
          <View style={[styles.aiBox, { borderColor: COLORS.purple + '55' }]}>
            <Ionicons name="dice" size={22} color={COLORS.purple} />
            <Text style={[styles.aiNum, { color: COLORS.purple }]}>{aiNotRecognizable}</Text>
            <Text style={styles.aiLabel}>轉為抽卡</Text>
            <Text style={styles.aiHint}>AI 無法辨識時觸發</Text>
          </View>
        </View>

        {/* 辨識技術說明 */}
        <View style={styles.techCard}>
          <View style={styles.techHeader}>
            <Ionicons name="flash" size={14} color={COLORS.yellow} />
            <Text style={styles.techTitle}>AI 辨識方案對照</Text>
          </View>
          <TechRow method="雲端 API" desc="Google Vision / Merlin Bird ID" badge="推薦" color={COLORS.green} />
          <TechRow method="端側 TF.js" desc="預訓練模型 10-30MB 離線用" color={COLORS.neon} />
          <TechRow method="人工審核" desc="家長 / 老師確認後標記" color={COLORS.purple} />
          <TechRow method="目前版本" desc="模擬辨識 · 70% 成功率" badge="Demo" color={COLORS.yellow} last />
        </View>

        {/* 稀有度對照表 */}
        <Text style={styles.sectionTitle}>稀有度升級門檻</Text>
        <View style={styles.rarityTable}>
          {RARITY_ORDER.map((r) => {
            const meta = RARITY[r];
            return (
              <View key={r} style={styles.rarityTableRow}>
                <LinearGradient
                  colors={meta.gradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.rarityChip, { shadowColor: meta.glow, borderColor: meta.color }]}
                >
                  <Text style={styles.rarityChipText}>{meta.label}</Text>
                </LinearGradient>
                <Text style={styles.rarityRowName}>{meta.cn}</Text>
                <View style={styles.rarityRowThreshold}>
                  <Ionicons name="camera" size={11} color={COLORS.muted} />
                  <Text style={styles.rarityRowThresholdText}>{meta.threshold} 次</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* 同步歷史 */}
        <Text style={styles.sectionTitle}>SYNC LOG</Text>
        {syncHistory.map((e, i) => (
          <View key={i} style={styles.logRow}>
            <View
              style={[
                styles.logDot,
                {
                  backgroundColor:
                    e.status === 'success' ? COLORS.green
                    : e.status === 'pending' ? COLORS.yellow
                    : COLORS.danger,
                },
              ]}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.logTitle}>
                {e.type === 'species' ? `物種資料 · ${e.changes} 筆` : `模組 ${e.moduleKey} · ${e.changes} 筆`}
              </Text>
              <Text style={styles.logMeta}>
                {new Date(e.ts).toLocaleString()} · {e.source}
              </Text>
            </View>
            <Ionicons
              name={e.status === 'success' ? 'checkmark-circle' : 'close-circle'}
              size={18}
              color={e.status === 'success' ? COLORS.green : COLORS.danger}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function TechRow({
  method, desc, badge, color, last,
}: { method: string; desc: string; badge?: string; color: string; last?: boolean }) {
  return (
    <View style={[techStyles.row, !last && techStyles.border]}>
      <View style={[techStyles.dot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={techStyles.method}>{method}</Text>
        <Text style={techStyles.desc}>{desc}</Text>
      </View>
      {badge && (
        <View style={[techStyles.badge, { backgroundColor: color + '22', borderColor: color }]}>
          <Text style={[techStyles.badgeText, { color }]}>{badge}</Text>
        </View>
      )}
    </View>
  );
}

const techStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  border: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dot: { width: 6, height: 6, borderRadius: 3 },
  method: { color: COLORS.text, fontSize: 13, fontWeight: '900' },
  desc: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, borderWidth: 1 },
  badgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerSub: { color: COLORS.neon, fontSize: 10, letterSpacing: 3, fontWeight: '900' },
  headerTitle: { color: COLORS.text, fontSize: 24, fontWeight: '900', letterSpacing: 2, marginTop: 2 },
  headerDesc: { color: COLORS.textSoft, fontSize: 12, marginTop: 8, lineHeight: 18 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
    borderWidth: 1, borderColor: COLORS.green + '55',
  },
  statusDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.green },
  statusText: { color: COLORS.green, fontSize: 10, fontWeight: '900', letterSpacing: 2 },

  overviewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14, padding: 14,
    borderColor: COLORS.border, borderWidth: 1,
    marginBottom: 12,
  },
  overviewRow: { flexDirection: 'row', alignItems: 'center' },
  overviewItem: { flex: 1, alignItems: 'center', gap: 2 },
  overviewNum: { color: COLORS.neon, fontSize: 22, fontWeight: '900' },
  overviewLabel: { color: COLORS.text, fontSize: 11, fontWeight: '800' },
  overviewSub: { color: COLORS.muted, fontSize: 9, fontWeight: '700' },
  divV: { width: 1, height: 56, backgroundColor: COLORS.border },
  lastSync: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  lastSyncText: { color: COLORS.muted, fontSize: 11, fontWeight: '600' },

  syncBtn: {
    borderRadius: 14, overflow: 'hidden',
    shadowColor: COLORS.neon, shadowOpacity: 0.4, shadowRadius: 10,
    marginBottom: 10,
  },
  syncBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 14,
  },
  syncBtnText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

  howItWorks: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    padding: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.neon + '33',
    marginBottom: 20,
  },
  howText: { color: COLORS.textSoft, fontSize: 11, lineHeight: 17, fontWeight: '600', flex: 1 },

  sectionTitle: {
    color: COLORS.textSoft, fontSize: 11, fontWeight: '900',
    letterSpacing: 3, marginBottom: 10, marginTop: 4,
  },

  modulesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    marginBottom: 20,
  },
  moduleCard: {
    width: '48.5%',
    backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 12,
    borderWidth: 1,
    shadowOpacity: 0.2, shadowRadius: 6,
  },
  moduleIcon: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  moduleName: { color: COLORS.text, fontSize: 13, fontWeight: '900' },
  moduleDesc: { color: COLORS.muted, fontSize: 10, marginTop: 3, lineHeight: 14, fontWeight: '600' },
  moduleFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 8, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  moduleCount: { fontSize: 12, fontWeight: '900' },
  moduleFields: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  moduleFieldsText: { color: COLORS.muted, fontSize: 9, fontWeight: '700' },

  overrideCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14, padding: 10,
    borderColor: COLORS.purple + '55', borderWidth: 1,
    marginBottom: 18,
  },
  overrideRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  overrideEmoji: { fontSize: 22 },
  overrideName: { color: COLORS.text, fontSize: 13, fontWeight: '900' },
  overrideMeta: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  remotePill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: COLORS.purple + '22',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5,
    borderWidth: 1, borderColor: COLORS.purple,
  },
  remotePillText: { color: COLORS.purple, fontSize: 8, fontWeight: '900', letterSpacing: 1 },

  aiOverview: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  aiBox: {
    flex: 1, alignItems: 'center', gap: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 14, padding: 14,
    borderWidth: 1,
  },
  aiNum: { fontSize: 26, fontWeight: '900' },
  aiLabel: { color: COLORS.text, fontSize: 12, fontWeight: '800' },
  aiHint: { color: COLORS.muted, fontSize: 10, fontWeight: '600' },

  techCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14, padding: 12,
    borderColor: COLORS.border, borderWidth: 1,
    marginBottom: 20,
  },
  techHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  techTitle: { color: COLORS.text, fontSize: 12, fontWeight: '900', letterSpacing: 1 },

  rarityTable: {
    backgroundColor: COLORS.surface,
    borderRadius: 14, padding: 10,
    borderColor: COLORS.border, borderWidth: 1,
    marginBottom: 18,
  },
  rarityTableRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 5,
  },
  rarityChip: {
    width: 44, height: 24, borderRadius: 5,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, overflow: 'hidden',
    shadowOpacity: 0.6, shadowRadius: 4,
  },
  rarityChipText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  rarityRowName: { color: COLORS.text, fontSize: 12, fontWeight: '800', flex: 1 },
  rarityRowThreshold: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rarityRowThresholdText: { color: COLORS.textSoft, fontSize: 11, fontWeight: '700' },

  logRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.surface, borderRadius: 10, padding: 10,
    borderColor: COLORS.border, borderWidth: 1,
    marginBottom: 6,
  },
  logDot: { width: 8, height: 8, borderRadius: 4 },
  logTitle: { color: COLORS.text, fontSize: 12, fontWeight: '800' },
  logMeta: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
});
