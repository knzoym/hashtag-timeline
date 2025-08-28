// src/utils/groupLayoutSystem.js - 統合グループ化システム
import { TIMELINE_CONFIG } from "../constants/timelineConfig";

/**
 * イベントグループクラス（位置計算は finalizeGroups で実行）
 */
export class EventGroup {
  constructor(events, timelineId) {
    this.events = events;
    this.timelineId = timelineId;
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
      groups.set(groupKey, newGroup);
      console.log(`新規グループ作成: ${groupKey}, ID: ${newGroup.id}`);
    }
  }

  /**
   * グループの最終処理（過去の正常動作版を復元 + 表示時座標変換）
   */
  finalizeGroups(groups, timeline, timelineY) {
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
        
        console.log(`   最早イベント: "${earliestEvent.title}" (${earliestEvent.startDate?.getFullYear()})`);
        console.log(`   最遅イベント: "${latestEvent.title}" (${latestEvent.startDate?.getFullYear()})`);
        
        // 各々の年号から直接X座標を計算
        const earliestX = this.coordinates.getXFromYear(
          earliestEvent.startDate?.getFullYear() || 2024
        );
        const latestX = this.coordinates.getXFromYear(
          latestEvent.startDate?.getFullYear() || 2024
        );
        
        console.log(`   最早イベントX座標: ${earliestX.toFixed(0)}px`);
        console.log(`   最遅イベントX座標: ${latestX.toFixed(0)}px`);
        
        // 2つの座標の中間値をグループ位置とする
        const centerX = (earliestX + latestX) / 2;
        
        console.log(`   計算された中間値: ${centerX.toFixed(0)}px`);
        
        // 元のグループオブジェクトの位置を直接更新
        group.position = { x: centerX, y: timelineY + 80 };
        
        // 新しいオブジェクトではなく、元のオブジェクトを使用
        finalGroups.push(group);
        console.log(`✅ グループ追加完了: ID=${group.id}, 最終位置=(${group.position.x.toFixed(0)}, ${group.position.y}), イベント数=${group.events.length}`);
        
      } else {
        console.log(`⚠️  グループ除外 (イベント数不足): ${group.events.length}個`);
      }
    });

    console.log(`グループ最終処理完了: ${finalGroups.length}個のグループを生成`);
    return finalGroups;
  }
}

/**
 * 統合レイアウトシステム（メインクラス）
 */
export class UnifiedLayoutSystem {
  constructor(coordinates, calculateTextWidth) {
    this.coordinates = coordinates;
    this.calculateTextWidth = calculateTextWidth;
    this.layoutSystem = new ThreeTierLayoutSystem(coordinates, calculateTextWidth);
    console.log('統合レイアウトシステム初期化完了');
  }

  /**
   * メインタイムラインのレイアウト（年表に属さないイベント）
   */
  layoutMainTimelineEvents(events, timelineAxes) {
    const results = [];
    const baselineY = window.innerHeight * 0.3;
    
    // 年表に属さないイベントを抽出
    const ungroupedEvents = events.filter(event => 
      !event.timelineInfos?.length && 
      !timelineAxes.some(axis => 
        (axis.timeline?.eventIds?.includes(event.id)) ||
        (axis.eventIds?.includes(event.id))
      )
    );

    console.log(`メインタイムラインイベント: ${ungroupedEvents.length}個`);

    // 上方向重なり回避システム
    const mainTimelineOccupied = [];
    
    ungroupedEvents.forEach(event => {
      const eventX = this.coordinates.getXFromYear(event.startDate?.getFullYear() || 2024);
      const eventWidth = this.layoutSystem.getEventWidth(event);
      
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

    console.log(`メインタイムラインレイアウト完了: ${results.length}イベント`);
    return results;
  }

  /**
   * 全体のレイアウト実行
   */
  executeLayout(events, timelineAxes) {
    const allEvents = [];
    const eventGroups = [];

    console.log(`レイアウト実行開始: ${events.length}イベント, ${timelineAxes.length}年表`);

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
        TIMELINE_CONFIG.FIRST_ROW_Y
      );

      allEvents.push(...result.events);
      eventGroups.push(...result.groups);

      console.log(`年表「${timeline.name}」レイアウト完了: ${result.events.length}イベント, ${result.groups.length}グループ`);
    });

    console.log(`レイアウト実行完了: 合計 ${allEvents.length}イベント, ${eventGroups.length}グループ`);
    return { allEvents, eventGroups };
  }
}