import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Easing, Dimensions,
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

const { width } = Dimensions.get('window');

type Step = 'idle' | 'capture' | 'ai' | 'generate' | 'done';

export default function TechShowcaseScreen() {
  const nav = useNavigation<Nav>();
  const { allSpecies } = useBirds();
  const [step, setStep] = useState<Step>('idle');
  const [selectedMode, setSelectedMode] = useState<'cloud' | 'ondevice' | 'hybrid'>('hybrid');

  const progress = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0)).current;

  const runDemo = () => {
    setStep('capture');
    progress.setValue(0);
    cardScale.setValue(0);

    setTimeout(() => setStep('ai'), 600);
    setTimeout(() => setStep('generate'), 1400);
    setTimeout(() => {
      setStep('done');
      Animated.spring(cardScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }).start();
    }, 2200);

    Animated.timing(progress, {
      toValue: 1, duration: 2200, useNativeDriver: false, easing: Easing.out(Easing.quad),
    }).start();
  };

  const demoSpecies = allSpecies[6]; // 紅嘴藍鵲

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#12152E', '#05070F']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerSub}>TECH COMPARISON</Text>
            <Text style={styles.headerTitle}>一拍即卡 · 技術方案</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* 介紹 */}
          <View style={styles.intro}>
            <Ionicons name="bulb" size={24} color={COLORS.yellow} />
            <Text style={styles.introTitle}>Birdex 做到的事，我們也可以！</Text>
            <Text style={styles.introDesc}>
              「拍照 → AI 辨識 → 自動生成卡牌」已是成熟技術。以下展示完整流程與三種實作方案。
            </Text>
          </View>

          {/* 即時 Demo */}
          <Text style={styles.sectionTitle}>🎬 完整流程 Demo</Text>
          <View style={styles.demoCard}>
            {/* 4 個步驟 */}
            <View style={styles.stepsRow}>
              <StepDot num={1} label="拍照" active={step === 'capture'} done={['ai', 'generate', 'done'].includes(step)} icon="camera" />
              <StepLine active={['ai', 'generate', 'done'].includes(step)} />
              <StepDot num={2} label="AI 辨識" active={step === 'ai'} done={['generate', 'done'].includes(step)} icon="scan" />
              <StepLine active={['generate', 'done'].includes(step)} />
              <StepDot num={3} label="取得資料" active={step === 'generate'} done={step === 'done'} icon="download" />
              <StepLine active={step === 'done'} />
              <StepDot num={4} label="渲染卡牌" active={step === 'done'} done={step === 'done'} icon="albums" />
            </View>

            {/* 動畫區 */}
            <View style={styles.demoStage}>
              {step === 'idle' && (
                <View style={styles.stagePlaceholder}>
                  <Ionicons name="play-circle" size={48} color={COLORS.neon} />
                  <Text style={styles.stageHint}>點下方按鈕開始 Demo</Text>
                </View>
              )}

              {step === 'capture' && (
                <View style={styles.stageContent}>
                  <View style={styles.phoneMock}>
                    <View style={styles.phoneScreen}>
                      <Text style={{ fontSize: 60 }}>📸</Text>
                    </View>
                  </View>
                  <Text style={styles.stageLabel}>拍攝中...</Text>
                </View>
              )}

              {step === 'ai' && (
                <View style={styles.stageContent}>
                  <View style={styles.aiBox}>
                    <Ionicons name="scan-circle" size={48} color={COLORS.neon} />
                    <View style={styles.scanLines}>
                      {Array.from({ length: 3 }).map((_, i) => (
                        <View key={i} style={[styles.scanL, { top: i * 20 }]} />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.stageLabel}>Merlin Bird ID 分析中...</Text>
                  <View style={styles.featureLines}>
                    <FeatureLine label="羽毛特徵" value="藍色" />
                    <FeatureLine label="體型估算" value="中型" />
                    <FeatureLine label="喙部顏色" value="紅色" />
                  </View>
                </View>
              )}

              {step === 'generate' && (
                <View style={styles.stageContent}>
                  <View style={styles.dbBox}>
                    <Ionicons name="server" size={36} color={COLORS.green} />
                  </View>
                  <Text style={styles.stageLabel}>從 Notion 取得鳥類資料...</Text>
                  <View style={styles.dataFetch}>
                    <DataField field="name" value="紅嘴藍鵲" ok />
                    <DataField field="scientificName" value="Urocissa..." ok />
                    <DataField field="rarity" value="calculating..." loading />
                  </View>
                </View>
              )}

              {step === 'done' && demoSpecies && (
                <View style={styles.stageContent}>
                  <Animated.View style={{ transform: [{ scale: cardScale }] }}>
                    <BirdCard species={demoSpecies} rarity="R" count={6} size="sm" />
                  </Animated.View>
                  <Text style={[styles.stageLabel, { color: COLORS.green }]}>
                    ✓ 卡牌生成完成！
                  </Text>
                  <Text style={styles.stageTime}>總耗時：~2.2 秒</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.runBtn} onPress={runDemo}>
              <LinearGradient colors={[COLORS.neon, COLORS.purple]} style={StyleSheet.absoluteFill} />
              <Ionicons name={step === 'done' ? 'refresh' : 'play'} size={16} color="#fff" />
              <Text style={styles.runBtnText}>
                {step === 'idle' ? '開始 Demo' : step === 'done' ? '再試一次' : '處理中...'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 與 Birdex 對比 */}
          <Text style={styles.sectionTitle}>📊 與 Birdex 對比</Text>
          <View style={styles.compareTable}>
            <CompareRow feature="拍照 → 卡牌自動生成" birdex ours />
            <CompareRow feature="AI 即時辨識" birdex ours note="Merlin 更精準" />
            <CompareRow feature="稀有度系統" birdex="4 級" ours="7 級 (UC~LR)" note="分級更細" />
            <CompareRow feature="地圖標記" birdex ours />
            <CompareRow feature="免費無廣告" birdexX ours note="他們有訂閱制" />
            <CompareRow feature="家長/老師審核" birdexX ours note="⭐ 我們獨有" />
            <CompareRow feature="Notion 後台管理" birdexX ours note="⭐ 我們獨有" />
            <CompareRow feature="兒童教育導向" birdexX ours note="⭐ 我們獨有" />
            <CompareRow feature="AI 生成圖（有爭議）" birdex birdexX={false} note="我們用實拍照片" ours={false} oursPart />
          </View>

          {/* 三種方案 */}
          <Text style={styles.sectionTitle}>🛠️ 三種實作方案</Text>
          <View style={styles.modeTab}>
            <ModeTab label="雲端 API" active={selectedMode === 'cloud'} onPress={() => setSelectedMode('cloud')} icon="cloud" />
            <ModeTab label="裝置端" active={selectedMode === 'ondevice'} onPress={() => setSelectedMode('ondevice')} icon="phone-portrait" />
            <ModeTab label="混合" active={selectedMode === 'hybrid'} onPress={() => setSelectedMode('hybrid')} icon="swap-horizontal" recommend />
          </View>

          {selectedMode === 'cloud' && <CloudSolution />}
          {selectedMode === 'ondevice' && <OnDeviceSolution />}
          {selectedMode === 'hybrid' && <HybridSolution />}

          {/* 實作路線圖 */}
          <Text style={styles.sectionTitle}>🗺️ 落地路線圖</Text>
          <View style={styles.roadmap}>
            <RoadStep num={1} title="MVP 階段（現在）" desc="模擬辨識 · 內建 30 種鳥 · 所有 UI 完整" status="done" />
            <RoadStep num={2} title="接入 Merlin API" desc="申請 Cornell API Key · 真實辨識上線" status="next" />
            <RoadStep num={3} title="擴充至 100+ 種" desc="從 eBird / iNaturalist 批次匯入" status="planned" />
            <RoadStep num={4} title="加入離線模型" desc="TensorFlow.js 離線辨識 · 無網也能玩" status="planned" />
            <RoadStep num={5} title="社群功能" desc="分享卡牌 · 朋友對戰 · 每日任務" status="future" last />
          </View>

          {/* Birdex 爭議提醒 */}
          <View style={styles.warnBox}>
            <Ionicons name="warning" size={16} color={COLORS.yellow} />
            <View style={{ flex: 1 }}>
              <Text style={styles.warnTitle}>💡 我們避開 Birdex 的爭議</Text>
              <Text style={styles.warnText}>
                Birdex 因使用 AI 生成卡牌插畫被賞鳥社群批評。{'\n'}
                我們主張：{'\n'}
                ✓ 卡牌使用實際鳥類照片或手繪插畫{'\n'}
                ✓ AI 只用於「辨識」不用於「生成圖片」{'\n'}
                ✓ 資料來自 Cornell Merlin / eBird 等權威來源
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// === 子元件 ===
function StepDot({ num, label, active, done, icon }: any) {
  return (
    <View style={styles.stepDotWrap}>
      <View
        style={[
          styles.stepDot,
          active && { backgroundColor: COLORS.neon, borderColor: COLORS.neon },
          done && { backgroundColor: COLORS.green, borderColor: COLORS.green },
        ]}
      >
        {done ? (
          <Ionicons name="checkmark" size={14} color="#05070F" />
        ) : active ? (
          <Ionicons name={icon} size={12} color="#05070F" />
        ) : (
          <Text style={styles.stepNum}>{num}</Text>
        )}
      </View>
      <Text style={[styles.stepLabel, (active || done) && { color: COLORS.text }]}>
        {label}
      </Text>
    </View>
  );
}

function StepLine({ active }: { active: boolean }) {
  return <View style={[styles.stepLine, active && { backgroundColor: COLORS.green }]} />;
}

function FeatureLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.featureLine}>
      <Text style={styles.featureLabel}>{label}</Text>
      <View style={styles.featureDots}>
        <View style={[styles.featureDot, { backgroundColor: COLORS.neon }]} />
        <View style={[styles.featureDot, { backgroundColor: COLORS.neon }]} />
        <View style={[styles.featureDot, { backgroundColor: COLORS.muted }]} />
      </View>
      <Text style={styles.featureValue}>{value}</Text>
    </View>
  );
}

