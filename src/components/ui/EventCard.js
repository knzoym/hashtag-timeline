// components/ui/EventCard.js - 既存システム協調版
import React, { useState, useRef, useCallback } from "react";
import { TIMELINE_CONFIG } from "../../constants/timelineConfig";
import {
  calculateEventWidth,
  calculateEventHeight,
  getEventDisplayInfo,
} from "../../utils/eventSizeUtils";

/**
 * 色の明度を計算して、適切なテキスト色を決定
 */
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

export const EventCard = ({
  event,
  isHighlighted = false,
  onDoubleClick,
  onMouseDown,
  onDragStart, // 既存のドラッグ開始ハンドラー
  isDragging = false, // 既存のドラッグ状態
  style = {},
  className = "",
  calculateTextWidth = null,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const longPressTimer = useRef(null);

  const displayInfo = getEventDisplayInfo(event, calculateTextWidth);

  // 仮登録・仮削除状態の判定
  const getTemporaryStatus = () => {
    if (!event.timelineInfos || event.timelineInfos.length === 0) {
      return null; // メインタイムライン
    }

    const allTemporary = event.timelineInfos.every(info => info.isTemporary);
    const hasTemporary = event.timelineInfos.some(info => info.isTemporary);
    
    if (allTemporary && event.timelineInfos.length > 0) {
      return 'temporary'; // 全て仮削除
    } else if (hasTemporary) {
      return 'partial'; // 一部仮削除
    } else {
      return 'registered'; // 全て正式登録
    }
  };

  const temporaryStatus = getTemporaryStatus();

  // 300ms長押し処理（既存システム用）
  const handleMouseDownInternal = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    const startPos = { x: e.clientX, y: e.clientY };
    setIsPressed(true);

    // 通常のonMouseDownも呼び出し
    if (onMouseDown) {
      onMouseDown(e);
    }

    // 300ms長押しタイマー
    longPressTimer.current = setTimeout(() => {
      console.log(`EventCard: 300ms長押し完了でドラッグ開始: ${event.title}`);
      
      if (onDragStart) {
        // 既存のドラッグシステム用のデータ形式で呼び出し
        const dragData = {
          ...event,
          startPosition: startPos,
          type: 'event'
        };
        onDragStart(e, 'event', dragData);
      }
      setIsPressed(false);
    }, 300); // 300msで長押し判定

    // 早期移動検出
    const handleEarlyMove = (moveEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - startPos.x);
      const deltaY = Math.abs(moveEvent.clientY - startPos.y);

      if (deltaX > 5 || deltaY > 5) {
        clearTimeout(longPressTimer.current);
        setIsPressed(false);
        document.removeEventListener("mousemove", handleEarlyMove);
      }
    };

    // 早期リリース検出
    const handleEarlyUp = () => {
      clearTimeout(longPressTimer.current);
      setIsPressed(false);
      document.removeEventListener("mousemove", handleEarlyMove);
      document.removeEventListener("mouseup", handleEarlyUp);
    };

    document.addEventListener("mousemove", handleEarlyMove);
    document.addEventListener("mouseup", handleEarlyUp);
  }, [onMouseDown, onDragStart, event]);

  // 色設定
  const getEventColors = () => {
    let baseBackgroundColor = "#6b7280";
    
    if (event.timelineInfo) {
      baseBackgroundColor = event.timelineInfo.timelineColor;
    } else if (isHighlighted) {
      baseBackgroundColor = "#3b82f6";
    }

    // ホバー時の色調整
    if (isHovered && !isDragging) {
      if (baseBackgroundColor.startsWith("hsl")) {
        const match = baseBackgroundColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (match) {
          const h = match[1];
          const s = match[2];
          const l = Math.min(100, parseInt(match[3]) + 10);
          baseBackgroundColor = `hsl(${h}, ${s}%, ${l}%)`;
        }
      }
    }

    let backgroundColor = baseBackgroundColor;
    let opacity = 1;
    
    if (temporaryStatus === 'temporary') {
      opacity = 0.5;
      backgroundColor = darkenColor(baseBackgroundColor, 30);
    } else if (temporaryStatus === 'partial') {
      opacity = 0.8;
      backgroundColor = darkenColor(baseBackgroundColor, 15);
    }

    return {
      backgroundColor,
      color: getContrastColor(backgroundColor),
      borderColor: darkenColor(backgroundColor, 20),
      opacity,
    };
  };

  const colors = getEventColors();

  // スタイル計算
  const getCardStyles = () => {
    const baseStyles = {
      position: "absolute",
      minWidth: `${TIMELINE_CONFIG.EVENT_MIN_WIDTH}px`,
      maxWidth: `${TIMELINE_CONFIG.EVENT_MAX_WIDTH}px`,
      width: `${displayInfo.width}px`,
      height: `${displayInfo.height}px`,
      backgroundColor: colors.backgroundColor,
      color: colors.color,
      border: temporaryStatus === 'temporary' 
        ? `2px dashed ${colors.borderColor}`
        : `1px solid ${colors.borderColor}`,
      borderRadius: "6px",
      padding: "3px 6px",
      fontSize: "10px",
      fontWeight: "500",
      cursor: isDragging ? "grabbing" : "pointer",
      userSelect: "none",
      boxShadow: isHighlighted
        ? "0 3px 8px rgba(59, 130, 246, 0.4)"
        : isPressed
        ? "0 2px 6px rgba(0, 0, 0, 0.3)"
        : "0 1px 3px rgba(0, 0, 0, 0.1)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
      lineHeight: "1.2",
      overflow: "hidden",
      zIndex: isDragging ? 999 : (isHighlighted ? 20 : 10),
      opacity: colors.opacity,
      willChange: "transform",
      ...style,
    };

    return baseStyles;
  };

  // ホバー効果（色の変化のみ）
  const handleMouseEnter = useCallback(() => {
    if (!isDragging) {
      setIsHovered(true);
    }
  }, [isDragging]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  return (
    <div>
      <div
        style={getCardStyles()}
        className={className}
        onDoubleClick={onDoubleClick}
        onMouseDown={handleMouseDownInternal}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-event-id={event.id}
        title={`${displayInfo.title} (${displayInfo.year})${
          temporaryStatus === "temporary" ? " - 仮削除" : ""
        }`}
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

        {/* 仮削除インジケーター */}
        {temporaryStatus === "temporary" && (
          <div
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              width: "8px",
              height: "8px",
              backgroundColor: "#f59e0b",
              borderRadius: "50%",
              border: "1px solid white",
            }}
            title="仮削除状態"
          />
        )}
        
        {temporaryStatus === "partial" && (
          <div
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              width: "8px",
              height: "8px",
              backgroundColor: "#f97316",
              borderRadius: "50%",
              border: "1px solid white",
            }}
            title="一部仮削除状態"
          />
        )}

        {/* 年表所属インジケーター */}
        {displayInfo.hasTimelineInfo && temporaryStatus !== "temporary" && (
          <div
            style={{
              position: "absolute",
              top: "-1px",
              right: "-1px",
              width: "6px",
              height: "6px",
              backgroundColor: colors.borderColor,
              borderRadius: "50%",
              border: "1px solid white",
            }}
          />
        )}

        {/* 長押し中インジケーター */}
        {isPressed && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: "6px",
              pointerEvents: "none",
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
            }}
          />
        )}
      </div>
    </div>
  );
};