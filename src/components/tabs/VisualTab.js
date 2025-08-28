// src/components/tabs/VisualTab.js - Wiki統合版
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

import { TIMELINE_CONFIG } from "../../constants/timelineConfig";
import { truncateTitle } from "../../utils/timelineUtils";

// 修正されたフック
import { useVisualLayout } from "../../hooks/useVisualLayout";
import { useUnifiedCoordinates } from "../../hooks/useUnifiedCoordinates";

const VisualTab = ({
  // データ
  events = [],
  timelines = [],
  tempTimelines = [], // 新規：Wiki一時年表
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
  onCreateTempTimeline, // 新規：一時年表作成
  onDeleteTimeline,
  onDeleteTempTimeline, // 新規：一時年表削除
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
    pixelsPerYear,
    isDragging,
    getXFromYear,
    getYearFromX,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetToInitialPosition,
  } = coordinates;

  // 表示用の統合年表データ（個人年表 + 一時年表）
  const displayTimelines = useMemo(() => {
    if (isWikiMode) {
      // Wiki一時年表をtimelineInfos形式に変換
      const convertedTempTimelines = tempTimelines.map((tempTimeline) => ({
        ...tempTimeline,
        isVisible: true,
        type: "temporary",
      }));
      return [...timelines, ...convertedTempTimelines];
    }
    return timelines;
  }, [isWikiMode, timelines, tempTimelines]);

  // 表示用イベントデータ（一時年表のイベント関連付け込み）
  const displayEvents = useMemo(() => {
    if (!isWikiMode) return events;

    // Wiki一時年表のイベントに仮想的なtimelineInfosを追加
    return events.map((event) => {
      const tempTimelineInfos = tempTimelines.reduce((acc, tempTimeline) => {
        if (tempTimeline.eventIds?.includes(event.id)) {
          acc.push({
            timelineId: tempTimeline.id,
            isTemporary: false,
          });
        }
        return acc;
      }, []);

      return {
        ...event,
        timelineInfos: [...(event.timelineInfos || []), ...tempTimelineInfos],
      };
    });
  }, [isWikiMode, events, tempTimelines]);

  // 全体レイアウト管理
  const {
    layoutEvents,
    timelineAxes,
    networkConnections,
    yearMarkers,
    mainTimelineLine,
    layoutInfo,
  } = useVisualLayout(displayEvents, displayTimelines, coordinates, viewMode);

  // 年マーカー生成
  const generateYearMarkers = useMemo(() => {
    return yearMarkers.map((marker) => (
      <div
        key={marker.year}
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
    if (isWikiMode) {
      // Wikiモードでは承認申請へ誘導
      alert(
        "Wikiモードでのイベント追加は承認が必要です。イベント編集タブから申請してください。"
      );
      return;
    }

    console.log(
      "VisualTab: Add event button clicked - onAddEvent:",
      !!onAddEvent
    );
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
  }, [onAddEvent, isWikiMode]);

  const handleCreateTimeline = useCallback(() => {
    if (isWikiMode) {
      console.log("VisualTab: Wiki一時年表作成:", onCreateTempTimeline);
      if (onCreateTempTimeline) {
        const result = onCreateTempTimeline();
        console.log("VisualTab: 一時年表作成結果:", result);
      }
    } else {
      console.log("VisualTab: 個人年表作成:", onCreateTimeline);
      if (onCreateTimeline) {
        const result = onCreateTimeline();
        console.log("VisualTab: 年表作成結果:", result);
      }
    }
  }, [onCreateTimeline, onCreateTempTimeline, isWikiMode]);

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
    events: displayEvents?.length || 0,
    timelines: displayTimelines?.length || 0,
    tempTimelines: tempTimelines?.length || 0,
    layoutEvents: layoutEvents?.length || 0,
    connections: networkConnections?.length || 0,
    scale: scale?.toFixed(2),
    viewMode,
    isWikiMode,
    onAddEvent: !!onAddEvent,
    onCreateTimeline: !!onCreateTimeline,
    onCreateTempTimeline: !!onCreateTempTimeline,
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

        {/* タイムラインモード：年表軸（画面幅いっぱい） */}
        {!isNetworkMode &&
          timelineAxes.map((axis) => (
            <div
              key={`timeline-axis-${axis.id}`}
              style={{
                position: "absolute",
                left: "0px", // 画面左端から開始
                right: "0px", // 画面右端まで
                top: `${axis.yPosition + panY}px`,
                width: "100%", // 画面幅いっぱい
                height: "3px",
                backgroundColor: axis.color,
                zIndex: 2,
                opacity: 0.8,
              }}
            >
              {/* 年表軸の開始・終了マーカー */}
              <div
                style={{
                  position: "absolute",
                  left: `${Math.max(0, axis.startX)}px`,
                  top: "-6px",
                  width: "12px",
                  height: "15px",
                  backgroundColor: axis.color,
                  borderRadius: "6px 6px 0 0",
                  opacity: 0.9,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: `${Math.min(window.innerWidth - 12, axis.endX)}px`,
                  top: "-6px",
                  width: "12px",
                  height: "15px",
                  backgroundColor: axis.color,
                  borderRadius: "6px 6px 0 0",
                  opacity: 0.9,
                }}
              />
            </div>
          ))}

        {/* イベント表示（行・段システム対応） */}
        {layoutEvents.map((event, index) => {
          const eventX = event.adjustedPosition.x;
          const eventY = event.adjustedPosition.y + panY;
          const isHighlighted =
            highlightedEvents?.some?.((e) => e.id === event.id) ||
            (highlightedEvents?.has && highlightedEvents.has(event.id)) ||
            false;
          const eventWidth = event.calculatedWidth;

          return (
            <React.Fragment key={`event-${event.id}-${index}`}>
              {/* 年号表示 */}
              <div
                style={{
                  position: "absolute",
                  left: `${eventX}px`,
                  top: `${eventY - 25}px`,
                  transform: "translateX(-50%)",
                  fontSize: "10px",
                  color: event.timelineColor || "#999",
                  fontWeight: "500",
                  textAlign: "center",
                  pointerEvents: "none",
                  zIndex: 15,
                }}
              >
                {event.startDate?.getFullYear()}
              </div>

              {/* 延長線（中段以外） */}
              {event.needsExtensionLine && event.timelineInfo && (
                <div
                  style={{
                    position: "absolute",
                    left: `${eventX}px`,
                    top: `${
                      Math.min(eventY, event.timelineInfo.rowY || eventY) + panY
                    }px`,
                    width: "2px",
                    height: `${Math.abs(
                      eventY - (event.timelineInfo.rowY || eventY)
                    )}px`,
                    backgroundColor: event.timelineColor || "#999",
                    opacity: 0.6,
                    zIndex: 8,
                    pointerEvents: "none",
                  }}
                />
              )}

              {/* イベントカード */}
              <div
                data-event-id={event.id}
                className="no-pan"
                style={{
                  position: "absolute",
                  left: `${eventX - eventWidth / 2}px`,
                  top: `${eventY - TIMELINE_CONFIG.EVENT_HEIGHT / 2}px`,
                  width: `${eventWidth}px`,
                  height: `${TIMELINE_CONFIG.EVENT_HEIGHT}px`,
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
                  boxShadow: isHighlighted
                    ? "0 4px 12px rgba(245, 158, 11, 0.4)"
                    : "0 2px 4px rgba(0, 0, 0, 0.1)",
                  zIndex: isHighlighted ? 20 : 10,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  padding: "0 8px",
                  transition: "all 0.2s ease",
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  console.log("イベントダブルクリック検出:", event.title);
                  handleEventDoubleClick(event);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseEnter={(e) => {
                  e.target.style.transform = "scale(1.02)";
                  e.target.style.boxShadow = isHighlighted
                    ? "0 6px 16px rgba(245, 158, 11, 0.6)"
                    : "0 4px 8px rgba(0, 0, 0, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "scale(1)";
                  e.target.style.boxShadow = isHighlighted
                    ? "0 4px 12px rgba(245, 158, 11, 0.4)"
                    : "0 2px 4px rgba(0, 0, 0, 0.1)";
                }}
                title={`${event.title}\n${
                  event.startDate?.toLocaleDateString("ja-JP") || ""
                }\n年表: ${
                  event.timelineInfo?.timelineName || "メイン"
                }\nダブルクリックで編集`}
              >
                {truncateTitle ? truncateTitle(event.title, 12) : event.title}
              </div>
            </React.Fragment>
          );
        })}

        {/* ネットワークモード：滑らかな接続線 */}
        {isNetworkMode &&
          networkConnections.map((timeline, index) => (
            <SmoothLines
              key={timeline.id}
              timeline={timeline}
              panY={panY}
              displayState={getTimelineDisplayState()}
              onHover={handleTimelineHover}
              onClick={onTimelineClick}
              zIndex={10 + index}
            />
          ))}

        {/* イベント表示 */}
        {layoutEvents.map((event, index) => {
          const eventX = event.adjustedPosition.x;
          const eventY = event.adjustedPosition.y + panY;
          const isHighlighted =
            highlightedEvents?.some?.((e) => e.id === event.id) ||
            (highlightedEvents?.has && highlightedEvents.has(event.id)) ||
            false;
          const eventWidth = event.calculatedWidth;

          return (
            <React.Fragment key={`event-${event.id}-${index}`}>
              {/* 年号表示 */}
              <div
                style={{
                  position: "absolute",
                  left: `${eventX}px`,
                  top: `${eventY - 20}px`,
                  transform: "translateX(-50%)",
                  fontSize: "10px",
                  color: event.timelineColor || "#999",
                  fontWeight: "500",
                  textAlign: "center",
                  pointerEvents: "none",
                  zIndex: 15,
                }}
              >
                {event.startDate?.getFullYear()}
              </div>

              {/* イベントカード */}
              <div
                data-event-id={event.id}
                className="no-pan"
                style={{
                  position: "absolute",
                  left: `${eventX - eventWidth / 2}px`,
                  top: `${eventY - TIMELINE_CONFIG.EVENT_HEIGHT / 2}px`,
                  width: `${eventWidth}px`,
                  height: `${TIMELINE_CONFIG.EVENT_HEIGHT}px`,
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
                  console.log(
                    "VisualTab: イベントダブルクリック検出:",
                    event.title
                  );
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
        {timelineAxes.map((axis) => {
          const timeline = displayTimelines?.find((t) => t.id === axis.id);
          const isTemporary = timeline?.type === "temporary";

          return (
            <TimelineCard
              key={`timeline-card-${axis.id}`}
              timeline={timeline}
              position={{ x: axis.cardX, y: axis.yPosition + panY - 30 }}
              isTemporary={isTemporary}
              onEdit={() => {
                console.log(
                  "VisualTab: TimelineCard onEdit呼び出し:",
                  timeline?.name
                );
                if (timeline && onTimelineClick) {
                  onTimelineClick(timeline);
                }
              }}
              onDelete={() => {
                if (isTemporary && onDeleteTempTimeline) {
                  onDeleteTempTimeline(axis.id);
                } else if (!isTemporary && onDeleteTimeline) {
                  onDeleteTimeline(axis.id);
                }
              }}
              onToggleVisibility={(timelineId) => {
                if (onTimelineUpdate && !isTemporary) {
                  const updatedTimelines = timelines.map((t) =>
                    t.id === timelineId ? { ...t, isVisible: !t.isVisible } : t
                  );
                  onTimelineUpdate(updatedTimelines);
                }
              }}
              className="no-pan"
            />
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

      {/* フローティングUI：左上の検索パネル */}
      <div
        className="no-pan"
        style={{
          position: "absolute",
          left: "20px",
          top: "20px",
          zIndex: 30,
        }}
      >
        <SearchPanel
          searchTerm={searchTerm}
          highlightedEvents={highlightedEvents}
          onSearchChange={onSearchChange}
          onCreateTimeline={handleCreateTimeline}
          onCreateTempTimeline={onCreateTempTimeline}
          onDeleteTimeline={onDeleteTimeline}
          onDeleteTempTimeline={onDeleteTempTimeline}
          getTopTagsFromSearch={getTopTagsFromSearch}
          timelines={timelines}
          tempTimelines={tempTimelines}
          isWikiMode={isWikiMode}
        />
      </div>

      {/* モード表示 */}
      <div
        style={{
          position: "absolute",
          right: "20px",
          top: "20px",
          zIndex: 30,
          backgroundColor: "rgba(255,255,255,0.9)",
          padding: "8px 12px",
          borderRadius: "6px",
          fontSize: "12px",
          color: "#6b7280",
          border: "1px solid #e5e7eb",
        }}
      >
        {isWikiMode ? "📚 Wiki" : "👤 個人"} |{" "}
        {isNetworkMode ? "🕸️ ネットワーク" : "📊 年表"}
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
            backgroundColor: isWikiMode ? "#6b7280" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "56px",
            height: "56px",
            fontSize: "24px",
            cursor: isWikiMode ? "not-allowed" : "pointer",
            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: isWikiMode ? 0.5 : 1,
          }}
          title={isWikiMode ? "Wikiでは承認申請が必要です" : "イベントを追加"}
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
