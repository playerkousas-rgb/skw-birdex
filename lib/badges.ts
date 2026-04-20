// 🏅 紀念章系統（與職稱分開）
// 職稱 = 依捕捉鳥種數（線性升級）
// 紀念章 = 特殊成就（非線性，可一次解鎖多個）

import { BirdSpecies } from './birdData';
import { CaptureRecord } from './BirdContext';
import { Rarity, getRarityByCount } from './theme';

export interface Badge {
  id: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
  category: 'milestone' | 'rarity' | 'family' | 'habitat' | 'seasonal' | 'special';
  check: (ctx: BadgeContext) => boolean;
}

interface BadgeContext {
  allSpecies: BirdSpecies[];
  records: Record<number, CaptureRecord>;
  xp: number;
  totalPhotos: number;
  caughtSpeciesCount: number;
}

export const BADGES: Badge[] = [
  // 里程碑類
  {
    id: 'first-catch', name: '初次捕捉', desc: '拍到第一隻鳥！',
    icon: '🎯', color: '#00E5FF', category: 'milestone',
    check: (c) => c.caughtSpeciesCount >= 1,
  },
  {
    id: 'ten-species', name: '十種達成', desc: '認識 10 種不同的鳥',
    icon: '🌟', color: '#00E5FF', category: 'milestone',
    check: (c) => c.caughtSpeciesCount >= 10,
  },
  {
    id: 'twenty-species', name: '觀鳥高手', desc: '認識 20 種不同的鳥',
    icon: '🏆', color: '#FFD740', category: 'milestone',
    check: (c) => c.caughtSpeciesCount >= 20,
  },
  {
    id: 'dedication', name: '勤奮研究員', desc: '累積 100 張照片',
    icon: '📸', color: '#B388FF', category: 'milestone',
    check: (c) => c.totalPhotos >= 100,
  },

  // 稀有度類
  {
    id: 'first-rare', name: '稀有獵人', desc: '獲得第一張 R 級卡片',
    icon: '💎', color: '#5BB3FF', category: 'rarity',
    check: (c) => Object.values(c.records).some((r) => getRarityByCount(r.count) === 'R'
      || getRarityByCount(r.count) === 'SR' || getRarityByCount(r.count) === 'SSR'
      || getRarityByCount(r.count) === 'UR' || getRarityByCount(r.count) === 'LR'),
  },
  {
    id: 'sr-hunter', name: '超稀有收藏家', desc: '獲得 SR 級卡片',
    icon: '⭐', color: '#C096FF', category: 'rarity',
    check: (c) => Object.values(c.records).some((r) => {
      const rar = getRarityByCount(r.count);
      return rar === 'SR' || rar === 'SSR' || rar === 'UR' || rar === 'LR';
    }),
  },
  {
    id: 'legendary', name: '傳說級訓練家', desc: '獲得第一張 LR 卡片',
    icon: '👑', color: '#FFD740', category: 'rarity',
    check: (c) => Object.values(c.records).some((r) => getRarityByCount(r.count) === 'LR'),
  },

  // 科別類
  {
    id: 'heron-family', name: '鷺科大師', desc: '收集 3 種鷺科鳥類',
    icon: '🦩', color: '#F5F5F5', category: 'family',
    check: (c) => {
      const caught = c.allSpecies.filter((s) => c.records[s.id]);
      return caught.filter((s) => s.family === '鷺科').length >= 3;
    },
  },
  {
    id: 'raptor', name: '猛禽專家', desc: '拍到任何一種猛禽',
    icon: '🦅', color: '#FF4DA6', category: 'family',
    check: (c) => {
      const caught = c.allSpecies.filter((s) => c.records[s.id]);
      return caught.some((s) => s.tags.includes('猛禽'));
    },
  },

  // 棲地類
  {
    id: 'wetland-explorer', name: '濕地探險家', desc: '拍到 3 種濕地鳥',
    icon: '🌊', color: '#00FF94', category: 'habitat',
    check: (c) => {
      const caught = c.allSpecies.filter((s) => c.records[s.id]);
      return caught.filter((s) => s.habitat.includes('濕地')).length >= 3;
    },
  },
  {
    id: 'urban-explorer', name: '都市觀察家', desc: '拍到 5 種都市鳥',
    icon: '🏙️', color: '#B388FF', category: 'habitat',
    check: (c) => {
      const caught = c.allSpecies.filter((s) => c.records[s.id]);
      return caught.filter((s) => s.habitat.includes('都市')).length >= 5;
    },
  },
  {
    id: 'forest-walker', name: '森林漫遊者', desc: '拍到 3 種森林鳥',
    icon: '🌳', color: '#00FF94', category: 'habitat',
    check: (c) => {
      const caught = c.allSpecies.filter((s) => c.records[s.id]);
      return caught.filter((s) => s.habitat.includes('森林')).length >= 3;
    },
  },

  // 季節類
  {
    id: 'winter-visitor', name: '冬候鳥迷', desc: '拍到 2 種冬候鳥',
    icon: '❄️', color: '#5BB3FF', category: 'seasonal',
    check: (c) => {
      const caught = c.allSpecies.filter((s) => c.records[s.id]);
      return caught.filter((s) => s.tags.includes('冬候鳥')).length >= 2;
    },
  },

  // 特別類
  {
    id: 'endangered-guardian', name: '瀕危守護者', desc: '拍到瀕危鳥類（如黑臉琵鷺）',
    icon: '💚', color: '#00FF94', category: 'special',
    check: (c) => {
      const caught = c.allSpecies.filter((s) => c.records[s.id]);
      return caught.some((s) => s.tags.includes('瀕危'));
    },
  },
  {
    id: 'hk-native', name: '香港土著', desc: '拍到黑鳶（香港之鷹）',
    icon: '🏴', color: '#FF4DA6', category: 'special',
    check: (c) => !!c.records[9],
  },
  {
    id: 'star-bird', name: '明星鳥合照', desc: '拍到紅嘴藍鵲',
    icon: '✨', color: '#4A7BC8', category: 'special',
    check: (c) => !!c.records[7],
  },
];

export function getUnlockedBadges(ctx: BadgeContext): Badge[] {
  return BADGES.filter((b) => b.check(ctx));
}

export function getBadgesByCategory() {
  const map: Record<string, Badge[]> = {};
  BADGES.forEach((b) => {
    if (!map[b.category]) map[b.category] = [];
    map[b.category].push(b);
  });
  return map;
}

export const CATEGORY_LABELS: Record<string, { name: string; icon: string; color: string }> = {
  milestone: { name: '里程碑', icon: 'flag', color: '#00E5FF' },
  rarity: { name: '稀有收集', icon: 'diamond', color: '#B388FF' },
  family: { name: '科別大師', icon: 'library', color: '#FF8A4C' },
  habitat: { name: '棲地探險', icon: 'leaf', color: '#00FF94' },
  seasonal: { name: '季節觀察', icon: 'snow', color: '#5BB3FF' },
  special: { name: '特殊成就', icon: 'star', color: '#FF4DA6' },
};
