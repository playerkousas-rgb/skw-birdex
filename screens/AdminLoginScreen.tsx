import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Platform, Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { COLORS } from '../lib/theme';
import { useBirds } from '../lib/BirdContext';
import { RootStackParamList } from '../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AdminLoginScreen() {
  const nav = useNavigation<Nav>();
  const { parentPassword, superPassword } = useBirds();
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(glow, { toValue: 0, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, []);

  const handleNum = (n: string) => {
    if (input.length >= 4) return;
    const next = input + n;
    setError(false);
    setInput(next);

    if (next.length === 4) {
      setTimeout(() => {
        if (next === superPassword) {
          nav.replace('AdminPanel', { mode: 'super' });
        } else if (next === parentPassword) {
          nav.replace('AdminPanel', { mode: 'parent' });
        } else {
          setError(true);
          if (Platform.OS !== 'web') {
            try { Vibration.vibrate(300); } catch {}
          }
          Animated.sequence([
            Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
          ]).start();
          setTimeout(() => setInput(''), 500);
        }
      }, 200);
    }
  };

  const handleDel = () => {
    setError(false);
    setInput((v) => v.slice(0, -1));
  };

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.6] });

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#1A0F2E', '#05070F', '#0A0E1F']} style={StyleSheet.absoluteFill} />
      <View style={styles.grid} pointerEvents="none">
        {Array.from({ length: 15 }).map((_, i) => (
          <View key={`h${i}`} style={[styles.gridLine, { top: (i + 1) * 50 }]} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={`v${i}`} style={[styles.gridLineV, { left: (i + 1) * 50 }]} />
        ))}
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>ADMIN ACCESS</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.center}>
          <Animated.View style={[styles.lockRing, { opacity: glowOpacity }]} />
          <View style={styles.lockBox}>
            <Ionicons
              name={error ? 'lock-closed' : 'shield-checkmark'}
              size={42}
              color={error ? COLORS.danger : COLORS.purple}
            />
          </View>

          <Text style={styles.title}>後台人員入口</Text>
          <Text style={styles.subtitle}>TWO ACCESS LEVELS</Text>

          {/* 雙模式說明 */}
          <View style={styles.modesRow}>
            <View style={styles.modeCard}>
              <View style={[styles.modeIcon, { borderColor: COLORS.yellow, backgroundColor: COLORS.yellow + '22' }]}>
                <Ionicons name="people" size={18} color={COLORS.yellow} />
              </View>
              <Text style={styles.modeTitle}>家長/老師</Text>
              <Text style={styles.modeDesc}>審核辨識失敗的照片</Text>
              <Text style={styles.modePwd}>0728</Text>
              <Text style={styles.modeNote}>（超級管理員可更改）</Text>
            </View>
            <View style={styles.modeCard}>
              <View style={[styles.modeIcon, { borderColor: COLORS.purple, backgroundColor: COLORS.purple + '22' }]}>
                <Ionicons name="shield-checkmark" size={18} color={COLORS.purple} />
              </View>
              <Text style={styles.modeTitle}>超級管理員</Text>
              <Text style={styles.modeDesc}>更新圖鑑/卡牌/全部管理</Text>
              <Text style={[styles.modePwd, { color: COLORS.purple }]}>1201</Text>
              <Text style={styles.modeNote}>（固定密碼）</Text>
            </View>
          </View>

          <Animated.View style={[styles.pinRow, { transform: [{ translateX: shake }] }]}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.pinBox,
                  input.length > i && styles.pinBoxFilled,
                  error && styles.pinBoxError,
                ]}
              >
                {input.length > i && (
                  <View
                    style={[
                      styles.pinDot,
                      { backgroundColor: error ? COLORS.danger : COLORS.purple },
                    ]}
                  />
                )}
              </View>
            ))}
          </Animated.View>

          {error && (
            <View style={styles.errorMsg}>
              <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
              <Text style={styles.errorText}>密碼錯誤，請重新輸入</Text>
            </View>
          )}

          <View style={styles.keypad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <Key key={n} label={String(n)} onPress={() => handleNum(String(n))} />
            ))}
            <View style={styles.key} />
            <Key label="0" onPress={() => handleNum('0')} />
            <Key label="⌫" onPress={handleDel} isAction />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function Key({ label, onPress, isAction }: { label: string; onPress: () => void; isAction?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.key, isAction && styles.keyAction]} activeOpacity={0.6}>
      <Text style={[styles.keyText, isAction && { color: COLORS.danger }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  grid: { ...StyleSheet.absoluteFillObject, opacity: 0.05 },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: COLORS.purple },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: COLORS.purple },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 6,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { color: COLORS.text, fontSize: 12, fontWeight: '900', letterSpacing: 3 },

  center: { flex: 1, alignItems: 'center', paddingTop: 4, paddingHorizontal: 20 },
  lockRing: {
    position: 'absolute', top: 4,
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, borderColor: COLORS.purple,
    shadowColor: COLORS.purple, shadowOpacity: 0.8, shadowRadius: 16,
  },
  lockBox: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: COLORS.surface,
    borderWidth: 2, borderColor: COLORS.purple,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 15,
    shadowColor: COLORS.purple, shadowOpacity: 0.6, shadowRadius: 12,
  },
  title: { color: COLORS.text, fontSize: 20, fontWeight: '900', letterSpacing: 2, marginTop: 10 },
  subtitle: { color: COLORS.purple, fontSize: 10, letterSpacing: 3, fontWeight: '900', marginTop: 4 },

  modesRow: {
    flexDirection: 'row', gap: 8,
    marginTop: 14, width: '100%',
  },
  modeCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 10,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', gap: 2,
  },
  modeIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, marginBottom: 4,
  },
  modeTitle: { color: COLORS.text, fontSize: 12, fontWeight: '900' },
  modeDesc: { color: COLORS.muted, fontSize: 10, textAlign: 'center', fontWeight: '600' },
  modePwd: { color: COLORS.yellow, fontSize: 16, fontWeight: '900', letterSpacing: 4, marginTop: 4, fontFamily: 'monospace' },
  modeNote: { color: COLORS.muted, fontSize: 8, fontWeight: '700' },

  pinRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  pinBox: {
    width: 46, height: 50, borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 2, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  pinBoxFilled: { borderColor: COLORS.purple },
  pinBoxError: { borderColor: COLORS.danger },
  pinDot: { width: 14, height: 14, borderRadius: 7 },

  errorMsg: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 8,
  },
  errorText: { color: COLORS.danger, fontSize: 12, fontWeight: '800' },

  keypad: {
    width: 280, marginTop: 16,
    flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center',
  },
  key: {
    width: 82, height: 52, borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  keyAction: { backgroundColor: COLORS.danger + '11', borderColor: COLORS.danger + '55' },
  keyText: { color: COLORS.text, fontSize: 20, fontWeight: '900' },
});
