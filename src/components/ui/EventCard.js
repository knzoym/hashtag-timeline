// components/ui/EventCard.js - 長押しドラッグ・仮登録対応版
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

  // HSL色からRGBに変換（簡易版）
  if (hexColor.startsWith("hsl")) {
    const match = hexColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (match) {
      const l = parseInt(match[3]);
      return l > 50 ? "#000000" : "#ffffff";
    }
  }

  // 16進数カラーの場合
  if (hexColor.startsWith("#")) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#000000" : "#ffffff";
  }

  return "#000000";
}

/**
 * 背景色を少し暗くする
 */
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
  onDragStart, // 新規：ドラッグ開始ハンドラー
  isDragging = false, // 新規：ドラッグ状態
  style = {},
  className = "",
  calculateTextWidth = null,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const longPressTimer = useRef(null);
  const pressStartPos = useRef({ x: 0, y: 0 });

  // 統一されたイベント表示情報を取得
  const displayInfo = getEventDisplayInfo(event, calculateTextWidth);

  // 仮登録・仮削除状態の判定
  const getTemporaryStatus = () => {
    if (!event.timelineInfos || event.timelineInfos.length === 0) {
      return null; // メインタイムライン
    }

    const tempInfo = event.timelineInfos.find(info => info.isTemporary);
    return tempInfo ? 'temporary' : 'registered';
  };

  const temporaryStatus = getTemporaryStatus();

  // 年表情報に基づく色設定（仮登録対応）
  const getEventColors = () => {
    let baseBackgroundColor = "#6b7280"; // デフォルト色
    
    if (event.timelineInfo) {
      baseBackgroundColor = event.timelineInfo.timelineColor;
    } else if (isHighlighted) {
      baseBackgroundColor = "#3b82f6";
    }

    // 仮登録・仮削除状態での色調整
    let backgroundColor = baseBackgroundColor;
    let opacity = 1;
    
    if (temporaryStatus === 'temporary') {
      // 仮削除状態：半透明にして視覚的に区別
      opacity = 0.6;
      backgroundColor = darkenColor(baseBackgroundColor, 20);
    }

    const textColor = getContrastColor(backgroundColor);
    const borderColor = darkenColor(backgroundColor, 20);

    return {
      backgroundColor,
      color: textColor,
      borderColor,
      opacity,
    };
  };

  const colors = getEventColors();

  // 長押し開始
  const handleMouseDownInternal = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    const startPos = {
      x: e.clientX,
      y: e.clientY,
    };

    pressStartPos.current = startPos;
    setIsPressed(true);

    // 通常のonMouseDownも呼び出し
    if (onMouseDown) {
      onMouseDown(e);
    }

    // 長押しタイマー開始
    longPressTimer.current = setTimeout(() => {
      // ドラッグ開始
      if (onDragStart) {
        const dragData = {
          ...event,
          startPosition: startPos,
          type: 'event'
        };
        onDragStart(e, dragData);
      }
      setIsPressed(false);
    }, 500); // 500msで長押し判定

    // 早期移動検出
    const handleEarlyMove = (moveEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - startPos.x);
      const deltaY = Math.abs(moveEvent.clientY - startPos.y);

      if (deltaX > 5 || deltaY > 5) {
        // 移動が検出されたら長押しをキャンセル
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

  // 仮登録状態のスタイル調整
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
        ? `2px dashed ${colors.borderColor}` // 仮削除は破線
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
      zIndex: isDragging ? 30 : (isHighlighted ? 20 : 10),
      opacity: colors.opacity,
      willChange: "transform",
      backfaceVisibility: "hidden",
      ...style,
    };

    return baseStyles;
  };

  // ホバー効果
  const handleMouseEnter = (e) => {
    if (!isDragging) {
      e.target.style.transform = "scale(1.05)";
      e.target.style.zIndex = "25";
    }
  };

  const handleMouseLeave = (e) => {
    if (!isDragging) {
      e.target.style.transform = "scale(1)";
      e.target.style.zIndex = isHighlighted ? "20" : "10";
    }
  };

  return (
    <div>
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

      <div
        style={getCardStyles()}
        className={className}
        onDoubleClick={onDoubleClick}
        onMouseDown={handleMouseDownInternal}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-event-id={event.id}
        title={`${displayInfo.title} (${displayInfo.year})${temporaryStatus === 'temporary' ? ' - 仮削除' : ''}`}
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

        {/* 仮登録・仮削除インジケーター */}
        {temporaryStatus === 'temporary' && (
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

        {/* 年表所属インジケーター */}
        {displayInfo.hasTimelineInfo && temporaryStatus !== 'temporary' && (
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