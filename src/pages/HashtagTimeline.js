// src/pages/HashtagTimeline.js
import React, { useRef, useCallback } from "react";
import { EventModal } from "../components/EventModal";
import { SearchPanel } from "../components/SearchPanel";
import { HelpBox } from "../components/HelpBox";
import { TimelineCard } from "../components/TimelineCard";
import { useTimelineLogic } from "../hooks/useTimelineLogic";
import { createTimelineStyles } from "../styles/timelineStyles";

const HashtagTimeline = () => {
  // メインの状態管理
  const timelineRef = useRef(null);
  const isDragging = useRef(false);
  const lastMouseX = useRef(0);
  const lastMouseY = useRef(0);
  const isShiftPressed = useRef(false);

  // カスタムフックから必要な状態と関数を取得
  const {
    // 状態
    scale,
    panX,
    panY,
    searchTerm,
    highlightedEvents,
    isHelpOpen,
    isModalOpen,
    modalPosition,
    editingEvent,
    newEvent,
    currentPixelsPerYear,
    cardPositions,

    // 関数
    setIsHelpOpen,
    resetToInitialPosition,
    handleSearchChange,
    handleDoubleClick,
    saveEvent,
    closeModal,
    addManualTag,
    removeManualTag,
    getAllCurrentTags,
    createTimeline,
    adjustEventPositions,
    getTopTagsFromSearch,
    truncateTitle,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleEventChange,
    openNewEventModal,

    Timelines,
    deleteTimeline,
    getTimelineEventsForDisplay,
    getTimelineAxesForDisplay,
    setCardPositions,
  } = useTimelineLogic(
    timelineRef,
    isDragging,
    lastMouseX,
    lastMouseY,
    isShiftPressed
  );

  // 年表マーカー生成
  const generateYearMarkers = useCallback(() => {
    const markers = [];
    const adjustedScale = scale / 2.5;
    let yearInterval;

    if (adjustedScale > 12) yearInterval = 1;
    else if (adjustedScale > 6) yearInterval = 2;
    else if (adjustedScale > 2) yearInterval = 5;
    else if (adjustedScale > 0.8) yearInterval = 10;
    else if (adjustedScale > 0.4) yearInterval = 50;
    else if (adjustedScale > 0.2) yearInterval = 100;
    else if (adjustedScale > 0.1) yearInterval = 200;
    else if (adjustedScale > 0.04) yearInterval = 500;
    else yearInterval = 1000;

    for (let year = -5000; year <= 5000; year += yearInterval) {
      const x = (year - -5000) * currentPixelsPerYear + panX;
      if (x > -100 && x < window.innerWidth + 100) {
        markers.push(
          <div
            key={year}
            style={{
              position: "absolute",
              left: x,
              top: 0,
              height: "100%",
              borderLeft: "1px solid #ddd",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: "10px",
                left: "5px",
                fontSize: "12px",
                color: "#666",
                userSelect: "none",
              }}
            >
              {year}
            </span>
            <span
              style={{
                position: "absolute",
                bottom: "10px",
                left: "5px",
                fontSize: "12px",
                color: "#666",
                userSelect: "none",
              }}
            >
              {year}
            </span>
          </div>
        );
      }
    }
    return markers;
  }, [scale, currentPixelsPerYear, panX]);

  const styles = createTimelineStyles(isDragging.current, 0);
  const timelineAxes = getTimelineAxesForDisplay();
  const axesMap = new Map(timelineAxes.map(axis => [axis.id, axis]));

  return (
    <div style={styles.app}>
      {/* ヘッダー */}
      <div style={styles.header}>
        <div style={styles.headerLeft}></div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <h1 style={styles.title}>#ハッシュタグ年表</h1>
        </div>
        <div style={styles.headerRight}>
          <button
            style={styles.resetButton}
            onClick={resetToInitialPosition}
            title="初期位置に戻す"
          >
            🏠 初期位置
          </button>
          <span style={styles.zoomInfo}>
            ズーム: {(scale / 2.5).toFixed(1)}x
          </span>
        </div>
      </div>

      {/* メインタイムライン */}
      <div
        ref={timelineRef}
        style={styles.timeline}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        {/* 年マーカー */}
        {generateYearMarkers()}

        {/* イベントを追加ボタン */}
        <div className="floating-panel">
          <button style={styles.addButton} onClick={openNewEventModal}>+ イベントを追加</button>
        </div>

        {/* 検索パネル */}
        <SearchPanel
          searchTerm={searchTerm}
          highlightedEvents={highlightedEvents}
          onSearchChange={handleSearchChange}
          onCreateTimeline={createTimeline}
          onDeleteTimeline={deleteTimeline}
          getTopTagsFromSearch={getTopTagsFromSearch}
          styles={styles}
        />

        {/* メインタイムラインのイベント表示 */}
        {adjustEventPositions().map((event) => {
          const isHighlighted = highlightedEvents.has(event.id);
          const hasMoved = event.axisY && event.adjustedPosition.y !== event.idealY;

          // イベントが本来の位置からずれている場合、接続線のスタイルを計算
          let lineStyle = {};
          if (hasMoved) {
            const eventTitleCenterY = event.adjustedPosition.y + 22; // titleの中心
            const isAbove = eventTitleCenterY < event.axisY;
            if (isAbove) {
              lineStyle = {
                top: '32px', // イベントの下から
                height: `${event.axisY - (event.adjustedPosition.y + 32)}px`,
              };
            } else {
              lineStyle = {
                bottom: '32px', // イベントの上まで
                height: `${event.adjustedPosition.y - event.axisY}px`,
              };
            }
          }

          return (
            <div
              key={event.id}
              data-event-id={event.id}
              style={{
                position: "absolute",
                left: event.adjustedPosition.x,
                top: event.adjustedPosition.y + panY + "px",
                transform: "translateX(-50%)",
                cursor: "pointer",
                zIndex: isHighlighted ? 5 : 2,
                textAlign: "center",
                userSelect: "none",
              }}
            >
              {/* 年表イベントがずれている場合のみ、軸への接続線を描画 */}
              {hasMoved && (
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    width: "2px",
                    backgroundColor: event.timelineColor,
                    transform: "translateX(-50%)",
                    zIndex: -1,
                    opacity: 0.7,
                    ...lineStyle,
                  }}
                />
              )}

              <div
                style={{ fontSize: "10px", color: "#666", marginBottom: "2px" }}
              >
                {event.startDate.getFullYear()}
              </div>
              <div
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  color: "white",
                  fontWeight: "500",
                  fontSize: "11px",
                  minWidth: "60px",
                  maxWidth: "120px",
                  backgroundColor: isHighlighted
                    ? "#10b981"
                    : event.id === 1 || event.id === 2
                    ? event.id === 1
                      ? "#3b82f6"
                      : "#ef4444"
                    : "#6b7280",
                  border: isHighlighted ? "2px solid #059669" : "none",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  lineHeight: "1.1",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {truncateTitle(event.title)}
              </div>
            </div>
          );
        })}

        {/* 年表カード */}
        {Timelines.map((timeline) => {
          const axis = axesMap.get(timeline.id);
          const xPosition = axis ? axis.startX : 20;
          return (
            <TimelineCard
              key={timeline.id}
              timeline={timeline}
              position={{ x: xPosition, y: cardPositions[timeline.id]?.y || 200 }}
              panY={panY} // Pass panY prop
              onDeleteTimeline={deleteTimeline}
            />
          );
        })}

        {/* 年表軸線の描画 */}
        {timelineAxes.map((axis) => (
          <div key={`axis-${axis.id}`}>
            {/* 年表軸線 */}
            <div
              style={{
                position: "absolute",
                left: axis.startX - 100,
                top: axis.yPosition,
                width: (Math.max(0, axis.endX - axis.startX)) + 100,
                height: "3px",
                backgroundColor: axis.color,
                opacity: 0.8,
                zIndex: 0,
                borderRadius: "1px",
              }}
            />
          </div>
        ))}

        {/* 現在ライン */}
        <div
          style={{
            position: "absolute",
            left: (2025.6 - -5000) * currentPixelsPerYear + panX,
            top: 0,
            height: "100%",
            borderLeft: "2px solid #f59e0b",
            pointerEvents: "none",
            opacity: 0.8,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "5px",
              top: "20px",
              fontSize: "12px",
              color: "#f59e0b",
              backgroundColor: "rgba(255,255,255,0.9)",
              padding: "2px 6px",
              borderRadius: "3px",
              fontWeight: "600",
            }}
          >
            現在 (2025)
          </div>
        </div>

        {/* ヘルプボックス */}
        <HelpBox
          isHelpOpen={isHelpOpen}
          setIsHelpOpen={setIsHelpOpen}
          highlightedEvents={highlightedEvents}
          styles={styles}
        />
      </div>

      {/* モーダル */}
      <EventModal
        isOpen={isModalOpen}
        editingEvent={editingEvent}
        newEvent={newEvent}
        modalPosition={modalPosition}
        onSave={saveEvent}
        onClose={closeModal}
        onAddManualTag={addManualTag}
        onRemoveManualTag={removeManualTag}
        getAllCurrentTags={getAllCurrentTags}
        onEventChange={handleEventChange}
      />
    </div>
  );
};

export default HashtagTimeline;