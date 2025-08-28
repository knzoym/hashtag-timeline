// components/tabs/UnifiedTimelineView.js - 年表・ネットワーク統合版
import React, { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { useUnifiedCoordinates } from "../../hooks/useUnifiedCoordinates";
import { useTimelineLogic } from "../../hooks/useTimelineLogic";
import { useTimelineRowLayout, generateExtensionLines } from "../layout/TimelineRowSystem";
import { TIMELINE_CONFIG } from "../../constants/timelineConfig";
import { EventCard } from "../ui/EventCard";
import { GroupIcon, GroupCard } from "../ui/GroupCard";
import { SearchPanel } from "../ui/SearchPanel";
import { SmoothLines } from "../ui/SmoothLines";

// ネットワーク用のイベントレイアウト（年表行に分けない）
const useNetworkEventLayout = (events, coordinates, calculateTextWidth) => {
  return useMemo(() => {
    if (!events || !coordinates?.getXFromYear || !calculateTextWidth) return [];

    const layoutResults = [];
    const occupiedPositions = new Map();

    const sortedEvents = [...events].sort((a, b) => {
      const aYear = a.startDate ? a.startDate.getFullYear() : 0;
      const bYear = b.startDate ? b.startDate.getFullYear() : 0;
      return aYear - bYear;
    });

    sortedEvents.forEach((event) => {
      const eventX = event.startDate
        ? coordinates.getXFromYear(event.startDate.getFullYear())
        : 100;
      const textWidth = calculateTextWidth(event.title || "");
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
        timelineInfo: null, // ネットワークモードでは年表情報は後で付与
        isGrouped: false,
        groupData: null
      });
    });

    return layoutResults;
  }, [events, coordinates, calculateTextWidth]);
};

