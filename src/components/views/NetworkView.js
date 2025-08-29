// src/components/views/NetworkView.js - ネットワーク表示専用ビュー
import React, { useState, useCallback, useMemo } from 'react';
import { EventCard } from '../ui/EventCard';
import { TimelineConnections } from '../ui/TimelineConnections';

export const NetworkView = ({
  // データ
  events = [],
  timelines = [],
  networkLayout,
  
  // 座標・表示制御
  panY,
  getXFromYear,
  coordinates,
  calculateTextWidth,
  
  // イベント処理
  onEventClick,
  onTimelineClick,
  handleEventDoubleClick,
  handleEventDragStart,
  
  // 表示状態
  highlightedEvents = [],
  selectedTimelineId = null,
  
  // ドラッグ状態
  dragState,
}) => {
  // 年表線の状態管理
  const [hoveredTimelineId, setHoveredTimelineId] = useState(null);
  const [selectedTimelineForHighlight, setSelectedTimelineForHighlight] = useState(null);

  // 年表線の表示状態を決定（関数を先に定義）
  const getConnectionDisplayState = useCallback((timelineId) => {
    if (selectedTimelineForHighlight === timelineId) {
      return 'selected';
    }
    if (hoveredTimelineId === timelineId) {
      return 'hovered';
    }
    if (selectedTimelineForHighlight && selectedTimelineForHighlight !== timelineId) {
      return 'dimmed';
    }
    return 'default';
  }, [hoveredTimelineId, selectedTimelineForHighlight]);

  // ネットワーク用イベント配置計算
  const networkEvents = useMemo(() => {
    if (!events || !getXFromYear) return [];

    const results = [];
    
    // 各イベントを一箇所に配置
    events.forEach(event => {
      // イベントが属する年表を取得
      const eventTimelines = timelines.filter(timeline => 
        timeline.eventIds?.includes(event.id) || 
        timeline.pendingEventIds?.includes(event.id) ||
        timeline.removedEventIds?.includes(event.id)
      );

      if (eventTimelines.length === 0) {
        // どの年表にも属さないイベントはメインタイムラインに配置
        results.push({
          ...event,
          position: {
            x: getXFromYear(event.startDate?.getFullYear() || 2024),
            y: window.innerHeight * 0.25 // メインタイムライン位置
          },
          connectedTimelines: [],
          calculatedWidth: calculateTextWidth ? calculateTextWidth(event.title || '') : 80,
          calculatedHeight: 32
        });
      } else {
        // 複数年表に属するイベントは重複を避けて配置
        const eventX = getXFromYear(event.startDate?.getFullYear() || 2024);
        let eventY = window.innerHeight * 0.25; // 基準位置

        // Y座標の調整（他のイベントとの重複回避）
        const existingEvents = results.filter(e => 
          Math.abs(e.position.x - eventX) < 100
        );
        
        if (existingEvents.length > 0) {
          eventY += existingEvents.length * 40; // 40px間隔で配置
        }

        results.push({
          ...event,
          position: { x: eventX, y: eventY },
          connectedTimelines: eventTimelines.map(timeline => ({
            id: timeline.id,
            name: timeline.name,
            color: timeline.color || '#6b7280',
            // 年表軸の位置計算（TimelineAxesと同様の計算）
            axisY: 200 + timelines.findIndex(t => t.id === timeline.id) * 120
          })),
          calculatedWidth: calculateTextWidth ? calculateTextWidth(event.title || '') : 80,
          calculatedHeight: 32
        });
      }
    });

    return results;
  }, [events, timelines, getXFromYear, calculateTextWidth]);

  // 年表線データ生成
  const timelineConnections = useMemo(() => {
    return networkEvents
      .filter(event => event.connectedTimelines.length > 0)
      .map(event => ({
        eventId: event.id,
        eventPosition: event.position,
        connections: event.connectedTimelines.map(timeline => ({
          timelineId: timeline.id,
          timelineName: timeline.name,
          timelineColor: timeline.color,
          startPoint: { x: event.position.x, y: event.position.y },
          endPoint: { x: event.position.x, y: timeline.axisY },
          // 年表線の状態
          displayState: getConnectionDisplayState(timeline.id)
        }))
      }));
  }, [networkEvents, getConnectionDisplayState]);

  // 年表線のホバーハンドラー
  const handleTimelineHover = useCallback((timelineId) => {
    setHoveredTimelineId(timelineId);
  }, []);

  // 年表線のクリックハンドラー
  const handleTimelineConnectionClick = useCallback((timelineId) => {
    if (selectedTimelineForHighlight === timelineId) {
      // 既に選択済みなら解除
      setSelectedTimelineForHighlight(null);
    } else {
      // 新しい年表を選択（排他的）
      setSelectedTimelineForHighlight(timelineId);
    }
    
    // 外部のonTimelineClickも呼び出し
    if (onTimelineClick) {
      onTimelineClick(timelineId);
    }
  }, [selectedTimelineForHighlight, onTimelineClick]);

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
    if (selectedTimelineForHighlight) {
      const isConnected = event.connectedTimelines?.some(
        timeline => timeline.id === selectedTimelineForHighlight
      );
      return basicHighlight || isConnected;
    }
    
    return basicHighlight;
  }, [highlightedEvents, selectedTimelineForHighlight]);

  return (
    <>
      {/* 年表接続線 */}
      <TimelineConnections
        connections={timelineConnections}
        panY={panY}
        onTimelineHover={handleTimelineHover}
        onTimelineClick={handleTimelineConnectionClick}
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
          <div>Selected Timeline: {selectedTimelineForHighlight || 'None'}</div>
          <div>Hovered Timeline: {hoveredTimelineId || 'None'}</div>
        </div>
      )}
    </>
  );
};