import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { COLORS } from '../lib/theme';
import { useBirds } from '../lib/BirdContext';
import { Hotspot } from '../lib/birdData';
import { RootStackParamList } from '../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// 香港地圖邊界（大略）
const HK_BOUNDS = {
  minLat: 22.15, maxLat: 22.58,
  minLng: 113.82, maxLng: 114.45,
};

// 世界地圖區域
const WORLD_REGIONS = [
  { key: 'asia', name: '亞洲', color: '#FFD740', emoji: '🌏' },
  { key: 'europe', name: '歐洲', color: '#00E5FF', emoji: '🌍' },
  { key: 'africa', name: '非洲', color: '#FF8A4C', emoji: '🌍' },
  { key: 'america', name: '美洲', color: '#00FF94', emoji: '🌎' },
  { key: 'oceania', name: '大洋洲', color: '#B388FF', emoji: '🌏' },
];

export default function MapScreen() {
  const nav = useNavigation<Nav>();
  const { allSpecies, isCaught } = useBirds();
  const [selectedBird, setSelectedBird] = useState<number | null>(null);
  const [mapView, setMapView] = useState<'hk' | 'world'>('hk');
  const [search, setSearch] = useState('');
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);

  const selected = useMemo(
    () => (selectedBird ? allSpecies.find((s) => s.id === selectedBird) : null),
    [selectedBird, allSpecies]
  );

  const filtered = useMemo(() => {
    if (!search) return allSpecies;
    return allSpecies.filter(
      (s) => s.name.includes(search) || s.scientificName.toLowerCase().includes(search.toLowerCase())
    );
  }, [allSpecies, search]);

  // 當選中鳥種時 → 取其熱點
  const hotspots = selected?.hotspots.filter((h) => h.region === mapView) || [];

  const requestGPS = () => {
    Alert.alert(
      '📍 開啟 GPS 定位',
      '開啟後可顯示你目前位置，並找出附近的觀鳥熱點。\n\n本 App 不會上傳位置資料，所有資訊僅在手機本機使用。',
      [
        { text: '暫不', style: 'cancel' },
        {
          text: '允許',
          onPress: () => {
            // 模擬取得 GPS（真實版用 expo-location）
            setGpsEnabled(true);
            // 預設位置：旺角
            setUserLoc({ lat: 22.3193, lng: 114.1694 });
            Alert.alert('✓ GPS 已啟用', '目前位置：九龍旺角');
          },
        },
      ]
    );
  };

  // 把座標轉為地圖上 0-1 的相對位置
  const coordToPos = (lat: number, lng: number) => {
    const x = (lng - HK_BOUNDS.minLng) / (HK_BOUNDS.maxLng - HK_BOUNDS.minLng);
    const y = 1 - (lat - HK_BOUNDS.minLat) / (HK_BOUNDS.maxLat - HK_BOUNDS.minLat);
    return { x: x * 100, y: y * 100 };
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0A0E1F', '#05070F']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* 頂部 */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerSub}>BIRD MAP</Text>
            <Text style={styles.headerTitle}>尋鳥地圖</Text>
          </View>
          <TouchableOpacity
            onPress={requestGPS}
            style={[styles.gpsBtn, gpsEnabled && { borderColor: COLORS.green, backgroundColor: COLORS.green + '22' }]}
          >
            <Ionicons
              name={gpsEnabled ? 'location' : 'location-outline'}
              size={14}
              color={gpsEnabled ? COLORS.green : COLORS.neon}
            />
            <Text style={[styles.gpsText, gpsEnabled && { color: COLORS.green }]}>
              {gpsEnabled ? 'GPS ON' : '開啟 GPS'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 搜尋 */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={COLORS.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="輸入鳥名找觀察地點..."
            placeholderTextColor={COLORS.muted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* 鳥類快選 */}
        {!selected && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.birdsRow}
          >
            {filtered.slice(0, 20).map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.birdChip, isCaught(s.id) && { borderColor: COLORS.green }]}
                onPress={() => setSelectedBird(s.id)}
              >
                <Text style={{ fontSize: 20 }}>{s.emoji}</Text>
                <Text style={styles.birdChipName}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* 已選中鳥類卡 */}
        {selected && (
          <View style={styles.selectedCard}>
            <View style={[styles.selectedIcon, { backgroundColor: selected.baseColor + '33', borderColor: selected.baseColor }]}>
              <Text style={{ fontSize: 28 }}>{selected.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedName}>{selected.name}</Text>
              <Text style={styles.selectedSci}>{selected.scientificName}</Text>
              <Text style={styles.selectedSeason}>📅 出沒季節：{selected.season}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedBird(null)} style={styles.clearBtn}>
              <Ionicons name="close" size={16} color={COLORS.textSoft} />
            </TouchableOpacity>
          </View>
        )}

        {/* 地圖模式切換 */}
        <View style={styles.mapSwitcher}>
          <TouchableOpacity
            style={[styles.mapSwitchBtn, mapView === 'hk' && styles.mapSwitchActive]}
            onPress={() => setMapView('hk')}
          >
            <Ionicons name="map" size={13} color={mapView === 'hk' ? COLORS.neon : COLORS.textSoft} />
            <Text style={[styles.mapSwitchText, mapView === 'hk' && { color: COLORS.neon }]}>
              香港地圖
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mapSwitchBtn, mapView === 'world' && styles.mapSwitchActive]}
            onPress={() => setMapView('world')}
          >
            <Ionicons name="globe" size={13} color={mapView === 'world' ? COLORS.neon : COLORS.textSoft} />
            <Text style={[styles.mapSwitchText, mapView === 'world' && { color: COLORS.neon }]}>
              世界分布
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {mapView === 'hk' ? (
            <HKMap
              hotspots={hotspots}
              selected={selected}
              userLoc={userLoc}
              coordToPos={coordToPos}
            />
          ) : (
            <WorldView selected={selected} />
          )}

          {/* 熱點清單 */}
          {selected && mapView === 'hk' && hotspots.length > 0 && (
            <View style={styles.spotsList}>
              <Text style={styles.spotsTitle}>
                📍 {selected.name} 的觀察熱點（{hotspots.length}）
              </Text>
              {hotspots.map((h, i) => (
                <View key={i} style={styles.spotRow}>
                  <View
                    style={[
                      styles.spotDot,
                      {
                        backgroundColor:
                          h.frequency === 'high' ? COLORS.green
                          : h.frequency === 'medium' ? COLORS.yellow
                          : COLORS.muted,
                      },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.spotName}>{h.name}</Text>
                    <View style={styles.spotMeta}>
                      <Ionicons name="pin" size={9} color={COLORS.textSoft} />
                      <Text style={styles.spotRegion}>{h.subregion || '—'}</Text>
                      {h.season && (
                        <>
                          <Text style={styles.spotDotSep}>·</Text>
                          <Ionicons name="calendar" size={9} color={COLORS.textSoft} />
                          <Text style={styles.spotRegion}>{h.season}</Text>
                        </>
                      )}
                    </View>
                  </View>
                  <View
                    style={[
                      styles.freqPill,
                      {
                        backgroundColor:
                          h.frequency === 'high' ? COLORS.green + '22'
                          : h.frequency === 'medium' ? COLORS.yellow + '22'
                          : COLORS.muted + '22',
                        borderColor:
                          h.frequency === 'high' ? COLORS.green
                          : h.frequency === 'medium' ? COLORS.yellow
                          : COLORS.muted,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.freqText,
                        {
                          color:
                            h.frequency === 'high' ? COLORS.green
                            : h.frequency === 'medium' ? COLORS.yellow
                            : COLORS.muted,
                        },
                      ]}
                    >
                      {h.frequency === 'high' ? '常見' : h.frequency === 'medium' ? '偶見' : '少見'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {selected && mapView === 'world' && (
            <View style={styles.spotsList}>
              <Text style={styles.spotsTitle}>🌏 {selected.name} 全球分布</Text>
              <View style={styles.worldChips}>
                {selected.globalRange.map((r, i) => (
                  <View key={i} style={styles.worldChip}>
                    <Text style={styles.worldChipEmoji}>🌍</Text>
                    <Text style={styles.worldChipText}>{r}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {!selected && (
            <View style={styles.hintBox}>
              <Ionicons name="information-circle" size={14} color={COLORS.neon} />
              <Text style={styles.hintText}>
                👆 從上方選擇一隻鳥，查看牠在香港（或全球）的觀察熱點
              </Text>
            </View>
          )}

          {/* 圖例 */}
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>🎯 圖例</Text>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.green }]} />
              <Text style={styles.legendText}>常見 · 很容易看到</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.yellow }]} />
              <Text style={styles.legendText}>偶見 · 需要一點運氣</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.muted }]} />
              <Text style={styles.legendText}>少見 · 珍貴相遇</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ========== 香港地圖（SVG 風格簡化版）==========
function HKMap({
  hotspots, selected, userLoc, coordToPos,
}: {
  hotspots: Hotspot[];
  selected: any;
  userLoc: { lat: number; lng: number } | null;
  coordToPos: (lat: number, lng: number) => { x: number; y: number };
}) {
  return (
    <View style={styles.mapBox}>
      <LinearGradient
        colors={['#0D1F2D', '#051521']}
        style={StyleSheet.absoluteFill}
      />
      {/* 網格 */}
      <View style={StyleSheet.absoluteFill}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={`h${i}`} style={[styles.gridH, { top: `${(i + 1) * 12.5}%` }]} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={`v${i}`} style={[styles.gridV, { left: `${(i + 1) * 12.5}%` }]} />
        ))}
      </View>

      {/* 海岸線模擬（簡化） */}
      <View style={styles.hkLand1} />
      <View style={styles.hkLand2} />
      <View style={styles.hkLand3} />

      {/* 區域標籤 */}
      <Text style={[styles.regionLabel, { top: '20%', left: '15%' }]}>新界</Text>
      <Text style={[styles.regionLabel, { top: '55%', left: '40%' }]}>九龍</Text>
      <Text style={[styles.regionLabel, { top: '72%', left: '50%' }]}>香港島</Text>
      <Text style={[styles.regionLabel, { top: '60%', left: '12%' }]}>離島</Text>

      {/* 熱點標記 */}
      {hotspots.map((h, i) => {
        const pos = coordToPos(h.lat, h.lng);
        const color =
          h.frequency === 'high' ? COLORS.green :
          h.frequency === 'medium' ? COLORS.yellow :
          COLORS.muted;
        return (
          <View
            key={i}
            style={[
              styles.hotspot,
              {
                left: `${pos.x}%`, top: `${pos.y}%`,
                backgroundColor: color + '33',
                borderColor: color,
                shadowColor: color,
              },
            ]}
          >
            <View style={[styles.hotspotCore, { backgroundColor: color }]} />
          </View>
        );
      })}

      {/* 使用者位置 */}
      {userLoc && (
        <View
          style={[
            styles.userPin,
            {
              left: `${coordToPos(userLoc.lat, userLoc.lng).x}%`,
              top: `${coordToPos(userLoc.lat, userLoc.lng).y}%`,
            },
          ]}
        >
          <View style={styles.userPinRing} />
          <View style={styles.userPinCore} />
        </View>
      )}

      {/* 指南針 */}
      <View style={styles.compass}>
        <Text style={styles.compassN}>N</Text>
        <Ionicons name="navigate" size={14} color={COLORS.neon} />
      </View>

      {/* 標題 */}
      <View style={styles.mapTitle}>
        <Ionicons name="map" size={12} color={COLORS.neon} />
        <Text style={styles.mapTitleText}>HONG KONG</Text>
      </View>

      {!selected && (
        <View style={styles.noSelectOverlay}>
          <Ionicons name="arrow-up" size={20} color={COLORS.muted} />
          <Text style={styles.noSelectText}>請選擇鳥類以顯示熱點</Text>
        </View>
      )}
    </View>
  );
}

// ========== 世界分布簡化圖 ==========
function WorldView({ selected }: { selected: any }) {
  return (
    <View style={styles.mapBox}>
      <LinearGradient
        colors={['#0A1A2F', '#051521']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.worldGrid}>
        {WORLD_REGIONS.map((r) => {
          const active = selected?.globalRange.some((g: string) => g.includes(r.name));
          return (
            <View
              key={r.key}
              style={[
                styles.worldRegion,
                active && { borderColor: r.color, backgroundColor: r.color + '22', shadowColor: r.color },
              ]}
            >
              <Text style={styles.worldEmoji}>{r.emoji}</Text>
              <Text style={[styles.worldName, active && { color: r.color }]}>{r.name}</Text>
              {active && (
                <View style={[styles.worldCheck, { backgroundColor: r.color }]}>
                  <Ionicons name="checkmark" size={10} color="#05070F" />
                </View>
              )}
            </View>
          );
        })}
      </View>
      <View style={styles.mapTitle}>
        <Ionicons name="globe" size={12} color={COLORS.neon} />
        <Text style={styles.mapTitleText}>WORLD DISTRIBUTION</Text>
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
  gpsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999,
    borderWidth: 1, borderColor: COLORS.neon + '55',
  },
  gpsText: { color: COLORS.neon, fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 14, marginVertical: 8,
    paddingHorizontal: 12, height: 40,
    backgroundColor: COLORS.surface, borderRadius: 12,
    borderColor: COLORS.border, borderWidth: 1,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 13 },

  birdsRow: { paddingHorizontal: 14, paddingBottom: 8, gap: 6 },
  birdChip: {
    alignItems: 'center', gap: 2,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border,
    width: 72,
  },
  birdChipName: { color: COLORS.text, fontSize: 10, fontWeight: '800' },

  selectedCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 14, marginBottom: 8,
    padding: 10, backgroundColor: COLORS.surface,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.neon + '55',
  },
  selectedIcon: {
    width: 50, height: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  selectedName: { color: COLORS.text, fontSize: 14, fontWeight: '900' },
  selectedSci: { color: COLORS.textSoft, fontSize: 11, fontStyle: 'italic', marginTop: 2 },
  selectedSeason: { color: COLORS.neon, fontSize: 10, fontWeight: '800', marginTop: 3 },
  clearBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },

  mapSwitcher: {
    flexDirection: 'row', gap: 6,
    marginHorizontal: 14, marginBottom: 8,
    padding: 3, backgroundColor: COLORS.surface,
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  mapSwitchBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 8, borderRadius: 7,
  },
  mapSwitchActive: { backgroundColor: COLORS.neon + '22' },
  mapSwitchText: { color: COLORS.textSoft, fontSize: 11, fontWeight: '900', letterSpacing: 1 },

  mapBox: {
    height: 300, marginHorizontal: 14,
    borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.neon + '33',
    position: 'relative',
  },
  gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: COLORS.neon + '18' },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: COLORS.neon + '18' },

  // 香港陸地輪廓（簡化）
  hkLand1: {
    position: 'absolute',
    top: '10%', left: '18%', width: '55%', height: '45%',
    backgroundColor: '#1A3350', opacity: 0.6, borderRadius: 30,
  },
  hkLand2: {
    position: 'absolute',
    top: '50%', left: '30%', width: '45%', height: '30%',
    backgroundColor: '#1A3350', opacity: 0.6, borderRadius: 20,
  },
  hkLand3: {
    position: 'absolute',
    top: '45%', left: '5%', width: '20%', height: '25%',
    backgroundColor: '#1A3350', opacity: 0.5, borderRadius: 15,
  },
  regionLabel: {
    position: 'absolute', color: COLORS.textSoft,
    fontSize: 10, fontWeight: '900', letterSpacing: 1,
    opacity: 0.7,
  },

  hotspot: {
    position: 'absolute',
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    transform: [{ translateX: -10 }, { translateY: -10 }],
    shadowOpacity: 0.8, shadowRadius: 6,
  },
  hotspotCore: { width: 6, height: 6, borderRadius: 3 },

  userPin: {
    position: 'absolute',
    width: 24, height: 24,
    alignItems: 'center', justifyContent: 'center',
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
  userPinRing: {
    position: 'absolute',
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: COLORS.neon,
    backgroundColor: COLORS.neon + '33',
  },
  userPinCore: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: COLORS.neon,
    borderWidth: 2, borderColor: '#fff',
  },

  compass: {
    position: 'absolute', top: 10, right: 10,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 8, padding: 6,
    borderWidth: 1, borderColor: COLORS.border,
  },
  compassN: { color: COLORS.neon, fontSize: 8, fontWeight: '900' },

  mapTitle: {
    position: 'absolute', bottom: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6,
    borderWidth: 1, borderColor: COLORS.neon + '55',
  },
  mapTitleText: { color: COLORS.neon, fontSize: 10, fontWeight: '900', letterSpacing: 2 },

  noSelectOverlay: {
    position: 'absolute', inset: 0,
    alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(5,7,15,0.7)',
  },
  noSelectText: { color: COLORS.textSoft, fontSize: 12, fontWeight: '700' },

  worldGrid: {
    flex: 1, padding: 14,
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    alignContent: 'flex-start',
  },
  worldRegion: {
    width: '47%', aspectRatio: 1.3,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', gap: 4,
    shadowOpacity: 0.4, shadowRadius: 8,
  },
  worldEmoji: { fontSize: 34 },
  worldName: { color: COLORS.textSoft, fontSize: 12, fontWeight: '900' },
  worldCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },

  spotsList: {
    marginHorizontal: 14, marginTop: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  spotsTitle: { color: COLORS.text, fontSize: 13, fontWeight: '900', marginBottom: 8 },
  spotRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  spotDot: { width: 10, height: 10, borderRadius: 5 },
  spotName: { color: COLORS.text, fontSize: 13, fontWeight: '800' },
  spotMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  spotRegion: { color: COLORS.textSoft, fontSize: 10, fontWeight: '700' },
  spotDotSep: { color: COLORS.muted, fontSize: 10 },
  freqPill: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999, borderWidth: 1,
  },
  freqText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  worldChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  worldChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
    borderWidth: 1, borderColor: COLORS.border,
  },
  worldChipEmoji: { fontSize: 12 },
  worldChipText: { color: COLORS.text, fontSize: 11, fontWeight: '800' },

  hintBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 14, marginTop: 14,
    padding: 12,
    backgroundColor: COLORS.surface, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.neon + '33',
  },
  hintText: { color: COLORS.textSoft, fontSize: 11, fontWeight: '600', flex: 1 },

  legend: {
    marginHorizontal: 14, marginTop: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  legendTitle: { color: COLORS.text, fontSize: 12, fontWeight: '900', marginBottom: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: COLORS.textSoft, fontSize: 11, fontWeight: '700' },
});
