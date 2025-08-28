// src/components/tabs/VisualTab.js - 既存コンポーネント連携保持版
import React, { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { SearchPanel } from "../ui/SearchPanel";
import { TimelineCard } from "../ui/TimelineCard";
import { EventModal } from "../modals/EventModal";
import TimelineModal from "../modals/TimelineModal";
import { SmoothLines } from "../ui/SmoothLines";

import { TIMELINE_CONFIG } from "../../constants/timelineConfig";
import { truncateTitle } from "../../utils/timelineUtils";

// 統合座標管理フック（元のTimelineTab/NetworkTabから）
const useUnifiedCoordinates = (timelineRef) => {
  const [scale, setScale] = useState(TIMELINE_CONFIG.DEFAULT_SCALE);
  const [panX, setPanX] = useState(() => {
    const initialPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * TIMELINE_CONFIG.DEFAULT_SCALE;
    return window.innerWidth / 2 - (2080 - (-5000)) * initialPixelsPerYear;
  });
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  const pixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * scale;

  const getXFromYear = useCallback((year) => {
    return (year - (-5000)) * pixelsPerYear + panX;
  }, [pixelsPerYear, panX]);

  const getYearFromX = useCallback((x) => {
    return (-5000) + (x - panX) / pixelsPerYear;
  }, [pixelsPerYear, panX]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const yearAtMouse = getYearFromX(mouseX);
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.05, Math.min(100, scale * zoomFactor));
    const newPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * newScale;
    
    let newPanX = mouseX - (yearAtMouse - (-5000)) * newPixelsPerYear;
    
    const timelineWidth = (5000 - (-5000)) * newPixelsPerYear;
    const viewportWidth = window.innerWidth;
    const minPanX = -(timelineWidth - viewportWidth);
    const maxPanX = 0;
    newPanX = Math.max(minPanX, Math.min(maxPanX, newPanX));
    
    setScale(newScale);
    setPanX(newPanX);
  }, [scale, panX, getYearFromX]);

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.no-pan')) return;
    
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastMouse.x;
    const deltaY = e.clientY - lastMouse.y;
    
    let newPanX = panX + deltaX;
    const newPanY = panY + deltaY;
    
    const timelineWidth = (5000 - (-5000)) * pixelsPerYear;
    const viewportWidth = window.innerWidth;
    const minPanX = -(timelineWidth - viewportWidth);
    const maxPanX = 0;
    newPanX = Math.max(minPanX, Math.min(maxPanX, newPanX));
    
    setPanX(newPanX);
    setPanY(newPanY);
    setLastMouse({ x: e.clientX, y: e.clientY });
  }, [isDragging, lastMouse, panX, panY, pixelsPerYear]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resetToInitialPosition = useCallback(() => {
    const initialPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * TIMELINE_CONFIG.DEFAULT_SCALE;
    const initialPanX = window.innerWidth / 2 - (2080 - (-5000)) * initialPixelsPerYear;
    
    setScale(TIMELINE_CONFIG.DEFAULT_SCALE);
    setPanX(initialPanX);
    setPanY(0);
  }, []);

  return {
    scale, panX, panY, pixelsPerYear, isDragging,
    getXFromYear, getYearFromX,
    handleWheel, handleMouseDown, handleMouseMove, handleMouseUp,
    resetToInitialPosition
  };
};

