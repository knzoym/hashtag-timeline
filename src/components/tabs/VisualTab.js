// src/components/tabs/VisualTab.js - 軽量・単純ドラッグ版（パン競合あり）
import React, { useRef, useCallback, useState, useMemo } from "react";
import SearchPanel from "../ui/SearchPanel";
import { TimelineCard } from "../ui/TimelineCard";
import { EventCard } from "../ui/EventCard";
import { EventModal } from "../modals/EventModal";
import TimelineModal from "../modals/TimelineModal";
import { YearMarkers } from "../ui/YearMarkers";
import { TimelineAxes } from "../ui/TimelineAxes";

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

  // 単純なドラッグ状態管理
  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedEvent: null,
    startY: 0,
    currentY: 0,
  });

  // 座標システム
  const coordinates = useCoordinate(timelineRef);
  const {
    scale,
    panY,
    isDragging,
    getXFromYear,
    getYearFromX,
    handleWheel,
    handleMouseDown,
    resetToInitialPosition,
  } = coordinates;

  // 軽量テキスト幅計算
  const calculateTextWidth = useCallback((text) => {
    if (!text) return 60;
    return Math.min(Math.max(60, text.length * 8), 200);
  }, []);

  // 表示用年表データ（軽量版）
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

  // 軽量年マーカー生成（再計算を大幅削減）
  const yearMarkers = useMemo(() => {
    if (!getXFromYear) return [];

    const markers = [];
    const viewportWidth = window.innerWidth;
    
    // スケール判定を単純化（小数点計算を削除）
    let yearInterval;
    if (scale > 2) yearInterval = 10;
    else if (scale > 1) yearInterval = 50; 
    else if (scale > 0.5) yearInterval = 100;
    else yearInterval = 500;

    // 範囲を制限してループ回数削減
    const startYear = Math.floor(-2000 / yearInterval) * yearInterval;
    const endYear = Math.ceil(3000 / yearInterval) * yearInterval;

    for (let year = startYear; year <= endYear; year += yearInterval) {
      const x = getXFromYear(year);
      if (x > -200 && x < viewportWidth + 200) {
        markers.push({
          key: year,
          x: Math.round(x), // 小数点計算削除
          year,
          fontSize: Math.round(10 + scale), // 小数点計算削除
        });
      }
      
      // マーカー数制限（パフォーマンス保護）
      if (markers.length > 30) break;
    }
    return markers;
  }, [scale, getXFromYear]); // 不要な依存関係削除

  // 軽量年表軸計算
  const timelineAxes = useMemo(() => {
    if (!getXFromYear) return [];

    const visibleTimelines = displayTimelines.filter((t) => t.isVisible !== false);
    const axes = [];

    visibleTimelines.forEach((timeline, index) => {
      // イベント範囲の簡単な計算
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

  // 軽量イベントレイアウト（計算量大幅削減）
  const layoutEvents = useMemo(() => {
    if (!events || events.length === 0) return [];

    const results = [];
    
    // メインタイムライン処理（軽量化）
    const mainEvents = events.filter(event => 
      !event.timelineInfos || event.timelineInfos.length === 0
    );

    // 簡単な配置システム（重複計算削除）
    const occupiedY = new Set(); // Y座標の占有状況をSetで高速化
    
    mainEvents.forEach((event, index) => {
      const eventX = getXFromYear(event.startDate?.getFullYear() || 2024);
      const eventWidth = Math.min(150, event.title?.length * 8 + 20); // 計算簡素化
      
      // 簡単なY配置（重い計算削除）
      let finalY = window.innerHeight * 0.25;
      let level = 0;
      
      while (level < 5 && occupiedY.has(finalY)) { // 最大5段まで
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

    // 年表イベント処理（軽量化）
    timelineAxes.forEach((axis) => {
      const timelineEvents = events.filter(event => 
        event.timelineInfos?.some(info => 
          info.timelineId === axis.id && !info.isTemporary
        )
      );

      timelineEvents.forEach((event, index) => {
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
  }, [events, timelineAxes, getXFromYear]); // 不要な依存関係削除

  // 単純ドラッグ開始
  const handleEventDragStart = useCallback((e, event) => {
    console.log("単純ドラッグ開始:", event.title);
    
    setDragState({
      isDragging: true,
      draggedEvent: event,
      startY: e.clientY,
      currentY: e.clientY,
    });

    document.body.style.cursor = "grabbing";

    const handleMouseMove = (moveEvent) => {
      setDragState(prev => ({
        ...prev,
        currentY: moveEvent.clientY,
      }));
    };

    const handleMouseUp = (upEvent) => {
      const dropY = upEvent.clientY;
      let targetTimeline = null;

      // 年表判定（単純版）
      if (timelineAxes) {
        targetTimeline = timelineAxes.find(axis => {
          const axisScreenY = axis.yPosition + panY + 64;
          return Math.abs(dropY - axisScreenY) < 50;
        });
      }

      if (targetTimeline && onEventUpdate) {
        // 年表に追加
        console.log(`イベント「${event.title}」を年表「${targetTimeline.name}」に追加`);
        
        const updatedTimelineInfos = [...(event.timelineInfos || [])];
        const existingIndex = updatedTimelineInfos.findIndex(
          info => info.timelineId === targetTimeline.id
        );

        if (existingIndex >= 0) {
          updatedTimelineInfos[existingIndex] = {
            ...updatedTimelineInfos[existingIndex],
            isTemporary: false,
          };
        } else {
          updatedTimelineInfos.push({
            timelineId: targetTimeline.id,
            isTemporary: false,
          });
        }

        onEventUpdate({
          ...event,
          timelineInfos: updatedTimelineInfos,
        });
      }

      // ドラッグ終了
      setDragState({
        isDragging: false,
        draggedEvent: null,
        startY: 0,
        currentY: 0,
      });
      
      document.body.style.cursor = "default";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [timelineAxes, panY, onEventUpdate]);

  // イベントハンドラー
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
      alert("Wikiモードでのイベント追加は承認が必要です。イベント編集タブから申請してください。");
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
          cursor: isDragging ? "grabbing" : "grab",
          backgroundColor: "#f8fafc",
        }}
        onWheel={handleWheel}
        onMouseDown={(e) => {
          // EventCardまたはno-panクラスの要素ではパン操作をスキップ
          if (e.target.closest('[data-event-id]') || e.target.closest('.no-pan')) {
            return;
          }
          handleMouseDown(e);
        }}
        onDoubleClick={handleTimelineDoubleClick}
      >
        {/* 年マーカー */}
        <YearMarkers markers={yearMarkers} />

        {/* メインタイムライン線（25%位置） */}
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

        {/* イベントカード（軽量レンダリング） */}
        {layoutEvents.map((event) => {
          const isHighlighted = highlightedEvents.has ? highlightedEvents.has(event.id) : 
            (Array.isArray(highlightedEvents) ? highlightedEvents.includes(event.id) : false);
          
          return (
            <div
              key={event.id}
              style={{
                position: "absolute",
                left: `${event.adjustedPosition.x - event.calculatedWidth / 2}px`,
                top: `${event.adjustedPosition.y + panY}px`,
                zIndex: dragState.draggedEvent?.id === event.id ? 1000 : 10,
              }}
            >
              <EventCard
                event={event}
                isHighlighted={isHighlighted}
                onDoubleClick={() => handleEventDoubleClick(event)}
                onDragStart={(e) => handleEventDragStart(e, event)}
                isDragging={dragState.draggedEvent?.id === event.id}
                calculateTextWidth={calculateTextWidth}
                style={{
                  transform: dragState.draggedEvent?.id === event.id 
                    ? `translateY(${dragState.currentY - dragState.startY}px)`
                    : 'none'
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

      {/* フローティングUI */}
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