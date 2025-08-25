// src/hooks/useEnhancedEventLayout.js - 検索問題修正版
import { useMemo } from 'react';
import { TIMELINE_CONFIG } from '../constants/timelineConfig';

export const useEnhancedEventLayout = (events, timelines, currentPixelsPerYear, panX, panY) => {
  return useMemo(() => {
    // 依存関係を明示的に定義して検索問題を解決
    const eventTimelineMap = new Map(); // eventId -> [timelineInfo1, timelineInfo2, ...]

    // 複数年表対応：各イベントが属する全ての年表を記録
    timelines.forEach(timeline => {
      if (!timeline.isVisible) return;

      [...(timeline.events || []), ...(timeline.temporaryEvents || [])]
        .filter(event => !(timeline.removedEvents || []).some(removed => removed.id === event.id))
        .forEach(event => {
          if (!eventTimelineMap.has(event.id)) {
            eventTimelineMap.set(event.id, []);
          }
          
          eventTimelineMap.get(event.id).push({
            timelineId: timeline.id,
            timelineName: timeline.name,
            timelineColor: timeline.color,
            isTemporary: (timeline.temporaryEvents || []).includes(event),
          });
        });
    });

    // 全てのイベントを統合
    const allEventIds = new Set([
      ...events.map(e => e.id),
      ...Array.from(eventTimelineMap.keys())
    ]);

    const allEventsForLayout = Array.from(allEventIds).map(eventId => {
      const baseEvent = events.find(e => e.id === eventId);
      const timelineInfos = eventTimelineMap.get(eventId) || [];
      
      return {
        ...baseEvent,
        timelineInfos,
      };
    }).filter(event => event && event.startDate) // null/undefinedチェック追加
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    // 配置アルゴリズム
    const eventPositions = [];
    let currentLevel = 0;

    // 年表別にグループ化
    const timelineEventGroups = new Map();
    timelines.forEach(timeline => {
      if (!timeline.isVisible) return;
      
      const timelineEvents = allEventsForLayout.filter(event => 
        event.timelineInfos.some(info => info.timelineId === timeline.id)
      );
      
      if (timelineEvents.length > 0) {
        timelineEventGroups.set(timeline.id, timelineEvents);
      }
    });

    // 年表ごとにまとめて配置
    const processedEventIds = new Set();
    
    timelineEventGroups.forEach((timelineEvents, timelineId) => {
      const baseLevel = currentLevel;
      
      timelineEvents.forEach((event, index) => {
        if (processedEventIds.has(event.id)) {
          return;
        }

        const eventX = (event.startDate.getFullYear() - (-5000)) * currentPixelsPerYear + panX;
        let eventY;
        let assignedLevel = baseLevel;

        // 同じ年表内では段を詰めて配置
        for (let testLevel = baseLevel; testLevel < baseLevel + 3; testLevel++) {
          const testY = TIMELINE_CONFIG.MAIN_TIMELINE_Y + testLevel * 60;
          let hasCollision = false;

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
        });

        processedEventIds.add(event.id);
      });

      currentLevel = Math.max(currentLevel, baseLevel + 2);
    });

    // 年表に属さないイベントを配置
    allEventsForLayout.forEach(event => {
      if (processedEventIds.has(event.id) || event.timelineInfos.length > 0) {
        return;
      }

      const eventX = (event.startDate.getFullYear() - (-5000)) * currentPixelsPerYear + panX;
      let eventY = TIMELINE_CONFIG.MAIN_TIMELINE_Y;
      let level = 0;

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
      });
    });

    // 年表接続情報の生成
    const timelineConnections = [];
    
    timelines.forEach(timeline => {
      if (!timeline.isVisible) return;

      const connectionPoints = [];
      
      eventPositions.forEach(eventPos => {
        const belongsToThisTimeline = eventPos.timelineInfos?.some(
          info => info.timelineId === timeline.id
        );
        
        if (belongsToThisTimeline) {
          connectionPoints.push({
            x: eventPos.adjustedPosition.x,
            y: eventPos.adjustedPosition.y + TIMELINE_CONFIG.EVENT_HEIGHT / 2,
            event: eventPos,
          });
        }
      });

      connectionPoints.sort((a, b) => a.event.startDate.getTime() - b.event.startDate.getTime());

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
  }, [events, timelines, currentPixelsPerYear, panX, panY]); // 明示的な依存関係
};