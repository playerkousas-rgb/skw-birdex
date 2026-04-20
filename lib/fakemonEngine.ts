// ===================================================================
// Fakemon 生成引擎 - Image-to-Image Pipeline
// ===================================================================
// 整個流程：
// 1. 拍照 → 姿態偵測（Pose Detection）
// 2. 照片 → image-to-image AI（保留姿態、光線、角度）
// 3. 加上 Pokédex 卡框
// 4. 寫入 Notion
// ===================================================================

import { BirdSpecies } from './birdData';
import { Rarity } from './theme';

// ===== 姿態類型（從拍攝的鳥識別）=====
export type BirdPose = 
  | 'flying'      // 飛行中（翅膀展開）
  | 'perched'     // 站立/棲息
  | 'walking'     // 地面行走
  | 'swimming'    // 水中
  | 'diving'      // 俯衝
  | 'hovering'    // 懸停
  | 'singing'     // 鳴叫（嘴張開）
  | 'feeding'     // 進食
  | 'preening';   // 整理羽毛

export const POSE_META: Record<BirdPose, {
  name: string;
  icon: string;
  promptHint: string;     // 給 AI 的姿態提示
  rarityBonus: number;    // 稀有姿態加成
  color: string;
}> = {
  flying:    { name: '飛行中', icon: 'airplane', promptHint: 'wings fully spread mid-flight, dynamic aerial pose', rarityBonus: 2, color: '#00E5FF' },
  perched:   { name: '棲息', icon: 'ellipse', promptHint: 'standing on branch, side profile', rarityBonus: 0, color: '#9AA4C8' },
  walking:   { name: '行走', icon: 'walk', promptHint: 'walking on ground, legs visible', rarityBonus: 0, color: '#5DE88A' },
  swimming:  { name: '游泳', icon: 'water', promptHint: 'floating on water surface', rarityBonus: 1, color: '#5BB3FF' },
  diving:    { name: '俯衝', icon: 'arrow-down', promptHint: 'diving pose, wings folded, speed lines', rarityBonus: 3, color: '#FF8A4C' },
  hovering:  { name: '懸停', icon: 'contract', promptHint: 'hovering in place, wings flapping rapidly', rarityBonus: 2, color: '#B388FF' },
  singing:   { name: '鳴唱', icon: 'musical-notes', promptHint: 'beak open, singing pose with sound waves', rarityBonus: 1, color: '#FFD740' },
  feeding:   { name: '進食', icon: 'restaurant', promptHint: 'eating food, head down', rarityBonus: 1, color: '#FF4DA6' },
  preening:  { name: '梳理', icon: 'brush', promptHint: 'preening feathers, elegant pose', rarityBonus: 1, color: '#00FF94' },
};

// ===== Fakemon 屬性（參考寶可夢設計）=====
export type FakemonType = 'flying' | 'normal' | 'water' | 'psychic' | 'fairy' | 'ghost' | 'fire' | 'electric' | 'grass';

export const TYPE_META: Record<FakemonType, { name: string; icon: string; color: string; emoji: string }> = {
  flying:   { name: '飛行', icon: 'airplane', color: '#81B4FF', emoji: '🌪️' },
  normal:   { name: '一般', icon: 'ellipse', color: '#C5C5A7', emoji: '⭐' },
  water:    { name: '水', icon: 'water', color: '#6890F0', emoji: '💧' },
  psychic:  { name: '超能力', icon: 'eye', color: '#F85888', emoji: '🔮' },
  fairy:    { name: '妖精', icon: 'sparkles', color: '#EE99AC', emoji: '✨' },
  ghost:    { name: '幽靈', icon: 'moon', color: '#705898', emoji: '👻' },
  fire:     { name: '火', icon: 'flame', color: '#F08030', emoji: '🔥' },
  electric: { name: '電', icon: 'flash', color: '#F8D030', emoji: '⚡' },
  grass:    { name: '草', icon: 'leaf', color: '#78C850', emoji: '🌿' },
};

// ===== 技能/招式 =====
export interface FakemonMove {
  name: string;
  type: FakemonType;
  power: number;
  desc: string;
}

// 依鳥類特徵自動分配招式
export function generateMoves(species: BirdSpecies, pose: BirdPose): FakemonMove[] {
  const moves: FakemonMove[] = [];

  // 基礎招式（所有鳥都有）
  moves.push({ name: '啄擊', type: 'flying', power: 35, desc: '用尖銳的嘴攻擊對手' });

  // 依食性
  if (species.diet.includes('魚')) {
    moves.push({ name: '俯衝捕魚', type: 'water', power: 50, desc: '從空中快速俯衝抓捕' });
  }
  if (species.diet.includes('蟲')) {
    moves.push({ name: '蟲狩獵', type: 'flying', power: 40, desc: '精準捕食飛蟲' });
  }
  if (species.diet.includes('肉')) {
    moves.push({ name: '利爪撕裂', type: 'normal', power: 65, desc: '用鋒利的爪子攻擊' });
  }

  // 依姿態
  if (pose === 'flying') {
    moves.push({ name: '空中突襲', type: 'flying', power: 55, desc: '從高空快速衝下攻擊' });
  }
  if (pose === 'singing') {
    moves.push({ name: '迷惑之歌', type: 'psychic', power: 30, desc: '美妙歌聲使對手混亂' });
  }
  if (pose === 'diving') {
    moves.push({ name: '流星俯衝', type: 'flying', power: 75, desc: '以極快速度俯衝必殺' });
  }

  // 依標籤
  if (species.tags.includes('猛禽')) {
    moves.push({ name: '王者威壓', type: 'psychic', power: 0, desc: '降低對手攻擊力' });
  }
  if (species.tags.includes('瀕危')) {
    moves.push({ name: '稀有光輝', type: 'fairy', power: 80, desc: '發出傳說般的光芒' });
  }

  return moves.slice(0, 4);
}

