import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing, ScrollView, Dimensions,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, Rarity, RARITY } from '../lib/theme';
import { useBirds } from '../lib/BirdContext';
import {
  PipelineStage, PIPELINE_STAGES, POSE_META, TYPE_META,
  BirdPose, FakemonType, FakemonCard,
  simulatePoseDetection, determineTypes, generateMoves,
  calculateHP, buildFakemonPrompt,
} from '../lib/fakemonEngine';
import { addFakemonCard } from '../lib/fakemonStore';
import { RootStackParamList } from '../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

export default function FakemonPipelineScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'FakemonPipeline'>>();
  const nav = useNavigation<Nav>();
  const { allSpecies, getSpeciesRarity } = useBirds();
  const { speciesId } = route.params;
  const species = allSpecies.find((s) => s.id === speciesId)!;

  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [detectedPose, setDetectedPose] = useState<BirdPose | null>(null);
  const [types, setTypes] = useState<FakemonType[]>([]);
  const [completed, setCompleted] = useState(false);
  const [fakemonCard, setFakemonCard] = useState<FakemonCard | null>(null);

  // 動畫
  const scanLine = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const fakemonReveal = useRef(new Animated.Value(0)).current;
  const frameAppear = useRef(new Animated.Value(0)).current;

  const rarity: Rarity = getSpeciesRarity(speciesId) || 'UC';
  const rarityMeta = RARITY[rarity];

  useEffect(() => {
    // 啟動 pipeline
    runPipeline();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1200, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(glow, { toValue: 0, duration: 1200, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, []);

  const runPipeline = async () => {
    const pose = simulatePoseDetection();

    for (let i = 0; i < PIPELINE_STAGES.length; i++) {
      setCurrentStageIdx(i);
      const stage = PIPELINE_STAGES[i];

      // 進度動畫
      Animated.timing(progress, {
        toValue: (i + 1) / PIPELINE_STAGES.length,
        duration: stage.duration,
        useNativeDriver: false,
        easing: Easing.out(Easing.cubic),
      }).start();

      // 各階段特殊效果
      if (stage.key === 'pose') {
        // 姿態偵測階段 - 啟動掃描線
        Animated.loop(
          Animated.sequence([
            Animated.timing(scanLine, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.timing(scanLine, { toValue: 0, duration: 700, useNativeDriver: true }),
          ])
        ).start();
      }

      if (stage.key === 'i2i') {
        scanLine.stopAnimation();
        // Fakemon 揭露動畫
        Animated.timing(fakemonReveal, {
          toValue: 1,
          duration: stage.duration * 0.8,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }).start();
      }

      if (stage.key === 'frame') {
        // 卡框從四邊滑入
        Animated.spring(frameAppear, {
          toValue: 1, tension: 50, friction: 7, useNativeDriver: true,
        }).start();
      }

      await new Promise((r) => setTimeout(r, stage.duration));

      if (stage.key === 'pose') {
        setDetectedPose(pose);
        setTypes(determineTypes(species, pose));
      }
    }

    // 完成 → 儲存 Fakemon 卡片
    const card: FakemonCard = {
      id: `fkm-${Date.now()}`,
      speciesId,
      pose,
      types: determineTypes(species, pose),
      hp: calculateHP(species, rarity),
      moves: generateMoves(species, pose),
      aiPrompt: buildFakemonPrompt(species, pose),
      styleModel: 'Flux-Pokemon-v2',
      generationTime: PIPELINE_STAGES.reduce((a, s) => a + s.duration, 0),
      originalPhotoUri: undefined,  // 實際由相機提供
      fakemonImageUri: undefined,    // 實際由 AI 產生
      framedCardUri: undefined,
      notionPageId: `notion-${Date.now()}`,
      syncedAt: Date.now(),
      createdAt: Date.now(),
    };

    await addFakemonCard(card);
    setFakemonCard(card);
    setCompleted(true);
  };

  const currentStage = PIPELINE_STAGES[currentStageIdx];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[currentStage.color + '44', '#0A0E1F', '#05070F']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>FAKEMON PIPELINE</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Pipeline 階段條 */}
          <View style={styles.pipeline}>
            {PIPELINE_STAGES.map((stage, i) => {
              const isDone = i < currentStageIdx || completed;
              const isActive = i === currentStageIdx && !completed;
              return (
                <React.Fragment key={stage.key}>
                  <View style={styles.stageCol}>
                    <View
                      style={[
                        styles.stageDot,
                        {
                          backgroundColor: isDone || isActive ? stage.color : COLORS.surface,
                          borderColor: isDone || isActive ? stage.color : COLORS.border,
                        },
                      ]}
                    >
                      {isDone ? (
                        <Ionicons name="checkmark" size={14} color="#05070F" />
                      ) : isActive ? (
                        <Animated.View
                          style={{
                            opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
                          }}
                        >
                          <Ionicons name={stage.icon as any} size={14} color="#05070F" />
                        </Animated.View>
                      ) : (
                        <Ionicons name={stage.icon as any} size={14} color={COLORS.muted} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.stageLabel,
                        (isDone || isActive) && { color: stage.color },
                      ]}
                      numberOfLines={1}
                    >
                      {stage.label}
                    </Text>
                  </View>
                  {i < PIPELINE_STAGES.length - 1 && (
                    <View
                      style={[
                        styles.stageLine,
                        { backgroundColor: isDone ? stage.color : COLORS.border },
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>

          {/* 總進度 */}
          <View style={styles.progressWrap}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              >
                <LinearGradient
                  colors={[COLORS.neon, COLORS.purple, COLORS.pink]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>
            <Text style={styles.progressLabel}>{currentStage.label}</Text>
          </View>

          {/* 轉換視覺化區 */}
          <View style={styles.stageArea}>
            {/* 左：原照片（佔位） */}
            <View style={styles.photoBox}>
              <View style={[styles.photoInner, { backgroundColor: species.baseColor + '22', borderColor: species.baseColor }]}>
                <Text style={{ fontSize: 58 }}>{species.emoji}</Text>
                <View style={styles.photoTag}>
                  <Ionicons name="camera" size={10} color={COLORS.text} />
                  <Text style={styles.photoTagText}>原照片</Text>
                </View>

                {/* 姿態偵測階段 - 掃描線 */}
                {currentStage.key === 'pose' && (
                  <Animated.View
                    style={[
                      styles.scanLine,
                      {
                        transform: [
                          {
                            translateY: scanLine.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 130],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={['transparent', COLORS.purple, 'transparent']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={{ flex: 1 }}
                    />
                  </Animated.View>
                )}
              </View>

              {detectedPose && (
                <View
                  style={[
                    styles.poseTag,
                    { backgroundColor: POSE_META[detectedPose].color + '33', borderColor: POSE_META[detectedPose].color },
                  ]}
                >
                  <Ionicons name={POSE_META[detectedPose].icon as any} size={11} color={POSE_META[detectedPose].color} />
                  <Text style={[styles.poseTagText, { color: POSE_META[detectedPose].color }]}>
                    {POSE_META[detectedPose].name}
                  </Text>
                </View>
              )}
            </View>

            {/* 中：箭頭 + Pipeline */}
            <View style={styles.arrowCol}>
              <Ionicons
                name={currentStageIdx >= 2 ? 'flash' : 'arrow-forward'}
                size={24}
                color={currentStage.color}
              />
              <Text style={[styles.arrowText, { color: currentStage.color }]}>
                {currentStageIdx >= 2 ? 'AI' : '→'}
              </Text>
            </View>

            {/* 右：Fakemon 結果 */}
            <View style={styles.photoBox}>
              <Animated.View
                style={[
                  styles.photoInner,
                  {
                    backgroundColor: types[0] ? TYPE_META[types[0]].color + '22' : COLORS.surface,
                    borderColor: types[0] ? TYPE_META[types[0]].color : COLORS.border,
                    opacity: fakemonReveal,
                    transform: [{ scale: fakemonReveal.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
                  },
                ]}
              >
                {currentStageIdx >= 2 ? (
                  <>
                    <Text style={{ fontSize: 58 }}>{species.emoji}</Text>
                    {/* Pokémon 風格裝飾 */}
                    <Animated.View
                      style={[
                        styles.sparkle1,
                        { opacity: glow },
                      ]}
                    >
                      <Ionicons name="sparkles" size={16} color={rarityMeta.color} />
                    </Animated.View>
                    <Animated.View
                      style={[
                        styles.sparkle2,
                        { opacity: glow },
                      ]}
                    >
                      <Ionicons name="sparkles" size={12} color={COLORS.yellow} />
                    </Animated.View>
                  </>
                ) : (
                  <Ionicons name="help" size={50} color={COLORS.muted} />
                )}

                {/* 卡框動畫 */}
                {currentStageIdx >= 3 && (
                  <>
                    <Animated.View
                      style={[
                        styles.frameTop,
                        {
                          borderColor: rarityMeta.color,
                          transform: [
                            {
                              translateY: frameAppear.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-30, 0],
                              }),
                            },
                          ],
                          opacity: frameAppear,
                        },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.frameBottom,
                        {
                          borderColor: rarityMeta.color,
                          transform: [
                            {
                              translateY: frameAppear.interpolate({
                                inputRange: [0, 1],
                                outputRange: [30, 0],
                              }),
                            },
                          ],
                          opacity: frameAppear,
                        },
                      ]}
                    />
                  </>
                )}

                <View style={styles.photoTag}>
                  <Ionicons name="sparkles" size={10} color={COLORS.pink} />
                  <Text style={styles.photoTagText}>Fakemon</Text>
                </View>
              </Animated.View>

              {/* 屬性標籤 */}
              {types.length > 0 && currentStageIdx >= 1 && (
                <View style={styles.typesRow}>
                  {types.map((t) => {
                    const meta = TYPE_META[t];
                    return (
                      <View
                        key={t}
                        style={[styles.typeChip, { backgroundColor: meta.color + '33', borderColor: meta.color }]}
                      >
                        <Text style={styles.typeEmoji}>{meta.emoji}</Text>
                        <Text style={[styles.typeText, { color: meta.color }]}>
                          {meta.name}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>

          {/* Prompt 顯示 */}
          {currentStageIdx === 2 && (
            <View style={styles.promptBox}>
              <View style={styles.promptHeader}>
                <Ionicons name="code-slash" size={13} color={COLORS.pink} />
                <Text style={styles.promptTitle}>IMAGE-TO-IMAGE PROMPT</Text>
                <View style={styles.modelPill}>
                  <Text style={styles.modelText}>Flux-Pokemon-v2</Text>
                </View>
              </View>
              <Text style={styles.promptText} numberOfLines={4}>
                {detectedPose
                  ? buildFakemonPrompt(species, detectedPose)
                  : 'Waiting for pose detection...'}
              </Text>
            </View>
          )}

          {/* 完成後 - 完整卡片展示 */}
          {completed && fakemonCard && (
            <View style={styles.completeSection}>
              <View style={styles.completeHeader}>
                <Ionicons name="checkmark-done-circle" size={18} color={COLORS.green} />
                <Text style={styles.completeTitle}>轉換完成！Fakemon 已誕生</Text>
              </View>

              {/* 完整 Fakemon 卡片 */}
              <View
                style={[
                  styles.fakemonCardFull,
                  { borderColor: rarityMeta.color, shadowColor: rarityMeta.glow },
                ]}
              >
                <LinearGradient
                  colors={rarityMeta.gradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />

                {/* 卡片頂 */}
                <View style={styles.cardHeader}>
                  <Text style={styles.cardName}>{species.name}</Text>
                  <View style={styles.hpRow}>
                    <Text style={styles.hpLabel}>HP</Text>
                    <Text style={styles.hpValue}>{fakemonCard.hp}</Text>
                  </View>
                </View>

                {/* 屬性 */}
                <View style={styles.cardTypes}>
                  {fakemonCard.types.map((t) => {
                    const meta = TYPE_META[t];
                    return (
                      <View key={t} style={[styles.cardTypeBadge, { backgroundColor: meta.color }]}>
                        <Text style={styles.cardTypeText}>{meta.emoji} {meta.name}</Text>
                      </View>
                    );
                  })}
                </View>

                {/* 圖像區 */}
                <View style={styles.cardArt}>
                  <View style={[styles.artBg, { backgroundColor: species.baseColor + '55' }]}>
                    <Text style={{ fontSize: 80 }}>{species.emoji}</Text>
                    <Animated.View style={[styles.artGlow, { opacity: glow }]}>
                      <Ionicons name="sparkles" size={16} color="#fff" />
                    </Animated.View>
                  </View>
                  <View style={styles.artInfo}>
                    <Text style={styles.artLatin}>{species.scientificName}</Text>
                    <Text style={styles.artPose}>
                      {POSE_META[fakemonCard.pose].icon ? '📸 ' : ''}
                      {POSE_META[fakemonCard.pose].name}形態
                    </Text>
                  </View>
                </View>

                {/* 招式 */}
                <View style={styles.movesBox}>
                  <Text style={styles.movesTitle}>⚡ 招式</Text>
                  {fakemonCard.moves.slice(0, 3).map((m, i) => (
                    <View key={i} style={styles.moveRow}>
                      <View style={[styles.moveTypeBadge, { backgroundColor: TYPE_META[m.type].color }]}>
                        <Text style={styles.moveTypeText}>{TYPE_META[m.type].emoji}</Text>
                      </View>
                      <Text style={styles.moveName}>{m.name}</Text>
                      {m.power > 0 && (
                        <Text style={styles.movePower}>{m.power}</Text>
                      )}
                    </View>
                  ))}
                </View>

                {/* 底部 */}
                <View style={styles.cardFooter}>
                  <View style={styles.rarityBadge}>
                    <Text style={styles.rarityText}>{rarity}</Text>
                  </View>
                  <Text style={styles.cardNo}>#{String(species.id).padStart(3, '0')} / 151</Text>
                </View>
              </View>

              {/* Notion 同步狀態 */}
              <View style={styles.notionStatus}>
                <View style={styles.notionRow}>
                  <View style={[styles.notionDot, { backgroundColor: COLORS.green }]} />
                  <Ionicons name="cloud-done" size={13} color={COLORS.green} />
                  <Text style={styles.notionText}>已同步至 Notion 資料庫</Text>
                  <Text style={styles.notionTime}>
                    {Math.round((fakemonCard.generationTime || 0) / 100) / 10}s
                  </Text>
                </View>
                <Text style={styles.notionPageId}>Page ID: {fakemonCard.notionPageId}</Text>
              </View>

              {/* 技術資料 */}
              <View style={styles.techBox}>
                <Text style={styles.techTitle}>🔧 生成技術</Text>
                <TechRow label="AI 模型" value={fakemonCard.styleModel} />
                <TechRow label="姿態偵測" value={POSE_META[fakemonCard.pose].name} />
                <TechRow label="屬性系統" value={fakemonCard.types.map((t) => TYPE_META[t].name).join(' / ')} />
                <TechRow label="招式數量" value={`${fakemonCard.moves.length} 個`} />
                <TechRow label="稀有度" value={`${rarity} · ${rarityMeta.cn}`} />
                <TechRow
                  label="生成耗時"
                  value={`${(fakemonCard.generationTime / 1000).toFixed(1)} 秒`}
                  last
                />
              </View>
            </View>
          )}

          {/* 按鈕 */}
          {completed && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionGhost]}
                onPress={() => nav.navigate('FakemonGallery')}
              >
                <Ionicons name="albums" size={14} color={COLORS.text} />
                <Text style={styles.actionGhostText}>我的 Fakemon 收藏</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionPrimary]}
                onPress={() => nav.goBack()}
              >
                <LinearGradient colors={[COLORS.pink, COLORS.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                <Ionicons name="camera" size={14} color="#fff" />
                <Text style={styles.actionPrimaryText}>繼續捕捉</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function TechRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[techStyles.row, !last && techStyles.border]}>
      <Text style={techStyles.label}>{label}</Text>
      <Text style={techStyles.value}>{value}</Text>
    </View>
  );
}

const techStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  border: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  label: { color: COLORS.muted, fontSize: 11, fontWeight: '700' },
  value: { color: COLORS.text, fontSize: 11, fontWeight: '900' },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 6,
  },
  closeBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { color: COLORS.text, fontSize: 12, fontWeight: '900', letterSpacing: 3 },

  pipeline: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6,
  },
  stageCol: { alignItems: 'center', gap: 4, width: 60 },
  stageDot: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  stageLabel: {
    fontSize: 9, color: COLORS.muted, fontWeight: '800',
    textAlign: 'center', letterSpacing: 0.5,
  },
  stageLine: {
    flex: 1, height: 2, marginTop: 13,
  },

  progressWrap: { paddingHorizontal: 14, marginTop: 6, marginBottom: 10 },
  progressBar: {
    height: 6, backgroundColor: COLORS.surface,
    borderRadius: 3, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border,
  },
  progressFill: { height: '100%' },
  progressLabel: {
    color: COLORS.text, fontSize: 11, fontWeight: '900',
    letterSpacing: 2, marginTop: 6, textAlign: 'center',
  },

  stageArea: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, marginTop: 4,
  },
  photoBox: { flex: 1, alignItems: 'center', gap: 6 },
  photoInner: {
    width: '100%', aspectRatio: 1,
    borderRadius: 14, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  photoTag: {
    position: 'absolute', top: 6, left: 6,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  photoTagText: { color: COLORS.text, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  scanLine: {
    position: 'absolute', left: 0, right: 0, height: 3,
  },
  poseTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999, borderWidth: 1,
  },
  poseTagText: { fontSize: 10, fontWeight: '900' },

  sparkle1: { position: 'absolute', top: 10, right: 10 },
  sparkle2: { position: 'absolute', bottom: 20, left: 14 },

  frameTop: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 10, borderTopWidth: 3,
    borderLeftWidth: 3, borderRightWidth: 3,
    borderTopLeftRadius: 14, borderTopRightRadius: 14,
  },
  frameBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 10, borderBottomWidth: 3,
    borderLeftWidth: 3, borderRightWidth: 3,
    borderBottomLeftRadius: 14, borderBottomRightRadius: 14,
  },

  arrowCol: { alignItems: 'center', paddingHorizontal: 4, gap: 2 },
  arrowText: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },

  typesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center' },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 999, borderWidth: 1,
  },
  typeEmoji: { fontSize: 11 },
  typeText: { fontSize: 10, fontWeight: '900' },

  promptBox: {
    marginHorizontal: 14, marginTop: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: COLORS.pink + '55',
  },
  promptHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 6,
  },
  promptTitle: {
    color: COLORS.pink, fontSize: 10, fontWeight: '900',
    letterSpacing: 2, flex: 1,
  },
  modelPill: {
    backgroundColor: COLORS.pink + '22',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    borderWidth: 1, borderColor: COLORS.pink,
  },
  modelText: { color: COLORS.pink, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  promptText: {
    color: COLORS.textSoft, fontSize: 11,
    fontFamily: 'monospace', lineHeight: 16,
  },

  completeSection: {
    marginHorizontal: 14, marginTop: 14,
  },
  completeHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 12,
  },
  completeTitle: { color: COLORS.green, fontSize: 14, fontWeight: '900', letterSpacing: 1 },

  fakemonCardFull: {
    borderRadius: 16, padding: 12,
    borderWidth: 3, overflow: 'hidden',
    shadowOpacity: 0.8, shadowRadius: 14,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8,
  },
  cardName: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  hpRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  hpLabel: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  hpValue: { color: '#fff', fontSize: 18, fontWeight: '900' },
  cardTypes: { flexDirection: 'row', gap: 5, marginBottom: 10 },
  cardTypeBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6,
  },
  cardTypeText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  cardArt: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12, padding: 10,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 10,
  },
  artBg: {
    width: 100, height: 100, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    position: 'relative',
  },
  artGlow: { position: 'absolute', top: 6, right: 6 },
  artInfo: { flex: 1, gap: 4 },
  artLatin: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontStyle: 'italic' },
  artPose: { color: '#fff', fontSize: 12, fontWeight: '800' },

  movesBox: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10, padding: 10, marginBottom: 8,
  },
  movesTitle: { color: '#fff', fontSize: 11, fontWeight: '900', marginBottom: 6, letterSpacing: 1 },
  moveRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 4,
  },
  moveTypeBadge: {
    width: 22, height: 22, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  moveTypeText: { fontSize: 10 },
  moveName: { color: '#fff', fontSize: 12, fontWeight: '800', flex: 1 },
  movePower: { color: '#fff', fontSize: 13, fontWeight: '900' },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)',
  },
  rarityBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4,
  },
  rarityText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  cardNo: { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '900' },

  notionStatus: {
    marginTop: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: COLORS.green + '55',
  },
  notionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notionDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  notionText: { color: COLORS.text, fontSize: 12, fontWeight: '800', flex: 1 },
  notionTime: { color: COLORS.green, fontSize: 11, fontWeight: '900' },
  notionPageId: {
    color: COLORS.muted, fontSize: 10,
    fontFamily: 'monospace', marginTop: 4, marginLeft: 14,
  },

  techBox: {
    marginTop: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  techTitle: { color: COLORS.text, fontSize: 12, fontWeight: '900', marginBottom: 6 },

  actions: {
    flexDirection: 'row', gap: 8,
    marginHorizontal: 14, marginTop: 14,
  },
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
