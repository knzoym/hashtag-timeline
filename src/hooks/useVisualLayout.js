// src/hooks/useVisualLayout.js - レイアウト管理修正版
import { useMemo, useCallback } from 'react';
import { TIMELINE_CONFIG } from '../constants/timelineConfig';

export const useVisualLayout = (
  events,
  timelines,
  coordinates,
  viewMode = "timeline"
) => {
  const isNetworkMode = viewMode === "network";

  // テキスト幅計算
  const calculateTextWidth = useCallback((text, fontSize = 11) => {
    try {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      context.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      return context.measureText(text || '').width;
    } catch (error) {
      return (text?.length || 0) * 8;
    }
  }, []);

  // 年マーカー生成（古いVisualTab互換）
  const yearMarkers = useMemo(() => {
    if (!coordinates?.getXFromYear || !coordinates?.getYearFromX || !coordinates?.scale) {
      return [];
    }

    const markers = [];
    const startYear = Math.floor(coordinates.getYearFromX(0) / 100) * 100;
    const endYear = Math.ceil(coordinates.getYearFromX(window.innerWidth) / 100) * 100;
    
    for (let year = startYear; year <= endYear; year += 100) {
      const x = coordinates.getXFromYear(year);
      if (x >= -50 && x <= window.innerWidth + 50) {
        const fontSize = Math.max(8, Math.min(12, 10 * Math.max(0.01, coordinates.scale) * 2));
        
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

  // 年表軸データ生成（古いVisualTab互換）
  const timelineAxes = useMemo(() => {
    if (!timelines || !coordinates?.getXFromYear) return [];
    
    console.log('timelineAxes計算開始:', {
      timelinesCount: timelines.length,
      visibleTimelines: timelines.filter(t => t.isVisible).length
    });
    
    const axes = timelines.filter(timeline => timeline.isVisible)
      .map((timeline, index) => {
        console.log(`年表「${timeline.name}」処理開始`);
        
        // timelineInfosから年表に属するイベントを抽出
        const timelineEvents = events.filter(event => {
          if (!event.timelineInfos || !Array.isArray(event.timelineInfos)) {
            return false;
          }
          
          // この年表に属し、仮削除されていないイベントを対象
          return event.timelineInfos.some(info => 
            info.timelineId === timeline.id && !info.isTemporary
          );
        });
        
        console.log(`年表「${timeline.name}」のイベント数:`, timelineEvents.length);
        
        if (timelineEvents.length === 0) {
          console.log(`年表「${timeline.name}」: イベントがないためスキップ`);
          return null;
        }

        const baseY = TIMELINE_CONFIG.FIRST_ROW_Y + index * TIMELINE_CONFIG.ROW_HEIGHT;
        const axisY = baseY + TIMELINE_CONFIG.ROW_HEIGHT / 2;

        const years = timelineEvents
          .filter(e => e.startDate)
          .map(e => e.startDate.getFullYear());
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);

        const startX = coordinates.getXFromYear(minYear);
        const endX = coordinates.getXFromYear(maxYear);

        const axisData = {
          id: timeline.id,
          name: timeline.name,
          color: timeline.color,
          yPosition: axisY,
          startX,
          endX,
          minYear,
          maxYear,
          cardX: Math.max(20, startX - 120),
          eventCount: timelineEvents.length
        };
        
        console.log(`年表「${timeline.name}」軸データ:`, axisData);
        return axisData;
      })
      .filter(Boolean);
    
    console.log('timelineAxes計算完了:', axes.length, '本の軸を作成');
    return axes;
  }, [timelines, events, coordinates]);

  // イベントレイアウト処理（古いVisualTab互換）
  const layoutEvents = useMemo(() => {
    if (!events || events.length === 0) return [];

    const layoutResults = [];
    const occupiedPositions = new Map();

    const sortedEvents = [...events].sort((a, b) => {
      const aYear = a.startDate ? a.startDate.getFullYear() : 2000;
      const bYear = b.startDate ? b.startDate.getFullYear() : 2000;
      return aYear - bYear;
    });

    sortedEvents.forEach((event) => {
      const eventX = event.startDate ? coordinates.getXFromYear(event.startDate.getFullYear()) : 100;
      const textWidth = calculateTextWidth ? calculateTextWidth(event.title || '') : 60;
      const eventWidth = Math.max(60, textWidth + 20);
      
      let eventY = TIMELINE_CONFIG.MAIN_TIMELINE_Y;
      let level = 0;

      while (level < 20) {
        const currentY = TIMELINE_CONFIG.MAIN_TIMELINE_Y + level * (TIMELINE_CONFIG.EVENT_HEIGHT + 15);
        const occupiedAtThisY = occupiedPositions.get(currentY) || [];

        const hasCollision = occupiedAtThisY.some((occupiedEvent) => {
          const distance = Math.abs(eventX - occupiedEvent.x);
          const minDistance = (eventWidth + occupiedEvent.width) / 2 + 10;
          return distance < minDistance;
        });

        if (!hasCollision) {
          eventY = currentY;
          if (!occupiedPositions.has(currentY)) {
            occupiedPositions.set(currentY, []);
          }
          occupiedPositions.get(currentY).push({
            x: eventX,
            width: eventWidth,
            eventId: event.id
          });
          break;
        }
        level++;
      }

      layoutResults.push({
        ...event,
        adjustedPosition: { x: eventX, y: eventY },
        calculatedWidth: eventWidth,
        level
      });
    });

    return layoutResults;
  }, [events, coordinates, calculateTextWidth]);

  // ネットワーク接続線データ生成
  const networkConnections = useMemo(() => {
    if (!isNetworkMode || !timelines || !layoutEvents) return [];
    
    const connections = [];
    timelines.forEach(timeline => {
      if (!timeline.isVisible) return;

      const connectionPoints = [];
      layoutEvents.forEach(eventPos => {
        // timelineInfosから年表所属を判定
        const belongsToThisTimeline = eventPos.timelineInfos?.some(info =>
          info.timelineId === timeline.id && !info.isTemporary
        );
        
        if (belongsToThisTimeline) {
          connectionPoints.push({
            x: eventPos.adjustedPosition.x,
            y: eventPos.adjustedPosition.y + TIMELINE_CONFIG.EVENT_HEIGHT / 2
          });
        }
      });

      if (connectionPoints.length > 1) {
        connections.push({
          id: timeline.id,
          name: timeline.name,
          color: timeline.color,
          points: connectionPoints
        });
      }
    });

    return connections;
  }, [isNetworkMode, timelines, layoutEvents]);

  // メインタイムライン線データ
  const mainTimelineLine = useMemo(() => ({
    y: TIMELINE_CONFIG.MAIN_TIMELINE_Y,
    width: "3px",
    color: "#374151"
  }), []);

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
      visibleTimelines: timelines?.filter(t => t.isVisible).length || 0
    }
  };
};