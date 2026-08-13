# Android LIFF 拍照入口驗收

主會員 LIFF URL：`https://liff.line.me/2010925044-KXzQzB5r`

Worker Endpoint URL：`https://akaffit-team.fangwl591021.workers.dev/`

## 程式內已完成

- 拍照與相簿使用不同的 file input。
- 拍照 input：`accept="image/*" capture="environment"`。
- 相簿 input：`accept="image/*"`，不含 `capture`。
- 專屬推薦網址改由主 LIFF URL 進入，舊 `/i/:token` 仍相容。
- 任務提醒改由主 LIFF URL 進入。
- 非 LIFF Browser 進入掃描頁時顯示改用 LIFF 的導引。
- 裁切、OCR、名片儲存與點數規則未修改。

## 合併後仍需人工確認（本 PR 不修改外部平台）

在 LINE Developers Console 確認主 LIFF App：

- LIFF ID：`2010925044-KXzQzB5r`
- Size：Full
- Endpoint URL：`https://akaffit-team.fangwl591021.workers.dev/`

將下列所有「會員中心／拍照掃描」入口改為主 LIFF URL，不可使用 Worker Endpoint URL：

- LINE 官方帳號圖文選單 URI
- Flex Message URI action
- 圖片地圖與關鍵字回覆
- 歡迎訊息
- QR Code
- 母站、官網與營運後台導流按鈕
- 舊教學、書籤與桌面捷徑

公開名片 `/c/:id`、公開收藏名片 `/d/:token` 維持免登入 Endpoint URL，不強制改為會員 LIFF。

## Android 實機

1. 將 `https://liff.line.me/2010925044-KXzQzB5r?camera_probe=20260813` 貼到 LINE 聊天室。
2. 從聊天室點開，確認無 LINE 內建瀏覽器底部工具列。
3. 確認 `liff.isInClient() === true`。
4. 名片收藏與電子名片各測一次：拍照開相機、相簿開相簿、裁切與 OCR 正常。
5. 再從正式圖文選單重測。
6. iOS 使用同一 LIFF URL 回歸拍照、相簿、裁切與 OCR。
