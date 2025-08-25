// src/components/EventView.js - 強化版
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
      
      {/* 滑らかな年表線（画像参考） */}
      {timelineConnections.map(timeline => (
        <SmoothTimelineConnection 
          key={timeline.id} 
          timeline={timeline} 
          panY={panY}
          displayState={getTimelineDisplayState(timeline.id)}
          onHover={handleTimelineHover}
          onClick={handleTimelineClick}
        />
      ))}
      
      {/* イベント表示 */}
      {eventPositions.map((event) => (
        <EnhancedEventCard
          key={event.id}
          event={event}
          isHighlighted={highlightedEvents.has(event.id)}
          isTimelineHighlighted={
            selectedTimeline === event.timelineInfo?.timelineId ||
            hoveredTimeline === event.timelineInfo?.timelineId
          }
          onDoubleClick={onEventDoubleClick}
          onMouseDown={onEventDrag}
          panY={panY}
          calculateTextWidth={calculateTextWidth}
        />
      ))}
    </>
  );
};