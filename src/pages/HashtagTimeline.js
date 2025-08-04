// HashtagTimeline.js (修正版)
import React, { useRef, useCallback } from "react";
import { EventModal } from "../components/EventModal";
import { SearchPanel } from "../components/SearchPanel";
import { HelpBox } from "../components/HelpBox";
import { useTimelineLogic } from "../hooks/useTimelineLogic";
import { createTimelineStyles } from "../styles/timelineStyles";

const HashtagTimeline = () => {
  // メインの状態管理
  const timelineRef = useRef(null);
  const isDragging = useRef(false);
  const isCardDragging = useRef(false);
  const lastMouseX = useRef(0);
  const lastMouseY = useRef(0);
  const isShiftPressed = useRef(false);

  // カスタムフックから必要な状態と関数を取得
  const {
    // 状態
    scale, panX, panY, timelineCardY, searchTerm, highlightedEvents,
    isHelpOpen, isModalOpen, modalPosition, editingEvent, newEvent,
    currentPixelsPerYear,
    
    // 関数
    setIsHelpOpen, resetToInitialPosition, handleSearchChange, handleDoubleClick,
    saveEvent, closeModal, addManualTag, removeManualTag, getAllCurrentTags,
    createTimeline, adjustEventPositions, getTopTagsFromSearch,
    truncateTitle, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp,
    handleCardMouseDown, handleEventChange,
    
    createdTimelines,
    toggleTimelineVisibility,
    deleteTimeline,
    getTimelineEventsForDisplay,
    getTimelineAxesForDisplay,
  } = useTimelineLogic(timelineRef, isDragging, isCardDragging, lastMouseX, lastMouseY, isShiftPressed);

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
      const x = (year - (-5000)) * currentPixelsPerYear + panX;
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

  const styles = createTimelineStyles(isDragging.current, timelineCardY);

  return (
    <div style={styles.app}>
      {/* ヘッダー */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
          <button style={styles.addButton}>+ イベントを追加</button>
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

        {/* 修正された検索パネル */}
        <SearchPanel
          searchTerm={searchTerm}
          highlightedEvents={highlightedEvents}
          timelines={createdTimelines}
          onSearchChange={handleSearchChange}
          onCreateTimeline={createTimeline}
          onToggleTimeline={toggleTimelineVisibility}
          onDeleteTimeline={deleteTimeline}
          getTopTagsFromSearch={getTopTagsFromSearch}
          styles={styles}
        />

        {/* ドラッグ可能な年表カード */}
        <div
          className="timeline-card"
          style={styles.timelineCard}
          onMouseDown={handleCardMouseDown}
        >
          <h4 style={styles.timelineTitle}>ざっくり日本史</h4>
          <div style={styles.tagContainer}>
            <span style={styles.tag}>日本史</span>
            <span style={styles.tag}>歴史</span>
          </div>
        </div>

        {/* イベント表示 */}
        {adjustEventPositions().map((event) => {
          const isHighlighted = highlightedEvents.has(event.id);
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
                zIndex: isHighlighted ? 5 : 1,
                textAlign: "center",
                userSelect: "none",
              }}
            >
              <div style={{ fontSize: "10px", color: "#666", marginBottom: "2px" }}>
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
                  backgroundColor: isHighlighted ? "#10b981" : 
                    event.id === 1 || event.id === 2 ? (event.id === 1 ? "#3b82f6" : "#ef4444") : "#6b7280",
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

        {/* 年表軸線の描画（新規） */}
        {getTimelineAxesForDisplay().map((axis) => (
          <div key={`axis-${axis.id}`}>
            {/* 年表名ラベル */}
            <div
              style={{
                position: "absolute",
                left: Math.max(20, axis.startX - 100),
                top: axis.yPosition - 15,
                fontSize: "12px",
                fontWeight: "600",
                color: axis.color,
                backgroundColor: "rgba(255,255,255,0.9)",
                padding: "2px 6px",
                borderRadius: "3px",
                border: `1px solid ${axis.color}`,
                zIndex: 3
              }}
            >
              {axis.name} ({axis.minYear}年-{axis.maxYear}年)
            </div>
            
            {/* 年表軸線 */}
            <div
              style={{
                position: "absolute",
                left: axis.startX,
                top: axis.yPosition,
                width: axis.endX - axis.startX,
                height: "3px",
                backgroundColor: axis.color,
                opacity: 0.7,
                zIndex: 2
              }}
            />
          </div>
        ))}

        {/* 年表イベントの描画（新規） */}
        {getTimelineEventsForDisplay().map((event) => (
          <div
            key={`timeline-${event.timelineId}-event-${event.id}`}
            style={{
              position: "absolute",
              left: event.displayX,
              top: event.displayY,
              transform: "translateX(-50%)",
              zIndex: 4,
              textAlign: "center",
              userSelect: "none"
            }}
          >
            {/* 接続線 */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "15px",
                width: "2px",
                height: "15px",
                backgroundColor: event.timelineColor,
                transform: "translateX(-50%)",
                zIndex: 1
              }}
            />
            
            {/* イベントカード */}
            <div
              style={{
                padding: "3px 6px",
                borderRadius: "3px",
                color: "white",
                fontWeight: "500",
                fontSize: "10px",
                minWidth: "40px",
                maxWidth: "80px",
                backgroundColor: event.timelineColor,
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
                lineHeight: "1.1",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                border: "1px solid rgba(255,255,255,0.3)"
              }}
              title={`${event.title} (${event.timelineName})`}
            >
              {event.title.length > 8 
                ? event.title.substring(0, 8) + "..."
                : event.title
              }
            </div>
            
            {/* 年表示 */}
            <div
              style={{
                fontSize: "8px",
                color: "#666",
                marginTop: "1px"
              }}
            >
              {event.startDate.getFullYear()}
            </div>
          </div>
        ))}

        {/* 現在ライン */}
        <div
          style={{
            position: "absolute",
            left: (2025.6 - (-5000)) * currentPixelsPerYear + panX,
            top: 0, 
            height: "100%", 
            borderLeft: "1px solid #f6a656ff", 
            pointerEvents: "none",
          }}
        />

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