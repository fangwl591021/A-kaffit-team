# A-KAFFIT Card Scanner V2 技術規格

版本：V2.1 Draft  
分支：`agent/card-scanner-v2`  
狀態：Phase A 已完成接線，尚未部署正式環境。  
目標：以低成本、低延遲、低記憶體消耗方式完成名片拍攝、裁切、透視補正、品質檢查與 OCR 前置處理。

## 1. 核心原則

1. 裁切與透視補正不使用生成式 AI。
2. 不完整、模糊、過暗、嚴重反光的照片不送 OCR。
3. 自動定位信心不足時直接進人工裁切，不硬猜。
4. 人工裁切一旦確認，即為最終裁切權威，不再執行自動裁切。
5. OCR 與裁切解耦；OCR 只接受已完成裁切的最終圖片。
6. 禁止生成式補圖、猜字、補 Logo、補不存在的名片邊界或聯絡資料。
7. 高解析手機照片在送 R2 前先降到 Working Image，避免只降低運算量卻仍傳送 12MP/48MP 原圖。

## 2. 正式流程

```text
手機拍照 / 相簿選圖
        ↓
手機端解析度正規化（0 token）
        ↓
Working Image：長邊 ≤ 2200px
        ↓
上傳 R2
        ↓
Analysis Image：長邊 1280px
        ↓
四邊 / 四角偵測（0 token）
        ↓
完整性 + 品質檢查（0 token）
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

## 3. 解析度政策

### Original Input

手機相機可能產生 12MP、48MP 或更高照片。原始檔只作為前端輸入來源，不直接進行四邊分析，也不原封不動上傳 R2。

### Working Image

- 長邊最大 2200px。
- 原圖長邊 ≤ 2200px 時維持原尺寸，不放大。
- 原圖長邊 > 2200px 時，手機端先縮小。
- 上傳 R2 的名片影像以 Working Image 為準。
- 建議 WebP quality 約 0.88。

### Analysis Image

- 長邊 1280px。
- 低效能裝置可降到 960px。
- 不上傳、不持久化。
- 只用於邊緣、直線、四角、完整度、模糊、亮度與反光分析。

### Final OCR Image

- 橫式目標 1600 × 960。
- 直式目標 960 × 1600。
- 若來源不足，不得放大製造假細節。
- WebP quality 約 0.86。

## 4. 使用情境

### 手持名片

背景可能包含手指、螢幕、鍵盤。只要四角完整，系統應找四條主要邊界、計算四角、透視拉正後進 OCR。

### 桌面 / 筆電上的名片

背景可能包含鍵盤、貼紙、金屬紋理。四角完整才可自動補正；若一邊或一角超出照片，直接要求重拍，不憑比例補圖。

## 5. 模組責任

### `card-scanner-v2-resolution.js`

- Original → Working。
- Working → Analysis。
- Analysis 座標映射回 Working。
- Final OCR 尺寸規則。
- `normalizeWorkingSource()` 提供上傳與 Cropper 的低記憶體路徑。

### `card-scanner-v2.js`

純幾何演算法：灰階、邊緣、Hough 長直線、平行線與垂直線組合、四邊形候選、四角排序、完整度、Perspective Transform 基礎函式。不得呼叫 API、OCR 或 UI。

### `card-scanner-v2-runtime.js`

- 建立 Working / Analysis。
- Analysis 四角偵測。
- 四角映射回 Working。
- Working Image 執行 Perspective Warp。
- 輕度亮度 / 對比補正。
- Final Image 輸出。
- 每次掃描後釋放 Working / Analysis / Warp Canvas。

### `card-scanner-v2-gate.js`

- 高信心：自動圖通過。
- 中低信心且照片完整：開啟 Cropper。
- Cropper 使用 Working Image，不直接載入 12MP / 48MP 原圖。
- 未完整入鏡、嚴重模糊、過暗、反光：`CARD_RETAKE_REQUIRED`。
- 人工裁切完成後 `manualCorrection=true`，不得再次自動裁切。

### `card-scanner-v2-upload.js`

- 僅攔截 `POST /v1/card-images`。
- 高解析圖先在手機轉 Working Image。
- 小圖維持原檔。
- 同步更新 `content-type`、`x-card-file-size`、`x-card-resolution-normalized`。
- 不影響其他 fetch。

### `card-image-smart-20260815-5.js`

相容層：既有 `app.js` 不需大規模重寫，仍使用原函式名稱，但實際處理由 Card Scanner V2 接管。

## 6. 完整性檢查

自動裁切成立前必須確認：

- 四條合理名片邊界。
- 四個不同角點。
- 凸四邊形合理。
- 長寬比合理。
- 面積比例合理。
- 邊緣支撐足夠。
- 四角不貼照片邊界。

角點貼近影像邊界視為可能未完整入鏡，不允許補出不存在內容。

## 7. 品質檢查

免費本機計算：Blur、Brightness、Glare、Coverage、Geometry Confidence。嚴重失敗直接要求重拍，禁止浪費 OCR。

## 8. 人工裁切權威

正確流程：

```text
人工裁切 → 確認 → OCR
```

禁止：

```text
人工裁切 → 再自動裁切 → 再判斷 → 再 OCR
```

人工裁切在手機本機執行，0 token；確認後就是 Final Image。

## 9. OCR Gate

只有兩種圖片可進 OCR：

1. `automatic_verified`：四角完整、信心達標、品質達標、Perspective Warp 成功。
2. `manual_verified`：使用者完成手動裁切。

禁止進 OCR：

- 原始大圖 fallback。
- 自動裁切失敗原圖。
- 未完整入鏡。
- 嚴重模糊 / 過暗 / 反光。
- 使用者取消裁切。

## 10. AI 成本規則

### 0 token

解析度縮小、四邊/四角、完整性、模糊/亮度/反光、Perspective Warp、人工 Cropper。

### 必要 AI

最終 OCR：正常情況一次。

### 背景非同步 AI

CRM、五大標籤、公司資料補全、公開資料搜尋；不得阻塞名片建立。

## 11. R2 儲存政策

- 高解析手機原始照片不直接上傳。
- R2 的 `original` 實際概念改為 Working Image，長邊最大 2200px。
- Final OCR Image 可另存 processed image。
- Analysis Image 永不保存。
- 不完整 / 垃圾圖不得成為正式名片素材。

## 12. 狀態機

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

`manual_verified` 與 `automatic_verified` 匯流後，OCR 不需要知道前面用哪種方式裁切。

## 13. 必測矩陣

1. 手拿名片 + 螢幕 / 鍵盤背景。
2. 桌面名片。
3. 筆電上的名片。
4. 斜拍梯形。
5. 橫式 / 直式。
6. 白名片 + 白桌面。
7. 黑名片 + 深色背景。
8. 手指干擾但未遮名片。
9. 名片一邊 / 一角超出照片。
10. 嚴重反光、過暗、模糊。
11. 名片太小。
12. 12MP / 48MP。
13. Android LINE LIFF。
14. iPhone LINE LIFF。
15. 相簿上傳。
16. 正面 + 背面。
17. 取消人工裁切。
18. 人工裁切後確認只進一次 OCR。

## 14. 驗收標準

### 功能

- 正常四角完整名片可自動裁切。
- 斜拍可拉正。
- 自動不確定時能人工裁切。
- 缺邊 / 缺角不誤判成功。
- 人工裁切後不再次自動裁切。

### 成本

- 裁切階段 0 token。
- 不合格圖 0 OCR。
- 合格名片正常只跑 1 次 OCR。

### 效能

- 不使用完整 12MP / 48MP 圖執行 Hough。
- R2 正常名片上傳長邊最大 2200px。
- Analysis Image 長邊 1280px。
- 人工 Cropper 來源長邊最大 2200px。
- Canvas / Object URL / ImageBitmap 完成後釋放。

## 15. 上線策略

### Phase A：完成

已完成：resolution、geometry、runtime、OCR gate、manual fallback、pre-upload normalizer、相容層、契約測試與主規格文件。尚未部署 production。

### Phase B：下一步

Staging 實拍 Android / iPhone：手拿、桌放、斜拍、背景複雜、故意缺邊、故意模糊、12MP / 48MP。

### Phase C

Staging 實拍達標後才允許合併正式分支。

## 16. 不可退回的舊設計

後續任何 AI / Codex 接手都不得重新加入：

- 生成式 AI 作為裁切必要步驟。
- 自動裁切失敗後直接把原圖送 OCR。
- 人工裁切後再次自動裁切。
- 為了湊尺寸生成缺失畫面。
- 把 OCR、CRM、五大標籤綁成單一阻塞流程。
- 直接拿 12MP / 48MP 原始照片執行完整分析。

Card Scanner V2 的核心是：**本機幾何處理優先，只有讀文字才使用 AI。**
