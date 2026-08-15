# A-KAFFIT Card Scanner V2 技術規格

版本：V2.1 Draft  
分支：`agent/card-scanner-v2`  
目標：以低成本、低延遲、低記憶體消耗方式完成名片拍攝、裁切、透視補正、品質檢查與 OCR 前置處理。

---

## 1. 重新架構原因

舊版智慧裁切把「找名片」、「裁切」、「OCR」、「二次驗證」、「CRM 分析」綁得太緊，且自動裁切主要依賴背景顏色與前景差異。在實際外出拍攝情境中，背景可能包含手指、鍵盤、桌面、筆電、貼紙、螢幕、陰影、反光，這會造成錯誤定位。

V2 不再把自動裁切視為 AI 主流程，而是把它定義為「零 token 的本機文件掃描前處理」。AI 只負責最終 OCR 與後續非同步資料分析。

核心原則：

1. 裁切與透視補正不使用生成式 AI。
2. 不完整、模糊、過暗、嚴重反光的照片不送 OCR。
3. 自動定位信心不足時直接進人工裁切，不硬猜。
4. 人工裁切一旦確認，即為最終裁切權威，不再執行自動裁切。
5. OCR 與裁切解耦；OCR 只接受「已完成裁切的最終圖片」。
6. 禁止生成式補圖、猜字、補 Logo、補不存在的名片邊界或聯絡資料。
7. 高解析手機照片在送 R2 前先降到 Working Image，避免只降低運算量卻仍傳送 12MP/48MP 原圖。

---

## 2. 使用者實際拍攝情境

### 2.1 手持名片

特徵：

- 名片周圍可能有手指、皮膚、電腦螢幕、鍵盤。
- 名片通常略有透視變形。
- 四個角多半完整存在。

預期行為：

- 找到四條主要邊界。
- 排除手指與背景雜訊。
- 計算四個角點。
- 進行透視補正。
- 補正後再進 OCR。

### 2.2 名片放在桌面或筆電上

特徵：

- 背景可能有鍵盤、貼紙、金屬紋理、桌面紋路。
- 名片可能靠近照片邊界。
- 可能出現名片局部超出畫面的情況。

預期行為：

- 若四角完整：自動裁切與透視補正。
- 若任一真實邊界或角點超出照片：判定「未完整入鏡」，要求重拍。
- 不得根據名片標準比例憑空補出缺失區域。

---

## 3. 正式流程

```text
手機拍照 / 相簿選圖
        ↓
[Stage 0] 手機端解析度正規化（0 token）
        ↓
Working Image：長邊 ≤ 2200px
        ↓
上傳 R2（不傳超高解析原圖）
        ↓
Analysis Image：長邊 1280px
        ↓
[Stage 1] 四邊 / 四角偵測（0 token）
        ↓
[Stage 2] 完整性 + 品質檢查（0 token）
        ↓
 ┌──────────────┬───────────────┬───────────────┐
 │              │               │
重拍           人工裁切         自動補正
 │              │               │
0 token         0 token          0 token
 │              │               │
 └──────────────┴───────┬───────┘
                         ↓
                    Final Image
                         ↓
                     OCR Gate
                         ↓
                    AI OCR 1 次
                         ↓
                    人工校正
                         ↓
                    名片成立
                         ↓
             CRM / 五大標籤背景非同步
```

---

## 4. 解析度政策

### 4.1 Original Input

手機相機可能產生 12MP、48MP 或更高照片。原始檔只作為前端輸入來源，不應直接進行四邊分析，也不應原封不動上傳 R2。

### 4.2 Working Image

- 長邊最大：2200px。
- 若原圖長邊 ≤ 2200px：維持原尺寸，不放大。
- 若原圖長邊 > 2200px：手機端先縮小。
- 建議輸出 WebP，quality 約 0.88。
- Working Image 是 R2 儲存與透視補正的高品質來源。

### 4.3 Analysis Image

- 長邊：1280px。
- 低效能裝置可降到 960px。
- 不上傳、不持久化。
- 只用於邊緣、直線、四角、完整度、模糊、亮度與反光分析。

### 4.4 Final OCR Image

