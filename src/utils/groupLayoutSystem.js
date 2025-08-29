// src/utils/groupLayoutSystem.js - 統合グループ化システム（重なり回避・位置修正版）
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
    const eventWidth = this.getEventWidth(event);
    const margin = TIMELINE_CONFIG.EVENT_MARGIN || 15;
    
    // 新しいイベントの境界を計算
    const newLeft = eventX - eventWidth / 2;
    const newRight = eventX + eventWidth / 2;
    
    return tier.find(occupied => {
      const occupiedLeft = occupied.position.x - occupied.width / 2;
      const occupiedRight = occupied.position.x + occupied.width / 2;
      
      // X軸での重なり判定（マージンを含む）
      return !(newRight + margin < occupiedLeft || newLeft - margin > occupiedRight);
    });
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
   * 年表のイベントレイアウト計算（修正版：グループ化優先）
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

    // グループ候補の管理
    const groupEvents = new Set();
    const groupCandidates = [];

    // フェーズ1: 近接イベントのグループ化判定
    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const currentEvent = sortedEvents[i];
      const nextEvent = sortedEvents[i + 1];
      
      if (groupEvents.has(currentEvent.id) || groupEvents.has(nextEvent.id)) {
        continue;
      }

      const currentX = this.coordinates.getXFromYear(currentEvent.startDate?.getFullYear() || 2024);
      const nextX = this.coordinates.getXFromYear(nextEvent.startDate?.getFullYear() || 2024);
      const currentWidth = this.getEventWidth(currentEvent);
      const nextWidth = this.getEventWidth(nextEvent);
      
      // 重なり判定：実際のカード幅を使用
      const distance = Math.abs(nextX - currentX);
      const minRequiredDistance = (currentWidth + nextWidth) / 2 + TIMELINE_CONFIG.EVENT_MARGIN;
      
      if (distance < minRequiredDistance) {
        console.log(`📦 グループ化判定: "${currentEvent.title}" + "${nextEvent.title}" (距離: ${distance.toFixed(0)}px < 必要: ${minRequiredDistance.toFixed(0)}px)`);
        
        // 既存グループに追加するか新規グループ作成
        let addedToGroup = false;
        
        for (const group of groupCandidates) {
          if (group.events.includes(currentEvent)) {
            group.addEvent(nextEvent);
            groupEvents.add(nextEvent.id);
            addedToGroup = true;
            break;
          }
        }
        
        if (!addedToGroup) {
          const newGroup = new EventGroup([currentEvent, nextEvent], timeline.id);
          groupCandidates.push(newGroup);
          groupEvents.add(currentEvent.id);
          groupEvents.add(nextEvent.id);
          groups.set(newGroup.id, newGroup);
          console.log(`🆕 新規グループ作成: ${newGroup.id} (${newGroup.events.length}イベント)`);
        }
      }
    }

    // フェーズ2: 残りのイベントを3段システムで配置
    sortedEvents.forEach((event, index) => {
      // グループ化されたイベントはスキップ
      if (groupEvents.has(event.id)) {
        return;
      }

      const eventX = this.coordinates.getXFromYear(event.startDate?.getFullYear() || 2024);
      const eventWidth = this.getEventWidth(event);
      const eventHeight = this.getEventHeight(event);

      console.log(`  📌 イベント "${event.title}": X=${eventX.toFixed(0)}, 幅=${eventWidth}px`);

      // 段配置の決定（中段 → 上段 → 下段の優先順位）
      let tierIndex = 1; // デフォルトは中段
      let placed = false;

      const tierOrder = [1, 0, 2]; // 中段、上段、下段の順

      for (const tryTier of tierOrder) {
        const tierY = timelineY + (tryTier - 1) * TIMELINE_CONFIG.TIER_HEIGHT;
        
        // この段に配置可能かチェック（実際のイベント幅使用）
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

      // 配置失敗時の処理
      if (!placed) {
        console.warn(`⚠️ イベント「${event.title}」: 全段満杯のため中段に強制配置`);
        tierIndex = 1;
        const tierY = timelineY;
        tiers[1].push({
          event,
          position: { x: eventX, y: tierY },
          width: eventWidth,
          height: eventHeight
        });
      }

      // レイアウト結果を作成
      const finalY = timelineY + (tierIndex - 1) * TIMELINE_CONFIG.TIER_HEIGHT;
      const needsExtensionLine = tierIndex !== 1;

      results.push({
        ...event,
        adjustedPosition: { x: eventX, y: finalY },
        calculatedWidth: eventWidth,
        calculatedHeight: eventHeight,
        timelineColor: timeline.color || '#6b7280',
        tierIndex,
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

      console.log(`    📍 配置完了: Y=${finalY}, 延長線=${needsExtensionLine}`);
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
        
        // 位置とメタデータを更新（年表軸の少し上に配置）
        group.position = { x: centerX, y: timelineY - 20 };
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
    console.log('統合レイアウトシステム初期化完了（重なり回避・位置修正対応）');
  }

  /**
   * メインタイムラインのレイアウト（40%位置・上方向回避改善版）
   */
  layoutMainTimelineEvents(events, timelineAxes) {
    const results = [];
    // 40%位置に変更
    const baselineY = window.innerHeight * 0.4;
    
    // 年表に属さないイベントを抽出
    const ungroupedEvents = events.filter(event => 
      !event.timelineInfos?.length && 
      !timelineAxes.some(axis => 
        (axis.timeline?.eventIds?.includes(event.id)) ||
        (axis.eventIds?.includes(event.id))
      )
    );

    console.log(`メインタイムライン（40%位置）: ${ungroupedEvents.length}個のイベント`);

    // 配置済みイベントの記録（正確な境界情報）
    const occupiedPositions = [];
    
    // X座標でソート（左から右へ配置）
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
      
      // 上方向への段階的配置（正確な衝突判定）
      let finalY = baselineY;
      let placed = false;
      const maxTiers = TIMELINE_CONFIG.MAX_TIERS || 10;
      const tierHeight = TIMELINE_CONFIG.TIER_HEIGHT || 50;
      
      for (let tier = 0; tier < maxTiers; tier++) {
        const testY = baselineY - (tier * tierHeight);
        const testPosition = { x: eventX, y: testY };
        
        // 既存イベントとの衝突チェック（実際のイベント幅使用）
        let hasCollision = false;
        
        for (const occupied of occupiedPositions) {
          const margin = TIMELINE_CONFIG.EVENT_MARGIN || 15;
          const thisLeft = eventX - eventWidth / 2;
          const thisRight = eventX + eventWidth / 2;
          const occupiedLeft = occupied.position.x - occupied.bounds.width / 2;
          const occupiedRight = occupied.position.x + occupied.bounds.width / 2;
          
          // Y軸も考慮した衝突判定
          const yDistance = Math.abs(testY - occupied.position.y);
          const xOverlap = !(thisRight + margin < occupiedLeft || thisLeft - margin > occupiedRight);
          
          if (xOverlap && yDistance < eventHeight + margin) {
            hasCollision = true;
            console.log(`    衝突検出: "${occupied.event.title}" との重なり`);
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
        console.warn(`⚠️ メインイベント「${event.title}」: 全段が満杯のため最上段に強制配置`);
        finalY = baselineY - (maxTiers * tierHeight);
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

    console.log(`✅ メインタイムラインレイアウト完了: ${results.length}イベント (40%位置)`);
    return results;
  }

  /**
   * 全体のレイアウト実行
   */
  executeLayout(events, timelineAxes) {
    const allEvents = [];
    const eventGroups = [];

    console.log(`🎨 レイアウト実行開始: ${events.length}イベント, ${timelineAxes.length}年表`);
    console.log(`📏 正確なイベント幅計算・重なり回避システム使用`);

    // メインタイムラインのレイアウト（40%位置）
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