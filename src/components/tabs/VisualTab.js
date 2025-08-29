// src/components/tabs/VisualTab.js - NetworkView統合版
import React, { useRef, useCallback, useState, useMemo } from "react";
import { EventCard } from "../ui/EventCard";
import { EventModal } from "../modals/EventModal";
import TimelineModal from "../modals/TimelineModal";
import { YearMarkers } from "../ui/YearMarkers";
import { TimelineAxes } from "../ui/TimelineAxes";
import { DropZoneManager } from "../ui/DropZone";
import { NetworkView } from "../views/NetworkView"; // 追加
import { UnifiedLayoutSystem } from "../../utils/groupLayoutSystem"; // 追加

import { useCoordinate } from "../../hooks/useCoordinate";
import { TIMELINE_CONFIG } from "../../constants/timelineConfig";
import {
  calculateEventWidth,
  calculateEventHeight,
} from "../../utils/eventSizeUtils";

import { FloatingUI } from "../ui/FloatingUI";

// 年表ベースの状態判定ヘルパー関数
const getEventTimelineStatus = (event, timeline) => {
  if (!timeline || !event) return "none";

  if (timeline.eventIds?.includes(event.id)) {
    return "registered";
  }

  if (timeline.pendingEventIds?.includes(event.id)) {
    return "pending";
  }

  if (timeline.removedEventIds?.includes(event.id)) {
    return "removed";
  }

  return "none";
};

