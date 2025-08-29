import React from 'react';
import { TimelineCard } from './TimelineCard';

export const TimelineAxes = ({
  axes,
  displayTimelines,
  panY,
  onTimelineClick,
  onDeleteTempTimeline,
  onDeleteTimeline,
}) => {
  return (
    <>
      {/* 年表軸 */}
      {axes.map((axis, index) => {
        const baselineY = window.innerHeight * 0.3;
        const axisY = baselineY + 100 + index * 120;

        return (
          <div
            key={`timeline-axis-${axis.id}`}
            style={{
              position: 'absolute',
              left: '0px',
              right: '0px',
              top: `${axisY + panY}px`,
              width: '100%',
              height: '3px',
              backgroundColor: axis.color,
              zIndex: 2,
              opacity: 0.8,
            }}
          />
        );
      })}

      {/* 年表概要カード */}
      {axes.map((axis) => {
        const timeline = displayTimelines?.find((t) => t.id === axis.id);
        if (!timeline) return null;

        const isTemporary = timeline.type === 'temporary';

        return (
          <TimelineCard
            key={`timeline-card-${axis.id}`}
            timeline={timeline}
            position={{ x: axis.cardX, y: axis.yPosition + 70 }}
            isTemporary={isTemporary}
            panY={panY}
            panX={0}
            onEdit={() => onTimelineClick && onTimelineClick(timeline)}
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
    </>
  );
};