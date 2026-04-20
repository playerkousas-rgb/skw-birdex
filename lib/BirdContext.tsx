import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BirdSpecies, INTERNAL_SPECIES, mergeSpecies, simulateRecognize, RecognizeResult,
} from './birdData';
import { getLevel, getLevelProgress, getRarityByCount, Rarity, getTitle } from './theme';

// === 個人相冊照片（只存本地手機，不上傳）===
export interface PersonalPhoto {
  id: string;
  speciesId: number;
  takenAt: number;
  aiConfidence: number;
  aiSuccess: boolean;
  hotspotName?: string;
  // 照片用 emoji + 顏色表示（真實版會是 base64 或本地路徑）
  displayEmoji: string;
  displayColor: string;
  note?: string;
}

export interface CaptureRecord {
  speciesId: number;
  count: number;
  firstCaughtAt: number;
  lastCaughtAt: number;
  photoIds: string[];         // 對應 personalPhotos 的 id 列表
}

export interface PendingReview {
  id: string;
  submittedAt: number;
  aiResult: RecognizeResult;
  photoId?: string;           // 關聯到 PersonalPhoto
}

export interface SyncEvent {
  ts: number;
  type: 'species' | 'cards' | 'module' | 'password';
  changes: number;
  status: 'success' | 'pending' | 'failed';
  source: string;
}

interface BirdState {
  records: Record<number, CaptureRecord>;
  personalPhotos: PersonalPhoto[];    // ⭐ 本地相冊

  xp: number;
  totalPhotos: number;
  totalRecognized: number;
  totalReviewed: number;

  remoteOverrides: Record<number, Partial<BirdSpecies>>;
  pendingReviews: PendingReview[];

  syncHistory: SyncEvent[];
  trainerName: string;
  hasSeenWelcome: boolean;
  lastSyncAt: number | null;

  parentPassword: string;
  superPassword: string;
  currentEvent: string | null;
}

interface BirdContextValue extends BirdState {
  allSpecies: BirdSpecies[];
  internalCount: number;
  remoteCount: number;

  takePhoto: (gpsLocation?: { lat: number; lng: number }) => {
    result: RecognizeResult;
    isNew: boolean;
    newCount: number;
    oldRarity: Rarity;
    newRarity: Rarity;
    xpGained: number;
    pendingReviewId?: string;
    photoId?: string;
  };

  isCaught: (id: number) => boolean;
  getRecord: (id: number) => CaptureRecord | undefined;
  getSpeciesRarity: (id: number) => Rarity | null;
  getPhotosForSpecies: (speciesId: number) => PersonalPhoto[];
  getRecentPhotos: (limit?: number) => PersonalPhoto[];
  deletePhoto: (photoId: string) => void;

  approveReview: (reviewId: string, speciesId: number) => void;
  rejectReview: (reviewId: string) => void;

  updateSpeciesOverride: (id: number, patch: Partial<BirdSpecies>) => void;
  removeSpeciesOverride: (id: number) => void;
  syncFromNotion: () => Promise<{ updated: number; added: number }>;
  setParentPassword: (pwd: string) => void;

  resetData: () => void;
  setTrainerName: (n: string) => void;
  markWelcomeSeen: () => void;

  caughtSpeciesCount: number;
  totalSpeciesCount: number;
  totalPhotosInAlbum: number;    // ⭐ 總照片數
  level: number;
  levelProgress: ReturnType<typeof getLevelProgress>;
  currentTitle: ReturnType<typeof getTitle>;
}

const STORAGE_KEY = 'birddex.state.v6';
const MAX_PHOTOS_PER_SPECIES = 300;  // 防止無限制儲存

const BirdContext = createContext<BirdContextValue | null>(null);

