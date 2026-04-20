# 🪶 BIRD-DEX · 兒童賞鳥收集 App

Pokémon 捕捉器風格的兒童教育向賞鳥 App，整合 AI 辨識、卡牌收集、Notion 後台。

## ✨ 功能特色

- 🎴 **7 階稀有度**：UC / C / R / SR / SSR / UR / LR（依捕捉次數升級）
- 🤖 **Merlin Bird ID 辨識**（含 merlinCode 欄位）
- 🗺️ **香港 + 世界觀鳥地圖**（60+ 觀察熱點）
- 📊 **圖鑑 30 種鳥**（可擴充）
- 🔐 **兩層後台密碼**
  - 家長/老師 `0728`（審核照片）
  - 超級管理員 `1201`（更新卡牌資料）
- ☁️ **Notion 後台同步**（覆蓋式更新）
- 🎮 **XP / 等級 / 職稱**系統

## 🛠️ 技術棧

- **React Native + Expo SDK 54**
- **TypeScript**
- **React Navigation**（Stack + Bottom Tabs）
- **expo-linear-gradient**（霓虹漸層）
- **AsyncStorage**（本機資料儲存）

---

## 🚀 本地啟動

```bash
# 1. 安裝依賴
npm install

# 2. 啟動開發伺服器
npx expo start

# 3. 用 Expo Go App 掃 QR code，或按 i (iOS) / a (Android) / w (Web)
```

---

## 📦 部署方式

### 方案 A：部署成 PWA (Progressive Web App) 【推薦】

免費、免 App Store、快速分發給家長與小朋友。

```bash
# 1. 編譯 Web 版本
npx expo export --platform web

# 2a. 部署到 Vercel (免費)
npm i -g vercel
vercel --prod

# 2b. 或部署到 Netlify (免費)
npm i -g netlify-cli
netlify deploy --prod --dir=dist

# 2c. 或部署到 GitHub Pages
# 把 dist 資料夾推到 gh-pages 分支即可
```

使用者開啟網址後，iOS Safari 可「加入主畫面」，Android Chrome 可「安裝應用程式」，使用起來跟原生 App 一樣。

### 方案 B：編譯原生 App (iOS/Android APK)

適合想要實體安裝檔、完整離線可用的情境。

```bash
# 1. 安裝 EAS CLI
npm install -g eas-cli

# 2. 登入 Expo 帳號 (免費註冊 expo.dev)
eas login

# 3. 設定專案
eas build:configure

# 4a. 編譯 Android APK
eas build -p android --profile preview

# 4b. 編譯 iOS (需 Apple Developer 帳號 $99/年)
eas build -p ios --profile preview
```

編譯完成後，Expo 會提供下載連結。APK 可直接傳給 Android 用戶安裝。

### 方案 C：Expo Go 即時測試

最快測試方式，不需編譯：

```bash
npx expo start
# 用手機 Expo Go App 掃描 QR code
```

---

## 📂 專案結構

```
birddex/
├── App.tsx                    # 主入口、路由設定
├── package.json
├── app.json                   # Expo 設定
├── tsconfig.json
├── assets/                    # 圖示、字型
│
├── lib/
│   ├── theme.ts              # 稀有度、顏色、等級計算
│   ├── birdData.ts           # 30 種鳥資料 + Notion 模組定義
│   └── BirdContext.tsx       # 全域狀態管理 (React Context)
│
├── components/
│   ├── BirdCard.tsx          # 卡牌元件（含稀有度樣式）
│   └── RarityBadge.tsx
│
└── screens/
    ├── WelcomeScreen.tsx     # 歡迎頁
    ├── ScannerScreen.tsx     # 拍攝頁（捕捉模式）
    ├── CaptureResultScreen.tsx  # 捕捉結果（含詳細資料）
    ├── DexScreen.tsx         # 圖鑑頁
    ├── BirdDetailScreen.tsx  # 鳥類資料卡
    ├── GalleryScreen.tsx     # 卡牌總覽
    ├── MapScreen.tsx         # 尋鳥地圖（香港 + 世界）
    ├── ProfileScreen.tsx     # 訓練家個人頁
    ├── AdminLoginScreen.tsx  # 後台密碼入口
    └── AdminPanelScreen.tsx  # 後台管理面板
```

---

## 🔑 後台使用方式

**入口**：訓練家頁面 → 最底部「後台人員入口」

**密碼**：
- `0728` - 家長/老師模式（可審核照片）
- `1201` - 超級管理員（可更新卡牌、改密碼）

> 家長/老師密碼 `0728` 可由超級管理員在後台隨時更改，方便對應不同活動。

---

## 📝 Notion 後台整合（可選）

若要串接真實 Notion 資料庫，修改 `lib/BirdContext.tsx` 的 `syncFromNotion()` 函式：

```typescript
const syncFromNotion = async () => {
  const res = await fetch('https://api.notion.com/v1/databases/YOUR_DB_ID/query', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer secret_xxx',
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json();
  // 轉成 BirdSpecies[] 後塞進 remoteOverrides
};
```

---

## 🤖 Merlin Bird ID 整合（可選）

每隻鳥已預留 `merlinCode` 欄位，串接時替換 `simulateRecognize()`：

```typescript
const recognize = async (photoUri: string) => {
  const formData = new FormData();
  formData.append('image', { uri: photoUri, name: 'bird.jpg', type: 'image/jpeg' });
  
  const res = await fetch('https://merlin.allaboutbirds.org/api/v1/photo-id', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer YOUR_API_KEY' },
    body: formData,
  });
  return await res.json();
};
```

Merlin API Key 申請：https://merlin.allaboutbirds.org/

---

## 📄 授權

教育用途免費使用。

© 2024 BIRD-DEX Team
