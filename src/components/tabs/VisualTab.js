import React, {
  useRef,
  useCallback,
  useState,
  useEffect,
  useMemo,
} from "react";
import SearchPanel from "../ui/SearchPanel";
import { TimelineCard } from "../ui/TimelineCard";
import { EventModal } from "../modals/EventModal";
import TimelineModal from "../modals/TimelineModal";
import { SmoothLines } from "../ui/SmoothLines";
import PendingEventsToggle from "../wiki/PendingEventsToggle";

import { truncateTitle } from "../../utils/timelineUtils";
import { getUserApprovalPermission } from "../../utils/wikiEventUtils";

// レイアウトシステム（画面全体のレイアウト管理）
import { useVisualLayout } from "../../hooks/useVisualLayout";
import { useUnifiedCoordinates } from "../../hooks/useUnifiedCoordinates";

const VisualTab = ({
  // データ
  events = [],
  timelines = [],
  user,
  isPersonalMode,
  isWikiMode,
  currentPageMode,

  // 表示モード
  viewMode = "timeline",

  // App.jsからの操作関数
  onEventUpdate,
  onEventDelete,
  onAddEvent,
  onTimelineUpdate,
  onCreateTimeline,
  onDeleteTimeline,
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

  // ホバー
  hoveredGroup,
  setHoveredGroup,

  // Wiki関連
  showPendingEvents = false,
  onTogglePendingEvents,
  wikiData,
  onApprovalAction,
}) => {
  const timelineRef = useRef(null);
  const isNetworkMode = viewMode === "network";

  // 統合座標管理
  const coordinates = useUnifiedCoordinates(timelineRef);
  const {
    scale,
    panX,
    panY,
    isDragging,
    handleWheel,
    handleMouseDown,
    resetToInitialPosition,
  } = coordinates;

  // 全体レイアウト管理
  const {
    layoutEvents,
    timelineAxes,
    networkConnections,
    yearMarkers,
    mainTimelineLine,
    layoutInfo
  } = useVisualLayout(events, timelines, coordinates, viewMode);

  // Wiki承認システム統合
  const [pendingEventsCount, setPendingEventsCount] = useState(0);
  const [userPermissions, setUserPermissions] = useState({
    canViewPending: false,
  });// components/tabs/VisualTab.js - 重複import修正版

  // ユーザー権限とペンディング件数を取得
  useEffect(() => {
    if (isWikiMode && user) {
      const permissions = getUserApprovalPermission(user);
      setUserPermissions(permissions);

      // 承認待ちイベント数を取得
      if (wikiData && permissions.canViewPending) {
        {/* タイムラインモード：年表軸 */}
        {!isNetworkMode &&
          timelineAxes.map((axis) => (
            <div
              key={`timeline-axis-${axis.id}`}
              style={{
                position: "absolute",
                left: `${axis.startX}px`,
                top: `${axis.yPosition + panY}px`,
                width: `${Math.max(100, axis.endX - axis.startX)}px`,
                height: "3px",
                backgroundColor: axis.color,
                zIndex: 2,
              }}
            />
          ))}loadPendingCount();
      }
    }
  }, [isWikiMode, user, wikiData]);

  const loadPendingCount = async () => {
    try {
      const pendingRevisions = await wikiData.getPendingRevisions("pending");
      setPendingEventsCount(pendingRevisions.length);
    } catch (err) {
      console.error("承認待ち件数取得エラー:", err);
    }
  };

  // 年マーカー生成
  const generateYearMarkers = useMemo(() => {
    return yearMarkers.map(marker => (
      <div
        key={marker.id}
        style={{
          position: "absolute",
          left: `${marker.x}px`,
          top: "0px",
          height: "100%",
          borderLeft: "1px solid #ddd",
          pointerEvents: "none",
          zIndex: 5,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "10px",
            left: "5px",
            fontSize: `${marker.fontSize}px`,
            color: "#666",
            fontWeight: "500",
            userSelect: "none",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            padding: "2px 6px",
            borderRadius: "3px",
          }}
        >
          {marker.year}
        </span>

        <span
          style={{
            position: "absolute",
            bottom: "10px",
            left: "5px",
            fontSize: `${marker.fontSize}px`,
            color: "#666",
            fontWeight: "500",
            userSelect: "none",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            padding: "2px 6px",
            borderRadius: "3px",
          }}
        >
          {marker.year}
        </span>
      </div>
    ));
  }, [yearMarkers]);

  // イベントハンドラー
  const handleEventDoubleClick = useCallback(
    (event) => {
      console.log("VisualTab: Event double click:", event.title);
      if (onEventClick) {
        onEventClick(event);
      }
    },
    [onEventClick]
  );

  const handleAddEvent = useCallback(() => {
    console.log("VisualTab: Add event button clicked");
    if (onAddEvent) {
      const result = onAddEvent({
        title: "新規イベント",
        startDate: new Date(),
        description: "",
        tags: [],
      });
      console.log("VisualTab: イベント追加結果:", result);
    } else {
      console.error("VisualTab: onAddEvent関数が提供されていません");
    }
  }, [onAddEvent]);

  const handleCreateTimeline = useCallback(() => {
    console.log("VisualTab: Create timeline clicked");
    if (onCreateTimeline) {
      const result = onCreateTimeline();
      console.log("VisualTab: 年表作成結果:", result);
    } else {
      console.error("VisualTab: onCreateTimeline関数が提供されていません");
    }
  }, [onCreateTimeline]);

  const handleTimelineDoubleClick = useCallback(
    (e) => {
      console.log("VisualTab: Timeline double click detected");
      if (!e.target.closest("[data-event-id]")) {
        handleAddEvent();
      }
    },
    [handleAddEvent]
  );

  // SmoothLines用のハンドラー
  const getTimelineDisplayState = useCallback(() => "default", []);
  const handleTimelineHover = useCallback(() => {}, []);

  console.log(`VisualTab ${isNetworkMode ? "Network" : "Timeline"} render:`, {
    events: events?.length || 0,
    timelines: timelines?.length || 0,
    layoutEvents: layoutEvents?.length || 0,
    connections: networkConnections?.length || 0,
    scale: scale?.toFixed?.(2),
    viewMode,
    onAddEvent: !!onAddEvent,
    onCreateTimeline: !!onCreateTimeline,
  });

  return (
    <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
      {/* 検索パネル - Wiki承認システム対応 */}
      <SearchPanel
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        highlightedEvents={highlightedEvents}
        topTags={getTopTagsFromSearch?.() || []}
        onCreateTimeline={handleCreateTimeline}
        timelines={timelines}
        onDeleteTimeline={onDeleteTimeline}
        isWikiMode={isWikiMode}
        user={user}
      >
        {/* Wiki承認待ちイベント表示切り替え */}
        {isWikiMode && userPermissions.canViewPending && (
          <PendingEventsToggle
            showPendingEvents={showPendingEvents}
            onToggle={onTogglePendingEvents}
            pendingCount={pendingEventsCount}
          />
        )}
      </SearchPanel>

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
        {generateYearMarkers}

        {/* メインタイムライン線 */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${mainTimelineLine.y + panY}px`,
            height: mainTimelineLine.width,
            backgroundColor: mainTimelineLine.color,
            zIndex: 1,
          }}
        />

        {/* ネットワークモード：接続線 */}
        {isNetworkMode && networkConnections && networkConnections.length > 0 && (
          <SmoothLines
            connections={networkConnections}
            panX={panX}
            panY={panY}
            getTimelineDisplayState={getTimelineDisplayState}
            onTimelineHover={handleTimelineHover}
          />
        )}

        {/* イベント表示 */}
        {layoutEvents.map((event) => {
          if (!event.adjustedPosition) return null;

          const isHighlighted = highlightedEvents.has?.(event.id) || false;

          return (
            <React.Fragment key={event.id}>
              {/* 延長線（必要な場合） */}
              {event.timelineInfo?.needsExtensionLine && (
                <div
                  style={{
                    position: "absolute",
                    left: `${event.adjustedPosition.x + panX}px`,
                    top: `${Math.min(event.adjustedPosition.y, event.timelineInfo.rowY) + panY}px`,
                    width: "2px",
                    height: `${Math.abs(event.adjustedPosition.y - event.timelineInfo.rowY)}px`,
                    backgroundColor: event.timelineInfo?.timelineColor || "#6b7280",
                    zIndex: 3,
                  }}
                />
              )}

              {/* イベントボックス */}
              <div
                data-event-id={event.id}
                style={{
                  position: "absolute",
                  left: `${event.adjustedPosition.x + panX - event.calculatedWidth / 2}px`,
                  top: `${event.adjustedPosition.y + panY - 15}px`,
                  width: `${event.calculatedWidth}px`,
                  height: "30px",
                  backgroundColor: isHighlighted ? "#fef3c7" : "#ffffff",
                  border: `2px solid ${
                    isHighlighted ? "#f59e0b" : event.timelineColor || "#e5e7eb"
                  }`,
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: "500",
                  color: "#374151",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  zIndex: isHighlighted ? 20 : 10,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  padding: "0 8px",
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleEventDoubleClick(event);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                title={`${event.title}\n${
                  event.startDate?.toLocaleDateString("ja-JP") || ""
                }\nダブルクリックで編集`}
              >
                {truncateTitle ? truncateTitle(event.title, 12) : event.title}
              </div>
            </React.Fragment>
          );
        })}

        {/* 年表概要カード */}
        {timelineAxes.map((axis) => (
          <TimelineCard
            key={`timeline-card-${axis.id}`}
            timeline={timelines?.find((t) => t.id === axis.id)}
            position={{ x: axis.cardX, y: axis.yPosition + panY - 30 }}
            onEdit={() => {
              const timeline = timelines?.find((t) => t.id === axis.id);
              if (timeline && onTimelineClick) {
                onTimelineClick(timeline);
              }
            }}
            onDelete={() => onDeleteTimeline && onDeleteTimeline(axis.id)}
          />
        ))}
      </div>

      {/* モード表示 */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          padding: "8px 12px",
          borderRadius: "6px",
          fontSize: "14px",
          fontWeight: "500",
          color: "#374151",
          zIndex: 25,
        }}
      >
        {isNetworkMode ? "🕸️ ネットワークモード" : "📊 年表モード"}
      </div>

      {/* ボタン群 */}
      <div
        className="no-pan"
        style={{
          position: "absolute",
          right: "20px",
          bottom: "20px",
          zIndex: 30,
          display: "flex",
          gap: "10px",
        }}
      >
        <button
          onClick={resetToInitialPosition}
          style={{
            backgroundColor: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "12px",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
          }}
          title="初期位置に戻す"
        >
          初期位置
        </button>

        <button
          onClick={handleAddEvent}
          style={{
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "56px",
            height: "56px",
            fontSize: "24px",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="イベントを追加"
        >
          +
        </button>
      </div>

      {/* モーダル（App.jsで管理） */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={onCloseEventModal}
          onUpdate={onEventUpdate}
          onDelete={onEventDelete}
          isWikiMode={isWikiMode}
          timelines={timelines || []}
        />
      )}

      {selectedTimeline && (
        <TimelineModal
          timeline={selectedTimeline}
          onClose={onCloseTimelineModal}
          onUpdate={onTimelineUpdate}
          onDelete={onDeleteTimeline}
          isWikiMode={isWikiMode}
        />
      )}
    </div>
  );
};

export default VisualTab;