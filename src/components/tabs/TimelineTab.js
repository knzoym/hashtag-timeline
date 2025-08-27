import React, {
  useRef,
  useCallback,
  useState,
  useEffect,
  useMemo,
} from "react";
import { SearchPanel } from "../ui/SearchPanel";
import { TimelineCard } from "../ui/TimelineCard";
import { EventGroupIcon, GroupTooltip, GroupCard } from "../ui/EventGroup";
import { EventModal } from "../modals/EventModal";
import TimelineModal from "../modals/TimelineModal";

import { useTimelineLogic } from "../../hooks/useTimelineLogic";
import { TIMELINE_CONFIG } from "../../constants/timelineConfig";
import { truncateTitle } from "../../utils/timelineUtils";

// 統合座標管理フック
const useUnifiedCoordinates = (timelineRef) => {
  const [scale, setScale] = useState(TIMELINE_CONFIG.DEFAULT_SCALE);
  const [panX, setPanX] = useState(() => {
    const initialPixelsPerYear =
      TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * TIMELINE_CONFIG.DEFAULT_SCALE;
    return window.innerWidth - (2080 - -5000) * initialPixelsPerYear;
  });
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  const pixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * scale;

  // 年から座標への変換
  const getXFromYear = useCallback(
    (year) => {
      return (year - -5000) * pixelsPerYear + panX;
    },
    [pixelsPerYear, panX]
  );

  // 座標から年への変換
  const getYearFromX = useCallback(
    (x) => {
      return -5000 + (x - panX) / pixelsPerYear;
    },
    [pixelsPerYear, panX]
  );

  // ホイールイベント処理
  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      if (!timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const yearAtMouse = getYearFromX(mouseX);

      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.05, Math.min(100, scale * zoomFactor));
      const newPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * newScale;

      let newPanX = mouseX - (yearAtMouse - -5000) * newPixelsPerYear;

      const timelineWidth = (5000 - -5000) * newPixelsPerYear;
      const viewportWidth = window.innerWidth;
      const minPanX = -(timelineWidth - viewportWidth);
      const maxPanX = 0;
      newPanX = Math.max(minPanX, Math.min(maxPanX, newPanX));

      setScale(newScale);
      setPanX(newPanX);
    },
    [scale, panX, getYearFromX]
  );

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest(".no-pan")) return;

    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - lastMouse.x;
      const deltaY = e.clientY - lastMouse.y;

      let newPanX = panX + deltaX;
      const newPanY = panY + deltaY;

      const timelineWidth = (5000 - -5000) * pixelsPerYear;
      const viewportWidth = window.innerWidth;
      const minPanX = -(timelineWidth - viewportWidth);
      const maxPanX = 0;
      newPanX = Math.max(minPanX, Math.min(maxPanX, newPanX));

      setPanX(newPanX);
      setPanY(newPanY);
      setLastMouse({ x: e.clientX, y: e.clientY });
    },
    [isDragging, lastMouse, panX, panY, pixelsPerYear]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resetToInitialPosition = useCallback(() => {
    const initialPixelsPerYear =
      TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * TIMELINE_CONFIG.DEFAULT_SCALE;
    const initialPanX =
      window.innerWidth - (2080 - -5000) * initialPixelsPerYear;

    setScale(TIMELINE_CONFIG.DEFAULT_SCALE);
    setPanX(initialPanX);
    setPanY(0);
  }, []);

  return {
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
  };
};

