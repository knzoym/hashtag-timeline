// utils/timelineUtils.js
import { TIMELINE_CONFIG } from "../constants/timelineConfig";

// タグを説明文から抽出
export const extractTagsFromDescription = (description) => {
  const tagRegex = /#([^\s#]+)/g;
  const matches = [];
  let match;
  while ((match = tagRegex.exec(description)) !== null) {
    matches.push(match[1]);
  }
  return matches;
};

// イベントタイトルを制限
export const truncateTitle = (title, maxLength = 12) => {
  return title.length > maxLength
    ? title.substring(0, maxLength) + "..."
    : title;
};

// 初期パンX位置を計算
export const calculateInitialPanX = () => {
  const initialPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * TIMELINE_CONFIG.DEFAULT_SCALE;
  const targetX = (TIMELINE_CONFIG.DEFAULT_TARGET_YEAR - TIMELINE_CONFIG.START_YEAR) * initialPixelsPerYear;
  return window.innerWidth - targetX;
};

// 座標から年を計算
export const getYearFromX = (x, currentPixelsPerYear, panX) => {
  return TIMELINE_CONFIG.START_YEAR + (x - panX) / currentPixelsPerYear;
};

// 年から座標を計算
export const getXFromYear = (year, currentPixelsPerYear, panX) => {
  return (year - TIMELINE_CONFIG.START_YEAR) * currentPixelsPerYear + panX;
};

// 年表マーカーの間隔を決定
export const getYearInterval = (scale) => {
  const adjustedScale = scale / 2.5;
  if (adjustedScale > 12) return 1;
  if (adjustedScale > 6) return 2;
  if (adjustedScale > 2) return 5;
  if (adjustedScale > 0.8) return 10;
  if (adjustedScale > 0.4) return 50;
  if (adjustedScale > 0.2) return 100;
  if (adjustedScale > 0.1) return 200;
  if (adjustedScale > 0.04) return 500;
  return 1000;
};