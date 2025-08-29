// src/utils/groupLayoutSystem.js - 無制限積み重ね対応版
import { TIMELINE_CONFIG } from "../constants/timelineConfig";
import { calculateEventWidth, calculateEventHeight, getEventBounds, checkEventCollision, checkMultipleCollisions } from './eventSizeUtils';

/**
 * イベントグループクラス（色統一・大型化対応）
 */
export class EventGroup {
  constructor(events, timelineId, timelineColor = '#6b7280') {
    this.events = events;
    this.timelineId = timelineId;
    this.timelineColor = timelineColor; // 年表色を保持
    this.id = `group_${timelineId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.isExpanded = false;
    
    // 位置は finalizeGroups で計算するため初期値のみ
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
    console.log(`イベント "${event.title}" をグループ ${this.id} に追加。現在 ${this.events.length}イベント`);
  }

  getYearRange() {
    const years = this.events
      .filter(event => event.startDate)
      .map(event => event.startDate.getFullYear())
      .sort((a, b) => a - b);
    
    if (years.length === 0) return null;
    return {
      min: years[0],
      max: years[years.length - 1],
      center: (years[0] + years[years.length - 1]) / 2
    };
  }
}

/**
 * 3段レイアウトシステム（無制限積み重ね対応）
 */
export class ThreeTierLayoutSystem {
  constructor(coordinates, calculateTextWidth) {
    this.coordinates = coordinates;
    this.calculateTextWidth = calculateTextWidth;
  }

  /**
   * 段内での衝突チェック（正確なサイズ使用）
   */
  checkTierCollision(tier, event, eventX, eventY) {
    const newPosition = { x: eventX, y: eventY };
    const eventWidth = this.getEventWidth(event);
    const margin = TIMELINE_CONFIG.EVENT_MARGIN || 15;
    
    const newLeft = eventX - eventWidth / 2;
    const newRight = eventX + eventWidth / 2;
    
    return tier.find(occupied => {
      const occupiedLeft = occupied.position.x - occupied.width / 2;
      const occupiedRight = occupied.position.x + occupied.width / 2;
      
      return !(newRight + margin < occupiedLeft || newLeft - margin > occupiedRight);
    });
  }

  /**
   * イベント幅・高さの計算（統一関数使用）
   */
  getEventWidth(event) {
    return calculateEventWidth(event, this.calculateTextWidth);
  }

  getEventHeight(event) {
    return calculateEventHeight(event);
  }

  /**
   * 年表のイベントレイアウト計算（3段優先・正確な重なり判定版）
   */
  layoutTimelineEvents(timeline, timelineIndex, events, baseY) {
    const results = [];
    const groups = new Map();
    
    const timelineEvents = events.filter(event => {
      if (event.timelineInfos?.some(info => info.timelineId === timeline.id && !info.isTemporary)) {
        return true;
      }
      if (timeline.eventIds?.includes(event.id)) {
        return true;
      }
      return false;
    });

    if (timelineEvents.length === 0) {
      return { events: results, groups: [] };
    }

    console.log(`📋 年表「${timeline.name}」のレイアウト開始: ${timelineEvents.length}個のイベント（3段優先システム）`);

    const sortedEvents = [...timelineEvents].sort((a, b) => {
      const aYear = a.startDate ? a.startDate.getFullYear() : 0;
      const bYear = b.startDate ? b.startDate.getFullYear() : 0;
      return aYear - bYear;
    });

    // 年表軸のY座標
    const timelineY = baseY + timelineIndex * TIMELINE_CONFIG.ROW_HEIGHT;
    
    // 3段システムの配置記録
    const tiers = [
      [], // 上段（tierIndex = 0）
      [], // 中段（tierIndex = 1, 軸上）
      []  // 下段（tierIndex = 2）
    ];

    // フェーズ1: 全イベントを3段システムで配置試行
    const successfullyPlaced = [];
    const needsGrouping = [];

    sortedEvents.forEach((event, index) => {
      const eventX = this.coordinates.getXFromYear(event.startDate?.getFullYear() || 2024);
      const eventWidth = this.getEventWidth(event);
      const eventHeight = this.getEventHeight(event);

      console.log(`  📌 3段配置試行: "${event.title}": X=${eventX.toFixed(0)}, 幅=${eventWidth}px`);

      let placed = false;
      const tierOrder = [1, 0, 2]; // 中段、上段、下段の優先順位

      for (const tryTier of tierOrder) {
        const tierY = timelineY + (tryTier - 1) * TIMELINE_CONFIG.TIER_HEIGHT;
        
        // イベントの境界計算を最初に定義
        const eventLeft = eventX - eventWidth / 2;
        const eventRight = eventX + eventWidth / 2;
        
        // この段での正確な重なりチェック（実際のイベント幅 + マージン）
        let hasCollision = false;
        
        for (const occupied of tiers[tryTier]) {
          // 実際のイベント境界を計算（中心座標から幅の半分ずつ）
          const occupiedLeft = occupied.position.x - occupied.width / 2;
          const occupiedRight = occupied.position.x + occupied.width / 2;
          
          // マージンを含む重なり判定
          const margin = TIMELINE_CONFIG.EVENT_MARGIN || 5;
          if (!(eventRight + margin <= occupiedLeft || eventLeft - margin >= occupiedRight)) {
            hasCollision = true;
            console.log(`    ❌ 段 ${tryTier} で重なり: "${occupied.event.title}" (占有: ${occupiedLeft.toFixed(0)}-${occupiedRight.toFixed(0)}, 新規: ${eventLeft.toFixed(0)}-${eventRight.toFixed(0)})`);
            break;
          }
        }
        
        if (!hasCollision) {
          // 段に配置成功
          const placementData = {
            event,
            position: { x: eventX, y: tierY },
            width: eventWidth,
            height: eventHeight,
            tierIndex: tryTier
          };
          
          tiers[tryTier].push(placementData);
          successfullyPlaced.push(placementData);
          placed = true;
          
          console.log(`    ✅ 段 ${tryTier} に配置成功 (Y=${tierY}, 占有範囲: ${eventLeft.toFixed(0)}-${eventRight.toFixed(0)})`);
          break;
        }
      }

      if (!placed) {
        // 3段すべてで重なり発生：グループ化候補
        console.log(`    📦 グループ化候補: "${event.title}" (3段すべて満杯)`);
        needsGrouping.push({
          event,
          eventX,
          eventWidth,
          eventHeight
        });
      }
    });

    // フェーズ2: グループ化が必要なイベントを処理
    if (needsGrouping.length > 0) {
      console.log(`🔄 グループ化処理: ${needsGrouping.length}個のイベント`);
      
      // 連続する重なりグループを作成
      const groupCandidates = [];
      const groupedEvents = new Set();
      
      for (let i = 0; i < needsGrouping.length; i++) {
        const current = needsGrouping[i];
        
        if (groupedEvents.has(current.event.id)) {
          continue;
        }
        
        // 現在のイベントから始まるグループを構築
        const groupMembers = [current];
        groupedEvents.add(current.event.id);
        
        // 後続の近接イベントをグループに追加
        for (let j = i + 1; j < needsGrouping.length; j++) {
          const next = needsGrouping[j];
          
          if (groupedEvents.has(next.event.id)) {
            continue;
          }
          
          // グループ内最後のイベントとの距離チェック（正確な境界計算）
          const lastMember = groupMembers[groupMembers.length - 1];
          const lastRight = lastMember.eventX + lastMember.eventWidth / 2;
          const nextLeft = next.eventX - next.eventWidth / 2;
          const gap = nextLeft - lastRight;
          
          // 許容距離：マージン分（5px）以内なら近接
          const maxGap = TIMELINE_CONFIG.EVENT_MARGIN || 5;
          
          if (gap <= maxGap) {
            groupMembers.push(next);
            groupedEvents.add(next.event.id);
            console.log(`    📦 グループ拡張: "${next.event.title}" (隙間: ${gap.toFixed(0)}px <= ${maxGap.toFixed(0)}px)`);
          } else {
            break;
          }
        }
        
        // グループとして登録
        if (groupMembers.length >= (TIMELINE_CONFIG.MIN_GROUP_SIZE || 2)) {
          const events = groupMembers.map(m => m.event);
          const newGroup = new EventGroup(events, timeline.id, timeline.color || '#6b7280');
          groupCandidates.push(newGroup);
          groups.set(newGroup.id, newGroup);
          console.log(`🆕 グループ作成: ${newGroup.id} (${events.length}イベント)`);
        } else {
          // グループサイズ不足：強制的に中段に配置
          groupMembers.forEach(member => {
            const forcedY = timelineY; // 中段に強制配置
            successfullyPlaced.push({
              event: member.event,
              position: { x: member.eventX, y: forcedY },
              width: member.eventWidth,
              height: member.eventHeight,
              tierIndex: 1
            });
            console.log(`⚠️ 強制配置: "${member.event.title}" を中段に配置`);
          });
        }
      }
    }

    // フェーズ3: 配置されたイベントの結果作成
    successfullyPlaced.forEach(placementData => {
      const needsExtensionLine = placementData.tierIndex !== 1;
      
      results.push({
        ...placementData.event,
        adjustedPosition: placementData.position,
        calculatedWidth: placementData.width,
        calculatedHeight: placementData.height,
        timelineColor: timeline.color || '#6b7280',
        tierIndex: placementData.tierIndex,
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
    });

    const finalGroups = this.finalizeGroups(Array.from(groups.values()), timelineY);

    console.log(`✅ 年表「${timeline.name}」レイアウト完了: ${results.length}イベント, ${finalGroups.length}グループ（3段優先）`);
    
    return {
      events: results,
      groups: finalGroups
    };
  }

  /**
   * グループの最終処理（大型化・年表色統一対応）
   */
  finalizeGroups(groups, timelineY) {
    const finalGroups = [];

    console.log(`🔄 グループ最終処理開始: ${groups.length}個のグループ候補`);

    groups.forEach((group, index) => {
      console.log(`📦 グループ ${index}: ${group.events.length}イベント`);
      
      if (group.events.length >= (TIMELINE_CONFIG.MIN_GROUP_SIZE || 2)) {
        const sortedEvents = [...group.events].sort((a, b) => {
          const aYear = a.startDate ? a.startDate.getFullYear() : 0;
          const bYear = b.startDate ? b.startDate.getFullYear() : 0;
          return aYear - bYear;
        });
        
        const earliestEvent = sortedEvents[0];
        const latestEvent = sortedEvents[sortedEvents.length - 1];
        
        const earliestX = this.coordinates.getXFromYear(
          earliestEvent.startDate?.getFullYear() || 2024
        );
        const latestX = this.coordinates.getXFromYear(
          latestEvent.startDate?.getFullYear() || 2024
        );
        
        const centerX = (earliestX + latestX) / 2;
        
        // グループの年表色を維持（すでにコンストラクタで設定済み）
        group.position = { x: centerX, y: timelineY - 25 };
        
        finalGroups.push(group);
        console.log(`✅ グループ最終化: 位置=(${group.position.x.toFixed(0)}, ${group.position.y}), 色=${group.timelineColor}`);
        
      } else {
        console.log(`⚠️ グループ除外 (サイズ不足): ${group.events.length}個`);
      }
    });

    console.log(`✅ グループ最終処理完了: ${finalGroups.length}個のグループを生成`);
    return finalGroups;
  }
}

/**
 * 統合レイアウトシステム（メインクラス）- 無制限積み重ね対応版
 */
export class UnifiedLayoutSystem {
  constructor(coordinates, calculateTextWidth) {
    this.coordinates = coordinates;
    this.calculateTextWidth = calculateTextWidth;
    this.layoutSystem = new ThreeTierLayoutSystem(coordinates, calculateTextWidth);
    console.log('統合レイアウトシステム初期化完了（無制限積み重ね対応）');
  }

  /**
   * メインタイムラインのレイアウト（無制限積み重ね対応）
   */
  layoutMainTimelineEvents(events, timelineAxes) {
    const results = [];
    const baselineY = window.innerHeight * 0.25;
    
    const ungroupedEvents = events.filter(event => 
      !event.timelineInfos?.length && 
      !timelineAxes.some(axis => 
        (axis.timeline?.eventIds?.includes(event.id)) ||
        (axis.eventIds?.includes(event.id))
      )
    );

    console.log(`メインタイムライン（無制限積み重ね）: ${ungroupedEvents.length}個のイベント`);

    const occupiedPositions = [];
    
    const sortedEvents = [...ungroupedEvents].sort((a, b) => {
      const aYear = a.startDate ? a.startDate.getFullYear() : 0;
      const bYear = b.startDate ? b.startDate.getFullYear() : 0;
      return aYear - bYear;
    });

    sortedEvents.forEach(event => {
      const eventX = this.coordinates.getXFromYear(event.startDate?.getFullYear() || 2024);
      const eventWidth = calculateEventWidth(event, this.calculateTextWidth);
      const eventHeight = calculateEventHeight(event);
      
      console.log(`  メインイベント "${event.title}": X=${eventX.toFixed(0)}, 実際の幅=${eventWidth}px`);
      
      let finalY = baselineY;
      let placed = false;
      const tierHeight = TIMELINE_CONFIG.TIER_HEIGHT || 50;
      
      // 無制限積み重ね（上方向）
      for (let tier = 0; tier < 200; tier++) { // 安全装置として200段まで
        const testY = baselineY - (tier * tierHeight);
        const testPosition = { x: eventX, y: testY };
        
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
            position: testPosition,
            bounds: { width: eventWidth, height: eventHeight }
          });
          placed = true;
          console.log(`    配置成功: 段=${tier}, Y=${finalY.toFixed(0)}`);
          break;
        }
      }
      
      if (!placed) {
        console.warn(`⚠️ メインイベント「${event.title}」: 200段制限到達のため強制配置`);
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
        timelineColor: '#6b7280',
        timelineInfo: null,
        hiddenByGroup: false
      });
    });

    console.log(`✅ メインタイムラインレイアウト完了: ${results.length}イベント（無制限積み重ね）`);
    return results;
  }

  /**
   * 全体のレイアウト実行
   */
  executeLayout(events, timelineAxes) {
    const allEvents = [];
    const eventGroups = [];

    console.log(`🎨 レイアウト実行開始: ${events.length}イベント, ${timelineAxes.length}年表`);
    console.log(`📏 無制限積み重ねシステム使用`);

    // メインタイムラインのレイアウト
    const mainTimelineResults = this.layoutMainTimelineEvents(events, timelineAxes);
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

      console.log(`年表「${timeline.name}」レイアウト完了: ${result.events.length}イベント, ${result.groups.length}グループ`);
    });

    console.log(`✅ レイアウト実行完了: 合計 ${allEvents.length}イベント, ${eventGroups.length}グループ（無制限積み重ね）`);
    return { allEvents, eventGroups };
  }
}