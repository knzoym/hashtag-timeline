// src/hooks/useVisualLayout.js - 無限ループ修正版
import { useMemo, useCallback, useRef } from 'react';
import { TIMELINE_CONFIG } from '../constants/timelineConfig';

export const useVisualLayout = (
  events,
  timelines,
  coordinates,
  viewMode = "timeline"
) => {
  const isNetworkMode = viewMode === "network";
  
  // 安定化のためのref
  const stableEventsRef = useRef(events);
  const stableTimelinesRef = useRef(timelines);
  const stableCoordinatesRef = useRef(coordinates);
  
  // データが実際に変更された時のみ更新
  if (JSON.stringify(events) !== JSON.stringify(stableEventsRef.current)) {
    stableEventsRef.current = events;
  }
  if (JSON.stringify(timelines) !== JSON.stringify(stableTimelinesRef.current)) {
    stableTimelinesRef.current = timelines;
  }

  // テキスト幅計算（メモ化）
  const calculateTextWidth = useCallback((text) => {
    if (!text) return 60;
    return Math.min(Math.max(60, text.length * 8), 200);
  }, []);

  // 年マーカー生成（座標依存を最小限に）
  const yearMarkers = useMemo(() => {
    if (!coordinates?.getXFromYear || !coordinates?.scale) {
      return [];
    }

    const markers = [];
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    
    // 固定範囲で生成（座標計算の循環を防ぐ）
    for (let year = -5000; year <= 5000; year += 500) {
      const x = coordinates.getXFromYear(year);
      if (x >= -200 && x <= viewportWidth + 200) {
        markers.push({
          id: year,
          x,
          year,
          fontSize: Math.max(8, Math.min(12, 10))
        });
      }
      
      // マーカー数制限
      if (markers.length > 50) break;
    }
    
    return markers;
  }, [coordinates?.scale]); // 最小限の依存関係

  // 年表軸データ生成（計算を簡素化）
  const timelineAxes = useMemo(() => {
    if (!timelines || !coordinates?.getXFromYear) return [];
    
    const axes = [];
    const visibleTimelines = timelines.filter(t => t.isVisible !== false);
    
    visibleTimelines.forEach((timeline, index) => {
      // イベント数チェックを簡略化
      const timelineEvents = events.filter(event => 
        event.timelineInfos?.some(info => 
          info.timelineId === timeline.id && !info.isTemporary
        )
      );
      
      if (timelineEvents.length === 0) return;
      
      // 年範囲計算を簡素化
      const years = timelineEvents
        .map(e => e.startDate?.getFullYear?.() || 2000)
        .filter(y => y && !isNaN(y));
        
      if (years.length === 0) return;
      
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      
      const startX = coordinates.getXFromYear(minYear);
      const endX = coordinates.getXFromYear(maxYear);
      const baseY = TIMELINE_CONFIG.FIRST_ROW_Y + index * 120;
      
      axes.push({
        id: timeline.id,
        name: timeline.name,
        color: timeline.color || '#6b7280',
        yPosition: baseY + 60,
        startX,
        endX,
        minYear,
        maxYear,
        cardX: Math.max(20, startX - 120),
        eventCount: timelineEvents.length
      });
    });
    
    return axes;
  }, [timelines, events]); // coordinatesを依存関係から除外

  // イベントレイアウト処理（大幅簡素化）
  const layoutEvents = useMemo(() => {
    if (!events || events.length === 0) return [];

    const results = [];
    const occupiedY = new Map(); // Y座標の占有管理
    
    events.forEach((event, index) => {
      const eventX = event.startDate ? 
        coordinates?.getXFromYear?.(event.startDate.getFullYear()) || 0 : 0;
      
      const textWidth = calculateTextWidth(event.title);
      const eventWidth = Math.max(60, textWidth + 20);
      
      // Y位置を簡単な方法で決定（重なり回避を簡略化）
      let eventY = TIMELINE_CONFIG.MAIN_TIMELINE_Y;
      let level = 0;
      
      // 最大3レベルまでで制限
      while (level < 3) {
        const testY = TIMELINE_CONFIG.MAIN_TIMELINE_Y + level * 40;
        const occupied = occupiedY.get(testY) || [];
        
        const hasOverlap = occupied.some(occ => 
          Math.abs(eventX - occ.x) < (eventWidth + occ.width) / 2 + 10
        );
        
        if (!hasOverlap) {
          eventY = testY;
          if (!occupiedY.has(testY)) occupiedY.set(testY, []);
          occupiedY.get(testY).push({ x: eventX, width: eventWidth });
          break;
        }
        level++;
      }

      results.push({
        ...event,
        adjustedPosition: { x: eventX, y: eventY },
        calculatedWidth: eventWidth,
        level
      });
    });

    return results;
  }, [events, calculateTextWidth]); // coordinatesを依存関係から除外

  // ネットワーク接続線データ生成（簡素化）
  const networkConnections = useMemo(() => {
    if (!isNetworkMode || !timelines || !layoutEvents) return [];
    
    const connections = [];
    
    timelines.forEach(timeline => {
      if (!timeline.isVisible) return;

      const connectionPoints = layoutEvents
        .filter(eventPos => 
          eventPos.timelineInfos?.some(info =>
            info.timelineId === timeline.id && !info.isTemporary
          )
        )
        .map(eventPos => ({
          x: eventPos.adjustedPosition.x,
          y: eventPos.adjustedPosition.y + TIMELINE_CONFIG.EVENT_HEIGHT / 2
        }));

      if (connectionPoints.length > 1) {
        connections.push({
          id: timeline.id,
          name: timeline.name,
          color: timeline.color,
          points: connectionPoints.slice(0, 20) // 接続数制限
        });
      }
    });

    return connections;
  }, [isNetworkMode, timelines, layoutEvents]);

  // メインタイムライン線データ（固定値）
  const mainTimelineLine = useMemo(() => ({
    y: TIMELINE_CONFIG.MAIN_TIMELINE_Y || 200,
    width: "3px",
    color: "#374151"
  }), []);

  // デバッグ情報（循環参照チェック）
  console.log('useVisualLayout render:', {
    eventsCount: events?.length || 0,
    timelinesCount: timelines?.length || 0,
    layoutEventsCount: layoutEvents?.length || 0,
    axesCount: timelineAxes?.length || 0,
    markersCount: yearMarkers?.length || 0
  });

  return {
    layoutEvents,
    timelineAxes,
    networkConnections,
    yearMarkers,
    mainTimelineLine,
    layoutInfo: {
      isNetworkMode,
      eventsCount: events?.length || 0,
      timelinesCount: timelines?.length || 0,
      visibleTimelines: timelines?.filter(t => t.isVisible !== false).length || 0
    }
  };
};