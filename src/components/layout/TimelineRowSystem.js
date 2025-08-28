// components/layout/TimelineRowSystem.js - timelineInfos対応修正版
import { useMemo } from 'react';
import { TIMELINE_CONFIG } from '../../constants/timelineConfig';

// 行・段の定数
export const ROW_SYSTEM = {
  ROW_HEIGHT: 120, // 行の高さ（3段分）
  TIER_HEIGHT: 40, // 1段の高さ
  TIERS_PER_ROW: 3, // 1行あたりの段数
  TIER_POSITIONS: {
    TOP: 0,    // 上段（1段目）
    MIDDLE: 1, // 中段（2段目）- デフォルト
    BOTTOM: 2  // 下段（3段目）
  },
  MIN_EVENT_GAP: 15, // イベント間の最小間隔
  EXTENSION_LINE_LENGTH: 20 // 延長線の長さ
};

/**
 * 行・段システムでイベントレイアウトを計算するフック
 * timelineInfos構造に対応
 */
export const useTimelineRowLayout = (events, timelines, coordinates, calculateTextWidth) => {
  return useMemo(() => {
    if (!events || !timelines || !coordinates?.getXFromYear || !calculateTextWidth) {
      return { layoutEvents: [], timelineRows: [] };
    }

    console.log('🏗️ TimelineRowSystem レイアウト計算開始 (timelineInfos対応)');
    console.log('  - イベント数:', events.length);
    console.log('  - 年表数:', timelines.length);
    
    const layoutEvents = [];
    const timelineRows = [];
    const processedGroups = new Set(); // 処理済みグループの追跡
    
    // 年表ごとに行を割り当て
    timelines.forEach((timeline, timelineIndex) => {
      if (!timeline.isVisible) {
        console.log(`📋 年表「${timeline.name}」: 非表示のためスキップ`);
        return;
      }

      const rowY = TIMELINE_CONFIG.FIRST_ROW_Y + timelineIndex * ROW_SYSTEM.ROW_HEIGHT;
      const timelineRowData = {
        id: timeline.id,
        name: timeline.name,
        color: timeline.color,
        rowIndex: timelineIndex,
        yPosition: rowY,
        events: [],
        tiers: [[], [], []] // 3段の占有情報
      };

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

      timelineRowData.events = timelineEvents;
      
      if (timelineEvents.length === 0) {
        console.log(`📋 年表「${timeline.name}」: イベントなし`);
        timelineRows.push(timelineRowData);
        return;
      }

      // 年表内のイベントを時系列順にソート
      const sortedEvents = [...timelineEvents].sort((a, b) => {
        const aYear = a.startDate ? a.startDate.getFullYear() : 0;
        const bYear = b.startDate ? b.startDate.getFullYear() : 0;
        return aYear - bYear;
      });

      console.log(`📋 年表「${timeline.name}」: ${sortedEvents.length}イベント処理開始`);

      // 各イベントの配置を計算
      sortedEvents.forEach(event => {
        const eventX = event.startDate 
          ? coordinates.getXFromYear(event.startDate.getFullYear())
          : 100;
        const textWidth = calculateTextWidth(event.title || "");
        const eventWidth = Math.max(60, textWidth + 20);

        // 段の配置を決定（中段から開始）
        let tierIndex = ROW_SYSTEM.TIER_POSITIONS.MIDDLE;
        let placement = findAvailableTierPlacement(
          timelineRowData.tiers, 
          tierIndex, 
          eventX, 
          eventWidth
        );

        // 中段に空きがない場合は上段→下段の順で試行
        if (!placement.available) {
          tierIndex = ROW_SYSTEM.TIER_POSITIONS.TOP;
          placement = findAvailableTierPlacement(
            timelineRowData.tiers, 
            tierIndex, 
            eventX, 
            eventWidth
          );
          
          if (!placement.available) {
            tierIndex = ROW_SYSTEM.TIER_POSITIONS.BOTTOM;
            placement = findAvailableTierPlacement(
              timelineRowData.tiers, 
              tierIndex, 
              eventX, 
              eventWidth
            );
          }
        }

        // 3段全てに空きがない場合のみグループ化
        if (!placement.available) {
          console.log(`⚠️  イベント「${event.title}」: 3段全て満杯、グループ化検討`);
          
          placement = handleEventGrouping(
            timelineRowData.tiers, 
            eventX, 
            eventWidth, 
            event,
            timelineIndex
          );
          tierIndex = ROW_SYSTEM.TIER_POSITIONS.MIDDLE; // グループは中段に配置
        }

        // イベントの最終位置を決定
        const eventY = rowY + ROW_SYSTEM.TIER_HEIGHT / 2 + tierIndex * ROW_SYSTEM.TIER_HEIGHT;
        const needsExtensionLine = tierIndex !== ROW_SYSTEM.TIER_POSITIONS.MIDDLE;
        
        // 占有情報を記録（グループでない場合のみ）
        if (!placement.isGrouped) {
          timelineRowData.tiers[tierIndex].push({
            x: eventX,
            width: eventWidth,
            eventId: event.id,
            startX: eventX - eventWidth / 2,
            endX: eventX + eventWidth / 2
          });
        }

        // グループの重複チェック
        if (placement.isGrouped && !processedGroups.has(placement.groupData.id)) {
          processedGroups.add(placement.groupData.id);
          
          layoutEvents.push({
            ...event,
            adjustedPosition: { x: eventX, y: eventY },
            calculatedWidth: eventWidth,
            tierIndex,
            rowIndex: timelineIndex,
            timelineInfo: {
              timelineId: timeline.id,
              timelineName: timeline.name,
              timelineColor: timeline.color,
              needsExtensionLine,
              rowY: rowY + ROW_SYSTEM.TIER_HEIGHT + ROW_SYSTEM.TIER_HEIGHT / 2
            },
            isGrouped: true,
            groupData: placement.groupData
          });
          
          console.log(`📦 グループ作成: ${placement.groupData.id} (${placement.groupData.count}イベント)`);
        } else if (!placement.isGrouped) {
          // 通常のイベント
          layoutEvents.push({
            ...event,
            adjustedPosition: { x: eventX, y: eventY },
            calculatedWidth: eventWidth,
            tierIndex,
            rowIndex: timelineIndex,
            timelineInfo: {
              timelineId: timeline.id,
              timelineName: timeline.name,
              timelineColor: timeline.color,
              needsExtensionLine,
              rowY: rowY + ROW_SYSTEM.TIER_HEIGHT + ROW_SYSTEM.TIER_HEIGHT / 2
            },
            isGrouped: false,
            groupData: null
          });
        }
      });

      timelineRows.push(timelineRowData);
      console.log(`✅ 年表「${timeline.name}」処理完了`);
    });

    // メインタイムライン（年表に属さないイベント）の処理
    const ungroupedEvents = events.filter(event => {
      // timelineInfosが空または存在しないイベントは未分類として扱う
      return !event.timelineInfos || 
             event.timelineInfos.length === 0 ||
             !event.timelineInfos.some(info => !info.isTemporary); // 全て仮削除状態なら未分類
    });

    console.log(`🏛️ メインタイムライン: ${ungroupedEvents.length}イベント処理`);

    ungroupedEvents.forEach(event => {
      const eventX = event.startDate 
        ? coordinates.getXFromYear(event.startDate.getFullYear())
        : 100;
      const textWidth = calculateTextWidth(event.title || "");
      const eventWidth = Math.max(60, textWidth + 20);
      
      const eventY = TIMELINE_CONFIG.MAIN_TIMELINE_Y;
      
      layoutEvents.push({
        ...event,
        adjustedPosition: { x: eventX, y: eventY },
        calculatedWidth: eventWidth,
        tierIndex: null,
        rowIndex: null,
        timelineInfo: null,
        isGrouped: false,
        groupData: null
      });
    });

    console.log(`🏗️ レイアウト完了: ${layoutEvents.length}イベント, ${timelineRows.length}行, ${processedGroups.size}グループ`);
    
    return { layoutEvents, timelineRows };
  }, [events, timelines, coordinates, calculateTextWidth]);
};