function DataField({ field, value, ok, loading }: any) {
  return (
    <View style={styles.dataFieldRow}>
      <Text style={styles.dataFieldKey}>{field}:</Text>
      <Text style={[styles.dataFieldVal, loading && { color: COLORS.yellow }, ok && { color: COLORS.green }]}>
        {value}
      </Text>
      {ok && <Ionicons name="checkmark" size={10} color={COLORS.green} />}
      {loading && <Ionicons name="sync" size={10} color={COLORS.yellow} />}
    </View>
  );
}

function CompareRow({
  feature, birdex, ours, note, birdexX, oursPart,
}: { feature: string; birdex?: any; ours?: any; note?: string; birdexX?: boolean; oursPart?: boolean }) {
  return (
    <View style={styles.compareRow}>
      <Text style={styles.compareFeature}>{feature}</Text>
      <View style={styles.compareCell}>
        {typeof birdex === 'string' ? (
          <Text style={styles.compareValue}>{birdex}</Text>
        ) : birdex ? (
          <Ionicons name="checkmark-circle" size={16} color={COLORS.green} />
        ) : (
          <Ionicons name="close-circle" size={16} color={COLORS.danger} />
        )}
      </View>
      <View style={styles.compareCell}>
        {typeof ours === 'string' ? (
          <Text style={[styles.compareValue, { color: COLORS.neon }]}>{ours}</Text>
        ) : ours ? (
          <Ionicons name="checkmark-circle" size={16} color={COLORS.green} />
        ) : oursPart ? (
          <Ionicons name="ban" size={16} color={COLORS.purple} />
        ) : (
          <Ionicons name="close-circle" size={16} color={COLORS.danger} />
        )}
      </View>
      {note && <Text style={styles.compareNote}>{note}</Text>}
    </View>
  );
}

