import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, VARIANT_LABEL, VARIANT_EMOJI, tierColor } from '../lib/theme';
import { useBirds } from '../lib/BirdContext';
import TierBadge from '../components/RarityBadge';
import { RootStackParamList } from '../App';

export default function CardViewScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'CardView'>>();
  const nav = useNavigation();
  const { allCards, allSpecies, collected } = useBirds();
  const card = allCards.find((c) => c.id === route.params.cardId)!;
  const species = allSpecies.find((s) => s.id === card.speciesId)!;
  const record = collected[card.id];

  const flip = useRef(new Animated.Value(0)).current;
  const shine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(flip, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }).start();
    Animated.loop(
      Animated.timing(shine, {
        toValue: 1, duration: 3000, useNativeDriver: true, easing: Easing.linear,
      })
    ).start();
  }, []);

  const scale = flip.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
  const rotate = flip.interpolate({ inputRange: [0, 1], outputRange: ['-180deg', '0deg'] });
  const shineX = shine.interpolate({ inputRange: [0, 1], outputRange: [-200, 300] });

  return (
    <View style={styles.root}>
      <LinearGradient colors={[card.color + '77', '#FFF8EC']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>卡片收藏</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.scene}>
          <Animated.View
            style={[
              styles.card,
              { borderColor: card.color, transform: [{ scale }, { rotate }] },
            ]}
          >
            {/* 閃光 */}
            <Animated.View
              style={[
                styles.shine,
                { transform: [{ translateX: shineX }, { rotate: '20deg' }] },
              ]}
            />

            <LinearGradient
              colors={[card.color, card.color + 'AA']}
              style={styles.cardHeader}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardNo}>#{String(species.id).padStart(3, '0')}</Text>
                <View style={styles.variantPill}>
                  <Text style={styles.variantEmoji}>{VARIANT_EMOJI[card.variant]}</Text>
                  <Text style={styles.variantText}>{VARIANT_LABEL[card.variant]}</Text>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.cardBody}>
              <View
                style={[
                  styles.cardCircle,
                  { backgroundColor: card.color + '33', borderColor: card.color },
                ]}
              >
                <Text style={styles.cardEmoji}>{card.emoji}</Text>
              </View>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardSpecies}>{species.name}</Text>
              <Text style={styles.cardSci}>{species.scientificName}</Text>
              <Text style={styles.cardHint}>「{card.hint}」</Text>

              <View style={styles.cardBadgeRow}>
                <TierBadge tier={species.tier} small />
                <View style={styles.familyPill}>
                  <Ionicons name="library" size={10} color={COLORS.textSoft} />
                  <Text style={styles.familyText}>{species.family}</Text>
                </View>
              </View>

              <View style={styles.collectInfo}>
                <Ionicons name="time" size={12} color={COLORS.textSoft} />
                <Text style={styles.collectText}>
                  {new Date(record.collectedAt).toLocaleDateString()} 首次收集
                </Text>
              </View>
              <View style={styles.collectInfo}>
                <Ionicons name="eye" size={12} color={COLORS.textSoft} />
                <Text style={styles.collectText}>遇見 {record.count} 次</Text>
              </View>
            </View>
          </Animated.View>
        </View>

        <View style={styles.note}>
          <Ionicons name="information-circle" size={16} color={COLORS.textSoft} />
          <Text style={styles.noteText}>
            每張卡片代表鳥鳥的不同姿態，例如幼鳥、繁殖羽、飛行姿勢等。
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 8,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', borderColor: COLORS.border, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { color: COLORS.text, fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  scene: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 5,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  shine: {
    position: 'absolute',
    width: 80, height: 500,
    backgroundColor: 'rgba(255,255,255,0.4)',
    top: -100,
    zIndex: 1,
  },
  cardHeader: { paddingHorizontal: 16, paddingVertical: 12 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardNo: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  variantPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999,
  },
  variantEmoji: { fontSize: 12 },
  variantText: { color: COLORS.text, fontSize: 11, fontWeight: '900' },

  cardBody: { padding: 18, alignItems: 'center', gap: 6 },
  cardCircle: {
    width: 130, height: 130, borderRadius: 65,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, marginBottom: 4,
  },
  cardEmoji: { fontSize: 70 },
  cardTitle: { color: COLORS.text, fontSize: 20, fontWeight: '900' },
  cardSpecies: { color: COLORS.textSoft, fontSize: 13, fontWeight: '800' },
  cardSci: { color: COLORS.muted, fontSize: 11, fontStyle: 'italic' },
  cardHint: {
    color: COLORS.muted, fontSize: 12,
    fontStyle: 'italic', textAlign: 'center', marginTop: 4,
  },
  cardBadgeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
  },
  familyPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.bgAlt,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
    borderWidth: 1, borderColor: COLORS.border,
  },
  familyText: { color: COLORS.textSoft, fontSize: 10, fontWeight: '800' },

  collectInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 4,
  },
  collectText: { color: COLORS.textSoft, fontSize: 11, fontWeight: '700' },

  note: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 24, paddingVertical: 14,
  },
  noteText: { color: COLORS.textSoft, fontSize: 12, flex: 1, fontWeight: '600' },
});
