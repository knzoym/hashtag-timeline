// src/components/EventView.js - 完全修正版
import React, { useCallback, useState, useMemo } from 'react';
import { EnhancedEventCard } from './EnhancedEventCard';
import { SmoothTimelineConnection } from './SmoothTimelineConnection';
import { useEnhancedEventLayout } from '../hooks/useEnhancedEventLayout';
import { TIMELINE_CONFIG } from '../constants/timelineConfig';

export const EventView = ({
  events,
  timelines,
  currentPixelsPerYear,
  panX,
  panY,
  scale,
  highlightedEvents,
  onEventDoubleClick,
  onEventDrag,
  calculateTextWidth,
}) => {
  // 強調表示状態管理
  const [hoveredTimeline, setHoveredTimeline] = useState(null);
  const [selectedTimeline, setSelectedTimeline] = useState(null);

  // 強化されたレイアウト
  const { eventPositions, timelineConnections } = useEnhancedEventLayout(
    events,
    timelines, 
    currentPixelsPerYear,
    panX,
    panY
  );

  // 画面内のイベント数に基づくサイズ調整
  const getEventSizeScale = useMemo(() => {
    const viewportWidth = window.innerWidth;
    const visibleEvents = eventPositions.filter(event => {
      const eventX = event.adjustedPosition.x;
      return eventX > -panX - 200 && eventX < viewportWidth - panX + 200;
    });

    const visibleCount = visibleEvents.length;
    
    // 段階的なサイズ調整
    if (visibleCount <= 3) return { scale: 1.4, fontSize: 13, spacing: 80 };      // 極少: 最大
    if (visibleCount <= 8) return { scale: 1.2, fontSize: 12, spacing: 70 };      // 少ない: 大きく
    if (visibleCount <= 15) return { scale: 1.0, fontSize: 11, spacing: 60 };     // 普通: 標準
    if (visibleCount <= 25) return { scale: 0.85, fontSize: 10, spacing: 50 };    // 多い: 小さく
    if (visibleCount <= 40) return { scale: 0.7, fontSize: 9, spacing: 45 };      // 非常に多い: より小さく
    return { scale: 0.6, fontSize: 8, spacing: 40 };                              // 極多: 最小
  }, [eventPositions, panX]);

  // 年表のクリック/ホバーハンドリング
  const handleTimelineHover = useCallback((timelineId) => {
    setHoveredTimeline(timelineId);
  }, []);

  const handleTimelineClick = useCallback((timelineId) => {
    setSelectedTimeline(selectedTimeline === timelineId ? null : timelineId);
  }, [selectedTimeline]);

  // 表示状態の判定
  const getTimelineDisplayState = useCallback((timelineId) => {
    if (selectedTimeline === timelineId) return 'selected';
    if (hoveredTimeline === timelineId) return 'hovered';
    if (selectedTimeline && selectedTimeline !== timelineId) return 'dimmed';
    return 'normal';
  }, [selectedTimeline, hoveredTimeline]);

  // 年マーカー生成
  const generateYearMarkers = useCallback(() => {
    const markers = [];
    let yearInterval;
    
    if (scale > 5) yearInterval = 10;
    else if (scale > 2) yearInterval = 25;
    else if (scale > 1) yearInterval = 50;
    else yearInterval = 100;

    for (let year = -5000; year <= 5000; year += yearInterval) {
      const x = (year - (-5000)) * currentPixelsPerYear + panX;
      if (x > -100 && x < window.innerWidth + 100) {
        markers.push(
          <div
            key={year}
            style={{
              position: 'absolute',
              left: x,
              top: 0,
              height: '100%',
              borderLeft: '1px solid #f0f0f0',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '10px',
                left: '5px',
                fontSize: '11px',
                color: '#c0c0c0',
                userSelect: 'none',
              }}
            >
              {year}
            </span>
          </div>
        );
      }
    }
    return markers;
  }, [scale, currentPixelsPerYear, panX]);

  // 現在線
  const currentYearLine = useMemo(() => (
    <div
      style={{
        position: 'absolute',
        left: (2025 - (-5000)) * currentPixelsPerYear + panX,
        top: 0,
        height: '100%',
        borderLeft: '2px solid #f59e0b',
        pointerEvents: 'none',
        opacity: 0.6,
        zIndex: 2,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '5px',
          top: '20px',
          fontSize: '11px',
          color: '#f59e0b',
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: '2px 6px',
          borderRadius: '3px',
          fontWeight: '600',
        }}
      >
        現在 (2025)
      </div>
    </div>
  ), [currentPixelsPerYear, panX]);

  return (
    <>
      {/* 年マーカー */}
      {generateYearMarkers()}
      
      {/* 現在線 */}
      {currentYearLine}
      
      {/* 滑らかな年表線 - 逆順で描画してホバー問題を解決 */}
      {timelineConnections.slice().reverse().map((timeline, reverseIndex) => {
        const originalIndex = timelineConnections.length - 1 - reverseIndex;
        return (
          <SmoothTimelineConnection 
            key={timeline.id} 
            timeline={timeline} 
            panY={panY}
            displayState={getTimelineDisplayState(timeline.id)}
            onHover={handleTimelineHover}
            onClick={handleTimelineClick}
            zIndex={5 + originalIndex} // 適切なzIndex順序
            eventSizeScale={getEventSizeScale}
          />
        );
      })}
      
      {/* イベント表示 */}
      {eventPositions.map((event) => {
        // 複数年表対応の強調判定
        const isTimelineHighlighted = event.timelineInfos?.some(info =>
          selectedTimeline === info.timelineId || hoveredTimeline === info.timelineId
        );

        return (
          <EnhancedEventCard
            key={event.id}
            event={event}
            isHighlighted={highlightedEvents.has(event.id)}
            isTimelineHighlighted={isTimelineHighlighted}
            onDoubleClick={onEventDoubleClick}
            onMouseDown={onEventDrag}
            panY={panY}
            calculateTextWidth={calculateTextWidth}
            sizeScale={getEventSizeScale}
          />
        );
      })}
    </>
  );
};