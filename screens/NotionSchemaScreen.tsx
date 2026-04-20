import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { COLORS } from '../lib/theme';
import { RootStackParamList } from '../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type FieldType = 'title' | 'text' | 'number' | 'select' | 'multi' | 'checkbox' | 'url' | 'date' | 'files';

interface Field {
  key: string;
  name: string;
  type: FieldType;
  required: boolean;
  desc: string;
  example?: string;
  options?: string[];
}

interface Database {
  key: string;
  title: string;
  emoji: string;
  color: string;
  desc: string;
  priority: 'must' | 'should' | 'nice';
  fields: Field[];
}

const DATABASES: Database[] = [
  {
    key: 'species',
    title: '🦜 鳥類圖鑑 (Species)',
    emoji: '🦜',
    color: COLORS.neon,
    priority: 'must',
    desc: '主資料庫，每隻鳥一筆。App 辨識/圖鑑/卡牌都從這裡讀取。',
    fields: [
      { key: 'id', name: 'ID', type: 'number', required: true, desc: '唯一編號 1-999', example: '1' },
      { key: 'name', name: '中文名', type: 'title', required: true, desc: '主要標題欄位', example: '麻雀' },
      { key: 'nameEn', name: '英文名', type: 'text', required: true, desc: '英文俗名', example: 'Eurasian Tree Sparrow' },
      { key: 'nameYue', name: '粵語俗名', type: 'text', required: false, desc: '廣東話叫法', example: '麻雀仔' },
      { key: 'scientificName', name: '學名', type: 'text', required: true, desc: '拉丁學名（斜體）', example: 'Passer montanus' },
      { key: 'family', name: '科別', type: 'select', required: true, desc: '中文科別', example: '麻雀科' },
      { key: 'familyEn', name: '科別英文', type: 'text', required: false, desc: 'Family in English', example: 'Passeridae' },
      { key: 'order', name: '目', type: 'select', required: true, desc: '分類目', example: '雀形目' },
      { key: 'size', name: '體長', type: 'text', required: true, desc: '平均體長', example: '14 cm' },
      { key: 'habitat', name: '棲地', type: 'multi', required: true, desc: '多選棲地類型', options: ['都市', '鄉村', '森林', '山地', '濕地', '海岸', '草原', '溪流'] },
      { key: 'diet', name: '食性', type: 'text', required: true, desc: '主要食物', example: '種子、小蟲' },
      { key: 'features', name: '外型特徵', type: 'text', required: true, desc: '一句話描述', example: '褐色頭頂、黑色喉斑' },
      { key: 'funFact', name: '小知識', type: 'text', required: true, desc: '給小朋友的有趣知識', example: '麻雀會用沙子洗沙澡！' },
      { key: 'description', name: '生態描述', type: 'text', required: true, desc: '2-3 句話介紹', example: '最常見的都市鳥類...' },
      { key: 'region', name: '分布區域', type: 'text', required: true, desc: '地理範圍', example: '全港' },
      { key: 'season', name: '出沒季節', type: 'select', required: true, desc: '四季/春夏/秋冬', example: '四季' },
      { key: 'globalRange', name: '全球分布', type: 'multi', required: false, desc: '洲別', options: ['亞洲', '歐洲', '非洲', '美洲', '大洋洲'] },
      { key: 'baseColor', name: '主色碼', type: 'text', required: true, desc: 'HEX 色碼（卡牌用）', example: '#C8966A' },
      { key: 'emoji', name: 'Emoji', type: 'text', required: true, desc: '代表圖示', example: '🐦' },
      { key: 'call', name: '鳴聲', type: 'text', required: false, desc: '擬聲詞', example: '啾啾啾' },
      { key: 'tags', name: '標籤', type: 'multi', required: false, desc: '多選標籤', options: ['留鳥', '候鳥', '夏候鳥', '冬候鳥', '保育類', '特有種', '都市鳥', '水鳥', '猛禽', '夜行'] },
      { key: 'aiRecognizable', name: 'AI可辨識', type: 'checkbox', required: true, desc: 'Merlin 是否能辨識' },
      { key: 'aiConfidence', name: '辨識信心度', type: 'number', required: false, desc: '0-1 小數', example: '0.95' },
      { key: 'merlinCode', name: 'Merlin 代碼', type: 'text', required: false, desc: 'Cornell 官方代碼', example: 'eutspa' },
      { key: 'ebirdCode', name: 'eBird 代碼', type: 'text', required: false, desc: 'eBird 對應代碼', example: 'eutspa' },
      { key: 'photoUrl', name: '實拍照片', type: 'url', required: false, desc: 'Cornell Macaulay 圖片連結' },
      { key: 'illustrationUrl', name: '卡牌插畫', type: 'files', required: false, desc: '自製 Pokémon 風插畫' },
      { key: 'audioUrl', name: '叫聲音檔', type: 'url', required: false, desc: 'MP3 連結' },
      { key: 'pack', name: '資料包', type: 'number', required: true, desc: '每 10 隻一包', example: '1' },
    ],
  },
  {
    key: 'hotspots',
    title: '📍 觀察熱點 (Hotspots)',
    emoji: '📍',
    color: COLORS.green,
    priority: 'must',
    desc: '香港/世界各地的觀鳥地點，提供「尋鳥地圖」功能使用。',
    fields: [
      { key: 'id', name: 'ID', type: 'number', required: true, desc: '熱點編號' },
      { key: 'name', name: '地點名稱', type: 'title', required: true, desc: '地點', example: '米埔自然保護區' },
      { key: 'nameEn', name: '英文名', type: 'text', required: false, example: 'Mai Po Nature Reserve' },
      { key: 'lat', name: '緯度', type: 'number', required: true, example: '22.4869' },
      { key: 'lng', name: '經度', type: 'number', required: true, example: '114.0314' },
      { key: 'region', name: '地區', type: 'select', required: true, options: ['hk', 'world'] },
      { key: 'subregion', name: '子區域', type: 'select', required: false, options: ['香港島', '九龍', '新界', '離島', '亞洲', '歐洲', '美洲', '非洲', '大洋洲'] },
      { key: 'frequency', name: '常見度', type: 'select', required: true, options: ['high', 'medium', 'low'] },
      { key: 'birdIds', name: '相關鳥類', type: 'multi', required: true, desc: '關聯鳥類 ID（如 1,5,7）' },
      { key: 'season', name: '季節', type: 'select', required: false, options: ['四季', '春夏', '秋冬', '冬季'] },
      { key: 'description', name: '地點介紹', type: 'text', required: false },
      { key: 'accessTip', name: '交通提示', type: 'text', required: false, desc: '如何前往' },
    ],
  },
  {
    key: 'cards',
    title: '💎 卡牌樣式 (Card Styles)',
    emoji: '💎',
    color: COLORS.purple,
    priority: 'should',
    desc: '7 級稀有度 (UC/C/R/SR/SSR/UR/LR) 的外觀定義。修改後會即時覆蓋 App 內的卡牌樣式。',
    fields: [
      { key: 'rarity', name: '稀有度', type: 'title', required: true, example: 'SSR' },
      { key: 'cnLabel', name: '中文標籤', type: 'text', required: true, example: '極稀有' },
      { key: 'gradientStart', name: '漸層起始色', type: 'text', required: true, example: '#D47A1F' },
      { key: 'gradientEnd', name: '漸層結束色', type: 'text', required: true, example: '#7D3B00' },
      { key: 'glowColor', name: '光暈色', type: 'text', required: true, example: '#FF8A4C' },
      { key: 'borderColor', name: '邊框色', type: 'text', required: true, example: '#FFAA4C' },
      { key: 'threshold', name: '升級門檻', type: 'number', required: true, desc: '需捕捉次數', example: '15' },
      { key: 'stars', name: '星級', type: 'number', required: true, desc: '1-7 星', example: '5' },
      { key: 'frameStyle', name: '邊框樣式', type: 'select', required: false, options: ['standard', 'holographic', 'animated', 'rainbow'] },
    ],
  },
  {
    key: 'funfacts',
    title: '💡 小知識庫 (Fun Facts)',
    emoji: '💡',
    color: COLORS.yellow,
    priority: 'should',
    desc: '可為每隻鳥增補多則知識，適合不同年齡層的小朋友。',
    fields: [
      { key: 'id', name: 'ID', type: 'number', required: true },
      { key: 'birdId', name: '鳥類 ID', type: 'number', required: true, desc: '對應鳥類編號' },
      { key: 'fact', name: '知識內容', type: 'title', required: true, example: '麻雀其實不太會在樹上築巢！' },
      { key: 'difficulty', name: '難易度', type: 'select', required: true, options: ['easy', 'medium', 'hard'] },
      { key: 'ageGroup', name: '適合年齡', type: 'select', required: true, options: ['3-6', '7-9', '10-12', 'all'] },
      { key: 'source', name: '資料來源', type: 'text', required: false },
    ],
  },
  {
    key: 'events',
    title: '🎉 活動主題 (Events)',
    emoji: '🎉',
    color: COLORS.pink,
    priority: 'nice',
    desc: '特定活動對應的鳥類任務，如候鳥季、觀鳥日、學校活動等。',
    fields: [
      { key: 'eventName', name: '活動名稱', type: 'title', required: true, example: '冬候鳥觀察月' },
      { key: 'targetBirds', name: '目標鳥類', type: 'multi', required: true, desc: '多個鳥類 ID' },
      { key: 'startDate', name: '開始日期', type: 'date', required: true },
      { key: 'endDate', name: '結束日期', type: 'date', required: true },
      { key: 'reward', name: '獎勵', type: 'text', required: false, desc: '完成獎勵說明' },
      { key: 'description', name: '活動說明', type: 'text', required: true },
      { key: 'icon', name: '活動圖示', type: 'text', required: false, desc: 'emoji' },
    ],
  },
  {
    key: 'review',
    title: '📋 審核紀錄 (Review Log)',
    emoji: '📋',
    color: COLORS.orange,
    priority: 'nice',
    desc: '家長/老師的審核歷史，僅後台可見。',
    fields: [
      { key: 'photoId', name: '照片ID', type: 'title', required: true },
      { key: 'reviewer', name: '審核者', type: 'text', required: true, example: '王老師' },
      { key: 'result', name: '結果', type: 'select', required: true, options: ['approved', 'rejected'] },
      { key: 'birdId', name: '核定鳥種', type: 'number', required: false },
      { key: 'timestamp', name: '時間', type: 'date', required: true },
      { key: 'childName', name: '小朋友', type: 'text', required: false },
      { key: 'note', name: '備註', type: 'text', required: false },
    ],
  },
  {
    key: 'settings',
    title: '⚙️ 系統設定 (Settings)',
    emoji: '⚙️',
    color: COLORS.info,
    priority: 'nice',
    desc: '可動態調整的系統參數（密碼、辨識閾值、同步頻率）。',
    fields: [
      { key: 'key', name: '設定 Key', type: 'title', required: true, example: 'parentPassword' },
      { key: 'value', name: '值', type: 'text', required: true, example: '0728' },
      { key: 'type', name: '類型', type: 'select', required: true, options: ['string', 'number', 'boolean'] },
      { key: 'desc', name: '說明', type: 'text', required: true },
      { key: 'category', name: '分類', type: 'select', required: false, options: ['security', 'ai', 'sync', 'ui'] },
    ],
  },
];