function ModeTab({ label, active, onPress, icon, recommend }: any) {
  return (
    <TouchableOpacity style={[styles.modeTabBtn, active && styles.modeTabBtnActive]} onPress={onPress}>
      <Ionicons name={icon} size={14} color={active ? COLORS.neon : COLORS.textSoft} />
      <Text style={[styles.modeTabText, active && { color: COLORS.neon }]}>{label}</Text>
      {recommend && <View style={styles.recommendDot} />}
    </TouchableOpacity>
  );
}

function CloudSolution() {
  return (
    <View style={styles.solutionCard}>
      <View style={styles.solHeader}>
        <Ionicons name="cloud" size={20} color={COLORS.neon} />
        <Text style={styles.solTitle}>雲端 API 方案</Text>
        <View style={styles.solBadge}>
          <Text style={styles.solBadgeText}>⚡ 最快上線</Text>
        </View>
      </View>
      <Text style={styles.solDesc}>
        拍照後上傳到 Merlin Bird ID / iNaturalist API，回傳辨識結果
      </Text>

      <View style={styles.solFlow}>
        <FlowBox label="手機" icon="phone-portrait" />
        <FlowArrow up="上傳照片" />
        <FlowBox label="Merlin API" icon="cloud" active />
        <FlowArrow down="JSON 結果" />
        <FlowBox label="手機" icon="albums" />
      </View>

      <View style={styles.solProsAndCons}>
        <View style={styles.pros}>
          <Text style={styles.prosTitle}>✅ 優點</Text>
          <Text style={styles.prosText}>• 辨識準確度高（Cornell 大學）</Text>
          <Text style={styles.prosText}>• 支援 10,000+ 鳥種</Text>
          <Text style={styles.prosText}>• 持續自動更新</Text>
          <Text style={styles.prosText}>• App 檔案輕量</Text>
        </View>
        <View style={styles.cons}>
          <Text style={styles.consTitle}>❌ 缺點</Text>
          <Text style={styles.consText}>• 需網路連線</Text>
          <Text style={styles.consText}>• 需申請 API Key</Text>
          <Text style={styles.consText}>• 照片上傳隱私考量</Text>
        </View>
      </View>

      <View style={styles.costBox}>
        <Text style={styles.costLabel}>費用估算</Text>
        <Text style={styles.costValue}>Merlin：免費（需申請）</Text>
        <Text style={styles.costValue}>iNaturalist：完全免費</Text>
      </View>
    </View>
  );
}

