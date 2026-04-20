import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS } from '../lib/theme';

export default function InstallScreen() {
  const nav = useNavigation();

  return (
    <View style={styles.root}>
      <LinearGradient colors={[COLORS.bgAlt, COLORS.bg]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>安裝說明</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={{ fontSize: 72 }}>📲</Text>
            <Text style={styles.title}>簡單 3 步，馬上開玩！</Text>
            <Text style={styles.subtitle}>不需上 App Store、不需購買、不需註冊</Text>
          </View>

          {/* 安全標章 */}
          <View style={styles.safeRow}>
            <SafeTag icon="shield-checkmark" label="完全免費" />
            <SafeTag icon="lock-closed" label="無需登入" />
            <SafeTag icon="heart" label="無廣告" />
          </View>

          {/* Step 1 */}
          <StepCard
            step={1}
            color={COLORS.primary}
            icon="qr-code"
            title="掃描 QR Code"
            desc="用手機相機掃描家長提供的專屬 QR Code，或輸入網址直接開啟。"
          >
            <View style={styles.qrBox}>
              <View style={styles.qrPattern}>
                {Array.from({ length: 49 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.qrCell,
                      { backgroundColor: [0,1,2,3,6,7,8,9,14,15,16,20,23,28,29,33,35,37,40,42,44,46,48].includes(i) ? COLORS.text : 'transparent' },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.qrHint}>示意 QR Code</Text>
            </View>
          </StepCard>

          {/* Step 2 */}
          <StepCard
            step={2}
            color={COLORS.sky}
            icon="download"
            title="加到主畫面"
            desc={Platform.OS === 'ios'
              ? '用 Safari 開啟後，點下方分享圖示 → 選擇「加入主畫面」→ 確認新增。'
              : '用 Chrome 開啟後，點右上角選單 → 選擇「安裝應用程式」或「加入主畫面」。'}
          >
            <View style={styles.phoneMockup}>
              <View style={styles.phoneScreen}>
                <View style={styles.appIcon}>
                  <Text style={{ fontSize: 30 }}>🪶</Text>
                </View>
                <Text style={styles.appName}>鳥鳥探險隊</Text>
              </View>
            </View>
          </StepCard>

          {/* Step 3 */}
          <StepCard
            step={3}
            color={COLORS.coral}
            icon="happy"
            title="開始拍鳥！"
            desc="小朋友可以从主畫面直接點開圖示，採全螢幕模式，通常的 App 體驗！"
          >
            <View style={styles.actionRow}>
              <View style={styles.emojiBox}><Text style={{ fontSize: 32 }}>👶</Text></View>
              <Ionicons name="arrow-forward" size={20} color={COLORS.textSoft} />
              <View style={styles.emojiBox}><Text style={{ fontSize: 32 }}>📸</Text></View>
              <Ionicons name="arrow-forward" size={20} color={COLORS.textSoft} />
              <View style={styles.emojiBox}><Text style={{ fontSize: 32 }}>🎉</Text></View>
            </View>
          </StepCard>

          {/* 常見問題 */}
          <Text style={styles.sectionTitle}>💡 家長常見問題</Text>

          <FAQ q="這個 App 是免費的嗎？" a="是的，全程完全免費。這是教育推廣項目，不會上架 App Store，也不會收取任何費用。" />
          <FAQ q="會收集小朋友的資料嗎？" a="不會。所有圖鑑記錄位產在手機本機，不上傳任何點，也不需要註冊帳號。" />
          <FAQ q="不需要 App Store「Allow」應用程式嗎？" a="對！我們採用「網頁應用程式」(PWA) 模式，直接產生主畫面圖示，不需經過 App Store。" />
          <FAQ q="需要給相機權限嗎？" a="才能拍鳥嗆！這是唯一需要的權限，且照片其實是傳內處理，不會送出手機。" />
          <FAQ q="如果會更新圖鑑嗎？" a="會！在「更新」分頁點「下載新鳥類」即可取得新的鳥種資料，不會影響既有收集。" />

          <View style={styles.bottomNote}>
            <Ionicons name="heart" size={16} color={COLORS.coral} />
            <Text style={styles.bottomText}>一起陪伴小朋友認識大自然吧爲</Text>
          </View>

          <TouchableOpacity style={styles.doneBtn} onPress={() => nav.goBack()}>
            <Text style={styles.doneText}>我知道了！</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SafeTag({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={tagStyles.tag}>
      <Ionicons name={icon} size={14} color={COLORS.primary} />
      <Text style={tagStyles.text}>{label}</Text>
    </View>
  );
}

const tagStyles = StyleSheet.create({
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5, borderColor: COLORS.primary + '55',
  },
  text: { color: COLORS.primaryDark, fontSize: 12, fontWeight: '800' },
});

function StepCard({
  step, color, icon, title, desc, children,
}: {
  step: number; color: string; icon: any; title: string; desc: string; children?: React.ReactNode;
}) {
  return (
    <View style={stepStyles.card}>
      <View style={stepStyles.header}>
        <View style={[stepStyles.num, { backgroundColor: color }]}>
          <Text style={stepStyles.numText}>{step}</Text>
        </View>
        <View style={[stepStyles.iconWrap, { backgroundColor: color + '22' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={stepStyles.title}>{title}</Text>
      </View>
      <Text style={stepStyles.desc}>{desc}</Text>
      {children && <View style={stepStyles.visual}>{children}</View>}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20, padding: 18,
    marginBottom: 14,
    borderWidth: 1.5, borderColor: COLORS.border,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  num: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  numText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  iconWrap: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { color: COLORS.text, fontSize: 17, fontWeight: '900', flex: 1 },
  desc: { color: COLORS.textSoft, fontSize: 13, lineHeight: 20 },
  visual: {
    marginTop: 12, alignItems: 'center',
    backgroundColor: COLORS.bgAlt, borderRadius: 14, padding: 14,
  },
});

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <View style={faqStyles.card}>
      <View style={faqStyles.qRow}>
        <View style={faqStyles.qIcon}>
          <Text style={faqStyles.qText}>Q</Text>
        </View>
        <Text style={faqStyles.q}>{q}</Text>
      </View>
      <Text style={faqStyles.a}>{a}</Text>
    </View>
  );
}

const faqStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14, padding: 14,
    marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  qRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  qIcon: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.sun,
    alignItems: 'center', justifyContent: 'center',
  },
  qText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  q: { color: COLORS.text, fontSize: 14, fontWeight: '800', flex: 1 },
  a: { color: COLORS.textSoft, fontSize: 13, marginLeft: 30, lineHeight: 19 },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 10,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { color: COLORS.text, fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 40 },

  hero: { alignItems: 'center', paddingVertical: 14 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.text, marginTop: 8, letterSpacing: 1 },
  subtitle: { fontSize: 14, color: COLORS.textSoft, marginTop: 4, fontWeight: '600' },

  safeRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 8,
    marginTop: 6, marginBottom: 20,
  },

  qrBox: { alignItems: 'center', gap: 8 },
  qrPattern: {
    width: 120, height: 120,
    backgroundColor: '#fff', padding: 10,
    flexDirection: 'row', flexWrap: 'wrap',
    borderRadius: 8,
  },
  qrCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
  },
  qrHint: { color: COLORS.muted, fontSize: 11, fontWeight: '700' },

  phoneMockup: {
    width: 120, height: 150,
    backgroundColor: '#fff',
    borderRadius: 20, padding: 8,
    borderWidth: 3, borderColor: COLORS.text,
    alignItems: 'center', justifyContent: 'center',
  },
  phoneScreen: {
    alignItems: 'center', gap: 6,
    backgroundColor: COLORS.bgAlt, width: '100%', height: '100%',
    borderRadius: 12, paddingVertical: 20,
  },
  appIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: COLORS.primary + '33',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.primary,
  },
  appName: { color: COLORS.text, fontSize: 11, fontWeight: '900' },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emojiBox: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.border,
  },

  sectionTitle: {
    color: COLORS.text, fontSize: 16, fontWeight: '900',
    marginTop: 14, marginBottom: 10,
  },

  bottomNote: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 14, marginBottom: 14,
  },
  bottomText: { color: COLORS.textSoft, fontSize: 12, fontWeight: '700' },

  doneBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16, borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  doneText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
});
