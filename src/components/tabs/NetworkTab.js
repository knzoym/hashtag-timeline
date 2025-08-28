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
import { SmoothLines } from "../ui/SmoothLines";

// 統合座標管理フック
const useUnifiedCoordinates = (timelineRef) => {
  const [scale, setScale] = useState(TIMELINE_CONFIG.DEFAULT_SCALE);
  const [panX, setPanX] = useState(() => {
    const initialPixelsPerYear =
      TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * TIMELINE_CONFIG.DEFAULT_SCALE;
    // 2080年が初期の中心あたりに来るように調整
    return window.innerWidth / 2 - (2080 - -5000) * initialPixelsPerYear;
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
    [scale, panX, getYearFromX, timelineRef]
  );

  // ドラッグ開始
  const handleMouseDown = useCallback((e) => {
    // 'no-pan' クラスを持つ要素上ではドラッグを開始しない
    if (e.target.closest(".no-pan")) return;

    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  }, []);

  // ドラッグ中
  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - lastMouse.x;
      const deltaY = e.clientY - lastMouse.y;

      let newPanX = panX + deltaX;
      const newPanY = panY + deltaY;

      // X軸のパン範囲を制限
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

  // ドラッグ終了
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 初期位置にリセット
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

// 統合レイアウト管理フック
const useUnifiedLayout = (events, timelines, coordinates, calculateTextWidth) => {
  const { getXFromYear } = coordinates;

  // イベントのレイアウト（Y座標の衝突回避など）を計算
  const layoutEvents = useMemo(() => {
    if (!events || events.length === 0) return [];

    const layoutResults = [];
    const occupiedPositions = new Map(); // Y座標 -> 配置済みイベントの配列

    const sortedEvents = [...events].sort((a, b) => {
      const aYear = a.startDate ? a.startDate.getFullYear() : 0;
      const bYear = b.startDate ? b.startDate.getFullYear() : 0;
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

      // Y座標の衝突をチェックし、空いている場所に配置する
      while (level < 20) { // 最大20レベルまでチェック
        const currentY =
          TIMELINE_CONFIG.MAIN_TIMELINE_Y +
          level * (TIMELINE_CONFIG.EVENT_HEIGHT + 15);
        const occupiedAtThisY = occupiedPositions.get(currentY) || [];

        const hasCollision = occupiedAtThisY.some((occupiedEvent) => {
          const distance = Math.abs(eventX - occupiedEvent.x);
          const minDistance = (eventWidth + occupiedEvent.width) / 2 + 10; // 10pxのマージン
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

    return layoutResults;
  }, [events, getXFromYear, calculateTextWidth]);

  // 年表の軸情報を計算
  const timelineAxes = useMemo(() => {
    if (!timelines) return [];
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

  // 統合座標管理
  const coordinates = useUnifiedCoordinates(timelineRef);
  const {
    scale,
    panX,
    panY,
    pixelsPerYear,
    isDragging,
    getXFromYear,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetToInitialPosition,
  } = coordinates;

  // データ管理ロジック
  const timelineData = useTimelineLogic(
    timelineRef,
    { current: false }, // 以下の引数はuseTimelineLogicの実装に依存します
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
    modalPosition,
  } = timelineData;

  // 統合レイアウト管理
  const { layoutEvents, timelineAxes } = useUnifiedLayout(
    events,
    Timelines,
    coordinates,
    calculateTextWidth
  );

  // 年表の接続線データを生成
  const timelineConnections = useMemo(() => {
    if (!Timelines || !layoutEvents) return [];
    
    const connections = [];
    Timelines.forEach(timeline => {
      if (!timeline.isVisible) return;

      const connectionPoints = [];
      layoutEvents.forEach(eventPos => {
        const belongsToThisTimeline = eventPos.timelineInfos?.some(
          info => info.timelineId === timeline.id
        );
        if (belongsToThisTimeline) {
          connectionPoints.push({
            x: eventPos.adjustedPosition.x,
            y: eventPos.adjustedPosition.y + TIMELINE_CONFIG.EVENT_HEIGHT / 2,
            event: eventPos,
          });
        }
      });

      // イベントを時系列順にソート
      connectionPoints.sort((a, b) => a.event.startDate.getTime() - b.event.startDate.getTime());

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
  }, [Timelines, layoutEvents]);
  
  // マウスイベントをグローバルに登録
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDragging) handleMouseMove(e);
    };
    const handleGlobalMouseUp = () => {
      if (isDragging) handleMouseUp();
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 年マーカーを生成
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

    const viewportStartYear = -5000 + (-panX) / pixelsPerYear;
    const viewportEndYear = -5000 + (window.innerWidth - panX) / pixelsPerYear;
    const startYear = Math.floor(viewportStartYear / yearInterval) * yearInterval;
    const endYear = Math.ceil(viewportEndYear / yearInterval) * yearInterval;

    for (let year = Math.max(-5000, startYear); year <= Math.min(5000, endYear); year += yearInterval) {
      const x = getXFromYear(year);
      if (x > -200 && x < window.innerWidth + 200) {
        const fontSize = Math.max(10, Math.min(14, 12 + Math.log10(Math.max(0.01, scale)) * 2));
        markers.push(
          <div key={year} style={{ position: "absolute", left: `${x}px`, top: "0px", height: "100%", borderLeft: "1px solid #ddd", pointerEvents: "none", zIndex: 5, }}>
            <span style={{ position: "absolute", top: "10px", left: "5px", fontSize: `${fontSize}px`, color: "#666", userSelect: "none", backgroundColor: "rgba(255, 255, 255, 0.9)", padding: "2px 6px", borderRadius: "3px", }}>
              {year}
            </span>
            <span style={{ position: "absolute", bottom: "10px", left: "5px", fontSize: `${fontSize}px`, color: "#666", userSelect: "none", backgroundColor: "rgba(255, 255, 255, 0.9)", padding: "2px 6px", borderRadius: "3px", }}>
              {year}
            </span>
          </div>
        );
      }
    }
    return markers;
  }, [scale, pixelsPerYear, panX, getXFromYear]);

  // --- イベントハンドラ ---
  const handleEventDoubleClick = useCallback((event) => {
    if (openEventModal) openEventModal(event);
  }, [openEventModal]);

  const handleAddEvent = useCallback(() => {
    if (openNewEventModal) openNewEventModal();
  }, [openNewEventModal]);

  const handleCreateTimeline = useCallback(() => {
    if (createTimeline) createTimeline();
  }, [createTimeline]);
  
  const handleTimelineDoubleClick = useCallback((e) => {
      // イベントカード以外をダブルクリックした場合に新規イベント作成
      if (!e.target.closest("[data-event-id]")) {
        handleAddEvent();
      }
    }, [handleAddEvent]
  );
  
  // 【仮実装】SmoothLinesコンポーネント用のハンドラ
  const getTimelineDisplayState = useCallback((timelineId) => 'default', []);
  const handleTimelineHover = useCallback((timelineId, isHovering) => {}, []);
  const handleTimelineClick = useCallback((timelineId) => {}, []);

  // console.logを残してデバッグしやすくします
  console.log("TimelineTab render:", {
    events: events?.length || 0,
    timelines: Timelines?.length || 0,
    layoutEvents: layoutEvents?.length || 0,
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
        {generateYearMarkers()}

        {/* メインタイムライン線 */}
        <div style={{ position: "absolute", left: 0, right: 0, top: `${TIMELINE_CONFIG.MAIN_TIMELINE_Y + panY}px`, height: "3px", backgroundColor: "#374151", zIndex: 1, }} />

        {/* 滑らかな年表線 */}
        {timelineConnections.map((timeline, index) => (
          <SmoothLines
            key={timeline.id}
            timeline={timeline}
            panY={panY}
            displayState={getTimelineDisplayState(timeline.id)}
            onHover={handleTimelineHover}
            onClick={handleTimelineClick}
            zIndex={10 + index} 
          />
        ))}

        {/* イベント表示 */}
        {layoutEvents.map((event, index) => {
          const eventX = event.adjustedPosition.x;
          const eventY = event.adjustedPosition.y + panY;
          const isHighlighted = highlightedEvents?.has ? highlightedEvents.has(event.id) : false;
          const eventWidth = event.calculatedWidth;

          return (
            <React.Fragment key={`event-${event.id}-${index}`}>
              {/* 年号表示 */}
              <div style={{ position: "absolute", left: `${eventX}px`, top: `${eventY - 20}px`, transform: "translateX(-50%)", fontSize: "10px", color: event.timelineColor || "#999", fontWeight: "500", pointerEvents: "none", zIndex: 20 }}>
                {event.startDate?.getFullYear()}
              </div>

              {/* イベントカード */}
              <div
                data-event-id={event.id}
                className="no-pan" // パン操作を無効化
                style={{
                  position: "absolute",
                  left: `${eventX - eventWidth / 2}px`,
                  top: `${eventY - TIMELINE_CONFIG.EVENT_HEIGHT / 2}px`,
                  width: `${eventWidth}px`,
                  height: `${TIMELINE_CONFIG.EVENT_HEIGHT}px`,
                  backgroundColor: isHighlighted ? "#fef3c7" : "#ffffff",
                  border: `2px solid ${isHighlighted ? "#f59e0b" : event.timelineColor || "#e5e7eb"}`,
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: "500",
                  color: "#374151",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  zIndex: isHighlighted ? 25 : 15,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  padding: "0 8px",
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleEventDoubleClick(event);
                }}
                title={`${event.title}\n${event.startDate?.toLocaleDateString("ja-JP") || ""}\nダブルクリックで編集`}
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
            timeline={Timelines.find((t) => t.id === axis.id)}
            position={{ x: axis.cardX, y: axis.yPosition + panY - 30 }}
            onEdit={() => {
              const timeline = Timelines.find((t) => t.id === axis.id);
              if (timeline && openTimelineModal) openTimelineModal(timeline);
            }}
            onDelete={() => deleteTimeline(axis.id)}
            onToggleVisibility={(timelineId) => {
              setCreatedTimelines((prev) =>
                prev.map((t) =>
                  t.id === timelineId ? { ...t, isVisible: !t.isVisible } : t
                )
              );
            }}
            style={{
              position: "absolute",
              left: `${axis.cardX}px`,
              top: `${axis.yPosition + panY - 30}px`,
              zIndex: 30,
            }}
            className="no-pan"
          />
        ))}
        
        {/* 現在線 */}
        <div style={{ position: "absolute", left: `${getXFromYear(new Date().getFullYear())}px`, top: "0", height: "100%", borderLeft: "2px solid #f59e0b", pointerEvents: "none", opacity: 0.8, zIndex: 12, }}>
          <div style={{ position: "absolute", left: "5px", top: "30px", fontSize: "11px", color: "#f59e0b", backgroundColor: "rgba(255,255,255,0.9)", padding: "2px 6px", borderRadius: "3px", fontWeight: "600", }}>
            現在 ({new Date().getFullYear()})
          </div>
        </div>
      </div>

      {/* フローティングUI */}
      <div className="no-pan" style={{ position: "absolute", left: "20px", top: "20px", zIndex: 40 }}>
        <SearchPanel
          searchTerm={searchTerm}
          highlightedEvents={highlightedEvents}
          onSearchChange={handleSearchChange}
          onCreateTimeline={handleCreateTimeline}
          onDeleteTimeline={deleteTimeline}
          getTopTagsFromSearch={getTopTagsFromSearch}
        />
      </div>

      <div className="no-pan" style={{ position: "absolute", right: "20px", bottom: "20px", zIndex: 40, display: 'flex', gap: '10px' }}>
         <button onClick={resetToInitialPosition} style={{ backgroundColor: "#6b7280", color: "white", border: "none", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", cursor: "pointer", boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)", }} title="初期位置に戻す">
          初期位置
        </button>
        <button onClick={handleAddEvent} style={{ backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "50%", width: "56px", height: "56px", fontSize: "24px", cursor: "pointer", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", }} title="イベントを追加">
          +
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
          onUpdate={() => {}} // onUpdateの実装が必要
          onDelete={deleteTimeline}
          isWikiMode={isWikiMode}
        />
      )}

      {/* デバッグ情報 */}
      <div style={{ position: "absolute", bottom: "20px", left: "20px", padding: "8px", backgroundColor: "rgba(0,0,0,0.7)", color: "white", borderRadius: "4px", fontSize: "11px", fontFamily: "monospace", zIndex: 100, pointerEvents: "none" }}>
        Events: {events?.length || 0} | Layout: {layoutEvents?.length || 0}<br/>
        Scale: {scale?.toFixed(2)} | Pan: ({Math.round(panX || 0)}, {Math.round(panY || 0)})<br/>
        PixelsPerYear: {Math.round(pixelsPerYear || 0)} | Drag: {isDragging ? "Yes" : "No"}<br/>
        Search: "{searchTerm || ""}" | Highlighted: {highlightedEvents?.size || 0}
      </div>
    </div>
  );
};

export default NetworkTab;