// src/components/tabs/VisualTab.js - 昔の描画方式を参考にした修正版
import React, { useRef, useCallback, useState, useMemo } from "react";
import SearchPanel from "../ui/SearchPanel";
import { TimelineCard } from "../ui/TimelineCard";
import { EventModal } from "../modals/EventModal";
import TimelineModal from "../modals/TimelineModal";
import { SmoothLines } from "../ui/SmoothLines";
import { TIMELINE_CONFIG } from "../../constants/timelineConfig";
import { truncateTitle } from "../../utils/timelineUtils";
import { useCoordinate } from "../../hooks/useCoordinate";

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

  // 座標システム（統合されたuseCoordinate）
  const coordinates = useCoordinate(timelineRef);
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

  // テキスト幅計算（昔と同じ）
  const calculateTextWidth = useCallback((text) => {
    if (!text) return 60;
    return Math.min(Math.max(60, text.length * 8), 200);
  }, []);

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

  // 年マーカー生成（昔の方式を復元）
  const yearMarkers = useMemo(() => {
    if (!getXFromYear) return [];
    
    const markers = [];
    const viewportWidth = window.innerWidth;
    
    // スケールに応じた年間隔（昔の計算方式）
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
          fontSize: Math.max(8, Math.min(14, 10 + adjustedScale))
        });
      }
    }
    return markers;
  }, [scale, getXFromYear]);

  // 年表軸計算（昔のシンプルな方式）
  const timelineAxes = useMemo(() => {
    if (!getXFromYear) return [];
    
    const visibleTimelines = displayTimelines.filter(t => t.isVisible !== false);
    const axes = [];
    
    visibleTimelines.forEach((timeline, index) => {
      // 年表に属するイベントを検索
      const timelineEvents = events.filter(event => {
        // timelineInfos方式
        if (event.timelineInfos?.some(info => info.timelineId === timeline.id && !info.isTemporary)) {
          return true;
        }
        // eventIds方式
        if (timeline.eventIds?.includes(event.id)) {
          return true;
        }
        return false;
      });

      // 年範囲計算
      let minYear = 2020, maxYear = 2025;
      if (timelineEvents.length > 0) {
        const years = timelineEvents
          .map(e => e.startDate?.getFullYear?.())
          .filter(y => y && !isNaN(y));
        if (years.length > 0) {
          minYear = Math.min(...years);
          maxYear = Math.max(...years);
        }
      }

      // 座標計算
      const startX = getXFromYear(minYear);
      const endX = getXFromYear(maxYear);
      const yPosition = TIMELINE_CONFIG.FIRST_ROW_Y + index * TIMELINE_CONFIG.ROW_HEIGHT;
      
      axes.push({
        id: timeline.id,
        name: timeline.name,
        color: timeline.color || '#6b7280',
        yPosition,
        startX,
        endX,
        cardX: Math.max(20, startX - 150),
        eventCount: timelineEvents.length,
        timeline
      });
    });
    
    return axes;
  }, [displayTimelines, events, getXFromYear]);

  // イベント配置計算（昔のシンプルな方式に戻す）
  const layoutEvents = useMemo(() => {
    if (!events || !getXFromYear) return [];
    
    const results = [];
    
    // 年表ごとにイベントを配置
    timelineAxes.forEach(axis => {
      const timelineEvents = events.filter(event => {
        if (event.timelineInfos?.some(info => info.timelineId === axis.id && !info.isTemporary)) {
          return true;
        }
        if (axis.timeline.eventIds?.includes(event.id)) {
          return true;
        }
        return false;
      });

      // 時系列順にソート
      const sortedEvents = [...timelineEvents].sort((a, b) => {
        const aYear = a.startDate ? a.startDate.getFullYear() : 0;
        const bYear = b.startDate ? b.startDate.getFullYear() : 0;
        return aYear - bYear;
      });

      // 3段配置システム（昔の方式）
      const tiers = [[], [], []]; // 上段、中段、下段
      
      sortedEvents.forEach(event => {
        const eventX = getXFromYear(event.startDate?.getFullYear() || 2024);
        const textWidth = calculateTextWidth(event.title);
        const eventWidth = Math.max(60, textWidth + 20);

        // 段配置決定（中段→上段→下段）
        let tierIndex = 1; // 中段から開始
        let placed = false;

        for (const tryTier of [1, 0, 2]) {
          if (canPlaceInTier(tiers[tryTier], eventX, eventWidth)) {
            tierIndex = tryTier;
            placed = true;
            
            // 占有情報を記録
            tiers[tryTier].push({
              x: eventX,
              width: eventWidth,
              startX: eventX - eventWidth / 2,
              endX: eventX + eventWidth / 2
            });
            break;
          }
        }

        if (!placed) {
          tierIndex = 1; // 強制的に中段に配置
        }

        // 最終位置計算
        const eventY = axis.yPosition + (tierIndex - 1) * 40; // 段位置
        const needsExtensionLine = tierIndex !== 1; // 中段以外は延長線

        results.push({
          ...event,
          adjustedPosition: { x: eventX, y: eventY },
          calculatedWidth: eventWidth,
          timelineColor: axis.color,
          timelineInfo: {
            timelineId: axis.id,
            timelineName: axis.name,
            timelineColor: axis.color,
            needsExtensionLine,
            axisY: axis.yPosition
          }
        });
      });
    });

    // メインタイムライン（年表に属さないイベント）
    const ungroupedEvents = events.filter(event => 
      !event.timelineInfos?.length && 
      !timelineAxes.some(axis => axis.timeline.eventIds?.includes(event.id))
    );

    ungroupedEvents.forEach(event => {
      const eventX = getXFromYear(event.startDate?.getFullYear() || 2024);
      const textWidth = calculateTextWidth(event.title);
      const eventWidth = Math.max(60, textWidth + 20);
      
      results.push({
        ...event,
        adjustedPosition: { x: eventX, y: TIMELINE_CONFIG.MAIN_TIMELINE_Y },
        calculatedWidth: eventWidth,
        timelineColor: '#6b7280',
        timelineInfo: null
      });
    });

    return results;
  }, [events, timelineAxes, getXFromYear, calculateTextWidth]);

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
    if (!isNetworkMode) return [];
    
    const connections = [];
    
    timelineAxes.forEach(axis => {
      const connectionPoints = layoutEvents
        .filter(event => event.timelineInfo?.timelineId === axis.id)
        .map(event => ({
          x: event.adjustedPosition.x,
          y: event.adjustedPosition.y
        }));

      if (connectionPoints.length > 1) {
        connections.push({
          id: axis.id,
          name: axis.name,
          color: axis.color,
          points: connectionPoints
        });
      }
    });

    return connections;
  }, [isNetworkMode, timelineAxes, layoutEvents]);

  // イベントハンドラー
  const handleEventDoubleClick = useCallback((event) => {
    console.log("VisualTab: Event double click:", event.title);
    if (onEventClick) {
      onEventClick(event);
    }
  }, [onEventClick]);

  const handleAddEvent = useCallback(() => {
    if (isWikiMode) {
      alert("Wikiモードでのイベント追加は承認が必要です。イベント編集タブから申請してください。");
      return;
    }
    if (onAddEvent) {
      onAddEvent({
        title: "新規イベント",
        startDate: new Date(),
        description: "",
        tags: [],
      });
    }
  }, [onAddEvent, isWikiMode]);

  const handleCreateTimeline = useCallback(() => {
    if (isWikiMode) {
      if (onCreateTempTimeline) {
        onCreateTempTimeline();
      }
    } else {
      if (onCreateTimeline) {
        onCreateTimeline();
      }
    }
  }, [onCreateTimeline, onCreateTempTimeline, isWikiMode]);

  const handleTimelineDoubleClick = useCallback((e) => {
    if (!e.target.closest("[data-event-id]")) {
      handleAddEvent();
    }
  }, [handleAddEvent]);

  console.log(`VisualTab ${isNetworkMode ? "Network" : "Timeline"} render:`, {
    events: events?.length || 0,
    timelines: displayTimelines?.length || 0,
    layoutEvents: layoutEvents?.length || 0,
    connections: networkConnections?.length || 0,
    scale: scale?.toFixed(2),
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
        {yearMarkers.map((marker) => (
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
          </div>
        ))}

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

        {/* タイムラインモード：年表軸 */}
        {!isNetworkMode &&
          timelineAxes.map((axis) => (
            <div
              key={`timeline-axis-${axis.id}`}
              style={{
                position: "absolute",
                left: "0px",
                right: "0px",
                top: `${axis.yPosition + panY}px`,
                width: "100%",
                height: "3px",
                backgroundColor: axis.color,
                zIndex: 2,
                opacity: 0.8,
              }}
            />
          ))}

        {/* ネットワークモード：滑らかな接続線 */}
        {isNetworkMode &&
          networkConnections.map((timeline, index) => (
            <SmoothLines
              key={timeline.id}
              timeline={timeline}
              panY={panY}
              displayState="default"
              onHover={() => {}}
              onClick={onTimelineClick}
              zIndex={10 + index}
            />
          ))}

        {/* イベント表示 */}
        {layoutEvents.map((event, index) => {
          const eventX = event.adjustedPosition.x;
          const eventY = event.adjustedPosition.y + panY;
          const isHighlighted = highlightedEvents?.some?.(e => e.id === event.id) || false;
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

              {/* 延長線（中段以外） */}
              {event.timelineInfo?.needsExtensionLine && (
                <div
                  style={{
                    position: "absolute",
                    left: `${eventX}px`,
                    top: `${Math.min(eventY, event.timelineInfo.axisY + panY)}px`,
                    width: "2px",
                    height: `${Math.abs(eventY - (event.timelineInfo.axisY + panY))}px`,
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
                  handleEventDoubleClick(event);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseEnter={(e) => {
                  e.target.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "scale(1)";
                }}
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
          getTopTagsFromSearch={getTopTagsFromSearch}
          timelines={timelines}
          tempTimelines={tempTimelines}
          isWikiMode={isWikiMode}
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