const VisualTab = ({
  // データ
  events = [],
  timelines = [],
  tempTimelines = [],
  user,
  isWikiMode,
  viewMode = "timeline", // TabSystemから渡される: "timeline" または "network"
  visualMode, // 後方互換性のため

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

  // viewModeの正規化（visualModeからの変換も含む）
  const normalizedViewMode = visualMode || viewMode;
  const isNetworkMode = normalizedViewMode === "network";

  console.log("VisualTab viewMode:", {
    viewMode,
    visualMode,
    normalizedViewMode,
    isNetworkMode,
  });

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

  // 年マーカー生成（固定フォントサイズ）
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
          fontSize: 12, // 固定値
        });
      }

      if (markers.length > 30) break;
    }
    return markers;
  }, [scale, getXFromYear]);

  // 年表軸計算（Timelineモード用）
  const timelineAxes = useMemo(() => {
    if (isNetworkMode || !getXFromYear) return [];

    const visibleTimelines = displayTimelines.filter(
      (t) => t.isVisible !== false
    );
    const axes = [];

    visibleTimelines.forEach((timeline, index) => {
      // 年表に関連するすべてのイベント
      const allRelatedEventIds = [
        ...(timeline.eventIds || []),
        ...(timeline.pendingEventIds || []),
        ...(timeline.removedEventIds || []),
      ];

      const allRelatedEvents = events.filter((event) =>
        allRelatedEventIds.includes(event.id)
      );

      let minYear = 2020,
        maxYear = 2025;

      if (allRelatedEvents.length > 0) {
        const years = allRelatedEvents
          .map((e) => e.startDate?.getFullYear?.())
          .filter((y) => y && !isNaN(y));
        if (years.length > 0) {
          minYear = Math.min(...years);
          maxYear = Math.max(...years);
          minYear -= 2;
          maxYear += 1;
        }
      }

      const startX = getXFromYear(minYear);
      const endX = getXFromYear(maxYear);
      const yPosition =
        TIMELINE_CONFIG.FIRST_ROW_Y() + index * TIMELINE_CONFIG.ROW_HEIGHT;
      const cardX = Math.max(20, startX - 50);

      axes.push({
        id: timeline.id,
        name: timeline.name,
        color: timeline.color || "#6b7280",
        yPosition,
        startX,
        endX,
        cardX,
        eventCount: timeline.eventIds?.length || 0,
        pendingCount: timeline.pendingEventIds?.length || 0,
        removedCount: timeline.removedEventIds?.length || 0,
        timeline,
        allEventCount: allRelatedEvents.length,
      });

      console.log(
        `年表「${timeline.name}」: 関連イベント${allRelatedEvents.length}件`
      );
    });

    return axes;
  }, [isNetworkMode, displayTimelines, events, getXFromYear]);

  // ドロップゾーン検出
  const detectDropZone = useCallback(
    (clientX, clientY) => {
      if (!timelineRef.current) return null;

      const rect = timelineRef.current.getBoundingClientRect();
      const relativeY = clientY - rect.top;

      console.log("🎯 ドロップゾーン検出:", { clientY, relativeY });

      // 年表ドロップゾーン判定（優先）
      for (const axis of timelineAxes) {
        const axisScreenY = axis.yPosition + panY;
        const distance = Math.abs(relativeY - axisScreenY);
        console.log(
          `📊 年表「${axis.name}」: Y=${axisScreenY}, 距離=${distance}`
        );

        if (distance < 40) {
          console.log(`✅ 年表ゾーン検出: ${axis.name}`);
          return { type: "timeline", id: axis.id, timeline: axis.timeline };
        }
      }

      // メインタイムライン（一般エリア）の判定
      const mainTimelineY = window.innerHeight * 0.25 + panY;
      const mainDistance = Math.abs(relativeY - mainTimelineY);
      console.log(
        `🔍 メインタイムライン: Y=${mainTimelineY}, 距離=${mainDistance}`
      );

      // メインタイムライン周辺（±50px）を一般エリアとして判定
      if (mainDistance < 50) {
        console.log("✅ 一般エリア検出（メインタイムライン）");
        return { type: "general" };
      }

      // その他の領域も一般エリアとして扱う
      console.log("✅ 一般エリア検出（その他）");
      return { type: "general" };
    },
    [timelineAxes, panY]
  );

  // ドラッグハンドラー（共通）
  const handleEventDragStart = useCallback(
    (e, draggedEvent) => {
      console.log("ドラッグ開始:", draggedEvent.title, "ID:", draggedEvent.id);

      const startPos = { x: e.clientX, y: e.clientY };
      setDragState({
        isDragging: true,
        draggedEvent: draggedEvent,
        startPosition: startPos,
        currentPosition: startPos,
        highlightedZone: null,
      });

      document.body.style.cursor = "grabbing";

      const handleMove = (moveEvent) => {
        const zone = detectDropZone(moveEvent.clientX, moveEvent.clientY);
        const zoneKey = zone
          ? zone.type === "timeline"
            ? `timeline-${zone.id}`
            : zone.type
          : null;

        setDragState((prev) => ({
          ...prev,
          currentPosition: { x: moveEvent.clientX, y: moveEvent.clientY },
          highlightedZone: zoneKey,
        }));
      };

      const handleUp = (upEvent) => {
        const zone = detectDropZone(upEvent.clientX, upEvent.clientY);
        console.log("🎯 ドロップ処理開始:", zone);

        if (zone && onTimelineUpdate) {
          if (zone.type === "timeline") {
            // 年表ゾーンにドロップ：仮登録処理
            console.log("📊 年表への仮登録処理");
            const updatedTimeline = {
              ...zone.timeline,
              pendingEventIds: [...(zone.timeline.pendingEventIds || [])],
              removedEventIds: [...(zone.timeline.removedEventIds || [])],
              eventIds: [...(zone.timeline.eventIds || [])],
            };

            // 既存の関係をクリア
            updatedTimeline.eventIds = updatedTimeline.eventIds.filter(
              (id) => id !== draggedEvent.id
            );
            updatedTimeline.pendingEventIds =
              updatedTimeline.pendingEventIds.filter(
                (id) => id !== draggedEvent.id
              );
            updatedTimeline.removedEventIds =
              updatedTimeline.removedEventIds.filter(
                (id) => id !== draggedEvent.id
              );

            // 仮登録に追加
            updatedTimeline.pendingEventIds.push(draggedEvent.id);

            console.log("🚀 年表更新実行:", updatedTimeline.name);
            onTimelineUpdate(updatedTimeline.id, updatedTimeline);
          } else if (zone.type === "general") {
            // 一般エリアにドロップ：仮削除処理
            console.log("🗑️ 一般エリアへの仮削除処理");

            // 現在所属している年表を全て検索
            const relatedTimelines = displayTimelines.filter(
              (timeline) =>
                timeline.eventIds?.includes(draggedEvent.id) ||
                timeline.pendingEventIds?.includes(draggedEvent.id)
            );

            console.log(
              "📋 関連年表:",
              relatedTimelines.map((t) => t.name)
            );

            // 各年表で仮削除処理
            relatedTimelines.forEach((currentTimeline) => {
              const updatedTimeline = {
                ...currentTimeline,
                eventIds: [...(currentTimeline.eventIds || [])],
                pendingEventIds: [...(currentTimeline.pendingEventIds || [])],
                removedEventIds: [...(currentTimeline.removedEventIds || [])],
              };

              // 既存の登録・仮登録から削除
              updatedTimeline.eventIds = updatedTimeline.eventIds.filter(
                (id) => id !== draggedEvent.id
              );
              updatedTimeline.pendingEventIds =
                updatedTimeline.pendingEventIds.filter(
                  (id) => id !== draggedEvent.id
                );

              // 仮削除に追加（重複チェック）
              if (!updatedTimeline.removedEventIds.includes(draggedEvent.id)) {
                updatedTimeline.removedEventIds.push(draggedEvent.id);
              }

              console.log(`🚀 仮削除更新実行: ${currentTimeline.name}`);
              onTimelineUpdate(currentTimeline.id, updatedTimeline);
            });
          }
        } else {
          console.log(
            "❌ ドロップゾーンが見つからないかonTimelineUpdateが未定義"
          );
        }

        // クリーンアップ（既存のまま）
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
      };

      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleUp);

      e.preventDefault();
      e.stopPropagation();
    },
    [detectDropZone, onTimelineUpdate, displayTimelines]
  );

  // その他のハンドラー（共通）
  const handleEventDoubleClick = useCallback(
    (event) => {
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
    },
    [onEventClick, dragState.isDragging]
  );

  const handleAddEventAtPosition = useCallback(
    (clientX, clientY) => {
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
    },
    [onAddEvent, getYearFromX, isWikiMode]
  );

  const handleTimelineDoubleClick = useCallback(
    (e) => {
      if (
        !e.target.closest("[data-event-id]") &&
        !e.target.closest("[data-group-id]")
      ) {
        handleAddEventAtPosition(e.clientX, e.clientY);
      }
    },
    [handleAddEventAtPosition]
  );

  const handleCreateTimeline = useCallback(
    (timelineName) => {
      const finalTimelineName =
        timelineName || searchTerm.trim() || "新しい年表";

      if (isWikiMode) {
        if (onCreateTempTimeline) {
          onCreateTempTimeline(finalTimelineName);
        }
      } else {
        if (onCreateTimeline) {
          onCreateTimeline(finalTimelineName);
        }
      }
    },
    [onCreateTimeline, onCreateTempTimeline, isWikiMode, searchTerm]
  );

  // レンダリング内容の決定
  const renderViewContent = () => {
    console.log("VisualTab renderViewContent:", { viewMode, isNetworkMode });

    if (isNetworkMode) {
      // Networkモード：NetworkViewを使用
      console.log(
        "Rendering NetworkView with events:",
        events.length,
        "timelines:",
        displayTimelines.length
      );

      

      return (
        <NetworkView
          events={events}
          timelines={displayTimelines}
          panY={panY}
          getXFromYear={getXFromYear}
          calculateTextWidth={calculateTextWidth}
          onEventClick={onEventClick}
          onTimelineClick={null} // クリック時は何もしない
          onTimelineDoubleClick={onTimelineClick} // ダブルクリック時にモーダル表示
          handleEventDoubleClick={handleEventDoubleClick}
          handleEventDragStart={handleEventDragStart}
          highlightedEvents={highlightedEvents}
          dragState={dragState}
        />
      );
    } else {
      // Timelineモード：UnifiedLayoutSystemを使用
      console.log("Rendering Timeline view with UnifiedLayoutSystem");

      // Timelineモード：UnifiedLayoutSystemを使用
      const layoutSystem = new UnifiedLayoutSystem(
        coordinates,
        calculateTextWidth
      );

      // displayTimelines引数を追加！
      const layoutResult = layoutSystem.executeLayout(
        events,
        timelineAxes,
        displayTimelines
      );

      const processedEvents = layoutResult.allEvents;
      const processedGroups = layoutResult.eventGroups;

      console.log(
        `UnifiedLayoutSystem結果: ${processedEvents.length}イベント, ${processedGroups.length}グループ`
      );

      return (
        <>
          {/* 年表軸 */}
          <TimelineAxes
            axes={timelineAxes}
            displayTimelines={displayTimelines}
            panY={panY}
            onTimelineClick={onTimelineClick}
            onDeleteTempTimeline={onDeleteTempTimeline}
            onDeleteTimeline={onDeleteTimeline}
          />

          {/* イベントカード（UnifiedLayoutSystem処理済み） */}
          {processedEvents.map((event) => {
            // highlightedEventsの型を統一的にチェック
            let isHighlighted = false;
            const eventId = event.originalId || event.id;

            if (!highlightedEvents) {
              isHighlighted = false;
            } else if (highlightedEvents.has) {
              // Set型の場合
              isHighlighted = highlightedEvents.has(eventId);
            } else if (Array.isArray(highlightedEvents)) {
              // 配列の場合
              isHighlighted = highlightedEvents.some((e) => e.id === eventId);
            } else {
              // その他の場合
              isHighlighted =
                highlightedEvents.includes &&
                highlightedEvents.includes(eventId);
            }

            const isDragging = dragState.draggedEvent?.id === event.Id;

            return (
              <div
                key={event.id}
                style={{
                  position: "absolute",
                  left: `${
                    event.adjustedPosition.x - event.calculatedWidth / 2
                  }px`,
                  top: `${event.adjustedPosition.y + panY}px`,
                  zIndex: isDragging ? 1000 : 10,
                }}
              >
                <EventCard
                  event={event}
                  isHighlighted={isHighlighted}
                  onDoubleClick={() =>
                    handleEventDoubleClick(event.originalEvent || event)
                  }
                  onDragStart={(e) => handleEventDragStart(e, event)}
                  isDragging={isDragging}
                  calculateTextWidth={calculateTextWidth}
                  style={{
                    transform: isDragging
                      ? `translate(${
                          dragState.currentPosition.x -
                          dragState.startPosition.x
                        }px, ${
                          dragState.currentPosition.y -
                          dragState.startPosition.y
                        }px)`
                      : "none",
                    opacity: isDragging ? 0.8 : 1,
                  }}
                />
              </div>
            );
          })}

          {/* イベントグループ（必要に応じて表示） */}
          {processedGroups.map((group) => (
            <div
              key={group.id}
              style={{
                position: "absolute",
                left: `${group.position.x - 30}px`,
                top: `${group.position.y + panY}px`,
                width: "60px",
                height: "20px",
                backgroundColor: group.timelineColor,
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                color: "white",
                fontWeight: "bold",
                zIndex: 5,
                cursor: "pointer",
              }}
              onClick={() => {
                // グループクリック処理（必要に応じて実装）
                console.log(`グループクリック: ${group.id}`);
              }}
            >
              {group.getDisplayCount()}
            </div>
          ))}
        </>
      );
    }
  };

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
          if (
            e.target.closest("[data-event-id]") ||
            e.target.closest("[data-group-id]")
          ) {
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

        {/* モード別表示内容 */}
        {renderViewContent()}

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

      {/* ドロップゾーン（Timelineモードのみ） */}
      {!isNetworkMode && (
        <DropZoneManager
          isActive={dragState.isDragging}
          timelineAxes={timelineAxes}
          displayTimelines={displayTimelines}
          panY={panY}
          draggedEvent={dragState.draggedEvent}
          highlightedZone={dragState.highlightedZone}
          mainTimelineY={null}
        />
      )}

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
