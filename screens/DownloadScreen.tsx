import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

import { COLORS } from '../lib/theme';

export default function DownloadScreen() {
  const nav = useNavigation();

  // public/ 資料夾下的檔案會部署在站台根目錄
  const DOWNLOAD_ZIP = '/downloads/birddex-source.zip';
  const DOWNLOAD_TAR = '/downloads/birddex-source.tar.gz';

  const handleDownload = async (url: string) => {
    if (Platform.OS === 'web') {
      // 直接以 a 標籤觸發下載
      const a = document.createElement('a');
      a.href = url;
      a.download = '';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0A0E1F', '#05070F']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerSub}>DOWNLOAD</Text>
            <Text style={styles.headerTitle}>下載與部署</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <View style={styles.hero}>
            <Ionicons name="cloud-download" size={48} color={COLORS.neon} />
            <Text style={styles.heroTitle}>BIRD-DEX 原始碼</Text>
            <Text style={styles.heroSub}>React Native + Expo · TypeScript</Text>
          </View>

          {/* 下載按鈕 */}
          <Text style={styles.sectionTitle}>📦 下載原始碼</Text>

          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={() => handleDownload(DOWNLOAD_ZIP)}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[COLORS.neon, COLORS.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <Ionicons name="download" size={20} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={styles.downloadTitle}>下載 ZIP</Text>
              <Text style={styles.downloadSub}>Windows / Mac 通用 · ~156KB</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.downloadBtnAlt}
            onPress={() => handleDownload(DOWNLOAD_TAR)}
            activeOpacity={0.85}
          >
            <Ionicons name="archive" size={18} color={COLORS.green} />
            <View style={{ flex: 1 }}>
              <Text style={styles.downloadTitleAlt}>下載 TAR.GZ</Text>
              <Text style={styles.downloadSubAlt}>Linux / Mac · ~137KB</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.green} />
          </TouchableOpacity>

          <View style={styles.note}>
            <Ionicons name="information-circle" size={14} color={COLORS.neon} />
            <Text style={styles.noteText}>
              下載後解壓縮，內含完整源碼 + README 部署指南
            </Text>
          </View>

          {/* 部署步驟 */}
          <Text style={styles.sectionTitle}>🚀 部署步驟</Text>

          <Step
            num={1}
            title="解壓縮 & 安裝依賴"
            code="cd birddex-source\nnpm install"
            color={COLORS.neon}
          />
          <Step
            num={2}
            title="本地測試"
            code="npx expo start\n# 用 Expo Go 掃 QR code"
            color={COLORS.purple}
          />
          <Step
            num={3}
            title="編譯 Web 版（PWA）"
            code="npx expo export --platform web"
            color={COLORS.green}
          />
          <Step
            num={4}
            title="部署到 Vercel"
            code="npm i -g vercel\nvercel --prod"
            color={COLORS.yellow}
          />

          {/* 部署選項 */}
          <Text style={styles.sectionTitle}>🎯 三種部署方案</Text>

          <OptionCard
            icon="globe"
            color={COLORS.green}
            title="方案 A · PWA (推薦)"
            desc="免費、免 App Store 審核，使用者可加入手機主畫面"
            pros={['完全免費', '即時更新', 'iOS/Android 通用']}
          />
          <OptionCard
            icon="phone-portrait"
            color={COLORS.neon}
            title="方案 B · 原生 App"
            desc="編譯成 APK / IPA，可離線使用"
            pros={['完整離線', 'APK 直接分發', '需 Expo 帳號']}
          />
          <OptionCard
            icon="flash"
            color={COLORS.purple}
            title="方案 C · Expo Go"
            desc="開發階段即時測試，不需編譯"
            pros={['最快上手', '熱重載', '僅供測試用']}
          />

          {/* 平台推薦 */}
          <Text style={styles.sectionTitle}>☁️ 免費部署平台</Text>
          <PlatformRow name="Vercel" desc="最簡單 · vercel.com" recommended />
          <PlatformRow name="Netlify" desc="老牌穩定 · netlify.com" />
          <PlatformRow name="GitHub Pages" desc="免費靜態 · pages.github.com" />
          <PlatformRow name="Cloudflare Pages" desc="速度極快 · pages.cloudflare.com" />

          {/* 需要 */}
          <View style={styles.requirements}>
            <Text style={styles.reqTitle}>📋 系統需求</Text>
            <ReqRow label="Node.js" value="≥ 18.0" />
            <ReqRow label="npm" value="≥ 9.0" />
            <ReqRow label="Expo CLI" value="自動安裝" />
            <ReqRow label="磁碟空間" value="~500 MB（含 node_modules）" last />
          </View>

          <Text style={styles.footer}>
            © 2024 BIRD-DEX · 教育用途免費
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Step({ num, title, code, color }: any) {
  return (
    <View style={[stepStyles.card, { borderColor: color + '55' }]}>
      <View style={stepStyles.header}>
        <View style={[stepStyles.num, { backgroundColor: color }]}>
          <Text style={stepStyles.numText}>{num}</Text>
        </View>
        <Text style={stepStyles.title}>{title}</Text>
      </View>
      <View style={stepStyles.codeBox}>
        <Text style={stepStyles.codeText}>{code}</Text>
      </View>
    </View>
  );
}

const stepStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 12,
    borderWidth: 1, marginBottom: 8,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  num: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  numText: { color: '#05070F', fontSize: 12, fontWeight: '900' },
  title: { color: COLORS.text, fontSize: 13, fontWeight: '900' },
  codeBox: {
    backgroundColor: '#000',
    borderRadius: 6, padding: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  codeText: {
    color: COLORS.green, fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 16,
  },
});

function OptionCard({ icon, color, title, desc, pros }: any) {
  return (
    <View style={[optStyles.card, { borderColor: color + '55' }]}>
      <View style={optStyles.header}>
        <View style={[optStyles.iconBox, { backgroundColor: color + '22' }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={optStyles.title}>{title}</Text>
          <Text style={optStyles.desc}>{desc}</Text>
        </View>
      </View>
      <View style={optStyles.pros}>
        {pros.map((p: string) => (
          <View key={p} style={[optStyles.prosPill, { borderColor: color + '55', backgroundColor: color + '11' }]}>
            <Ionicons name="checkmark" size={10} color={color} />
            <Text style={[optStyles.prosText, { color }]}>{p}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const optStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 12,
    borderWidth: 1, marginBottom: 8,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  iconBox: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { color: COLORS.text, fontSize: 13, fontWeight: '900' },
  desc: { color: COLORS.textSoft, fontSize: 11, marginTop: 2, fontWeight: '600' },
  pros: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  prosPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 999, borderWidth: 1,
  },
  prosText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
});

function PlatformRow({ name, desc, recommended }: any) {
  return (
    <View style={[platStyles.row, recommended && { borderColor: COLORS.green + '55' }]}>
      <View style={[platStyles.icon, recommended && { backgroundColor: COLORS.green + '22' }]}>
        <Ionicons name="cloud" size={16} color={recommended ? COLORS.green : COLORS.textSoft} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={platStyles.name}>{name}</Text>
        <Text style={platStyles.desc}>{desc}</Text>
      </View>
      {recommended && (
        <View style={platStyles.recBadge}>
          <Text style={platStyles.recText}>推薦</Text>
        </View>
      )}
    </View>
  );
}

const platStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 6,
  },
  icon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { color: COLORS.text, fontSize: 13, fontWeight: '900' },
  desc: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  recBadge: { backgroundColor: COLORS.green, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  recText: { color: '#05070F', fontSize: 10, fontWeight: '900' },
});

function ReqRow({ label, value, last }: any) {
  return (
    <View style={[reqStyles.row, !last && reqStyles.border]}>
      <Text style={reqStyles.label}>{label}</Text>
      <Text style={reqStyles.value}>{value}</Text>
    </View>
  );
}

const reqStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  border: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  label: { color: COLORS.textSoft, fontSize: 12, fontWeight: '700' },
  value: { color: COLORS.text, fontSize: 12, fontWeight: '900' },
});

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

  hero: {
    alignItems: 'center', gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 16, padding: 24,
    borderWidth: 1, borderColor: COLORS.neon + '55',
    marginBottom: 16,
    shadowColor: COLORS.neon, shadowOpacity: 0.4, shadowRadius: 10,
  },
  heroTitle: { color: COLORS.text, fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  heroSub: { color: COLORS.neon, fontSize: 11, fontWeight: '800', letterSpacing: 2 },

  sectionTitle: {
    color: COLORS.text, fontSize: 13, fontWeight: '900',
    letterSpacing: 1, marginBottom: 10, marginTop: 14,
  },

  downloadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14,
    overflow: 'hidden', marginBottom: 8,
    shadowColor: COLORS.neon, shadowOpacity: 0.4, shadowRadius: 10,
  },
  downloadTitle: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  downloadSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2, fontWeight: '700' },

  downloadBtnAlt: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.green + '55',
    marginBottom: 10,
  },
  downloadTitleAlt: { color: COLORS.green, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  downloadSubAlt: { color: COLORS.textSoft, fontSize: 11, marginTop: 2, fontWeight: '700' },

  note: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: COLORS.neon + '33',
  },
  noteText: { color: COLORS.textSoft, fontSize: 11, flex: 1, fontWeight: '600' },

  requirements: {
    backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: COLORS.border,
    marginTop: 10,
  },
  reqTitle: { color: COLORS.text, fontSize: 12, fontWeight: '900', marginBottom: 6 },

  footer: {
    color: COLORS.muted, fontSize: 10,
    textAlign: 'center', marginTop: 20, letterSpacing: 1,
  },
});
