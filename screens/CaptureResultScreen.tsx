import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing, ScrollView,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, Rarity, RARITY } from '../lib/theme';
import { useBirds } from '../lib/BirdContext';
import BirdCard from '../components/BirdCard';
import RarityBadge from '../components/RarityBadge';
import { RootStackParamList } from '../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function CaptureResultScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'CaptureResult'>>();
  const nav = useNavigation<Nav>();
  const { speciesId, isNew, isGacha, reason, oldRarity, newRarity, newCount, xpGained } = route.params;
  const { allSpecies, pendingReviews } = useBirds();
  const species = allSpecies.find((s) => s.id === speciesId);

  const isPendingReview = isGacha && speciesId === 0;
  const latestReview = pendingReviews[0];
  const rarityUpgraded = oldRarity !== newRarity;

  const ballDrop = useRef(new Animated.Value(-250)).current;
  const ballShake = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0)).current;
  const statusText = useRef(new Animated.Value(0)).current;
  const upgradeFlash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const seq: Animated.CompositeAnimation[] = [
      Animated.timing(ballDrop, { toValue: 0, duration: 600, useNativeDriver: true, easing: Easing.bounce }),
      Animated.sequence([
        Animated.timing(ballShake, { toValue: -1, duration: 120, useNativeDriver: true }),
        Animated.timing(ballShake, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(ballShake, { toValue: -1, duration: 220, useNativeDriver: true }),
        Animated.timing(ballShake, { toValue: 0, duration: 120, useNativeDriver: true }),
      ]),
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(burst, { toValue: 1, duration: 700, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(ringScale, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.spring(cardScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true, delay: 150 }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: true, delay: 150 }),
        Animated.timing(statusText, { toValue: 1, duration: 400, useNativeDriver: true, delay: 400 }),
      ]),
    ];
    if (rarityUpgraded && !isPendingReview) {
      seq.push(
        Animated.sequence([
          Animated.timing(upgradeFlash, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(upgradeFlash, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(upgradeFlash, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(upgradeFlash, { toValue: 0.6, duration: 400, useNativeDriver: true }),
        ])
      );
    }
    Animated.sequence(seq).start();
  }, []);

  const ballTransform = [
    { translateY: ballDrop },
    { rotate: ballShake.interpolate({ inputRange: [-1, 1], outputRange: ['-22deg', '22deg'] }) },
  ];
  const burstScale = burst.interpolate({ inputRange: [0, 1], outputRange: [0, 1.6] });
  const burstOpacity = burst.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] });
  const ringS = ringScale.interpolate({ inputRange: [0, 1], outputRange: [0, 2.8] });
  const ringO = ringScale.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] });
  const statusTr = statusText.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });

  // ===== 審核中 =====
  if (isPendingReview) {
    return (
      <View style={styles.root}>
        <LinearGradient colors={[COLORS.yellow + '33', '#0A0E1F', '#05070F']} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => nav.goBack()} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.topTitle}>已送出審核</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.pendingScene}>
            <View style={styles.pendingIcon}>
              <Ionicons name="hourglass" size={56} color={COLORS.yellow} />
            </View>
            <Text style={styles.pendingTitle}>照片已送審核</Text>
            <Text style={styles.pendingSub}>辨識失敗：{reason}</Text>

            <View style={styles.pendingCard}>
              <View style={styles.pendingRow}>
                <Ionicons name="scan-circle" size={18} color={COLORS.danger} />
                <Text style={styles.pendingLabel}>AI 辨識</Text>
                <Text style={[styles.pendingValue, { color: COLORS.danger }]}>失敗</Text>
              </View>
              <View style={styles.pendingRow}>
                <Ionicons name="shield-checkmark" size={18} color={COLORS.yellow} />
                <Text style={styles.pendingLabel}>下一步</Text>
                <Text style={[styles.pendingValue, { color: COLORS.yellow }]}>家長/老師審核</Text>
              </View>
              <View style={styles.pendingRow}>
                <Ionicons name="flash" size={18} color={COLORS.neon} />
                <Text style={styles.pendingLabel}>已獲得</Text>
                <Text style={[styles.pendingValue, { color: COLORS.neon }]}>+{xpGained} XP</Text>
              </View>
              <View style={styles.pendingRow}>
                <Ionicons name="images" size={18} color={COLORS.green} />
                <Text style={styles.pendingLabel}>相冊</Text>
                <Text style={[styles.pendingValue, { color: COLORS.green }]}>照片已保存</Text>
              </View>
            </View>

            <View style={styles.pendingHint}>
              <Ionicons name="information-circle" size={14} color={COLORS.neon} />
              <Text style={styles.pendingHintText}>
                家長/老師在後台確認後，卡片會自動加入你的圖鑑！
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionGhost]}
              onPress={() => {
                nav.goBack();
                setTimeout(() => nav.navigate('Album'), 200);
              }}
            >
              <Ionicons name="images" size={14} color={COLORS.text} />
              <Text style={styles.actionGhostText}>相冊</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionPrimary]} onPress={() => nav.goBack()}>
              <LinearGradient colors={[COLORS.yellow, COLORS.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              <Ionicons name="camera" size={14} color="#fff" />
              <Text style={styles.actionPrimaryText}>繼續拍攝</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!species) return null;
  const rarityMeta = RARITY[newRarity as Rarity];
  const confidence = Math.round((species.aiConfidence || 0.8) * 100);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[rarityMeta.color + '55', '#0A0E1F', '#05070F']}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: rarityMeta.color, opacity: upgradeFlash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.3] }) },
        ]}
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>CAPTURE SUCCESS</Text>
          <View style={{ width: 40 }} />
        </View>

        <Animated.View
          style={[
            styles.modeBar,
            {
              transform: [{ translateY: statusTr }],
              opacity: statusText,
              borderColor: COLORS.green,
            },
          ]}
        >
          <Ionicons name="checkmark-done-circle" size={16} color={COLORS.green} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.modeText, { color: COLORS.green }]}>
              Merlin Bird ID 辨識成功
            </Text>
            <Text style={styles.modeSub}>
              信心度 {confidence}% · 來源 Cornell Lab AI
            </Text>
          </View>
          <View style={styles.confidenceBox}>
            <Text style={[styles.confidenceNum, { color: COLORS.green }]}>{confidence}</Text>
            <Text style={styles.confidencePct}>%</Text>
          </View>
        </Animated.View>

        <ScrollView contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
          <View style={styles.scene}>
            <Animated.View
              style={[
                styles.ring,
                { borderColor: rarityMeta.color, transform: [{ scale: ringS }], opacity: ringO },
              ]}
            />
            {Array.from({ length: 10 }).map((_, i) => {
              const angle = (i * Math.PI * 2) / 10;
              const tx = burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * 150] });
              const ty = burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * 150] });
              return (
                <Animated.View
                  key={i}
                  style={{
                    position: 'absolute',
                    transform: [{ translateX: tx }, { translateY: ty }, { scale: burstScale }],
                    opacity: burstOpacity,
                  }}
                >
                  <Ionicons name="sparkles" size={22} color={rarityMeta.color} />
                </Animated.View>
              );
            })}

            <Animated.View style={{ transform: [{ scale: cardScale }], opacity: cardOpacity }}>
              <BirdCard species={species} rarity={newRarity as Rarity} count={newCount} size="md" />
            </Animated.View>

            <Animated.View style={[styles.ball, { transform: ballTransform }]}>
              <View style={styles.ballTop} />
              <View style={styles.ballMid} />
              <View style={styles.ballBottom} />
              <View style={styles.ballCenter}>
                <View style={styles.ballCenterDot} />
              </View>
            </Animated.View>
          </View>

          {/* 捕捉次數 大顯示 —— 投入感核心 */}
          <Animated.View style={[styles.countHero, { opacity: cardOpacity }]}>
            <Text style={styles.countHeroLabel}>這是你第</Text>
            <View style={styles.countHeroRow}>
              <Text style={[styles.countHeroNum, { color: rarityMeta.color, textShadowColor: rarityMeta.glow }]}>
                {newCount}
              </Text>
              <Text style={styles.countHeroUnit}>次</Text>
            </View>
            <Text style={styles.countHeroSub}>拍到 {species.name}</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.badgeRow,
              { opacity: cardOpacity, transform: [{ translateY: statusTr }] },
            ]}
          >
            {isNew && (
              <View style={[styles.statusBadge, { backgroundColor: COLORS.green + '33', borderColor: COLORS.green }]}>
                <Ionicons name="sparkles" size={11} color={COLORS.green} />
                <Text style={[styles.statusBadgeText, { color: COLORS.green }]}>NEW!</Text>
              </View>
            )}
            {rarityUpgraded && (
              <View style={[styles.statusBadge, { backgroundColor: COLORS.yellow + '33', borderColor: COLORS.yellow }]}>
                <Ionicons name="arrow-up" size={11} color={COLORS.yellow} />
                <Text style={[styles.statusBadgeText, { color: COLORS.yellow }]}>
                  {oldRarity} → {newRarity}
                </Text>
              </View>
            )}
            <View style={[styles.statusBadge, { backgroundColor: COLORS.neon + '33', borderColor: COLORS.neon }]}>
              <Ionicons name="flash" size={11} color={COLORS.neon} />
              <Text style={[styles.statusBadgeText, { color: COLORS.neon }]}>+{xpGained} XP</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: COLORS.green + '33', borderColor: COLORS.green }]}>
              <Ionicons name="images" size={11} color={COLORS.green} />
              <Text style={[styles.statusBadgeText, { color: COLORS.green }]}>已存入相冊</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.infoCard, { opacity: cardOpacity }]}>
            <View style={styles.infoHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoName}>{species.name}</Text>
                <Text style={styles.infoSci}>{species.scientificName}</Text>
              </View>
              <RarityBadge rarity={newRarity as Rarity} size="md" showStars />
            </View>

            <View style={styles.statsRow}>
              <StatItem icon="resize" label="體長" value={species.size} />
              <View style={styles.dividerV} />
              <StatItem icon="home" label="棲地" value={species.habitat[0]} />
              <View style={styles.dividerV} />
              <StatItem icon="restaurant" label="食性" value={species.diet.split('、')[0]} />
            </View>

            <View style={styles.dataBox}>
              <DataLine icon="library-outline" label="科別" value={species.family} />
              <DataLine icon="calendar-outline" label="季節" value={species.season} />
              <DataLine icon="musical-notes-outline" label="叫聲" value={species.call} />
              <DataLine icon="location-outline" label="分布" value={species.region} />
            </View>

            <View style={styles.featureBox}>
              <View style={styles.featureHeader}>
                <Ionicons name="eye" size={13} color={COLORS.neon} />
                <Text style={styles.featureTitle}>外型特徵</Text>
              </View>
              <Text style={styles.featureText}>{species.features}</Text>
            </View>

            <View style={styles.factBox}>
              <View style={styles.featureHeader}>
                <Ionicons name="bulb" size={13} color={COLORS.yellow} />
                <Text style={[styles.featureTitle, { color: COLORS.yellow }]}>你知道嗎？</Text>
              </View>
              <Text style={styles.factText}>{species.funFact}</Text>
            </View>

            <View style={styles.captureRow}>
              <View style={styles.captureItem}>
                <Ionicons name="camera" size={12} color={COLORS.textSoft} />
                <Text style={styles.captureLabel}>累積</Text>
                <Text style={styles.captureValue}>{newCount} 次</Text>
              </View>
              <View style={styles.dividerV} />
              <View style={styles.captureItem}>
                <Ionicons name="trending-up" size={12} color={COLORS.purple} />
                <Text style={styles.captureLabel}>下一階</Text>
                <Text style={styles.captureValue}>{getNextNeeded(newCount, newRarity as Rarity)}</Text>
              </View>
              <View style={styles.dividerV} />
              <View style={styles.captureItem}>
                <Ionicons name="location" size={12} color={COLORS.green} />
                <Text style={styles.captureLabel}>熱點</Text>
                <Text style={styles.captureValue}>{species.hotspots.length} 個</Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* 按鈕 */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionGhost]}
            onPress={() => {
              nav.goBack();
              setTimeout(() => nav.navigate('Album'), 200);
            }}
          >
            <Ionicons name="images" size={14} color={COLORS.text} />
            <Text style={styles.actionGhostText}>相冊</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionGhost]}
            onPress={() => {
              nav.goBack();
              setTimeout(() => nav.navigate('BirdDetail', { speciesId }), 200);
            }}
          >
            <Ionicons name="document-text" size={14} color={COLORS.text} />
            <Text style={styles.actionGhostText}>資料</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionPrimary]}
            onPress={() => nav.goBack()}
          >
            <LinearGradient colors={[COLORS.neon, COLORS.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <Ionicons name="camera" size={14} color="#fff" />
            <Text style={styles.actionPrimaryText}>繼續</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

function StatItem({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.captureItem}>
      <Ionicons name={icon} size={12} color={COLORS.neon} />
      <Text style={styles.captureLabel}>{label}</Text>
      <Text style={styles.captureValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function DataLine({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.dataLine}>
      <Ionicons name={icon} size={12} color={COLORS.textSoft} />
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value}</Text>
    </View>
  );
}

function getNextNeeded(count: number, cur: Rarity): string {
  const order: Rarity[] = ['UC', 'C', 'R', 'SR', 'SSR', 'UR', 'LR'];
  const idx = order.indexOf(cur);
  if (idx === order.length - 1) return 'MAX';
  const next = order[idx + 1];
  const needed = RARITY[next].threshold - count;
  return `+${needed}`;
}

const BALL = 54;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 6,
  },
  closeBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { color: COLORS.text, fontSize: 12, fontWeight: '900', letterSpacing: 3 },

  modeBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 14, marginTop: 4,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1,
    backgroundColor: COLORS.surface,
  },
  modeText: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  modeSub: { color: COLORS.textSoft, fontSize: 10, marginTop: 2, fontWeight: '700' },
  confidenceBox: { flexDirection: 'row', alignItems: 'baseline' },
  confidenceNum: { fontSize: 20, fontWeight: '900' },
  confidencePct: { color: COLORS.textSoft, fontSize: 10, fontWeight: '800' },

  scene: { height: 260, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 80, height: 80, borderRadius: 40, borderWidth: 3,
  },
  ball: {
    position: 'absolute',
    top: 30,
    width: BALL, height: BALL, borderRadius: BALL / 2,
    overflow: 'hidden',
    borderWidth: 3, borderColor: '#1A1A1A',
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 8,
  },
  ballTop: { position: 'absolute', top: 0, left: 0, right: 0, height: BALL / 2 - 3, backgroundColor: COLORS.pokeRed },
  ballMid: { position: 'absolute', top: BALL / 2 - 4, left: 0, right: 0, height: 6, backgroundColor: '#1A1A1A' },
  ballBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: BALL / 2 - 3, backgroundColor: '#fff' },
  ballCenter: {
    position: 'absolute', top: BALL / 2 - 10, left: BALL / 2 - 10,
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff',
    borderWidth: 3, borderColor: '#1A1A1A',
    alignItems: 'center', justifyContent: 'center',
  },
  ballCenterDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff', borderWidth: 1, borderColor: '#999' },

  // 投入感核心：大數字
  countHero: {
    alignItems: 'center',
    marginHorizontal: 14, marginTop: 8,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  countHeroLabel: { color: COLORS.textSoft, fontSize: 12, fontWeight: '700' },
  countHeroRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 },
  countHeroNum: {
    fontSize: 64, fontWeight: '900',
    textShadowRadius: 20,
  },
  countHeroUnit: { color: COLORS.text, fontSize: 20, fontWeight: '900' },
  countHeroSub: { color: COLORS.textSoft, fontSize: 13, fontWeight: '800', marginTop: 4 },

  badgeRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 5,
    marginHorizontal: 14, marginTop: 10,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, borderWidth: 1,
  },
  statusBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  infoCard: {
    marginHorizontal: 14, marginTop: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  infoHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 8 },
  infoName: { color: COLORS.text, fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  infoSci: { color: COLORS.textSoft, fontSize: 11, fontStyle: 'italic', marginTop: 2 },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 10, paddingVertical: 10,
    marginBottom: 10,
  },
  captureItem: { flex: 1, alignItems: 'center', gap: 2 },
  captureLabel: { color: COLORS.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  captureValue: { color: COLORS.text, fontSize: 12, fontWeight: '900' },
  dividerV: { width: 1, height: 28, backgroundColor: COLORS.border },

  dataBox: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 10, padding: 10,
    gap: 2,
  },
  dataLine: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  dataLabel: { color: COLORS.muted, fontSize: 11, fontWeight: '700', width: 40 },
  dataValue: { color: COLORS.text, fontSize: 12, fontWeight: '800', flex: 1 },

  featureBox: {
    backgroundColor: COLORS.neon + '11',
    borderLeftWidth: 3, borderLeftColor: COLORS.neon,
    borderRadius: 10, padding: 10, marginTop: 8,
  },
  featureHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  featureTitle: { color: COLORS.neon, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  featureText: { color: COLORS.text, fontSize: 12, lineHeight: 17, fontWeight: '600' },

  factBox: {
    backgroundColor: COLORS.yellow + '11',
    borderLeftWidth: 3, borderLeftColor: COLORS.yellow,
    borderRadius: 10, padding: 10, marginTop: 6,
  },
  factText: { color: COLORS.text, fontSize: 12, lineHeight: 17, fontWeight: '600' },

  captureRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 10, paddingVertical: 10, marginTop: 8,
  },

  // 審核
  pendingScene: { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 20 },
  pendingIcon: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.yellow + '22',
    borderWidth: 2, borderColor: COLORS.yellow,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.yellow, shadowOpacity: 0.5, shadowRadius: 14,
    marginBottom: 16,
  },
  pendingTitle: { color: COLORS.text, fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  pendingSub: { color: COLORS.yellow, fontSize: 12, fontWeight: '800', marginTop: 4 },
  pendingCard: {
    marginTop: 20, width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.yellow + '55',
  },
  pendingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  pendingLabel: { color: COLORS.textSoft, fontSize: 12, fontWeight: '700', flex: 1 },
  pendingValue: { fontSize: 13, fontWeight: '900' },
  pendingHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 14, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: COLORS.surface, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.neon + '33',
  },
  pendingHintText: { color: COLORS.textSoft, fontSize: 11, fontWeight: '600', flex: 1 },

  actions: { flexDirection: 'row', paddingHorizontal: 14, paddingTop: 10, gap: 6, paddingBottom: 6 },
  actionBtn: {
    flex: 1, height: 46, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    overflow: 'hidden',
  },
  actionGhost: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1 },
  actionPrimary: {},
  actionGhostText: { color: COLORS.text, fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  actionPrimaryText: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
});
