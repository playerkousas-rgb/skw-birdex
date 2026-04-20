// === Merlin Bird ID API 整合介面 ===
// 使用 Cornell Lab 提供的 AI 辨識服務
//
// 🔒 為何需要後端 Proxy？
//    API Key 不能放在前端 App，否則會被反編譯盜用。
//    Proxy = Vercel Serverless Function，負責轉發請求並保管 Key。
//
// 📝 部署流程：
//    1. 向 Cornell 申請 Merlin API Key (1-2 週審核)
//    2. 取得 Key 後 → 放在 Vercel Environment Variable (MERLIN_API_KEY)
//    3. 將下方 PROXY_URL 改成你的 Vercel 網址
//    4. App 會自動切換為「真實辨識」模式
//
// 🟢 Proxy 範例（部署於 Vercel /api/recognize.ts）：
// --------------------------------------------
// export default async function handler(req, res) {
//   const { image } = req.body;
//   const response = await fetch('https://merlin.allaboutbirds.org/api/v1/identify', {
//     method: 'POST',
//     headers: { 'Authorization': `Bearer ${process.env.MERLIN_API_KEY}` },
//     body: JSON.stringify({ image, location: 'HK' })
//   });
//   const data = await response.json();
//   return res.json(data);
// }
// --------------------------------------------

import { BirdSpecies } from './birdData';

// ⚠️ 部署後改成你的 Vercel URL
// 例：'https://birddex-api.vercel.app/api/recognize'
const PROXY_URL: string | null = null;

export interface MerlinResponse {
  success: boolean;
  matches: {
    commonName: string;       // 俗名
    scientificName: string;    // 學名
    merlinCode: string;
    confidence: number;        // 0-1
  }[];
  error?: string;
}

// 真實 API 呼叫（需設定 PROXY_URL）
export async function recognizeWithMerlin(
  imageBase64: string,
  location?: { lat: number; lng: number }
): Promise<MerlinResponse> {
  if (!PROXY_URL) {
    return {
      success: false,
      matches: [],
      error: 'Merlin API 未設定（需部署 Proxy 並提供 API Key）',
    };
  }
  try {
    const resp = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64, location }),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  } catch (e: any) {
    return {
      success: false,
      matches: [],
      error: e.message || '網路錯誤',
    };
  }
}

// 將 Merlin 回傳結果對應到內建鳥種
export function matchSpeciesByMerlinCode(
  merlinCode: string,
  allSpecies: BirdSpecies[]
): BirdSpecies | undefined {
  return allSpecies.find((s) => s.merlinCode === merlinCode);
}

// API 狀態檢查
export function isMerlinConfigured(): boolean {
  return PROXY_URL !== null;
}

export function getMerlinInfo() {
  return {
    proxyUrl: PROXY_URL,
    configured: isMerlinConfigured(),
    provider: 'Merlin Bird ID (Cornell Lab)',
    endpoint: PROXY_URL || '(尚未部署 Proxy)',
    note: '部署 Vercel Proxy 並設定 MERLIN_API_KEY 後即可自動切換為真實辨識',
  };
}
