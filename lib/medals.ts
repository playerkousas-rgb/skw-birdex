// 成就紀念章系統（與職稱並存）
// 職稱 = 依捕捉鳥種數解鎖
// 紀念章 = 依特殊成就解鎖（如首次拍、特定稀有度、完成活動）

import { BirdSpecies } from './birdData';
import { Rarity, RARITY_ORDER } from './theme';

export interface Medal {
  id: string;
  name: string;
  nameEn: string;
  desc: string;
  icon: string;
  color: string;
  category: 'milestone' | 'rarity' | 'species' | 'explorer' | 'event';
  check: (ctx: MedalContext) => boolean;
}

export interface MedalContext {
  records: Record<number, { speciesId: number; count: number; firstCaughtAt: number; lastCaughtAt: number; photosCount: number }>;
  allSpecies: BirdSpecies[];
  xp: number;
  totalPhotos: number;
  totalRecognized: number;
  totalReviewed: number;
  getSpeciesRarity: (id: number) => Rarity | null;
}

export const MEDALS: Medal[] = [
  // === Milestone 里程碑 ===
  {
    id: 'first_capture', name: '初次見面', nameEn: 'First Encounter',
    desc: '首次捕捉成功', icon: 'egg', color: '#5DE88A', category: 'milestone',
    check: (c) => Object.keys(c.records).length >= 1,
  },
  {
    id: 'ten_species', name: '十種朋友', nameEn: 'Ten Friends',
    desc: '認識 10 種鳥', icon: 'people', color: '#00E5FF', category: 'milestone',
    check: (c) => Object.keys(c.records).length >= 10,
  },
  {
    id: 'thirty_species', name: '三十探索', nameEn: 'Thirty Discoveries',
    desc: '認識 30 種鳥', icon: 'search', color: '#B388FF', category: 'milestone',
    check: (c) => Object.keys(c.records).length >= 30,
  },
  {
    id: 'fifty_species', name: '圖鑑大師', nameEn: 'Dex Master',
    desc: '認識全部 50 種鳥', icon: 'trophy', color: '#FFD740', category: 'milestone',
    check: (c) => Object.keys(c.records).length >= 50,
  },
  {
    id: 'hundred_photos', name: '百張快門', nameEn: '100 Shutters',
    desc: '累積拍攝 100 張照片', icon: 'camera', color: '#FF8A4C', category: 'milestone',
    check: (c) => c.totalPhotos >= 100,
  },

  // === Rarity 稀有度 ===
  {
    id: 'first_r', name: '稀有獵人', nameEn: 'Rare Hunter',
    desc: '擁有第一張 R 卡', icon: 'sparkles', color: '#5BB3FF', category: 'rarity',
    check: (c) => Object.keys(c.records).some((id) => {
      const r = c.getSpeciesRarity(Number(id));
      return r && RARITY_ORDER.indexOf(r) >= RARITY_ORDER.indexOf('R');
    }),
  },
  {
    id: 'first_sr', name: '超稀有戰士', nameEn: 'SR Warrior',
    desc: '擁有第一張 SR 卡', icon: 'star', color: '#C096FF', category: 'rarity',
    check: (c) => Object.keys(c.records).some((id) => {
      const r = c.getSpeciesRarity(Number(id));
      return r && RARITY_ORDER.indexOf(r) >= RARITY_ORDER.indexOf('SR');
    }),
  },
  {
    id: 'first_ssr', name: '極稀有王者', nameEn: 'SSR King',
    desc: '擁有第一張 SSR 卡', icon: 'flame', color: '#FFAA4C', category: 'rarity',
    check: (c) => Object.keys(c.records).some((id) => {
      const r = c.getSpeciesRarity(Number(id));
      return r && RARITY_ORDER.indexOf(r) >= RARITY_ORDER.indexOf('SSR');
    }),
  },
  {
    id: 'first_lr', name: '傳說捕手', nameEn: 'Legend Catcher',
    desc: '擁有第一張 LR 卡', icon: 'ribbon', color: '#FFD740', category: 'rarity',
    check: (c) => Object.keys(c.records).some((id) => {
      const r = c.getSpeciesRarity(Number(id));
      return r === 'LR';
    }),
  },

  // === Species 特定鳥種 ===
  {
    id: 'city_master', name: '都市鳥友', nameEn: 'Urban Friend',
    desc: '捕捉 5 種都市鳥', icon: 'business', color: '#00E5FF', category: 'species',
    check: (c) => c.allSpecies.filter((s) =>
      c.records[s.id] && s.habitat.includes('都市')
    ).length >= 5,
  },
  {
    id: 'wetland_guardian', name: '濕地守護者', nameEn: 'Wetland Guardian',
    desc: '捕捉 5 種濕地鳥', icon: 'water', color: '#5BB3FF', category: 'species',
    check: (c) => c.allSpecies.filter((s) =>
      c.records[s.id] && s.habitat.includes('濕地')
    ).length >= 5,
  },
  {
    id: 'forest_explorer', name: '森林探索家', nameEn: 'Forest Explorer',
    desc: '捕捉 5 種森林鳥', icon: 'leaf', color: '#00FF94', category: 'species',
    check: (c) => c.allSpecies.filter((s) =>
      c.records[s.id] && s.habitat.includes('森林')
    ).length >= 5,
  },
  {
    id: 'raptor_master', name: '猛禽大師', nameEn: 'Raptor Master',
    desc: '捕捉任一猛禽', icon: 'airplane', color: '#FF8A4C', category: 'species',
    check: (c) => c.allSpecies.some((s) =>
      c.records[s.id] && s.tags.includes('猛禽')
    ),
  },
  {
    id: 'night_watcher', name: '夜行觀察員', nameEn: 'Night Watcher',
    desc: '捕捉任一夜行鳥', icon: 'moon', color: '#B388FF', category: 'species',
    check: (c) => c.allSpecies.some((s) =>
      c.records[s.id] && s.tags.includes('夜行')
    ),
  },

  // === Explorer 探索 ===
  {
    id: 'seasons', name: '四季觀察者', nameEn: 'Four Seasons',
    desc: '捕捉包含四季與冬候的鳥', icon: 'calendar', color: '#FFD740', category: 'explorer',
    check: (c) => {
      const seasons = new Set<string>();
      c.allSpecies.forEach((s) => {
        if (c.records[s.id]) {
          if (s.season.includes('四季')) seasons.add('all');
          if (s.season.includes('春') || s.season.includes('夏')) seasons.add('summer');
          if (s.season.includes('冬')) seasons.add('winter');
        }
      });
      return seasons.size >= 3;
    },
  },
  {
    id: 'endangered_hero', name: '保育英雄', nameEn: 'Conservation Hero',
    desc: '捕捉任一瀕危鳥類', icon: 'heart', color: '#FF4DA6', category: 'explorer',
    check: (c) => c.allSpecies.some((s) =>
      c.records[s.id] && (s.tags.includes('瀕危') || s.tags.includes('保育類'))
    ),
  },
  {
    id: 'reviewer_helped', name: '審核合作', nameEn: 'Review Helper',
    desc: '首次通過家長審核', icon: 'checkmark-done', color: '#00E5FF', category: 'explorer',
    check: (c) => c.totalReviewed >= 1,
  },

  // === Event 活動紀念章（保留給後台設定）===
  {
    id: 'migratory_season', name: '候鳥季', nameEn: 'Migration Season',
    desc: '參加冬季候鳥觀察活動', icon: 'flag', color: '#B388FF', category: 'event',
    check: () => false,  // 由後台設定觸發
  },
];

export function getEarnedMedals(ctx: MedalContext): Medal[] {
  return MEDALS.filter((m) => m.check(ctx));
}

export function getMedalProgress(ctx: MedalContext): { earned: Medal[]; locked: Medal[]; byCategory: Record<string, Medal[]> } {
  const earned = MEDALS.filter((m) => m.check(ctx));
  const locked = MEDALS.filter((m) => !m.check(ctx));
  const byCategory: Record<string, Medal[]> = {
    milestone: [], rarity: [], species: [], explorer: [], event: [],
  };
  MEDALS.forEach((m) => byCategory[m.category].push(m));
  return { earned, locked, byCategory };
}

export const CATEGORY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  milestone: { label: '里程碑', icon: 'flag', color: '#00E5FF' },
  rarity: { label: '稀有度', icon: 'diamond', color: '#B388FF' },
  species: { label: '鳥類專家', icon: 'leaf', color: '#00FF94' },
  explorer: { label: '探索者', icon: 'compass', color: '#FFD740' },
  event: { label: '特殊活動', icon: 'star', color: '#FF4DA6' },
};
