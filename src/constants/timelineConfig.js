// constants/timelineConfig.js - 位置修正版（40%・重なり回避強化）
export const TIMELINE_CONFIG = {
  // 基本スケール設定
  BASE_PIXELS_PER_YEAR: 2,
  DEFAULT_SCALE: 2.5,
  MIN_SCALE: 0.1,
  MAX_SCALE: 50,

  // タイムライン位置設定（40%に変更）
  MAIN_TIMELINE_Y: () => window.innerHeight * 0.25,  // 30% → 40%に変更
  FIRST_ROW_Y: () => window.innerHeight * 0.4 + 120, // メインラインから120px下に年表開始
  ROW_HEIGHT: 140, // 年表間隔を少し広げて重なりを回避
  
  // イベントサイズ設定（小型化）
  EVENT_HEIGHT: 28,     // 36 → 28に減少（小さくする）
  EVENT_MIN_WIDTH: 45,  // 60 → 45に減少（小さくする）
  EVENT_MAX_WIDTH: 160, // 200 → 160に減少（小さくする）
  EVENT_PADDING: 5,    // 16 → 12に減少（左右合計）
  EVENT_BORDER: 2,      // 4 → 2に減少（左右合計）
  
  // 干渉回避設定（強化・無制限積み重ね対応）
  EVENT_MARGIN: 5,     // 15 → 20に増加（重なり回避強化）
  TIER_HEIGHT: 20,      // 45 → 40に減少（イベントを小さくするため）
  MAX_TIERS: 50,        // 8 → 50に大幅増加（積み重ね制限なし）
  
  // グループ設定（調整版）
  MIN_GROUP_SIZE: 2,    // グループ化に必要な最小イベント数
  GROUP_THRESHOLD: 100, // 80 → 100に増加（グループ化条件を厳しく）
  
  // 年表軸設定
  AXIS_HEIGHT: 3,
  AXIS_SPACING: 140,    // 120 → 140に増加（年表間隔拡大）
  
  // ズーム・パン設定
  ZOOM_SENSITIVITY: 0.001,
  PAN_BOUNDARY_MARGIN: 200,
  
  // アニメーション設定
  TRANSITION_DURATION: 0.2,
  
  // 年マーカー設定（スケール対応）
  YEAR_MARKER_INTERVALS: {
    1: [1, 5, 10],      // スケール1以下: 1年、5年、10年間隔
    5: [10, 50],        // スケール5以下: 10年、50年間隔  
    20: [100],          // スケール20以下: 100年間隔
    100: [500]          // スケール100以下: 500年間隔
  },

  // ネットワークビュー設定
  NETWORK_CENTER_Y: () => window.innerHeight * 0.5,
  NETWORK_RADIUS_BASE: 60,
  NETWORK_RADIUS_VARIATION: 30,

  // カード重なり回避設定
  CARD_COLLISION_MARGIN: 15, // カード間の最小マージン
  CARD_MAX_STACK_HEIGHT: 5,  // 縦方向の最大積み重ね数

  // レスポンシブ設定
  MOBILE_SCALE_FACTOR: 0.8,  // モバイル時のスケール調整
  MOBILE_MARGIN_FACTOR: 0.7, // モバイル時のマージン調整

  // デバッグ設定
  DEBUG_MODE: false,
  LOG_LAYOUT_DETAILS: false,

  // パフォーマンス設定
  RENDER_OPTIMIZATION: true,
  LAZY_RENDERING_THRESHOLD: 100, // イベント数がこれを超えると遅延レンダリング
}