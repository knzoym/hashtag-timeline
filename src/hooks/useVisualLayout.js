// src/hooks/useVisualLayout.js - 座標依存修正版
import { useMemo, useCallback, useRef } from 'react';
import { TIMELINE_CONFIG } from '../constants/timelineConfig';

export const useVisualLayout = (
  events,
  timelines,
  coordinates,
  viewMode = "timeline"
) => {
  const isNetworkMode = viewMode === "network";
  
  // 安定化のためのref（データのみ）
  const stableEventsRef = useRef(events);
  const stableTimelinesRef = useRef(timelines);
  
  // データが実際に変更された時のみ更新
  if (JSON.stringify(events) !== JSON.stringify(stableEventsRef.current)) {
    stableEventsRef.current = events;
  }
  if (JSON.stringify(timelines) !== JSON.stringify(stableTimelinesRef.current)) {
    stableTimelinesRef.current = timelines;
  }

  // テキスト幅計算（メモ化）
  const calculateTextWidth = useCallback((text) => {
    if (!text) return 60;
    return Math.min(Math.max(60, text.length * 8), 200);
  }, []);

  // 年マーカー生成（座標計算を復元）
  const yearMarkers = useMemo(() => {
    if (!coordinates?.getXFromYear || !coordinates?.scale) {
      console.warn('座標変換関数が利用できません');
      return [];
    }

    const markers = [];
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    
    // 表示範囲を動的に計算
    const leftYear = Math.floor(coordinates.getYearFromX(-200));
    const rightYear = Math.ceil(coordinates.getYearFromX(viewportWidth + 200));
    
    // 適切な間隔でマーカーを生成
    const yearInterval = Math.max(100, Math.floor(1000 / coordinates.scale));
    const startYear = Math.floor(leftYear / yearInterval) * yearInterval;
    const endYear = Math.ceil(rightYear / yearInterval) * yearInterval;
    
    for (let year = startYear; year <= endYear; year += yearInterval) {
      const x = coordinates.getXFromYear(year);
      if (x >= -200 && x <= viewportWidth + 200) {
        markers.push({
          id: year,
          x,
          year,
          fontSize: Math.max(8, Math.min(14, 10 + coordinates.scale))
        });
      }
      
      // マーカー数制限（パフォーマンス保護）
      if (markers.length > 50) break;
    }
    
    console.log('年マーカー生成:', markers.length, '個');
    return markers;
  }, [coordinates?.scale, coordinates?.panX, coordinates?.getXFromYear, coordinates?.getYearFromX]);

  // 年表軸データ生成（座標計算を復元）
  const timelineAxes = useMemo(() => {
    if (!timelines || !coordinates?.getXFromYear) {
      console.warn('年表軸生成: 必要なデータが不足');
      return [];
    }
    
    const axes = [];
    const visibleTimelines = timelines.filter(t => t.isVisible !== false);
    
    visibleTimelines.forEach((timeline, index) => {
      // 年表に属するイベントを検索（修正：eventsArrayも追加検索）
      const timelineEvents = events.filter(event => 
        event.timelineInfos?.some(info => 
          info.timelineId === timeline.id && !info.isTemporary
        ) || 
        timeline.eventIds?.includes(event.id) || // 新規：eventIds配列もチェック
        timeline.events?.includes(event.id)      // 既存：events配列もチェック
      );
      
      // イベントがない場合でも年表カードを表示（修正）
      console.log(`年表 "${timeline.name}": ${timelineEvents.length}イベント`, timeline.eventIds);
      
      // 年範囲計算（イベントがない場合はデフォルト範囲）
      let minYear, maxYear;
      
      if (timelineEvents.length > 0) {
        const years = timelineEvents
          .map(e => e.startDate?.getFullYear?.() || 2000)
          .filter(y => y && !isNaN(y));
        
        if (years.length > 0) {
          minYear = Math.min(...years);
          maxYear = Math.max(...years);
        } else {
          minYear = 2020;
          maxYear = 2025;
        }
      } else {
        // イベントがない場合の初期範囲
        minYear = 2020;
        maxYear = 2025;
      }
      
      // 座標計算（修復）
      const startX = coordinates.getXFromYear(minYear);
      const endX = coordinates.getXFromYear(maxYear);
      const baseY = TIMELINE_CONFIG.FIRST_ROW_Y + index * 120;
      
      axes.push({
        id: timeline.id,
        name: timeline.name,
        color: timeline.color || '#6b7280',
        yPosition: baseY + 60,
        startX,
        endX,
        minYear,
        maxYear,
        cardX: Math.max(20, startX - 120),
        eventCount: timelineEvents.length
      });
      
      console.log(`年表軸生成: "${timeline.name}" (${timelineEvents.length}イベント) X範囲: ${startX.toFixed(0)} - ${endX.toFixed(0)}`);
    });
    
    return axes;
  }, [timelines, events, coordinates?.getXFromYear]);

  // イベントレイアウト処理（行・段システム統合）
  const layoutEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    if (!coordinates?.getXFromYear) {
      console.warn('イベントレイアウト: 座標変換関数が利用できません');
      return [];
    }

    const results = [];
    const timelineRows = []; // 年表行データ
    
    console.log('行・段システム レイアウト計算開始');

    // 年表ごとに行を割り当て
    timelines.forEach((timeline, timelineIndex) => {
      if (!timeline.isVisible) return;

      const rowY = TIMELINE_CONFIG.FIRST_ROW_Y + timelineIndex * 120;
      const rowData = {
        id: timeline.id,
        name: timeline.name,
        color: timeline.color,
        yPosition: rowY,
        tiers: [[], [], []] // 3段の占有情報
      };

      // 年表に属するイベントを抽出
      const timelineEvents = events.filter(event => 
        event.timelineInfos?.some(info => 
          info.timelineId === timeline.id && !info.isTemporary
        ) || 
        timeline.eventIds?.includes(event.id)
      );

      console.log(`年表「${timeline.name}」: ${timelineEvents.length}イベント`);

      // 年表内イベントを時系列順にソート
      const sortedEvents = [...timelineEvents].sort((a, b) => {
        const aYear = a.startDate ? a.startDate.getFullYear() : 0;
        const bYear = b.startDate ? b.startDate.getFullYear() : 0;
        return aYear - bYear;
      });

      // 各イベントを3段システムで配置
      sortedEvents.forEach(event => {
        const eventX = event.startDate ? 
          coordinates.getXFromYear(event.startDate.getFullYear()) : 0;
        const textWidth = calculateTextWidth(event.title);
        const eventWidth = Math.max(60, textWidth + 20);

        // 段配置決定（中段→上段→下段）
        let tierIndex = 1; // 中段から開始
        let placed = false;

        for (const tryTier of [1, 0, 2]) {
          if (canPlaceInTier(rowData.tiers[tryTier], eventX, eventWidth)) {
            tierIndex = tryTier;
            placed = true;
            
            // 占有情報を記録
            rowData.tiers[tryTier].push({
              x: eventX,
              width: eventWidth,
              startX: eventX - eventWidth / 2,
              endX: eventX + eventWidth / 2
            });
            break;
          }
        }

        if (!placed) {
          console.warn(`イベント「${event.title}」: 配置できませんでした`);
          tierIndex = 1; // 強制的に中段に配置
        }

        // 最終位置計算
        const eventY = rowY + 20 + tierIndex * 40; // 行内での段位置
        const needsExtensionLine = tierIndex !== 1; // 中段以外は延長線

        results.push({
          ...event,
          adjustedPosition: { x: eventX, y: eventY },
          calculatedWidth: eventWidth,
          timelineColor: timeline.color || '#6b7280',
          tierIndex,
          rowIndex: timelineIndex,
          needsExtensionLine,
          timelineInfo: {
            timelineId: timeline.id,
            timelineName: timeline.name,
            timelineColor: timeline.color
          }
        });
      });

      timelineRows.push(rowData);
    });

    // メインタイムライン（年表に属さないイベント）
    const ungroupedEvents = events.filter(event => 
      !event.timelineInfos || event.timelineInfos.length === 0
    );

    ungroupedEvents.forEach(event => {
      const eventX = event.startDate ? 
        coordinates.getXFromYear(event.startDate.getFullYear()) : 0;
      const textWidth = calculateTextWidth(event.title);
      const eventWidth = Math.max(60, textWidth + 20);
      
      results.push({
        ...event,
        adjustedPosition: { x: eventX, y: TIMELINE_CONFIG.MAIN_TIMELINE_Y },
        calculatedWidth: eventWidth,
        timelineColor: '#6b7280',
        tierIndex: null,
        rowIndex: null,
        needsExtensionLine: false,
        timelineInfo: null
      });
    });

    console.log('行・段レイアウト完了:', results.length, 'イベント');
    return results;
  }, [events, timelines, calculateTextWidth, coordinates?.getXFromYear]);

  // 段配置チェック関数
  const canPlaceInTier = (tier, eventX, eventWidth) => {
    const eventStart = eventX - eventWidth / 2;
    const eventEnd = eventX + eventWidth / 2;
    const gap = 15;

    return !tier.some(occupied => 
      !(eventEnd + gap < occupied.startX || eventStart - gap > occupied.endX)
    );
  };

  // ネットワーク接続線データ生成
  const networkConnections = useMemo(() => {
    if (!isNetworkMode || !timelines || !layoutEvents) return [];
    
    const connections = [];
    
    timelines.forEach(timeline => {
      if (!timeline.isVisible) return;

      const connectionPoints = layoutEvents
        .filter(eventPos => 
          eventPos.timelineInfos?.some(info =>
            info.timelineId === timeline.id && !info.isTemporary
          )
        )
        .map(eventPos => ({
          x: eventPos.adjustedPosition.x,
          y: eventPos.adjustedPosition.y + TIMELINE_CONFIG.EVENT_HEIGHT / 2
        }));

      if (connectionPoints.length > 1) {
        connections.push({
          id: timeline.id,
          name: timeline.name,
          color: timeline.color,
          points: connectionPoints.slice(0, 20) // 接続数制限
        });
      }
    });

    return connections;
  }, [isNetworkMode, timelines, layoutEvents]);

  // メインタイムライン線データ
  const mainTimelineLine = useMemo(() => ({
    y: TIMELINE_CONFIG.MAIN_TIMELINE_Y || 200,
    width: "3px",
    color: "#374151"
  }), []);

  // デバッグ情報
  console.log('useVisualLayout render:', {
    eventsCount: events?.length || 0,
    timelinesCount: timelines?.length || 0,
    layoutEventsCount: layoutEvents?.length || 0,
    axesCount: timelineAxes?.length || 0,
    markersCount: yearMarkers?.length || 0,
    scale: coordinates?.scale?.toFixed(2),
    panX: coordinates?.panX?.toFixed(0),
    coordinatesAvailable: !!coordinates?.getXFromYear
  });

  return {
    layoutEvents,
    timelineAxes,
    networkConnections,
    yearMarkers,
    mainTimelineLine,
    layoutInfo: {
      isNetworkMode,
      eventsCount: events?.length || 0,
      timelinesCount: timelines?.length || 0,
      visibleTimelines: timelines?.filter(t => t.isVisible !== false).length || 0
    }
  };
};