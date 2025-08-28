// src/utils/groupLayoutSystem.js - 統合グループ化システム
import { TIMELINE_CONFIG } from "../constants/timelineConfig";

/**
 * イベントグループクラス
 */
export class EventGroup {
  constructor(events, timelineId) {
    this.events = events;
    this.timelineId = timelineId;
    this.id = `group_${timelineId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.isExpanded = false;
    
    // グループ内イベントの年号範囲から中央位置を計算
    this.position = this.calculateCenterPosition();
  }

  calculateCenterPosition() {
    if (this.events.length === 0) return { x: 100, y: 100 };
    
    const validEvents = this.events.filter(event => event.startDate);
    if (validEvents.length === 0) return { x: 100, y: 100 };

    const years = validEvents.map(event => event.startDate.getFullYear());
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const centerYear = (minYear + maxYear) / 2;
    
    console.log(`グループ位置計算: 年号範囲 ${minYear}-${maxYear}, 中央: ${centerYear.toFixed(0)}`);
    
    return {
      x: centerYear, // 年号（座標変換は後で行う）
      y: 0 // Y座標は配置時に決定
    };
  }

  getDisplayCount() {
    return this.events.length;
  }

  getMainEvent() {
    return this.events[0];
  }

  addEvent(event) {
    this.events.push(event);
    const newPosition = this.calculateCenterPosition(); // 位置を再計算
    this.position.x = newPosition.x; // 年号を更新
    console.log(`イベント "${event.title}" をグループ ${this.id} に追加。新しい中央年号: ${this.position.x.toFixed(0)}`);
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
 * 3段レイアウトシステム
 */
export class ThreeTierLayoutSystem {
  constructor(coordinates, calculateTextWidth) {
    this.coordinates = coordinates;
    this.calculateTextWidth = calculateTextWidth;
    this.TIER_GAP = 15; // イベント間の最小間隔
  }

  /**
   * 段内での衝突チェック
   */
  checkTierCollision(tier, eventX, eventWidth) {
    const eventStart = eventX - eventWidth / 2;
    const eventEnd = eventX + eventWidth / 2;

    return tier.find(occupied => 
      !(eventEnd + this.TIER_GAP < occupied.startX || eventStart - this.TIER_GAP > occupied.endX)
    );
  }

  /**
   * イベント幅の計算
   */
  getEventWidth(event) {
    if (!event.title) return 60;
    const textWidth = this.calculateTextWidth(event.title);
    return Math.max(60, textWidth + 20);
  }

  /**
   * 年表のイベントレイアウト計算
   */
  layoutTimelineEvents(timeline, timelineIndex, events, baseY) {
    const results = [];
    const groups = new Map();
    
    // 年表に属するイベントを抽出
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

    // 時系列順にソート
    const sortedEvents = [...timelineEvents].sort((a, b) => {
      const aYear = a.startDate ? a.startDate.getFullYear() : 0;
      const bYear = b.startDate ? b.startDate.getFullYear() : 0;
      return aYear - bYear;
    });

    // 3段の占有状況管理
    const tiers = [[], [], []]; // 上段(0)、中段(1)、下段(2)
    const timelineY = baseY + timelineIndex * TIMELINE_CONFIG.ROW_HEIGHT;

    sortedEvents.forEach(event => {
      const eventX = this.coordinates.getXFromYear(event.startDate?.getFullYear() || 2024);
      const eventWidth = this.getEventWidth(event);

      // 段配置を試行（中段→上段→下段の順）
      let tierIndex = 1; // 中段から開始
      let placed = false;

      for (const tryTier of [1, 0, 2]) {
        if (!this.checkTierCollision(tiers[tryTier], eventX, eventWidth)) {
          tierIndex = tryTier;
          placed = true;
          
          // 占有情報を記録
          tiers[tryTier].push({
            x: eventX,
            width: eventWidth,
            startX: eventX - eventWidth / 2,
            endX: eventX + eventWidth / 2,
            eventId: event.id
          });
          break;
        }
      }

      if (placed) {
        // 通常配置
        const eventY = timelineY + (tierIndex - 1) * 40;
        const needsExtensionLine = tierIndex !== 1;

        results.push({
          ...event,
          adjustedPosition: { x: eventX, y: eventY },
          calculatedWidth: eventWidth,
          timelineColor: timeline.color,
          timelineInfo: {
            timelineId: timeline.id,
            timelineName: timeline.name,
            timelineColor: timeline.color,
            needsExtensionLine,
            axisY: timelineY
          },
          hiddenByGroup: false
        });
      } else {
        // グループ化が必要
        this.handleGroupPlacement(event, eventX, eventWidth, groups, timeline, timelineY);
      }
    });

    // グループの最終処理
    const finalGroups = this.finalizeGroups(groups, timeline, timelineY);

    return { events: results, groups: finalGroups };
  }

  /**
   * グループ配置処理
   */
  handleGroupPlacement(event, eventX, eventWidth, groups, timeline, timelineY) {
    const groupKey = `${timeline.id}-${Math.floor(eventX / 80)}`; // 80pxグリッドでグループ化
    
    console.log(`グループ配置処理: イベント "${event.title}", グループキー: ${groupKey}`);
    
    if (groups.has(groupKey)) {
      // 既存グループに追加
      const existingGroup = groups.get(groupKey);
      existingGroup.addEvent(event);
      console.log(`既存グループに追加: ${groupKey}, 現在 ${existingGroup.events.length}イベント`);
    } else {
      // 新規グループ作成
      const newGroup = new EventGroup([event], timeline.id);
      newGroup.position.y = timelineY + 80; // 下段に配置
      groups.set(groupKey, newGroup);
      console.log(`新規グループ作成: ${groupKey}, ID: ${newGroup.id}`);
    }
  }

  /**
   * グループの最終処理（最早・最遅イベント座標の中間値方式）
   */
  finalizeGroups(groups, timeline, timelineY, placedEvents = []) {
    const finalGroups = [];

    console.log(`グループ最終処理開始: ${groups.size}個のグループ候補`);

    groups.forEach((group, groupKey) => {
      console.log(`グループ "${groupKey}": ${group.events.length}イベント`);
      
      if (group.events.length >= 2) {
        // グループ内イベントを年順にソート
        const sortedEvents = [...group.events].sort((a, b) => {
          const aYear = a.startDate ? a.startDate.getFullYear() : 0;
          const bYear = b.startDate ? b.startDate.getFullYear() : 0;
          return aYear - bYear;
        });
        
        // 最早と最遅のイベント
        const earliestEvent = sortedEvents[0];
        const latestEvent = sortedEvents[sortedEvents.length - 1];
        
        // 各イベントの「グループ化されなかった場合のX座標」を計算
        const earliestX = this.coordinates.getXFromYear(
          earliestEvent.startDate?.getFullYear() || 2024
        );
        const latestX = this.coordinates.getXFromYear(
          latestEvent.startDate?.getFullYear() || 2024
        );
        
        // 中間値を計算
        const centerX = (earliestX + latestX) / 2;
        
        const finalGroup = {
          ...group,
          position: { x: centerX, y: timelineY + 80 }, // Y座標は年表の3段目
          timelineColor: timeline.color,
          timelineId: timeline.id,
          getDisplayCount: function() { return this.events.length; },
          getMainEvent: function() { return this.events[0]; }
        };
        
        finalGroups.push(finalGroup);
        console.log(`✅ グループ追加: ${finalGroup.id}`);
        console.log(`   最早イベント: "${earliestEvent.title}" (${earliestEvent.startDate?.getFullYear()}) -> ${earliestX.toFixed(0)}px`);
        console.log(`   最遅イベント: "${latestEvent.title}" (${latestEvent.startDate?.getFullYear()}) -> ${latestX.toFixed(0)}px`);
        console.log(`   グループ位置: 中間値 ${centerX.toFixed(0)}px, Y座標 ${timelineY + 80}px`);
      } else {
        console.log(`⚠️  グループ除外 (イベント数不足): ${group.events.length}個`);
      }
    });

    console.log(`最終グループ数: ${finalGroups.length}`);
    return finalGroups;
  }
}

/**
 * 統合レイアウトマネージャー
 */
export class IntegratedLayoutManager {
  constructor(coordinates, calculateTextWidth) {
    this.coordinates = coordinates;
    this.calculateTextWidth = calculateTextWidth;
    this.tierSystem = new ThreeTierLayoutSystem(coordinates, calculateTextWidth);
  }

  /**
   * メインタイムラインのレイアウト
   */
  layoutMainTimelineEvents(events, timelineAxes) {
    const results = [];
    const baselineY = window.innerHeight * 0.3;
    
    // 年表に属さないイベントを抽出
    const ungroupedEvents = events.filter(event => 
      !event.timelineInfos?.length && 
      !timelineAxes.some(axis => axis.timeline.eventIds?.includes(event.id))
    );

    // 上方向重なり回避システム
    const mainTimelineOccupied = [];
    
    ungroupedEvents.forEach(event => {
      const eventX = this.coordinates.getXFromYear(event.startDate?.getFullYear() || 2024);
      const eventWidth = this.tierSystem.getEventWidth(event);
      
      // 上方向への段階的配置
      let finalY = baselineY;
      let placed = false;
      
      for (let tier = 0; tier < 5; tier++) {
        const testY = baselineY - (tier * 45);
        const collision = mainTimelineOccupied.find(occupied => 
          Math.abs(occupied.x - eventX) < (occupied.width + eventWidth) / 2 + 15 &&
          Math.abs(occupied.y - testY) < 35
        );
        
        if (!collision) {
          finalY = testY;
          mainTimelineOccupied.push({
            x: eventX,
            y: finalY,
            width: eventWidth,
            eventId: event.id
          });
          placed = true;
          break;
        }
      }
      
      if (!placed) {
        finalY = baselineY - (mainTimelineOccupied.length * 45);
        mainTimelineOccupied.push({
          x: eventX,
          y: finalY,
          width: eventWidth,
          eventId: event.id
        });
      }
      
      results.push({
        ...event,
        adjustedPosition: { x: eventX, y: finalY },
        calculatedWidth: eventWidth,
        timelineColor: '#6b7280',
        timelineInfo: null,
        hiddenByGroup: false
      });
    });

    return results;
  }

  /**
   * 全体のレイアウト実行
   */
  executeLayout(events, timelineAxes) {
    const allResults = [];
    const allGroups = [];
    const baselineY = window.innerHeight * 0.3;

    // メインタイムラインのレイアウト
    const mainTimelineResults = this.layoutMainTimelineEvents(events, timelineAxes);
    allResults.push(...mainTimelineResults);

    // 年表ごとのレイアウト
    timelineAxes.forEach((axis, index) => {
      const { events: timelineEvents, groups } = this.tierSystem.layoutTimelineEvents(
        axis.timeline, 
        index, 
        events, 
        baselineY + 100
      );
      
      allResults.push(...timelineEvents);
      allGroups.push(...groups);
    });

    console.log(`統合レイアウト完了: ${allResults.length}イベント, ${allGroups.length}グループ`);
    
    return {
      allEvents: allResults,
      eventGroups: allGroups
    };
  }
}