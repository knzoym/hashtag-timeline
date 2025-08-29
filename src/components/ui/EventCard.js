// components/ui/EventCard.js - 修正版
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
  onDragStart, // 統合ドラッグ開始ハンドラー
  onEventUpdate, // イベント更新関数を直接受け取る
  timelineAxes = [], // 年表軸データを受け取る
  isDragging = false, // ドラッグ状態
  style = {},
  className = "",
  calculateTextWidth = null,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isInternalDragging, setIsInternalDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const longPressTimer = useRef(null);
  const pressStartPos = useRef({ x: 0, y: 0 });

  // 統一されたイベント表示情報を取得
  const displayInfo = getEventDisplayInfo(event, calculateTextWidth);

  // 仮登録・仮削除状態の判定
  const getTemporaryStatus = () => {
    if (!event.timelineInfos || event.timelineInfos.length === 0) {
      return null; // メインタイムライン
    }

    const tempInfo = event.timelineInfos.find((info) => info.isTemporary);
    return tempInfo ? "temporary" : "registered";
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

    // ホバー時の色調整
    if (isHovered && !isInternalDragging) {
      // ホバー時は少し明るくする
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

    // 仮登録・仮削除状態での色調整
    let backgroundColor = baseBackgroundColor;
    let opacity = 1;

    if (temporaryStatus === "temporary") {
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

  // 300ms長押し後の直接ドラッグ処理
  const handleMouseDownInternal = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      const startPos = {
        x: e.clientX,
        y: e.clientY,
      };

      pressStartPos.current = startPos;
      setIsPressed(true);

      console.log(`EventCard: マウスダウン開始 "${event.title}"`);

      // 通常のonMouseDownも呼び出し
      if (onMouseDown) {
        onMouseDown(e);
      }

      // 300ms長押しタイマー開始
      longPressTimer.current = setTimeout(() => {
        console.log(`EventCard: 300ms長押し完了、ドラッグ開始 "${event.title}"`);

        // ドラッグ状態開始
        setIsInternalDragging(true);
        setIsPressed(false);
        document.body.style.cursor = "grabbing";

        // 元の位置を保存
        const originalStyle = e.target.style.cssText;
        let currentY = startPos.y;

        // ドラッグ中のマウス移動監視
        const handleDragMove = (moveEvent) => {
          // 縦方向のみの移動制限
          const verticalDelta = moveEvent.clientY - startPos.y;
          currentY = startPos.y + verticalDelta;
          
          // イベントカードを実際に移動させる
          const eventElement = e.target.closest('[data-event-id]');
          if (eventElement) {
            const currentTop = parseInt(eventElement.style.top) || 0;
            const newTop = currentTop + verticalDelta;
            eventElement.style.top = `${newTop}px`;
            eventElement.style.zIndex = "999"; // 最前面に表示
            eventElement.style.pointerEvents = "none"; // ドラッグ中はイベントを無効化
          }
          
          // 次回の差分計算のため開始位置を更新
          startPos.y = moveEvent.clientY;

          if (Math.abs(verticalDelta) > 5) {
            console.log(`ドラッグ中: 縦移動量=${verticalDelta.toFixed(0)}px, 現在Y=${currentY.toFixed(0)}`);
          }
        };

        // ドラッグ終了処理
        const handleDragEnd = (upEvent) => {
          console.log(`EventCard: ドラッグ終了 "${event.title}"`);

          const dropY = upEvent.clientY;
          let targetTimeline = null;

          // 年表軸との判定
          if (timelineAxes && timelineAxes.length > 0) {
            targetTimeline = timelineAxes.find((axis) => {
              const headerHeight = 64;
              const adjustedAxisY = axis.yPosition + headerHeight;
              const axisRect = {
                top: adjustedAxisY - 40,
                bottom: adjustedAxisY + 40,
              };

              const isInRange = dropY >= axisRect.top && dropY <= axisRect.bottom;
              console.log(
                `年表判定 "${axis.name}": 軸Y=${adjustedAxisY}, 範囲=${axisRect.top}-${axisRect.bottom}, ドロップY=${dropY}, 判定=${isInRange}`
              );
              return isInRange;
            });
          }

          // イベント更新処理
          if (onEventUpdate) {
            const updatedTimelineInfos = [...(event.timelineInfos || [])];

            if (targetTimeline) {
              // 年表に仮登録
              console.log(
                `仮登録実行: "${event.title}" を年表 "${targetTimeline.name}" に仮登録`
              );

              const existingIndex = updatedTimelineInfos.findIndex(
                (info) => info.timelineId === targetTimeline.id
              );

              if (existingIndex >= 0) {
                // 既存関連を正式登録に変更
                updatedTimelineInfos[existingIndex] = {
                  ...updatedTimelineInfos[existingIndex],
                  isTemporary: false,
                };
              } else {
                // 新規登録
                updatedTimelineInfos.push({
                  timelineId: targetTimeline.id,
                  isTemporary: false,
                });
              }

              const updatedEvent = {
                ...event,
                timelineInfos: updatedTimelineInfos,
              };
              onEventUpdate(updatedEvent);
            } else {
              // 年表外へのドロップ - 仮削除処理
              if (updatedTimelineInfos.length > 0) {
                console.log(`仮削除実行: "${event.title}" を仮削除状態に変更`);

                const updatedEvent = {
                  ...event,
                  timelineInfos: updatedTimelineInfos.map((info) => ({
                    ...info,
                    isTemporary: true,
                  })),
                };
                onEventUpdate(updatedEvent);
              }
            }
          }

          // イベントカードのスタイルをリセット
          const eventElement = e.target.closest('[data-event-id]');
          if (eventElement) {
            eventElement.style.cssText = originalStyle;
            eventElement.style.pointerEvents = "auto";
          }

          // クリーンアップ
          setIsInternalDragging(false);
          document.body.style.cursor = "default";
          document.removeEventListener("mousemove", handleDragMove);
          document.removeEventListener("mouseup", handleDragEnd);
        };

        // イベントリスナー追加
        document.addEventListener("mousemove", handleDragMove);
        document.addEventListener("mouseup", handleDragEnd);
      }, 300); // 300msで長押し判定

      // 早期移動検出（5px閾値）
      const handleEarlyMove = (moveEvent) => {
        const deltaX = Math.abs(moveEvent.clientX - startPos.x);
        const deltaY = Math.abs(moveEvent.clientY - startPos.y);

        if (deltaX > 5 || deltaY > 5) {
          // 移動が検出されたら長押しをキャンセル
          console.log("EventCard: 早期移動検出で長押しキャンセル");
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
    },
    [onMouseDown, event, timelineAxes, onEventUpdate]
  );

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
      border:
        temporaryStatus === "temporary"
          ? `2px dashed ${colors.borderColor}` // 仮削除は破線
          : `1px solid ${colors.borderColor}`,
      borderRadius: "6px",
      padding: "3px 6px",
      fontSize: "10px",
      fontWeight: "500",
      cursor: isDragging || isInternalDragging ? "grabbing" : "pointer",
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
      zIndex: isDragging || isInternalDragging ? 30 : isHighlighted ? 20 : 10,
      opacity: colors.opacity,
      willChange: "transform",
      backfaceVisibility: "hidden",
      // スケール効果は削除し、色の変化のみでホバーを表現
      ...style,
    };

    return baseStyles;
  };

  // ホバー効果（色の変化のみ、サイズ変更なし）
  const handleMouseEnter = useCallback(() => {
    if (!isDragging && !isInternalDragging) {
      setIsHovered(true);
    }
  }, [isDragging, isInternalDragging]);

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

        {/* 仮登録・仮削除インジケーター */}
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
        {(isDragging || isInternalDragging) && (
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