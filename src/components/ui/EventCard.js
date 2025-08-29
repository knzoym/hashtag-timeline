// components/ui/EventCard.js - 仮状態表示修正版
import React, { useState, useCallback } from "react";
import { TIMELINE_CONFIG } from "../../constants/timelineConfig";
import {
  calculateEventWidth,
  calculateEventHeight,
  getEventDisplayInfo,
} from "../../utils/eventSizeUtils";

function getContrastColor(hexColor) {
  if (!hexColor) return "#000000";

  if (hexColor.startsWith("hsl")) {
    const match = hexColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (match) {
      const l = parseInt(match[3]);
      return l > 50 ? "#000000" : "#ffffff";
    }
  }

  if (hexColor.startsWith("#")) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#000000" : "#ffffff";
  }

  return "#000000";
}

function darkenColor(hslColor, amount = 10) {
  if (!hslColor || !hslColor.startsWith("hsl")) return hslColor;

  const match = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (match) {
    const h = match[1];
    const s = match[2];
    const l = Math.max(0, parseInt(match[3]) - amount);
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  return hslColor;
}

// 年表ベースの状態判定ヘルパー関数
const getEventTimelineStatus = (event, timeline) => {
  if (!timeline || !event) return "none";
  if (timeline.eventIds?.includes(event.id)) return "registered";
  if (timeline.pendingEventIds?.includes(event.id)) return "pending";
  if (timeline.removedEventIds?.includes(event.id)) return "removed";
  return "none";
};

export const EventCard = ({
  event,
  isHighlighted = false,
  onDoubleClick,
  onDragStart,
  isDragging = false,
  style = {},
  className = "",
  calculateTextWidth = null,
  displayTimelines = [], // 年表データ（重要）
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const displayInfo = getEventDisplayInfo(event, calculateTextWidth);

  // 仮状態表示の判定（年表ベース改善版）
  const getDisplayStatus = () => {
    // originalEventがある場合は元のイベントIDを使用
    const eventId = event.originalId || event.id;
    
    // VisualTabから渡される displayStatus を使用（優先）
    if (event.displayStatus) {
      console.log(`EventCard状態判定: ${event.title} - displayStatus: ${event.displayStatus}`);
      return event.displayStatus;
    }

    // 年表データから現在の状態を判定
    if (displayTimelines && displayTimelines.length > 0) {
      for (const timeline of displayTimelines) {
        const status = getEventTimelineStatus({ ...event, id: eventId }, timeline);
        if (status !== "none") {
          console.log(`EventCard状態判定: ${event.title} - 年表「${timeline.name}」で${status}`);
          return status;
        }
      }
    }

    // フォールバック：timelineInfos から判定（従来の方式）
    if (event.timelineInfos && Array.isArray(event.timelineInfos)) {
      for (const info of event.timelineInfos) {
        if (info.isTemporary === true) {
          console.log(`EventCard状態判定: ${event.title} - timelineInfos: removed`);
          return 'removed';
        }
        if (info.isPending === true) {
          console.log(`EventCard状態判定: ${event.title} - timelineInfos: pending`);
          return 'pending';
        }
        if (info.isRegistered === true || !info.isTemporary) {
          console.log(`EventCard状態判定: ${event.title} - timelineInfos: registered`);
          return 'registered';
        }
      }
    }

    console.log(`EventCard状態判定: ${event.title} - デフォルト: main`);
    return 'main'; // メインタイムライン
  };

  // 表示状態に基づく色とスタイル設定（改善版）
  const getStatusStyles = () => {
    const status = getDisplayStatus();
    const baseColor = event.timelineColor || event.timelineInfo?.timelineColor || '#6b7280';
    
    switch (status) {
      case 'registered':
        // 正式登録：通常スタイル（年表色）
        return {
          backgroundColor: baseColor,
          border: `2px solid ${darkenColor(baseColor, 20)}`,
          opacity: 1,
          borderStyle: 'solid'
        };
        
      case 'pending':
        // 仮登録：点線ボーダー（年表色）
        return {
          backgroundColor: baseColor,
          border: `2px dashed ${darkenColor(baseColor, 20)}`,
          opacity: 0.85,
          borderStyle: 'dashed'
        };
        
      case 'removed':
        // 仮削除：点線ボーダー（グレー系）
        return {
          backgroundColor: '#9ca3af',
          border: '2px dashed #6b7280',
          opacity: 0.7,
          borderStyle: 'dashed'
        };
        
      case 'main':
      default:
        // メインタイムライン：一般イベント色
        return {
          backgroundColor: '#6b7280',
          border: '2px solid #9ca3af',
          opacity: 1,
          borderStyle: 'solid'
        };
    }
  };

  const statusStyles = getStatusStyles();
  const textColor = getContrastColor(statusStyles.backgroundColor);

  // ホバー時の色調整
  const colors = {
    backgroundColor: isHovered ? darkenColor(statusStyles.backgroundColor, 10) : statusStyles.backgroundColor,
    borderColor: statusStyles.border,
    textColor: textColor,
  };

  // 基本スタイル
  const cardStyles = {
    position: "relative",
    width: `${displayInfo.width}px`,
    height: `${displayInfo.height}px`,
    backgroundColor: colors.backgroundColor,
    border: statusStyles.border,
    borderRadius: "8px",
    color: colors.textColor,
    cursor: isDragging ? "grabbing" : isHovered ? "grab" : "pointer",
    userSelect: "none",
    overflow: "hidden",
    opacity: statusStyles.opacity,
    transition: "all 0.2s ease",
    transform: isHovered && !isDragging ? "scale(1.02)" : "scale(1)",
    boxShadow: isHovered || isHighlighted
      ? `0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 2px ${isHighlighted ? '#fbbf24' : colors.backgroundColor}`
      : "0 2px 4px rgba(0, 0, 0, 0.1)",
    zIndex: isHovered || isDragging ? 20 : 10,
    ...style
  };

  // ステータス説明を取得
  const getStatusDescription = () => {
    const status = getDisplayStatus();
    switch (status) {
      case 'registered': return ' - 正式登録';
      case 'pending': return ' - 仮登録（点線表示）';
      case 'removed': return ' - 仮削除（点線表示）';
      default: return '';
    }
  };

  return (
    <div
      data-event-id={event.id}
      style={cardStyles}
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onDoubleClick) {
          onDoubleClick(event);
        }
      }}
      onMouseDown={(e) => {
        if (onDragStart) {
          onDragStart(e, event);
        }
      }}
      title={`${event.title} (${displayInfo.year})${getStatusDescription()}`}
      {...props}
    >
      {/* イベントタイトル */}
      <div
        style={{
          fontSize: "9px",
          fontWeight: "600",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "100%",
        }}
      >
        {displayInfo.title}
      </div>

      {/* 年号表示 */}
      <div
        style={{
          fontSize: "8px",
          opacity: 0.9,
          marginTop: "1px",
        }}
      >
        {displayInfo.year}
      </div>

      {/* 年表所属インジケーター（正式登録のみ） */}
      {getDisplayStatus() === 'registered' && displayInfo.hasTimelineInfo && (
        <div
          style={{
            position: "absolute",
            top: "-1px",
            right: "-1px",
            width: "8px",
            height: "8px",
            backgroundColor: colors.backgroundColor,
            borderRadius: "50%",
            border: "2px solid white",
            zIndex: 1
          }}
        />
      )}

      {/* ドラッグ中インジケーター */}
      {isDragging && (
        <div
          style={{
            position: "absolute",
            inset: "-2px",
            border: "2px solid #3b82f6",
            borderRadius: "8px",
            pointerEvents: "none",
            zIndex: 2
          }}
        />
      )}
      
      {/* 仮状態の追加視覚表現 */}
      {(getDisplayStatus() === 'pending' || getDisplayStatus() === 'removed') && (
        <div
          style={{
            position: "absolute",
            inset: "2px",
            border: "1px dashed rgba(255, 255, 255, 0.5)",
            borderRadius: "6px",
            pointerEvents: "none",
            zIndex: 1
          }}
        />
      )}
      
      {/* デバッグ情報（開発時のみ表示） */}
      {process.env.NODE_ENV === 'development' && getDisplayStatus() !== 'main' && (
        <div
          style={{
            position: "absolute",
            bottom: "-15px",
            left: "0",
            fontSize: "8px",
            color: "#666",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            padding: "1px 3px",
            borderRadius: "2px",
            whiteSpace: "nowrap",
            zIndex: 1
          }}
        >
          {getDisplayStatus()}
        </div>
      )}
    </div>
  );
};