// 統合レイアウト管理フック
const useUnifiedLayout = (
  events,
  timelines,
  coordinates,
  calculateTextWidth
) => {
  const { scale, panX, panY, pixelsPerYear, getXFromYear } = coordinates;

  // イベントレイアウト計算
  const layoutEvents = useMemo(() => {
    console.log("🔧 layoutEvents 計算開始", {
      eventsCount: events?.length || 0,
      timelinesCount: timelines?.length || 0,
    });

    if (!events || events.length === 0) {
      console.log("⚠️ イベントデータがありません");
      return [];
    }

    const layoutResults = [];
    const occupiedPositions = new Map();

    // 年でソートされたイベント
    const sortedEvents = [...events].sort((a, b) => {
      const aYear = a.startDate ? a.startDate.getFullYear() : 2000;
      const bYear = b.startDate ? b.startDate.getFullYear() : 2000;
      return aYear - bYear;
    });

    sortedEvents.forEach((event) => {
      if (!event.startDate) {
        console.warn(`⚠️ イベント "${event.title}" に開始日がありません`);
        return;
      }

      const eventX = getXFromYear(event.startDate.getFullYear());
      const textWidth = calculateTextWidth
        ? calculateTextWidth(event.title || "")
        : 60;
      const eventWidth = Math.max(60, textWidth + 20);

      let eventY = TIMELINE_CONFIG.MAIN_TIMELINE_Y;
      let level = 0;

      // 重複回避のためのY位置調整
      while (level < 20) {
        const currentY =
          TIMELINE_CONFIG.MAIN_TIMELINE_Y +
          level * (TIMELINE_CONFIG.EVENT_HEIGHT + 15);
        const occupiedAtThisY = occupiedPositions.get(currentY) || [];

        const hasCollision = occupiedAtThisY.some((occupiedEvent) => {
          const distance = Math.abs(eventX - occupiedEvent.x);
          const minDistance = (eventWidth + occupiedEvent.width) / 2 + 10;
          return distance < minDistance;
        });

        if (!hasCollision) {
          eventY = currentY;
          if (!occupiedPositions.has(currentY)) {
            occupiedPositions.set(currentY, []);
          }
          occupiedPositions.get(currentY).push({
            x: eventX,
            width: eventWidth,
            eventId: event.id,
          });
          break;
        }
        level++;
      }

      layoutResults.push({
        ...event,
        adjustedPosition: { x: eventX, y: eventY },
        calculatedWidth: eventWidth,
        hiddenByGroup: false,
        isGroup: false,
        level,
      });
    });

    console.log(`🎯 layoutEvents 完了: ${layoutResults.length}件配置`);
    return layoutResults;
  }, [events, getXFromYear, calculateTextWidth]);

  // 年表軸の情報を計算
  const timelineAxes = useMemo(() => {
    return timelines
      .filter((timeline) => timeline.isVisible && timeline.events?.length > 0)
      .map((timeline, index) => {
        const baseY =
          TIMELINE_CONFIG.FIRST_ROW_Y + index * TIMELINE_CONFIG.ROW_HEIGHT;
        const axisY = baseY + TIMELINE_CONFIG.ROW_HEIGHT / 2;

        const years = timeline.events.map((e) => e.startDate.getFullYear());
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);

        const startX = getXFromYear(minYear);
        const endX = getXFromYear(maxYear);

        return {
          id: timeline.id,
          name: timeline.name,
          color: timeline.color,
          yPosition: axisY,
          startX,
          endX,
          minYear,
          maxYear,
          cardX: Math.max(20, startX - 120),
        };
      });
  }, [timelines, getXFromYear]);

  return {
    layoutEvents,
    timelineAxes,
  };
};

