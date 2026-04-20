import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  COLORS, Rarity, RARITY, RARITY_ORDER, TITLES, getNextTitle, getTitle,
} from '../lib/theme';
import { useBirds } from '../lib/BirdContext';
import { MEDALS, getEarnedMedals, CATEGORY_LABELS } from '../lib/medals';
import { RootStackParamList } from '../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const nav = useNavigation<Nav>();
  const {
    trainerName, setTrainerName, resetData,
    caughtSpeciesCount, totalSpeciesCount,
    allSpecies, getRecord, getSpeciesRarity, isCaught,
    xp, level, levelProgress, currentTitle,
    totalPhotos, totalRecognized, totalReviewed, remoteCount, internalCount,
    totalPhotosInAlbum,
  } = useBirds();

  const [editName, setEditName] = useState(false);
  const [nameInput, setNameInput] = useState(trainerName);
  const nextTitle = getNextTitle(caughtSpeciesCount);

  const byRarity = useMemo(() => {
    const m: Record<Rarity, number> = { UC: 0, C: 0, R: 0, SR: 0, SSR: 0, UR: 0, LR: 0 };
    allSpecies.forEach((s) => {
      const r = getSpeciesRarity(s.id);
      if (r) m[r] += 1;
    });
    return m;
  }, [allSpecies, getSpeciesRarity]);

  const recent = useMemo(() => {
    return Object.values(allSpecies)
      .filter((s) => isCaught(s.id))
      .map((s) => ({ species: s, rec: getRecord(s.id)! }))
      .sort((a, b) => b.rec.lastCaughtAt - a.rec.lastCaughtAt)
      .slice(0, 5);
  }, [allSpecies, isCaught, getRecord]);

  const recognitionRate = totalPhotos > 0 ? Math.round((totalRecognized / totalPhotos) * 100) : 0;

  // 計算已解鎖的紀念章
  const records = useMemo(() => {
    const m: Record<number, any> = {};
    allSpecies.forEach((s) => {
      const r = getRecord(s.id);
      if (r) m[s.id] = r;
    });
    return m;
  }, [allSpecies, getRecord]);

  const unlockedBadges = useMemo(
    () => getEarnedMedals({
      allSpecies, records, xp, totalPhotos,
      totalRecognized, totalReviewed: 0, getSpeciesRarity,
    }),
    [allSpecies, records, xp, totalPhotos, totalRecognized, getSpeciesRarity]
  );
  const unlockedIds = new Set(unlockedBadges.map((b) => b.id));

  const askReset = () => {
    Alert.alert(
      'RESET CONFIRM',
      '所有資料將被清除，確定繼續嗎？',
      [
        { text: '取消', style: 'cancel' },
        { text: '確定重置', style: 'destructive', onPress: resetData },
      ]
    );
  };

  const saveName = () => {
    if (nameInput.trim()) setTrainerName(nameInput.trim());
    setEditName(false);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <LinearGradient colors={['#12152E', '#05070F']} style={styles.header}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <LinearGradient
                colors={[COLORS.neon, COLORS.purple]}
                style={StyleSheet.absoluteFill}
              />
              <Text style={{ fontSize: 36 }}>🪶</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.trainerName}>{trainerName}</Text>
                <TouchableOpacity onPress={() => { setNameInput(trainerName); setEditName(true); }}>
                  <Ionicons name="create-outline" size={16} color={COLORS.textSoft} />
                </TouchableOpacity>
              </View>
              <View style={[styles.titleBar, { borderColor: currentTitle.color + '55', backgroundColor: currentTitle.color + '22' }]}>
                <Ionicons name={currentTitle.icon as any} size={12} color={currentTitle.color} />
                <Text style={[styles.titleText, { color: currentTitle.color }]}>
                  {currentTitle.name}
                </Text>
              </View>
              {nextTitle && (
                <Text style={styles.titleHint}>
                  再認識 {nextTitle.threshold - caughtSpeciesCount} 種鳥 → {nextTitle.name}
                </Text>
              )}
            </View>
          </View>

          {/* XP 條 */}
          <View style={styles.xpCard}>
            <View style={styles.xpHeader}>
              <View style={styles.xpLvPill}>
                <Ionicons name="trophy" size={12} color={COLORS.yellow} />
                <Text style={styles.xpLvText}>LV.{level}</Text>
              </View>
              <Text style={styles.xpText}>{xp} XP</Text>
              <Text style={styles.xpNext}>→ {levelProgress.xpToNext} XP</Text>
            </View>
            <View style={styles.xpTrack}>
              <LinearGradient
                colors={[COLORS.neon, COLORS.purple]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.xpFill, { width: `${levelProgress.ratio * 100}%` }]}
              />
            </View>
            <Text style={styles.xpHint}>
              拍攝 +10 · 新鳥種 +50 · 稀有度升級 +30 · 抽卡 +5
            </Text>
          </View>
        </LinearGradient>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* 統計 */}
        <View style={styles.statsRow}>
          <Stat value={caughtSpeciesCount} label="物種" color={COLORS.neon} icon="grid" />
          <Stat value={totalPhotos} label="拍攝" color={COLORS.purple} icon="camera" />
          <Stat value={`${recognitionRate}%`} label="辨識率" color={COLORS.green} icon="checkmark-done" />
          <Stat value={totalReviewed} label="已審核" color={COLORS.yellow} icon="checkmark-done-circle" />
        </View>

        {/* 稀有度卡片統計 */}
        <Text style={styles.sectionTitle}>COLLECTION BY RARITY</Text>
        <View style={styles.rarityCard}>
          {RARITY_ORDER.map((r) => {
            const meta = RARITY[r];
            const count = byRarity[r];
            return (
              <View key={r} style={styles.rarityStatRow}>
                <LinearGradient
                  colors={meta.gradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.rarityStatBadge, { shadowColor: meta.glow, borderColor: meta.color }]}
                >
                  <Text style={styles.rarityStatBadgeText}>{meta.label}</Text>
                </LinearGradient>
                <Text style={styles.rarityStatName}>{meta.cn}</Text>
                <View style={styles.rarityStatBar}>
                  <View
                    style={[
                      styles.rarityStatFill,
                      {
                        width: `${(count / Math.max(1, caughtSpeciesCount)) * 100}%`,
                        backgroundColor: meta.color,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.rarityStatCount, { color: meta.color }]}>{count}</Text>
              </View>
            );
          })}
        </View>

        {/* 職稱清單 */}
        {/* 紀念章 */}
        <Text style={styles.sectionTitle}>
          🏅 MEDALS · 紀念章 ({unlockedBadges.length}/{MEDALS.length})
        </Text>
        <View style={styles.badgeGrid}>
          {MEDALS.map((b) => {
            const unlocked = unlockedIds.has(b.id);
            return (
              <View
                key={b.id}
                style={[
                  styles.badgeCard,
                  unlocked && { borderColor: b.color + '88', shadowColor: b.color },
                ]}
              >
                <View
                  style={[
                    styles.badgeIcon,
                    unlocked && { backgroundColor: b.color + '33', borderColor: b.color },
                  ]}
                >
                  <Text style={[styles.badgeEmoji, !unlocked && { opacity: 0.25 }]}>
                    {unlocked ? b.icon : '🔒'}
                  </Text>
                </View>
                <Text
                  style={[styles.badgeName, !unlocked && { color: COLORS.muted }]}
                  numberOfLines={1}
                >
                  {b.name}
                </Text>
                <Text
                  style={[styles.badgeDesc, !unlocked && { opacity: 0.5 }]}
                  numberOfLines={2}
                >
                  {b.desc}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>TITLES · 依捕捉鳥種解鎖</Text>
        <View style={styles.titleList}>
          {TITLES.map((t) => {
            const unlocked = caughtSpeciesCount >= t.threshold;
            const isCurrent = currentTitle.name === t.name;
            return (
              <View
                key={t.name}
                style={[
                  styles.titleRow,
                  unlocked && { borderColor: t.color + '55' },
                  isCurrent && { backgroundColor: t.color + '22', borderColor: t.color },
                ]}
              >
                <View style={[styles.titleIconBox, { backgroundColor: unlocked ? t.color + '33' : COLORS.surfaceAlt }]}>
                  <Ionicons name={t.icon as any} size={18} color={unlocked ? t.color : COLORS.muted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.titleRowName, !unlocked && { color: COLORS.muted }]}>
                    {t.name}
                  </Text>
                  <Text style={styles.titleRowReq}>需要認識 {t.threshold} 種鳥</Text>
                </View>
                {isCurrent && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>CURRENT</Text>
                  </View>
                )}
                {unlocked && !isCurrent && (
                  <Ionicons name="checkmark-circle" size={16} color={t.color} />
                )}
                {!unlocked && <Ionicons name="lock-closed" size={14} color={COLORS.muted} />}
              </View>
            );
          })}
        </View>

        {/* 最近捕捉 */}
        <Text style={styles.sectionTitle}>RECENT CAPTURES</Text>
        {recent.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="camera-outline" size={32} color={COLORS.muted} />
            <Text style={styles.emptyText}>尚無捕捉紀錄</Text>
            <Text style={styles.emptyHint}>到 CAPTURE 頁面開始拍鳥</Text>
          </View>
        ) : (
          <View style={styles.recentCard}>
            {recent.map(({ species, rec }, i) => {
              const r = getSpeciesRarity(species.id)!;
              const meta = RARITY[r];
              return (
                <View key={species.id} style={[styles.recentRow, i < recent.length - 1 && styles.recentBorder]}>
                  <View
                    style={[
                      styles.recentIcon,
                      { backgroundColor: species.baseColor + '33', borderColor: species.baseColor },
                    ]}
                  >
                    <Text style={{ fontSize: 22 }}>{species.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recentName}>#{String(species.id).padStart(3, '0')} {species.name}</Text>
                    <Text style={styles.recentMeta}>
                      ×{rec.count} · {new Date(rec.lastCaughtAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <LinearGradient
                    colors={meta.gradient}
                    style={[styles.recentRarity, { borderColor: meta.color, shadowColor: meta.glow }]}
                  >
                    <Text style={styles.recentRarityText}>{meta.label}</Text>
                  </LinearGradient>
                </View>
              );
            })}
          </View>
        )}

        {/* 我的相冊 - 主打 */}
        <TouchableOpacity
          style={[styles.adminBtn, { borderColor: COLORS.green + '55' }]}
          onPress={() => nav.navigate('Album')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[COLORS.green + '33', COLORS.surface]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.adminIcon, { backgroundColor: COLORS.green + '33', borderColor: COLORS.green }]}>
            <Ionicons name="images" size={20} color={COLORS.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.adminTitle}>我的相冊</Text>
            <Text style={[styles.adminDesc, { color: COLORS.green }]}>
              {totalPhotosInAlbum} 張照片 · 儲存在本機
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.green} />
        </TouchableOpacity>

        {/* 快速入口 */}
        <Text style={styles.sectionTitle}>QUICK ACCESS</Text>

        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => nav.navigate('Map')}
          activeOpacity={0.85}
        >
          <View style={[styles.quickIcon, { backgroundColor: COLORS.neon + '22', borderColor: COLORS.neon }]}>
            <Ionicons name="map" size={18} color={COLORS.neon} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.quickTitle}>尋鳥地圖</Text>
            <Text style={styles.quickDesc}>香港觀鳥熱點 · 全球分布</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => nav.navigate('Gallery')}
          activeOpacity={0.85}
        >
          <View style={[styles.quickIcon, { backgroundColor: COLORS.yellow + '22', borderColor: COLORS.yellow }]}>
            <Ionicons name="albums" size={18} color={COLORS.yellow} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.quickTitle}>全部卡牌總覽</Text>
            <Text style={styles.quickDesc}>瀏覽 30 張卡 + 稀有度預覽</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
        </TouchableOpacity>

        {/* 後台入口 */}
        <TouchableOpacity
          style={[styles.quickBtn, { borderColor: COLORS.purple + '55', backgroundColor: COLORS.purple + '11' }]}
          onPress={() => nav.navigate('AdminLogin')}
          activeOpacity={0.85}
        >
          <View style={[styles.quickIcon, { backgroundColor: COLORS.purple + '22', borderColor: COLORS.purple }]}>
            <Ionicons name="shield-checkmark" size={18} color={COLORS.purple} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.quickTitle}>後台人員入口</Text>
            <Text style={[styles.quickDesc, { color: COLORS.purple }]}>家長/老師 · 超級管理員</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.purple} />
        </TouchableOpacity>

        {/* 下載原始碼 / 部署 */}
        <TouchableOpacity
          style={[styles.quickBtn, { borderColor: COLORS.neon + '55', backgroundColor: COLORS.neon + '11' }]}
          onPress={() => nav.navigate('Download')}
          activeOpacity={0.85}
        >
          <View style={[styles.quickIcon, { backgroundColor: COLORS.neon + '22', borderColor: COLORS.neon }]}>
            <Ionicons name="cloud-download" size={18} color={COLORS.neon} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.quickTitle}>下載原始碼 · 部署指南</Text>
            <Text style={[styles.quickDesc, { color: COLORS.neon }]}>ZIP / TAR.GZ · Vercel 部署</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.neon} />
        </TouchableOpacity>

        {/* 系統 */}
        <Text style={styles.sectionTitle}>SYSTEM</Text>
        <View style={styles.sysCard}>
          <SysRow icon="server" label="內建 / 後台" value={`${internalCount} / ${remoteCount}` } />
          <SysRow icon="cloud-done" label="AI 辨識成功" value={`${totalRecognized} 次`} />
          <SysRow icon="hourglass" label="待審核" value={`${totalReviewed} 次`} />
          <SysRow icon="image" label="總拍照數" value={`${totalPhotos} 張`} last />
        </View>

        <TouchableOpacity style={styles.resetBtn} onPress={askReset}>
          <Ionicons name="refresh-circle" size={18} color={COLORS.danger} />
          <Text style={styles.resetText}>RESET ALL DATA</Text>
        </TouchableOpacity>

        <View style={styles.footerBox}>
          <Text style={styles.footer}>© 2026 SKWSCOUT · BIRD-DEX v3.0</Text>
          <Text style={styles.footerSub}>Notion-powered · Made with ❤️ for Education</Text>
        </View>
      </ScrollView>

      <Modal visible={editName} transparent animationType="fade" onRequestClose={() => setEditName(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>EDIT TRAINER NAME</Text>
            <TextInput
              style={styles.modalInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="輸入名字..."
              placeholderTextColor={COLORS.muted}
              maxLength={12}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnGhost]}
                onPress={() => setEditName(false)}
              >
                <Text style={styles.modalBtnGhostText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={saveName}
              >
                <Text style={styles.modalBtnPrimaryText}>SAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Stat({ value, label, color, icon }: { value: number | string; label: string; color: string; icon: any }) {
  return (
    <View style={[statS.box, { borderColor: color + '55' }]}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[statS.value, { color }]}>{value}</Text>
      <Text style={statS.label}>{label}</Text>
    </View>
  );
}

const statS = StyleSheet.create({
  box: {
    flex: 1, backgroundColor: COLORS.surface,
    borderRadius: 12, paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, marginHorizontal: 3, gap: 2,
  },
  value: { fontSize: 18, fontWeight: '900' },
  label: { color: COLORS.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
});

function SysRow({ icon, label, value, last }: { icon: any; label: string; value: string; last?: boolean }) {
  return (
    <View style={[sysS.row, !last && sysS.border]}>
      <Ionicons name={icon} size={14} color={COLORS.textSoft} />
      <Text style={sysS.label}>{label}</Text>
      <Text style={sysS.value}>{value}</Text>
    </View>
  );
}

const sysS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  border: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  label: { color: COLORS.textSoft, fontSize: 12, fontWeight: '700', flex: 1 },
  value: { color: COLORS.text, fontSize: 12, fontWeight: '900' },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14 },
  profileRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    borderWidth: 2, borderColor: COLORS.neon,
    shadowColor: COLORS.neon, shadowOpacity: 0.6, shadowRadius: 10,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trainerName: { color: COLORS.text, fontSize: 20, fontWeight: '900' },
  titleBar: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', marginTop: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999, borderWidth: 1,
  },
  titleText: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  titleHint: { color: COLORS.muted, fontSize: 10, marginTop: 4, fontWeight: '600' },

  xpCard: {
    marginTop: 12, backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 12,
    borderColor: COLORS.border, borderWidth: 1,
  },
  xpHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  xpLvPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.yellow + '22', borderColor: COLORS.yellow + '55', borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  xpLvText: { color: COLORS.yellow, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  xpText: { color: COLORS.text, fontSize: 14, fontWeight: '900', flex: 1 },
  xpNext: { color: COLORS.muted, fontSize: 10, fontWeight: '800' },
  xpTrack: { height: 6, backgroundColor: COLORS.surfaceAlt, borderRadius: 3, overflow: 'hidden' },
  xpFill: { height: '100%' },
  xpHint: { color: COLORS.muted, fontSize: 10, marginTop: 6, fontWeight: '600' },

  statsRow: { flexDirection: 'row', marginHorizontal: -3, marginBottom: 16 },

  sectionTitle: {
    color: COLORS.textSoft, fontSize: 11, fontWeight: '900',
    letterSpacing: 3, marginBottom: 10, marginTop: 4,
  },

  rarityCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14, padding: 12,
    borderColor: COLORS.border, borderWidth: 1,
    marginBottom: 18,
  },
  rarityStatRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 5,
  },
  rarityStatBadge: {
    width: 40, height: 22, borderRadius: 5,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, overflow: 'hidden',
    shadowOpacity: 0.6, shadowRadius: 4,
  },
  rarityStatBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  rarityStatName: { color: COLORS.text, fontSize: 12, fontWeight: '800', width: 52 },
  rarityStatBar: { flex: 1, height: 6, backgroundColor: COLORS.surfaceAlt, borderRadius: 3, overflow: 'hidden' },
  rarityStatFill: { height: '100%' },
  rarityStatCount: { fontSize: 13, fontWeight: '900', minWidth: 22, textAlign: 'right' },

  titleList: { gap: 6, marginBottom: 18 },
  titleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  titleIconBox: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  titleRowName: { color: COLORS.text, fontSize: 13, fontWeight: '900' },
  titleRowReq: { color: COLORS.muted, fontSize: 10, fontWeight: '700', marginTop: 2 },
  currentBadge: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  currentBadgeText: { color: '#05070F', fontSize: 9, fontWeight: '900', letterSpacing: 1 },

  recentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14, padding: 12,
    borderColor: COLORS.border, borderWidth: 1,
    marginBottom: 18,
  },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  recentBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  recentIcon: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  recentName: { color: COLORS.text, fontSize: 13, fontWeight: '900' },
  recentMeta: { color: COLORS.muted, fontSize: 10, marginTop: 2, fontWeight: '700' },
  recentRarity: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 6, borderWidth: 1, overflow: 'hidden',
    shadowOpacity: 0.6, shadowRadius: 4,
  },
  recentRarityText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  empty: {
    alignItems: 'center', padding: 24, gap: 4,
    backgroundColor: COLORS.surface, borderRadius: 14,
    borderColor: COLORS.border, borderWidth: 1,
    marginBottom: 18,
  },
  emptyText: { color: COLORS.text, fontSize: 13, fontWeight: '900' },
  emptyHint: { color: COLORS.muted, fontSize: 11 },

  sysCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 12,
    borderColor: COLORS.border, borderWidth: 1, marginBottom: 12,
  },

  quickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 10, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginBottom: 6,
  },
  quickIcon: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  quickTitle: { color: COLORS.text, fontSize: 13, fontWeight: '900' },
  quickDesc: { color: COLORS.textSoft, fontSize: 10, fontWeight: '700', marginTop: 2, letterSpacing: 0.5 },

  resetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderRadius: 10,
    backgroundColor: COLORS.danger + '11',
    borderColor: COLORS.danger + '55', borderWidth: 1,
    marginBottom: 14,
  },
  resetText: { color: COLORS.danger, fontSize: 12, fontWeight: '900', letterSpacing: 2 },

  footerBox: { alignItems: 'center', gap: 4, marginTop: 12 },
  footer: { color: COLORS.textSoft, fontSize: 11, textAlign: 'center', letterSpacing: 1, fontWeight: '700' },
  footerSub: { color: COLORS.muted, fontSize: 9, textAlign: 'center', letterSpacing: 1, fontWeight: '600' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  modalCard: {
    width: '100%', backgroundColor: COLORS.surface,
    borderRadius: 18, padding: 18,
    borderColor: COLORS.border, borderWidth: 1,
  },
  modalTitle: { color: COLORS.text, fontSize: 13, fontWeight: '900', letterSpacing: 2, marginBottom: 12 },
  modalInput: {
    backgroundColor: COLORS.surfaceAlt, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    color: COLORS.text, fontSize: 15, fontWeight: '700',
    borderWidth: 1, borderColor: COLORS.border,
  },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  modalBtnGhost: { backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border },
  modalBtnGhostText: { color: COLORS.textSoft, fontWeight: '900', letterSpacing: 1 },
  modalBtnPrimary: { backgroundColor: COLORS.neon },
  modalBtnPrimaryText: { color: '#05070F', fontWeight: '900', letterSpacing: 1 },
});