// ===== HP 計算（依稀有度與特徵）=====
export function calculateHP(species: BirdSpecies, rarity: Rarity): number {
  const rarityBonus: Record<Rarity, number> = { UC: 60, C: 80, R: 100, SR: 130, SSR: 160, UR: 200, LR: 250 };
  const sizeNum = parseInt(species.size) || 20;
  const sizeBonus = Math.floor(sizeNum / 5);
  return (rarityBonus[rarity] || 60) + sizeBonus;
}

// ===== Fakemon 生成結果 =====
export interface FakemonCard {
  id: string;
  speciesId: number;
  pose: BirdPose;
  types: FakemonType[];
  hp: number;
  moves: FakemonMove[];

  // 圖像資料
  originalPhotoUri?: string;     // 原始拍攝照片
  fakemonImageUri?: string;       // AI 轉換後的 Fakemon
  framedCardUri?: string;         // 加上卡框後的完整卡片
  
  // AI 生成資料
  aiPrompt: string;
  styleModel: string;
  generationTime: number;        // 毫秒

  // Notion 同步
  notionPageId?: string;
  syncedAt?: number;
  
  createdAt: number;
}

// ===== Prompt 生成（image-to-image）=====
export function buildFakemonPrompt(species: BirdSpecies, pose: BirdPose): string {
  const poseHint = POSE_META[pose].promptHint;
  const colorHint = species.baseColor;
  
  return `Transform this real bird photo into official Pokémon-style anime Fakemon artwork. 
CRITICAL: preserve the original ${poseHint}, wing angle, body orientation, and lighting EXACTLY.
Bird species: ${species.name} (${species.scientificName}).
Main color: ${colorHint}.
Features: ${species.features}.
Style: Official Pokémon cel-shaded animation, large expressive eyes, cute/heroic character design, soft aura glow.
Add: Pokémon-style highlights, simplified geometric shapes, clean lineart.
DO NOT change pose or action from the input photo.`;
}

// ===== 模擬生成管線階段 =====
export type PipelineStage =
  | 'capture'       // 拍照
  | 'pose'          // 姿態偵測
  | 'i2i'           // image-to-image 轉換
  | 'frame'         // 加卡框
  | 'notion'        // 寫入 Notion
  | 'done';

export const PIPELINE_STAGES: { key: PipelineStage; label: string; icon: string; color: string; duration: number }[] = [
  { key: 'capture', label: '拍攝照片',     icon: 'camera',       color: '#00E5FF', duration: 400 },
  { key: 'pose',    label: '姿態偵測',     icon: 'body',         color: '#B388FF', duration: 700 },
  { key: 'i2i',     label: 'AI 轉換 Fakemon', icon: 'color-palette', color: '#FF4DA6', duration: 2200 },
  { key: 'frame',   label: '套用卡框',     icon: 'albums',       color: '#FFD740', duration: 900 },
  { key: 'notion',  label: '寫入 Notion',  icon: 'cloud-upload', color: '#00FF94', duration: 1100 },
];

// ===== 隨機姿態（示範用）=====
export function simulatePoseDetection(): BirdPose {
  const poses: BirdPose[] = ['flying', 'perched', 'walking', 'swimming', 'singing', 'hovering', 'feeding'];
  // 飛行姿態最常見
  const weights = [30, 25, 15, 8, 10, 6, 6];
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < poses.length; i++) {
    r -= weights[i];
    if (r <= 0) return poses[i];
  }
  return 'perched';
}

// ===== 依鳥種自動判斷主要屬性 =====
export function determineTypes(species: BirdSpecies, pose: BirdPose): FakemonType[] {
  const types: FakemonType[] = ['flying'];  // 所有鳥都有飛行屬性
  
  if (species.habitat.some((h) => h.includes('濕地') || h.includes('海岸'))) types.push('water');
  if (species.tags.includes('夜行')) types.push('ghost');
  if (species.tags.includes('猛禽')) types.push('normal');
  if (species.tags.includes('瀕危') || species.tags.includes('傳說')) types.push('fairy');
  if (pose === 'diving') types.push('fire');
  if (species.name.includes('翠') || species.name.includes('藍')) types.push('water');
  if (species.name.includes('黑') && !types.includes('ghost')) types.push('ghost');
  
  return types.slice(0, 2);
}

// ===== Notion API 預設結構（供後端使用）=====
export const NOTION_DB_SCHEMA = {
  databaseName: 'FakemonDex',
  properties: {
    Name: { type: 'title', desc: '鳥名/Fakemon 名稱' },
    SpeciesId: { type: 'number', desc: '對應鳥種編號' },
    ScientificName: { type: 'rich_text', desc: '學名' },
    Pose: { type: 'select', desc: '拍攝姿態' },
    Types: { type: 'multi_select', desc: '屬性' },
    HP: { type: 'number', desc: '生命值' },
    Rarity: { type: 'select', desc: '稀有度 UC-LR' },
    OriginalPhoto: { type: 'files', desc: '原始照片' },
    FakemonImage: { type: 'files', desc: 'AI 生成 Fakemon' },
    FramedCard: { type: 'files', desc: '完整卡片' },
    Moves: { type: 'rich_text', desc: '招式清單' },
    CapturedAt: { type: 'date', desc: '拍攝時間' },
    UserId: { type: 'rich_text', desc: '使用者 ID' },
    AIPrompt: { type: 'rich_text', desc: 'AI 生成提示詞' },
    StyleModel: { type: 'select', desc: '使用的 AI 模型' },
  },
};