const UnifiedTimelineView = ({ isPersonalMode, isWikiMode, isNetworkMode = false }) => {
  const timelineRef = useRef(null);
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // 統合座標管理
  const coordinates = useUnifiedCoordinates(timelineRef);
  const {
    scale, panX, panY, pixelsPerYear, isDragging,
    getXFromYear, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp
  } = coordinates;

  // データ・UI管理
  const timelineData = useTimelineLogic(timelineRef, coordinates);
  const {
    events, timelines, searchTerm, highlightedEvents,
    createTimeline, deleteTimeline, openNewEventModal, openEventModal, openTimelineModal,
    handleSearchChange, calculateTextWidth, timelineAxes
  } = timelineData;

  // レイアウト計算（モードに応じて切り替え）
  const timelineLayoutData = useTimelineRowLayout(events, timelines, coordinates, calculateTextWidth);
  const networkLayoutEvents = useNetworkEventLayout(events, coordinates, calculateTextWidth);
  
  const { layoutEvents, timelineRows } = isNetworkMode 
    ? { layoutEvents: networkLayoutEvents, timelineRows: [] }
    : timelineLayoutData;

  // ネットワークモード用：年表情報を後から付与
  const enrichedLayoutEvents = useMemo(() => {
    if (!isNetworkMode) return layoutEvents;
    
    return layoutEvents.map(event => {
      // このイベントがどの年表に属しているかチェック
      const belongingTimelines = timelines.filter(timeline => 
        timeline.events?.some(tlEvent => tlEvent.id === event.id)
      );
      
      if (belongingTimelines.length > 0) {
        // 最初の年表の色を使用
        const primaryTimeline = belongingTimelines[0];
        return {
          ...event,
          timelineInfo: {
            timelineId: primaryTimeline.id,
            timelineName: primaryTimeline.name,
            timelineColor: primaryTimeline.color,
            needsExtensionLine: false,
            belongingTimelines // ネットワークモード用：複数年表情報
          }
        };
      }
      return event;
    });
  }, [isNetworkMode, layoutEvents, timelines]);

  // 年表の接続線データを生成（ネットワークモード用）
  const timelineConnections = useMemo(() => {
    if (!isNetworkMode || !timelines || !enrichedLayoutEvents) return [];
    
    const connections = [];
    timelines.forEach(timeline => {
      if (!timeline.isVisible) return;

      const connectionPoints = [];
      enrichedLayoutEvents.forEach(eventPos => {
        const belongsToThisTimeline = timeline.events?.some(
          timelineEvent => timelineEvent.id === eventPos.id
        );
        if (belongsToThisTimeline) {
          connectionPoints.push({
            x: eventPos.adjustedPosition.x,
            y: eventPos.adjustedPosition.y + TIMELINE_CONFIG.EVENT_HEIGHT / 2,
            event: eventPos,
          });
        }
      });

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
  }, [isNetworkMode, timelines, enrichedLayoutEvents]);

  // 延長線データ生成（年表モード用）
  const extensionLines = isNetworkMode ? [] : generateExtensionLines(enrichedLayoutEvents);

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
            borderLeft: '1px solid #ddd', pointerEvents: 'none', zIndex: 10
          }}>
            <span style={{
              position: 'absolute', top: '10px', left: '5px', fontSize: `${fontSize}px`,
              color: '#666', userSelect: 'none', backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '2px 6px', borderRadius: '3px'
            }}>
              {year}
            </span>
          </div>
        );
      }
    }
    return markers;
  }, [scale, pixelsPerYear, panX, getXFromYear]);

  // イベントハンドラ
  const handleEventDoubleClick = useCallback((event) => {
    openEventModal(event);
  }, [openEventModal]);

  const handleGroupDoubleClick = useCallback((groupData) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupData.id)) {
        newSet.delete(groupData.id);
      } else {
        newSet.clear();
        newSet.add(groupData.id);
      }
      return newSet;
    });
  }, []);

  const handleAddEvent = useCallback(() => {
    openNewEventModal();
  }, [openNewEventModal]);

  const handleCreateTimeline = useCallback(() => {
    createTimeline();
  }, [createTimeline]);
  
  const handleTimelineDoubleClick = useCallback((e) => {
    if (!e.target.closest("[data-event-id]") && !e.target.closest("[data-group-id]")) {
      handleAddEvent();
    }
  }, [handleAddEvent]);

  console.log(`${isNetworkMode ? 'Network' : 'Timeline'}Tab render:`, {
    events: events?.length || 0,
    timelines: timelines?.length || 0,
    layoutEvents: enrichedLayoutEvents?.length || 0,
    timelineAxes: timelineAxes?.length || 0,
    connections: timelineConnections?.length || 0,
    extensionLines: extensionLines?.length || 0,
    scale: scale?.toFixed(2),
  });

  return (
    <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
      {/* 検索パネル */}
      <SearchPanel
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        highlightedEvents={highlightedEvents}
        onCreateTimeline={handleCreateTimeline}
        timelines={timelines}
        onDeleteTimeline={deleteTimeline}
        isPersonalMode={isPersonalMode}
        isWikiMode={isWikiMode}
      />

      {/* メイン表示エリア */}
      <div
        ref={timelineRef}
        style={{
          width: "100%", height: "100%", position: "relative", overflow: "hidden",
          cursor: isDragging ? "grabbing" : "grab", userSelect: "none",
          marginLeft: "280px",
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleTimelineDoubleClick}
      >
        {/* 年マーカー */}
        {generateYearMarkers()}

        {/* メインタイムライン */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transform: `translate(0px, ${TIMELINE_CONFIG.MAIN_TIMELINE_Y + panY}px)`,
            width: "100%",
            height: "2px",
            backgroundColor: "#374151",
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            zIndex: 1,
          }}
        />

        {/* ネットワークモード：滑らかな接続線 */}
        {isNetworkMode && timelineConnections.map((connection) => (
          <SmoothLines
            key={connection.id}
            timeline={connection}
            panY={panY}
            displayState="default"
            onHover={() => {}}
            onClick={() => {}}
          />
        ))}

        {/* 年表モード：年表軸とライン */}
        {!isNetworkMode && timelineAxes.map((axis) => (
          <div key={`axis-${axis.id}`}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                transform: `translate(${axis.startX}px, ${axis.yPosition + panY}px)`,
                width: `${axis.endX - axis.startX}px`,
                height: "3px",
                backgroundColor: axis.color,
                borderRadius: "1px",
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                zIndex: 2,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                transform: `translate(${axis.cardX}px, ${axis.yPosition + panY - 18}px)`,
                padding: "4px 12px",
                backgroundColor: axis.color,
                color: "white",
                fontSize: "12px",
                fontWeight: "600",
                borderRadius: "6px",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                whiteSpace: "nowrap",
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                zIndex: 3,
              }}
              onClick={() => openTimelineModal(timelines.find(t => t.id === axis.id))}
            >
              {axis.name} ({axis.eventCount})
            </div>
          </div>
        ))}

        {/* 年表モード：延長線 */}
        {!isNetworkMode && extensionLines.map((line) => (
          <div
            key={`extension-${line.id}`}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transform: `translate(${line.fromX}px, ${Math.min(line.fromY, line.toY) + panY}px)`,
              width: '2px',
              height: `${Math.abs(line.toY - line.fromY)}px`,
              backgroundColor: line.color,
              opacity: line.opacity || 0.6,
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              zIndex: 1,
              pointerEvents: 'none'
            }}
          />
        ))}

        {/* イベントカードとグループ */}
        {enrichedLayoutEvents.map((event) => {
          const isHighlighted = highlightedEvents.has(event.id);
          const finalX = event.adjustedPosition.x;
          const finalY = event.adjustedPosition.y;
          
          // 座標変化の閾値でkey更新
          const gridKeyX = Math.floor(finalX / 150);
          const gridKeyY = Math.floor(finalY / 80);
          
          if (event.isGrouped) {
            const isExpanded = expandedGroups.has(event.groupData.id);
            
            if (isExpanded) {
              const isFirstEventInGroup = event.groupData.events[0].id === event.id;
              if (!isFirstEventInGroup) return null;
              
              return (
                <div
                  key={`group-card-${event.groupData.id}-${gridKeyX}-${gridKeyY}`}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    transform: `translate(${finalX - 100}px, ${finalY + panY - 60}px)`,
                    willChange: 'transform',
                    backfaceVisibility: 'hidden',
                    zIndex: 100,
                  }}
                >
                  <GroupCard
                    groupData={event.groupData}
                    onEventDoubleClick={handleEventDoubleClick}
                    onClose={() => setExpandedGroups(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(event.groupData.id);
                      return newSet;
                    })}
                    panY={0}
                    calculateTextWidth={calculateTextWidth}
                  />
                </div>
              );
            } else {
              const isFirstEventInGroup = event.groupData.events[0].id === event.id;
              if (!isFirstEventInGroup) return null;
              
              return (
                <div
                  key={`group-icon-${event.groupData.id}-${gridKeyX}-${gridKeyY}`}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    transform: `translate(${finalX}px, ${finalY + panY}px) translate(-50%, -50%)`,
                    willChange: 'transform',
                    backfaceVisibility: 'hidden',
                    zIndex: 30,
                  }}
                >
                  <GroupIcon
                    groupData={event.groupData}
                    onDoubleClick={() => handleGroupDoubleClick(event.groupData)}
                    isHighlighted={event.groupData.events.some(e => highlightedEvents.has(e.id))}
                  />
                </div>
              );
            }
          } else {
            // 通常のイベントカード
            return (
              <div
                key={`event-${event.id}-${gridKeyX}-${gridKeyY}`}
                data-event-id={event.id}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  transform: `translate(${finalX}px, ${finalY + panY}px) translate(-50%, -50%)`,
                  willChange: 'transform',
                  backfaceVisibility: 'hidden',
                  zIndex: isHighlighted ? 50 : 20,
                }}
              >
                <EventCard
                  event={event}
                  isHighlighted={isHighlighted}
                  onDoubleClick={() => handleEventDoubleClick(event)}
                />
              </div>
            );
          }
        }).filter(Boolean)}
      </div>
    </div>
  );
};

export default UnifiedTimelineView;