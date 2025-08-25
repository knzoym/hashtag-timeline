// src/hooks/useEnhancedEventLayout.js
import { useMemo } from 'react';
import { TIMELINE_CONFIG } from '../constants/timelineConfig';

export const useEnhancedEventLayout = (events, timelines, currentPixelsPerYear, panX, panY) => {
  return useMemo(() => {
    const timelineEventIds = new Set();
    const eventTimelineMap = new Map();

    // 年表イベントのマッピング
    timelines.forEach(timeline => {
      if (!timeline.isVisible) return;

      [...(timeline.events || []), ...(timeline.temporaryEvents || [])]
        .filter(event => !(timeline.removedEvents || []).some(removed => removed.id === event.id))
        .forEach(event => {
          timelineEventIds.add(event.id);
          eventTimelineMap.set(event.id, {
            timelineId: timeline.id,
            timelineName: timeline.name,
            timelineColor: timeline.color,
            isTemporary: (timeline.temporaryEvents || []).includes(event),
          });
        });
    });

    // 年表別にイベントをグループ化
    const eventsByTimeline = new Map();
    timelines.forEach(timeline => {
      if (!timeline.isVisible) return;
      
      const timelineEvents = events.filter(event => {
        const info = eventTimelineMap.get(event.id);
        return info && info.timelineId === timeline.id;
      }).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      
      if (timelineEvents.length > 0) {
        eventsByTimeline.set(timeline.id, timelineEvents);
      }
    });

    // メインタイムラインのイベント
    const mainEvents = events.filter(event => !timelineEventIds.has(event.id))
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    // 改善された配置アルゴリズム
    const eventPositions = [];
    const occupiedLevels = new Map();
    let currentLevel = 0;

    // 年表のイベントを優先配置（同じ年表内はy座標を近くする）
    eventsByTimeline.forEach((timelineEvents, timelineId) => {
      const baseLevel = currentLevel;
      
      timelineEvents.forEach((event, index) => {
        const eventX = (event.startDate.getFullYear() - (-5000)) * currentPixelsPerYear + panX;
        let eventY;
        let assignedLevel = baseLevel;

        // 同じ年表内では段を詰めて配置
        for (let testLevel = baseLevel; testLevel < baseLevel + 3; testLevel++) {
          const testY = TIMELINE_CONFIG.MAIN_TIMELINE_Y + testLevel * 60;
          let hasCollision = false;

          // 他のイベントとの衝突チェック
          for (const pos of eventPositions) {
            if (Math.abs(eventX - pos.adjustedPosition.x) < 120 && 
                Math.abs(testY - pos.adjustedPosition.y) < 50) {
              hasCollision = true;
              break;
            }
          }

          if (!hasCollision) {
            assignedLevel = testLevel;
            eventY = testY;
            break;
          }
        }

        // 衝突回避できない場合は新しいレベルを使用
        if (eventY === undefined) {
          while (true) {
            currentLevel++;
            eventY = TIMELINE_CONFIG.MAIN_TIMELINE_Y + currentLevel * 60;
            let hasCollision = false;

            for (const pos of eventPositions) {
              if (Math.abs(eventX - pos.adjustedPosition.x) < 120 && 
                  Math.abs(eventY - pos.adjustedPosition.y) < 50) {
                hasCollision = true;
                break;
              }
            }

            if (!hasCollision) {
              assignedLevel = currentLevel;
              break;
            }
          }
        }

        eventPositions.push({
          ...event,
          adjustedPosition: { x: eventX, y: eventY },
          level: assignedLevel,
          timelineInfo: eventTimelineMap.get(event.id),
        });
      });

      currentLevel = Math.max(currentLevel, baseLevel + 2); // 年表間のスペース確保
    });

    // メインタイムラインのイベントを配置
    mainEvents.forEach(event => {
      const eventX = (event.startDate.getFullYear() - (-5000)) * currentPixelsPerYear + panX;
      let eventY = TIMELINE_CONFIG.MAIN_TIMELINE_Y;
      let level = 0;

      // 衝突回避
      while (level < 50) {
        const testY = TIMELINE_CONFIG.MAIN_TIMELINE_Y + level * 60;
        let hasCollision = false;

        for (const pos of eventPositions) {
          if (Math.abs(eventX - pos.adjustedPosition.x) < 120 && 
              Math.abs(testY - pos.adjustedPosition.y) < 50) {
            hasCollision = true;
            break;
          }
        }

        if (!hasCollision) {
          eventY = testY;
          break;
        }
        level++;
      }

      eventPositions.push({
        ...event,
        adjustedPosition: { x: eventX, y: eventY },
        level,
        timelineInfo: null,
      });
    });

    // 年表接続情報の生成
    const timelineConnections = [];
    eventsByTimeline.forEach((timelineEvents, timelineId) => {
      const timeline = timelines.find(t => t.id === timelineId);
      if (!timeline) return;

      const connectionPoints = timelineEvents.map(event => {
        const eventPos = eventPositions.find(pos => pos.id === event.id);
        return eventPos ? {
          x: eventPos.adjustedPosition.x,
          y: eventPos.adjustedPosition.y + TIMELINE_CONFIG.EVENT_HEIGHT / 2,
          event: eventPos,
        } : null;
      }).filter(Boolean);

      if (connectionPoints.length > 1) {
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
    };
  }, [events, timelines, currentPixelsPerYear, panX, panY]);
};