const TimelineTab = ({ isPersonalMode, isWikiMode, currentPageMode }) => {
  const timelineRef = useRef(null);

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

  // データ管理（useTimelineLogicから座標系を除いて使用）
  const timelineData = useTimelineLogic(
    timelineRef,
    { current: false },
    { current: 0 },
    { current: 0 },
    false
  );

  const {
    events,
    Timelines,
    setCreatedTimelines,
    searchTerm,
    highlightedEvents,
    selectedEvent,
    selectedTimeline,
    hoveredGroup,
    setHoveredGroup,
    createTimeline,
    deleteTimeline,
    openNewEventModal,
    openEventModal,
    closeEventModal,
    openTimelineModal,
    closeTimelineModal,
    handleSearchChange,
    getTopTagsFromSearch,
    calculateTextWidth,
    updateEvent,
    deleteEvent,
    isModalOpen,
    modalPosition,
    expandedGroups,
    toggleEventGroup,
  } = timelineData;

  // 統合レイアウト管理
  const { layoutEvents, timelineAxes } = useUnifiedLayout(
    events,
    Timelines,
    coordinates,
    calculateTextWidth
  );

  // グローバルマウスイベント
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDragging) handleMouseMove(e);
    };
    const handleGlobalMouseUp = () => {
      if (isDragging) handleMouseUp();
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 年マーカー生成
  const generateYearMarkers = useCallback(() => {
    const markers = [];

    let yearInterval;
    if (scale >= 10) yearInterval = 1;
    else if (scale >= 5) yearInterval = 5;
    else if (scale >= 2) yearInterval = 10;
    else if (scale >= 1) yearInterval = 25;
    else if (scale >= 0.5) yearInterval = 50;
    else if (scale >= 0.2) yearInterval = 100;
    else if (scale >= 0.1) yearInterval = 200;
    else if (scale >= 0.05) yearInterval = 500;
    else yearInterval = 1000;

    const viewportStart = -panX / pixelsPerYear - 5000;
    const viewportEnd = (window.innerWidth - panX) / pixelsPerYear - 5000;
    const startYear = Math.floor(viewportStart / yearInterval) * yearInterval;
    const endYear = Math.ceil(viewportEnd / yearInterval) * yearInterval;

    for (
      let year = Math.max(-5000, startYear);
      year <= Math.min(5000, endYear);
      year += yearInterval
    ) {
      const x = getXFromYear(year);
      if (x > -200 && x < window.innerWidth + 200) {
        const fontSize = Math.max(
          10,
          Math.min(14, 12 + Math.log10(Math.max(0.01, scale)) * 2)
        );

        markers.push(
          <div
            key={year}
            style={{
              position: "absolute",
              left: `${x}px`,
              top: "0px",
              height: "100%",
              borderLeft: "1px solid #ddd",
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            <span
              style={{
                position: "absolute",
                top: "10px",
                left: "5px",
                fontSize: `${fontSize}px`,
                color: "#666",
                fontWeight: "500",
                userSelect: "none",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                padding: "2px 6px",
                borderRadius: "3px",
                border: "1px solid rgba(221, 221, 221, 0.7)",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
              }}
            >
              {year}
            </span>

            <span
              style={{
                position: "absolute",
                bottom: "10px",
                left: "5px",
                fontSize: `${fontSize}px`,
                color: "#666",
                fontWeight: "500",
                userSelect: "none",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                padding: "2px 6px",
                borderRadius: "3px",
                border: "1px solid rgba(221, 221, 221, 0.7)",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
              }}
            >
              {year}
            </span>
          </div>
        );
      }
    }
    return markers;
  }, [scale, pixelsPerYear, panX, getXFromYear]);

  // イベント処理関数
  const handleEventDoubleClick = useCallback(
    (event) => {
      console.log("Event double click:", event.title);
      if (openEventModal) openEventModal(event);
    },
    [openEventModal]
  );

  const handleAddEvent = useCallback(() => {
    console.log("Add event button clicked");
    if (openNewEventModal) openNewEventModal();
  }, [openNewEventModal]);

  const handleCreateTimeline = useCallback(() => {
    console.log(
      "Create timeline clicked, highlighted:",
      highlightedEvents?.size || 0
    );
    if (createTimeline) createTimeline();
  }, [createTimeline, highlightedEvents]);

  const handleTimelineDoubleClick = useCallback(
    (e) => {
      if (!e.target.closest("[data-event-id]")) {
        handleAddEvent();
      }
    },
    [handleAddEvent]
  );

  const safeSetHoveredGroup = setHoveredGroup || (() => {});
  const handleGroupHover = useCallback(
    (groupId, groupData) => {
      safeSetHoveredGroup(groupId ? { id: groupId, data: groupData } : null);
    },
    [safeSetHoveredGroup]
  );

  console.log("TimelineTab render:", {
    events: events?.length || 0,
    timelines: Timelines?.length || 0,
    layoutEvents: layoutEvents?.length || 0,
    scale: scale?.toFixed(2),
    panX: Math.round(panX || 0),
    panY: Math.round(panY || 0),
    isDragging,
    pixelsPerYear: Math.round(pixelsPerYear || 0),
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
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleTimelineDoubleClick}
      >
        {/* 年マーカー */}
        {generateYearMarkers()}

        {/* メインタイムライン線 */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${TIMELINE_CONFIG.MAIN_TIMELINE_Y + panY}px`,
            height: "3px",
            backgroundColor: "#374151",
            zIndex: 1,
          }}
        />

        {/* 年表線 */}
        {timelineAxes.map((axis) => (
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
        ))}

        {/* イベント表示（統合レイアウト使用） */}
        {(() => {
          if (!layoutEvents || layoutEvents.length === 0) {
            return (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  padding: "20px",
                  backgroundColor: "#fff3cd",
                  border: "1px solid #ffeaa7",
                  borderRadius: "8px",
                  textAlign: "center",
                  zIndex: 30,
                }}
              >
                <div
                  style={{
                    fontSize: "16px",
                    color: "#856404",
                    marginBottom: "8px",
                  }}
                >
                  📊 イベントが表示されていません
                </div>
                <div style={{ fontSize: "12px", color: "#6c757d" }}>
                  Events: {events?.length || 0}件読み込み済み
                </div>
              </div>
            );
          }

          return layoutEvents.map((event, index) => {
            const eventX = event.adjustedPosition.x;
            const eventY = event.adjustedPosition.y + panY;
            const isHighlighted = highlightedEvents?.has
              ? highlightedEvents.has(event.id)
              : false;
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
                      isHighlighted
                        ? "#f59e0b"
                        : event.timelineColor || "#e5e7eb"
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
                  title={`${event.title}\n${
                    event.startDate?.toLocaleDateString("ja-JP") || ""
                  }\nダブルクリックで編集`}
                >
                  {truncateTitle ? truncateTitle(event.title, 12) : event.title}
                </div>
              </React.Fragment>
            );
          });
        })()}

        {/* 年表概要カード */}
        {timelineAxes.map((axis) => {
          const timeline = Timelines.find((t) => t.id === axis.id);
          if (!timeline) return null;

          return (
            <TimelineCard
              key={`timeline-card-${axis.id}`}
              timeline={timeline}
              position={{
                x: axis.cardX,
                y: axis.yPosition + panY - 30, // この行が重要：panY を正しく適用
              }}
              onEdit={() => {
                if (openTimelineModal) openTimelineModal(timeline);
              }}
              onDelete={() => deleteTimeline(axis.id)}
              onToggleVisibility={(timelineId) => {
                setCreatedTimelines((prev) =>
                  prev.map((t) =>
                    t.id === timelineId ? { ...t, isVisible: !t.isVisible } : t
                  )
                );
              }}
              className="no-pan"
            />
          );
        })}

        {/* 現在線 */}
        <div
          style={{
            position: "absolute",
            left: `${getXFromYear(2025)}px`,
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
            現在 (2025)
          </div>
        </div>
      </div>

      {/* フローティングパネル */}
      <div
        className="search-panel no-pan"
        style={{
          position: "absolute",
          left: "20px",
          top: "20px",
          zIndex: 30,
          pointerEvents: "auto",
        }}
      >
        <SearchPanel
          searchTerm={searchTerm}
          highlightedEvents={highlightedEvents}
          onSearchChange={handleSearchChange}
          onCreateTimeline={handleCreateTimeline}
          onDeleteTimeline={deleteTimeline}
          getTopTagsFromSearch={getTopTagsFromSearch}
          styles={{}}
        />
      </div>

      {/* ボタン群 */}
      <div
        className="no-pan"
        style={{
          position: "absolute",
          right: "20px",
          bottom: "20px",
          zIndex: 30,
        }}
      >
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

      <div
        className="no-pan"
        style={{
          position: "absolute",
          right: "90px",
          bottom: "20px",
          zIndex: 30,
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
      </div>

      {/* モーダル */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={closeEventModal}
          onUpdate={updateEvent}
          onDelete={deleteEvent}
          isWikiMode={isWikiMode}
          position={modalPosition}
          timelines={Timelines || []}
        />
      )}

      {selectedTimeline && (
        <TimelineModal
          timeline={selectedTimeline}
          onClose={closeTimelineModal}
          onUpdate={() => {}}
          onDelete={deleteTimeline}
          isWikiMode={isWikiMode}
        />
      )}

      {/* デバッグ情報 */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "20px",
          padding: "8px 12px",
          backgroundColor: "rgba(0,0,0,0.8)",
          color: "white",
          borderRadius: "6px",
          fontSize: "10px",
          fontFamily: "monospace",
          zIndex: 100,
          maxWidth: "400px",
        }}
      >
        統合Timeline状況:
        <br />
        Events: {events?.length || 0} | Layout: {layoutEvents?.length || 0} |
        Timelines: {Timelines?.length || 0}
        <br />
        Scale: {scale?.toFixed(2)} | Pan: ({Math.round(panX || 0)},{" "}
        {Math.round(panY || 0)})<br />
        PixelsPerYear: {Math.round(pixelsPerYear || 0)} | Dragging:{" "}
        {isDragging ? "Yes" : "No"}
        <br />
        Search: "{searchTerm || ""}" | Highlighted:{" "}
        {highlightedEvents?.size || 0}
      </div>

      {/* デバッグ情報 */}
      {process.env.NODE_ENV === "development" && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "8px",
            borderRadius: "4px",
            fontSize: "10px",
            zIndex: 50,
            fontFamily: "monospace",
          }}
        >
          <div>Events: {events?.length || 0}</div>
          <div>Layout: {layoutEvents?.length || 0}</div>
          <div>
            Timelines: {Timelines?.filter((t) => t.isVisible).length || 0}
          </div>
          <div>
            Pan: ({Math.round(panX)}, {Math.round(panY)})
          </div>
          <div>Scale: {scale.toFixed(2)}x</div>
        </div>
      )}
    </div>
  );
};

export default TimelineTab;
