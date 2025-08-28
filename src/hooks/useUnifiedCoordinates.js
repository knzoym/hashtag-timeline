// src/hooks/useUnifiedCoordinates.js - 座標変換修正版
import { useState, useCallback, useRef, useEffect } from 'react';
import { TIMELINE_CONFIG } from '../constants/timelineConfig';

export const useUnifiedCoordinates = (timelineRef) => {
  // 座標とズーム状態
  const [scale, setScale] = useState(TIMELINE_CONFIG.DEFAULT_SCALE);
  const [panX, setPanX] = useState(() => {
    const initialPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * TIMELINE_CONFIG.DEFAULT_SCALE;
    return window.innerWidth / 2 - (2080 - (-5000)) * initialPixelsPerYear;
  });
  const [panY, setPanY] = useState(0);
  
  // マウス操作の状態
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastPanRef = useRef({ x: 0, y: 0 });
  
  // 現在のピクセル/年計算（古いVisualTab互換）
  const pixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * scale;
  
  // 年からX座標への変換（古いVisualTab互換）
  const getXFromYear = useCallback((year) => {
    return (year - (-5000)) * pixelsPerYear + panX;
  }, [pixelsPerYear, panX]);
  
  // X座標から年への変換（古いVisualTab互換）
  const getYearFromX = useCallback((x) => {
    return (-5000) + (x - panX) / pixelsPerYear;
  }, [pixelsPerYear, panX]);
  
  // 初期位置にリセット
  const resetToInitialPosition = useCallback(() => {
    const initialPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * TIMELINE_CONFIG.DEFAULT_SCALE;
    const initialPanX = window.innerWidth / 2 - (2080 - (-5000)) * initialPixelsPerYear;
    
    setScale(TIMELINE_CONFIG.DEFAULT_SCALE);
    setPanX(initialPanX);
    setPanY(0);
    setIsDragging(false);
  }, []);
  
  // ホイールによるズーム（古いVisualTab互換）
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const yearAtMouse = getYearFromX(mouseX);
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.05, Math.min(100, scale * zoomFactor));
    const newPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * newScale;
    
    let newPanX = mouseX - (yearAtMouse - (-5000)) * newPixelsPerYear;
    
    const timelineWidth = (5000 - (-5000)) * newPixelsPerYear;
    const viewportWidth = window.innerWidth;
    const minPanX = -(timelineWidth - viewportWidth);
    const maxPanX = 0;
    newPanX = Math.max(minPanX, Math.min(maxPanX, newPanX));
    
    setScale(newScale);
    setPanX(newPanX);
  }, [scale, getYearFromX, timelineRef]);
  
  // マウスダウン開始
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.no-pan')) return;
    
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    lastPanRef.current = { x: panX, y: panY };
    
    e.preventDefault();
  }, [panX, panY]);
  
  // マウス移動（ドラッグ）
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    
    let newPanX = lastPanRef.current.x + deltaX;
    const newPanY = lastPanRef.current.y + deltaY;
    
    const timelineWidth = (5000 - (-5000)) * pixelsPerYear;
    const viewportWidth = window.innerWidth;
    const minPanX = -(timelineWidth - viewportWidth);
    const maxPanX = 0;
    newPanX = Math.max(minPanX, Math.min(maxPanX, newPanX));
    
    setPanX(newPanX);
    setPanY(newPanY);
  }, [isDragging, lastPanRef, pixelsPerYear]);
  
  // マウスアップ終了
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // グローバルマウスイベント設定
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      handleMouseMove(e);
    };
    
    const handleGlobalMouseUp = (e) => {
      handleMouseUp(e);
    };
    
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);
  
  return {
    // 状態（古いVisualTab互換）
    scale,
    panX,
    panY,
    pixelsPerYear,
    isDragging,
    
    // 座標変換（古いVisualTab互換）
    getXFromYear,
    getYearFromX,
    
    // イベントハンドラー
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetToInitialPosition,
    
    // 設定用関数
    setScale,
    setPanX,
    setPanY
  };
};