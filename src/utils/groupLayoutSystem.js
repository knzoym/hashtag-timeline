// src/utils/groupLayoutSystem.js - 統合グループ化システム（正確なサイズ計算対応）
import { TIMELINE_CONFIG } from "../constants/timelineConfig";
import { calculateEventWidth, calculateEventHeight, getEventBounds, checkEventCollision, checkMultipleCollisions } from './eventSizeUtils';

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
 * 3段レイアウトシステム（正確なサイズ計算対応）
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
    
    return tier.find(occupied => 
      checkEventCollision(
        event, 
        newPosition, 
        occupied.event, 
        occupied.position, 
        this.calculateTextWidth, 
        TIMELINE_CONFIG.EVENT_MARGIN
      )
    );
  }

  /**
   * イベント幅の計算（統一関数使用）
   */
  getEventWidth(event) {
    return calculateEventWidth(event, this.calculateTextWidth);
  }

  /**
   * イベント高さの計算（統一関数使用）
   */
  getEventHeight(event) {
    return calculateEventHeight(event);
  }

  /**
   * 年表のイベントレイアウト計算（修正版：適切なグループ化対応）
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

    console.log(`📋 年表「${timeline.name}」のレイアウト開始: ${timelineEvents.length}個のイベント`);

    // 時系列順にソート
    const sortedEvents = [...timelineEvents].sort((a, b) => {
      const aYear = a.startDate ? a.startDate.getFullYear() : 0;
      const bYear = b.startDate ? b.startDate.getFullYear() : 0;
      return aYear - bYear;
    });

    // 年表軸のY座標
    const timelineY = baseY + timelineIndex * TIMELINE_CONFIG.ROW_HEIGHT;
    
    // 3段システムの初期化（各段に配置されたイベント情報を記録）
    const tiers = [
      [], // 上段
      [], // 中段（軸上）
      []  // 下段
    ];

    // グループ候補の管理（近接イベントをグループ化）
    let currentGroup = null;
    const groupEvents = new Set(); // グループ化されたイベントのトラッキング

    // 各イベントの配置処理
    sortedEvents.forEach((event, index) => {
      const eventX = this.coordinates.getXFromYear(event.startDate?.getFullYear() || 2024);
      const eventWidth = this.getEventWidth(event);
      const eventHeight = this.getEventHeight(event);

      console.log(`  📌 イベント "${event.title}": X=${eventX.toFixed(0)}, 幅=${eventWidth}px`);

      // 段配置の決定（中段 → 上段 → 下段の優先順位）
      let tierIndex = 1; // デフォルトは中段
      let placed = false;
      let needsGrouping = false;

      const tierOrder = [1, 0, 2]; // 中段、上段、下段の順

      for (const tryTier of tierOrder) {
        const tierY = timelineY + (tryTier - 1) * TIMELINE_CONFIG.TIER_HEIGHT;
        
        // この段に配置可能かチェック（正確な衝突判定）
        const collision = this.checkTierCollision(tiers[tryTier], event, eventX, tierY);
        
        if (!collision) {
          tierIndex = tryTier;
          placed = true;
          
          // 段に配置情報を記録
          tiers[tryTier].push({
            event,
            position: { x: eventX, y: tierY },
            width: eventWidth,
            height: eventHeight
          });
          console.log(`    ✅ 段 ${tryTier} に配置成功`);
          break;
        } else {
          console.log(`    ❌ 段 ${tryTier} は衝突: ${collision.event.title}`);
        }
      }

      // 3段すべてが満杯の場合はグループ化が必要
      if (!placed) {
        console.log(`    🔄 全段満杯 → グループ化処理開始`);
        needsGrouping = true;
        
        // 最も近い既存イベントを探してグループ化
        let closestEvent = null;
        let minDistance = Infinity;
        
        // 中段（軸上）の既存イベントから最も近いものを探す
        tiers[1].forEach(occupied => {
          const distance = Math.abs(eventX - occupied.position.x);
          if (distance < minDistance) {
            minDistance = distance;
            closestEvent = occupied.event;
          }
        });
        
        if (closestEvent && minDistance <= TIMELINE_CONFIG.GROUP_THRESHOLD) {
          // 近接イベントとグループ化
          const groupKey = `${timeline.id}_${closestEvent.id}`;
          
          if (groups.has(groupKey)) {
            // 既存グループに追加
            groups.get(groupKey).addEvent(event);
            console.log(`    📦 既存グループに追加: "${event.title}"`);
          } else {
            // 新規グループ作成
            const newGroup = new EventGroup([closestEvent, event], timeline.id);
            groups.set(groupKey, newGroup);
            
            // 元のイベントもグループ化済みとしてマーク
            groupEvents.add(closestEvent.id);
            console.log(`    🆕 新規グループ作成: "${closestEvent.title}" + "${event.title}"`);
          }
          
          // このイベントをグループ化済みとしてマーク
          groupEvents.add(event.id);
        } else {
          // グループ化できない場合は強制的に中段に配置
          console.log(`    ⚠️ グループ化不可 → 中段に強制配置`);
          tierIndex = 1;
          const tierY = timelineY;
          tiers[1].push({
            event,
            position: { x: eventX, y: tierY },
            width: eventWidth,
            height: eventHeight
          });
          placed = true;
        }
      }

      // 配置されたイベントのレイアウト結果を作成
      if (placed && !needsGrouping) {
        const finalY = timelineY + (tierIndex - 1) * TIMELINE_CONFIG.TIER_HEIGHT;
        const needsExtensionLine = tierIndex !== 1;

        const layoutResult = {
          ...event,
          adjustedPosition: { x: eventX, y: finalY },
          calculatedWidth: eventWidth,
          calculatedHeight: eventHeight,
          timelineColor: timeline.color || '#6b7280',
          tierIndex,
          needsExtensionLine,
          hiddenByGroup: groupEvents.has(event.id), // グループ化されている場合は非表示
          timelineInfo: {
            timelineId: timeline.id,
            timelineName: timeline.name,
            timelineColor: timeline.color,
            needsExtensionLine
          }
        };

        results.push(layoutResult);
        console.log(`    📍 配置完了: Y=${finalY}, 延長線=${needsExtensionLine}, 非表示=${layoutResult.hiddenByGroup}`);
      }
    });

    // グループ化されたイベントを結果から適切にマーク
    results.forEach(result => {
      if (groupEvents.has(result.id)) {
        result.hiddenByGroup = true;
        console.log(`    🙈 グループ化により非表示: "${result.title}"`);
      }
    });

    // グループの最終処理
    const finalGroups = this.finalizeGroups(Array.from(groups.values()), timelineY);

    console.log(`✅ 年表「${timeline.name}」レイアウト完了: ${results.length}イベント, ${finalGroups.length}グループ`);
    
    return {
      events: results,
      groups: finalGroups
    };
  }

  /**
   * グループの最終処理（修正版：正確な境界ボックス使用）
   */
  finalizeGroups(groups, timelineY) {
    const finalGroups = [];

    console.log(`🔄 グループ最終処理開始: ${groups.length}個のグループ候補`);

    groups.forEach((group, index) => {
      console.log(`📦 グループ ${index}: ${group.events.length}イベント`);
      
      if (group.events.length >= (TIMELINE_CONFIG.MIN_GROUP_SIZE || 2)) {
        // グループ内イベントを年順にソート
        const sortedEvents = [...group.events].sort((a, b) => {
          const aYear = a.startDate ? a.startDate.getFullYear() : 0;
          const bYear = b.startDate ? b.startDate.getFullYear() : 0;
          return aYear - bYear;
        });
        
        // 最早と最遅のイベント
        const earliestEvent = sortedEvents[0];
        const latestEvent = sortedEvents[sortedEvents.length - 1];
        
        console.log(`   最早: "${earliestEvent.title}" (${earliestEvent.startDate?.getFullYear()})`);
        console.log(`   最遅: "${latestEvent.title}" (${latestEvent.startDate?.getFullYear()})`);
        
        // 各々のX座標を計算
        const earliestX = this.coordinates.getXFromYear(
          earliestEvent.startDate?.getFullYear() || 2024
        );
        const latestX = this.coordinates.getXFromYear(
          latestEvent.startDate?.getFullYear() || 2024
        );
        
        // 中間位置をグループ位置とする
        const centerX = (earliestX + latestX) / 2;
        
        console.log(`   位置計算: 左端=${earliestX.toFixed(0)}, 右端=${latestX.toFixed(0)}, 中心=${centerX.toFixed(0)}`);
        
        // グループの年表色を設定（最初のイベントの年表色を使用）
        const timelineColor = earliestEvent.timelineInfo?.timelineColor || 
                             earliestEvent.timelineColor || 
                             '#6b7280';
        
        // 位置とメタデータを更新
        group.position = { x: centerX, y: timelineY + 80 };
        group.timelineColor = timelineColor;
        group.timelineId = group.timelineId;
        
        finalGroups.push(group);
        console.log(`✅ グループ最終化: 位置=(${group.position.x.toFixed(0)}, ${group.position.y}), 色=${timelineColor}`);
        
      } else {
        console.log(`⚠️ グループ除外 (サイズ不足): ${group.events.length}個`);
      }
    });

    console.log(`✅ グループ最終処理完了: ${finalGroups.length}個のグループを生成`);
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
    console.log('統合レイアウトシステム初期化完了（正確なサイズ計算対応）');
  }

  /**
   * メインタイムラインのレイアウト（正確な干渉判定対応）
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

    // 配置済みイベントの記録（正確な境界情報）
    const occupiedPositions = [];
    
    ungroupedEvents.forEach(event => {
      const eventX = this.coordinates.getXFromYear(event.startDate?.getFullYear() || 2024);
      const eventWidth = calculateEventWidth(event, this.calculateTextWidth);
      const eventHeight = calculateEventHeight(event);
      
      console.log(`  メインイベント "${event.title}": X=${eventX.toFixed(0)}, 実際の幅=${eventWidth}px`);
      
      // 上方向への段階的配置（正確な衝突判定）
      let finalY = baselineY;
      let placed = false;
      
      for (let tier = 0; tier < TIMELINE_CONFIG.MAX_TIERS; tier++) {
        const testY = baselineY - (tier * TIMELINE_CONFIG.TIER_HEIGHT);
        const testPosition = { x: eventX, y: testY };
        
        // 既存イベントとの衝突チェック
        const collisionResult = checkMultipleCollisions(
          event, 
          testPosition, 
          occupiedPositions.map(occupied => ({
            event: occupied.event,
            position: occupied.position
          })), 
          this.calculateTextWidth,
          TIMELINE_CONFIG.EVENT_MARGIN
        );
        
        if (!collisionResult.hasCollision) {
          finalY = testY;
          occupiedPositions.push({
            event,
            position: testPosition,
            bounds: getEventBounds(event, testPosition, this.calculateTextWidth)
          });
          placed = true;
          console.log(`    配置成功: 段=${tier}, Y=${finalY}`);
          break;
        }
      }
      
      if (!placed) {
        console.warn(`⚠️ メインイベント「${event.title}」: 全段が満杯のため最上段に強制配置`);
        finalY = baselineY - (TIMELINE_CONFIG.MAX_TIERS * TIMELINE_CONFIG.TIER_HEIGHT);
        occupiedPositions.push({
          event,
          position: { x: eventX, y: finalY },
          bounds: getEventBounds(event, { x: eventX, y: finalY }, this.calculateTextWidth)
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

    console.log(`✅ メインタイムラインレイアウト完了: ${results.length}イベント`);
    return results;
  }

  /**
   * 全体のレイアウト実行
   */
  executeLayout(events, timelineAxes) {
    const allEvents = [];
    const eventGroups = [];

    console.log(`🎨 レイアウト実行開始: ${events.length}イベント, ${timelineAxes.length}年表`);
    console.log(`📏 統一サイズ計算システム使用`);

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

    console.log(`✅ レイアウト実行完了: 合計 ${allEvents.length}イベント, ${eventGroups.length}グループ`);
    return { allEvents, eventGroups };
  }
}