// src/hooks/useCoordinate.js - 統合座標システム
import { useState, useCallback, useRef, useEffect } from 'react';
import { TIMELINE_CONFIG } from '../constants/timelineConfig';

/**
 * 統合された座標システム
 * 昔のHashtagTimelineの安定性と現在の機能を統合
 * useUnifiedCoordinatesとuseSimpleCoordinatesの役割を統合
 */
export const useCoordinate = (timelineRef) => {
  // 基本座標状態（昔のHashtagTimeline方式）
  const [scale, setScale] = useState(TIMELINE_CONFIG.DEFAULT_SCALE || 2.5);
  const [panX, setPanX] = useState(() => {
    // 2025年を中央に表示する初期位置（昔の計算方式）
    const pixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * (TIMELINE_CONFIG.DEFAULT_SCALE || 2.5);
    return window.innerWidth / 2 - (2025 - (-5000)) * pixelsPerYear;
  });
  const [panY, setPanY] = useState(0);
  
  // ドラッグ状態管理
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastPanRef = useRef({ x: 0, y: 0 });
  
  // 派生値の計算（昔の方式）
  const currentPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * scale;
  const pixelsPerYear = currentPixelsPerYear; // 互換性のため
  
  // 年からX座標への変換（昔の方式そのまま）
  const getXFromYear = useCallback((year) => {
    return (year - (-5000)) * currentPixelsPerYear + panX;
  }, [currentPixelsPerYear, panX]);
  
  // X座標から年への変換（昔の方式そのまま）
  const getYearFromX = useCallback((x) => {
    return (-5000) + (x - panX) / currentPixelsPerYear;
  }, [currentPixelsPerYear, panX]);
  
  // 初期位置リセット（昔の方式）
  const resetToInitialPosition = useCallback(() => {
    const initialScale = TIMELINE_CONFIG.DEFAULT_SCALE || 2.5;
    const initialPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * initialScale;
    const initialPanX = window.innerWidth / 2 - (2025 - (-5000)) * initialPixelsPerYear;
    
    setScale(initialScale);
    setPanX(initialPanX);
    setPanY(0);
    setIsDragging(false);
    
    console.log('座標リセット:', { scale: initialScale, panX: initialPanX, panY: 0 });
  }, []);
  
  // ホイールズーム処理（昔のHashtagTimeline方式を復元）
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const yearAtMouse = getYearFromX(mouseX);
    
    // ズーム処理（昔のスケール感覚を保持）
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(50, scale * zoomFactor));
    const newPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * newScale;
    
    // マウス位置を中心にズーム（昔の計算式）
    const newPanX = mouseX - (yearAtMouse - (-5000)) * newPixelsPerYear;
    
    // パンの制限（スムーズなナビゲーションのため）
    const timelineWidth = (5000 - (-5000)) * newPixelsPerYear;
    const viewportWidth = window.innerWidth;
    const minPanX = -(timelineWidth - viewportWidth * 0.8); // 少し余裕を持たせる
    const maxPanX = viewportWidth * 0.2; // 左側にも余裕
    const constrainedPanX = Math.max(minPanX, Math.min(maxPanX, newPanX));
    
    setScale(newScale);
    setPanX(constrainedPanX);
    
    // デバッグ用（本番では削除可能）
    if (Math.abs(scale - newScale) > 0.1) {
      console.log('ズーム:', { scale: newScale.toFixed(2), centerYear: Math.round(yearAtMouse) });
    }
  }, [scale, getYearFromX, timelineRef]);
  
  // マウスドラッグ開始（昔の方式）
  const handleMouseDown = useCallback((e) => {
    // no-panクラスの要素は除外（重要）
    if (e.target.closest('.no-pan')) return;
    
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    lastPanRef.current = { x: panX, y: panY };
    
    // ドラッグ開始時のカーソル変更を防ぐ
    e.preventDefault();
  }, [panX, panY]);
  
  // マウス移動処理（ドラッグ中）
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    
    // 水平パン（制限付き）
    const newPanX = lastPanRef.current.x + deltaX;
    const timelineWidth = (5000 - (-5000)) * currentPixelsPerYear;
    const viewportWidth = window.innerWidth;
    const minPanX = -(timelineWidth - viewportWidth * 0.8);
    const maxPanX = viewportWidth * 0.2;
    const constrainedPanX = Math.max(minPanX, Math.min(maxPanX, newPanX));
    
    // 垂直パン（制限は緩く）
    const newPanY = lastPanRef.current.y + deltaY;
    const maxVerticalPan = 500; // 上下500pxまで
    const constrainedPanY = Math.max(-maxVerticalPan, Math.min(maxVerticalPan, newPanY));
    
    setPanX(constrainedPanX);
    setPanY(constrainedPanY);
  }, [isDragging, currentPixelsPerYear]);
  
  // マウスアップ（ドラッグ終了）
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // グローバルマウスイベント設定（昔のHashtagTimelineと同じ）
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      handleMouseMove(e);
    };
    
    const handleGlobalMouseUp = (e) => {
      handleMouseUp(e);
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      // ドラッグ中はテキスト選択を無効化
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = '';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
  // レスポンシブ対応（ウィンドウサイズ変更時の座標調整）
  useEffect(() => {
    const handleResize = () => {
      // 現在の中心年を保持しつつリサイズに対応
      const centerYear = getYearFromX(window.innerWidth / 2);
      const newPanX = window.innerWidth / 2 - (centerYear - (-5000)) * currentPixelsPerYear;
      
      // 制限内で調整
      const timelineWidth = (5000 - (-5000)) * currentPixelsPerYear;
      const viewportWidth = window.innerWidth;
      const minPanX = -(timelineWidth - viewportWidth * 0.8);
      const maxPanX = viewportWidth * 0.2;
      const constrainedPanX = Math.max(minPanX, Math.min(maxPanX, newPanX));
      
      setPanX(constrainedPanX);
    };
    
    let resizeTimer;
    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 100); // 100msのデバウンス
    };
    
    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimer);
    };
  }, [getYearFromX, currentPixelsPerYear]);
  
  // キーボードショートカット（オプション）
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + 0 で初期位置リセット
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        resetToInitialPosition();
      }
      
      // 矢印キーでパン（オプション）
      if (e.key.startsWith('Arrow') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const panAmount = 100;
        
        switch (e.key) {
          case 'ArrowLeft':
            setPanX(prev => prev + panAmount);
            break;
          case 'ArrowRight':
            setPanX(prev => prev - panAmount);
            break;
          case 'ArrowUp':
            setPanY(prev => prev + panAmount);
            break;
          case 'ArrowDown':
            setPanY(prev => prev - panAmount);
            break;
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [resetToInitialPosition]);
  
  // デバッグ用（開発時のみ有効、本番では削除可能）
  const debugInfo = useCallback(() => {
    const centerYear = getYearFromX(window.innerWidth / 2);
    return {
      scale: scale.toFixed(2),
      panX: Math.round(panX),
      panY: Math.round(panY),
      centerYear: Math.round(centerYear),
      pixelsPerYear: Math.round(currentPixelsPerYear),
      isDragging
    };
  }, [scale, panX, panY, getYearFromX, currentPixelsPerYear, isDragging]);
  
  return {
    // 基本状態（昔のHashtagTimelineと互換性を保持）
    scale,
    panX,
    panY,
    currentPixelsPerYear, // 昔の名前
    pixelsPerYear, // 新しい名前との互換性
    isDragging,
    
    // 座標変換関数（昔のHashtagTimelineと同じ名前）
    getXFromYear,
    getYearFromX,
    
    // イベントハンドラー（昔のHashtagTimelineと同じ名前）
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetToInitialPosition,
    
    // 設定関数（直接制御が必要な場合）
    setScale,
    setPanX,
    setPanY,
    
    // デバッグ用（開発時のみ）
    debugInfo
  };
};

// デフォルトエクスポート（単一インポート対応）
export default useCoordinate;