目標尺寸：

- 橫式：1600 × 960。
- 直式：960 × 1600。
- 若來源不足，不得為達目標尺寸而放大製造假細節。
- WebP quality 約 0.86。

---

## 5. 模組責任

### `card-scanner-v2-resolution.js`

負責：

- EXIF / image orientation 相容讀取。
- Original → Working。
- Working → Analysis。
- Analysis 座標映射回 Working。
- Final OCR 尺寸規則。

### `card-scanner-v2.js`

負責純幾何演算法：

- 灰階與邊緣。
- Hough 長直線候選。
- 平行線與垂直線組合。
- 四邊形候選。
- 四角排序。
- 完整度判斷。
- Perspective Transform 基礎函式。

不負責 API、不負責 OCR、不負責 UI。

### `card-scanner-v2-runtime.js`

負責把解析度策略與幾何引擎組合成正式掃描 runtime：

- Working / Analysis 建立。
- Analysis 四角偵測。
- 四角映射回 Working。
- Perspective Warp。
- 輕度亮度 / 對比補正。
- Final Image 輸出。

### `card-scanner-v2-gate.js`

負責 OCR 前最後分流：

- 高信心 → 自動圖通過。
- 中低信心、照片完整 → 開啟 Cropper 人工裁切。
- 未完整入鏡、嚴重模糊、過暗、反光 → 丟出 `CARD_RETAKE_REQUIRED`。
- 人工裁切完成後 `manualCorrection=true`，不得再次自動裁切。

### `card-scanner-v2-upload.js`

負責在既有 `app.js` 呼叫 `/v1/card-images` 時攔截高解析圖片上傳：

- 長邊 > 2200px：先縮成 Working Image。
- 長邊 ≤ 2200px：直接保留原檔。
- 同步修正 `content-type` 與 `x-card-file-size`。
- 僅攔截名片圖片 POST，不影響其他 fetch。

### `card-image-smart-20260815-5.js`

只作相容層，讓既有 `app.js` 不需大規模重寫：

- 安裝名片上傳正規化。
- 對外保持原本函式名稱。
- `processBusinessCardImage` 實際改由 V2 OCR Gate 接管。

---

## 6. 完整性檢查

自動裁切成立前必須確認：

- 找到四條合理名片邊界。
- 找到四個不同角點。
- 四邊形凸形合理。
- 長寬比合理。
- 面積比例合理。
- 邊緣支撐足夠。
- 四角不貼照片邊界。

若角點貼近影像邊界，視為「可能沒有完整入鏡」，不允許自動補出不存在內容。

---

## 7. 品質檢查

免費本機計算：

- Blur：Laplacian / 邊緣變化。
- Brightness：平均亮度與 histogram。
- Glare：高亮像素比例。
- Coverage：名片占畫面比例。
- Geometry Confidence：四邊形與邊緣支撐。

嚴重失敗直接要求重拍，禁止浪費 OCR。

---

## 8. 信心分流

概念規則：

- 高信心：自動補正。
- 中等信心：人工確認 / 裁切。
- 低信心但照片完整：人工裁切。
- 未完整入鏡或品質不可用：重拍。

系統不以「一定要全自動」為目標，而以「不要裁錯、不要浪費 OCR」為第一優先。

---

## 9. 人工裁切權威

人工裁切必須遵守：

1. Cropper 在手機本機執行。
2. 不呼叫 AI。
3. 使用者按下確認後，該圖即為 Final Image。
4. `manualCorrection=true`。
5. 不再執行 V2 自動裁切。
6. 直接送 OCR Gate。

禁止流程：

```text
人工裁切 → 再自動裁切 → 再判斷 → 再 OCR
```

正確流程：

```text
人工裁切 → 確認 → OCR
```

---

## 10. OCR Gate

只有以下兩種圖片可進 OCR：

1. `automatic_verified`
   - 四角完整。
   - 信心達標。
   - 品質達標。
   - Perspective Warp 成功。

2. `manual_verified`
   - 使用者完成手動裁切。

以下禁止進 OCR：

