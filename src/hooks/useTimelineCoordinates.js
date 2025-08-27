// hooks/useTimelineCoordinates.js
import { useState, useCallback } from 'react';
import { TIMELINE_CONFIG } from '../constants/timelineConfig';
import { getXFromYear, getYearFromX } from '../utils/timelineUtils';

export const useTimelineCoordinates = () => {
  console.log('🎯 useTimelineCoordinates 初期化');

  const [scale, setScale] = useState(TIMELINE_CONFIG.DEFAULT_SCALE);
  const [panX, setPanX] = useState(() => {
    const initialPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * TIMELINE_CONFIG.DEFAULT_SCALE;
    return window.innerWidth - (2080 - (-5000)) * initialPixelsPerYear;
  });
  const [panY, setPanY] = useState(0);

  const currentPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * scale;

  // パラメータ付きの座標変換関数
  const getXFromYearWithParams = useCallback((year) => {
    return getXFromYear(year, currentPixelsPerYear, panX);
  }, [currentPixelsPerYear, panX]);

  const getYearFromXWithParams = useCallback((x) => {
    return getYearFromX(x, currentPixelsPerYear, panX);
  }, [currentPixelsPerYear, panX]);

  const resetToInitialPosition = useCallback(() => {
    const initialPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * TIMELINE_CONFIG.DEFAULT_SCALE;
    const initialPanX = window.innerWidth - (2080 - (-5000)) * initialPixelsPerYear;
    
    setScale(TIMELINE_CONFIG.DEFAULT_SCALE);
    setPanX(initialPanX);
    setPanY(0);
    console.log('🎯 初期位置にリセット');
  }, []);

  return {
    // 状態
    scale,
    setScale,
    panX,
    setPanX,
    panY,
    setPanY,
    currentPixelsPerYear,
    
    // 変換関数
    getXFromYear: getXFromYearWithParams,
    getYearFromX: getYearFromXWithParams,
    
    // 操作
    resetToInitialPosition
  };
};