function uid() {
  return `p-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function BirdProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BirdState>({
    records: {},
    personalPhotos: [],
    xp: 0,
    totalPhotos: 0,
    totalRecognized: 0,
    totalReviewed: 0,
    remoteOverrides: {},
    pendingReviews: [],
    syncHistory: [
      { ts: Date.now() - 86400000, type: 'species', changes: 30, status: 'success', source: '內建資料 · 30 種鳥' },
    ],
    trainerName: '見習訓練家',
    hasSeenWelcome: false,
    lastSyncAt: null,
    parentPassword: '0728',
    superPassword: '1201',
    currentEvent: null,
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setState((s) => ({ ...s, ...JSON.parse(raw) }));
      } catch {}
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, hydrated]);

  const allSpecies = useMemo(
    () => mergeSpecies(INTERNAL_SPECIES, state.remoteOverrides),
    [state.remoteOverrides]
  );

  const internalCount = INTERNAL_SPECIES.length;
  const remoteCount = Object.keys(state.remoteOverrides).length;

  const isCaught = useCallback((id: number) => !!state.records[id], [state.records]);
  const getRecord = useCallback((id: number) => state.records[id], [state.records]);
  const getSpeciesRarity = useCallback(
    (id: number): Rarity | null => {
      const rec = state.records[id];
      if (!rec) return null;
      return getRarityByCount(rec.count);
    },
    [state.records]
  );

  const getPhotosForSpecies = useCallback(
    (speciesId: number) => state.personalPhotos.filter((p) => p.speciesId === speciesId).sort((a, b) => b.takenAt - a.takenAt),
    [state.personalPhotos]
  );

  const getRecentPhotos = useCallback(
    (limit = 20) => [...state.personalPhotos].sort((a, b) => b.takenAt - a.takenAt).slice(0, limit),
    [state.personalPhotos]
  );

  const deletePhoto = useCallback((photoId: string) => {
    setState((s) => {
      const photo = s.personalPhotos.find((p) => p.id === photoId);
      if (!photo) return s;
      const rec = s.records[photo.speciesId];
      return {
        ...s,
        personalPhotos: s.personalPhotos.filter((p) => p.id !== photoId),
        records: rec ? {
          ...s.records,
          [photo.speciesId]: {
            ...rec,
            photoIds: rec.photoIds.filter((id) => id !== photoId),
          },
        } : s.records,
      };
    });
  }, []);

  const takePhoto = useCallback((gpsLocation?: { lat: number; lng: number }) => {
    const result = simulateRecognize(allSpecies);
    const photoId = uid();

    // 辨識失敗 → 送審核 + 仍存進本地相冊（但未歸類）
    if (!result.success) {
      const reviewId = `r-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const pendingPhoto: PersonalPhoto = {
        id: photoId,
        speciesId: 0,  // 0 = 待審核
        takenAt: Date.now(),
        aiConfidence: 0,
        aiSuccess: false,
        displayEmoji: '❓',
        displayColor: '#6A72A0',
      };
      setState((s) => ({
        ...s,
        totalPhotos: s.totalPhotos + 1,
        xp: s.xp + 5,
        personalPhotos: [pendingPhoto, ...s.personalPhotos].slice(0, 2000),  // 最多保留 2000 張
        pendingReviews: [
          { id: reviewId, submittedAt: Date.now(), aiResult: result, photoId },
          ...s.pendingReviews,
        ].slice(0, 20),
      }));
      return {
        result,
        isNew: false,
        newCount: 0,
        oldRarity: 'UC' as Rarity,
        newRarity: 'UC' as Rarity,
        xpGained: 5,
        pendingReviewId: reviewId,
        photoId,
      };
    }

    // 辨識成功 → 直接存相冊 + 加入計數
    const species = result.species!;
    const newPhoto: PersonalPhoto = {
      id: photoId,
      speciesId: species.id,
      takenAt: Date.now(),
      aiConfidence: result.confidence || 0.8,
      aiSuccess: true,
      displayEmoji: species.emoji,
      displayColor: species.baseColor,
      hotspotName: gpsLocation ? findNearestHotspot(species, gpsLocation) : undefined,
    };

    const oldRecord = state.records[species.id];
    const isNew = !oldRecord;
    const oldCount = oldRecord?.count || 0;
    const newCount = oldCount + 1;
    const oldRarity: Rarity = oldRecord ? getRarityByCount(oldCount) : 'UC';
    const newRarity = getRarityByCount(newCount);

    let xpGained = 10;
    if (isNew) xpGained += 50;
    if (newRarity !== oldRarity) xpGained += 30;

    setState((s) => ({
      ...s,
      xp: s.xp + xpGained,
      totalPhotos: s.totalPhotos + 1,
      totalRecognized: s.totalRecognized + 1,
      personalPhotos: [newPhoto, ...s.personalPhotos].slice(0, 2000),
      records: {
        ...s.records,
        [species.id]: {
          speciesId: species.id,
          count: newCount,
          firstCaughtAt: oldRecord?.firstCaughtAt || Date.now(),
          lastCaughtAt: Date.now(),
          photoIds: [photoId, ...(oldRecord?.photoIds || [])].slice(0, MAX_PHOTOS_PER_SPECIES),
        },
      },
    }));

    return { result, isNew, newCount, oldRarity, newRarity, xpGained, photoId };
  }, [allSpecies, state.records]);

  const approveReview = useCallback((reviewId: string, speciesId: number) => {
    const species = allSpecies.find((s) => s.id === speciesId);
    if (!species) return;
    setState((s) => {
      const review = s.pendingReviews.find((r) => r.id === reviewId);
      const oldRecord = s.records[species.id];
      const newCount = (oldRecord?.count || 0) + 1;

      // 更新關聯的相片 speciesId
      const updatedPhotos = s.personalPhotos.map((p) =>
        p.id === review?.photoId
          ? { ...p, speciesId: species.id, displayEmoji: species.emoji, displayColor: species.baseColor, aiSuccess: true }
          : p
      );

      return {
        ...s,
        xp: s.xp + 60,
        totalReviewed: s.totalReviewed + 1,
        personalPhotos: updatedPhotos,
        records: {
          ...s.records,
          [species.id]: {
            speciesId: species.id,
            count: newCount,
            firstCaughtAt: oldRecord?.firstCaughtAt || Date.now(),
            lastCaughtAt: Date.now(),
            photoIds: review?.photoId
              ? [review.photoId, ...(oldRecord?.photoIds || [])].slice(0, MAX_PHOTOS_PER_SPECIES)
              : oldRecord?.photoIds || [],
          },
        },
        pendingReviews: s.pendingReviews.filter((r) => r.id !== reviewId),
      };
    });
  }, [allSpecies]);

  const rejectReview = useCallback((reviewId: string) => {
    setState((s) => {
      const review = s.pendingReviews.find((r) => r.id === reviewId);
      return {
        ...s,
        // 刪除關聯照片
        personalPhotos: review?.photoId
          ? s.personalPhotos.filter((p) => p.id !== review.photoId)
          : s.personalPhotos,
        pendingReviews: s.pendingReviews.filter((r) => r.id !== reviewId),
      };
    });
  }, []);

  const updateSpeciesOverride = useCallback((id: number, patch: Partial<BirdSpecies>) => {
    setState((s) => ({
      ...s,
      remoteOverrides: {
        ...s.remoteOverrides,
        [id]: { ...(s.remoteOverrides[id] || {}), ...patch, lastUpdated: Date.now() },
      },
      syncHistory: [
        { ts: Date.now(), type: 'cards', changes: 1, status: 'success', source: '超級管理員' },
        ...s.syncHistory,
      ].slice(0, 30),
    }));
  }, []);

  const removeSpeciesOverride = useCallback((id: number) => {
    setState((s) => {
      const next = { ...s.remoteOverrides };
      delete next[id];
      return { ...s, remoteOverrides: next };
    });
  }, []);

  const syncFromNotion = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 1400));
    const mockUpdates: Record<number, Partial<BirdSpecies>> = {
      1: { funFact: '【後台最新】麻雀會用小石頭幫助消化食物！' },
      7: { funFact: '【後台最新】紅嘴藍鵲是團隊合作高手！' },
      10: { aiConfidence: 0.95, funFact: '【後台最新】黑臉琵鷺全球只剩約 6000 隻！' },
    };
    const newOverrides = { ...state.remoteOverrides };
    let updated = 0;
    Object.entries(mockUpdates).forEach(([id, patch]) => {
      const sid = Number(id);
      newOverrides[sid] = { ...(newOverrides[sid] || {}), ...patch, lastUpdated: Date.now() };
      updated++;
    });
    setState((s) => ({
      ...s,
      remoteOverrides: newOverrides,
      lastSyncAt: Date.now(),
      syncHistory: [
        { ts: Date.now(), type: 'species', changes: updated, status: 'success', source: 'Notion API' },
        ...s.syncHistory,
      ].slice(0, 30),
    }));
    return { updated, added: 0 };
  }, [state.remoteOverrides]);

  const setParentPassword = useCallback((pwd: string) => {
    if (pwd.length !== 4 || !/^\d+$/.test(pwd)) return;
    setState((s) => ({
      ...s,
      parentPassword: pwd,
      syncHistory: [
        { ts: Date.now(), type: 'password', changes: 1, status: 'success', source: '超級管理員更新' },
        ...s.syncHistory,
      ].slice(0, 30),
    }));
  }, []);

  const resetData = useCallback(() => {
    setState((s) => ({
      records: {},
      personalPhotos: [],
      xp: 0,
      totalPhotos: 0,
      totalRecognized: 0,
      totalReviewed: 0,
      remoteOverrides: {},
      pendingReviews: [],
      syncHistory: [{ ts: Date.now(), type: 'species', changes: 30, status: 'success', source: '內建資料 · 30 種鳥' }],
      trainerName: s.trainerName,
      hasSeenWelcome: true,
      lastSyncAt: null,
      parentPassword: s.parentPassword,
      superPassword: s.superPassword,
      currentEvent: null,
    }));
  }, []);

  const setTrainerName = useCallback((n: string) => {
    setState((s) => ({ ...s, trainerName: n }));
  }, []);

  const markWelcomeSeen = useCallback(() => {
    setState((s) => ({ ...s, hasSeenWelcome: true }));
  }, []);

  const caughtSpeciesCount = Object.keys(state.records).length;
  const totalSpeciesCount = allSpecies.length;
  const totalPhotosInAlbum = state.personalPhotos.length;
  const level = getLevel(state.xp);
  const levelProgress = getLevelProgress(state.xp);
  const currentTitle = getTitle(caughtSpeciesCount);

  return (
    <BirdContext.Provider
      value={{
        ...state,
        allSpecies,
        internalCount,
        remoteCount,
        takePhoto,
        isCaught,
        getRecord,
        getSpeciesRarity,
        getPhotosForSpecies,
        getRecentPhotos,
        deletePhoto,
        approveReview,
        rejectReview,
        updateSpeciesOverride,
        removeSpeciesOverride,
        syncFromNotion,
        setParentPassword,
        resetData,
        setTrainerName,
        markWelcomeSeen,
        caughtSpeciesCount,
        totalSpeciesCount,
        totalPhotosInAlbum,
        level,
        levelProgress,
        currentTitle,
      }}
    >
      {children}
    </BirdContext.Provider>
  );
}

function findNearestHotspot(species: BirdSpecies, loc: { lat: number; lng: number }): string | undefined {
  if (!species.hotspots || species.hotspots.length === 0) return undefined;
  let nearest = species.hotspots[0];
  let minDist = Infinity;
  species.hotspots.forEach((h) => {
    const d = Math.hypot(h.lat - loc.lat, h.lng - loc.lng);
    if (d < minDist) {
      minDist = d;
      nearest = h;
    }
  });
  return nearest.name;
}

export function useBirds() {
  const ctx = useContext(BirdContext);
  if (!ctx) throw new Error('useBirds must be used within BirdProvider');
  return ctx;
}