const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  title: 'Title',
  text: 'Text',
  number: 'Number',
  select: 'Select',
  multi: 'Multi-Select',
  checkbox: 'Checkbox',
  url: 'URL',
  date: 'Date',
  files: 'Files & Media',
};

const FIELD_TYPE_COLOR: Record<FieldType, string> = {
  title: '#FF8A4C',
  text: '#00E5FF',
  number: '#B388FF',
  select: '#00FF94',
  multi: '#5DE88A',
  checkbox: '#FFD740',
  url: '#FF4DA6',
  date: '#5BB3FF',
  files: '#FF4DA6',
};

const NOTION_URL = 'https://www.notion.so/347d890c9c1780d8867af53e012fcc65';

export default function NotionSchemaScreen() {
  const nav = useNavigation<Nav>();
  const [expanded, setExpanded] = useState<string | null>('species');

  const openNotion = () => {
    Linking.openURL(NOTION_URL).catch(() => {
      Alert.alert('無法開啟', NOTION_URL);
    });
  };

  const copySchema = (db: Database) => {
    const lines = db.fields.map((f) =>
      `${f.name}\t${FIELD_TYPE_LABEL[f.type]}\t${f.required ? '必填' : '選填'}\t${f.desc}`
    ).join('\n');
    Alert.alert(
      `${db.title} 欄位清單`,
      `已準備 ${db.fields.length} 個欄位結構。\n\n實際 App 中會使用剪貼簿複製，這裡顯示前 5 項：\n\n${lines.split('\n').slice(0, 5).join('\n')}...`,
    );
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#12152E', '#05070F']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* 頂部 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerSub}>NOTION SCHEMA</Text>
            <Text style={styles.headerTitle}>資料庫欄位結構</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
          {/* 說明卡 */}
          <View style={styles.introCard}>
            <LinearGradient
              colors={[COLORS.neon + '22', COLORS.purple + '22']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.introHeader}>
              <Ionicons name="construct" size={20} color={COLORS.neon} />
              <Text style={styles.introTitle}>建置 Notion 資料庫指南</Text>
            </View>
            <Text style={styles.introText}>
              以下是 App 需要對應的 7 個資料庫。請在你的 Notion 頁面內建立這些 Database，並依欄位結構新增 Properties。
            </Text>
            <TouchableOpacity style={styles.openNotionBtn} onPress={openNotion}>
              <Ionicons name="open" size={14} color="#fff" />
              <Text style={styles.openNotionText}>開啟我的 Notion 頁面</Text>
            </TouchableOpacity>
          </View>

          {/* 優先順序說明 */}
          <View style={styles.priorityGuide}>
            <Text style={styles.priorityTitle}>📊 建議建置順序</Text>
            <View style={styles.priorityRow}>
              <PriorityBadge level="must" label="必建" />
              <Text style={styles.priorityDesc}>核心功能需要（物種 + 熱點）</Text>
            </View>
            <View style={styles.priorityRow}>
              <PriorityBadge level="should" label="推薦" />
              <Text style={styles.priorityDesc}>優化體驗（卡牌樣式 + 小知識）</Text>
            </View>
            <View style={styles.priorityRow}>
              <PriorityBadge level="nice" label="選用" />
              <Text style={styles.priorityDesc}>進階功能（活動 + 審核 + 設定）</Text>
            </View>
          </View>

          {/* 資料庫清單 */}
          {DATABASES.map((db) => {
            const isOpen = expanded === db.key;
            return (
              <View key={db.key} style={[styles.dbCard, { borderColor: db.color + '55' }]}>
                <TouchableOpacity
                  onPress={() => setExpanded(isOpen ? null : db.key)}
                  style={styles.dbHeader}
                  activeOpacity={0.8}
                >
                  <View style={styles.dbTitleRow}>
                    <Text style={{ fontSize: 22 }}>{db.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={styles.dbTitleInner}>
                        <Text style={styles.dbTitle}>{db.title}</Text>
                        <PriorityBadge level={db.priority} label={
                          db.priority === 'must' ? '必建' :
                          db.priority === 'should' ? '推薦' : '選用'
                        } />
                      </View>
                      <Text style={styles.dbDesc}>{db.desc}</Text>
                      <View style={styles.dbStats}>
                        <View style={styles.dbStat}>
                          <Ionicons name="list" size={11} color={db.color} />
                          <Text style={[styles.dbStatText, { color: db.color }]}>
                            {db.fields.length} 個欄位
                          </Text>
                        </View>
                        <View style={styles.dbStat}>
                          <Ionicons name="shield-checkmark" size={11} color={COLORS.green} />
                          <Text style={[styles.dbStatText, { color: COLORS.green }]}>
                            {db.fields.filter((f) => f.required).length} 必填
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={COLORS.textSoft}
                    />
                  </View>
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.dbBody}>
                    <View style={styles.fieldHeader}>
                      <Text style={[styles.fieldHeaderText, { flex: 2 }]}>欄位名稱</Text>
                      <Text style={[styles.fieldHeaderText, { width: 90 }]}>類型</Text>
                      <Text style={[styles.fieldHeaderText, { width: 40 }]}>必填</Text>
                    </View>

                    {db.fields.map((f) => (
                      <View key={f.key} style={styles.fieldRow}>
                        <View style={{ flex: 2, gap: 2 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <Text style={styles.fieldName}>{f.name}</Text>
                            <Text style={styles.fieldKey}>{f.key}</Text>
                          </View>
                          <Text style={styles.fieldDesc}>{f.desc}</Text>
                          {f.example && (
                            <View style={styles.exampleBox}>
                              <Text style={styles.exampleLabel}>例</Text>
                              <Text style={styles.exampleText}>{f.example}</Text>
                            </View>
                          )}
                          {f.options && f.options.length > 0 && (
                            <View style={styles.optionsRow}>
                              {f.options.slice(0, 5).map((o) => (
                                <View key={o} style={styles.optionPill}>
                                  <Text style={styles.optionText}>{o}</Text>
                                </View>
                              ))}
                              {f.options.length > 5 && (
                                <Text style={styles.moreText}>+{f.options.length - 5}</Text>
                              )}
                            </View>
                          )}
                        </View>

                        <View style={{ width: 90 }}>
                          <View
                            style={[
                              styles.typeTag,
                              { backgroundColor: FIELD_TYPE_COLOR[f.type] + '22', borderColor: FIELD_TYPE_COLOR[f.type] },
                            ]}
                          >
                            <Text
                              style={[
                                styles.typeText,
                                { color: FIELD_TYPE_COLOR[f.type] },
                              ]}
                            >
                              {FIELD_TYPE_LABEL[f.type]}
                            </Text>
                          </View>
                        </View>

                        <View style={{ width: 40, alignItems: 'center' }}>
                          {f.required ? (
                            <Ionicons name="checkmark-circle" size={16} color={COLORS.green} />
                          ) : (
                            <Ionicons name="ellipse-outline" size={16} color={COLORS.muted} />
                          )}
                        </View>
                      </View>
                    ))}

                    {/* 操作 */}
                    <View style={styles.dbActions}>
                      <TouchableOpacity style={styles.dbActionBtn} onPress={() => copySchema(db)}>
                        <Ionicons name="copy" size={12} color={COLORS.neon} />
                        <Text style={styles.dbActionText}>查看欄位清單</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.dbActionBtn} onPress={openNotion}>
                        <Ionicons name="open" size={12} color={COLORS.purple} />
                        <Text style={[styles.dbActionText, { color: COLORS.purple }]}>在 Notion 建立</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}

          {/* 下一步 */}
          <View style={styles.nextSteps}>
            <Text style={styles.nextTitle}>🚀 下一步：接上 Notion API</Text>
            <Step num={1} text="在 Notion 建立上述 7 個資料庫" />
            <Step num={2} text="前往 notion.so/my-integrations 建立一個 Integration，取得 API Key" />
            <Step num={3} text="將每個 Database 與 Integration 連結（Share → Connect）" />
            <Step num={4} text="複製每個 Database 的 ID（URL 中的那段）" />
            <Step num={5} text="在 App 後台「API 設定」頁貼上 Key 與 Database IDs" />
            <Step num={6} text="點「立即同步」→ 資料即會覆蓋內建內容" last />
          </View>

          {/* API 資訊 */}
          <View style={styles.apiCard}>
            <View style={styles.apiHeader}>
              <Ionicons name="key" size={14} color={COLORS.yellow} />
              <Text style={styles.apiTitle}>Notion API 參考</Text>
            </View>
            <CodeRow label="API Base" value="https://api.notion.com/v1" />
            <CodeRow label="Version" value="2022-06-28" />
            <CodeRow label="Auth Header" value="Bearer secret_xxx..." />
            <CodeRow label="費用" value="完全免費（Notion 官方）" last />
          </View>

          {/* Merlin 資訊 */}
          <View style={styles.apiCard}>
            <View style={styles.apiHeader}>
              <Ionicons name="sparkles" size={14} color={COLORS.green} />
              <Text style={styles.apiTitle}>Merlin Bird ID 申請</Text>
            </View>
            <CodeRow label="官網" value="merlin.allaboutbirds.org" />
            <CodeRow label="開發者頁" value="ebird.org/api/keygen" />
            <CodeRow label="費用" value="免費" />
            <CodeRow label="限制" value="每日 1000 次請求" last />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function PriorityBadge({ level, label }: { level: 'must' | 'should' | 'nice'; label: string }) {
  const color =
    level === 'must' ? COLORS.danger :
    level === 'should' ? COLORS.yellow :
    COLORS.muted;
  return (
    <View style={[priority.badge, { borderColor: color, backgroundColor: color + '22' }]}>
      <Text style={[priority.text, { color }]}>{label}</Text>
    </View>
  );
}

const priority = StyleSheet.create({
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, borderWidth: 1 },
  text: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
});

function Step({ num, text, last }: { num: number; text: string; last?: boolean }) {
  return (
    <View style={[stepS.row, !last && stepS.border]}>
      <View style={stepS.num}>
        <Text style={stepS.numText}>{num}</Text>
      </View>
      <Text style={stepS.text}>{text}</Text>
    </View>
  );
}

const stepS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  border: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  num: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.neon + '33',
    borderWidth: 1, borderColor: COLORS.neon,
    alignItems: 'center', justifyContent: 'center',
  },
  numText: { color: COLORS.neon, fontSize: 11, fontWeight: '900' },
  text: { color: COLORS.textSoft, fontSize: 12, flex: 1, fontWeight: '700' },
});

function CodeRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[codeS.row, !last && codeS.border]}>
      <Text style={codeS.label}>{label}</Text>
      <Text style={codeS.value}>{value}</Text>
    </View>
  );
}

