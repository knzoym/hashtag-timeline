// hooks/useCoordinateTransform.js - 座標変換とパン機能の統一管理
import { useState, useCallback, useRef, useEffect } from 'react';
import { TIMELINE_CONFIG } from '../constants/timelineConfig';

export const useCoordinateTransform = (timelineRef) => {
  // 独立した座標状態
  const [scale, setScale] = useState(TIMELINE_CONFIG.DEFAULT_SCALE);
  const [panX, setPanX] = useState(() => {
    const initialPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * TIMELINE_CONFIG.DEFAULT_SCALE;
    return window.innerWidth - (2080 - (-5000)) * initialPixelsPerYear;
  });
  const [panY, setPanY] = useState(0);

  // ドラッグ状態
  const [isDragging, setIsDragging] = useState(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // 計算値
  const pixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * scale;

  // 年から座標への変換
  const getXFromYear = useCallback((year) => {
    return (year - (-5000)) * pixelsPerYear + panX;
  }, [pixelsPerYear, panX]);

  // 座標から年への変換
  const getYearFromX = useCallback((x) => {
    return (-5000) + (x - panX) / pixelsPerYear;
  }, [pixelsPerYear, panX]);

  // イベント位置を変換
  const transformEventPosition = useCallback((event) => {
    if (!event.startDate) return { x: 0, y: TIMELINE_CONFIG.MAIN_TIMELINE_Y };
    
    const x = getXFromYear(event.startDate.getFullYear());
    // useTimelineLogicからの相対位置を使用する場合
    const y = event.adjustedPosition?.y || TIMELINE_CONFIG.MAIN_TIMELINE_Y;
    
    return { x, y };
  }, [getXFromYear]);

  // 年表軸の位置を変換
  const transformTimelineAxis = useCallback((timeline, timelineIndex) => {
    if (!timeline.events || timeline.events.length === 0) return null;

    const baseY = TIMELINE_CONFIG.FIRST_ROW_Y + timelineIndex * TIMELINE_CONFIG.ROW_HEIGHT;
    const axisY = baseY + TIMELINE_CONFIG.ROW_HEIGHT / 2;

    const years = timeline.events.map(e => e.startDate.getFullYear());
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    const startX = getXFromYear(minYear);
    const endX = getXFromYear(maxYear);

    return {
      id: timeline.id,
      name: timeline.name,
      color: timeline.color,
      yPosition: axisY,
      startX,
      endX,
      minYear,
      maxYear,
      cardX: Math.max(20, startX - 100),
    };
  }, [getXFromYear]);

  // ホイールイベント処理
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
    
    // パン範囲の制限
    const timelineWidth = (5000 - (-5000)) * newPixelsPerYear;
    const viewportWidth = window.innerWidth;
    const minPanX = -(timelineWidth - viewportWidth);
    const maxPanX = 0;
    newPanX = Math.max(minPanX, Math.min(maxPanX, newPanX));
    
    setScale(newScale);
    setPanX(newPanX);
  }, [scale, panX, getYearFromX]);

  // マウスダウン処理
  const handleMouseDown = useCallback((e) => {
    // 特定の要素をクリックした場合はパンしない
    if (e.target.closest('.search-panel') || 
        e.target.closest('button') || 
        e.target.closest('[data-event-id]') ||
        e.target.closest('.timeline-card')) {
      return;
    }
    
    setIsDragging(true);
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }, []);

  // マウス移動処理
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastMouseRef.current.x;
    const deltaY = e.clientY - lastMouseRef.current.y;
    
    let newPanX = panX + deltaX;
    const newPanY = panY + deltaY;
    
    // X軸のパン範囲制限
    const timelineWidth = (5000 - (-5000)) * pixelsPerYear;
    const viewportWidth = window.innerWidth;
    const minPanX = -(timelineWidth - viewportWidth);
    const maxPanX = 0;
    newPanX = Math.max(minPanX, Math.min(maxPanX, newPanX));
    
    setPanX(newPanX);
    setPanY(newPanY);
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  }, [isDragging, panX, panY, pixelsPerYear]);

  // マウスアップ処理
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 初期位置リセット
  const resetToInitialPosition = useCallback(() => {
    const initialPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * TIMELINE_CONFIG.DEFAULT_SCALE;
    const initialPanX = window.innerWidth - (2080 - (-5000)) * initialPixelsPerYear;
    
    setScale(TIMELINE_CONFIG.DEFAULT_SCALE);
    setPanX(initialPanX);
    setPanY(0);
  }, []);

  // グローバルマウスイベント
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDragging) {
        handleMouseMove(e);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return {
    // 座標状態
    scale,
    panX,
    panY,
    pixelsPerYear,
    isDragging,

    // 座標変換関数
    getXFromYear,
    getYearFromX,
    transformEventPosition,
    transformTimelineAxis,

    // イベントハンドラー
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetToInitialPosition,

    // State setters（外部から直接操作したい場合）
    setScale,
    setPanX,
    setPanY,
  };
};