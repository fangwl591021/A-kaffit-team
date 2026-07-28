# A-Kaffit Team 商務中心

以手機為優先的商務人脈儀表板，部署於 Cloudflare Workers。

## MVP 範圍

- 今日商脈指數與關鍵數據
- 名片收藏、人脈配對、行事曆、附近商家、活動中心、商脈錢包
- 人脈、洞察與個人資料分頁
- 首次使用只建立姓名、行動電話、生日資料，暫不設登入驗證
- 個人資料暫存於瀏覽器 `localStorage`
- 不包含 AI 內容生成或 AI 穿戴功能

## 開發

```powershell
npm.cmd install
npm.cmd run dev
```

## 驗證

```powershell
npm.cmd test
npm.cmd run check
```

## 部署

```powershell
npm.cmd run deploy
```
