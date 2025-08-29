// src/utils/groupLayoutSystem.js - 仮登録・仮削除対応版
import { TIMELINE_CONFIG } from "../constants/timelineConfig";
import { calculateEventWidth, calculateEventHeight } from './eventSizeUtils';

// 年表ベースの状態判定ヘルパー関数
const getEventTimelineStatus = (event, timeline) => {
  if (!timeline || !event) return "none";
  if (timeline.eventIds?.includes(event.id)) return "registered";
  if (timeline.pendingEventIds?.includes(event.id)) return "pending";
  if (timeline.removedEventIds?.includes(event.id)) return "removed";
  return "none";
};

/**
 * イベントグループクラス（色統一・大型化対応）
 */
export class EventGroup {
  constructor(events, timelineId, timelineColor = '#6b7280') {
    this.events = events;
    this.timelineId = timelineId;
    this.timelineColor = timelineColor;
    this.id = `group_${timelineId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.isExpanded = false;
    this.position = { x: 0, y: 0 };
  }

  getDisplayCount() {
    return this.events.length;
  }

  getMainEvent() {
    return this.events[0];
  }

  addEvent(event) {
    this.events.push(event);
  }
}

/**
 * 3段レイアウトシステム（仮状態対応）
 */
export class ThreeTierLayoutSystem {
  constructor(coordinates, calculateTextWidth) {
    this.coordinates = coordinates;
    this.calculateTextWidth = calculateTextWidth;
  }

  getEventWidth(event) {
    return calculateEventWidth(event, this.calculateTextWidth);
  }

  getEventHeight(event) {
    return calculateEventHeight(event);
  }

  /**
   * 年表のイベントレイアウト計算（仮状態対応版）
   */
  layoutTimelineEvents(timeline, timelineIndex, allEvents, baseY) {
    const results = [];
    const groups = new Map();
    
    // 仮状態を含むイベント抽出
    const timelineEvents = [];
    allEvents.forEach(event => {
      const status = getEventTimelineStatus(event, timeline);
      if (status === "registered" || status === "pending") {
        timelineEvents.push({
          ...event,
          displayStatus: status,
          timelineId: timeline.id,
          id: `${event.id}-${timeline.id}`, // 複数表示用ID
          originalId: event.id,
          originalEvent: event
        });
      }
    });

    if (timelineEvents.length === 0) {
      return { events: results, groups: [] };
    }

    console.log(`年表「${timeline.name}」レイアウト: ${timelineEvents.length}イベント`);

    const sortedEvents = [...timelineEvents].sort((a, b) => {
      const aYear = a.startDate ? a.startDate.getFullYear() : 0;
      const bYear = b.startDate ? b.startDate.getFullYear() : 0;
      return aYear - bYear;
    });

    const timelineY = baseY + timelineIndex * TIMELINE_CONFIG.ROW_HEIGHT;
    const tiers = [[], [], []]; // 3段システム

    // 3段配置処理
    sortedEvents.forEach((event) => {
      const eventX = this.coordinates.getXFromYear(event.startDate?.getFullYear() || 2024);
      const eventWidth = this.getEventWidth(event);
      const eventHeight = this.getEventHeight(event);

      let placed = false;
      const tierOrder = [1, 0, 2]; // 中段、上段、下段の優先順

      for (const tryTier of tierOrder) {
        const tierY = timelineY + (tryTier - 1) * TIMELINE_CONFIG.TIER_HEIGHT;
        
        const eventLeft = eventX - eventWidth / 2;
        const eventRight = eventX + eventWidth / 2;
        
        let hasCollision = false;
        
        for (const occupied of tiers[tryTier]) {
          const occupiedLeft = occupied.position.x - occupied.width / 2;
          const occupiedRight = occupied.position.x + occupied.width / 2;
          const margin = TIMELINE_CONFIG.EVENT_MARGIN || 5;
          
          if (!(eventRight + margin <= occupiedLeft || eventLeft - margin >= occupiedRight)) {
            hasCollision = true;
            break;
          }
        }
        
        if (!hasCollision) {
          const placementData = {
            event,
            position: { x: eventX, y: tierY },
            width: eventWidth,
            height: eventHeight,
            tierIndex: tryTier
          };
          
          tiers[tryTier].push(placementData);
          
          const needsExtensionLine = tryTier !== 1;
          
          results.push({
            ...event,
            adjustedPosition: { x: eventX, y: tierY },
            calculatedWidth: eventWidth,
            calculatedHeight: eventHeight,
            timelineColor: timeline.color || '#6b7280',
            tierIndex: tryTier,
            needsExtensionLine,
            hiddenByGroup: false,
            timelineInfo: {
              timelineId: timeline.id,
              timelineName: timeline.name,
              timelineColor: timeline.color,
              needsExtensionLine,
              axisY: timelineY
            }
          });
          
          placed = true;
          break;
        }
      }

      if (!placed) {
        // 強制配置
        const forcedY = timelineY;
        results.push({
          ...event,
          adjustedPosition: { x: eventX, y: forcedY },
          calculatedWidth: eventWidth,
          calculatedHeight: eventHeight,
          timelineColor: timeline.color || '#6b7280',
          tierIndex: 1,
          needsExtensionLine: false,
          hiddenByGroup: false,
          timelineInfo: {
            timelineId: timeline.id,
            timelineName: timeline.name,
            timelineColor: timeline.color,
            needsExtensionLine: false,
            axisY: timelineY
          }
        });
      }
    });

    return {
      events: results,
      groups: Array.from(groups.values())
    };
  }
}

/**
 * 統合レイアウトシステム（仮状態対応版）
 */
export class UnifiedLayoutSystem {
  constructor(coordinates, calculateTextWidth) {
    this.coordinates = coordinates;
    this.calculateTextWidth = calculateTextWidth;
    this.layoutSystem = new ThreeTierLayoutSystem(coordinates, calculateTextWidth);
  }

  /**
   * メインタイムラインのレイアウト（仮削除対応）
   */
  layoutMainTimelineEvents(allEvents, timelineAxes, displayTimelines) {
    const results = [];
    const baselineY = window.innerHeight * 0.25;
    
    // メインタイムライン用イベントを抽出
    const mainTimelineEvents = [];
    
    allEvents.forEach(event => {
      let shouldShowInMain = true;
      let isRemoved = false;
      
      // 年表での状態をチェック
      for (const timeline of displayTimelines) {
        const status = getEventTimelineStatus(event, timeline);
        if (status === "registered" || status === "pending") {
          shouldShowInMain = false; // 年表に所属している
          break;
        }
        if (status === "removed") {
          isRemoved = true;
        }
      }
      
      // 年表に所属していない、または仮削除されたイベントをメインに表示
      if (shouldShowInMain || isRemoved) {
        mainTimelineEvents.push({
          ...event,
          displayStatus: isRemoved ? "removed" : "main",
          originalId: event.id,
          originalEvent: event
        });
      }
    });

    console.log(`メインタイムライン: ${mainTimelineEvents.length}イベント`);

    const occupiedPositions = [];
    const sortedEvents = [...mainTimelineEvents].sort((a, b) => {
      const aYear = a.startDate ? a.startDate.getFullYear() : 0;
      const bYear = b.startDate ? b.startDate.getFullYear() : 0;
      return aYear - bYear;
    });

    sortedEvents.forEach(event => {
      const eventX = this.coordinates.getXFromYear(event.startDate?.getFullYear() || 2024);
      const eventWidth = calculateEventWidth(event, this.calculateTextWidth);
      const eventHeight = calculateEventHeight(event);
      
      let finalY = baselineY;
      let placed = false;
      const tierHeight = TIMELINE_CONFIG.TIER_HEIGHT || 50;
      
      // 無制限積み重ね（上方向）
      for (let tier = 0; tier < 200; tier++) {
        const testY = baselineY - (tier * tierHeight);
        
        let hasCollision = false;
        for (const occupied of occupiedPositions) {
          const margin = TIMELINE_CONFIG.EVENT_MARGIN || 15;
          const thisLeft = eventX - eventWidth / 2;
          const thisRight = eventX + eventWidth / 2;
          const occupiedLeft = occupied.position.x - occupied.bounds.width / 2;
          const occupiedRight = occupied.position.x + occupied.bounds.width / 2;
          
          const yDistance = Math.abs(testY - occupied.position.y);
          const xOverlap = !(thisRight + margin < occupiedLeft || thisLeft - margin > occupiedRight);
          
          if (xOverlap && yDistance < eventHeight + margin) {
            hasCollision = true;
            break;
          }
        }
        
        if (!hasCollision) {
          finalY = testY;
          occupiedPositions.push({
            event,
            position: { x: eventX, y: testY },
            bounds: { width: eventWidth, height: eventHeight }
          });
          placed = true;
          break;
        }
      }
      
      if (!placed) {
        finalY = baselineY - (200 * tierHeight);
        occupiedPositions.push({
          event,
          position: { x: eventX, y: finalY },
          bounds: { width: eventWidth, height: eventHeight }
        });
      }
      
      results.push({
        ...event,
        adjustedPosition: { x: eventX, y: finalY },
        calculatedWidth: eventWidth,
        calculatedHeight: eventHeight,
        timelineColor: event.displayStatus === "removed" ? '#6b7280' : '#6b7280',
        timelineInfo: event.displayStatus === "removed" ? {
          timelineId: null,
          timelineName: "仮削除",
          timelineColor: '#6b7280'
        } : null,
        hiddenByGroup: false
      });
    });

    return results;
  }

  /**
   * 全体のレイアウト実行（仮状態対応）
   */
  executeLayout(events, timelineAxes, displayTimelines) {
    const allEvents = [];
    const eventGroups = [];

    console.log(`レイアウト実行開始: ${events.length}イベント, ${timelineAxes.length}年表`);

    // メインタイムラインのレイアウト
    const mainTimelineResults = this.layoutMainTimelineEvents(events, timelineAxes, displayTimelines);
    allEvents.push(...mainTimelineResults);

    // 年表ごとのレイアウト
    timelineAxes.forEach((axis, index) => {
      const timeline = axis.timeline || axis;
      const result = this.layoutSystem.layoutTimelineEvents(
        timeline,
        index,
        events,
        TIMELINE_CONFIG.FIRST_ROW_Y()
      );

      allEvents.push(...result.events);
      eventGroups.push(...result.groups);
    });

    console.log(`レイアウト実行完了: 合計 ${allEvents.length}イベント, ${eventGroups.length}グループ`);
    return { allEvents, eventGroups };
  }
}