// 統合レイアウト管理フック（元のTimelineTab/NetworkTabから）
const useUnifiedLayout = (events, timelines, coordinates, calculateTextWidth) => {
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
      const eventX = event.startDate ? getXFromYear(event.startDate.getFullYear()) : 100;
      const textWidth = calculateTextWidth ? calculateTextWidth(event.title || '') : 60;
      const eventWidth = Math.max(60, textWidth + 20);
      
      let eventY = TIMELINE_CONFIG.MAIN_TIMELINE_Y;
      let level = 0;

      while (level < 20) {
        const currentY = TIMELINE_CONFIG.MAIN_TIMELINE_Y + level * (TIMELINE_CONFIG.EVENT_HEIGHT + 15);
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
            eventId: event.id
          });
          break;
        }
        level++;
      }

      layoutResults.push({
        ...event,
        adjustedPosition: { x: eventX, y: eventY },
        calculatedWidth: eventWidth,
        level
      });
    });

    return layoutResults;
  }, [events, getXFromYear, calculateTextWidth]);

  const timelineAxes = useMemo(() => {
    if (!timelines) return [];
    
    return timelines.filter(timeline => timeline.isVisible && timeline.events?.length > 0)
      .map((timeline, index) => {
        const baseY = TIMELINE_CONFIG.FIRST_ROW_Y + index * TIMELINE_CONFIG.ROW_HEIGHT;
        const axisY = baseY + TIMELINE_CONFIG.ROW_HEIGHT / 2;

        const years = timeline.events.map(e => e.startDate.getFullYear());
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
  viewMode = 'timeline',
  
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
  searchTerm = '',
  onSearchChange,
  getTopTagsFromSearch,
  
  // モーダル（App.jsで管理）
  selectedEvent,
  selectedTimeline,
  onCloseEventModal,
  onCloseTimelineModal,
  
  // ホバー
  hoveredGroup,
  setHoveredGroup
}) => {
  const timelineRef = useRef(null);
  const isNetworkMode = viewMode === 'network';

  // 統合座標管理（元のコードから復元）
  const coordinates = useUnifiedCoordinates(timelineRef);
  const {
    scale, panX, panY, pixelsPerYear, isDragging,
    getXFromYear, getYearFromX,
    handleWheel, handleMouseDown, handleMouseMove, handleMouseUp,
    resetToInitialPosition
  } = coordinates;

  // テキスト幅計算（元のコードから）
  const calculateTextWidth = useCallback((text, fontSize = 11) => {
    try {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      context.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      return context.measureText(text || '').width;
    } catch (error) {
      return (text?.length || 0) * 8;
    }
  }, []);

  // 統合レイアウト管理（元のコードから復元）
  const { layoutEvents, timelineAxes } = useUnifiedLayout(
    events, 
    timelines, 
    coordinates, 
    calculateTextWidth
  );

  // ネットワークモード用の接続線データ（元のNetworkTab.jsから）
  const timelineConnections = useMemo(() => {
    if (!isNetworkMode || !timelines || !layoutEvents) return [];
    
    const connections = [];
    timelines.forEach(timeline => {
      if (!timeline.isVisible) return;

      const connectionPoints = [];
      layoutEvents.forEach(eventPos => {
        const belongsToThisTimeline = timeline.events?.some(
          tlEvent => tlEvent.id === eventPos.id
        );
        if (belongsToThisTimeline) {
          connectionPoints.push({
            x: eventPos.adjustedPosition.x,
            y: eventPos.adjustedPosition.y + TIMELINE_CONFIG.EVENT_HEIGHT / 2,
            event: eventPos,
          });
        }
      });

      connectionPoints.sort((a, b) => 
        (a.event.startDate?.getTime() || 0) - (b.event.startDate?.getTime() || 0)
      );

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

  // グローバルマウスイベント（元のコードから）
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDragging) handleMouseMove(e);
    };
    const handleGlobalMouseUp = () => {
      if (isDragging) handleMouseUp();
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 年マーカー生成（元のコードから）
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
    
    const viewportStart = (-panX) / pixelsPerYear - 5000;
    const viewportEnd = (window.innerWidth - panX) / pixelsPerYear - 5000;
    const startYear = Math.floor(viewportStart / yearInterval) * yearInterval;
    const endYear = Math.ceil(viewportEnd / yearInterval) * yearInterval;
    
    for (let year = Math.max(-5000, startYear); year <= Math.min(5000, endYear); year += yearInterval) {
      const x = getXFromYear(year);
      if (x > -200 && x < window.innerWidth + 200) {
        const fontSize = Math.max(10, Math.min(14, 12 + Math.log10(Math.max(0.01, scale)) * 2));
        
        markers.push(
          <div key={year} style={{
            position: 'absolute', left: `${x}px`, top: '0px', height: '100%',
            borderLeft: '1px solid #ddd', pointerEvents: 'none', zIndex: 5
          }}>
            <span style={{
              position: 'absolute', top: '10px', left: '5px',
              fontSize: `${fontSize}px`, color: '#666', fontWeight: '500',
              userSelect: 'none', backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '2px 6px', borderRadius: '3px'
            }}>{year}</span>
            
            <span style={{
              position: 'absolute', bottom: '10px', left: '5px',
              fontSize: `${fontSize}px`, color: '#666', fontWeight: '500',
              userSelect: 'none', backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '2px 6px', borderRadius: '3px'
            }}>{year}</span>
          </div>
        );
      }
    }
    return markers;
  }, [scale, pixelsPerYear, panX, getXFromYear]);

  // イベントハンドラー（元のコードから復元）
  const handleEventDoubleClick = useCallback((event) => {
    console.log("Event double click:", event.title);
    if (onEventClick) {
      onEventClick(event);
    }
  }, [onEventClick]);

  const handleAddEvent = useCallback(() => {
    console.log("Add event button clicked");
    if (onAddEvent) {
      // 新規イベントを作成
      onAddEvent({
        title: '新規イベント',
        startDate: new Date(),
        description: '',
        tags: []
      });
    }
  }, [onAddEvent]);

  const handleCreateTimeline = useCallback(() => {
    console.log("Create timeline clicked, highlighted:", highlightedEvents?.size || 0);
    if (onCreateTimeline) onCreateTimeline();
  }, [onCreateTimeline, highlightedEvents]);

  const handleTimelineDoubleClick = useCallback((e) => {
    if (!e.target.closest("[data-event-id]")) {
      handleAddEvent();
    }
  }, [handleAddEvent]);

  // SmoothLines用のハンドラー（元のNetworkTab.jsから）
  const getTimelineDisplayState = useCallback(() => 'default', []);
  const handleTimelineHover = useCallback(() => {}, []);
  const handleTimelineClick = useCallback(() => {}, []);

  console.log(`${isNetworkMode ? 'Network' : 'Timeline'}Tab render:`, {
    events: events?.length || 0,
    timelines: timelines?.length || 0,
    layoutEvents: layoutEvents?.length || 0,
    connections: timelineConnections?.length || 0,
    scale: scale?.toFixed(2),
    viewMode
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
        <div style={{
          position: "absolute", left: 0, right: 0,
          top: `${TIMELINE_CONFIG.MAIN_TIMELINE_Y + panY}px`,
          height: "3px", backgroundColor: "#374151", zIndex: 1
        }} />

        {/* タイムラインモード：年表軸 */}
        {!isNetworkMode && timelineAxes.map((axis) => (
          <div key={`timeline-axis-${axis.id}`} style={{
            position: "absolute",
            left: `${axis.startX}px`,
            top: `${axis.yPosition + panY}px`,
            width: `${Math.max(100, axis.endX - axis.startX)}px`,
            height: "3px",
            backgroundColor: axis.color,
            zIndex: 2,
          }} />
        ))}

        {/* ネットワークモード：滑らかな接続線 */}
        {isNetworkMode && timelineConnections.map((timeline, index) => (
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
          const isHighlighted = highlightedEvents?.some(e => e.id === event.id) || false;
          const eventWidth = event.calculatedWidth;

          return (
            <React.Fragment key={`event-${event.id}-${index}`}>
              {/* 年号表示 */}
              <div style={{
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
              }}>
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
                  zIndex: isHighlighted ? 20 : 10,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  padding: "0 8px",
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  console.log('イベントダブルクリック検出:', event.title);
                  handleEventDoubleClick(event);
                }}
                onMouseDown={(e) => e.stopPropagation()}
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
            timeline={timelines?.find((t) => t.id === axis.id)}
            position={{ x: axis.cardX, y: axis.yPosition + panY - 30 }}
            onEdit={() => {
              const timeline = timelines?.find((t) => t.id === axis.id);
              console.log('TimelineCard onEdit呼び出し:', {
                axis: axis.id,
                timeline: timeline?.name,
                onTimelineClick: !!onTimelineClick
              });
              if (timeline && onTimelineClick) {
                onTimelineClick(timeline);
              } else {
                console.warn('Timeline編集失敗:', { timeline: !!timeline, onTimelineClick: !!onTimelineClick });
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
            style={{
              position: "absolute",
              left: `${axis.cardX}px`,
              top: `${axis.yPosition + panY - 30}px`,
              zIndex: 25,
            }}
            className="no-pan"
          />
        ))}

        {/* 現在線 */}
        <div style={{
          position: "absolute",
          left: `${getXFromYear(new Date().getFullYear())}px`,
          top: "0", height: "100%",
          borderLeft: "2px solid #f59e0b",
          pointerEvents: "none", opacity: 0.8, zIndex: 12
        }}>
          <div style={{
            position: "absolute", left: "5px", top: "30px",
            fontSize: "11px", color: "#f59e0b",
            backgroundColor: "rgba(255,255,255,0.9)",
            padding: "2px 6px", borderRadius: "3px", fontWeight: "600"
          }}>現在 ({new Date().getFullYear()})</div>
        </div>
      </div>

      {/* フローティングUI（元のコードから） */}
      <div className="no-pan" style={{ position: "absolute", left: "20px", top: "20px", zIndex: 30 }}>
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
      <div style={{
        position: "absolute", right: "20px", top: "20px", zIndex: 30,
        backgroundColor: "rgba(255,255,255,0.9)", padding: "8px 12px",
        borderRadius: "6px", fontSize: "12px", color: "#6b7280",
        border: "1px solid #e5e7eb"
      }}>
        {isNetworkMode ? "🕸️ ネットワークモード" : "📊 年表モード"}
      </div>

      {/* ボタン群（元のコードから） */}
      <div className="no-pan" style={{
        position: "absolute", right: "20px", bottom: "20px", zIndex: 30,
        display: 'flex', gap: '10px'
      }}>
        <button onClick={resetToInitialPosition} style={{
          backgroundColor: "#6b7280", color: "white", border: "none",
          borderRadius: "8px", padding: "8px 12px", fontSize: "12px",
          cursor: "pointer", boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)"
        }} title="初期位置に戻す">初期位置</button>
        
        <button onClick={handleAddEvent} style={{
          backgroundColor: "#3b82f6", color: "white", border: "none",
          borderRadius: "50%", width: "56px", height: "56px",
          fontSize: "24px", cursor: "pointer",
          boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }} title="イベントを追加">+</button>
      </div>

      {/* モーダル（App.jsで管理されているselectedEvent/selectedTimelineを表示） */}
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