// src/utils/eventSizeUtils.js - 統一イベントサイズ計算
import { TIMELINE_CONFIG } from '../constants/timelineConfig';

/**
 * 統一されたイベント幅計算
 * EventCard.jsの実際の表示サイズと完全に一致
 */
export const calculateEventWidth = (event, calculateTextWidth) => {
  if (!event || !event.title) {
    return TIMELINE_CONFIG.EVENT_MIN_WIDTH || 60;
  }

  // テキスト幅を計算（calculateTextWidth関数を使用）
  const textWidth = calculateTextWidth ? calculateTextWidth(event.title) : (event.title.length * 8);
  
  // EventCard.jsのスタイル定義と同じ計算
  // padding: '4px 8px' → 左右合計16px
  // border: '2px solid' → 左右合計4px
  // 実際の内容幅 + パディング + ボーダー
  const contentWidth = textWidth + 16 + 4;
  
  // EventCard.jsと同じ制限を適用
  const minWidth = TIMELINE_CONFIG.EVENT_MIN_WIDTH || 60;
  const maxWidth = TIMELINE_CONFIG.EVENT_MAX_WIDTH || 180;
  
  return Math.max(minWidth, Math.min(maxWidth, contentWidth));
};

/**
 * 統一されたイベント高さ計算
 * EventCard.jsの実際の表示サイズと完全に一致
 */
export const calculateEventHeight = (event) => {
  // EventCard.jsで定義されている固定の高さ
  return TIMELINE_CONFIG.EVENT_HEIGHT || 32;
};

/**
 * イベントの実際の境界ボックス計算
 * 干渉判定で使用
 */
export const getEventBounds = (event, position, calculateTextWidth) => {
  const width = calculateEventWidth(event, calculateTextWidth);
  const height = calculateEventHeight(event);
  
  return {
    left: position.x - width / 2,
    right: position.x + width / 2,
    top: position.y - height / 2,
    bottom: position.y + height / 2,
    width,
    height,
    centerX: position.x,
    centerY: position.y
  };
};

/**
 * 2つのイベント間の干渉チェック
 * マージン（最小間隔）を考慮
 */
export const checkEventCollision = (event1, position1, event2, position2, calculateTextWidth, margin = 15) => {
  const bounds1 = getEventBounds(event1, position1, calculateTextWidth);
  const bounds2 = getEventBounds(event2, position2, calculateTextWidth);
  
  // 水平方向の重複チェック（マージン考慮）
  const horizontalOverlap = !(bounds1.right + margin < bounds2.left || bounds2.right + margin < bounds1.left);
  
  // 垂直方向の重複チェック（マージン考慮）
  const verticalOverlap = !(bounds1.bottom + margin < bounds2.top || bounds2.bottom + margin < bounds1.top);
  
  return horizontalOverlap && verticalOverlap;
};

/**
 * 複数イベント間の干渉チェック（配列バージョン）
 */
export const checkMultipleCollisions = (newEvent, newPosition, existingEvents, calculateTextWidth, margin = 15) => {
  for (let i = 0; i < existingEvents.length; i++) {
    const existing = existingEvents[i];
    if (checkEventCollision(newEvent, newPosition, existing.event, existing.position, calculateTextWidth, margin)) {
      return {
        hasCollision: true,
        collidingEvent: existing,
        collidingIndex: i
      };
    }
  }
  
  return {
    hasCollision: false,
    collidingEvent: null,
    collidingIndex: -1
  };
};

/**
 * イベントの表示情報を統一形式で取得
 * UIコンポーネントで使用
 */
export const getEventDisplayInfo = (event, calculateTextWidth) => {
  return {
    width: calculateEventWidth(event, calculateTextWidth),
    height: calculateEventHeight(event),
    title: event.title || 'Untitled',
    year: event.startDate ? event.startDate.getFullYear() : '',
    hasTimelineInfo: !!event.timelineInfo,
    needsExtensionLine: event.timelineInfo?.needsExtensionLine || false
  };
};

/**
 * デバッグ用：イベントサイズ情報の出力
 */
export const debugEventSize = (event, calculateTextWidth) => {
  const bounds = getEventBounds(event, { x: 0, y: 0 }, calculateTextWidth);
  const displayInfo = getEventDisplayInfo(event, calculateTextWidth);
  
  console.log(`📏 イベントサイズデバッグ: "${event.title || 'Untitled'}"`, {
    計算幅: bounds.width,
    計算高さ: bounds.height,
    テキスト幅: calculateTextWidth ? calculateTextWidth(event.title || '') : 'N/A',
    表示情報: displayInfo
  });
  
  return { bounds, displayInfo };
};