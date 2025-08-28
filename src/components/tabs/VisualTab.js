// src/components/tabs/VisualTab.js - TimelineTab と NetworkTab の統合版
import React, { useCallback, useState, useEffect, useMemo } from "react";
import { SearchPanel } from "../ui/SearchPanel";
import { TimelineCard } from "../ui/TimelineCard";
import { EventModal } from "../modals/EventModal";
import TimelineModal from "../modals/TimelineModal";
import { SmoothLines } from "../ui/SmoothLines";

import { TIMELINE_CONFIG } from "../../constants/timelineConfig";
import { truncateTitle } from "../../utils/timelineUtils";
  const [scale, setScale] = useState(TIMELINE_CONFIG.DEFAULT_SCALE);
  const [panX, setPanX] = useState(() => {
    const initialPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * TIMELINE_CONFIG.DEFAULT_SCALE;
    return window.innerWidth / 2 - (2080 - (-5000)) * initialPixelsPerYear;
  });
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  const pixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * scale;

  // 年から座標への変換
  const getXFromYear = useCallback((year) => {
    return (year - (-5000)) * pixelsPerYear + panX;
  }, [pixelsPerYear, panX]);

  // 座標から年への変換
  const getYearFromX = useCallback((x) => {
    return (-5000) + (x - panX) / pixelsPerYear;
  }, [pixelsPerYear, panX]);

  // ホイールイベント処理
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
  
  // 座標系
  timelineRef,
  coordinates,
  
  // イベント操作
  onEventUpdate,
  onEventDelete,
  onAddEvent,
  
  // タイムライン操作
  onTimelineUpdate,
  onCreateTimeline,
  onDeleteTimeline,
  
  // 表示制御
  highlightedEvents = new Set(),
  searchTerm = '',
  onSearchChange,
  getTopTagsFromSearch,
  
  // モーダル
  selectedEvent,
  selectedTimeline,
  onCloseEventModal,
  onCloseTimelineModal,
  
  // ホバー
  hoveredGroup,
  setHoveredGroup,
  
  // その他
  onResetView
}) => {
  const isNetworkMode = viewMode === 'network';

  // 座標情報の展開
  const {
    scale = 1, panX = 0, panY = 0, pixelsPerYear = 100, isDragging = false,
    getXFromYear = () => 0,
    handleWheel = () => {}, handleMouseDown = () => {}, 
    handleMouseMove = () => {}, handleMouseUp = () => {},
    resetToInitialPosition = () => {}
  } = coordinates || {};
  
  // テキスト幅計算
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
    timelines.forEach(timeline => {
      if (!timeline.isVisible) return;

      const connectionPoints = [];
      layoutEvents.forEach(eventPos => {
        const belongsToThisTimeline = timeline.events?.some(
          tlEvent => tlEvent.id === eventPos.id
        );
        if (belongsToThisTimeline) {
          connectionPoints.push({
            x: eventPos.adjustedPosition?.x || 0,
            y: (eventPos.adjustedPosition?.y || 0) + (TIMELINE_CONFIG.EVENT_HEIGHT / 2),
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

  // グローバルマウスイベント
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

  // イベントハンドラー
  const handleEventDoubleClick = useCallback((event) => {
    setHoveredGroup(null);
    // イベントモーダルを開く処理
    console.log('Event double clicked:', event.title);
  }, [setHoveredGroup]);

  const handleAddEvent = useCallback(() => {
    if (onAddEvent) onAddEvent();
  }, [onAddEvent]);

  const handleTimelineDoubleClick = useCallback((e) => {
    if (!e.target.closest("[data-event-id]")) {
      handleAddEvent();
    }
  }, [handleAddEvent]);

  // SmoothLines用のハンドラー（ネットワークモード用）
  const getTimelineDisplayState = useCallback((timelineId) => 'default', []);
  const handleTimelineHover = useCallback((timelineId, isHovering) => {}, []);
  const handleTimelineClick = useCallback((timelineId) => {}, []);

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
          const isHighlighted = highlightedEvents?.has ? highlightedEvents.has(event.id) : false;
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
            timeline={timelines?.find((t) => t.id === axis.id)}
            position={{ x: axis.cardX, y: axis.yPosition + panY - 30 }}
            onEdit={() => {
              const timeline = timelines?.find((t) => t.id === axis.id);
              if (timeline && onCloseTimelineModal) onCloseTimelineModal(timeline);
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

      {/* フローティングUI */}
      <div className="no-pan" style={{ position: "absolute", left: "20px", top: "20px", zIndex: 30 }}>
        <SearchPanel
          searchTerm={searchTerm}
          highlightedEvents={highlightedEvents}
          onSearchChange={onSearchChange}
          onCreateTimeline={onCreateTimeline}
          onDeleteTimeline={onDeleteTimeline}
          getTopTagsFromSearch={getTopTagsFromSearch}
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

      {/* ボタン群 */}
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

      {/* モーダル */}
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

      {/* デバッグ情報 */}
      <div style={{
        position: "absolute", bottom: "20px", left: "20px",
        padding: "8px", backgroundColor: "rgba(0,0,0,0.7)",
        color: "white", borderRadius: "4px", fontSize: "11px",
        fontFamily: "monospace", zIndex: 100, pointerEvents: "none"
      }}>
        {isNetworkMode ? 'Network' : 'Timeline'} Mode<br/>
        Events: {events?.length || 0} | Layout: {layoutEvents?.length || 0}<br/>
        {isNetworkMode ? `Connections: ${timelineConnections?.length || 0}` : `Axes: ${timelineAxes?.length || 0}`}<br/>
        Scale: {scale?.toFixed(2)} | Pan: ({Math.round(panX || 0)}, {Math.round(panY || 0)})<br/>
        Search: "{searchTerm || ""}" | Highlighted: {highlightedEvents?.size || 0}
      </div>
    </div>
  );
};

export default VisualTab;