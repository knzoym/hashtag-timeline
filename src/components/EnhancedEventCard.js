// src/components/EnhancedEventCard.js
import React from 'react';
import { TIMELINE_CONFIG } from '../constants/timelineConfig';
import { truncateTitle } from '../utils/timelineUtils';

export const EnhancedEventCard = ({ 
  event, 
  isHighlighted, 
  isTimelineHighlighted,
  onDoubleClick, 
  onMouseDown,
  panY,
  calculateTextWidth 
}) => {
  const truncatedTitle = truncateTitle(event.title);
  const eventWidth = Math.max(
    TIMELINE_CONFIG.EVENT_WIDTH, 
    (calculateTextWidth?.(truncatedTitle) || 80) + 16
  );

  // イベントの色は初期色を保持、年表強調時のみ変更
  let eventColors;
  
  if (isTimelineHighlighted && event.timelineInfo) {
    // 年表強調時は年表色を使用
    const timelineColor = event.timelineInfo.timelineColor;
    eventColors = {
      backgroundColor: timelineColor,
      textColor: "white",
      borderColor: timelineColor
    };
  } else if (isHighlighted) {
    // 検索ハイライト
    eventColors = {
      backgroundColor: "#10b981",
      textColor: "white",
      borderColor: "#10b981"
    };
  } else {
    // 通常表示（初期色を保持）
    eventColors = {
      backgroundColor: "#6b7280",
      textColor: "white",
      borderColor: "#6b7280"
    };
  }

  return (
    <>
      {/* 年号表示 */}
      <div
        style={{
          position: "absolute",
          left: event.adjustedPosition.x,
          top: event.adjustedPosition.y + panY - 12 + "px",
          transform: "translateX(-50%)",
          zIndex: 4,
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <div style={{ 
          fontSize: "9px", 
          color: isTimelineHighlighted ? event.timelineInfo?.timelineColor : "#999",
          fontWeight: isTimelineHighlighted ? "600" : "normal",
          marginBottom: "2px" 
        }}>
          {event.startDate.getFullYear()}
        </div>
      </div>

      {/* イベントカード */}
      <div
        data-event-id={event.id}
        style={{
          position: "absolute",
          left: event.adjustedPosition.x,
          top: event.adjustedPosition.y + panY + "px",
          transform: "translateX(-50%)",
          cursor: "ns-resize",
          zIndex: isTimelineHighlighted ? 25 : (isHighlighted ? 24 : 23), // 年表線より確実に上に
          textAlign: "center",
          userSelect: "none",
          transition: "all 0.2s ease",
        }}
        onMouseDown={(e) => onMouseDown(e, event)}
        onDoubleClick={() => onDoubleClick(event)}
      >
        <div
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            color: eventColors.textColor,
            fontWeight: "500",
            fontSize: "11px",
            minWidth: `${eventWidth}px`,
            backgroundColor: eventColors.backgroundColor,
            border: event.timelineInfo?.isTemporary
              ? `2px dashed ${eventColors.borderColor}`
              : `2px solid ${eventColors.borderColor}`,
            boxShadow: isTimelineHighlighted 
              ? `0 4px 12px ${eventColors.backgroundColor}40`
              : "0 2px 6px rgba(0, 0, 0, 0.1)",
            lineHeight: "1.2",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            transform: isTimelineHighlighted ? "scale(1.05)" : "scale(1)",
          }}
        >
          {truncatedTitle}
        </div>
      </div>
    </>
  );
};