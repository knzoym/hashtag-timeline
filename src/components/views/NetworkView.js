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

  // イベントのY位置調整（同じ年表は近い位置に）
  const adjustEventPositions = useCallback((events, timelines) => {
    const baseY = window.innerHeight * 0.25; // メインタイムライン位置
    const eventSpacing = 45; // イベント間隔
    const timelineGroupSpacing = 20; // 年表グループ間の追加間隔
    
    // 年表の処理順序を決定（新しく作成された年表、クリックされた年表を優先）
    const sortedTimelines = [...timelines].sort((a, b) => {
      const aPriority = priorityTimelineIds.indexOf(a.id);
      const bPriority = priorityTimelineIds.indexOf(b.id);
      
      // 優先度が設定されている場合は優先度順
      if (aPriority !== -1 && bPriority !== -1) {
        return aPriority - bPriority;
      }
      if (aPriority !== -1) return -1;
      if (bPriority !== -1) return 1;
      
      // 作成日時順（新しい年表を優先）
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
    
    const positionedEvents = [];
    let currentY = baseY;
    const usedPositions = new Map(); // eventId -> position
    
    // 年表ごとにイベントを配置
    sortedTimelines.forEach((timeline, timelineIndex) => {
      const timelineEvents = events.filter(event =>
        timeline.eventIds?.includes(event.id) ||
        timeline.pendingEventIds?.includes(event.id) ||
        timeline.removedEventIds?.includes(event.id)
      );
      
      if (timelineEvents.length === 0) return;
      
      // 年表内のイベントを年月日順にソート
      const sortedTimelineEvents = [...timelineEvents].sort((a, b) => {
        const aTime = a.startDate ? a.startDate.getTime() : 0;
        const bTime = b.startDate ? b.startDate.getTime() : 0;
        return aTime - bTime;
      });
      
      // 年表グループ開始位置
      if (timelineIndex > 0) {
        currentY += timelineGroupSpacing;
      }
      
      sortedTimelineEvents.forEach((event, eventIndex) => {
        if (usedPositions.has(event.id)) {
          // 既に配置済みのイベントの場合、優先度が高い年表なら位置を更新
          const existingPos = usedPositions.get(event.id);
          const existingTimelineIndex = sortedTimelines.findIndex(t => 
            positionedEvents.find(pe => pe.id === event.id)?.timelineId === t.id
          );
          
          if (timelineIndex < existingTimelineIndex) {
            // より優先度の高い年表なので位置を更新
            existingPos.y = currentY;
            existingPos.timelineId = timeline.id;
            existingPos.timelineColor = timeline.color;
          }
        } else {
          // 新規配置
          const eventX = getXFromYear(event.startDate?.getFullYear() || 2024);
          const position = {
            ...event,
            position: { x: eventX, y: currentY },
            timelineId: timeline.id,
            timelineColor: timeline.color || '#6b7280',
            calculatedWidth: calculateTextWidth ? calculateTextWidth(event.title || '') : 80,
            calculatedHeight: 32
          };
          
          positionedEvents.push(position);
          usedPositions.set(event.id, position);
        }
        
        currentY += eventSpacing;
      });
    });
    
    // どの年表にも属さないイベントを最後に配置
    events.forEach(event => {
      if (!usedPositions.has(event.id)) {
        const eventX = getXFromYear(event.startDate?.getFullYear() || 2024);
        const position = {
          ...event,
          position: { x: eventX, y: currentY },
          timelineId: null,
          timelineColor: '#6b7280',
          calculatedWidth: calculateTextWidth ? calculateTextWidth(event.title || '') : 80,
          calculatedHeight: 32
        };
        
        positionedEvents.push(position);
        usedPositions.set(event.id, position);
        currentY += eventSpacing;
      }
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

  // 年表線データ生成（同じ年表のイベント同士を接続）
  const timelineConnections = useMemo(() => {
    const connections = [];
    
    timelines.forEach(timeline => {
      const timelineEvents = networkEvents.filter(event => 
        event.timelineId === timeline.id
      );
      
      if (timelineEvents.length < 2) return; // 2つ以上のイベントがある年表のみ
      
      // イベントを年月日順にソート
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
        onTimelineClick={handleTimelineConnectionClick}
        onTimelineDoubleClick={handleTimelineConnectionDoubleClick}
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