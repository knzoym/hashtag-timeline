// src/components/views/NetworkView.js - ネットワーク表示専用ビュー
import React, { useState, useCallback, useMemo } from "react";
import { EventCard } from "../ui/EventCard";
import { TimelineConnections } from "../ui/TimelineConnections";

export const NetworkView = ({
  // データ
  events = [],
  timelines = [],

  // 座標・表示制御
  panY,
  getXFromYear,
  calculateTextWidth,

  // イベント処理
  onEventClick,
  onTimelineClick,
  onTimelineDoubleClick, // 年表ダブルクリック専用
  handleEventDoubleClick,
  handleEventDragStart,

  // 表示状態
  highlightedEvents = [],

  // ドラッグ状態
  dragState,
}) => {
  // 年表線の状態管理
  const [hoveredTimelineId, setHoveredTimelineId] = useState(null);
  const [selectedTimelineId, setSelectedTimelineId] = useState(null);
  const [priorityTimelineIds, setPriorityTimelineIds] = useState([]); // クリックした年表の優先順位

  // NetworkView.js の adjustEventPositions 関数を改善
  const adjustEventPositions = useCallback(
    (events, timelines) => {
      const baseY = window.innerHeight * 0.25;
      const maxGroupHeight = 160; // 年表グループの最大高さを縮小
      const eventSpacing = 40; // イベント間隔をさらに縮小
      const timelineGroupSpacing = 30; // 年表グループ間隔を拡大

      // 年表の処理順序を決定（優先度付き）
      const sortedTimelines = [...timelines].sort((a, b) => {
        const aPriority = priorityTimelineIds.indexOf(a.id);
        const bPriority = priorityTimelineIds.indexOf(b.id);

        if (aPriority !== -1 && bPriority !== -1) {
          return aPriority - bPriority;
        }
        if (aPriority !== -1) return -1;
        if (bPriority !== -1) return 1;

        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });

      const positionedEvents = [];
      let currentGroupStartY = baseY;
      const usedPositions = new Map();

      // 各イベントがどの年表に属するかを事前に計算
      const eventToTimelines = new Map();
      events.forEach((event) => {
        const belongingTimelines = timelines.filter(
          (timeline) =>
            timeline.eventIds?.includes(event.id) ||
            timeline.pendingEventIds?.includes(event.id) ||
            timeline.removedEventIds?.includes(event.id)
        );
        eventToTimelines.set(event.id, belongingTimelines);
      });

      // 年表ごとにイベントを配置
      sortedTimelines.forEach((timeline, timelineIndex) => {
        const timelineEvents = events.filter(
          (event) =>
            timeline.eventIds?.includes(event.id) ||
            timeline.pendingEventIds?.includes(event.id) ||
            timeline.removedEventIds?.includes(event.id)
        );

        if (timelineEvents.length === 0) return;

        // 年月日順にソート
        const sortedTimelineEvents = [...timelineEvents].sort((a, b) => {
          const aTime = a.startDate ? a.startDate.getTime() : 0;
          const bTime = b.startDate ? b.startDate.getTime() : 0;
          return aTime - bTime;
        });

        // 年表グループの開始位置設定（前のグループとの間隔を確保）
        if (timelineIndex > 0) {
          currentGroupStartY += timelineGroupSpacing;
        }

        // 改善された配置システム：中央基準の上下交互配置
        const maxEventsInHeight = Math.floor(maxGroupHeight / eventSpacing);
        const newEvents = sortedTimelineEvents.filter(
          (event) => !usedPositions.has(event.id)
        );
        const totalNewEvents = newEvents.length;

        // グループの中央位置を計算
        let groupCenterY = currentGroupStartY + maxGroupHeight / 2;
        let eventIndex = 0;

        sortedTimelineEvents.forEach((event) => {
          if (usedPositions.has(event.id)) {
            // 既に配置済み - 位置は変更しない
            const existingPos = usedPositions.get(event.id);
            existingPos.belongingTimelines =
              eventToTimelines.get(event.id) || [];
            return;
          }

          // 新規配置：改善された中央基準の配置システム
          let eventY;

          if (totalNewEvents <= 4) {
            // 少数の場合：中央基準の上下配置
            if (eventIndex === 0) {
              eventY = groupCenterY;
            } else if (eventIndex % 2 === 1) {
              eventY = groupCenterY - Math.ceil(eventIndex / 2) * eventSpacing;
            } else {
              eventY = groupCenterY + (eventIndex / 2) * eventSpacing;
            }
          } else if (totalNewEvents <= maxEventsInHeight) {
            // 中程度の場合：より密に配置
            const startY =
              groupCenterY - ((totalNewEvents - 1) * eventSpacing) / 2;
            eventY = startY + eventIndex * eventSpacing;
          } else {
            // 多数の場合：コンパクトな螺旋状配置
            const spiralRadius = 60;
            const angle = (eventIndex * 2.5 * Math.PI) / 8; // 8つおきに1周
            const radiusMultiplier = Math.floor(eventIndex / 8) * 0.3;
            const currentRadius = spiralRadius * (1 + radiusMultiplier);

            eventY = groupCenterY + Math.sin(angle) * currentRadius * 0.6; // 縦方向の圧縮
          }

          const eventX = getXFromYear(event.startDate?.getFullYear() || 2024);
          const position = {
            ...event,
            position: { x: eventX, y: eventY },
            belongingTimelines: eventToTimelines.get(event.id) || [],
            calculatedWidth: calculateTextWidth
              ? calculateTextWidth(event.title || "")
              : 80,
            calculatedHeight: 32,
          };

          positionedEvents.push(position);
          usedPositions.set(event.id, position);
          eventIndex++;
        });

        // 次の年表グループの開始位置を更新
        const actualGroupHeight = Math.min(
          maxGroupHeight,
          Math.max(60, totalNewEvents * eventSpacing * 0.8)
        );
        currentGroupStartY += actualGroupHeight;
      });

      // どの年表にも属さないイベント（孤立イベント）を最後に配置
      const orphanEvents = events.filter(
        (event) => !usedPositions.has(event.id)
      );
      if (orphanEvents.length > 0) {
        currentGroupStartY += timelineGroupSpacing;

        orphanEvents.forEach((event, index) => {
          const eventX = getXFromYear(event.startDate?.getFullYear() || 2024);
          // 孤立イベントも横方向に散らして配置
          const eventY = currentGroupStartY + (index % 3) * eventSpacing;

          const position = {
            ...event,
            position: { x: eventX, y: eventY },
            belongingTimelines: [],
            calculatedWidth: calculateTextWidth
              ? calculateTextWidth(event.title || "")
              : 80,
            calculatedHeight: 32,
          };

          positionedEvents.push(position);
          usedPositions.set(event.id, position);
        });
      }

      return positionedEvents;
    },
    [getXFromYear, calculateTextWidth, priorityTimelineIds]
  );

  // ネットワーク用イベント配置計算
  const networkEvents = useMemo(() => {
    if (!events || !getXFromYear) return [];
    return adjustEventPositions(events, timelines);
  }, [events, timelines, getXFromYear, adjustEventPositions]);

  // 年表線の表示状態を決定
  const getConnectionDisplayState = useCallback(
    (timelineId) => {
      if (selectedTimelineId === timelineId) {
        return "selected";
      }
      if (hoveredTimelineId === timelineId) {
        return "hovered";
      }
      if (selectedTimelineId && selectedTimelineId !== timelineId) {
        return "dimmed";
      }
      return "default";
    },
    [hoveredTimelineId, selectedTimelineId]
  );

  // 年表線データ生成（複数年表対応）
  const timelineConnections = useMemo(() => {
    const connections = [];

    timelines.forEach((timeline) => {
      const timelineEvents = networkEvents.filter((event) =>
        event.belongingTimelines?.some((t) => t.id === timeline.id)
      );

      if (timelineEvents.length < 2) return;

      const sortedEvents = [...timelineEvents].sort((a, b) => {
        const aTime = a.startDate ? a.startDate.getTime() : 0;
        const bTime = b.startDate ? b.startDate.getTime() : 0;
        return aTime - bTime;
      });

      // 隣接するイベント同士を線で接続
      for (let i = 0; i < sortedEvents.length - 1; i++) {
        const currentEvent = sortedEvents[i];
        const nextEvent = sortedEvents[i + 1];

        connections.push({
          timelineId: timeline.id,
          timelineName: timeline.name,
          timelineColor: timeline.color || "#6b7280",
          startPoint: {
            x: currentEvent.position.x,
            y: currentEvent.position.y,
          },
          endPoint: {
            x: nextEvent.position.x,
            y: nextEvent.position.y,
          },
          displayState: getConnectionDisplayState(timeline.id),
        });
      }
    });

    return connections;
  }, [networkEvents, timelines, getConnectionDisplayState]);

  // 年表線のクリックハンドラー
  const handleTimelineConnectionClick = useCallback(
    (timelineId) => {
      console.log("年表線クリック:", timelineId);

      if (selectedTimelineId === timelineId) {
        // 既に選択済みなら解除
        setSelectedTimelineId(null);
      } else {
        // 新しい年表を選択（排他的）
        setSelectedTimelineId(timelineId);

        // 優先度を最高に設定（配列の先頭に移動）
        setPriorityTimelineIds((prev) => {
          const filtered = prev.filter((id) => id !== timelineId);
          return [timelineId, ...filtered];
        });
      }

      // 外部のonTimelineClickも呼び出し
      if (onTimelineClick) {
        onTimelineClick(timelineId);
      }
    },
    [selectedTimelineId, onTimelineClick]
  );

  // 年表線のダブルクリックハンドラー
  const handleTimelineConnectionDoubleClick = useCallback(
    (timelineId) => {
      console.log("年表線ダブルクリック:", timelineId);
      const timeline = timelines.find((t) => t.id === timelineId);
      if (timeline && onTimelineClick) {
        onTimelineClick(timeline); // 年表モーダルを開く
      }
    },
    [timelines, onTimelineClick]
  );

  // 年表線のホバーハンドラー
  const handleTimelineHover = useCallback((timelineId) => {
    setHoveredTimelineId(timelineId);
  }, []);

  // イベントの強調表示判定
  const isEventHighlighted = useCallback(
    (event) => {
      // highlightedEventsの型を統一的にチェック
      let basicHighlight = false;

      if (!highlightedEvents) {
        basicHighlight = false;
      } else if (highlightedEvents.has) {
        // Set型の場合
        basicHighlight = highlightedEvents.has(event.id);
      } else if (Array.isArray(highlightedEvents)) {
        // 配列の場合
        basicHighlight = highlightedEvents.some((e) => e.id === event.id);
      } else {
        // その他の場合は文字列比較を試行
        basicHighlight =
          highlightedEvents.includes && highlightedEvents.includes(event.id);
      }

      // 選択された年表に関連するイベントもハイライト
      if (selectedTimelineId) {
        const isConnected = event.timelineId === selectedTimelineId;
        return basicHighlight || isConnected;
      }

      return basicHighlight;
    },
    [highlightedEvents, selectedTimelineId]
  );

  return (
    <>
      {/* 年表接続線 */}
      <TimelineConnections
        connections={timelineConnections}
        panY={panY}
        onTimelineHover={handleTimelineHover}
        onTimelineClick={handleTimelineConnectionClick} // 位置調整のみ
        onTimelineDoubleClick={handleTimelineConnectionDoubleClick} // モーダル表示
      />

      {/* イベントカード */}
      {networkEvents.map((event) => {
        const isHighlighted = isEventHighlighted(event);
        const isDragging = dragState?.draggedEvent?.id === event.id;

        return (
          <div
            key={event.id}
            style={{
              position: "absolute",
              left: `${event.position.x - event.calculatedWidth / 2}px`,
              top: `${event.position.y + panY}px`,
              zIndex: isDragging ? 1000 : 10,
            }}
          >
            <EventCard
              event={event}
              isHighlighted={isHighlighted}
              onDoubleClick={() => handleEventDoubleClick?.(event)}
              onDragStart={handleEventDragStart}
              isDragging={isDragging}
              calculateTextWidth={calculateTextWidth}
              style={{
                transform: isDragging
                  ? `translate(${
                      dragState.currentPosition.x - dragState.startPosition.x
                    }px, ${
                      dragState.currentPosition.y - dragState.startPosition.y
                    }px)`
                  : "none",
                opacity: isDragging ? 0.8 : 1,
              }}
            />
          </div>
        );
      })}
    </>
  );
};