const codeS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  border: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  label: { color: COLORS.textSoft, fontSize: 11, fontWeight: '700', width: 90 },
  value: { color: COLORS.text, fontSize: 11, fontWeight: '800', fontFamily: 'monospace', flex: 1 },
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
  headerSub: { color: COLORS.purple, fontSize: 10, letterSpacing: 3, fontWeight: '900' },
  headerTitle: { color: COLORS.text, fontSize: 20, fontWeight: '900', letterSpacing: 1 },

  introCard: {
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.neon + '55',
    marginBottom: 14, overflow: 'hidden',
  },
  introHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  introTitle: { color: COLORS.text, fontSize: 15, fontWeight: '900' },
  introText: { color: COLORS.textSoft, fontSize: 12, lineHeight: 18, fontWeight: '600', marginBottom: 10 },
  openNotionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10,
    backgroundColor: COLORS.neon,
  },
  openNotionText: { color: '#05070F', fontSize: 12, fontWeight: '900', letterSpacing: 1 },

  priorityGuide: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 14,
  },
  priorityTitle: { color: COLORS.text, fontSize: 12, fontWeight: '900', marginBottom: 8 },
  priorityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  priorityDesc: { color: COLORS.textSoft, fontSize: 11, fontWeight: '700' },

  dbCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14, borderWidth: 1,
    marginBottom: 10, overflow: 'hidden',
  },
  dbHeader: { padding: 12 },
  dbTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dbTitleInner: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  dbTitle: { color: COLORS.text, fontSize: 14, fontWeight: '900' },
  dbDesc: { color: COLORS.textSoft, fontSize: 11, marginTop: 4, lineHeight: 15, fontWeight: '600' },
  dbStats: { flexDirection: 'row', gap: 10, marginTop: 6 },
  dbStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dbStatText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  dbBody: {
    borderTopWidth: 1, borderTopColor: COLORS.border,
    padding: 12,
  },
  fieldHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    marginBottom: 6,
  },
  fieldHeaderText: { color: COLORS.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  fieldRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  fieldName: { color: COLORS.text, fontSize: 13, fontWeight: '900' },
  fieldKey: { color: COLORS.neon, fontSize: 10, fontFamily: 'monospace', fontWeight: '700' },
  fieldDesc: { color: COLORS.textSoft, fontSize: 10, fontWeight: '600' },
  exampleBox: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  exampleLabel: {
    backgroundColor: COLORS.yellow + '22', color: COLORS.yellow,
    paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3,
    fontSize: 8, fontWeight: '900',
  },
  exampleText: { color: COLORS.textSoft, fontSize: 10, fontFamily: 'monospace' },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginTop: 3 },
  optionPill: {
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3,
    borderWidth: 1, borderColor: COLORS.border,
  },
  optionText: { color: COLORS.textSoft, fontSize: 9, fontWeight: '700' },
  moreText: { color: COLORS.muted, fontSize: 9, fontWeight: '700', alignSelf: 'center' },

  typeTag: {
    paddingHorizontal: 5, paddingVertical: 3,
    borderRadius: 4, borderWidth: 1,
    alignItems: 'center',
  },
  typeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  dbActions: {
    flexDirection: 'row', gap: 6, marginTop: 10,
  },
  dbActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 8, borderRadius: 8,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1, borderColor: COLORS.border,
  },
  dbActionText: { color: COLORS.neon, fontSize: 11, fontWeight: '900' },

  nextSteps: {
    backgroundColor: COLORS.surface,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.neon + '55',
    marginTop: 14,
  },
  nextTitle: { color: COLORS.text, fontSize: 14, fontWeight: '900', marginBottom: 6 },

  apiCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: COLORS.border,
    marginTop: 10,
  },
  apiHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  apiTitle: { color: COLORS.text, fontSize: 12, fontWeight: '900' },
});
