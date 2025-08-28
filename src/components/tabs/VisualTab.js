// src/components/tabs/VisualTab.js - グループ位置修正版
import React, { useRef, useCallback, useState, useMemo } from "react";
import SearchPanel from "../ui/SearchPanel";
import { TimelineCard } from "../ui/TimelineCard";
import { EventModal } from "../modals/EventModal";
import TimelineModal from "../modals/TimelineModal";
import { SmoothLines } from "../ui/SmoothLines";
import { EventGroupIcon, GroupTooltip, GroupCard } from "../ui/EventGroup";
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

  // テキスト幅計算（昔と同じ）
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
      const s = Math.max(20, Math.min(50, parseInt(match[2]) - 15)); // 彩度を大幅に落として落ち着いた色に
      const l = Math.max(20, parseInt(match[3]) - darkenAmount); // 明度も下げる
      return `hsl(${h}, ${s}%, ${l}%)`;
    }
    return hslColor;
  }, []);

  // 衝突検出ヘルパー関数
  const findCollisionInTier = useCallback((tier, eventX, eventWidth) => {
    const eventStart = eventX - eventWidth / 2;
    const eventEnd = eventX + eventWidth / 2;
    const gap = 15;

    return tier.find(occupied => 
      !(eventEnd + gap < occupied.startX || eventStart - gap > occupied.endX)
    );
  }, []);

  // グループ内イベントの年号範囲から中央位置を計算するヘルパー関数
  const calculateGroupCenterX = useCallback((groupEvents) => {
    const validEvents = groupEvents.filter(event => event.startDate);
    if (validEvents.length === 0) return 100;

    const years = validEvents.map(event => event.startDate.getFullYear());
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const centerYear = (minYear + maxYear) / 2;
    
    return getXFromYear(centerYear);
  }, [getXFromYear]);

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

  // グループ化対応イベントレイアウト計算（修正版）
  const layoutEventsWithGroups = useMemo(() => {
    if (!events || !getXFromYear) return { allEvents: [], eventGroups: [] };

    const results = [];
    const groups = new Map(); // グループの実体を管理 (key: groupId, value: groupData)
    const eventIdToGroupId = new Map(); // イベントIDがどのグループに属しているかを管理
    
    // 画面高さの30%を基準位置とする
    const baselineY = window.innerHeight * 0.3;
    
    // メインタイムライン（年表に属さないイベント）を先に処理
    const ungroupedEvents = events.filter(event => 
      !event.timelineInfos?.length && 
      !timelineAxes.some(axis => axis.timeline.eventIds?.includes(event.id))
    );

    // メインタイムライン用の上方向重なり回避
    const mainTimelineOccupied = [];
    
    ungroupedEvents.forEach(event => {
      const eventX = getXFromYear(event.startDate?.getFullYear() || 2024);
      const textWidth = calculateTextWidth(event.title);
      const eventWidth = Math.max(80, textWidth + 20);
      
      // 上方向への配置試行（-40px間隔）
      let finalY = baselineY;
      let placed = false;
      
      for (let tier = 0; tier < 5; tier++) { // 最大5段まで上方向
        const testY = baselineY - (tier * 45);
        const collision = mainTimelineOccupied.find(occupied => 
          Math.abs(occupied.x - eventX) < (occupied.width + eventWidth) / 2 + 15 &&
          Math.abs(occupied.y - testY) < 35
        );
        
        if (!collision) {
          finalY = testY;
          mainTimelineOccupied.push({
            x: eventX,
            y: finalY,
            width: eventWidth,
            eventId: event.id
          });
          placed = true;
          break;
        }
      }
      
      if (!placed) {
        finalY = baselineY - (mainTimelineOccupied.length * 45);
        mainTimelineOccupied.push({
          x: eventX,
          y: finalY,
          width: eventWidth,
          eventId: event.id
        });
      }
      
      results.push({
        ...event,
        adjustedPosition: { x: eventX, y: finalY },
        calculatedWidth: eventWidth,
        timelineColor: '#6b7280',
        timelineInfo: null,
        hiddenByGroup: false
      });
    });
    
    // 年表ごとにイベントを配置
    timelineAxes.forEach((axis, axisIndex) => {
        const timelineEvents = events.filter(event => {
            if (event.timelineInfos?.some(info => info.timelineId === axis.id && !info.isTemporary)) {
                return true;
            }
            if (axis.timeline.eventIds?.includes(event.id)) {
                return true;
            }
            return false;
        });

        const timelineY = baselineY + 100 + (axisIndex * 120);

        const sortedEvents = [...timelineEvents].sort((a, b) => 
            (a.startDate?.getFullYear() || 0) - (b.startDate?.getFullYear() || 0)
        );

        const tiers = [[], [], []]; // 3段の占有情報

        sortedEvents.forEach(event => {
            const eventX = getXFromYear(event.startDate?.getFullYear() || 2024);
            const textWidth = calculateTextWidth(event.title);
            const eventWidth = Math.max(80, textWidth + 20);

            let placed = false;
            let collisionInfo = null;

            for (const tryTier of [1, 0, 2]) {
                const collision = findCollisionInTier(tiers[tryTier], eventX, eventWidth);
                if (!collision) {
                    tiers[tryTier].push({
                        startX: eventX - eventWidth / 2,
                        endX: eventX + eventWidth / 2,
                        eventId: event.id,
                        tierIndex: tryTier,
                    });
                    
                    const eventY = timelineY + (tryTier - 1) * 40;
                    results.push({
                        ...event,
                        adjustedPosition: { x: eventX, y: eventY },
                        calculatedWidth: eventWidth,
                        timelineColor: axis.color,
                        timelineInfo: {
                            timelineId: axis.id,
                            timelineName: axis.name,
                            timelineColor: axis.color,
                            needsExtensionLine: tryTier !== 1,
                            axisY: timelineY,
                        },
                        hiddenByGroup: false,
                    });
                    placed = true;
                    break;
                }
                // 下段で衝突した場合、その情報を保持
                if (tryTier === 2) {
                    collisionInfo = collision;
                }
            }

            // どの段にも配置できなかった場合（＝グループ化が必要）
            if (!placed && collisionInfo) {
                const collidedEventId = collisionInfo.eventId;
                const existingGroupId = eventIdToGroupId.get(collidedEventId);

                let targetGroup;

                if (existingGroupId) {
                    // 衝突相手が既にグループに属している場合
                    targetGroup = groups.get(existingGroupId);
                } else {
                    // 衝突相手がまだグループに属していない場合、新しいグループを作成
                    const collidedEventResult = results.find(r => r.id === collidedEventId);
                    
                    if (collidedEventResult) {
                        // 新規グループを作成
                        const newGroupId = `group-${axis.id}-${collidedEventId}`;
                        targetGroup = {
                            id: newGroupId,
                            events: [collidedEventResult], // 衝突された側のイベント
                            count: 1,
                            position: { x: 0, y: timelineY + 80 }, // y座標を固定
                            timelineColor: axis.color,
                            timelineId: axis.id,
                            getDisplayCount: function() { return this.count; },
                            getMainEvent: function() { return this.events[0]; }
                        };
                        groups.set(newGroupId, targetGroup);
                        eventIdToGroupId.set(collidedEventId, newGroupId);

                        // 元々配置されていたイベントを非表示にする
                        collidedEventResult.hiddenByGroup = true;
                    }
                }
                
                if (targetGroup) {
                    // 現在のイベントをグループに追加
                    targetGroup.events.push(event);
                    targetGroup.count++;
                    eventIdToGroupId.set(event.id, targetGroup.id);

                    // イベント追加後にグループの中心位置を再計算
                    targetGroup.position.x = calculateGroupCenterX(targetGroup.events);
                }
            }
        });
    });

    const finalGroups = Array.from(groups.values());
    
    // グループによって隠されたイベントを最終結果から除外
    const finalEvents = results.filter(event => !event.hiddenByGroup);

    console.log(`レイアウト計算完了: ${finalEvents.length}イベント, ${finalGroups.length}グループ`);
    return { allEvents: finalEvents, eventGroups: finalGroups };

  }, [events, timelineAxes, getXFromYear, calculateTextWidth, findCollisionInTier, calculateGroupCenterX]);

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
    
    // イベントの正規化（必要なプロパティが存在することを確認）
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

        {/* 通常イベント表示 */}
        {layoutEventsWithGroups.allEvents
          .filter(event => !event.hiddenByGroup)
          .map((event, index) => {
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
                  backgroundColor: event.timelineInfo ? 
                    getDarkerColor(event.timelineColor) : // 年表イベント：暗めの有彩色
                    (isHighlighted ? "#4b5563" : "#6b7280"), // メインタイムライン：グレー
                  color: "white", // 常に白文字
                  border: `2px solid ${
                    isHighlighted ? "#f59e0b" : 
                    event.timelineInfo ? getDarkerColor(event.timelineColor, 20) : "#4b5563"
                  }`,
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: "500",
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

        {/* イベントグループアイコン（位置修正済み） */}
        {layoutEventsWithGroups.eventGroups.map((groupData) => (
          <EventGroupIcon
            key={`group-icon-${groupData.id}`}
            groupData={groupData}
            position={groupData.position}
            panY={panY}
            panX={panX}
            timelineColor={groupData.timelineColor}
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
        ))}

        {/* グループツールチップ */}
        {hoveredGroup && layoutEventsWithGroups.eventGroups.find(g => g.id === hoveredGroup) && (
          <GroupTooltip
            groupData={layoutEventsWithGroups.eventGroups.find(g => g.id === hoveredGroup)}
            position={layoutEventsWithGroups.eventGroups.find(g => g.id === hoveredGroup)?.position}
            panY={panY}
            panX={panX}
          />
        )}

        {/* 展開されたグループカード */}
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
              panX={panX}
              timelineColor={groupData.timelineColor}
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
          const baselineY = window.innerHeight * 0.3;
          const cardY = baselineY + 70 + (index * 120);

          return (
            <TimelineCard
              key={`timeline-card-${axis.id}`}
              timeline={timeline}
              position={{ x: axis.cardX, y: cardY + panY }}
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