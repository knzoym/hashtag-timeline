// src/components/views/NetworkView.js - ネットワーク表示専用ビュー
import React, { useState, useCallback, useMemo } from 'react';
import { EventCard } from '../ui/EventCard';
import { TimelineConnections } from '../ui/TimelineConnections';

export const NetworkView = ({
  // データ
  events = [],
  timelines = [],
  
  // 座標・表示制御
  panY,
  getXFromYear,
  calculateTextWidth,
  
  // イベント処理
  onEventClick,
  onTimelineClick,
  onTimelineDoubleClick, // 年表ダブルクリック専用
  handleEventDoubleClick,
  handleEventDragStart,
  
  // 表示状態
  highlightedEvents = [],
  
  // ドラッグ状態
  dragState,
}) => {
  // 年表線の状態管理
  const [hoveredTimelineId, setHoveredTimelineId] = useState(null);
  const [selectedTimelineId, setSelectedTimelineId] = useState(null);
  const [priorityTimelineIds, setPriorityTimelineIds] = useState([]); // クリックした年表の優先順位

  // イベントのY位置調整（高さ制限付き配置システム）
  const adjustEventPositions = useCallback((events, timelines) => {
    const baseY = window.innerHeight * 0.25;
    const maxGroupHeight = 200; // 年表グループの最大高さ
    const eventSpacing = 50; // イベント間隔を縮小
    const timelineGroupSpacing = 10; // 年表グループ間隔
    
    // 年表の処理順序を決定
    const sortedTimelines = [...timelines].sort((a, b) => {
      const aPriority = priorityTimelineIds.indexOf(a.id);
      const bPriority = priorityTimelineIds.indexOf(b.id);
      
      if (aPriority !== -1 && bPriority !== -1) {
        return aPriority - bPriority;
      }
      if (aPriority !== -1) return -1;
      if (bPriority !== -1) return 1;
      
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
    
    const positionedEvents = [];
    let currentGroupStartY = baseY;
    const usedPositions = new Map();
    
    // 各イベントがどの年表に属するかを事前に計算
    const eventToTimelines = new Map();
    events.forEach(event => {
      const belongingTimelines = timelines.filter(timeline =>
        timeline.eventIds?.includes(event.id) ||
        timeline.pendingEventIds?.includes(event.id) ||
        timeline.removedEventIds?.includes(event.id)
      );
      eventToTimelines.set(event.id, belongingTimelines);
    });
    
    // 年表ごとにイベントを配置
    sortedTimelines.forEach((timeline, timelineIndex) => {
      const timelineEvents = events.filter(event =>
        timeline.eventIds?.includes(event.id) ||
        timeline.pendingEventIds?.includes(event.id) ||
        timeline.removedEventIds?.includes(event.id)
      );
      
      if (timelineEvents.length === 0) return;
      
      // 年月日順にソート
      const sortedTimelineEvents = [...timelineEvents].sort((a, b) => {
        const aTime = a.startDate ? a.startDate.getTime() : 0;
        const bTime = b.startDate ? b.startDate.getTime() : 0;
        return aTime - bTime;
      });
      
      // 年表グループの開始位置設定
      if (timelineIndex > 0) {
        currentGroupStartY += timelineGroupSpacing;
      }
      
      // 高さ制限内でのイベント配置計算
      const maxEventsInHeight = Math.floor(maxGroupHeight / eventSpacing);
      const totalEvents = sortedTimelineEvents.filter(event => !usedPositions.has(event.id)).length;
      
      let groupCenterY = currentGroupStartY + maxGroupHeight / 2;
      let eventIndex = 0;
      
      sortedTimelineEvents.forEach((event) => {
        if (usedPositions.has(event.id)) {
          // 既に配置済み - 位置は変更しない
          const existingPos = usedPositions.get(event.id);
          existingPos.belongingTimelines = eventToTimelines.get(event.id) || [];
          return;
        }
        
        // 新規配置：4件おきに往復する上下交互配置
        let eventY;
        
        if (totalEvents <= maxEventsInHeight) {
          // 通常の下方向配置（高さ制限内）
          eventY = currentGroupStartY + eventIndex * eventSpacing;
        } else {
          // 4件おきに往復する配置システム
          const cycleLength = 8; // 8件で1往復（下4件→上4件）
          const cycleIndex = eventIndex % cycleLength;
          const cycleNumber = Math.floor(eventIndex / cycleLength);
          
          if (cycleIndex < 4) {
            // 下方向（0, 1, 2, 3）
            eventY = groupCenterY + (cycleIndex * eventSpacing / 2) + (cycleNumber * eventSpacing * 2);
          } else {
            // 上方向（4, 5, 6, 7 → -1, -2, -3, -4）
            const upwardIndex = cycleIndex - 4;
            eventY = groupCenterY - ((upwardIndex + 1) * eventSpacing / 2) - (cycleNumber * eventSpacing * 2);
          }
        }
        
        const eventX = getXFromYear(event.startDate?.getFullYear() || 2024);
        const position = {
          ...event,
          position: { x: eventX, y: eventY },
          belongingTimelines: eventToTimelines.get(event.id) || [],
          calculatedWidth: calculateTextWidth ? calculateTextWidth(event.title || '') : 80,
          calculatedHeight: 32
        };
        
        positionedEvents.push(position);
        usedPositions.set(event.id, position);
        eventIndex++;
      });
      
      // 次の年表グループの開始位置を更新
      const actualGroupHeight = Math.min(maxGroupHeight, totalEvents * eventSpacing);
      currentGroupStartY += actualGroupHeight;
    });
    
    // どの年表にも属さないイベントを最後に配置
    const orphanEvents = events.filter(event => !usedPositions.has(event.id));
    orphanEvents.forEach((event, index) => {
      const eventX = getXFromYear(event.startDate?.getFullYear() || 2024);
      const eventY = currentGroupStartY + timelineGroupSpacing + index * eventSpacing;
      
      const position = {
        ...event,
        position: { x: eventX, y: eventY },
        belongingTimelines: [],
        calculatedWidth: calculateTextWidth ? calculateTextWidth(event.title || '') : 80,
        calculatedHeight: 32
      };
      
      positionedEvents.push(position);
      usedPositions.set(event.id, position);
    });
    
    return positionedEvents;
  }, [getXFromYear, calculateTextWidth, priorityTimelineIds]);

  // ネットワーク用イベント配置計算
  const networkEvents = useMemo(() => {
    if (!events || !getXFromYear) return [];
    return adjustEventPositions(events, timelines);
  }, [events, timelines, getXFromYear, adjustEventPositions]);

  // 年表線の表示状態を決定
  const getConnectionDisplayState = useCallback((timelineId) => {
    if (selectedTimelineId === timelineId) {
      return 'selected';
    }
    if (hoveredTimelineId === timelineId) {
      return 'hovered';
    }
    if (selectedTimelineId && selectedTimelineId !== timelineId) {
      return 'dimmed';
    }
    return 'default';
  }, [hoveredTimelineId, selectedTimelineId]);

  // 年表線データ生成（複数年表対応）
  const timelineConnections = useMemo(() => {
    const connections = [];
    
    timelines.forEach(timeline => {
      const timelineEvents = networkEvents.filter(event => 
        event.belongingTimelines?.some(t => t.id === timeline.id)
      );
      
      if (timelineEvents.length < 2) return;
      
      const sortedEvents = [...timelineEvents].sort((a, b) => {
        const aTime = a.startDate ? a.startDate.getTime() : 0;
        const bTime = b.startDate ? b.startDate.getTime() : 0;
        return aTime - bTime;
      });
      
      // 隣接するイベント同士を線で接続
      for (let i = 0; i < sortedEvents.length - 1; i++) {
        const currentEvent = sortedEvents[i];
        const nextEvent = sortedEvents[i + 1];
        
        connections.push({
          timelineId: timeline.id,
          timelineName: timeline.name,
          timelineColor: timeline.color || '#6b7280',
          startPoint: { 
            x: currentEvent.position.x, 
            y: currentEvent.position.y 
          },
          endPoint: { 
            x: nextEvent.position.x, 
            y: nextEvent.position.y 
          },
          displayState: getConnectionDisplayState(timeline.id)
        });
      }
    });
    
    return connections;
  }, [networkEvents, timelines, getConnectionDisplayState]);

  // 年表線のクリックハンドラー
  const handleTimelineConnectionClick = useCallback((timelineId) => {
    console.log('年表線クリック:', timelineId);
    
    if (selectedTimelineId === timelineId) {
      // 既に選択済みなら解除
      setSelectedTimelineId(null);
    } else {
      // 新しい年表を選択（排他的）
      setSelectedTimelineId(timelineId);
      
      // 優先度を最高に設定（配列の先頭に移動）
      setPriorityTimelineIds(prev => {
        const filtered = prev.filter(id => id !== timelineId);
        return [timelineId, ...filtered];
      });
    }
    
    // 外部のonTimelineClickも呼び出し
    if (onTimelineClick) {
      onTimelineClick(timelineId);
    }
  }, [selectedTimelineId, onTimelineClick]);

  // 年表線のダブルクリックハンドラー
  const handleTimelineConnectionDoubleClick = useCallback((timelineId) => {
    console.log('年表線ダブルクリック:', timelineId);
    const timeline = timelines.find(t => t.id === timelineId);
    if (timeline && onTimelineClick) {
      onTimelineClick(timeline); // 年表モーダルを開く
    }
  }, [timelines, onTimelineClick]);

  // 年表線のホバーハンドラー
  const handleTimelineHover = useCallback((timelineId) => {
    setHoveredTimelineId(timelineId);
  }, []);

  // イベントの強調表示判定
  const isEventHighlighted = useCallback((event) => {
    // highlightedEventsの型を統一的にチェック
    let basicHighlight = false;
    
    if (!highlightedEvents) {
      basicHighlight = false;
    } else if (highlightedEvents.has) {
      // Set型の場合
      basicHighlight = highlightedEvents.has(event.id);
    } else if (Array.isArray(highlightedEvents)) {
      // 配列の場合
      basicHighlight = highlightedEvents.some(e => e.id === event.id);
    } else {
      // その他の場合は文字列比較を試行
      basicHighlight = highlightedEvents.includes && highlightedEvents.includes(event.id);
    }
    
    // 選択された年表に関連するイベントもハイライト
    if (selectedTimelineId) {
      const isConnected = event.timelineId === selectedTimelineId;
      return basicHighlight || isConnected;
    }
    
    return basicHighlight;
  }, [highlightedEvents, selectedTimelineId]);

  return (
    <>
      {/* 年表接続線 */}
      <TimelineConnections
        connections={timelineConnections}
        panY={panY}
        onTimelineHover={handleTimelineHover}
        onTimelineClick={handleTimelineConnectionClick} // 位置調整のみ
        onTimelineDoubleClick={handleTimelineConnectionDoubleClick} // モーダル表示
      />

      {/* イベントカード */}
      {networkEvents.map((event) => {
        const isHighlighted = isEventHighlighted(event);
        const isDragging = dragState?.draggedEvent?.id === event.id;
        
        return (
          <div
            key={event.id}
            style={{
              position: 'absolute',
              left: `${event.position.x - event.calculatedWidth / 2}px`,
              top: `${event.position.y + panY}px`,
              zIndex: isDragging ? 1000 : 10,
            }}
          >
            <EventCard
              event={event}
              isHighlighted={isHighlighted}
              onDoubleClick={() => handleEventDoubleClick?.(event)}
              onDragStart={handleEventDragStart}
              isDragging={isDragging}
              calculateTextWidth={calculateTextWidth}
              style={{
                transform: isDragging 
                  ? `translate(${dragState.currentPosition.x - dragState.startPosition.x}px, ${dragState.currentPosition.y - dragState.startPosition.y}px)`
                  : 'none',
                opacity: isDragging ? 0.8 : 1,
              }}
            />
          </div>
        );
      })}

      {/* デバッグ情報 */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '8px',
          fontSize: '12px',
          borderRadius: '4px',
          zIndex: 9999
        }}>
          <div>Network Events: {networkEvents.length}</div>
          <div>Connections: {timelineConnections.length}</div>
          <div>Selected Timeline: {selectedTimelineId || 'None'}</div>
          <div>Hovered Timeline: {hoveredTimelineId || 'None'}</div>
        </div>
      )}
    </>
  );
};