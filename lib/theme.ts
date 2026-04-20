// 深色科技風 Pokémon 捕捉器主題 - 霓虹藍紫 + 電子黑
export const COLORS = {
  bg: '#05070F',           // 深太空黑
  bgGrad1: '#0A0E1F',
  bgGrad2: '#12152E',
  surface: '#0F1324',
  surfaceAlt: '#161B33',
  surface2: '#1C2242',
  border: '#242C4D',
  borderBright: '#3A4470',
  text: '#E6EAFF',
  textSoft: '#AFB7DD',
  muted: '#6A72A0',

  // 霓虹主色
  neon: '#00E5FF',          // 青藍霓虹
  neonDark: '#0099BB',
  purple: '#B388FF',        // 紫色霓虹
  purpleDark: '#7C4DFF',
  pink: '#FF4DA6',          // 桃粉
  green: '#00FF94',         // 螢光綠
  yellow: '#FFD740',
  orange: '#FF8A4C',

  // Pokéball 紅
  pokeRed: '#FF3B47',
  pokeRedDark: '#C9212B',

  success: '#00FF94',
  warning: '#FFD740',
  danger: '#FF4D6D',
};

// === 卡片稀有度分級 ===
// 共 7 級：UC < C < R < SR < SSR < UR < LR
export type Rarity = 'UC' | 'C' | 'R' | 'SR' | 'SSR' | 'UR' | 'LR';

export const RARITY_ORDER: Rarity[] = ['UC', 'C', 'R', 'SR', 'SSR', 'UR', 'LR'];

export interface RarityMeta {
  label: string;
  cn: string;
  color: string;
  glow: string;
  gradient: [string, string];
  stars: number;
  // 升級門檻：需要拍攝該鳥種 N 次才會升到此級
  threshold: number;
  // 抽卡機率（若辨識失敗採抽卡機制時使用）
  dropRate: number;
}

export const RARITY: Record<Rarity, RarityMeta> = {
  UC: {
    label: 'UC', cn: '一般',
    color: '#9AA4C8', glow: '#9AA4C8',
    gradient: ['#4A5578', '#2A334F'],
    stars: 1, threshold: 1, dropRate: 40,
  },
  C:  {
    label: 'C',  cn: '普通',
    color: '#5DE88A', glow: '#00FF94',
    gradient: ['#0D8A5F', '#064B33'],
    stars: 2, threshold: 3, dropRate: 28,
  },
  R:  {
    label: 'R',  cn: '稀有',
    color: '#5BB3FF', glow: '#00B4FF',
    gradient: ['#1E5FBB', '#0A2D6E'],
    stars: 3, threshold: 6, dropRate: 18,
  },
  SR: {
    label: 'SR', cn: '超稀有',
    color: '#C096FF', glow: '#B388FF',
    gradient: ['#6B3FC7', '#39196F'],
    stars: 4, threshold: 10, dropRate: 9,
  },
  SSR:{
    label: 'SSR', cn: '極稀有',
    color: '#FFAA4C', glow: '#FF8A4C',
    gradient: ['#D47A1F', '#7D3B00'],
    stars: 5, threshold: 15, dropRate: 3.5,
  },
  UR: {
    label: 'UR', cn: '超究極',
    color: '#FF5DAE', glow: '#FF4DA6',
    gradient: ['#D12979', '#5F0E3A'],
    stars: 6, threshold: 22, dropRate: 1.2,
  },
  LR: {
    label: 'LR', cn: '傳說',
    color: '#FFD740', glow: '#FFE86B',
    gradient: ['#D4A400', '#7D5F00'],
    stars: 7, threshold: 30, dropRate: 0.3,
  },
};

// 依同鳥種捕捉次數 決定當前稀有度
export function getRarityByCount(count: number): Rarity {
  if (count >= RARITY.LR.threshold) return 'LR';
  if (count >= RARITY.UR.threshold) return 'UR';
  if (count >= RARITY.SSR.threshold) return 'SSR';
  if (count >= RARITY.SR.threshold) return 'SR';
  if (count >= RARITY.R.threshold) return 'R';
  if (count >= RARITY.C.threshold) return 'C';
  return 'UC';
}

export function getNextRarityInfo(count: number): { next?: Rarity; needed: number; progress: number } {
  const current = getRarityByCount(count);
  const idx = RARITY_ORDER.indexOf(current);
  if (idx === RARITY_ORDER.length - 1) {
    return { needed: 0, progress: 1 };
  }
  const next = RARITY_ORDER[idx + 1];
  const currentT = RARITY[current].threshold;
  const nextT = RARITY[next].threshold;
  const progress = (count - currentT) / (nextT - currentT);
  return { next, needed: nextT - count, progress: Math.max(0, Math.min(1, progress)) };
}

// === XP / 等級系統 ===
// 每拍一張鳥 = +10 XP，新鳥種額外 +50
// LV 遞增：需要 (lv*lv*100) 累積 XP
export function getLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function getXpForLevel(lv: number): number {
  return (lv - 1) * (lv - 1) * 100;
}

export function getLevelProgress(xp: number): { lv: number; ratio: number; currentLvXp: number; nextLvXp: number; xpToNext: number } {
  const lv = getLevel(xp);
  const currentLvXp = getXpForLevel(lv);
  const nextLvXp = getXpForLevel(lv + 1);
  const ratio = (xp - currentLvXp) / (nextLvXp - currentLvXp);
  return { lv, ratio, currentLvXp, nextLvXp, xpToNext: nextLvXp - xp };
}

// === 職稱系統（依捕捉到的鳥種數） ===
export interface Title {
  threshold: number;  // 認識的鳥種數
  name: string;
  icon: string;
  color: string;
}

export const TITLES: Title[] = [
  { threshold: 0,  name: '初心訓練家',   icon: 'egg-outline',    color: '#9AA4C8' },
  { threshold: 1,  name: '見習觀鳥員',   icon: 'eye',            color: '#5DE88A' },
  { threshold: 3,  name: '新手鳥類學家', icon: 'leaf',           color: '#00E5FF' },
  { threshold: 6,  name: '森林探索者',   icon: 'compass',        color: '#5BB3FF' },
  { threshold: 10, name: '濕地守護者',   icon: 'water',          color: '#B388FF' },
  { threshold: 15, name: '藍羽使者',     icon: 'flash',          color: '#FF8A4C' },
  { threshold: 20, name: '圖鑑達人',     icon: 'trophy',         color: '#FF4DA6' },
  { threshold: 30, name: '鳥類大師',     icon: 'ribbon',         color: '#FFD740' },
];

export function getTitle(speciesCount: number): Title {
  let t = TITLES[0];
  for (const cur of TITLES) {
    if (speciesCount >= cur.threshold) t = cur;
  }
  return t;
}

export function getNextTitle(speciesCount: number): Title | null {
  for (const cur of TITLES) {
    if (speciesCount < cur.threshold) return cur;
  }
  return null;
}
