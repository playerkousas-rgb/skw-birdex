import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { COLORS, RARITY, RARITY_ORDER } from '../lib/theme';
import { useBirds } from '../lib/BirdContext';
import { NOTION_MODULES, BirdSpecies } from '../lib/birdData';
import { RootStackParamList } from '../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Tab = 'overview' | 'species' | 'review' | 'notion' | 'settings' | 'import';

export default function AdminPanelScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'AdminPanel'>>();
  const mode = route.params?.mode || 'parent';
  const isSuper = mode === 'super';

  const {
    allSpecies, internalCount, remoteCount,
    xp, level, totalPhotos, totalRecognized, totalPhotosInAlbum,
    caughtSpeciesCount, remoteOverrides, syncHistory, pendingReviews,
    syncFromNotion, resetData, approveReview, rejectReview,
    parentPassword, setParentPassword, records,
  } = useBirds();

  const [tab, setTab] = useState<Tab>(isSuper ? 'overview' : 'review');
  const [detailSpecies, setDetailSpecies] = useState<BirdSpecies | null>(null);
  const [search, setSearch] = useState('');
  const [selectingSpeciesFor, setSelectingSpeciesFor] = useState<string | null>(null);
  const [pwdModal, setPwdModal] = useState(false);
  const [newPwd, setNewPwd] = useState('');

  const filteredSpecies = useMemo(() => {
    if (!search) return allSpecies;
    return allSpecies.filter(
      (s) =>
        s.name.includes(search) ||
        s.scientificName.toLowerCase().includes(search.toLowerCase()) ||
        s.family.includes(search) ||
        String(s.id).includes(search)
    );
  }, [allSpecies, search]);

  // 家長模式只可看這些 tab
  const availableTabs: { key: Tab; label: string; icon: any; badge?: number; alert?: boolean }[] = isSuper
    ? [
        { key: 'overview', label: '總覽', icon: 'stats-chart' },
        { key: 'species', label: '物種資料', icon: 'albums', badge: allSpecies.length },
        { key: 'review', label: '審核', icon: 'hourglass', badge: pendingReviews.length, alert: pendingReviews.length > 0 },
        { key: 'notion', label: 'Notion', icon: 'server', badge: NOTION_MODULES.length },
        { key: 'import', label: '匯入', icon: 'cloud-upload' },
        { key: 'settings', label: '設定', icon: 'settings' },
      ]
    : [
        { key: 'review', label: '審核照片', icon: 'hourglass', badge: pendingReviews.length, alert: pendingReviews.length > 0 },
        { key: 'overview', label: '狀態', icon: 'stats-chart' },
      ];

  const handleSavePwd = () => {
    if (newPwd.length === 4 && /^\d+$/.test(newPwd)) {
      setParentPassword(newPwd);
      setPwdModal(false);
      setNewPwd('');
      Alert.alert('✓ 密碼已更新', `家長/老師密碼已改為 ${newPwd}`);
    } else {
      Alert.alert('⚠️ 無效密碼', '請輸入 4 位數字');
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#1A0F2E', '#05070F']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* 頂部 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
            <Ionicons name="exit" size={20} color={COLORS.danger} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerSub}>ADMIN PANEL</Text>
            <Text style={styles.headerTitle}>
              {isSuper ? '超級管理員' : '家長 / 老師'}
            </Text>
          </View>
          <View style={[
            styles.liveDot,
            { backgroundColor: isSuper ? COLORS.purple + '22' : COLORS.yellow + '22',
              borderColor: isSuper ? COLORS.purple : COLORS.yellow },
          ]}>
            <View style={[styles.liveDotCore, { backgroundColor: isSuper ? COLORS.purple : COLORS.yellow }]} />
            <Text style={[styles.liveText, { color: isSuper ? COLORS.purple : COLORS.yellow }]}>
              {isSuper ? 'SUPER' : 'PARENT'}
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {availableTabs.map((t) => (
            <TabBtn
              key={t.key}
              label={t.label}
              icon={t.icon}
              active={tab === t.key}
              onPress={() => setTab(t.key)}
              badge={t.badge}
              alert={t.alert}
            />
          ))}
        </ScrollView>

        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
          {tab === 'overview' && (
            <OverviewTab
              isSuper={isSuper}
              internalCount={internalCount}
              remoteCount={remoteCount}
              total={allSpecies.length}
              xp={xp}
              level={level}
              totalPhotos={totalPhotos}
              totalPhotosInAlbum={totalPhotosInAlbum}
              totalRecognized={totalRecognized}
              caughtSpecies={caughtSpeciesCount}
              reviewCount={pendingReviews.length}
              syncHistory={syncHistory}
              onSync={isSuper ? async () => {
                try {
                  const r = await syncFromNotion();
                  Alert.alert('✓ 同步完成', `更新 ${r.updated} 筆資料`);
                } catch {
                  Alert.alert('✗ 同步失敗');
                }
              } : undefined}
              onReset={isSuper ? () => {
                Alert.alert('⚠️ 重置所有資料？', '會清除訓練家的捕捉紀錄與後台覆蓋', [
                  { text: '取消', style: 'cancel' },
                  { text: '重置', style: 'destructive', onPress: resetData },
                ]);
              } : undefined}
            />
          )}

          {tab === 'review' && (
            <ReviewTab
              reviews={pendingReviews}
              species={allSpecies}
              onSelectSpecies={setSelectingSpeciesFor}
              onReject={rejectReview}
              records={records}
            />
          )}

          {tab === 'species' && isSuper && (
            <SpeciesTab
              search={search}
              setSearch={setSearch}
              species={filteredSpecies}
              remoteOverrides={remoteOverrides}
              records={records}
              onSelect={setDetailSpecies}
            />
          )}

          {tab === 'notion' && isSuper && <NotionTab modules={NOTION_MODULES} />}

          {tab === 'import' && isSuper && <ImportTab />}

          {tab === 'settings' && isSuper && (
            <SettingsTab
              parentPassword={parentPassword}
              onChangePwd={() => { setNewPwd(parentPassword); setPwdModal(true); }}
            />
          )}
        </ScrollView>
      </SafeAreaView>

      {/* 物種詳細 Modal */}
      <Modal visible={!!detailSpecies} transparent animationType="slide" onRequestClose={() => setDetailSpecies(null)}>
        {detailSpecies && (
          <View style={styles.modalBg}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={{ fontSize: 26 }}>{detailSpecies.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{detailSpecies.name}</Text>
                  <Text style={styles.modalSubtitle}>
                    #{String(detailSpecies.id).padStart(3, '0')} · {detailSpecies.scientificName}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setDetailSpecies(null)}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 500 }}>
                <SpeciesJsonView species={detailSpecies} />
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>

      {/* 選鳥種 Modal（審核用）*/}
      <Modal visible={!!selectingSpeciesFor} transparent animationType="slide" onRequestClose={() => setSelectingSpeciesFor(null)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.green} />
              <Text style={[styles.modalTitle, { flex: 1 }]}>選擇正確的鳥類</Text>
              <TouchableOpacity onPress={() => setSelectingSpeciesFor(null)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={allSpecies}
              keyExtractor={(item) => String(item.id)}
              style={{ maxHeight: 500 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.speciesPickRow}
                  onPress={() => {
                    if (selectingSpeciesFor) {
                      approveReview(selectingSpeciesFor, item.id);
                      setSelectingSpeciesFor(null);
                      Alert.alert('✓ 已核准', `卡片「${item.name}」已發給小朋友`);
                    }
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.speciesPickName}>{item.name}</Text>
                    <Text style={styles.speciesPickSci}>{item.scientificName}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* 修改密碼 Modal */}
      <Modal visible={pwdModal} transparent animationType="fade" onRequestClose={() => setPwdModal(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { maxHeight: 'auto' }]}>
            <Text style={styles.modalTitle}>變更家長/老師密碼</Text>
            <Text style={styles.modalHint}>
              適用於老師換班、學期活動等場景。輸入 4 位數字。
            </Text>
            <TextInput
              style={styles.pwdInput}
              value={newPwd}
              onChangeText={setNewPwd}
              placeholder="0000"
              placeholderTextColor={COLORS.muted}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry={false}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnGhost]}
                onPress={() => { setPwdModal(false); setNewPwd(''); }}
              >
                <Text style={styles.modalBtnGhostText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={handleSavePwd}
              >
                <Text style={styles.modalBtnPrimaryText}>儲存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function TabBtn({
  label, icon, active, onPress, badge, alert,
}: { label: string; icon: any; active: boolean; onPress: () => void; badge?: number; alert?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <Ionicons name={icon} size={14} color={active ? COLORS.purple : COLORS.textSoft} />
      <Text style={[styles.tabText, active && { color: COLORS.purple }]}>{label}</Text>
      {badge !== undefined && badge > 0 && (
        <View style={[styles.tabBadge, alert && { backgroundColor: COLORS.danger }]}>
          <Text style={styles.tabBadgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function OverviewTab({
  isSuper, internalCount, remoteCount, total, xp, level,
  totalPhotos, totalPhotosInAlbum, totalRecognized, caughtSpecies, reviewCount,
  syncHistory, onSync, onReset,
}: any) {
  return (
    <>
      <Text style={styles.sectionTitle}>📊 訓練家狀態</Text>
      <View style={styles.statsGrid}>
        <StatCard label="等級" value={`Lv.${level}`} color={COLORS.yellow} icon="trophy" />
        <StatCard label="XP" value={xp} color={COLORS.neon} icon="flash" />
        <StatCard label="已收集" value={caughtSpecies} color={COLORS.green} icon="grid" />
        <StatCard label="本地照片" value={totalPhotosInAlbum} color={COLORS.purple} icon="images" />
      </View>

      <Text style={styles.sectionTitle}>🎯 系統狀態</Text>
      <View style={styles.statsGrid}>
        <StatCard label="總鳥種" value={total} color={COLORS.neon} icon="albums" />
        <StatCard label="內建" value={internalCount} color={COLORS.green} icon="cube" />
        <StatCard label="後台覆蓋" value={remoteCount} color={COLORS.purple} icon="cloud-done" />
        <StatCard label="待審核" value={reviewCount} color={reviewCount > 0 ? COLORS.danger : COLORS.yellow} icon="hourglass" />
      </View>

      {isSuper && onSync && (
        <>
          <Text style={styles.sectionTitle}>⚙️ 快速操作</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={onSync}>
            <LinearGradient colors={[COLORS.neon, COLORS.purple]} style={StyleSheet.absoluteFill} />
            <Ionicons name="sync" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>從 Notion 同步最新資料</Text>
          </TouchableOpacity>
          {onReset && (
            <TouchableOpacity style={[styles.actionBtn, styles.actionDanger]} onPress={onReset}>
              <Ionicons name="trash" size={18} color={COLORS.danger} />
              <Text style={[styles.actionBtnText, { color: COLORS.danger }]}>重置所有資料</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <Text style={styles.sectionTitle}>🕐 同步紀錄</Text>
      {syncHistory.slice(0, 5).map((e: any, i: number) => (
        <View key={i} style={styles.logRow}>
          <View style={[styles.logDot, { backgroundColor: e.status === 'success' ? COLORS.green : COLORS.danger }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.logTitle}>{e.source} · {e.changes} 筆</Text>
            <Text style={styles.logMeta}>{new Date(e.ts).toLocaleString()}</Text>
          </View>
          <Ionicons
            name={e.status === 'success' ? 'checkmark-circle' : 'close-circle'}
            size={16}
            color={e.status === 'success' ? COLORS.green : COLORS.danger}
          />
        </View>
      ))}
    </>
  );
}

function ReviewTab({ reviews, species, onSelectSpecies, onReject, records }: any) {
  if (reviews.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="checkmark-done-circle" size={48} color={COLORS.green} />
        <Text style={styles.emptyTitle}>所有照片都審核完成了！</Text>
        <Text style={styles.emptyHint}>小朋友上傳新照片時會出現在這裡</Text>
      </View>
    );
  }
  return (
    <>
      <View style={styles.reviewHeader}>
        <Ionicons name="hourglass" size={16} color={COLORS.yellow} />
        <Text style={styles.reviewHeaderText}>
          有 {reviews.length} 張照片需要審核（AI 辨識失敗）
        </Text>
      </View>

      <View style={styles.flowBox}>
        <Text style={styles.flowTitle}>📋 審核流程</Text>
        <Text style={styles.flowText}>
          1. 小朋友拍照後若 AI 辨識失敗 → 自動送來這裡{'\n'}
          2. 家長/老師檢查照片後，點「選鳥種」選正確鳥類{'\n'}
          3. 確認 → 卡片發放 + 自動歸類到相冊（+60 XP）
        </Text>
      </View>

      {reviews.map((r: any) => (
        <View key={r.id} style={styles.reviewCard}>
          <View style={styles.reviewTop}>
            <View style={styles.reviewPhoto}>
              <Text style={{ fontSize: 32 }}>❓</Text>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.reviewBird}>未辨識照片</Text>
              <View style={styles.reviewMeta}>
                <Ionicons name="alert-circle" size={10} color={COLORS.danger} />
                <Text style={styles.reviewUser}>失敗原因：{r.aiResult.reason}</Text>
              </View>
              <View style={styles.reviewMeta}>
                <Ionicons name="time" size={10} color={COLORS.textSoft} />
                <Text style={styles.reviewUser}>{new Date(r.submittedAt).toLocaleString()}</Text>
              </View>
            </View>
          </View>

          {/* AI 建議的次選 */}
          {r.aiResult.alternatives && r.aiResult.alternatives.length > 0 && (
            <View style={styles.alternatives}>
              <Text style={styles.alternativesTitle}>🤖 AI 建議可能是：</Text>
              <View style={styles.altRow}>
                {r.aiResult.alternatives.map((alt: any) => (
                  <TouchableOpacity
                    key={alt.species.id}
                    style={styles.altChip}
                    onPress={() => onSelectSpecies(r.id)}
                  >
                    <Text style={{ fontSize: 14 }}>{alt.species.emoji}</Text>
                    <Text style={styles.altName}>{alt.species.name}</Text>
                    <Text style={styles.altConf}>{Math.round(alt.confidence * 100)}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.reviewActions}>
            <TouchableOpacity
              style={[styles.reviewBtn, styles.reviewBtnReject]}
              onPress={() => onReject(r.id)}
            >
              <Ionicons name="close" size={16} color={COLORS.danger} />
              <Text style={[styles.reviewBtnText, { color: COLORS.danger }]}>不是鳥</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reviewBtn, styles.reviewBtnApprove]}
              onPress={() => onSelectSpecies(r.id)}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={[styles.reviewBtnText, { color: '#fff' }]}>選鳥種發卡</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </>
  );
}

function SpeciesTab({ search, setSearch, species, remoteOverrides, records, onSelect }: any) {
  return (
    <>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={COLORS.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="搜尋鳥名、學名、科別..."
          placeholderTextColor={COLORS.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <Text style={styles.sectionHint}>
        點擊查看完整 Notion 資料結構（含小朋友拍攝計數）
      </Text>
      {species.map((s: BirdSpecies) => {
        const isRemote = !!remoteOverrides[s.id];
        const rec = records[s.id];
        return (
          <TouchableOpacity
            key={s.id}
            style={[styles.speciesRow, isRemote && { borderColor: COLORS.purple + '55' }]}
            onPress={() => onSelect(s)}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 24 }}>{s.emoji}</Text>
            <View style={{ flex: 1 }}>
              <View style={styles.speciesTitleRow}>
                <Text style={styles.speciesId}>#{String(s.id).padStart(3, '0')}</Text>
                <Text style={styles.speciesName}>{s.name}</Text>
                {isRemote && (
                  <View style={styles.remotePill}>
                    <Ionicons name="cloud-done" size={9} color={COLORS.purple} />
                    <Text style={styles.remotePillText}>REMOTE</Text>
                  </View>
                )}
              </View>
              <Text style={styles.speciesSci}>{s.scientificName}</Text>
              <View style={styles.speciesMetaRow}>
                <View style={styles.miniTag}>
                  <Ionicons name="library" size={9} color={COLORS.neon} />
                  <Text style={styles.miniTagText}>{s.family}</Text>
                </View>
                {rec && (
                  <View style={[styles.miniTag, { backgroundColor: COLORS.green + '22' }]}>
                    <Ionicons name="camera" size={9} color={COLORS.green} />
                    <Text style={[styles.miniTagText, { color: COLORS.green }]}>×{rec.count}</Text>
                  </View>
                )}
                <View style={[styles.miniTag, { backgroundColor: s.aiRecognizable ? COLORS.green + '22' : COLORS.purple + '22' }]}>
                  <Ionicons name={s.aiRecognizable ? 'checkmark' : 'dice'} size={9} color={s.aiRecognizable ? COLORS.green : COLORS.purple} />
                  <Text style={[styles.miniTagText, { color: s.aiRecognizable ? COLORS.green : COLORS.purple }]}>
                    {s.aiRecognizable ? `AI ${Math.round((s.aiConfidence || 0) * 100)}%` : '需審核'}
                  </Text>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
          </TouchableOpacity>
        );
      })}
    </>
  );
}

function NotionTab({ modules }: any) {
  return (
    <>
      <View style={styles.notionInfo}>
        <Ionicons name="information-circle" size={14} color={COLORS.neon} />
        <Text style={styles.notionInfoText}>
          Notion 只儲存「圖鑑資料 + 卡牌樣式」，不存使用者照片（兒童照片只留在本機手機）
        </Text>
      </View>
      {modules.map((m: any) => (
        <View key={m.key} style={[styles.moduleRow, { borderColor: m.color + '55' }]}>
          <View style={[styles.moduleIcon, { backgroundColor: m.color + '22' }]}>
            <Ionicons name={m.icon} size={18} color={m.color} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.moduleName}>{m.name}</Text>
              <View
                style={[
                  styles.levelTag,
                  {
                    backgroundColor: m.adminLevel === 'super' ? COLORS.purple + '22' : COLORS.yellow + '22',
                    borderColor: m.adminLevel === 'super' ? COLORS.purple : COLORS.yellow,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.levelTagText,
                    { color: m.adminLevel === 'super' ? COLORS.purple : COLORS.yellow },
                  ]}
                >
                  {m.adminLevel === 'super' ? 'SUPER' : 'PARENT'}
                </Text>
              </View>
            </View>
            <Text style={styles.moduleDesc}>{m.desc}</Text>
            <View style={styles.moduleFields}>
              {m.fields.map((f: string) => (
                <View key={f} style={styles.fieldChip}>
                  <Text style={styles.fieldChipText}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.moduleCount}>
            <Text style={[styles.moduleCountNum, { color: m.color }]}>{m.count}</Text>
            <Text style={styles.moduleCountLabel}>筆</Text>
          </View>
        </View>
      ))}
    </>
  );
}

function ImportTab() {
  return (
    <>
      <View style={styles.importHero}>
        <Ionicons name="cloud-upload" size={36} color={COLORS.neon} />
        <Text style={styles.importTitle}>批次匯入鳥類資料</Text>
        <Text style={styles.importSub}>支援 CSV / JSON / Notion API</Text>
      </View>
      <Text style={styles.sectionTitle}>🔗 免費資料來源</Text>
      <SourceCard icon="sparkles" color={COLORS.yellow} title="Merlin Bird ID" desc="Cornell 大學 AI 鳥類辨識" badge="推薦" items={['API', 'Photo ID', 'Sound ID']} />
      <SourceCard icon="leaf" color={COLORS.green} title="香港觀鳥會" desc="香港鳥類名錄及觀察紀錄" badge="CSV" items={['中文名', '英文名', '棲地', '保育']} />
      <SourceCard icon="globe" color={COLORS.neon} title="eBird Taxonomy" desc="全球 10,000+ 鳥類分類資料" badge="JSON" items={['Scientific', 'Order', 'Family']} />
      <SourceCard icon="image" color={COLORS.purple} title="iNaturalist" desc="含辨識 API 與龐大照片資料庫" badge="API" items={['Photos', 'Observations']} />
    </>
  );
}

function SettingsTab({ parentPassword, onChangePwd }: any) {
  return (
    <>
      <Text style={styles.sectionTitle}>🔐 密碼管理</Text>
      <View style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>家長/老師密碼</Text>
            <Text style={styles.settingHint}>用於審核照片，可依活動週期更新</Text>
          </View>
          <Text style={styles.settingValue}>{parentPassword}</Text>
          <TouchableOpacity style={styles.settingBtn} onPress={onChangePwd}>
            <Ionicons name="create" size={14} color={COLORS.neon} />
            <Text style={styles.settingBtnText}>變更</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>超級管理員密碼</Text>
            <Text style={styles.settingHint}>固定 1201，不可從 App 變更</Text>
          </View>
          <Text style={[styles.settingValue, { color: COLORS.purple }]}>1201</Text>
          <View style={[styles.settingBtn, { opacity: 0.4 }]}>
            <Ionicons name="lock-closed" size={14} color={COLORS.muted} />
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>💾 儲存策略</Text>
      <View style={styles.settingCard}>
        <InfoStorageRow
          title="兒童照片（個人相冊）"
          desc="儲存於手機本機 AsyncStorage"
          icon="phone-portrait"
          color={COLORS.green}
          detail="最多 2000 張"
        />
        <InfoStorageRow
          title="捕捉計數（×N）"
          desc="儲存於手機本機，用於投入感"
          icon="stats-chart"
          color={COLORS.neon}
          detail="無上限"
        />
        <InfoStorageRow
          title="鳥類卡牌 / 圖鑑"
          desc="儲存於 Notion 後台 + App 內建"
          icon="cloud-done"
          color={COLORS.purple}
          detail="標準化資料"
        />
        <InfoStorageRow
          title="審核紀錄"
          desc="儲存於手機本機，不上傳"
          icon="checkmark-done"
          color={COLORS.yellow}
          detail="最多 20 筆"
          last
        />
      </View>
    </>
  );
}

function InfoStorageRow({ title, desc, icon, color, detail, last }: any) {
  return (
    <View style={[isrStyles.row, !last && isrStyles.border]}>
      <View style={[isrStyles.iconBox, { backgroundColor: color + '22', borderColor: color }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={isrStyles.title}>{title}</Text>
        <Text style={isrStyles.desc}>{desc}</Text>
      </View>
      <Text style={[isrStyles.detail, { color }]}>{detail}</Text>
    </View>
  );
}

const isrStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  border: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  iconBox: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  title: { color: COLORS.text, fontSize: 12, fontWeight: '900' },
  desc: { color: COLORS.muted, fontSize: 10, marginTop: 2, fontWeight: '600' },
  detail: { fontSize: 10, fontWeight: '900' },
});

function SourceCard({ icon, color, title, desc, badge, items }: any) {
  return (
    <View style={[styles.sourceCard, { borderColor: color + '55' }]}>
      <View style={styles.sourceHead}>
        <View style={[styles.sourceIcon, { backgroundColor: color + '22' }]}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sourceTitle}>{title}</Text>
          <Text style={styles.sourceDesc}>{desc}</Text>
        </View>
        <View style={[styles.sourceBadge, { borderColor: color, backgroundColor: color + '22' }]}>
          <Text style={[styles.sourceBadgeText, { color }]}>{badge}</Text>
        </View>
      </View>
      <View style={styles.sourceFields}>
        {items.map((it: string) => (
          <View key={it} style={styles.fieldChip}>
            <Text style={styles.fieldChipText}>{it}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SpeciesJsonView({ species }: { species: BirdSpecies }) {
  const entries: [string, any][] = [
    ['id', species.id],
    ['name', species.name],
    ['scientificName', species.scientificName],
    ['family', species.family],
    ['order', species.order],
    ['size', species.size],
    ['habitat', species.habitat.join(', ')],
    ['diet', species.diet],
    ['features', species.features],
    ['funFact', species.funFact],
    ['region', species.region],
    ['season', species.season],
    ['merlinCode', species.merlinCode || '-'],
    ['aiRecognizable', String(species.aiRecognizable)],
    ['aiConfidence', species.aiConfidence ?? 'null'],
    ['hotspots', `${species.hotspots.length} 個`],
    ['globalRange', species.globalRange.join(', ')],
    ['notionId', species.notionId],
    ['source', species.source || 'internal'],
  ];
  return (
    <View style={{ paddingTop: 10 }}>
      {entries.map(([k, v], i) => (
        <View key={k} style={[styles.jsonRow, i < entries.length - 1 && styles.jsonBorder]}>
          <Text style={styles.jsonKey}>{k}</Text>
          <Text style={styles.jsonVal}>{String(v)}</Text>
        </View>
      ))}
    </View>
  );
}

function StatCard({ label, value, color, icon }: any) {
  return (
    <View style={[styles.statCard, { borderColor: color + '55' }]}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.danger + '11',
    borderWidth: 1, borderColor: COLORS.danger + '55',
    alignItems: 'center', justifyContent: 'center',
  },
  headerSub: { color: COLORS.purple, fontSize: 9, letterSpacing: 3, fontWeight: '900' },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  liveDot: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6,
  },
  liveDotCore: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },

  tabs: { paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 999,
  },
  tabActive: { borderColor: COLORS.purple, backgroundColor: COLORS.purple + '22' },
  tabText: { color: COLORS.textSoft, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  tabBadge: {
    backgroundColor: COLORS.neon,
    minWidth: 18, height: 16, borderRadius: 8,
    paddingHorizontal: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  tabBadgeText: { color: '#05070F', fontSize: 10, fontWeight: '900' },

  sectionTitle: { color: COLORS.text, fontSize: 13, fontWeight: '900', letterSpacing: 1, marginBottom: 10, marginTop: 14 },
  sectionHint: { color: COLORS.muted, fontSize: 11, marginBottom: 10, fontWeight: '600' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard: {
    width: '48%', backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 12, borderWidth: 1,
    alignItems: 'center', gap: 4,
  },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12,
    overflow: 'hidden', marginTop: 8,
  },
  actionDanger: {
    backgroundColor: COLORS.danger + '11',
    borderWidth: 1, borderColor: COLORS.danger + '55',
  },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1 },

  logRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.surface, borderRadius: 10, padding: 10,
    borderColor: COLORS.border, borderWidth: 1, marginBottom: 6,
  },
  logDot: { width: 8, height: 8, borderRadius: 4 },
  logTitle: { color: COLORS.text, fontSize: 12, fontWeight: '800' },
  logMeta: { color: COLORS.muted, fontSize: 10, marginTop: 2 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.surface, borderRadius: 10,
    paddingHorizontal: 12, height: 42,
    borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 10,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 13 },

  speciesRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 10,
    borderColor: COLORS.border, borderWidth: 1,
    marginBottom: 6,
  },
  speciesTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  speciesId: { color: COLORS.muted, fontSize: 11, fontWeight: '900' },
  speciesName: { color: COLORS.text, fontSize: 14, fontWeight: '900', flex: 1 },
  speciesSci: { color: COLORS.textSoft, fontSize: 11, fontStyle: 'italic', marginTop: 2 },
  speciesMetaRow: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  miniTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: COLORS.neon + '22',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5,
  },
  miniTagText: { color: COLORS.neon, fontSize: 9, fontWeight: '900' },
  remotePill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: COLORS.purple + '22',
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5,
    borderWidth: 1, borderColor: COLORS.purple,
  },
  remotePillText: { color: COLORS.purple, fontSize: 8, fontWeight: '900', letterSpacing: 1 },

  reviewHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.yellow + '22',
    borderWidth: 1, borderColor: COLORS.yellow + '55',
    borderRadius: 10, padding: 10, marginBottom: 12,
  },
  reviewHeaderText: { color: COLORS.yellow, fontSize: 12, fontWeight: '800' },
  flowBox: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 12,
    borderColor: COLORS.border, borderWidth: 1,
    marginBottom: 14,
  },
  flowTitle: { color: COLORS.text, fontSize: 12, fontWeight: '900', marginBottom: 6 },
  flowText: { color: COLORS.textSoft, fontSize: 11, lineHeight: 18, fontWeight: '600' },

  reviewCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 12,
    borderColor: COLORS.border, borderWidth: 1,
    marginBottom: 10,
  },
  reviewTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  reviewPhoto: {
    width: 56, height: 56, borderRadius: 12,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  reviewBird: { color: COLORS.text, fontSize: 14, fontWeight: '900' },
  reviewMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reviewUser: { color: COLORS.textSoft, fontSize: 11, fontWeight: '700' },

  alternatives: {
    marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  alternativesTitle: { color: COLORS.neon, fontSize: 10, fontWeight: '900', marginBottom: 6, letterSpacing: 1 },
  altRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  altChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.neon + '11',
    borderWidth: 1, borderColor: COLORS.neon + '55',
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8,
  },
  altName: { color: COLORS.text, fontSize: 11, fontWeight: '800' },
  altConf: { color: COLORS.neon, fontSize: 9, fontWeight: '900' },

  reviewActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  reviewBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 10, borderRadius: 10,
  },
  reviewBtnReject: {
    backgroundColor: COLORS.danger + '11',
    borderWidth: 1, borderColor: COLORS.danger + '55',
  },
  reviewBtnApprove: { backgroundColor: COLORS.green },
  reviewBtnText: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },

  emptyState: {
    alignItems: 'center', gap: 10, padding: 40,
    backgroundColor: COLORS.surface, borderRadius: 14,
    borderColor: COLORS.border, borderWidth: 1,
  },
  emptyTitle: { color: COLORS.text, fontSize: 14, fontWeight: '900' },
  emptyHint: { color: COLORS.muted, fontSize: 11, textAlign: 'center' },

  notionInfo: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: COLORS.neon + '33',
    marginBottom: 12,
  },
  notionInfoText: { color: COLORS.textSoft, fontSize: 11, flex: 1, fontWeight: '600', lineHeight: 16 },

  moduleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 12,
    borderWidth: 1, marginBottom: 8,
  },
  moduleIcon: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  moduleName: { color: COLORS.text, fontSize: 13, fontWeight: '900' },
  moduleDesc: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  moduleFields: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  fieldChip: {
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    borderWidth: 1, borderColor: COLORS.border,
  },
  fieldChipText: { color: COLORS.textSoft, fontSize: 9, fontWeight: '800' },
  moduleCount: { alignItems: 'center' },
  moduleCountNum: { fontSize: 20, fontWeight: '900' },
  moduleCountLabel: { color: COLORS.muted, fontSize: 9, fontWeight: '800' },

  levelTag: {
    paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: 4, borderWidth: 1,
  },
  levelTagText: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },

  importHero: {
    alignItems: 'center', gap: 6,
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 20,
    borderWidth: 1, borderColor: COLORS.neon + '55',
    marginBottom: 10,
  },
  importTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  importSub: { color: COLORS.muted, fontSize: 11, fontWeight: '700' },

  sourceCard: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 12,
    borderWidth: 1, marginBottom: 8,
  },
  sourceHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  sourceIcon: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  sourceTitle: { color: COLORS.text, fontSize: 13, fontWeight: '900' },
  sourceDesc: { color: COLORS.muted, fontSize: 11, marginTop: 2, fontWeight: '600' },
  sourceBadge: {
    paddingHorizontal: 6, paddingVertical: 3,
    borderRadius: 5, borderWidth: 1,
  },
  sourceBadgeText: { fontSize: 9, fontWeight: '900' },
  sourceFields: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },

  settingCard: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 12,
    borderColor: COLORS.border, borderWidth: 1, marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  settingLabel: { color: COLORS.text, fontSize: 13, fontWeight: '900' },
  settingHint: { color: COLORS.muted, fontSize: 10, marginTop: 2, fontWeight: '600' },
  settingValue: { color: COLORS.yellow, fontSize: 18, fontWeight: '900', fontFamily: 'monospace', letterSpacing: 3 },
  settingBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: COLORS.neon + '11',
    borderWidth: 1, borderColor: COLORS.neon + '55',
  },
  settingBtnText: { color: COLORS.neon, fontSize: 11, fontWeight: '900' },

  modalBg: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16, padding: 16,
    maxHeight: '85%',
    borderWidth: 2, borderColor: COLORS.purple,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10,
    paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { color: COLORS.text, fontSize: 16, fontWeight: '900' },
  modalHint: { color: COLORS.muted, fontSize: 11, marginTop: 6, marginBottom: 10 },
  modalSubtitle: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  jsonRow: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 12,
    paddingVertical: 8,
  },
  jsonBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  jsonKey: { color: COLORS.neon, fontSize: 11, fontWeight: '900', fontFamily: 'monospace' },
  jsonVal: { color: COLORS.text, fontSize: 11, flex: 1, textAlign: 'right', fontFamily: 'monospace' },

  speciesPickRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 6,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  speciesPickName: { color: COLORS.text, fontSize: 14, fontWeight: '900' },
  speciesPickSci: { color: COLORS.muted, fontSize: 11, fontStyle: 'italic' },

  pwdInput: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14,
    color: COLORS.text, fontSize: 24, fontWeight: '900',
    textAlign: 'center', letterSpacing: 10,
    borderWidth: 2, borderColor: COLORS.border,
  },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  modalBtnGhost: { backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border },
  modalBtnGhostText: { color: COLORS.textSoft, fontWeight: '900' },
  modalBtnPrimary: { backgroundColor: COLORS.purple },
  modalBtnPrimaryText: { color: '#fff', fontWeight: '900' },
});
