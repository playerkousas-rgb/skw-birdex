import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Easing, Platform, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';

import { COLORS } from '../lib/theme';
import { useBirds } from '../lib/BirdContext';
import { RootStackParamList } from '../App';

const { width, height } = Dimensions.get('window');
const FRAME = Math.min(width - 60, 320);

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ScannerScreen() {
  const nav = useNavigation<Nav>();
  const { takePhoto, caughtSpeciesCount, totalSpeciesCount, level, xp, pendingReviews } = useBirds();

  const [permission, requestPermission] = useCameraPermissions();
  const [locationPerm, setLocationPerm] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [phase, setPhase] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [showPermModal, setShowPermModal] = useState(false);

  const scanLine = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const reticle = useRef(new Animated.Value(0)).current;

  // 初次詢問相機與 GPS 權限
  useEffect(() => {
    (async () => {
      // 相機
      if (permission && !permission.granted && permission.canAskAgain) {
        setShowPermModal(true);
      }
      // GPS（可選）
      try {
        const loc = await Location.getForegroundPermissionsAsync();
        if (loc.granted) {
          setLocationPerm(true);
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        } else {
          setLocationPerm(false);
        }
      } catch {}
    })();
  }, [permission]);

  useEffect(() => {
    Animated.loop(
      Animated.timing(reticle, { toValue: 1, duration: 10000, useNativeDriver: true, easing: Easing.linear })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulse, { toValue: 0, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (scanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLine, { toValue: 1, duration: 1100, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(scanLine, { toValue: 0, duration: 1100, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      ).start();
    } else {
      scanLine.stopAnimation();
      scanLine.setValue(0);
    }
  }, [scanning]);

  const askCamera = async () => {
    const res = await requestPermission();
    setShowPermModal(false);
    if (!res.granted) {
      Alert.alert(
        '需要相機權限',
        '無相機權限無法拍攝鳥類。可至設定中手動開啟。',
        [{ text: '知道了' }]
      );
    }
  };

  const askLocation = async () => {
    try {
      const res = await Location.requestForegroundPermissionsAsync();
      if (res.granted) {
        setLocationPerm(true);
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        Alert.alert('✓ GPS 已啟用', '捕捉時會記錄位置，幫你找到附近的觀鳥熱點！');
      } else {
        setLocationPerm(false);
        Alert.alert('GPS 未啟用', '仍可拍攝，只是無法記錄拍攝地點');
      }
    } catch (e) {
      Alert.alert('無法取得位置', String(e));
    }
  };

  const startCapture = () => {
    if (scanning) return;
    if (!permission?.granted) {
      setShowPermModal(true);
      return;
    }
    setScanning(true);
    setProgress(0);
    setPhase('SCANNING...');

    let p = 0;
    const phases = [
      { at: 0, label: 'SCANNING...' },
      { at: 0.3, label: 'FEATURE EXTRACTION' },
      { at: 0.55, label: 'MERLIN API QUERY' },
      { at: 0.8, label: 'CONFIDENCE CHECK' },
    ];

    const interval = setInterval(() => {
      p += 0.035 + Math.random() * 0.04;
      if (p >= 1) {
        p = 1;
        clearInterval(interval);
        setTimeout(() => {
          const res = takePhoto(userLoc || undefined);
          setScanning(false);
          setPhase('');
          const sid = res.result.success && res.result.species
            ? res.result.species.id
            : 0;
          nav.navigate('CaptureResult', {
            speciesId: sid,
            isNew: res.isNew,
            isGacha: !res.result.success,
            reason: res.result.reason,
            oldRarity: res.oldRarity,
            newRarity: res.newRarity,
            newCount: res.newCount,
            xpGained: res.xpGained,
          });
        }, 400);
      }
      const ph = phases.filter((x) => p >= x.at).pop();
      if (ph) setPhase(ph.label);
      setProgress(p);
    }, 90);
  };

  const reticleRot = reticle.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });
  const scanY = scanLine.interpolate({ inputRange: [0, 1], outputRange: [0, FRAME - 4] });

  // 權限請求畫面
  if (showPermModal || (permission && !permission.granted)) {
    return (
      <View style={styles.root}>
        <LinearGradient colors={['#0A0E1F', '#12152E', '#05070F']} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
          <View style={styles.permCard}>
            <View style={styles.permIcon}>
              <Ionicons name="camera" size={40} color={COLORS.neon} />
            </View>
            <Text style={styles.permTitle}>需要相機權限</Text>
            <Text style={styles.permDesc}>
              拍鳥需要使用你的相機。照片會在手機本機處理，不會上傳伺服器。
            </Text>

            <View style={styles.permRows}>
              <PermRow icon="shield-checkmark" color={COLORS.green} label="資料安全" desc="照片僅本機處理" />
              <PermRow icon="lock-closed" color={COLORS.purple} label="隱私保護" desc="不會上傳不會分享" />
              <PermRow icon="flash" color={COLORS.yellow} label="Merlin 辨識" desc="透過 Cornell AI 辨識鳥種" />
            </View>

            <TouchableOpacity style={styles.permBtn} onPress={askCamera}>
              <LinearGradient colors={[COLORS.neon, COLORS.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              <Ionicons name="camera" size={18} color="#fff" />
              <Text style={styles.permBtnText}>允許使用相機</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* 實體相機預覽（權限通過後）*/}
      {permission?.granted && Platform.OS !== 'web' ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          onCameraReady={() => setCameraReady(true)}
        />
      ) : (
        <LinearGradient
          colors={['#0A0E1F', '#12152E', '#05070F']}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* 深色覆蓋 */}
      <View style={styles.overlay} />

      {/* 網格 */}
      <View style={styles.grid} pointerEvents="none">
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={`h${i}`} style={[styles.gridLine, { top: (i + 1) * height / 11 }]} />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={`v${i}`} style={[styles.gridLineV, { left: (i + 1) * width / 6 }]} />
        ))}
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* HUD */}
        <View style={styles.hud}>
          <View style={styles.hudCard}>
            <Ionicons name="flash" size={12} color={COLORS.neon} />
            <Text style={styles.hudText}>XP {xp}</Text>
          </View>
          <View style={styles.hudCenter}>
            <Text style={styles.hudTitle}>BIRD SCANNER</Text>
            <View style={styles.hudBadges}>
              <View style={[styles.hudBadge, permission?.granted && { borderColor: COLORS.green, backgroundColor: COLORS.green + '22' }]}>
                <Ionicons name="camera" size={8} color={permission?.granted ? COLORS.green : COLORS.muted} />
                <Text style={[styles.hudBadgeText, permission?.granted && { color: COLORS.green }]}>CAM</Text>
              </View>
              <View style={[styles.hudBadge, userLoc && { borderColor: COLORS.green, backgroundColor: COLORS.green + '22' }]}>
                <Ionicons name="location" size={8} color={userLoc ? COLORS.green : COLORS.muted} />
                <Text style={[styles.hudBadgeText, userLoc && { color: COLORS.green }]}>GPS</Text>
              </View>
            </View>
          </View>
          <View style={styles.hudCard}>
            <Ionicons name="trophy" size={12} color={COLORS.yellow} />
            <Text style={styles.hudText}>LV.{level}</Text>
          </View>
        </View>

        {/* 操作列 */}
        <View style={styles.actionRow}>
          <View style={styles.dexBar}>
            <Ionicons name="grid" size={12} color={COLORS.purple} />
            <Text style={styles.dexBarText}>
              {caughtSpeciesCount}/{totalSpeciesCount}
            </Text>
            <View style={styles.dexBarTrack}>
              <View
                style={[
                  styles.dexBarFill,
                  { width: `${(caughtSpeciesCount / Math.max(1, totalSpeciesCount)) * 100}%` },
                ]}
              />
            </View>
          </View>
          {!userLoc && (
            <TouchableOpacity style={styles.gpsBtn} onPress={askLocation}>
              <Ionicons name="location-outline" size={13} color={COLORS.yellow} />
              <Text style={styles.gpsBtnText}>開 GPS</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.mapBtn} onPress={() => nav.navigate('Map')}>
            <Ionicons name="map" size={13} color={COLORS.green} />
            <Text style={styles.mapBtnText}>地圖</Text>
          </TouchableOpacity>
        </View>

        {pendingReviews.length > 0 && (
          <View style={styles.pendingHint}>
            <Ionicons name="hourglass" size={11} color={COLORS.yellow} />
            <Text style={styles.pendingHintText}>
              有 {pendingReviews.length} 張照片正在審核中
            </Text>
          </View>
        )}

        {/* 觀測窗 */}
        <View style={styles.viewfinderWrap}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                width: FRAME + 40, height: FRAME + 40, borderRadius: (FRAME + 40) / 2,
                transform: [{ scale: pulseScale }], opacity: pulseOpacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.reticle,
              { width: FRAME + 70, height: FRAME + 70, transform: [{ rotate: reticleRot }] },
            ]}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <View
                key={i}
                style={[styles.reticleTick, { transform: [{ rotate: `${i * 90}deg` }] }]}
              />
            ))}
          </Animated.View>

          <View style={styles.frame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            <View style={styles.center}>
              {scanning ? (
                <>
                  <Ionicons name="scan" size={56} color={COLORS.neon} />
                  <Text style={styles.centerText}>{phase}</Text>
                </>
              ) : (
                <>
                  <Ionicons name="camera" size={48} color="rgba(255,255,255,0.2)" />
                  <Text style={styles.centerHint}>將鳥類對準中央</Text>
                  <Text style={styles.centerHint2}>POWERED BY MERLIN</Text>
                </>
              )}
            </View>

            {scanning && (
              <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanY }] }]}>
                <LinearGradient
                  colors={['transparent', COLORS.neon, 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ flex: 1 }}
                />
              </Animated.View>
            )}
          </View>
        </View>

        {/* 進度 */}
        <View style={styles.progressWrap}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>{phase || 'SYSTEM READY'}</Text>
            <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={[COLORS.neon, COLORS.purple]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>
          <Text style={styles.progressHint}>
            {scanning ? 'Merlin Bird ID 辨識中...' : '按下中央紅鈕開始捕捉'}
          </Text>
        </View>

        {/* 控制 */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.sideBtn}>
            <Ionicons name="flash-off" size={20} color={COLORS.textSoft} />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} onPress={startCapture} disabled={scanning}>
            <LinearGradient
              colors={scanning ? ['#4A5378', '#2A334F'] : [COLORS.pokeRed, COLORS.pokeRedDark]}
              style={[
                styles.captureBtn,
                { shadowColor: scanning ? '#000' : COLORS.pokeRed },
              ]}
            >
              <View style={styles.captureInner}>
                <View style={styles.captureCore}>
                  <Ionicons
                    name={scanning ? 'sync' : 'radio-button-on'}
                    size={34}
                    color="#fff"
                  />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sideBtn}>
            <Ionicons name="images" size={20} color={COLORS.textSoft} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

