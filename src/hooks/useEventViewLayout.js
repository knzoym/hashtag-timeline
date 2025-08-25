// src/hooks/useEventViewLayout.js
import { useMemo } from 'react';
import { TIMELINE_CONFIG } from '../constants/timelineConfig';

export const useEventViewLayout = (events, timelines, currentPixelsPerYear, panX, panY) => {
  return useMemo(() => {
    const timelineEventIds = new Set();
    const temporaryEventIds = new Set();
    const eventTimelineMap = new Map();

    // 年表イベントの収集（既存ロジックと同じ）
    timelines.forEach(timeline => {
      if (!timeline.isVisible) return;

      // 元々の検索結果イベント
      timeline.events.forEach(event => {
        timelineEventIds.add(event.id);
        eventTimelineMap.set(event.id, {
          timelineId: timeline.id,
          timelineName: timeline.name,
          timelineColor: timeline.color,
          isTemporary: false,
        });
      });

      // 仮登録されたイベント
      const temporaryEvents = timeline.temporaryEvents || [];
      temporaryEvents.forEach(event => {
        temporaryEventIds.add(event.id);
        eventTimelineMap.set(event.id, {
          timelineId: timeline.id,
          timelineName: timeline.name,
          timelineColor: timeline.color,
          isTemporary: true,
        });
      });
    });

    // イベント配置（既存の配置ロジックを使用）
    const eventPositions = [];
    const occupiedPositions = new Map();

    // すべてのイベントを一元配置
    const allEventsForLayout = [
      ...events.filter(event => !timelineEventIds.has(event.id) && !temporaryEventIds.has(event.id)),
      ...Array.from(eventTimelineMap.keys()).map(id => {
        const event = events.find(e => e.id === id);
        const timelineInfo = eventTimelineMap.get(id);
        return { ...event, timelineInfo };
      })
    ];

    allEventsForLayout.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    allEventsForLayout.forEach(event => {
      const eventX = (event.startDate.getFullYear() - (-5000)) * currentPixelsPerYear + panX;
      let eventY = TIMELINE_CONFIG.MAIN_TIMELINE_Y;
      let level = 0;

      // 縦方向の衝突回避（既存ロジック）
      while (level < 30) {
        const currentY = TIMELINE_CONFIG.MAIN_TIMELINE_Y + level * 50;
        const occupied = occupiedPositions.get(currentY) || [];

        const hasCollision = occupied.some(range =>
          Math.abs(eventX - range.x) < (TIMELINE_CONFIG.EVENT_WIDTH + range.width) / 2 + TIMELINE_CONFIG.MIN_EVENT_GAP
        );

        if (!hasCollision) {
          eventY = currentY;
          if (!occupiedPositions.has(currentY)) {
            occupiedPositions.set(currentY, []);
          }
          occupiedPositions.get(currentY).push({ 
            x: eventX, 
            width: TIMELINE_CONFIG.EVENT_WIDTH 
          });
          break;
        }
        level++;
      }

      eventPositions.push({
        ...event,
        adjustedPosition: { x: eventX, y: eventY },
        level,
      });
    });

    // 年表接続情報の生成
    const timelineConnections = [];
    timelines.forEach((timeline, index) => {
      if (!timeline.isVisible) return;

      const allTimelineEvents = [
        ...timeline.events,
        ...(timeline.temporaryEvents || [])
      ].filter(event => 
        !(timeline.removedEvents || []).some(removed => removed.id === event.id)
      ).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

      if (allTimelineEvents.length === 0) return;

      const connectionPoints = allTimelineEvents.map(event => {
        const eventPos = eventPositions.find(pos => pos.id === event.id);
        return eventPos ? {
          x: eventPos.adjustedPosition.x,
          y: eventPos.adjustedPosition.y + TIMELINE_CONFIG.EVENT_HEIGHT / 2,
          event: eventPos,
        } : null;
      }).filter(Boolean);

      if (connectionPoints.length > 0) {
        timelineConnections.push({
          id: timeline.id,
          name: timeline.name,
          color: timeline.color,
          points: connectionPoints,
        });
      }
    });

    return {
      eventPositions,
      timelineConnections,
      eventTimelineMap,
    };
  }, [events, timelines, currentPixelsPerYear, panX, panY]);
};