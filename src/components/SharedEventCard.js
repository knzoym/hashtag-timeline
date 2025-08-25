// src/components/SharedEventCard.js
import React from 'react';
import { TIMELINE_CONFIG } from '../constants/timelineConfig';
import { truncateTitle } from '../utils/timelineUtils';

export const SharedEventCard = ({ 
  event, 
  isHighlighted, 
  onDoubleClick, 
  onMouseDown,
  panY,
  calculateTextWidth 
}) => {
  const isTemporary = event.timelineInfo?.isTemporary;
  const timelineColor = event.timelineInfo?.timelineColor;
  
  const createEventColors = (timelineColor) => {
    if (!timelineColor) return { backgroundColor: "#6b7280", textColor: "white" };
    
    const hslMatch = timelineColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (hslMatch) {
      const h = parseInt(hslMatch[1]);
      const s = Math.max(20, parseInt(hslMatch[2]) - 30);
      const l = 95;
      return {
        backgroundColor: `hsl(${h}, ${s}%, ${l}%)`,
        textColor: `hsl(${h}, ${Math.min(100, parseInt(hslMatch[2]) + 20)}%, 25%)`
      };
    }
    return { backgroundColor: "#f3f4f6", textColor: "#374151" };
  };

  const truncatedTitle = truncateTitle(event.title);
  const eventWidth = Math.max(
    TIMELINE_CONFIG.EVENT_WIDTH, 
    (calculateTextWidth?.(truncatedTitle) || 80) + 16
  );

  let eventColors = { backgroundColor: "#6b7280", textColor: "white" };
  
  if (timelineColor) {
    eventColors = createEventColors(timelineColor);
  } else if (isHighlighted) {
    eventColors = { backgroundColor: "#10b981", textColor: "white" };
  }

  return (
    <>
      {/* 年号表示 */}
      <div
        style={{
          position: "absolute",
          left: event.adjustedPosition.x,
          top: event.adjustedPosition.y + panY + 8 + "px",
          transform: "translateX(-50%)",
          zIndex: 2,
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <div style={{ fontSize: "10px", color: "#666", marginBottom: "2px" }}>
          {event.startDate.getFullYear()}
        </div>
      </div>

      {/* イベントタイトル */}
      <div
        data-event-id={event.id}
        style={{
          position: "absolute",
          left: event.adjustedPosition.x,
          top: event.adjustedPosition.y + panY + 15 + "px",
          transform: "translateX(-50%)",
          cursor: "ns-resize",
          zIndex: isHighlighted ? 5 : 4,
          textAlign: "center",
          userSelect: "none",
        }}
        onMouseDown={(e) => onMouseDown(e, event)}
        onDoubleClick={() => onDoubleClick(event)}
      >
        <div
          style={{
            padding: "4px 8px",
            borderRadius: "4px",
            color: eventColors.textColor,
            fontWeight: "500",
            fontSize: "11px",
            width: `${eventWidth}px`,
            backgroundColor: eventColors.backgroundColor,
            border: isHighlighted
              ? "2px solid #059669"
              : isTemporary
              ? `2px dashed ${timelineColor}`
              : timelineColor
              ? `1px solid ${timelineColor}`
              : "none",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            lineHeight: "1.1",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {truncatedTitle}
        </div>
      </div>
    </>
  );
};