// Fakemon 卡片儲存 - 獨立 AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FakemonCard } from './fakemonEngine';

const KEY = 'birddex.fakemon.cards.v1';

export async function loadFakemonCards(): Promise<FakemonCard[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FakemonCard[];
  } catch {
    return [];
  }
}

export async function saveFakemonCards(cards: FakemonCard[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(cards));
  } catch {}
}

export async function addFakemonCard(card: FakemonCard): Promise<FakemonCard[]> {
  const cards = await loadFakemonCards();
  const updated = [card, ...cards].slice(0, 200);
  await saveFakemonCards(updated);
  return updated;
}

export async function clearFakemonCards(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