function OnDeviceSolution() {
  return (
    <View style={styles.solutionCard}>
      <View style={styles.solHeader}>
        <Ionicons name="phone-portrait" size={20} color={COLORS.purple} />
        <Text style={styles.solTitle}>裝置端離線方案</Text>
        <View style={[styles.solBadge, { backgroundColor: COLORS.purple + '22', borderColor: COLORS.purple }]}>
          <Text style={[styles.solBadgeText, { color: COLORS.purple }]}>🔒 最隱私</Text>
        </View>
      </View>
      <Text style={styles.solDesc}>
        把 AI 模型（TensorFlow.js / ONNX）直接打包進 App，完全離線運作
      </Text>

      <View style={styles.solFlow}>
        <FlowBox label="拍照" icon="camera" />
        <FlowArrow down="本機處理" />
        <FlowBox label="TF.js 模型" icon="flash" active />
        <FlowArrow down="直接輸出" />
        <FlowBox label="卡牌" icon="albums" />
      </View>

      <View style={styles.solProsAndCons}>
        <View style={styles.pros}>
          <Text style={styles.prosTitle}>✅ 優點</Text>
          <Text style={styles.prosText}>• 完全離線，無需網路</Text>
          <Text style={styles.prosText}>• 照片不上傳，最保護隱私</Text>
          <Text style={styles.prosText}>• 辨識速度快（&lt; 500ms）</Text>
          <Text style={styles.prosText}>• 無 API 費用</Text>
        </View>
        <View style={styles.cons}>
          <Text style={styles.consTitle}>❌ 缺點</Text>
          <Text style={styles.consText}>• App 檔案較大（+30MB）</Text>
          <Text style={styles.consText}>• 模型準確度略低</Text>
          <Text style={styles.consText}>• 更新需重新下載</Text>
        </View>
      </View>

      <View style={styles.costBox}>
        <Text style={styles.costLabel}>技術選項</Text>
        <Text style={styles.costValue}>• TensorFlow Lite Bird Model</Text>
        <Text style={styles.costValue}>• MobileNetV2 自訓練</Text>
        <Text style={styles.costValue}>• Google MLKit Image Labeling</Text>
      </View>
    </View>
  );
}

