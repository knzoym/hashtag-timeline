// src/components/tabs/VisualTab.js - 仮登録仮削除修正版
import React, {
  useRef,
  useCallback,
  useState,
  useMemo,
  useEffect,
} from "react";
import { EventCard } from "../ui/EventCard";
import { EventModal } from "../modals/EventModal";
import TimelineModal from "../modals/TimelineModal";
import { YearMarkers } from "../ui/YearMarkers";
import { TimelineAxes } from "../ui/TimelineAxes";
import { DropZoneManager } from "../ui/DropZone";
import { NetworkView } from "../views/NetworkView";
import { UnifiedLayoutSystem } from "../../utils/groupLayoutSystem";

import { useCoordinate } from "../../hooks/useCoordinate";
import { TIMELINE_CONFIG } from "../../constants/timelineConfig";
import {
  calculateEventWidth,
  calculateEventHeight,
} from "../../utils/eventSizeUtils";

import { useEventLayout } from "../../hooks/useEventLayout";
import { FloatingUI } from "../ui/FloatingUI";
import {
  executeFullTimelineUpdate,
  useTimelineAutoUpdate,
} from "../../utils/timelineUpdateSystem";

// 年表ベースの状態判定ヘルパー関数（修正版）
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
  viewMode = "timeline",
  visualMode,

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

  // モーダル
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

  // viewModeの正規化
  const normalizedViewMode = visualMode || viewMode;
  const isNetworkMode = normalizedViewMode === "network";

  console.log("VisualTab render:", {
    timelinesCount: timelines.length,
    eventsCount: events.length,
    viewMode: normalizedViewMode,
  });

  // ドラッグ状態管理（複数インスタンス対応版）
  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedEvent: null,
    draggedEventCard: null, // ドラッグ中の特定のカードインスタンス
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    highlightedZone: null,
  });

  // 座標システム
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

  // displayTimelinesの計算ロジック修正版
  const displayTimelines = useMemo(() => {
    console.log("displayTimelines 計算開始:", {
      isWikiMode,
      timelinesLength: timelines.length,
      tempTimelinesLength: tempTimelines.length,
    });

    if (isWikiMode) {
      // Wikiモード: tempTimelinesのみ表示（個人ページの年表は非表示）
      const convertedTempTimelines = tempTimelines.map((tempTimeline) => ({
        ...tempTimeline,
        isVisible: true,
        type: "temporary",
      }));
      console.log(
        "Wikiモード - 一時年表のみ表示:",
        convertedTempTimelines.length
      );
      return convertedTempTimelines;
    } else {
      // 個人モード: timelinesのみ表示（一時年表は非表示）
      console.log("個人モード - 通常年表のみ表示:", timelines.length);
      return timelines;
    }
  }, [isWikiMode, timelines, tempTimelines]);

  // モード別の表示用年表データを決定
  const { displayTimelinesForUI, displayTempTimelinesForUI } = useMemo(() => {
    if (isWikiMode) {
      // Wikiモード: tempTimelinesのみ表示、timelinesは空配列
      return {
        displayTimelinesForUI: [],
        displayTempTimelinesForUI: tempTimelines,
      };
    } else {
      // 個人モード: timelinesのみ表示、tempTimelinesは空配列
      return {
        displayTimelinesForUI: timelines,
        displayTempTimelinesForUI: [],
      };
    }
  }, [isWikiMode, timelines, tempTimelines]);

  // 年表自動更新システム
  const executeTimelineAutoUpdate = useTimelineAutoUpdate(
    displayTimelines,
    onTimelineUpdate
  );

  // 手動更新関数
  const handleManualTimelineUpdate = useCallback(() => {
    const result = executeFullTimelineUpdate(
      events,
      displayTimelines,
      (updateFn) => {
        // setTimelinesの代わりにonTimelineUpdateを使用
        const currentTimelines = displayTimelines;
        const updatedTimelines = updateFn(currentTimelines);

        // 変更された年表のみを個別に更新
        updatedTimelines.forEach((updatedTimeline, index) => {
          if (
            JSON.stringify(updatedTimeline) !==
            JSON.stringify(currentTimelines[index])
          ) {
            onTimelineUpdate(updatedTimeline.id, updatedTimeline);
          }
        });
      }
    );

    if (result.updatedCount > 0) {
      console.log(`手動更新完了: ${result.updatedCount}個の年表を更新`);
    } else {
      console.log("更新対象の年表はありませんでした");
    }

    return result;
  }, [events, displayTimelines, onTimelineUpdate]);

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
          fontSize: 12,
        });
      }

      if (markers.length > 30) break;
    }
    return markers;
  }, [scale, getXFromYear]);

  // 年表軸計算（修正版）
  const timelineAxes = useMemo(() => {
    if (isNetworkMode || !getXFromYear) return [];

    const visibleTimelines = displayTimelines.filter(
      (t) => t.isVisible !== false
    );
    const axes = [];

    console.log("年表軸計算開始:", visibleTimelines.length, "個の年表");

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
        `年表「${timeline.name}」軸データ:`,
        `関連イベント${allRelatedEvents.length}件`,
        `正式${timeline.eventIds?.length || 0}`,
        `仮登録${timeline.pendingEventIds?.length || 0}`,
        `仮削除${timeline.removedEventIds?.length || 0}`
      );
    });

    return axes;
  }, [isNetworkMode, displayTimelines, events, getXFromYear]);

  // ドロップゾーン検出（修正版）
  const detectDropZone = useCallback(
    (clientX, clientY) => {
      if (!timelineRef.current) return null;

      const rect = timelineRef.current.getBoundingClientRect();
      const relativeY = clientY - rect.top;

      console.log("🎯 ドロップゾーン検出:", {
        clientY,
        relativeY,
        timelineAxesCount: timelineAxes.length,
      });

      // 年表ドロップゾーン判定（優先）
      for (const axis of timelineAxes) {
        const axisScreenY = axis.yPosition + panY;
        const distance = Math.abs(relativeY - axisScreenY);

        if (distance < 40) {
          console.log(`✅ 年表ゾーン検出: ${axis.name}`);
          return { type: "timeline", id: axis.id, timeline: axis.timeline };
        }
      }

      // メインタイムライン（一般エリア）の判定
      const mainTimelineY = window.innerHeight * 0.25 + panY;
      const mainDistance = Math.abs(relativeY - mainTimelineY);

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

  // ドラッグハンドラー（複数インスタンス対応版）
  const handleEventDragStart = useCallback(
    (e, draggedEvent, draggedEventCard) => {
      console.log(
        "🚀 ドラッグ開始:",
        draggedEvent.title,
        "ID:",
        draggedEvent.id
      );

      const startPos = { x: e.clientX, y: e.clientY };
      setDragState({
        isDragging: true,
        draggedEvent: draggedEvent,
        draggedEventCard: draggedEventCard, // ドラッグ中の特定のカードインスタンス
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
            const targetTimeline = zone.timeline;

            const updatedTimeline = {
              ...targetTimeline,
              eventIds: [...(targetTimeline.eventIds || [])],
              pendingEventIds: [...(targetTimeline.pendingEventIds || [])],
              removedEventIds: [...(targetTimeline.removedEventIds || [])],
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

            // 統計情報更新
            updatedTimeline.eventCount = updatedTimeline.eventIds.length;
            updatedTimeline.pendingCount =
              updatedTimeline.pendingEventIds.length;
            updatedTimeline.removedCount =
              updatedTimeline.removedEventIds.length;

            console.log("📝 年表更新データ:", {
              name: updatedTimeline.name,
              eventIds: updatedTimeline.eventIds.length,
              pendingEventIds: updatedTimeline.pendingEventIds.length,
              removedEventIds: updatedTimeline.removedEventIds.length,
            });

            console.log("🚀 年表更新実行");
            onTimelineUpdate(targetTimeline.id, updatedTimeline);
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

              // 統計情報更新
              updatedTimeline.eventCount = updatedTimeline.eventIds.length;
              updatedTimeline.pendingCount =
                updatedTimeline.pendingEventIds.length;
              updatedTimeline.removedCount =
                updatedTimeline.removedEventIds.length;

              console.log(`📝 仮削除更新データ: ${currentTimeline.name}`, {
                eventIds: updatedTimeline.eventIds.length,
                pendingEventIds: updatedTimeline.pendingEventIds.length,
                removedEventIds: updatedTimeline.removedEventIds.length,
              });

              console.log(`🚀 仮削除更新実行: ${currentTimeline.name}`);
              onTimelineUpdate(currentTimeline.id, updatedTimeline);
            });
          }
        } else {
          console.log(
            "❌ ドロップゾーンが見つからないかonTimelineUpdateが未定義"
          );
        }

        // クリーンアップ
        setDragState({
          isDragging: false,
          draggedEvent: null,
          draggedEventCard: null,
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
    console.log("VisualTab renderViewContent:", {
      viewMode: normalizedViewMode,
      isNetworkMode,
    });

    if (isNetworkMode) {
      // Networkモード：NetworkViewを使用
      return (
        <NetworkView
          events={events}
          timelines={displayTimelines}
          panY={panY}
          getXFromYear={getXFromYear}
          calculateTextWidth={calculateTextWidth}
          onEventClick={onEventClick}
          onTimelineClick={null}
          onTimelineDoubleClick={onTimelineClick}
          handleEventDoubleClick={handleEventDoubleClick}
          handleEventDragStart={handleEventDragStart}
          highlightedEvents={highlightedEvents}
          dragState={dragState}
        />
      );
    } else {
      // Timelineモード：UnifiedLayoutSystemを使用
      const layoutSystem = new UnifiedLayoutSystem(
        coordinates,
        calculateTextWidth
      );

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

          {/* イベントカード（複数インスタンス対応版） */}
          {processedEvents.map((event) => {
            // highlightedEventsの型を統一的にチェック
            let isHighlighted = false;
            const eventId = event.originalId || event.id;

            if (!highlightedEvents) {
              isHighlighted = false;
            } else if (highlightedEvents.has) {
              isHighlighted = highlightedEvents.has(eventId);
            } else if (Array.isArray(highlightedEvents)) {
              isHighlighted = highlightedEvents.some((e) => e.id === eventId);
            } else {
              isHighlighted =
                highlightedEvents.includes &&
                highlightedEvents.includes(eventId);
            }

            // ドラッグ状態の判定（複数インスタンス対応）
            const originalEventId = event.originalId || event.id;
            const draggedOriginalId =
              dragState.draggedEvent?.originalId || dragState.draggedEvent?.id;

            // 現在ドラッグ中の特定のカードかどうか
            const isThisDraggedCard =
              dragState.draggedEventCard?.id === event.id;

            // 同じ元イベントの他のインスタンスかどうか
            const isSameEventOtherInstance =
              dragState.isDragging &&
              draggedOriginalId === originalEventId &&
              !isThisDraggedCard;

            // ドラッグ中の位置計算（ドラッグ中のカードのみ）
            let cardX = event.adjustedPosition.x - event.calculatedWidth / 2;
            let cardY = event.adjustedPosition.y + panY;

            if (
              isThisDraggedCard &&
              dragState.currentPosition &&
              dragState.startPosition
            ) {
              const deltaX =
                dragState.currentPosition.x - dragState.startPosition.x;
              const deltaY =
                dragState.currentPosition.y - dragState.startPosition.y;
              cardX += deltaX;
              cardY += deltaY;
            }

            return (
              <div
                key={event.id}
                style={{
                  position: "absolute",
                  left: `${cardX}px`,
                  top: `${cardY}px`,
                  zIndex: isThisDraggedCard ? 1000 : 10,
                  opacity: isSameEventOtherInstance
                    ? 0.3
                    : isThisDraggedCard
                    ? 0.8
                    : 1,
                  pointerEvents: isSameEventOtherInstance
                    ? "none"
                    : isThisDraggedCard
                    ? "none"
                    : "auto",
                }}
              >
                <EventCard
                  event={event}
                  isHighlighted={isHighlighted}
                  onDoubleClick={() =>
                    handleEventDoubleClick(event.originalEvent || event)
                  }
                  onDragStart={(e) =>
                    handleEventDragStart(e, event.originalEvent || event, event)
                  }
                  isDragging={isThisDraggedCard}
                  calculateTextWidth={calculateTextWidth}
                  displayTimelines={displayTimelines}
                />
              </div>
            );
          })}

          {/* イベントグループ */}
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
        handleManualTimelineUpdate={handleManualTimelineUpdate}
        displayTimelines={displayTimelines}
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
