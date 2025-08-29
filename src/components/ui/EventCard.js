// components/ui/EventCard.js - パフォーマンス改善・小型化版
import React from "react";
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
    // hsl(240, 70%, 50%) のような形式をパース
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

  return "#000000"; // デフォルトは黒
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
  style = {},
  className = "",
  calculateTextWidth = null,
  ...props
}) => {
  // 統一されたイベント表示情報を取得
  const displayInfo = getEventDisplayInfo(event, calculateTextWidth);

  // 年表情報に基づく色設定
  const getEventColors = () => {
    if (event.timelineInfo) {
      // 年表に属するイベント：年表色の背景＋適切なテキスト色
      const backgroundColor = event.timelineInfo.timelineColor;
      const textColor = getContrastColor(backgroundColor);
      const borderColor = darkenColor(backgroundColor, 20);

      return {
        backgroundColor,
        color: textColor,
        borderColor,
      };
    } else if (isHighlighted) {
      // ハイライト時
      return {
        backgroundColor: "#3b82f6",
        color: "#ffffff",
        borderColor: "#1d4ed8",
      };
    } else {
      // デフォルト（メインタイムライン）
      return {
        backgroundColor: "#6b7280",
        color: "#ffffff",
        borderColor: "#4b5563",
      };
    }
  };

  const colors = getEventColors();

  // パフォーマンス改善：positionプロップを使わず、styleでleftとtopを受け取る
  const cardStyles = {
    position: "absolute",
    // 小型化されたサイズ設定
    minWidth: `${TIMELINE_CONFIG.EVENT_MIN_WIDTH}px`,
    maxWidth: `${TIMELINE_CONFIG.EVENT_MAX_WIDTH}px`,
    width: `${displayInfo.width}px`,
    height: `${displayInfo.height}px`,
    backgroundColor: colors.backgroundColor,
    color: colors.color,
    border: `1px solid ${colors.borderColor}`, // 2px → 1px（小型化）
    borderRadius: "6px", // 8px → 6px（小型化）
    padding: "3px 6px", // 4px 8px → 3px 6px（小型化）
    fontSize: "10px", // 11px → 10px（小型化）
    fontWeight: "500",
    cursor: "pointer",
    userSelect: "none",
    boxShadow: isHighlighted
      ? "0 3px 8px rgba(59, 130, 246, 0.4)"
      : "0 1px 3px rgba(0, 0, 0, 0.1)",
    // パフォーマンス重要：transitionを削除（パン・ズーム遅延の原因）
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    lineHeight: "1.2",
    overflow: "hidden",
    zIndex: isHighlighted ? 20 : 10,
    // GPU加速を有効にしてパフォーマンス向上
    willChange: "transform",
    backfaceVisibility: "hidden",
    ...style,
  };

  // ホバー効果（軽量化）
  const handleMouseEnter = (e) => {
    // 軽量なホバー効果（transformのみ）
    e.target.style.transform = "scale(1.05)";
    e.target.style.zIndex = "25";
  };

  const handleMouseLeave = (e) => {
    e.target.style.transform = "scale(1)";
    e.target.style.zIndex = isHighlighted ? "20" : "10";
  };

  return (
    <div>
      {/* 年号（小型化） */}
      <div
        style={{
          fontSize: "8px", // 9px → 8px（小型化）
          opacity: 0.9,
          marginTop: "1px",
        }}
      >
        {displayInfo.year}
      </div>
      <div
        style={cardStyles}
        className={className}
        onDoubleClick={onDoubleClick}
        onMouseDown={onMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-event-id={event.id}
        title={`${displayInfo.title} (${displayInfo.year})`}
        {...props}
      >
        {/* イベントタイトル（小型化） */}
        <div
          style={{
            fontSize: "9px", // 10px → 9px（小型化）
            fontWeight: "600",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "100%",
          }}
        >
          {displayInfo.title}
        </div>

        {/* 年表所属インジケーター（小型化） */}
        {displayInfo.hasTimelineInfo && (
          <div
            style={{
              position: "absolute",
              top: "-1px",
              right: "-1px",
              width: "6px", // 8px → 6px（小型化）
              height: "6px",
              backgroundColor: colors.borderColor,
              borderRadius: "50%",
              border: "1px solid white",
            }}
          />
        )}

        {/* 延長線が必要な場合のインジケーター（小型化） */}
        {displayInfo.needsExtensionLine && (
          <div
            style={{
              position: "absolute",
              bottom: "-1px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "10px", // 12px → 10px（小型化）
              height: "1px", // 2px → 1px（小型化）
              backgroundColor: colors.borderColor,
              opacity: 0.7,
            }}
          />
        )}
      </div>
    </div>
  );
};
