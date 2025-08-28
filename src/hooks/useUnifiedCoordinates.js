// hooks/useUnifiedCoordinates.js
import { useState, useCallback } from 'react';
import { TIMELINE_CONFIG } from '../constants/timelineConfig';

export const useUnifiedCoordinates = (timelineRef) => {
  console.log('🎯 useUnifiedCoordinates 初期化');

  // === 座標状態 ===
  const [scale, setScale] = useState(TIMELINE_CONFIG.DEFAULT_SCALE);
  const [panX, setPanX] = useState(() => {
    const initialPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * TIMELINE_CONFIG.DEFAULT_SCALE;
    // 2080年が初期の中心あたりに来るように調整
    return window.innerWidth / 2 - (2080 - (-5000)) * initialPixelsPerYear;
  });
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  // === 計算値 ===
  const pixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * scale;
  const currentPixelsPerYear = pixelsPerYear; // 既存コード互換性

  // === 座標変換関数 ===
  const getXFromYear = useCallback((year) => {
    return (year - (-5000)) * pixelsPerYear + panX;
  }, [pixelsPerYear, panX]);

  const getYearFromX = useCallback((x) => {
    return (-5000) + (x - panX) / pixelsPerYear;
  }, [pixelsPerYear, panX]);

  // === マウスイベント処理 ===
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const yearAtMouse = getYearFromX(mouseX);
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.01, Math.min(20, scale * zoomFactor));
    
    const newPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * newScale;
    const newPanX = mouseX - (yearAtMouse - (-5000)) * newPixelsPerYear;

    setScale(newScale);
    setPanX(newPanX);
    
    console.log(`🔍 ズーム: ${newScale.toFixed(2)}, 中心年: ${yearAtMouse}`);
  }, [scale, getYearFromX]);

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
    console.log('🖱️ ドラッグ開始');
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastMouse.x;
    const deltaY = e.clientY - lastMouse.y;
    
    setPanX(prev => prev + deltaX);
    setPanY(prev => prev + deltaY);
    setLastMouse({ x: e.clientX, y: e.clientY });
  }, [isDragging, lastMouse]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      console.log('🖱️ ドラッグ終了');
    }
  }, [isDragging]);

  // === リセット機能 ===
  const resetToInitialPosition = useCallback(() => {
    const initialPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * TIMELINE_CONFIG.DEFAULT_SCALE;
    const initialPanX = window.innerWidth / 2 - (2080 - (-5000)) * initialPixelsPerYear;
    
    setScale(TIMELINE_CONFIG.DEFAULT_SCALE);
    setPanX(initialPanX);
    setPanY(0);
    setIsDragging(false);
    console.log('🎯 座標を初期位置にリセット');
  }, []);

  // === デバッグ情報 ===
  console.log("useUnifiedCoordinates state:", {
    scale: scale.toFixed(2),
    panX: Math.round(panX),
    panY: Math.round(panY),
    isDragging,
    pixelsPerYear: Math.round(pixelsPerYear)
  });

  // === 戻り値 ===
  return {
    // 状態
    scale,
    setScale,
    panX,
    setPanX,
    panY,
    setPanY,
    isDragging,
    pixelsPerYear,
    currentPixelsPerYear, // 既存コード互換性
    
    // 変換関数
    getXFromYear,
    getYearFromX,
    
    // イベントハンドラ
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    
    // 操作
    resetToInitialPosition
  };
};