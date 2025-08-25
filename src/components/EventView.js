
// src/components/EventView.js
import React, { useCallback } from 'react';
import { SharedEventCard } from './SharedEventCard';
import { SubwayConnection } from './SubwayConnection';
import { useEventViewLayout } from '../hooks/useEventViewLayout';
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
  // イベントビュー専用レイアウト
  const { eventPositions, timelineConnections } = useEventViewLayout(
    events,
    timelines, 
    currentPixelsPerYear,
    panX,
    panY
  );

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
              borderLeft: '1px solid #e5e7eb',
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '10px',
                left: '5px',
                fontSize: '12px',
                color: '#9ca3af',
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
  const currentYearLine = (
    <div
      style={{
        position: 'absolute',
        left: (2025 - (-5000)) * currentPixelsPerYear + panX,
        top: 0,
        height: '100%',
        borderLeft: '2px solid #f59e0b',
        pointerEvents: 'none',
        opacity: 0.8,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '5px',
          top: '20px',
          fontSize: '12px',
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
  );

  return (
    <>
      {/* 年マーカー */}
      {generateYearMarkers()}
      
      {/* 現在線 */}
      {currentYearLine}
      
      {/* 地下鉄路線図スタイルの年表線 */}
      {timelineConnections.map(timeline => (
        <SubwayConnection 
          key={timeline.id} 
          timeline={timeline} 
          panY={panY}
        />
      ))}
      
      {/* 路線名ラベル */}
      {timelineConnections.map(timeline => (
        <SubwayLineLabel 
          key={`label-${timeline.id}`} 
          timeline={timeline} 
          panY={panY}
          panX={panX}
        />
      ))}
      
      {/* イベント表示 */}
      {eventPositions.map((event) => (
        <SharedEventCard
          key={event.id}
          event={event}
          isHighlighted={highlightedEvents.has(event.id)}
          onDoubleClick={onEventDoubleClick}
          onMouseDown={onEventDrag}
          panY={panY}
          calculateTextWidth={calculateTextWidth}
        />
      ))}
    </>
  );
};

// 路線名ラベルコンポーネント
const SubwayLineLabel = ({ timeline, panY, panX }) => {
  if (!timeline.points || timeline.points.length === 0) return null;

  const visiblePoints = timeline.points.filter(point => 
    point.x > -panX - 100 && point.x < window.innerWidth - panX + 100
  );

  if (visiblePoints.length === 0) return null;

  const labelPoint = visiblePoints[0];
  
  return (
    <div
      style={{
        position: 'absolute',
        left: labelPoint.x - 40,
        top: labelPoint.y + panY - 35,
        padding: '4px 10px',
        backgroundColor: timeline.color,
        color: 'white',
        fontSize: '11px',
        fontWeight: '600',
        borderRadius: '12px',
        zIndex: 20,
        whiteSpace: 'nowrap',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
        border: '2px solid white',
      }}
    >
      {timeline.name}
    </div>
  );
};