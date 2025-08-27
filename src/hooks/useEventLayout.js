// hooks/useEventLayout.js
import { useMemo } from 'react';
import { TIMELINE_CONFIG } from '../constants/timelineConfig';

export const useEventLayout = (events, timelines, getXFromYear, calculateTextWidth) => {
  const layoutEvents = useMemo(() => {
    console.log('🎨 イベントレイアウト計算', {
      events: events?.length || 0,
      timelines: timelines?.length || 0
    });

    if (!events || events.length === 0) {
      console.log('  イベントがありません');
      return [];
    }

    const results = [];
    const occupiedPositions = new Map(); // level -> [{ x, width }]

    // 年表に属するイベントを特定
    const timelineEventIds = new Set();
    (timelines || []).forEach(timeline => {
      if (!timeline.isVisible) return;
      (timeline.events || []).forEach(event => timelineEventIds.add(event.id));
      (timeline.temporaryEvents || []).forEach(event => timelineEventIds.add(event.id));
    });

    // メインタイムラインのイベントのみ処理
    const mainEvents = events.filter(event => !timelineEventIds.has(event.id));
    console.log(`  メインタイムラインイベント: ${mainEvents.length}件`);

    mainEvents.forEach((event, index) => {
      if (!event?.startDate) {
        console.warn(`  ⚠️ イベント ${event?.id} に開始日がありません`);
        return;
      }

      const eventX = getXFromYear(event.startDate.getFullYear());
      const textWidth = calculateTextWidth ? calculateTextWidth(event.title || '') : 80;
      const eventWidth = Math.max(60, textWidth + 20);
      
      // シンプルな段階配置（重複回避）
      let level = 0;
      let eventY = TIMELINE_CONFIG.MAIN_TIMELINE_Y;
      
      while (level < 15) {
        const testY = TIMELINE_CONFIG.MAIN_TIMELINE_Y + level * 70;
        const levelEvents = occupiedPositions.get(level) || [];
        
        const hasCollision = levelEvents.some(occupied => 
          Math.abs(eventX - occupied.x) < (eventWidth + occupied.width) / 2 + 20
        );
        
        if (!hasCollision) {
          eventY = testY;
          if (!occupiedPositions.has(level)) {
            occupiedPositions.set(level, []);
          }
          occupiedPositions.get(level).push({ x: eventX, width: eventWidth });
          break;
        }
        level++;
      }

      const layoutEvent = {
        ...event,
        adjustedPosition: { x: eventX, y: eventY },
        calculatedWidth: eventWidth,
        hiddenByGroup: false,
        isGroup: false,
        timelineColor: null,
        level
      };

      results.push(layoutEvent);
      console.log(`  ✅ ${event.title} → (${eventX}, ${eventY}), level: ${level}`);
    });

    console.log(`✅ レイアウト完了: ${results.length}件配置`);
    return results;
  }, [events, timelines, getXFromYear, calculateTextWidth]);

  return {
    layoutEvents
  };
};