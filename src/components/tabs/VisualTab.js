// src/components/tabs/VisualTab.js - グループ化修正完全版
import React, { useRef, useCallback, useState, useMemo } from "react";
import SearchPanel from "../ui/SearchPanel";
import { TimelineCard } from "../ui/TimelineCard";
import { EventCard } from "../ui/EventCard";
import { EventModal } from "../modals/EventModal";
import TimelineModal from "../modals/TimelineModal";
import { SmoothLines } from "../ui/SmoothLines";
import { EventGroupIcon, GroupTooltip, GroupCard } from "../ui/EventGroup";
import { TIMELINE_CONFIG } from "../../constants/timelineConfig";
import { truncateTitle } from "../../utils/timelineUtils";
import { useCoordinate } from "../../hooks/useCoordinate";
import { UnifiedLayoutSystem } from "../../utils/groupLayoutSystem";

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

  // グループ状態管理
  const [expandedGroups, setExpandedGroups] = useState(new Set());

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

  // テキスト幅計算
  const calculateTextWidth = useCallback((text) => {
    if (!text) return 60;
    return Math.min(Math.max(60, text.length * 8), 200);
  }, []);

  // 色を暗くするヘルパー関数（落ち着いたトーン用）
  const getDarkerColor = useCallback((hslColor, darkenAmount = 30) => {
    if (!hslColor || !hslColor.startsWith('hsl')) return hslColor;
    
    const match = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (match) {
      const h = match[1];
      const s = Math.max(20, Math.min(50, parseInt(match[2]) - 15));
      const l = Math.max(20, parseInt(match[3]) - darkenAmount);
      return `hsl(${h}, ${s}%, ${l}%)`;
    }
    return hslColor;
  }, []);

  // 統合レイアウトマネージャーのインスタンス化
  const layoutManager = useMemo(() => {
    if (!coordinates || !calculateTextWidth) return null;
    return new UnifiedLayoutSystem(coordinates, calculateTextWidth);
  }, [coordinates, calculateTextWidth]);

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

  // 年マーカー生成
  const yearMarkers = useMemo(() => {
    if (!getXFromYear) return [];
    
    const markers = [];
    const viewportWidth = window.innerWidth;
    
    // スケールに応じた年間隔
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

  // 年表軸計算
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
      const yPosition = TIMELINE_CONFIG.FIRST_ROW_Y() + index * TIMELINE_CONFIG.ROW_HEIGHT;
      
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

  // 統合レイアウトシステムによるイベント配置計算
  const layoutEventsWithGroups = useMemo(() => {
    if (!events || !layoutManager || !timelineAxes) {
      return { allEvents: [], eventGroups: [] };
    }
    
    try {
      const layoutResult = layoutManager.executeLayout(events, timelineAxes);
      
      console.log(`統合レイアウト結果: ${layoutResult.allEvents.length}イベント, ${layoutResult.eventGroups.length}グループ`);
      layoutResult.eventGroups.forEach(group => {
        console.log(`グループ ${group.id}: 位置(${group.position.x.toFixed(0)}, ${group.position.y}) ${group.events.length}イベント`);
      });
      
      return layoutResult;
    } catch (error) {
      console.error('レイアウト計算エラー:', error);
      return { allEvents: [], eventGroups: [] };
    }
  }, [events, timelineAxes, layoutManager]);

  // ネットワーク接続線データ生成
  const networkConnections = useMemo(() => {
    if (!isNetworkMode) return [];
    
    const connections = [];
    
    timelineAxes.forEach(axis => {
      const connectionPoints = layoutEventsWithGroups.allEvents
        .filter(event => event.timelineInfo?.timelineId === axis.id && !event.hiddenByGroup)
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
  }, [isNetworkMode, timelineAxes, layoutEventsWithGroups.allEvents]);

  // グループ管理
  const toggleEventGroup = useCallback((groupId) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

  // イベントハンドラー
  const handleEventDoubleClick = useCallback((event) => {
    console.log("VisualTab: Event double click:", event.title);
    
    // イベントの正規化
    const normalizedEvent = {
      ...event,
      id: event.id || `temp-${Date.now()}`,
      title: event.title || '新規イベント',
      description: event.description || '',
      startDate: event.startDate || new Date(),
      endDate: event.endDate || null,
      tags: event.tags || [],
      timelineInfos: event.timelineInfos || []
    };
    
    if (onEventClick) {
      onEventClick(normalizedEvent);
    }
  }, [onEventClick]);

  const handleAddEventAtPosition = useCallback((clientX, clientY) => {
    if (isWikiMode) {
      alert("Wikiモードでのイベント追加は承認が必要です。イベント編集タブから申請してください。");
      return;
    }

    if (onAddEvent && getYearFromX && timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const relativeY = clientY - rect.top;
      
      // クリック座標から年を計算
      const clickedYear = Math.round(getYearFromX(relativeX));
      
      // 新しいイベントの日付を設定
      const eventDate = new Date();
      eventDate.setFullYear(clickedYear);
      
      onAddEvent({
        title: "新規イベント",
        startDate: eventDate,
        description: "",
        tags: [],
        position: { x: relativeX, y: relativeY }
      });
      
      console.log(`座標 (${relativeX}, ${relativeY}) に ${clickedYear} 年のイベントを追加`);
    }
  }, [onAddEvent, getYearFromX, isWikiMode]);

  const handleTimelineDoubleClick = useCallback((e) => {
    // イベントやグループ以外の場所でのダブルクリック
    if (!e.target.closest("[data-event-id]") && !e.target.closest("[data-group-id]")) {
      handleAddEventAtPosition(e.clientX, e.clientY);
    }
  }, [handleAddEventAtPosition]);

  const handleCreateTimeline = useCallback((timelineName) => {
    // 引数で年表名を受け取る、またはsearchTermから自動設定
    const finalTimelineName = timelineName || searchTerm.trim() || "新しい年表";
    
    if (isWikiMode) {
      if (onCreateTempTimeline) {
        onCreateTempTimeline(finalTimelineName);
      }
    } else {
      if (onCreateTimeline) {
        onCreateTimeline(finalTimelineName);
      }
    }
  }, [onCreateTimeline, onCreateTempTimeline, isWikiMode, searchTerm]);

  console.log(`VisualTab ${isNetworkMode ? "Network" : "Timeline"} render:`, {
    events: events?.length || 0,
    timelines: displayTimelines?.length || 0,
    layoutEvents: layoutEventsWithGroups.allEvents?.length || 0,
    eventGroups: layoutEventsWithGroups.eventGroups?.length || 0,
    expandedGroups: expandedGroups.size,
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
            top: `${window.innerHeight * 0.3 + panY}px`,
            height: "3px",
            backgroundColor: "#374151",
            zIndex: 1,
          }}
        />

        {/* タイムラインモード：年表軸 */}
        {!isNetworkMode &&
          timelineAxes.map((axis, index) => {
            const baselineY = window.innerHeight * 0.3;
            const axisY = baselineY + 100 + (index * 120);
            
            return (
              <div
                key={`timeline-axis-${axis.id}`}
                style={{
                  position: "absolute",
                  left: "0px",
                  right: "0px",
                  top: `${axisY + panY}px`,
                  width: "100%",
                  height: "3px",
                  backgroundColor: axis.color,
                  zIndex: 2,
                  opacity: 0.8,
                }}
              />
            );
          })}

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

        {/* 通常イベント表示（修正版：hiddenByGroupフィルタリング） */}
        {layoutEventsWithGroups.allEvents
          .filter(event => !event.hiddenByGroup) // グループ化されたイベントを除外
          .map((event, index) => {
          const eventX = event.adjustedPosition.x;
          const eventY = event.adjustedPosition.y + panY;
          const isHighlighted = highlightedEvents?.some?.(e => e.id === event.id) || false;

          return (
            <React.Fragment key={`event-${event.id}-${index}`}>
              <EventCard
                event={event}
                style={{
                  position: "absolute",
                  left: `${eventX}px`,
                  top: `${eventY}px`,
                  transform: "translateX(-50%)",
                }}
                isHighlighted={isHighlighted}
                onDoubleClick={() => handleEventDoubleClick(event)}
                onMouseDown={(e) => e.stopPropagation()}
                calculateTextWidth={calculateTextWidth} // 統一サイズ計算を渡す
                className="no-pan"
              />

              {/* 延長線の描画（年表イベントで必要な場合） */}
              {event.timelineInfo?.needsExtensionLine && (
                <div
                  style={{
                    position: "absolute",
                    left: `${eventX}px`,
                    top: `${Math.min(eventY, event.timelineInfo.axisY + panY)}px`,
                    width: "2px",
                    height: `${Math.abs(eventY - (event.timelineInfo.axisY + panY))}px`,
                    backgroundColor: event.timelineColor || "#6b7280",
                    opacity: 0.6,
                    zIndex: 1,
                    pointerEvents: "none",
                  }}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* イベントグループアイコン（修正版：年表色を正しく渡す） */}
        {layoutEventsWithGroups.eventGroups?.map((groupData, index) => {
          console.log(`グループ ${index}:`, {
            id: groupData.id,
            position: groupData.position,
            events: groupData.events?.length || 0,
            timelineColor: groupData.timelineColor
          });
          
          if (!groupData.position) {
            console.error(`グループ ${groupData.id} の position が未定義`);
            return null;
          }
          
          return (
            <EventGroupIcon
              key={`group-icon-${groupData.id}`}
              groupData={groupData}
              position={groupData.position}
              panY={panY}
              panX={0}
              timelineColor={groupData.timelineColor || '#6b7280'} // 年表色を正しく渡す
              onHover={setHoveredGroup}
              onClick={toggleEventGroup}
              onDoubleClick={(e, group) => {
                e.stopPropagation();
                if (group.events.length === 1) {
                  handleEventDoubleClick(group.events[0]);
                } else {
                  toggleEventGroup(group.id);
                }
              }}
              isHighlighted={hoveredGroup === groupData.id}
            />
          );
        })}

        {/* グループツールチップ（修正版） */}
        {hoveredGroup && layoutEventsWithGroups.eventGroups.find(g => g.id === hoveredGroup) && (
          <GroupTooltip
            groupData={layoutEventsWithGroups.eventGroups.find(g => g.id === hoveredGroup)}
            position={layoutEventsWithGroups.eventGroups.find(g => g.id === hoveredGroup)?.position}
            panY={panY}
            panX={0}
          />
        )}

        {/* 展開されたグループカード（修正版） */}
        {Array.from(expandedGroups).map((groupId) => {
          const groupData = layoutEventsWithGroups.eventGroups.find(g => g.id === groupId);
          if (!groupData) return null;

          return (
            <GroupCard
              key={`group-card-${groupId}`}
              groupData={groupData}
              position={{
                x: groupData.position.x + 30,
                y: groupData.position.y - 50
              }}
              panY={panY}
              panX={0}
              timelineColor={groupData.timelineColor || '#6b7280'} // 年表色を正しく渡す
              onEventDoubleClick={handleEventDoubleClick}
              onClose={() => toggleEventGroup(groupId)}
              onEventClick={handleEventDoubleClick}
            />
          );
        })}

        {/* 年表概要カード */}
        {timelineAxes.map((axis, index) => {
          const timeline = displayTimelines?.find((t) => t.id === axis.id);
          const isTemporary = timeline?.type === "temporary";

          return (
            <TimelineCard
              key={`timeline-card-${axis.id}`}
              timeline={timeline}
              position={{ x: axis.cardX, y: axis.yPosition + 70 }}
              isTemporary={isTemporary}
              panY={panY}
              panX={0}
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
          onClick={() => handleAddEventAtPosition(window.innerWidth / 2, window.innerHeight / 2)}
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