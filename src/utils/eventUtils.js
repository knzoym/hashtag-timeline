// utils/eventUtils.js

// サンプルイベントデータ
export const sampleEvents = [
  {
    id: 1,
    title: "明治維新",
    startDate: new Date(1868, 0, 3),
    endDate: new Date(1868, 0, 3),
    description: "#江戸幕府 が終焉し、#明治政府 が成立。日本の近代化が始まる重要な転換点となった。",
    tags: ["明治維新", "江戸幕府", "明治政府", "日本史", "歴史"],
    position: { x: 0, y: 60 },
  },
  {
    id: 2,
    title: "終戦",
    startDate: new Date(1945, 7, 15),
    endDate: new Date(1945, 7, 15),
    description: "太平洋戦争が終結。日本が連合国に降伏した。",
    tags: ["終戦", "太平洋戦争", "日本史", "歴史"],
    position: { x: 0, y: 60 },
  },
  {
    id: 101,
    title: "バウハウス設立",
    startDate: new Date(1919, 3, 1),
    endDate: new Date(1919, 3, 1),
    description: "#モダニズム の原点。#バウハウス は機能美と合理性を追求した芸術学校。",
    tags: ["バウハウス", "モダニズム", "建築教育", "近代建築"],
    position: { x: 0, y: 80 },
  },
  {
    id: 102,
    title: "サヴォア邸",
    startDate: new Date(1931, 0, 1),
    endDate: new Date(1931, 0, 1),
    description: "近代建築の五原則を体現した #ル・コルビュジエ の代表作。",
    tags: ["ル・コルビュジエ", "近代建築", "モダニズム", "住宅建築"],
    position: { x: 0, y: 80 },
  },
  {
    id: 103,
    title: "落水荘",
    startDate: new Date(1939, 0, 1),
    endDate: new Date(1939, 0, 1),
    description: "自然との調和を実現した #有機的建築 の傑作。",
    tags: ["フランク・ロイド・ライト", "有機的建築", "アメリカ建築"],
    position: { x: 0, y: 90 },
  },
  {
    id: 104,
    title: "CIAM設立",
    startDate: new Date(1928, 0, 1),
    endDate: new Date(1928, 0, 1),
    description: "#CIAM は近代建築の国際的普及を目指す会議体。",
    tags: ["CIAM", "都市計画", "近代建築"],
    position: { x: 0, y: 100 },
  },
  {
    id: 105,
    title: "広島平和記念資料館",
    startDate: new Date(1955, 0, 1),
    endDate: new Date(1955, 0, 1),
    description: "#丹下健三 による戦後日本のモダニズム建築。",
    tags: ["丹下健三", "日本建築", "広島", "モダニズム"],
    position: { x: 0, y: 100 },
  },
  {
    id: 106,
    title: "TWAフライトセンター",
    startDate: new Date(1962, 0, 1),
    endDate: new Date(1962, 0, 1),
    description: "曲線的なフォルムが象徴的な #未来派建築 の代表作。",
    tags: ["サーリネン", "空港建築", "未来派建築"],
    position: { x: 0, y: 100 },
  },
  {
    id: 107,
    title: "メタボリズム",
    startDate: new Date(1960, 0, 1),
    endDate: new Date(1960, 0, 1),
    description: "新陳代謝する都市を構想した #メタボリズム 運動。",
    tags: ["メタボリズム", "都市構想", "日本建築"],
    position: { x: 0, y: 110 },
  },
  {
    id: 108,
    title: "大分県立図書館",
    startDate: new Date(1966, 0, 1),
    endDate: new Date(1966, 0, 1),
    description: "#磯崎新 初期の代表作。#モダニズム に根ざしつつ独自の構造美を持つ。",
    tags: ["磯崎新", "図書館建築", "日本建築"],
    position: { x: 0, y: 100 },
  },
  {
    id: 109,
    title: "ロイドビル",
    startDate: new Date(1986, 0, 1),
    endDate: new Date(1986, 0, 1),
    description: "#ハイテック建築 の象徴的作品。",
    tags: ["ハイテック建築", "リチャード・ロジャース", "イギリス建築"],
    position: { x: 0, y: 90 },
  },
  // 残りのイベントも同様に定義...
];

// 初期タグ
export const initialTags = [
  "明治維新", "江戸幕府", "明治政府", "終戦", "太平洋戦争",
  "日本史", "歴史", "政治", "文化", "モダニズム", "近代建築"
];

// イベント関連のユーティリティ関数
export const createNewEvent = (title, date, description, tags) => ({
  id: Date.now(),
  title,
  startDate: date,
  endDate: date,
  description,
  tags,
  position: { x: 0, y: 60 },
});

export const updateEvent = (event, updates) => ({
  ...event,
  ...updates,
});

export const sortEventsByDate = (events) => {
  return [...events].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
};