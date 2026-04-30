// ============================================================
// 設定ファイル｜オーガニックQ&Aひろば
// ============================================================
// セットアップ後、以下の2つのURLを書き換えてください。
// 詳しくは SETUP.md を参照。
// ============================================================

window.QA_CONFIG = {
  // 質問送信用のGAS WebApp URL（doPost）
  // 例: https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxx/exec
  POST_URL: "https://script.google.com/macros/s/AKfycbyGUzJkQv-tCgrOFNECQ9BEUHsNDSdTLkHyropZd2IYLZBStjiPV1cBIQ-ruCX-iyAcRg/exec",

  // Q&A一覧取得用のGAS WebApp URL（doGet）
  // 例: https://script.google.com/macros/s/AKfycbyyyyyyyyyyyyyyyyyyyy/exec
  GET_URL: "https://script.google.com/macros/s/AKfycbxz_iUuT6ENiLDJ6NTmSEwE2R_Rd14hOmjCHRtp9rAmaPpVEjmZ219C5nsJR41qehAs/exec",

  // アーカイブ閲覧の合言葉（GAS側にも同じ値を設定）
  PASSWORD: "biohiroba"
};
