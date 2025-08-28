// components/tabs/VisualTab.js - 既存実装を尊重した修正版
import React, {
  useRef,
  useCallback,
  useState,
  useEffect,
  useMemo,
} from "react";
import SearchPanel from "../ui/SearchPanel"; // ← named import を default import に変更
import { TimelineCard } from "../ui/TimelineCard";
import { EventModal } from "../modals/EventModal";
import TimelineModal from "../modals/TimelineModal";
import { SmoothLines } from "../ui/SmoothLines";

import { TIMELINE_CONFIG } from "../../constants/timelineConfig";
import { truncateTitle } from "../../utils/timelineUtils";

// src/components/tabs/VisualTab.js - Wiki承認システム統合版
import React, { useState, useEffect, useMemo, useCallback } from "react";
import PendingEventsToggle from "../wiki/PendingEventsToggle";
import {
  prepareEventsForWikiDisplay,
  getUserApprovalPermission,
  getPendingEventStats,
} from "../../utils/wikiEventUtils";

// VisualTabにWiki承認機能を統合
const WikiVisualTabEnhancement = ({
  // 既存のVisualTab props
  events,
  timelines,
  user,
  isWikiMode = false,
  showPendingEvents = false,
  onTogglePendingEvents,
  wikiData,

  // 新規追加：承認システム用
  onApprovalAction,
}) => {
  const [pendingEventsCount, setPendingEventsCount] = useState(0);
  const [userPermissions, setUserPermissions] = useState({
    canViewPending: false,
  });

  // ユーザー権限とペンディング件数を取得
  useEffect(() => {
    if (isWikiMode && user) {
      const permissions = getUserApprovalPermission(user);
      setUserPermissions(permissions);

      // 承認待ちイベント数を取得
      if (wikiData && permissions.canViewPending) {
        loadPendingCount();
      }
    }
  }, [isWikiMode, user, wikiData]);

  const loadPendingCount = async () => {
    try {
      const pendingRevisions = await wikiData.getPendingRevisions(
        "pending",
        1000
      );
      setPendingEventsCount(pendingRevisions.length);
    } catch (error) {
      console.error("承認待ち件数取得エラー:", error);
      setPendingEventsCount(0);
    }
  };

  // Wiki表示用にイベントを処理
  const processedEvents = useMemo(() => {
    if (!isWikiMode) {
      return events; // 個人モードではそのまま表示
    }

    // Wiki用の表示処理
    return prepareEventsForWikiDisplay(events, {
      showPendingEvents,
      userPermissions,
      sortBy: "date",
      sortDirection: "asc",
    });
  }, [events, isWikiMode, showPendingEvents, userPermissions]);

  // Wiki統計情報
  const wikiStats = useMemo(() => {
    if (!isWikiMode) return null;
    return getPendingEventStats(events);
  }, [events, isWikiMode]);

  // VisualTabに統合するためのWikiコントロール部分
  const renderWikiControls = () => {
    if (!isWikiMode) return null;

    return (
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 20,
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          padding: "12px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          minWidth: "250px",
        }}
      >
        {/* Wiki統計 */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            fontSize: "12px",
            color: "#6b7280",
          }}
        >
          <span>
            📊 総数: <strong>{events.length}</strong>
          </span>
          <span>
            ✅ 安定版: <strong>{wikiStats?.stable || 0}</strong>
          </span>
          <span>
            ⏳ 承認待ち: <strong>{wikiStats?.pending || 0}</strong>
          </span>
        </div>

        {/* 承認待ちイベント表示切り替え */}
        {userPermissions.canViewPending && (
          <PendingEventsToggle
            showPending={showPendingEvents}
            onToggle={onTogglePendingEvents}
            pendingCount={pendingEventsCount}
          />
        )}
      </div>
    );
  };

  return {
    processedEvents,
    wikiStats,
    renderWikiControls,
    userPermissions,
  };
};

// 統合座標管理フック（既存実装を保持）
const useUnifiedCoordinates = (timelineRef) => {
  const [scale, setScale] = useState(TIMELINE_CONFIG.DEFAULT_SCALE);
  const [panX, setPanX] = useState(() => {
    const initialPixelsPerYear =
      TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * TIMELINE_CONFIG.DEFAULT_SCALE;
    return window.innerWidth / 2 - (2080 - -5000) * initialPixelsPerYear;
  });
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  const pixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * scale;

  const getXFromYear = useCallback(
    (year) => {
      return (year - -5000) * pixelsPerYear + panX;
    },
    [pixelsPerYear, panX]
  );

  const getYearFromX = useCallback(
    (x) => {
      return -5000 + (x - panX) / pixelsPerYear;
    },
    [pixelsPerYear, panX]
  );

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
    [scale, getYearFromX, timelineRef]
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
      window.innerWidth / 2 - (2080 - -5000) * initialPixelsPerYear;

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

// マウスイベントリスナーの設定（既存実装を保持）
const useMouseEventListeners = (handleMouseMove, handleMouseUp) => {
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      handleMouseMove(e);
    };

    const handleGlobalMouseUp = (e) => {
      handleMouseUp(e);
    };

    document.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);
};

