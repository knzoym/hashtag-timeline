// constants/timelineConfig.js - 更新版（イベントサイズ統一・グループ化調整）
export const TIMELINE_CONFIG = {
  // 基本スケール設定
  BASE_PIXELS_PER_YEAR: 2,
  DEFAULT_SCALE: 2.5,
  MIN_SCALE: 0.1,
  MAX_SCALE: 50,

  // タイムライン位置設定
  MAIN_TIMELINE_Y: () => window.innerHeight * 0.3,
  FIRST_ROW_Y: () => window.innerHeight * 0.3 + 100,
  ROW_HEIGHT: 120,
  
  // イベントサイズ設定（統一）
  EVENT_HEIGHT: 32,
  EVENT_MIN_WIDTH: 60,
  EVENT_MAX_WIDTH: 180,
  EVENT_PADDING: 16, // 左右合計（4px × 4）
  EVENT_BORDER: 4,   // 左右合計（2px × 2）
  
  // 干渉回避設定
  EVENT_MARGIN: 15,     // イベント間の最小間隔
  TIER_HEIGHT: 45,      // 段の高さ間隔
  MAX_TIERS: 3,         // 最大段数（3段システム）
  
  // グループ設定（調整版）
  MIN_GROUP_SIZE: 2,    // グループ化に必要な最小イベント数
  GROUP_THRESHOLD: 80,  // グループ化判定のピクセル閾値（緩和）
  
  // 年表軸設定
  AXIS_HEIGHT: 3,
  AXIS_SPACING: 120,
  
  // ズーム・パン設定
  ZOOM_SENSITIVITY: 0.001,
  PAN_BOUNDARY_MARGIN: 200,
  
  // アニメーション設定
  TRANSITION_DURATION: 0.2,
  
  // 年マーカー設定
  YEAR_MARKER_INTERVALS: {
    1: [1, 5, 10],      // スケール1以下: 1年、5年、10年間隔
    5: [10, 50],        // スケール5以下: 10年、50年間隔  
    20: [100]           // スケール20以下: 100年間隔
  }
};