- 原始大圖 fallback。
- 自動裁切失敗原圖。
- 未完整入鏡。
- 嚴重模糊。
- 嚴重過暗。
- 嚴重反光。
- 使用者取消裁切。

---

## 11. AI 成本規則

### 0 token

- 解析度縮小。
- 四邊 / 四角。
- 完整性。
- 模糊 / 亮度 / 反光。
- Perspective Warp。
- 人工 Cropper。

### 必要 AI

- 最終 OCR：正常情況一次。

### 背景非同步 AI

- CRM。
- 五大標籤。
- 公司資料補全。
- 公開資料搜尋。

這些不得阻塞名片建立。

---

## 12. R2 儲存政策

V2 正式策略：

- 高解析手機原始照片不直接上傳。
- R2 的 `original` 概念改為「Working Image」，長邊最大 2200px。
- Final OCR Image 可另外保存為 processed image。
- Analysis Image 永不保存。
- 不保存不完整 / 垃圾圖作為正式名片素材。

這能同時降低：

- 手機上傳時間。
- R2 儲存量。
- Worker 傳輸量。
- 後續影像讀取時間。

---

## 13. 狀態機

```text
selected
  ↓
normalizing
  ↓
scanning
  ├─ retake_required
  ├─ manual_required
  │      ↓
  │   manual_verified
  │
  └─ automatic_verified
          ↓
       ocr_ready
          ↓
       ocr_processing
          ↓
       review_ready
          ↓
       confirmed
```

`manual_verified` 與 `automatic_verified` 匯流後，OCR 不需要知道圖片前面用哪種方式裁切。

---

## 14. 測試矩陣

至少必測：

1. 手拿名片，背景為螢幕 / 鍵盤。
2. 名片放桌面。
3. 名片放筆電。
4. 斜拍梯形。
5. 橫式名片。
6. 直式名片。
7. 白名片 + 白桌面。
8. 黑名片 + 深色背景。
9. 手指遮住部分背景但未遮名片內容。
10. 名片一邊超出照片。
11. 名片一角超出照片。
12. 嚴重反光。
13. 過暗。
14. 模糊。
15. 名片太小。
16. 12MP 手機照片。
17. 48MP 手機照片。
18. Android LINE LIFF。
19. iPhone LINE LIFF。
20. 相簿上傳。
21. 正面 + 背面。
22. 使用者取消人工裁切。
23. 人工裁切後確認只進一次 OCR。

---

## 15. 驗收標準

### 功能

- 正常四角完整名片可自動裁切。
- 斜拍可拉正。
- 自動不確定時能人工裁切。
- 缺邊 / 缺角不誤判為成功。
- 人工裁切後不再次自動裁切。

### 成本

- 裁切階段 0 token。
- 不合格圖 0 OCR。
- 合格名片正常只跑 1 次 OCR。

### 效能

- 不使用完整 12MP / 48MP 圖執行 Hough。
- R2 不接收長邊超過 2200px 的正常名片上傳。
- Analysis Image 長邊預設 1280px。
- 所有 Canvas / Object URL / ImageBitmap 都應在完成後釋放。

---

## 16. 上線策略

### Phase A：本分支

- 完成 V2 runtime、resolution、gate、upload normalizer。
- 保留既有 UI 與 API 路由。
- 不部署 production。

### Phase B：Staging 實拍

以 Android / iPhone 各測：

- 手拿。
- 桌放。
- 斜拍。
- 背景複雜。
- 故意缺邊。
- 故意模糊。
- 12MP / 48MP。

### Phase C：正式切換

只有 Staging 實拍達標後才合併。

---

## 17. 不可退回的舊設計

後續任何 AI / Codex 接手都不得重新加入：

- 以生成式 AI 作為裁切必要步驟。
- 自動裁切失敗後直接把原圖送 OCR。
- 人工裁切後再次自動裁切。
- 為了湊尺寸而生成缺失畫面。
- 把 OCR、CRM、五大標籤綁成單一阻塞流程。
- 直接拿 12MP / 48MP 原始照片執行完整分析。

Card Scanner V2 的核心不是「AI 越多越好」，而是「本機幾何處理優先，只有讀文字才使用 AI」。