// 統合レイアウト管理フック（既存実装を保持）
const useUnifiedLayout = (
  events,
  timelines,
  coordinates,
  calculateTextWidth
) => {
  const { getXFromYear } = coordinates;

  const layoutEvents = useMemo(() => {
    if (!events || events.length === 0) return [];

    const layoutResults = [];
    const occupiedPositions = new Map();

    const sortedEvents = [...events].sort((a, b) => {
      const aYear = a.startDate ? a.startDate.getFullYear() : 2000;
      const bYear = b.startDate ? b.startDate.getFullYear() : 2000;
      return aYear - bYear;
    });

    sortedEvents.forEach((event) => {
      const eventX = event.startDate
        ? getXFromYear(event.startDate.getFullYear())
        : 100;
      const textWidth = calculateTextWidth
        ? calculateTextWidth(event.title || "")
        : 60;
      const eventWidth = Math.max(60, textWidth + 20);

      let eventY = TIMELINE_CONFIG.MAIN_TIMELINE_Y;
      let level = 0;

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
        level,
      });
    });

    return layoutResults;
  }, [events, getXFromYear, calculateTextWidth]);

  const timelineAxes = useMemo(() => {
    if (!timelines) return [];

    console.log("timelineAxes計算開始:", {
      timelinesCount: timelines.length,
      visibleTimelines: timelines.filter((t) => t.isVisible).length,
    });

    const axes = timelines
      .filter((timeline) => timeline.isVisible)
      .map((timeline, index) => {
        console.log(`年表「${timeline.name}」処理開始`);

        // timelineInfosから年表に属するイベントを抽出
        const timelineEvents = events.filter((event) => {
          if (!event.timelineInfos || !Array.isArray(event.timelineInfos)) {
            return false;
          }

          // この年表に属し、仮削除されていないイベントを対象
          return event.timelineInfos.some(
            (info) => info.timelineId === timeline.id && !info.isTemporary
          );
        });

        console.log(
          `年表「${timeline.name}」のイベント数:`,
          timelineEvents.length
        );

        if (timelineEvents.length === 0) {
          console.log(`年表「${timeline.name}」: イベントがないためスキップ`);
          return null;
        }

        const baseY =
          TIMELINE_CONFIG.FIRST_ROW_Y + index * TIMELINE_CONFIG.ROW_HEIGHT;
        const axisY = baseY + TIMELINE_CONFIG.ROW_HEIGHT / 2;

        const years = timelineEvents
          .filter((e) => e.startDate)
          .map((e) => e.startDate.getFullYear());
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);

        const startX = getXFromYear(minYear);
        const endX = getXFromYear(maxYear);

        const axisData = {
          id: timeline.id,
          name: timeline.name,
          color: timeline.color,
          yPosition: axisY,
          startX,
          endX,
          minYear,
          maxYear,
          cardX: Math.max(20, startX - 120),
          eventCount: timelineEvents.length,
        };

        console.log(`年表「${timeline.name}」軸データ:`, axisData);
        return axisData;
      })
      .filter(Boolean);

    console.log("timelineAxes計算完了:", axes.length, "本の軸を作成");
    return axes;
  }, [timelines, events, getXFromYear]);

  return { layoutEvents, timelineAxes };
};

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
  onAddEvent, // App.jsからの関数
  onTimelineUpdate,
  onCreateTimeline, // App.jsからの関数
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

  // マウスイベントリスナー設定
  useMouseEventListeners(handleMouseMove, handleMouseUp);

  // テキスト幅計算
  const calculateTextWidth = useCallback((text, fontSize = 11) => {
    try {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      context.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      return context.measureText(text || "").width;
    } catch (error) {
      return (text?.length || 0) * 8;
    }
  }, []);

  // 統合レイアウト管理
  const { layoutEvents, timelineAxes } = useUnifiedLayout(
    events,
    timelines,
    coordinates,
    calculateTextWidth
  );

  // ネットワークモード用の接続線データ
  const timelineConnections = useMemo(() => {
    if (!isNetworkMode || !timelines || !layoutEvents) return [];

    const connections = [];
    timelines.forEach((timeline) => {
      if (!timeline.isVisible) return;

      const connectionPoints = [];
      layoutEvents.forEach((eventPos) => {
        // timelineInfosから年表所属を判定
        const belongsToThisTimeline = eventPos.timelineInfos?.some(
          (info) => info.timelineId === timeline.id && !info.isTemporary
        );

        if (belongsToThisTimeline) {
          connectionPoints.push({
            x: eventPos.adjustedPosition.x,
            y: eventPos.adjustedPosition.y + TIMELINE_CONFIG.EVENT_HEIGHT / 2,
          });
        }
      });

      if (connectionPoints.length > 1) {
        connections.push({
          id: timeline.id,
          name: timeline.name,
          color: timeline.color,
          points: connectionPoints,
        });
      }
    });

    return connections;
  }, [isNetworkMode, timelines, layoutEvents]);

  // 年マーカー生成
  const generateYearMarkers = useMemo(() => {
    const markers = [];
    const startYear = Math.floor(getYearFromX(0) / 100) * 100;
    const endYear = Math.ceil(getYearFromX(window.innerWidth) / 100) * 100;

    for (let year = startYear; year <= endYear; year += 100) {
      const x = getXFromYear(year);
      if (x >= -50 && x <= window.innerWidth + 50) {
        const fontSize = Math.max(
          8,
          Math.min(12, 10 * Math.max(0.01, scale) * 2)
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
              zIndex: 5,
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
              }}
            >
              {year}
            </span>
          </div>
        );
      }
    }
    return markers;
  }, [scale, getXFromYear, getYearFromX]);

  // イベントハンドラー - App.jsの関数を呼び出し
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
  }, [onAddEvent]);

  const handleCreateTimeline = useCallback(() => {
    console.log(
      "VisualTab: Create timeline clicked - onCreateTimeline:",
      !!onCreateTimeline,
      "highlighted:",
      highlightedEvents?.length || 0
    );
    if (onCreateTimeline) {
      const result = onCreateTimeline();
      console.log("VisualTab: 年表作成結果:", result);
    } else {
      console.error("VisualTab: onCreateTimeline関数が提供されていません");
    }
  }, [onCreateTimeline, highlightedEvents]);

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
    connections: timelineConnections?.length || 0,
    scale: scale?.toFixed(2),
    viewMode,
    onAddEvent: !!onAddEvent,
    onCreateTimeline: !!onCreateTimeline,
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
                left: `${axis.startX}px`,
                top: `${axis.yPosition + panY}px`,
                width: `${Math.max(100, axis.endX - axis.startX)}px`,
                height: "3px",
                backgroundColor: axis.color,
                zIndex: 2,
              }}
            />
          ))}

        {/* ネットワークモード：滑らかな接続線 */}
        {isNetworkMode &&
          timelineConnections.map((timeline, index) => (
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
            highlightedEvents?.some((e) => e.id === event.id) || false;
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
        {timelineAxes.map((axis) => (
          <TimelineCard
            key={`timeline-card-${axis.id}`}
            timeline={timelines?.find((t) => t.id === axis.id)}
            position={{ x: axis.cardX, y: axis.yPosition + panY - 30 }}
            onEdit={() => {
              const timeline = timelines?.find((t) => t.id === axis.id);
              console.log(
                "VisualTab: TimelineCard onEdit呼び出し:",
                timeline?.name
              );
              if (timeline && onTimelineClick) {
                onTimelineClick(timeline);
              }
            }}
            onDelete={() => onDeleteTimeline && onDeleteTimeline(axis.id)}
            onToggleVisibility={(timelineId) => {
              if (onTimelineUpdate) {
                const updatedTimelines = timelines.map((t) =>
                  t.id === timelineId ? { ...t, isVisible: !t.isVisible } : t
                );
                onTimelineUpdate(updatedTimelines);
              }
            }}
            className="no-pan"
          />
        ))}

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
      <div
        className="no-pan"
        style={{ position: "absolute", left: "20px", top: "20px", zIndex: 30 }}
      >
        <SearchPanel
          searchTerm={searchTerm}
          highlightedEvents={highlightedEvents}
          onSearchChange={onSearchChange}
          onCreateTimeline={handleCreateTimeline}
          onDeleteTimeline={onDeleteTimeline}
          getTopTagsFromSearch={getTopTagsFromSearch}
          timelines={timelines}
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
