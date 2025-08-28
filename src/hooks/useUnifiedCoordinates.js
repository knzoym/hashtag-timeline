// src/hooks/useUnifiedCoordinates.js - React Hook依存関係修正版
import { useState, useCallback, useRef, useEffect } from 'react';

export const useUnifiedCoordinates = (timelineRef) => {
  // 座標とズーム状態
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  
  // マウス操作の状態
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastPanRef = useRef({ x: 0, y: 0 });
  
  // 定数
  const PIXELS_PER_YEAR_BASE = 100;
  const MIN_SCALE = 0.1;
  const MAX_SCALE = 10;
  
  // 現在のピクセル/年計算
  const currentPixelsPerYear = PIXELS_PER_YEAR_BASE * scale;
  
  // 初期位置にリセット
  const resetToInitialPosition = useCallback(() => {
    setScale(1);
    setPanX(0);
    setPanY(0);
    setIsDragging(false);
  }, []);
  
  // ホイールによるズーム
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    const deltaY = e.deltaY;
    const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * zoomFactor));
    
    if (newScale !== scale) {
      // マウス位置を中心にズーム
      const rect = timelineRef?.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // ズーム中心を調整
        const scaleRatio = newScale / scale;
        const newPanX = mouseX - (mouseX - panX) * scaleRatio;
        const newPanY = mouseY - (mouseY - panY) * scaleRatio;
        
        setScale(newScale);
        setPanX(newPanX);
        setPanY(newPanY);
      } else {
        setScale(newScale);
      }
    }
  }, [scale, panX, panY, timelineRef]);
  
  // マウスダウン開始
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return; // 左クリックのみ
    
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
    
    setPanX(lastPanRef.current.x + deltaX);
    setPanY(lastPanRef.current.y + deltaY);
  }, [isDragging]);
  
  // マウスアップ終了
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // ダブルクリック（ズームリセット）
  const handleDoubleClick = useCallback((e) => {
    e.preventDefault();
    resetToInitialPosition();
  }, [resetToInitialPosition]);
  
  // グローバルマウスイベント設定
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e) => handleMouseMove(e);
      const handleGlobalMouseUp = () => handleMouseUp();
      
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
  // 座標変換ユーティリティ
  const screenToWorld = useCallback((screenX, screenY) => {
    return {
      x: (screenX - panX) / scale,
      y: (screenY - panY) / scale
    };
  }, [panX, panY, scale]);
  
  const worldToScreen = useCallback((worldX, worldY) => {
    return {
      x: worldX * scale + panX,
      y: worldY * scale + panY
    };
  }, [panX, panY, scale]);
  
  // 年からX座標への変換
  const yearToX = useCallback((year) => {
    return year * currentPixelsPerYear;
  }, [currentPixelsPerYear]);
  
  // X座標から年への変換
  const xToYear = useCallback((x) => {
    return x / currentPixelsPerYear;
  }, [currentPixelsPerYear]);
  
  return {
    // 状態
    scale,
    setScale,
    panX,
    setPanX,
    panY,
    setPanY,
    isDragging,
    currentPixelsPerYear,
    
    // イベントハンドラー
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDoubleClick,
    
    // ユーティリティ
    resetToInitialPosition,
    screenToWorld,
    worldToScreen,
    yearToX,
    xToYear,
    
    // 定数
    PIXELS_PER_YEAR_BASE,
    MIN_SCALE,
    MAX_SCALE
  };
};