/**
 * 指定された段で利用可能な配置位置を探す
 */
function findAvailableTierPlacement(tiers, tierIndex, eventX, eventWidth) {
  const tier = tiers[tierIndex];
  const eventStartX = eventX - eventWidth / 2;
  const eventEndX = eventX + eventWidth / 2;

  // 重複チェック
  const hasCollision = tier.some(occupiedSpace => {
    const gap = ROW_SYSTEM.MIN_EVENT_GAP;
    return !(eventEndX + gap < occupiedSpace.startX || eventStartX - gap > occupiedSpace.endX);
  });

  return {
    available: !hasCollision,
    tierIndex,
    isGrouped: false,
    groupData: null
  };
}

/**
 * イベントのグループ化処理
 */
function handleEventGrouping(tiers, eventX, eventWidth, event, timelineIndex) {
  const middleTier = tiers[ROW_SYSTEM.TIER_POSITIONS.MIDDLE];
  
  // 近隣のグループを検索（±50pxの範囲）
  const searchRadius = 50;
  const nearbyGroup = findNearbyGroup(middleTier, eventX, searchRadius);
  
  if (nearbyGroup) {
    // 既存グループに追加
    nearbyGroup.events.push(event);
    nearbyGroup.count++;
    
    return {
      available: true,
      tierIndex: ROW_SYSTEM.TIER_POSITIONS.MIDDLE,
      isGrouped: true,
      groupData: {
        id: nearbyGroup.id,
        x: nearbyGroup.x,
        count: nearbyGroup.count,
        events: nearbyGroup.events,
        timelineIndex
      }
    };
  } else {
    // 新しいグループを作成
    const groupId = `group_${timelineIndex}_${Date.now()}`;
    const newGroup = {
      id: groupId,
      x: eventX,
      width: Math.max(eventWidth, 80),
      count: 1,
      events: [event],
      startX: eventX - Math.max(eventWidth, 80) / 2,
      endX: eventX + Math.max(eventWidth, 80) / 2,
      isGroup: true
    };
    
    middleTier.push(newGroup);
    
    return {
      available: true,
      tierIndex: ROW_SYSTEM.TIER_POSITIONS.MIDDLE,
      isGrouped: true,
      groupData: {
        id: groupId,
        x: eventX,
        count: 1,
        events: [event],
        timelineIndex
      }
    };
  }
}

/**
 * 近隣のグループを検索
 */
function findNearbyGroup(tier, eventX, searchRadius) {
  return tier.find(occupiedSpace => {
    if (!occupiedSpace.isGroup) return false;
    
    const distance = Math.abs(occupiedSpace.x - eventX);
    return distance <= searchRadius;
  });
}