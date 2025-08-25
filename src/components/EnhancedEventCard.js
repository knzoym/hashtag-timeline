// ================================
// src/components/EnhancedEventCard.js - 完全修正版
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
  calculateTextWidth,
  sizeScale = { scale: 1.0, fontSize: 11 }
}) => {
  const truncatedTitle = truncateTitle(event.title);
  const baseWidth = calculateTextWidth?.(truncatedTitle) || 80;
  
  // サイズスケールを適用した幅計算
  const eventWidth = Math.max(
    TIMELINE_CONFIG.EVENT_WIDTH * sizeScale.scale, 
    (baseWidth + 16) * sizeScale.scale
  );

  // 複数年表対応：強調表示の判定
  const belongsToHighlightedTimeline = event.timelineInfos?.some(info => 
    isTimelineHighlighted
  );

  // イベントの色は初期色を保持、年表強調時のみ変更
  let eventColors;
  
  if (belongsToHighlightedTimeline) {
    const primaryTimelineInfo = event.timelineInfos?.[0];
    eventColors = {
      backgroundColor: primaryTimelineInfo?.timelineColor || "#6b7280",
      textColor: "white",
      borderColor: primaryTimelineInfo?.timelineColor || "#6b7280"
    };
  } else if (isHighlighted) {
    eventColors = {
      backgroundColor: "#10b981",
      textColor: "white",
      borderColor: "#10b981"
    };
  } else {
    eventColors = {
      backgroundColor: "#6b7280",
      textColor: "white",
      borderColor: "#6b7280"
    };
  }

  // 境界線スタイル
  const getBorderStyle = () => {
    if (!event.timelineInfos || event.timelineInfos.length <= 1) {
      const isTemporary = event.timelineInfos?.[0]?.isTemporary;
      const borderWidth = Math.max(1, 2 * sizeScale.scale);
      return isTemporary
        ? `${borderWidth}px dashed ${eventColors.borderColor}`
        : `${borderWidth}px solid ${eventColors.borderColor}`;
    }

    const borderWidth = Math.max(2, 4 * sizeScale.scale);
    return `${borderWidth}px solid transparent`;
  };

  // 複数年表インジケーター
  const renderMultiTimelineIndicator = () => {
    if (!event.timelineInfos || event.timelineInfos.length <= 1) {
      return null;
    }

    const dotSize = Math.max(2, 4 * sizeScale.scale);

    return (
      <div
        style={{
          position: 'absolute',
          bottom: '-2px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: `${Math.max(1, 2 * sizeScale.scale)}px`,
          zIndex: 1,
        }}
      >
        {event.timelineInfos.map((info, index) => (
          <div
            key={index}
            style={{
              width: `${dotSize}px`,
              height: `${dotSize}px`,
              backgroundColor: info.timelineColor,
              borderRadius: '50%',
              opacity: belongsToHighlightedTimeline ? 1 : 0.6,
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      {/* 年号表示 */}
      <div
        style={{
          position: "absolute",
          left: event.adjustedPosition.x,
          top: event.adjustedPosition.y + panY - (12 * sizeScale.scale) + "px",
          transform: "translateX(-50%)",
          zIndex: 4,
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <div style={{ 
          fontSize: `${Math.max(8, sizeScale.fontSize - 2)}px`, 
          color: belongsToHighlightedTimeline 
            ? event.timelineInfos?.[0]?.timelineColor 
            : "#999",
          fontWeight: belongsToHighlightedTimeline ? "600" : "normal",
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
          zIndex: belongsToHighlightedTimeline ? 25 : (isHighlighted ? 24 : 23),
          textAlign: "center",
          userSelect: "none",
          transition: "transform 0.1s ease-out", // パン遅延を軽減
        }}
        onMouseDown={(e) => onMouseDown(e, event)}
        onDoubleClick={() => onDoubleClick(event)}
      >
        <div
          style={{
            padding: `${Math.max(4, 8 * sizeScale.scale)}px ${Math.max(6, 12 * sizeScale.scale)}px`,
            borderRadius: `${Math.max(3, 6 * sizeScale.scale)}px`,
            color: eventColors.textColor,
            fontWeight: "500",
            fontSize: `${sizeScale.fontSize}px`,
            minWidth: `${eventWidth}px`,
            backgroundColor: eventColors.backgroundColor,
            border: getBorderStyle(),
            backgroundImage: event.timelineInfos && event.timelineInfos.length > 1
              ? `linear-gradient(to right, ${event.timelineInfos.map(info => info.timelineColor).join(', ')})`
              : undefined,
            backgroundClip: event.timelineInfos && event.timelineInfos.length > 1
              ? 'padding-box'
              : undefined,
            boxShadow: belongsToHighlightedTimeline 
              ? `0 ${Math.max(2, 4 * sizeScale.scale)}px ${Math.max(6, 12 * sizeScale.scale)}px ${eventColors.backgroundColor}40`
              : `0 ${Math.max(1, 2 * sizeScale.scale)}px ${Math.max(3, 6 * sizeScale.scale)}px rgba(0, 0, 0, 0.1)`,
            lineHeight: "1.2",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            transform: belongsToHighlightedTimeline ? "scale(1.05)" : "scale(1)",
            position: 'relative',
          }}
        >
          {truncatedTitle}
          {renderMultiTimelineIndicator()}
        </div>
      </div>
    </>
  );
};