// src/components/tabs/NetworkTab.js - TimelineTabベースのネットワーク版
import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { SearchPanel } from '../ui/SearchPanel';
import { TimelineCard } from '../ui/TimelineCard';
import { EventGroupIcon, GroupTooltip, GroupCard } from '../ui/EventGroup';
import { EventModal } from '../modals/EventModal';
import TimelineModal from '../modals/TimelineModal';

// 既存のhooksとutils（TimelineTabと同じ）
import { useTimelineLogic } from '../../hooks/useTimelineLogic';
import { useDragDrop } from '../../hooks/useDragDrop';
import { createTimelineStyles } from '../../styles/timelineStyles';
import { TIMELINE_CONFIG } from '../../constants/timelineConfig';
import { extractTagsFromDescription, truncateTitle } from '../../utils/timelineUtils';

// 統合座標管理フック（TimelineTabと同じ）
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
      const newScale = Math.max(0.1, Math.min(10, scale * zoomFactor));
      const newPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * newScale;
      const newPanX = mouseX - (yearAtMouse - -5000) * newPixelsPerYear;

      setScale(newScale);
      setPanX(newPanX);
    },
    [scale, getYearFromX, timelineRef]
  );

  // マウスイベント処理
  const handleMouseDown = useCallback((e) => {
    if (e.button === 0) {
      setIsDragging(true);
      setLastMouse({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (isDragging) {
        const deltaX = e.clientX - lastMouse.x;
        const deltaY = e.clientY - lastMouse.y;
        setPanX((prev) => prev + deltaX);
        setPanY((prev) => prev + deltaY);
        setLastMouse({ x: e.clientX, y: e.clientY });
      }
    },
    [isDragging, lastMouse]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 初期位置リセット
  const resetToInitialPosition = useCallback(() => {
    const initialPixelsPerYear =
      TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * TIMELINE_CONFIG.DEFAULT_SCALE;
    setScale(TIMELINE_CONFIG.DEFAULT_SCALE);
    setPanX(window.innerWidth - (2080 - -5000) * initialPixelsPerYear);
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

// 統合レイアウト管理（TimelineTabと同じ）
const useUnifiedLayout = (events, timelines, coordinates, calculateTextWidth) => {
  const { getXFromYear } = coordinates;

  // レイアウト済みイベント
  const layoutEvents = useMemo(() => {
    if (!events || events.length === 0) {
      console.log("📊 レイアウト: イベントなし");
      return [];
    }

    console.log(`🎯 layoutEvents 開始: ${events.length}件のイベント`);
    const layoutResults = [];
    const occupiedPositions = new Map();

    const sortedEvents = events.sort((a, b) => {
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

  // 年表軸の情報を計算（ネットワーク用に修正）
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

const NetworkTab = ({ isPersonalMode, isWikiMode, currentPageMode }) => {
  const timelineRef = useRef(null);

  // 統合座標管理（TimelineTabと同じ）
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

  // データ管理（TimelineTabと同じ）
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

  // 統合レイアウト管理（TimelineTabと同じ）
  const { layoutEvents, timelineAxes } = useUnifiedLayout(
    events,
    Timelines,
    coordinates,
    calculateTextWidth
  );

  // グローバルマウスイベント（TimelineTabと同じ）
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

  // 年マーカー生成（TimelineTabと同じ）
  const generateYearMarkers = useMemo(() => {
    const markers = [];
    const startYear = getYearFromX(0);
    const endYear = getYearFromX(window.innerWidth);

    let interval = 100;
    if (scale > 5) interval = 10;
    else if (scale > 2) interval = 25;
    else if (scale > 1) interval = 50;

    const start = Math.floor(startYear / interval) * interval;
    const end = Math.ceil(endYear / interval) * interval;

    for (let year = start; year <= end; year += interval) {
      const x = getXFromYear(year);
      if (x >= -50 && x <= window.innerWidth + 50) {
        const fontSize = scale > 3 ? 14 : scale > 1.5 ? 12 : 10;
        markers.push(
          <div
            key={year}
            style={{
              position: "absolute",
              left: `${x}px`,
              top: 0,
              bottom: 0,
              borderLeft: "1px solid rgba(221, 221, 221, 0.6)",
              pointerEvents: "none",
              zIndex: 0,
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

  // イベント処理関数（TimelineTabと同じ）
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

  // ネットワーク用：複数年表接続線を描画する関数
  const renderNetworkConnections = (event) => {
    if (!event.timelineInfos || event.timelineInfos.length <= 1) {
      return null;
    }

    const eventX = event.adjustedPosition.x;
    const eventY = event.adjustedPosition.y + panY;

    return event.timelineInfos.map((timelineInfo) => {
      const timeline = Timelines.find(t => t.id === timelineInfo.timelineId);
      if (!timeline || !timeline.isVisible) return null;

      const timelineAxis = timelineAxes.find(axis => axis.id === timeline.id);
      if (!timelineAxis) return null;

      const connectionY = timelineAxis.yPosition + panY;

      return (
        <div
          key={`connection-${event.id}-${timeline.id}`}
          style={{
            position: 'absolute',
            left: `${eventX}px`,
            top: `${Math.min(eventY, connectionY)}px`,
            width: '2px',
            height: `${Math.abs(eventY - connectionY)}px`,
            backgroundColor: timeline.color || '#6b7280',
            opacity: timelineInfo.isTemporary ? 0.5 : 0.8,
            borderLeft: timelineInfo.isTemporary ? '2px dashed' : '2px solid',
            borderColor: timeline.color || '#6b7280',
            zIndex: 5,
          }}
        />
      );
    });
  };

  console.log("NetworkTab render:", {
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
      {/* SearchPanel（TimelineTabと同じ） */}
      <SearchPanel
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        highlightedEvents={highlightedEvents}
        getTopTagsFromSearch={getTopTagsFromSearch}
        onCreateTimeline={handleCreateTimeline}
        events={events}
        isWikiMode={isWikiMode}
      />

      {/* メインネットワーク表示エリア */}
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
        {/* 年マーカー（TimelineTabと同じ） */}
        {generateYearMarkers}

        {/* メインタイムライン線（TimelineTabと同じ） */}
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

        {/* 年表線（TimelineTabと同じ） */}
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

        {/* ネットワーク接続線（NetworkTab固有） */}
        {layoutEvents.map((event) => renderNetworkConnections(event))}

        {/* イベント表示（TimelineTabとほぼ同じ、接続線追加） */}
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
                  🕸️ イベントが表示されていません
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

            // ネットワーク用：複数接続があるかチェック
            const hasMultipleConnections = event.timelineInfos && event.timelineInfos.length > 1;

            return (
              <div
                key={event.id}
                data-event-id={event.id}
                style={{
                  position: "absolute",
                  left: `${eventX - event.calculatedWidth / 2}px`,
                  top: `${eventY - TIMELINE_CONFIG.EVENT_HEIGHT / 2}px`,
                  width: `${event.calculatedWidth}px`,
                  height: `${TIMELINE_CONFIG.EVENT_HEIGHT}px`,
                  backgroundColor: isHighlighted
                    ? "#fef3c7"
                    : hasMultipleConnections
                    ? "#e0f2fe"  // ネットワーク接続ありの場合は薄い青
                    : "#ffffff",
                  border: `2px solid ${
                    isHighlighted
                      ? "#f59e0b"
                      : hasMultipleConnections
                      ? "#0ea5e9"  // ネットワーク接続ありの場合は青
                      : "#e5e7eb"
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
                    : hasMultipleConnections
                    ? "0 4px 12px rgba(14, 165, 233, 0.3)"
                    : "0 2px 4px rgba(0, 0, 0, 0.1)",
                  zIndex: isHighlighted ? 10 : hasMultipleConnections ? 8 : 2,
                  transition: "all 0.2s ease",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  padding: "0 8px",
                }}
                onDoubleClick={() => handleEventDoubleClick(event)}
                title={`${event.title}${hasMultipleConnections ? ' (複数年表)' : ''}`}
              >
                {truncateTitle(event.title || "無題", event.calculatedWidth)}
                {hasMultipleConnections && (
                  <span style={{ 
                    marginLeft: '4px', 
                    fontSize: '9px', 
                    color: '#0ea5e9',
                    fontWeight: 'bold'
                  }}>
                    🕸️
                  </span>
                )}
              </div>
            );
          });
        })()}

        {/* 年表カード（TimelineTabと同じ） */}
        {timelineAxes.map((axis) => (
          <TimelineCard
            key={`timeline-card-${axis.id}`}
            timeline={Timelines.find((t) => t.id === axis.id)}
            position={{ x: axis.cardX, y: axis.yPosition + panY - 25 }}
            onDoubleClick={() => {
              const timeline = Timelines.find((t) => t.id === axis.id);
              if (timeline && openTimelineModal) {
                openTimelineModal(timeline);
              }
            }}
            onDelete={(timelineId) => {
              if (deleteTimeline) deleteTimeline(timelineId);
            }}
            isWikiMode={isWikiMode}
          />
        ))}
      </div>

      {/* イベント追加FAB（TimelineTabと同じ） */}
      <button
        style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          backgroundColor: "#3b82f6",
          color: "white",
          border: "none",
          fontSize: "24px",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          zIndex: 1000,
          transition: "all 0.2s",
        }}
        onClick={handleAddEvent}
        onMouseEnter={(e) => {
          e.target.style.transform = "scale(1.1)";
          e.target.style.backgroundColor = "#2563eb";
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "scale(1)";
          e.target.style.backgroundColor = "#3b82f6";
        }}
        title="イベントを追加"
      >
        +
      </button>

      {/* 初期位置リセットボタン（TimelineTabと同じ） */}
      <button
        style={{
          position: "fixed",
          bottom: "100px",
          right: "30px",
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          backgroundColor: "#6b7280",
          color: "white",
          border: "none",
          fontSize: "16px",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          zIndex: 1000,
          transition: "all 0.2s",
        }}
        onClick={resetToInitialPosition}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = "#4b5563";
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = "#6b7280";
        }}
        title="初期位置に戻す"
      >
        🎯
      </button>

      {/* モーダル（TimelineTabと同じ） */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          position={modalPosition}
          onClose={closeEventModal}
          onUpdate={updateEvent}
          onDelete={deleteEvent}
          isWikiMode={isWikiMode}
        />
      )}

      {selectedTimeline && (
        <TimelineModal
          timeline={selectedTimeline}
          onClose={closeTimelineModal}
          onUpdate={(updatedTimeline) => {
            const updatedTimelines = Timelines.map((t) =>
              t.id === updatedTimeline.id ? updatedTimeline : t
            );
            setCreatedTimelines(updatedTimelines);
          }}
          onDelete={deleteTimeline}
          isWikiMode={isWikiMode}
        />
      )}

      {/* グループカード（TimelineTabと同じ） */}
      {hoveredGroup && (
        <GroupCard
          group={hoveredGroup}
          onEventClick={handleEventDoubleClick}
          onClose={() => setHoveredGroup(null)}
        />
      )}

      {/* ツールチップ（TimelineTabと同じ） */}
      <GroupTooltip hoveredGroup={hoveredGroup} />
    </div>
  );
};

export default NetworkTab;