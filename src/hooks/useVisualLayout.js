// src/hooks/useVisualLayout.js - VisualTab全体レイアウト管理フック
import { useMemo, useCallback } from 'react';
import { TIMELINE_CONFIG } from '../constants/timelineConfig';
import { useTimelineRowLayout } from '../components/layout/TimelineRowSystem';

/**
 * VisualTab全体のレイアウトを管理するフック
 * - タイムライン/ネットワークモードの切り替え
 * - 年マーカー生成
 * - 年表軸データ生成
 * - ネットワーク接続線データ生成
 * - イベントレイアウトの統合管理
 */
export const useVisualLayout = (
  events,
  timelines,
  coordinates,
  viewMode = "timeline"
) => {
  const isNetworkMode = viewMode === "network";

  // テキスト幅計算（簡易版）
  const calculateTextWidth = useCallback((text) => {
    return (text?.length || 0) * 8;
  }, []);

  // 縦方向配置システム（TimelineRowSystemを活用）
  const { layoutEvents: rowLayoutEvents, timelineRows } = useTimelineRowLayout(
    events,
    timelines,
    coordinates,
    calculateTextWidth
  );

  // 年マーカー生成
  const yearMarkers = useMemo(() => {
    if (!coordinates?.getXFromYear || !coordinates?.getYearFromX || !coordinates?.scale) {
      return [];
    }

    const markers = [];
    const leftYear = coordinates.getYearFromX(-100);
    const rightYear = coordinates.getYearFromX(window.innerWidth + 100);
    const startYear = Math.floor(leftYear / 100) * 100;
    const endYear = Math.ceil(rightYear / 100) * 100;

    for (let year = startYear; year <= endYear; year += 100) {
      const x = coordinates.getXFromYear(year);
      if (x >= -50 && x <= window.innerWidth + 50) {
        const fontSize = Math.max(
          8,
          Math.min(12, 10 * Math.max(0.01, coordinates.scale) * 2)
        );

        markers.push({
          id: year,
          x,
          year,
          fontSize
        });
      }
    }
    return markers;
  }, [coordinates]);

  // 年表軸データ生成（タイムラインモード用）
  const timelineAxes = useMemo(() => {
    if (!timelines || !coordinates?.getXFromYear) return [];
    
    return timelines.map((timeline, index) => {
      const timelineEvents = events.filter(event => 
        event.timelineInfos?.some(info => 
          info.timelineId === timeline.id && !info.isTemporary
        )
      );
      
      if (timelineEvents.length === 0) return null;
      
      const years = timelineEvents
        .filter(e => e.startDate)
        .map(e => e.startDate.getFullYear());
        
      if (years.length === 0) return null;
      
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      
      const startX = coordinates.getXFromYear(minYear);
      const endX = coordinates.getXFromYear(maxYear);
      const baseY = TIMELINE_CONFIG.FIRST_ROW_Y + index * 120; // ROW_SYSTEM.ROW_HEIGHTと同等
      
      return {
        id: timeline.id,
        name: timeline.name,
        color: timeline.color || '#6b7280',
        yPosition: baseY + 60, // 行の中央
        startX,
        endX,
        minYear,
        maxYear,
        cardX: Math.max(20, startX - 120),
        eventCount: timelineEvents.length
      };
    }).filter(Boolean);
  }, [timelines, events, coordinates]);

  // ネットワーク接続線データ生成
  const networkConnections = useMemo(() => {
    if (!isNetworkMode || !events || !timelines) return [];
    
    const connections = [];
    
    // 複数の年表に属するイベントの接続線を生成
    events.forEach(event => {
      if (!event.timelineInfos || event.timelineInfos.length <= 1) return;
      
      const eventTimelineInfos = event.timelineInfos.filter(info => !info.isTemporary);
      if (eventTimelineInfos.length <= 1) return;
      
      const eventX = coordinates?.getXFromYear?.(event.startDate?.getFullYear?.()) || 0;
      
      // このイベントから各年表への接続線
      eventTimelineInfos.forEach(timelineInfo => {
        const timeline = timelines.find(t => t.id === timelineInfo.timelineId);
        if (!timeline) return;
        
        const timelineIndex = timelines.findIndex(t => t.id === timeline.id);
        const timelineY = TIMELINE_CONFIG.FIRST_ROW_Y + timelineIndex * 120 + 60;
        
        connections.push({
          id: `${event.id}-${timeline.id}`,
          eventId: event.id,
          timelineId: timeline.id,
          startX: eventX,
          startY: TIMELINE_CONFIG.MAIN_TIMELINE_Y,
          endX: eventX,
          endY: timelineY,
          color: timeline.color || '#6b7280'
        });
      });
    });
    
    return connections;
  }, [isNetworkMode, events, timelines, coordinates]);

  // レイアウト済みイベントデータ（モード別調整）
  const layoutEvents = useMemo(() => {
    if (isNetworkMode) {
      // ネットワークモード：メインタイムライン上に集約
      return events.map(event => {
        const eventX = coordinates?.getXFromYear?.(event.startDate?.getFullYear?.()) || 0;
        const textWidth = calculateTextWidth(event.title || "");
        const eventWidth = Math.max(60, textWidth + 20);
        
        return {
          ...event,
          adjustedPosition: { 
            x: eventX, 
            y: TIMELINE_CONFIG.MAIN_TIMELINE_Y 
          },
          calculatedWidth: eventWidth,
          viewMode: 'network'
        };
      });
    } else {
      // タイムラインモード：行・段システムの結果を使用
      return rowLayoutEvents;
    }
  }, [isNetworkMode, events, rowLayoutEvents, coordinates, calculateTextWidth]);

  // メインタイムライン線の情報
  const mainTimelineLine = {
    y: TIMELINE_CONFIG.MAIN_TIMELINE_Y,
    color: '#374151',
    width: '3px'
  };

  // レイアウト情報の統合
  const layoutInfo = {
    viewMode,
    isNetworkMode,
    containerStyles: {
      width: "100%",
      height: "100%",
      position: "relative",
      overflow: "hidden",
      backgroundColor: "#f8fafc"
    },
    panelStyles: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 20
    }
  };

  return {
    // レイアウトデータ
    layoutEvents,
    timelineAxes,
    networkConnections,
    yearMarkers,
    timelineRows, // 詳細な行データ（TimelineRowSystemから）
    
    // UI要素
    mainTimelineLine,
    
    // レイアウト情報
    layoutInfo,
    
    // ユーティリティ
    calculateTextWidth
  };
};