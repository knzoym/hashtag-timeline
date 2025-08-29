// src/components/tabs/VisualTab.js - ドラッグ統合・timelineInfos対応版
import React, { useRef, useCallback, useState, useMemo } from "react";
import SearchPanel from "../ui/SearchPanel";
import { TimelineCard } from "../ui/TimelineCard";
import { EventCard } from "../ui/EventCard";
import { EventModal } from "../modals/EventModal";
import TimelineModal from "../modals/TimelineModal";
import { SmoothLines } from "../ui/SmoothLines";
import { EventGroupIcon, GroupTooltip, GroupCard } from "../ui/EventGroup";

import { useCoordinate } from "../../hooks/useCoordinate";
import { useDragDrop } from "../../hooks/useDragDrop";
import { UnifiedLayoutSystem } from "../../utils/groupLayoutSystem";
import { YearMarkers } from "../ui/YearMarkers";
import { TimelineAxes } from "../ui/TimelineAxes";

import { TIMELINE_CONFIG } from "../../constants/timelineConfig";

import { FloatingUI } from "../ui/FloatingUI";
import { TimelineView } from "../views/TimelineView";
import { NetworkView } from "../views/NetworkView";

const VisualTab = ({
  // データ
  events = [],
  timelines = [],
  tempTimelines = [],
  user,
  isWikiMode,
  viewMode = "timeline", // timeline | network

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

  // グループ状態管理
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // 座標システム（統合されたuseCoordinate）
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

  // ドラッグ処理のコールバック関数群
  const handleEventMove = useCallback((eventId, newY, conflictingEvents) => {
    console.log(`イベント移動: ${eventId} を Y=${newY} に移動`);
    // メインタイムラインでの位置調整ロジック
    const targetEvent = events.find(e => e.id === eventId);
    if (targetEvent && onEventUpdate) {
      const updatedEvent = {
        ...targetEvent,
        adjustedPosition: {
          ...targetEvent.adjustedPosition,
          y: newY
        }
      };
      onEventUpdate(updatedEvent);
    }
  }, [events, onEventUpdate]);

  const handleTimelineMove = useCallback((timelineId, newPosition) => {
    console.log(`年表移動: ${timelineId}`);
    // 年表移動処理（必要に応じて実装）
  }, []);

  const handleEventAddToTimeline = useCallback((event, timelineId) => {
    console.log(`仮登録処理: イベント「${event.title}」を年表ID「${timelineId}」に仮登録`);
    
    if (!onEventUpdate) return;

    const updatedTimelineInfos = [...(event.timelineInfos || [])];
    const existingIndex = updatedTimelineInfos.findIndex(
      (info) => info.timelineId === timelineId
    );

    if (existingIndex >= 0) {
      // 既存の関連を正式登録に変更（仮削除→正式登録）
      updatedTimelineInfos[existingIndex] = {
        ...updatedTimelineInfos[existingIndex],
        isTemporary: false,
      };
      console.log(`既存関連を正式登録に変更: ${event.title}`);
    } else {
      // 新規仮登録
      updatedTimelineInfos.push({
        timelineId: timelineId,
        isTemporary: false, // 仮登録ではなく正式登録として追加
      });
      console.log(`新規登録: ${event.title} を年表に追加`);
    }

    const updatedEvent = {
      ...event,
      timelineInfos: updatedTimelineInfos,
    };

    onEventUpdate(updatedEvent);
  }, [onEventUpdate]);

  const handleEventRemoveFromTimeline = useCallback((timelineId, eventId) => {
    console.log(`仮削除処理: イベントID「${eventId}」を年表ID「${timelineId}」から仮削除`);
    
    if (!onEventUpdate) return;

    const targetEvent = events.find(e => e.id === eventId);
    if (!targetEvent) return;

    if (targetEvent.timelineInfos && targetEvent.timelineInfos.length > 0) {
      // timelineInfos方式: 該当する年表情報を仮削除状態に変更
      const updatedTimelineInfos = targetEvent.timelineInfos.map((info) => {
        if (info.timelineId === timelineId) {
          return { ...info, isTemporary: true };
        }
        return info;
      });

      const updatedEvent = {
        ...targetEvent,
        timelineInfos: updatedTimelineInfos,
      };

      onEventUpdate(updatedEvent);
      console.log(`timelineInfos方式で仮削除: ${targetEvent.title}`);
    }
  }, [events, onEventUpdate]);

  // 統合ドラッグシステム
  const dragSystem = useDragDrop(
    handleEventMove,
    handleTimelineMove,
    handleEventAddToTimeline,
    handleEventRemoveFromTimeline
  );

  // テキスト幅計算
  const calculateTextWidth = useCallback((text) => {
    if (!text) return 60;
    return Math.min(Math.max(60, text.length * 8), 200);
  }, []);

  // 統合レイアウトシステムのインスタンス化
  const layoutManager = useMemo(() => {
    if (!coordinates || !calculateTextWidth) return null;
    return new UnifiedLayoutSystem(coordinates, calculateTextWidth);
  }, [coordinates, calculateTextWidth]);

  // 表示用の統合年表データ
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

    // スケールに応じた年間隔
    let yearInterval;
    const adjustedScale = scale / 2.5;

    if (adjustedScale > 12) yearInterval = 1;
    else if (adjustedScale > 6) yearInterval = 2;
    else if (adjustedScale > 2) yearInterval = 5;
    else if (adjustedScale > 0.8) yearInterval = 10;
    else if (adjustedScale > 0.4) yearInterval = 50;
    else if (adjustedScale > 0.2) yearInterval = 100;
    else if (adjustedScale > 0.1) yearInterval = 200;
    else if (adjustedScale > 0.04) yearInterval = 500;
    else yearInterval = 1000;

    for (let year = -5000; year <= 5000; year += yearInterval) {
      const x = getXFromYear(year);
      if (x > -100 && x < viewportWidth + 100) {
        markers.push({
          key: year,
          x,
          year,
          fontSize: Math.max(8, Math.min(14, 10 + adjustedScale)),
        });
      }
    }
    return markers;
  }, [scale, getXFromYear]);

  // 年表軸計算（範囲限定対応）
  const timelineAxes = useMemo(() => {
    if (!getXFromYear) return [];

    const visibleTimelines = displayTimelines.filter(
      (t) => t.isVisible !== false
    );
    const axes = [];

    visibleTimelines.forEach((timeline, index) => {
      // 年表に属するイベントを検索
      const timelineEvents = events.filter((event) => {
        // timelineInfos方式
        if (
          event.timelineInfos?.some(
            (info) => info.timelineId === timeline.id && !info.isTemporary
          )
        ) {
          return true;
        }
        // eventIds方式
        if (timeline.eventIds?.includes(event.id)) {
          return true;
        }
        return false;
      });

      // 年範囲計算（イベントの実際の範囲を使用）
      let minYear = 2020,
        maxYear = 2025;
      if (timelineEvents.length > 0) {
        const years = timelineEvents
          .map((e) => e.startDate?.getFullYear?.())
          .filter((y) => y && !isNaN(y));
        if (years.length > 0) {
          minYear = Math.min(...years);
          maxYear = Math.max(...years);
        }
      }

      // 座標計算（25%位置基準）
      const startX = getXFromYear(minYear);
      const endX = getXFromYear(maxYear);
      const yPosition =
        TIMELINE_CONFIG.FIRST_ROW_Y() + index * TIMELINE_CONFIG.ROW_HEIGHT;

      axes.push({
        id: timeline.id,
        name: timeline.name,
        color: timeline.color || "#6b7280",
        yPosition,
        startX, // 軸線の開始点（イベント範囲）
        endX, // 軸線の終了点（イベント範囲）
        cardX: Math.max(20, startX - 150),
        eventCount: timelineEvents.length,
        timeline,
      });
    });

    console.log(`年表軸計算完了（25%位置・範囲限定）: ${axes.length}軸`);
    return axes;
  }, [displayTimelines, events, getXFromYear]);

  // 統合レイアウトシステムによるイベント配置計算
  const layoutEventsWithGroups = useMemo(() => {
    if (!events || !layoutManager || !timelineAxes) {
      return { allEvents: [], eventGroups: [] };
    }

    try {
      const layoutResult = layoutManager.executeLayout(events, timelineAxes);

      console.log(
        `統合レイアウト結果（25%位置）: ${layoutResult.allEvents.length}イベント, ${layoutResult.eventGroups.length}グループ`
      );
      layoutResult.eventGroups.forEach((group) => {
        console.log(
          `グループ ${group.id}: 位置(${group.position.x.toFixed(0)}, ${
            group.position.y
          }) 色=${group.timelineColor} ${group.events.length}イベント`
        );
      });

      return layoutResult;
    } catch (error) {
      console.error("レイアウト計算エラー:", error);
      return { allEvents: [], eventGroups: [] };
    }
  }, [events, timelineAxes, layoutManager]);

  // ネットワーク専用レイアウト計算
  const networkLayout = useMemo(() => {
    if (!isNetworkMode) return { events: [], connections: [] };

    console.log("ネットワークレイアウト計算開始（25%位置対応）");
    const networkEvents = [];
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // 各年表の中心Y座標を計算（25%基準）
    const timelinePositions = displayTimelines
      .filter((t) => t.isVisible !== false)
      .map((timeline, index) => {
        const centerY =
          viewportHeight * 0.15 + (index + 1) * (viewportHeight * 0.15);
        return {
          id: timeline.id,
          name: timeline.name,
          color: timeline.color || "#6b7280",
          centerY: Math.min(centerY, viewportHeight * 0.8),
          timeline,
        };
      });

    // 年表ごとにイベントを配置
    timelinePositions.forEach((timelinePos, timelineIndex) => {
      const timelineEvents = events.filter((event) => {
        return (
          event.timelineInfos?.some(
            (info) => info.timelineId === timelinePos.id && !info.isTemporary
          ) || timelinePos.timeline.eventIds?.includes(event.id)
        );
      });

      if (timelineEvents.length === 0) return;

      // 時系列順にソート
      const sortedEvents = [...timelineEvents].sort((a, b) => {
        const aYear = a.startDate ? a.startDate.getFullYear() : 0;
        const bYear = b.startDate ? b.startDate.getFullYear() : 0;
        return aYear - bYear;
      });

      // イベントをY軸周りに配置（円弧状に分散）
      sortedEvents.forEach((event, eventIndex) => {
        const eventX = event.startDate
          ? getXFromYear(event.startDate.getFullYear())
          : viewportWidth / 2;

        // ネットワーク専用のY座標計算（年表中心から放射状に配置）
        const angleRange = Math.PI * 0.6; // 約108度の範囲
        const startAngle = -angleRange / 2;
        const angle =
          sortedEvents.length > 1
            ? startAngle + (eventIndex / (sortedEvents.length - 1)) * angleRange
            : 0;

        const radiusVariation = 40 + (eventIndex % 3) * 20; // 半径のバリエーション
        const eventY = timelinePos.centerY + Math.sin(angle) * radiusVariation;

        networkEvents.push({
          ...event,
          adjustedPosition: {
            x: eventX,
            y: Math.max(50, Math.min(eventY, viewportHeight - 100)),
          },
          calculatedWidth: calculateTextWidth(event.title || "") + 20,
          calculatedHeight: 40,
          timelineColor: timelinePos.color,
          timelineInfo: {
            timelineId: timelinePos.id,
            timelineName: timelinePos.name,
            timelineColor: timelinePos.color,
            networkPosition: { angle, radius: radiusVariation },
          },
          hiddenByGroup: false,
        });
      });

      console.log(
        `年表「${timelinePos.name}」: ${timelineEvents.length}イベントをネットワーク配置`
      );
    });

    return { events: networkEvents, timelinePositions };
  }, [
    isNetworkMode,
    events,
    displayTimelines,
    getXFromYear,
    calculateTextWidth,
  ]);

  // レイアウト選択（タイムライン or ネットワーク）
  const currentLayout = useMemo(() => {
    if (isNetworkMode) {
      return {
        allEvents: networkLayout.events,
        eventGroups: [], // ネットワークモードではグループ化しない
      };
    }
    return layoutEventsWithGroups;
  }, [isNetworkMode, networkLayout, layoutEventsWithGroups]);

  // ネットワーク接続線データ生成（修正版）
  const networkConnections = useMemo(() => {
    if (!isNetworkMode) return [];

    const connections = [];
    console.log("ネットワークモード: 接続線生成開始");

    // ネットワークレイアウトのイベントから接続線を生成
    if (networkLayout.timelinePositions) {
      networkLayout.timelinePositions.forEach((timelinePos) => {
        const timelineEvents = networkLayout.events.filter(
          (event) => event.timelineInfo?.timelineId === timelinePos.id
        );

        console.log(
          `年表「${timelinePos.name}」: ${timelineEvents.length}個の接続可能イベント`
        );

        if (timelineEvents.length >= 2) {
          // イベントを時系列順にソート
          const sortedEvents = [...timelineEvents].sort((a, b) => {
            const aYear = a.startDate ? a.startDate.getFullYear() : 0;
            const bYear = b.startDate ? b.startDate.getFullYear() : 0;
            return aYear - bYear;
          });

          // ネットワーク用の接続ポイント生成
          const connectionPoints = sortedEvents.map((event) => ({
            x: event.adjustedPosition.x,
            y: event.adjustedPosition.y, // panYは後でSmoothLinesで適用される
          }));

          connections.push({
            id: timelinePos.id,
            name: timelinePos.name,
            color: timelinePos.color,
            points: connectionPoints,
          });

          console.log(`  → 接続線追加: ${connectionPoints.length}ポイント`);
        }
      });
    }

    console.log(`ネットワーク接続線生成完了: ${connections.length}本の接続線`);
    return connections;
  }, [isNetworkMode, networkLayout]);

  // グループ管理
  const toggleEventGroup = useCallback((groupId) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

  // イベントハンドラー
  const handleEventDoubleClick = useCallback(
    (event) => {
      if (dragSystem.isDragging) return;
      console.log("VisualTab: Event double click:", event.title);

      // イベントの正規化
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
    [onEventClick, dragSystem.isDragging]
  );

  // ドラッグ開始ハンドラー（EventCard用）
  const handleEventDragStart = useCallback((e, dragData) => {
    console.log("統合ドラッグ開始:", dragData.title);
    
    // useDragDropのhandleMouseDownを呼び出し
    dragSystem.handleMouseDown(e, 'event', dragData);

    // ドラッグ中のマウス移動を監視
    const handleMouseMove = (moveEvent) => {
      dragSystem.handleMouseMove(moveEvent);
    };

    // ドラッグ終了
    const handleMouseUp = (upEvent) => {
      dragSystem.handleMouseUp(upEvent, timelineAxes);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [dragSystem, timelineAxes]);

  const handleAddEventAtPosition = useCallback(
    (clientX, clientY) => {
      if (isWikiMode) {
        alert(
          "Wikiモードでのイベント追加は承認が必要です。イベント編集タブから申請してください。"
        );
        return;
      }

      if (onAddEvent && getYearFromX && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const relativeX = clientX - rect.left;
        const relativeY = clientY - rect.top;

        // クリック座標から年を計算
        const clickedYear = Math.round(getYearFromX(relativeX));

        // 新しいイベントの日付を設定
        const eventDate = new Date();
        eventDate.setFullYear(clickedYear);

        onAddEvent({
          title: "新規イベント",
          startDate: eventDate,
          description: "",
          tags: [],
          position: { x: relativeX, y: relativeY },
        });

        console.log(
          `座標 (${relativeX}, ${relativeY}) に ${clickedYear} 年のイベントを追加`
        );
      }
    },
    [onAddEvent, getYearFromX, isWikiMode]
  );

  const handleTimelineDoubleClick = useCallback(
    (e) => {
      // イベントやグループ以外の場所でのダブルクリック
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
      // 引数で年表名を受け取る、またはsearchTermから自動設定
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

  console.log(`VisualTab ${isNetworkMode ? "Network" : "Timeline"} render:`, {
    events: events?.length || 0,
    timelines: displayTimelines?.length || 0,
    layoutEvents: layoutEventsWithGroups.allEvents?.length || 0,
    eventGroups: layoutEventsWithGroups.eventGroups?.length || 0,
    expandedGroups: expandedGroups.size,
    connections: networkConnections?.length || 0,
    scale: scale?.toFixed(2),
    position: "25%基準",
    dragSystem: dragSystem.isDragging ? "ドラッグ中" : "待機中",
  });

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
        onMouseDown={handleMouseDown}
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

        {/* viewModeに応じて描画コンポーネントを切り替え */}
        {isNetworkMode ? (
          <NetworkView
            networkLayout={networkLayout}
            networkConnections={networkConnections}
            panY={panY}
            highlightedEvents={highlightedEvents || []}
            onTimelineClick={onTimelineClick}
            handleEventDoubleClick={handleEventDoubleClick}
            calculateTextWidth={calculateTextWidth}
            // ドラッグに必要なプロパティを追加
            timelineAxes={timelineAxes}
            onEventUpdate={onEventUpdate}
          />
        ) : (
          <>
            <TimelineAxes
              axes={timelineAxes}
              displayTimelines={displayTimelines}
              panY={panY}
              onTimelineClick={onTimelineClick}
              onDeleteTempTimeline={onDeleteTempTimeline}
              onDeleteTimeline={onDeleteTimeline}
            />
            <TimelineView
              layoutData={layoutEventsWithGroups}
              panY={panY}
              highlightedEvents={highlightedEvents || []}
              hoveredGroup={hoveredGroup}
              expandedGroups={expandedGroups}
              setHoveredGroup={setHoveredGroup}
              toggleEventGroup={toggleEventGroup}
              handleEventDoubleClick={handleEventDoubleClick}
              calculateTextWidth={calculateTextWidth}
              // ドラッグに必要なプロパティを追加
              timelineAxes={timelineAxes}
              onEventUpdate={onEventUpdate}
            />
          </>
        )}

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

      {/* モーダル（App.jsで管理） */}
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