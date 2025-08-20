// src/pages/HashtagTimeline.js
import React, { useRef, useCallback } from "react";
import { EventModal } from "../components/EventModal";
import { SearchPanel } from "../components/SearchPanel";
import { HelpBox } from "../components/HelpBox";
import { TimelineCard } from "../components/TimelineCard";
import {
  EventGroupIcon,
  GroupTooltip,
  GroupCard,
} from "../components/EventGroup";
import { useTimelineLogic } from "../hooks/useTimelineLogic";
import { createTimelineStyles } from "../styles/timelineStyles";
import { extractTagsFromDescription } from "../utils/timelineUtils";
import { TIMELINE_CONFIG } from "../constants/timelineConfig";

const HashtagTimeline = () => {
  // メインの状態管理
  const timelineRef = useRef(null);
  const isDragging = useRef(false);
  const lastMouseX = useRef(0);
  const lastMouseY = useRef(0);
  const isShiftPressed = useRef(false);

  // カスタムフックから必要な状態と関数を取得
  const {

    resetKey,

    // 基本状態
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

    // 高度レイアウト関連
    advancedEventPositions,
    expandedGroups,
    hoveredGroup,
    groupManager,

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
    getTopTagsFromSearch,
    truncateTitle,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleEventChange,
    openNewEventModal,
    toggleEventGroup,
    handleGroupHover,

    Timelines,
    deleteTimeline,
    getTimelineAxesForDisplay,
    // ユーティリティ関数
    calculateTextWidth,

    setEditingEvent,
    setNewEvent,
    setModalPosition,
    setIsModalOpen,
    events,
  } = useTimelineLogic(
    timelineRef,
    isDragging,
    lastMouseX,
    lastMouseY,
    isShiftPressed
  );

  // 色の変換ユーティリティ関数
  const parseHslColor = (hslString) => {
    const match = hslString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (match) {
      return {
        h: parseInt(match[1]),
        s: parseInt(match[2]),
        l: parseInt(match[3]),
      };
    }
    return null;
  };

  const createEventColors = (timelineColor) => {
    const hsl = parseHslColor(timelineColor);
    if (!hsl) {
      return {
        backgroundColor: "#f3f4f6",
        textColor: "#374151",
      };
    }

    return {
      backgroundColor: `hsl(${hsl.h}, ${Math.max(20, hsl.s - 30)}%, 95%)`,
      textColor: `hsl(${hsl.h}, ${Math.min(100, hsl.s + 20)}%, 25%)`,
    };
  };

  // グループカードでのイベントダブルクリック処理
  const handleGroupEventDoubleClick = useCallback(
    (event) => {
      setEditingEvent(event);
      setNewEvent({
        title: event.title,
        description: event.description,
        date: event.startDate,
        manualTags: event.tags.filter(
          (tag) =>
            tag !== event.title &&
            !extractTagsFromDescription(event.description).includes(tag)
        ),
      });

      // モーダル位置を画面中央に設定
      setModalPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      setIsModalOpen(true);
    },
    [setEditingEvent, setNewEvent, setModalPosition, setIsModalOpen]
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
  const axesMap = new Map(timelineAxes.map((axis) => [axis.id, axis]));

  // イベント表示の最適化
  const visibleEvents = advancedEventPositions.allEvents
  .filter(event => !event.hiddenByGroup)
  .filter((event, index, array) => 
    array.findIndex(e => e.id === event.id) === index
  ); 

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
        key={`timeline-${resetKey}`} 
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
          <button style={styles.addButton} onClick={openNewEventModal}>
            + イベントを追加
          </button>
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

        {/* 高度レイアウトによるイベント表示 */}
        {/* Part 1: 年号とグループアイコンを描画 (奥のレイヤー) */}
        {visibleEvents.map((event) => {
          // グループの場合
          if (event.isGroup) {
            return (
              <EventGroupIcon
                key={`group-${event.groupData.id}`}
                groupData={event.groupData}
                position={{
                  x: event.adjustedPosition.x,
                  y: event.adjustedPosition.y,
                }}
                panY={panY}
                timelineColor={event.timelineColor || "#6b7280"}
                onHover={handleGroupHover}
                onDoubleClick={handleDoubleClick}
              />
            );
          }

          // 通常イベントの年号
          return (
            <div
              key={`year-${event.id}-${scale}-${panX}-${panY}`}
              style={{
                position: "absolute",
                left: event.adjustedPosition.x,
                top: event.adjustedPosition.y - 4 + panY + "px",
                transform: "translateX(-50%)",
                zIndex: 2,
                textAlign: "center",
                pointerEvents: "none",
              }}
            >
              <div
                style={{ fontSize: "10px", color: "#666", marginBottom: "2px" }}
              >
                {event.startDate.getFullYear()}
              </div>
            </div>
          );
        })}

        {/* Part 2: イベントタイトルを描画 (手前のレイヤー) */}
        {visibleEvents.map((event) => {
          if (event.isGroup) return null; // グループは描画済み

          const isHighlighted = highlightedEvents.has(event.id);
          const truncatedTitle = truncateTitle(event.title);
          const eventWidth = event.calculatedWidth || calculateTextWidth(truncatedTitle) + 16;

          let eventColors = { backgroundColor: "#6b7280", textColor: "white" };
          if (event.timelineColor) {
            eventColors = createEventColors(event.timelineColor);
          } else if (isHighlighted) {
            eventColors = { backgroundColor: "#10b981", textColor: "white" };
          } else if (event.id === 1 || event.id === 2) {
            eventColors = {
              backgroundColor: event.id === 1 ? "#3b82f6" : "#ef4444",
              textColor: "white",
            };
          }

          return (
            <div
              key={`event-${event.id}-${scale}-${panX}-${panY}`}
              data-event-id={event.id}
              style={{
                position: "absolute",
                left: event.adjustedPosition.x,
                top: event.adjustedPosition.y + panY + 7 + "px",
                transform: "translateX(-50%)",
                cursor: "pointer",
                zIndex: isHighlighted ? 5 : 4,
                textAlign: "center",
                userSelect: "none",
              }}
            >
              <div
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  color: eventColors.textColor,
                  fontWeight: "500",
                  fontSize: "11px",
                  width: `${Math.max(60, eventWidth)}px`,
                  backgroundColor: eventColors.backgroundColor,
                  border: isHighlighted
                    ? "2px solid #059669"
                    : event.timelineColor
                    ? `1px solid ${event.timelineColor}`
                    : "none",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  lineHeight: "1.1",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {truncatedTitle}
              </div>
            </div>
          );
        })}

        {/* グループツールチップ */}
        {hoveredGroup && (
          <GroupTooltip
            groupData={hoveredGroup.data}
            position={{
              x: hoveredGroup.data.position.x,
              y: hoveredGroup.data.position.y,
            }}
            panY={panY}
          />
        )}

        {/* 展開されたグループカード */}
        {Array.from(expandedGroups).map((groupId) => {
          const groupCard = groupManager.getGroupCard(groupId);
          const groupData = advancedEventPositions.eventGroups.find(
            (g) => g.id === groupId
          );

          if (!groupCard || !groupData) return null;

          return (
            <GroupCard
              key={`card-${groupId}`}
              groupData={groupData}
              position={groupCard.position}
              panY={panY}
              panX={panX}
              timelineColor={groupData.events[0]?.timelineColor || "#6b7280"}
              onEventDoubleClick={handleGroupEventDoubleClick}
              onClose={() => toggleEventGroup(groupId, groupCard.position)}
            />
          );
        })}

        {/* 年表カード */}
        {Timelines.map((timeline, index) => {
          const axis = axesMap.get(timeline.id);
          const xPosition = axis ? axis.startX : 20;
          const baseCardY = cardPositions[timeline.id]?.y ||
            TIMELINE_CONFIG.FIRST_ROW_Y + index * TIMELINE_CONFIG.ROW_HEIGHT;
          const centeredCardY = baseCardY + TIMELINE_CONFIG.ROW_HEIGHT / 2;
          
          return (
            <TimelineCard
              key={`timeline-${timeline.id}-${scale}-${panX}-${panY}`}
              timeline={timeline}
              position={{ x: xPosition, y: centeredCardY }}
              panY={panY}
              onDeleteTimeline={deleteTimeline}
            />
          );
        })}

        {/* 年表軸線の描画 */}
        {timelineAxes.map((axis) => (
          <div key={`axis-${axis.id}`}>
            <div
              style={{
                position: "absolute",
                left: axis.startX - 100,
                top: axis.yPosition,
                width: Math.max(0, axis.endX - axis.startX) + 100,
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