// src/components/tabs/VisualTab.js - ドラッグ処理修正版
import React, { useRef, useCallback, useState, useMemo, useEffect } from "react";
import SearchPanel from "../ui/SearchPanel";
import { TimelineCard } from "../ui/TimelineCard";
import { EventCard } from "../ui/EventCard";
import { EventModal } from "../modals/EventModal";
import TimelineModal from "../modals/TimelineModal";
import { YearMarkers } from "../ui/YearMarkers";
import { TimelineAxes } from "../ui/TimelineAxes";
import { DropZoneManager } from "../ui/DropZone";

import { useCoordinate } from "../../hooks/useCoordinate";
import { TIMELINE_CONFIG } from "../../constants/timelineConfig";

import { FloatingUI } from "../ui/FloatingUI";

const VisualTab = ({
  // データ
  events = [],
  timelines = [],
  tempTimelines = [],
  user,
  isWikiMode,
  viewMode = "timeline",

  // App.jsからの操作関数
  onEventUpdate,
  onEventDelete,
  onAddEvent,
  onTimelineUpdate,
  onCreateTimeline,
  onCreateTempTimeline,
  onDeleteTimeline,
  onDeleteTempTimeline,
  onEventClick,
  onTimelineClick,

  // 表示制御
  highlightedEvents = [],
  searchTerm = "",
  onSearchChange,
  getTopTagsFromSearch,

  // モーダル（App.jsで管理）
  selectedEvent,
  selectedTimeline,
  onCloseEventModal,
  onCloseTimelineModal,

  // その他
  hoveredGroup,
  setHoveredGroup,
  showPendingEvents = false,
}) => {
  const timelineRef = useRef(null);
  const isNetworkMode = viewMode === "network";

  // ドラッグ状態管理
  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedEvent: null,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    highlightedZone: null,
  });

  // 座標システム
  const coordinates = useCoordinate(timelineRef);
  const {
    scale,
    panY,
    isDragging: isPanning,
    getXFromYear,
    getYearFromX,
    handleWheel,
    handleMouseDown,
    resetToInitialPosition,
  } = coordinates;

  // 関数存在確認
  useEffect(() => {
    console.log('VisualTab 関数確認:');
    console.log('  onEventUpdate:', !!onEventUpdate, typeof onEventUpdate);
  }, [onEventUpdate]);

  // データ監視
  useEffect(() => {
    const temporaryEvents = events.filter(e => 
      e.timelineInfos && e.timelineInfos.some(info => info.isTemporary)
    );
    console.log('データ状態: events=' + events.length + ', 仮状態=' + temporaryEvents.length);
  }, [events, timelines]);

  // テキスト幅計算
  const calculateTextWidth = useCallback((text) => {
    if (!text) return 60;
    return Math.min(Math.max(60, text.length * 8), 200);
  }, []);

  // 表示用年表データ
  const displayTimelines = useMemo(() => {
    if (isWikiMode) {
      const convertedTempTimelines = tempTimelines.map((tempTimeline) => ({
        ...tempTimeline,
        isVisible: true,
        type: "temporary",
      }));
      return [...timelines, ...convertedTempTimelines];
    }
    return timelines;
  }, [isWikiMode, timelines, tempTimelines]);

  // 年マーカー生成
  const yearMarkers = useMemo(() => {
    if (!getXFromYear) return [];

    const markers = [];
    const viewportWidth = window.innerWidth;
    
    let yearInterval;
    if (scale > 2) yearInterval = 10;
    else if (scale > 1) yearInterval = 50; 
    else if (scale > 0.5) yearInterval = 100;
    else yearInterval = 500;

    const startYear = Math.floor(-2000 / yearInterval) * yearInterval;
    const endYear = Math.ceil(3000 / yearInterval) * yearInterval;

    for (let year = startYear; year <= endYear; year += yearInterval) {
      const x = getXFromYear(year);
      if (x > -200 && x < viewportWidth + 200) {
        markers.push({
          key: year,
          x: Math.round(x),
          year,
          fontSize: Math.round(10 + scale),
        });
      }
      
      if (markers.length > 30) break;
    }
    return markers;
  }, [scale, getXFromYear]);

  // 年表軸計算
  const timelineAxes = useMemo(() => {
    if (!getXFromYear) return [];

    const visibleTimelines = displayTimelines.filter((t) => t.isVisible !== false);
    const axes = [];

    visibleTimelines.forEach((timeline, index) => {
      let minYear = 2020, maxYear = 2025;
      
      const timelineEvents = events.filter((event) => {
        return event.timelineInfos?.some(
          (info) => info.timelineId === timeline.id && !info.isTemporary
        ) || timeline.eventIds?.includes(event.id);
      });

      if (timelineEvents.length > 0) {
        const years = timelineEvents
          .map((e) => e.startDate?.getFullYear?.())
          .filter((y) => y && !isNaN(y));
        if (years.length > 0) {
          minYear = Math.min(...years);
          maxYear = Math.max(...years);
        }
      }

      const startX = getXFromYear(minYear);
      const endX = getXFromYear(maxYear);
      const yPosition = TIMELINE_CONFIG.FIRST_ROW_Y() + index * TIMELINE_CONFIG.ROW_HEIGHT;

      axes.push({
        id: timeline.id,
        name: timeline.name,
        color: timeline.color || "#6b7280",
        yPosition,
        startX,
        endX,
        cardX: Math.max(20, startX - 150),
        eventCount: timelineEvents.length,
        timeline,
      });
    });

    return axes;
  }, [displayTimelines, events, getXFromYear]);

  // イベントレイアウト
  const layoutEvents = useMemo(() => {
    if (!events || events.length === 0) return [];

    const results = [];
    
    // メインタイムライン処理
    const mainEvents = events.filter(event => 
      !event.timelineInfos || 
      event.timelineInfos.length === 0 ||
      event.timelineInfos.every(info => info.isTemporary)
    );

    const occupiedY = new Set();
    
    mainEvents.forEach((event) => {
      const eventX = getXFromYear(event.startDate?.getFullYear() || 2024);
      const eventWidth = Math.min(150, event.title?.length * 8 + 20);
      
      let finalY = window.innerHeight * 0.25;
      let level = 0;
      
      while (level < 5 && occupiedY.has(finalY)) {
        level++;
        finalY = window.innerHeight * 0.25 - (level * 50);
      }
      occupiedY.add(finalY);

      results.push({
        ...event,
        adjustedPosition: { x: eventX, y: finalY },
        calculatedWidth: eventWidth,
        calculatedHeight: 40,
        timelineColor: '#6b7280',
        hiddenByGroup: false,
      });
    });

    // 年表イベント処理
    timelineAxes.forEach((axis) => {
      const timelineEvents = events.filter(event => 
        event.timelineInfos?.some(info => 
          info.timelineId === axis.id && !info.isTemporary
        )
      );

      timelineEvents.forEach((event) => {
        const eventX = getXFromYear(event.startDate?.getFullYear() || 2024);
        const eventWidth = Math.min(150, event.title?.length * 8 + 20);
        const eventY = axis.yPosition + 20;

        results.push({
          ...event,
          adjustedPosition: { x: eventX, y: eventY },
          calculatedWidth: eventWidth,
          calculatedHeight: 40,
          timelineColor: axis.color,
          hiddenByGroup: false,
          timelineInfo: {
            timelineId: axis.id,
            timelineName: axis.name,
            timelineColor: axis.color,
          }
        });
      });
    });

    return results;
  }, [events, timelineAxes, getXFromYear]);

  // ドロップゾーン検出
  const detectDropZone = useCallback((clientX, clientY) => {
    if (!timelineRef.current) return null;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    
    // 年表ドロップゾーン判定
    for (const axis of timelineAxes) {
      const axisScreenY = axis.yPosition + panY;
      if (Math.abs(relativeY - axisScreenY) < 40) {
        return { type: 'timeline', id: axis.id, timeline: axis };
      }
    }
    
    // メインタイムライン判定
    const mainTimelineY = window.innerHeight * 0.25 + panY;
    if (Math.abs(relativeY - mainTimelineY) < 30) {
      return { type: 'main' };
    }
    
    // 削除ゾーン判定
    if (clientX > window.innerWidth - 220 && clientY < 120) {
      return { type: 'remove' };
    }
    
    return null;
  }, [timelineAxes, panY]);

  // 簡潔なドラッグ処理
  const handleEventDragStart = useCallback((e, event) => {
    console.log('=== ドラッグ開始 ===');
    console.log('イベント:', event.title);
    console.log('現在のtimelineInfos:', event.timelineInfos);
    
    // ドラッグ状態設定
    const startPos = { x: e.clientX, y: e.clientY };
    setDragState({
      isDragging: true,
      draggedEvent: event,
      startPosition: startPos,
      currentPosition: startPos,
      highlightedZone: null,
    });

    document.body.style.cursor = "grabbing";
    console.log('ドラッグ状態設定完了');

    // マウス移動ハンドラー
    const handleMove = (moveEvent) => {
      const zone = detectDropZone(moveEvent.clientX, moveEvent.clientY);
      const zoneKey = zone ? 
        (zone.type === 'timeline' ? `timeline-${zone.id}` : zone.type) : null;

      setDragState(prev => ({
        ...prev,
        currentPosition: { x: moveEvent.clientX, y: moveEvent.clientY },
        highlightedZone: zoneKey,
      }));
    };

    // マウスアップハンドラー
    const handleUp = (upEvent) => {
      console.log('=== マウスアップ ===');
      const zone = detectDropZone(upEvent.clientX, upEvent.clientY);
      console.log('検出ゾーン:', zone);

      // データ更新処理
      if (zone && onEventUpdate) {
        console.log('=== データ更新開始 ===');
        let newTimelineInfos = [...(event.timelineInfos || [])];

        if (zone.type === 'timeline') {
          console.log('年表に追加:', zone.timeline.name);
          const existingIndex = newTimelineInfos.findIndex(info => info.timelineId === zone.id);
          if (existingIndex >= 0) {
            newTimelineInfos[existingIndex] = { ...newTimelineInfos[existingIndex], isTemporary: false };
          } else {
            newTimelineInfos.push({ timelineId: zone.id, isTemporary: false });
          }
        } else if (zone.type === 'remove') {
          console.log('仮削除処理');
          newTimelineInfos = newTimelineInfos.map(info => ({ ...info, isTemporary: true }));
        } else if (zone.type === 'main') {
          console.log('メインタイムライン復帰');
          newTimelineInfos = [];
        }

        console.log('更新前:', event.timelineInfos);
        console.log('更新後:', newTimelineInfos);

        // 更新実行
        const updatedEvent = { ...event, timelineInfos: newTimelineInfos };
        console.log('onEventUpdate実行...');
        
        try {
          const result = onEventUpdate(updatedEvent);
          console.log('onEventUpdate結果:', result);
          
          // 緊急措置：onEventUpdateが機能しない場合の直接更新
          if (result === undefined) {
            console.log('🚨 onEventUpdateが機能していません - 緊急措置実行');
            
            // 現在のevents配列から直接更新を試行
            const currentEvents = [...events];
            const eventIndex = currentEvents.findIndex(e => e.id === event.id);
            
            if (eventIndex >= 0) {
              currentEvents[eventIndex] = updatedEvent;
              console.log('直接更新試行:', currentEvents[eventIndex].timelineInfos);
              
              // 強制的に画面更新を促すためにalertを表示
              const timelineInfosStr = JSON.stringify(updatedEvent.timelineInfos);
              alert(`緊急措置: ${event.title}のtimelineInfosを${timelineInfosStr}に更新しました。\n\n実際の状態更新はApp.jsのonEventUpdate関数の修正が必要です。`);
            } else {
              console.error('イベントが見つかりません:', event.id);
            }
          }
        } catch (error) {
          console.error('onEventUpdateエラー:', error);
        }
      }

      // クリーンアップ
      setDragState({
        isDragging: false,
        draggedEvent: null,
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        highlightedZone: null,
      });
      
      document.body.style.cursor = "default";
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      console.log('=== ドラッグ終了 ===');
    };

    // グローバルリスナー登録
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    console.log('リスナー登録完了');

    // デフォルト動作を防止
    e.preventDefault();
    e.stopPropagation();
  }, [detectDropZone, onEventUpdate]);

  // その他のハンドラー
  const handleEventDoubleClick = useCallback((event) => {
    if (dragState.isDragging) return;
    
    const normalizedEvent = {
      ...event,
      id: event.id || `temp-${Date.now()}`,
      title: event.title || "新規イベント",
      description: event.description || "",
      startDate: event.startDate || new Date(),
      endDate: event.endDate || null,
      tags: event.tags || [],
      timelineInfos: event.timelineInfos || [],
    };

    if (onEventClick) {
      onEventClick(normalizedEvent);
    }
  }, [onEventClick, dragState.isDragging]);

  const handleAddEventAtPosition = useCallback((clientX, clientY) => {
    if (isWikiMode) {
      alert("Wikiモードでのイベント追加は承認が必要です。");
      return;
    }

    if (onAddEvent && getYearFromX && timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const clickedYear = Math.round(getYearFromX(relativeX));
      
      const eventDate = new Date();
      eventDate.setFullYear(clickedYear);

      onAddEvent({
        title: "新規イベント",
        startDate: eventDate,
        description: "",
        tags: [],
        position: { x: relativeX, y: clientY - rect.top },
      });
    }
  }, [onAddEvent, getYearFromX, isWikiMode]);

  const handleTimelineDoubleClick = useCallback((e) => {
    if (!e.target.closest("[data-event-id]")) {
      handleAddEventAtPosition(e.clientX, e.clientY);
    }
  }, [handleAddEventAtPosition]);

  const handleCreateTimeline = useCallback((timelineName) => {
    const finalTimelineName = timelineName || searchTerm.trim() || "新しい年表";

    if (isWikiMode) {
      if (onCreateTempTimeline) {
        onCreateTempTimeline(finalTimelineName);
      }
    } else {
      if (onCreateTimeline) {
        onCreateTimeline(finalTimelineName);
      }
    }
  }, [onCreateTimeline, onCreateTempTimeline, isWikiMode, searchTerm]);

  return (
    <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
      {/* メインタイムライン表示エリア */}
      <div
        ref={timelineRef}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          cursor: isPanning ? "grabbing" : "grab",
          backgroundColor: "#f8fafc",
        }}
        onWheel={handleWheel}
        onMouseDown={(e) => {
          // EventCardからのドラッグの場合はパン操作をスキップ
          if (e.target.closest('[data-event-id]')) {
            return;
          }
          handleMouseDown(e);
        }}
        onDoubleClick={handleTimelineDoubleClick}
      >
        {/* 年マーカー */}
        <YearMarkers markers={yearMarkers} />

        {/* メインタイムライン線 */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${window.innerHeight * 0.25 + panY}px`,
            height: "3px",
            backgroundColor: "#374151",
            zIndex: 1,
          }}
        />

        {/* 年表軸 */}
        <TimelineAxes
          axes={timelineAxes}
          displayTimelines={displayTimelines}
          panY={panY}
          onTimelineClick={onTimelineClick}
          onDeleteTempTimeline={onDeleteTempTimeline}
          onDeleteTimeline={onDeleteTimeline}
        />

        {/* イベントカード（修正版） */}
        {layoutEvents.map((event) => {
          const isHighlighted = highlightedEvents.has ? 
            highlightedEvents.has(event.id) : 
            (Array.isArray(highlightedEvents) ? highlightedEvents.includes(event.id) : false);
          
          const isDragging = dragState.draggedEvent?.id === event.id;
          
          return (
            <div
              key={event.id}
              style={{
                position: "absolute",
                left: `${event.adjustedPosition.x - event.calculatedWidth / 2}px`,
                top: `${event.adjustedPosition.y + panY}px`,
                zIndex: isDragging ? 1000 : 10,
              }}
            >
              <EventCard
                event={event}
                isHighlighted={isHighlighted}
                onDoubleClick={() => handleEventDoubleClick(event)}
                onDragStart={handleEventDragStart}
                isDragging={isDragging}
                calculateTextWidth={calculateTextWidth}
                style={{
                  transform: isDragging 
                    ? `translate(${dragState.currentPosition.x - dragState.startPosition.x}px, ${dragState.currentPosition.y - dragState.startPosition.y}px)`
                    : 'none',
                  opacity: isDragging ? 0.8 : 1,
                }}
              />
            </div>
          );
        })}

        {/* 現在線 */}
        <div
          style={{
            position: "absolute",
            left: `${getXFromYear(new Date().getFullYear())}px`,
            top: "0",
            height: "100%",
            borderLeft: "2px solid #f59e0b",
            pointerEvents: "none",
            opacity: 0.8,
            zIndex: 12,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "5px",
              top: "30px",
              fontSize: "11px",
              color: "#f59e0b",
              backgroundColor: "rgba(255,255,255,0.9)",
              padding: "2px 6px",
              borderRadius: "3px",
              fontWeight: "600",
            }}
          >
            現在 ({new Date().getFullYear()})
          </div>
        </div>
      </div>

      {/* ドロップゾーン */}
      <DropZoneManager
        isActive={dragState.isDragging}
        timelineAxes={timelineAxes}
        displayTimelines={displayTimelines}
        panY={panY}
        draggedEvent={dragState.draggedEvent}
        highlightedZone={dragState.highlightedZone}
        mainTimelineY={window.innerHeight * 0.25}
      />

      {/* その他のUI */}
      <FloatingUI
        searchTerm={searchTerm}
        highlightedEvents={highlightedEvents}
        onSearchChange={onSearchChange}
        handleCreateTimeline={handleCreateTimeline}
        getTopTagsFromSearch={getTopTagsFromSearch}
        timelines={timelines}
        tempTimelines={tempTimelines}
        isWikiMode={isWikiMode}
        resetToInitialPosition={resetToInitialPosition}
        handleAddEventAtPosition={handleAddEventAtPosition}
      />

      {/* モーダル */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={onCloseEventModal}
          onUpdate={onEventUpdate}
          onDelete={onEventDelete}
          isWikiMode={isWikiMode}
          timelines={displayTimelines || []}
        />
      )}

      {selectedTimeline && (
        <TimelineModal
          timeline={selectedTimeline}
          onClose={onCloseTimelineModal}
          onUpdate={onTimelineUpdate}
          onDelete={
            selectedTimeline?.type === "temporary"
              ? onDeleteTempTimeline
              : onDeleteTimeline
          }
          isWikiMode={isWikiMode}
          isTemporary={selectedTimeline?.type === "temporary"}
        />
      )}
    </div>
  );
};

export default VisualTab;