function PermRow({ icon, color, label, desc }: { icon: any; color: string; label: string; desc: string }) {
  return (
    <View style={styles.permRow}>
      <View style={[styles.permRowIcon, { backgroundColor: color + '22', borderColor: color }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.permRowLabel}>{label}</Text>
        <Text style={styles.permRowDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,7,15,0.75)' },
  grid: { ...StyleSheet.absoluteFillObject, opacity: 0.07 },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: COLORS.neon },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: COLORS.neon },

  hud: {
    flexDirection: 'row', paddingHorizontal: 16, paddingTop: 4,
    alignItems: 'center', justifyContent: 'space-between',
  },
  hudCard: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(15,19,36,0.9)',
    borderColor: COLORS.border, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  hudText: { color: COLORS.text, fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  hudCenter: { alignItems: 'center' },
  hudTitle: { color: COLORS.text, fontSize: 13, fontWeight: '900', letterSpacing: 3 },
  hudBadges: { flexDirection: 'row', gap: 4, marginTop: 3 },
  hudBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 5, paddingVertical: 2,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 4,
  },
  hudBadgeText: { color: COLORS.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 },

  actionRow: { flexDirection: 'row', gap: 6, marginHorizontal: 16, marginTop: 8 },
  dexBar: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: 'rgba(15,19,36,0.9)',
    borderColor: COLORS.border, borderWidth: 1,
    borderRadius: 10,
  },
  dexBarText: { color: COLORS.text, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  dexBarTrack: { flex: 1, height: 5, backgroundColor: COLORS.surfaceAlt, borderRadius: 3, overflow: 'hidden' },
  dexBarFill: { height: '100%', backgroundColor: COLORS.purple },
  gpsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 8,
    backgroundColor: COLORS.yellow + '22',
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.yellow + '55',
  },
  gpsBtnText: { color: COLORS.yellow, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  mapBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 8,
    backgroundColor: COLORS.green + '22',
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.green + '55',
  },
  mapBtnText: { color: COLORS.green, fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  pendingHint: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginHorizontal: 16, marginTop: 6,
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: COLORS.yellow + '22',
    borderRadius: 8, borderWidth: 1, borderColor: COLORS.yellow + '55',
  },
  pendingHintText: { color: COLORS.yellow, fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  viewfinderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', borderColor: COLORS.neon, borderWidth: 2 },
  reticle: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  reticleTick: { position: 'absolute', top: 0, width: 2, height: 16, backgroundColor: COLORS.neon },
  frame: {
    width: FRAME, height: FRAME, borderRadius: 22, overflow: 'hidden',
    backgroundColor: 'rgba(0,229,255,0.03)',
  },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: COLORS.neon },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 16 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 16 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 16 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  centerText: { color: COLORS.neon, fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  centerHint: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700' },
  centerHint2: { color: 'rgba(255,255,255,0.4)', fontSize: 9, letterSpacing: 2 },
  scanLine: { position: 'absolute', left: 0, right: 0, top: 0, height: 4 },

  progressWrap: { paddingHorizontal: 32, marginBottom: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { color: COLORS.neon, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  progressPct: { color: COLORS.text, fontSize: 11, fontWeight: '900' },
  progressBar: { height: 6, backgroundColor: COLORS.surface, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%' },
  progressHint: { color: COLORS.muted, fontSize: 10, marginTop: 6, letterSpacing: 0.5 },

  controls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingHorizontal: 30, paddingTop: 10, paddingBottom: 6,
  },
  sideBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  captureBtn: {
    width: 94, height: 94, borderRadius: 47,
    alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.6, shadowRadius: 18, elevation: 12,
    borderWidth: 3, borderColor: '#1A1A1A',
  },
  captureInner: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', overflow: 'hidden',
  },
  captureCore: {
    position: 'absolute',
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 4, borderColor: '#1A1A1A',
    alignItems: 'center', justifyContent: 'center',
  },

  // 權限畫面
  permCard: {
    backgroundColor: COLORS.surface, borderRadius: 20,
    padding: 24, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center',
  },
  permIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.neon + '22',
    borderWidth: 2, borderColor: COLORS.neon,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.neon, shadowOpacity: 0.6, shadowRadius: 14,
    marginBottom: 14,
  },
  permTitle: { color: COLORS.text, fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  permDesc: { color: COLORS.textSoft, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 19, fontWeight: '600' },
  permRows: { width: '100%', gap: 8, marginTop: 18, marginBottom: 14 },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  permRowIcon: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  permRowLabel: { color: COLORS.text, fontSize: 12, fontWeight: '900' },
  permRowDesc: { color: COLORS.muted, fontSize: 10, marginTop: 1 },
  permBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%', paddingVertical: 14, borderRadius: 12,
    overflow: 'hidden',
  },
  permBtnText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
});
