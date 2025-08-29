import React from 'react';
import { SmoothLines } from '../ui/SmoothLines';
import { EventCard } from '../ui/EventCard';

export const NetworkView = ({
  networkLayout,
  networkConnections,
  panY,
  highlightedEvents = [],
  onTimelineClick,
  handleEventDoubleClick,
  calculateTextWidth,
  // 新しく追加するプロパティ
  timelineAxes = [],
  onEventUpdate,
}) => {
  return (
    <>
      {/* 接続線 */}
      {networkConnections.map((timeline, index) => (
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

      {/* イベント */}
      {networkLayout.events.map((event) => {
        const isHighlighted = highlightedEvents.some((e) => e.id === event.id);
        
        return (
          <EventCard
            key={event.id}
            event={event}
            style={{
              position: 'absolute',
              left: `${event.adjustedPosition.x}px`,
              top: `${event.adjustedPosition.y + panY}px`,
              transform: 'translateX(-50%)',
            }}
            isHighlighted={isHighlighted}
            onDoubleClick={() => handleEventDoubleClick(event)}
            onMouseDown={(e) => e.stopPropagation()}
            calculateTextWidth={calculateTextWidth}
            className="no-pan"
            // ドラッグに必要なプロパティを追加
            timelineAxes={timelineAxes}
            onEventUpdate={onEventUpdate}
          />
        );
      })}
    </>
  );
};