function HybridSolution() {
  return (
    <View style={[styles.solutionCard, { borderColor: COLORS.green + '55' }]}>
      <View style={styles.solHeader}>
        <Ionicons name="swap-horizontal" size={20} color={COLORS.green} />
        <Text style={styles.solTitle}>混合方案（推薦）</Text>
        <View style={[styles.solBadge, { backgroundColor: COLORS.green + '22', borderColor: COLORS.green }]}>
          <Text style={[styles.solBadgeText, { color: COLORS.green }]}>⭐ 最佳</Text>
        </View>
      </View>
      <Text style={styles.solDesc}>
        裝置端快速篩選 → 有網路時再用雲端驗證高難度辨識。兼顧速度、隱私與準確度。
      </Text>

      <View style={styles.hybridFlow}>
        <View style={styles.hybridStep}>
          <View style={styles.hybridNum}><Text style={styles.hybridNumText}>1</Text></View>
          <Text style={styles.hybridText}>拍照 → 裝置端快速辨識（200ms）</Text>
        </View>
        <View style={styles.hybridStep}>
          <View style={styles.hybridNum}><Text style={styles.hybridNumText}>2</Text></View>
          <Text style={styles.hybridText}>信心度 ≥ 85% → 直接發卡</Text>
        </View>
        <View style={styles.hybridStep}>
          <View style={styles.hybridNum}><Text style={styles.hybridNumText}>3</Text></View>
          <Text style={styles.hybridText}>信心度 70-85% + 有網 → 雲端二次驗證</Text>
        </View>
        <View style={styles.hybridStep}>
          <View style={styles.hybridNum}><Text style={styles.hybridNumText}>4</Text></View>
          <Text style={styles.hybridText}>信心度 &lt; 70% → 家長/老師審核</Text>
        </View>
      </View>

      <View style={styles.hybridChart}>
        <Text style={styles.hybridChartTitle}>預期辨識分布</Text>
        <View style={styles.hybridBar}>
          <View style={[styles.hybridSegment, { flex: 70, backgroundColor: COLORS.green }]}>
            <Text style={styles.hybridSegText}>離線直發 70%</Text>
          </View>
          <View style={[styles.hybridSegment, { flex: 20, backgroundColor: COLORS.neon }]}>
            <Text style={styles.hybridSegText}>雲端驗證 20%</Text>
          </View>
          <View style={[styles.hybridSegment, { flex: 10, backgroundColor: COLORS.yellow }]}>
            <Text style={styles.hybridSegText}>審核 10%</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function FlowBox({ label, icon, active }: { label: string; icon: any; active?: boolean }) {
  return (
    <View style={[styles.flowBox, active && { borderColor: COLORS.neon, backgroundColor: COLORS.neon + '22' }]}>
      <Ionicons name={icon} size={18} color={active ? COLORS.neon : COLORS.textSoft} />
      <Text style={[styles.flowLabel, active && { color: COLORS.neon }]}>{label}</Text>
    </View>
  );
}

function FlowArrow({ up, down }: { up?: string; down?: string }) {
  return (
    <View style={styles.flowArrow}>
      <Text style={styles.flowArrowText}>{up || down}</Text>
      <Ionicons name={up ? 'arrow-up' : 'arrow-down'} size={14} color={COLORS.neon} />
    </View>
  );
}

function RoadStep({ num, title, desc, status, last }: any) {
  const color =
    status === 'done' ? COLORS.green :
    status === 'next' ? COLORS.neon :
    status === 'planned' ? COLORS.purple :
    COLORS.muted;
  return (
    <View style={[styles.roadRow, !last && styles.roadBorder]}>
      <View style={[styles.roadNum, { borderColor: color, backgroundColor: color + '22' }]}>
        {status === 'done' ? (
          <Ionicons name="checkmark" size={14} color={color} />
        ) : (
          <Text style={[styles.roadNumText, { color }]}>{num}</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.roadTitleRow}>
          <Text style={styles.roadTitle}>{title}</Text>
          <View style={[styles.roadStatus, { backgroundColor: color + '22', borderColor: color }]}>
            <Text style={[styles.roadStatusText, { color }]}>
              {status === 'done' ? '完成' : status === 'next' ? '下一步' : status === 'planned' ? '規劃中' : '未來'}
            </Text>
          </View>
        </View>
        <Text style={styles.roadDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerSub: { color: COLORS.neon, fontSize: 10, letterSpacing: 3, fontWeight: '900' },
  headerTitle: { color: COLORS.text, fontSize: 20, fontWeight: '900', letterSpacing: 1 },

  intro: {
    margin: 14, padding: 16, alignItems: 'center', gap: 6,
    backgroundColor: COLORS.surface, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.yellow + '55',
  },
  introTitle: { color: COLORS.text, fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  introDesc: { color: COLORS.textSoft, fontSize: 12, textAlign: 'center', lineHeight: 18, fontWeight: '600' },

  sectionTitle: { color: COLORS.text, fontSize: 13, fontWeight: '900', marginHorizontal: 14, marginTop: 14, marginBottom: 10 },

  demoCard: {
    marginHorizontal: 14,
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  stepsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepDotWrap: { alignItems: 'center', gap: 4 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 2, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNum: { color: COLORS.textSoft, fontSize: 11, fontWeight: '900' },
  stepLabel: { color: COLORS.muted, fontSize: 9, fontWeight: '800' },
  stepLine: { flex: 1, height: 2, backgroundColor: COLORS.border, marginHorizontal: -2, marginBottom: 18 },

  demoStage: {
    marginTop: 14, height: 220,
    backgroundColor: COLORS.surfaceAlt, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  stagePlaceholder: { alignItems: 'center', gap: 6 },
  stageHint: { color: COLORS.muted, fontSize: 11, fontWeight: '700' },
  stageContent: { alignItems: 'center', gap: 6 },
  stageLabel: { color: COLORS.neon, fontSize: 12, fontWeight: '900', letterSpacing: 1, marginTop: 8 },
  stageTime: { color: COLORS.textSoft, fontSize: 10, fontWeight: '700' },

  phoneMock: {
    width: 70, height: 100, backgroundColor: '#1A1A1A',
    borderRadius: 10, padding: 4,
  },
  phoneScreen: {
    flex: 1, backgroundColor: COLORS.bg, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },

  aiBox: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.neon + '11',
    borderWidth: 2, borderColor: COLORS.neon,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.neon, shadowOpacity: 0.6, shadowRadius: 10,
    overflow: 'hidden',
  },
  scanLines: { position: 'absolute', inset: 0 },
  scanL: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: COLORS.neon, opacity: 0.5 },
  featureLines: { gap: 3, marginTop: 6, width: 200 },
  featureLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureLabel: { color: COLORS.textSoft, fontSize: 10, fontWeight: '700', width: 64 },
  featureDots: { flexDirection: 'row', gap: 2 },
  featureDot: { width: 4, height: 4, borderRadius: 2 },
  featureValue: { color: COLORS.text, fontSize: 10, fontWeight: '800', flex: 1, textAlign: 'right' },

  dbBox: {
    width: 80, height: 80, borderRadius: 16,
    backgroundColor: COLORS.green + '11',
    borderWidth: 2, borderColor: COLORS.green,
    alignItems: 'center', justifyContent: 'center',
  },
  dataFetch: { gap: 3, width: 220, marginTop: 6 },
  dataFieldRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dataFieldKey: { color: COLORS.purple, fontSize: 10, fontWeight: '800', fontFamily: 'monospace', width: 100 },
  dataFieldVal: { color: COLORS.text, fontSize: 10, fontFamily: 'monospace', flex: 1 },

  runBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 12, paddingVertical: 12, borderRadius: 12,
    overflow: 'hidden',
  },
  runBtnText: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1 },

  compareTable: {
    marginHorizontal: 14,
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 4,
    borderWidth: 1, borderColor: COLORS.border,
  },
  compareRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 9, paddingHorizontal: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    flexWrap: 'wrap',
  },
  compareFeature: { color: COLORS.text, fontSize: 12, fontWeight: '700', flex: 2 },
  compareCell: { flex: 1, alignItems: 'center' },
  compareValue: { color: COLORS.text, fontSize: 11, fontWeight: '800' },
  compareNote: { color: COLORS.muted, fontSize: 10, width: '100%', marginTop: 4, fontStyle: 'italic' },

  modeTab: {
    flexDirection: 'row', gap: 6,
    marginHorizontal: 14, marginBottom: 10,
    padding: 3, backgroundColor: COLORS.surface,
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  modeTabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 8, borderRadius: 7,
    position: 'relative',
  },
  modeTabBtnActive: { backgroundColor: COLORS.neon + '22' },
  modeTabText: { color: COLORS.textSoft, fontSize: 11, fontWeight: '900' },
  recommendDot: {
    position: 'absolute', top: 4, right: 10,
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: COLORS.green,
  },

  solutionCard: {
    marginHorizontal: 14,
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  solHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  solTitle: { color: COLORS.text, fontSize: 14, fontWeight: '900', flex: 1 },
  solBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: COLORS.neon + '22',
    borderWidth: 1, borderColor: COLORS.neon,
    borderRadius: 6,
  },
  solBadgeText: { color: COLORS.neon, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  solDesc: { color: COLORS.textSoft, fontSize: 12, fontWeight: '600', lineHeight: 17, marginBottom: 12 },

  solFlow: {
    alignItems: 'center', gap: 4,
    padding: 10, backgroundColor: COLORS.surfaceAlt,
    borderRadius: 10,
  },
  flowBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.border,
    minWidth: 120, justifyContent: 'center',
  },
  flowLabel: { color: COLORS.textSoft, fontSize: 11, fontWeight: '800' },
  flowArrow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flowArrowText: { color: COLORS.neon, fontSize: 9, fontWeight: '800' },

  solProsAndCons: { flexDirection: 'row', gap: 8, marginTop: 12 },
  pros: {
    flex: 1, padding: 10,
    backgroundColor: COLORS.green + '11',
    borderLeftWidth: 3, borderLeftColor: COLORS.green,
    borderRadius: 8,
  },
  cons: {
    flex: 1, padding: 10,
    backgroundColor: COLORS.danger + '11',
    borderLeftWidth: 3, borderLeftColor: COLORS.danger,
    borderRadius: 8,
  },
  prosTitle: { color: COLORS.green, fontSize: 11, fontWeight: '900', marginBottom: 4 },
  prosText: { color: COLORS.textSoft, fontSize: 11, lineHeight: 16, fontWeight: '600' },
  consTitle: { color: COLORS.danger, fontSize: 11, fontWeight: '900', marginBottom: 4 },
  consText: { color: COLORS.textSoft, fontSize: 11, lineHeight: 16, fontWeight: '600' },

  costBox: {
    marginTop: 10, padding: 10,
    backgroundColor: COLORS.surfaceAlt, borderRadius: 8,
    gap: 2,
  },
  costLabel: { color: COLORS.muted, fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  costValue: { color: COLORS.text, fontSize: 11, fontWeight: '700' },

  hybridFlow: { gap: 6, marginVertical: 8 },
  hybridStep: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8, paddingHorizontal: 10,
    backgroundColor: COLORS.surfaceAlt, borderRadius: 8,
  },
  hybridNum: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.green,
    alignItems: 'center', justifyContent: 'center',
  },
  hybridNumText: { color: '#05070F', fontSize: 11, fontWeight: '900' },
  hybridText: { color: COLORS.text, fontSize: 12, fontWeight: '700', flex: 1 },

  hybridChart: { marginTop: 10 },
  hybridChartTitle: { color: COLORS.textSoft, fontSize: 11, fontWeight: '800', marginBottom: 6 },
  hybridBar: { flexDirection: 'row', height: 26, borderRadius: 6, overflow: 'hidden' },
  hybridSegment: { alignItems: 'center', justifyContent: 'center' },
  hybridSegText: { color: '#05070F', fontSize: 9, fontWeight: '900' },

  roadmap: {
    marginHorizontal: 14,
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 4,
    borderWidth: 1, borderColor: COLORS.border,
  },
  roadRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingVertical: 10, paddingHorizontal: 10,
  },
  roadBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  roadNum: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  roadNumText: { fontSize: 12, fontWeight: '900' },
  roadTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roadTitle: { color: COLORS.text, fontSize: 13, fontWeight: '900', flex: 1 },
  roadStatus: {
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 5, borderWidth: 1,
  },
  roadStatusText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  roadDesc: { color: COLORS.textSoft, fontSize: 11, marginTop: 3, fontWeight: '600' },

  warnBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginHorizontal: 14, marginTop: 14, padding: 12,
    backgroundColor: COLORS.yellow + '11',
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.yellow + '55',
  },
  warnTitle: { color: COLORS.yellow, fontSize: 13, fontWeight: '900', marginBottom: 4 },
  warnText: { color: COLORS.textSoft, fontSize: 11, lineHeight: 17, fontWeight: '600' },
});
