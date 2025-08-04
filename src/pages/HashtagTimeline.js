// HashtagTimeline.js (メインコンポーネント)
import React, { useRef, useCallback, useMemo } from "react";
import { EventModal } from "../components/EventModal";
import { TimelineModal } from "../components/TimelineModal";
import { SearchPanel } from "../components/SearchPanel";
import { HelpBox } from "../components/HelpBox";
import { useTimelineLogic } from "../hooks/useTimelineLogic";
import { TIMELINE_CONFIG } from "../constants/timelineConfig";
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
    scale,
    panX,
    panY,
    timelineCardY,
    searchTerm,
    highlightedEvents,
    createdTimelines,
    isHelpOpen,
    isModalOpen,
    isTimelineModalOpen,
    modalPosition,
    editingEvent,
    newEvent,
    selectedTimeline,
    viewMode,
    activeTimeline,
    isTransitioning,
    timelineScale,
    timelinePanX,
    
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
    viewTimeline,
    backToMainView,
    closeTimelineView,
    closeTimelineModal,
    deleteTimeline,
    adjustEventPositions,
    getTopTagsFromSearch,
    currentPixelsPerYear,
    truncateTitle,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleCardMouseDown,
    handleEventChange,
    setTimelineScale,
    setTimelinePanX,
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

    for (let year = TIMELINE_CONFIG.START_YEAR; year <= TIMELINE_CONFIG.END_YEAR; year += yearInterval) {
      const x = (year - TIMELINE_CONFIG.START_YEAR) * currentPixelsPerYear + panX;
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

  // 年表ビューモード用の年マーカー生成
  const generateTimelineYearMarkers = useCallback(() => {
    if (viewMode !== 'timeline' || !activeTimeline) return [];
    
    const years = activeTimeline.events.map(e => e.startDate.getFullYear());
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const padding = Math.max(10, (maxYear - minYear) * 0.1);
    const adjustedMinYear = Math.floor(minYear - padding);
    const adjustedMaxYear = Math.ceil(maxYear + padding);
    
    const markers = [];
    const safeTimelineScale = timelineScale || 2;
    const pixelsPerYear = safeTimelineScale * 50;
    
    let yearInterval = 1;
    if (safeTimelineScale < 0.5) yearInterval = 50;
    else if (safeTimelineScale < 1) yearInterval = 20;
    else if (safeTimelineScale < 2) yearInterval = 10;
    else if (safeTimelineScale < 5) yearInterval = 5;
    
    const startYear = Math.floor(adjustedMinYear / yearInterval) * yearInterval;
    const endYear = Math.ceil(adjustedMaxYear / yearInterval) * yearInterval;
    
    for (let year = startYear; year <= endYear; year += yearInterval) {
      const x = (year - adjustedMinYear) * pixelsPerYear + (timelinePanX || 0) + 300;
      
      if (x > 250 && x < window.innerWidth + 100) {
        markers.push(
          <div
            key={year}
            style={{
              position: "absolute",
              left: x,
              top: 80,
              height: "calc(100vh - 160px)",
              borderLeft: "1px solid #e5e7eb",
              pointerEvents: "none",
              zIndex: 1
            }}
          >
            <span
              style={{
                position: "absolute",
                top: "-25px",
                left: "5px",
                fontSize: "12px",
                color: "#6b7280",
                fontWeight: "500",
                userSelect: "none",
                backgroundColor: "white",
                padding: "2px 4px",
                borderRadius: "2px"
              }}
            >
              {year}
            </span>
          </div>
        );
      }
    }
    return markers;
  }, [viewMode, activeTimeline, timelineScale, timelinePanX]);

  // 年表ビューモード用のイベント位置計算
  const timelinePositionedEvents = useMemo(() => {
    if (viewMode !== 'timeline' || !activeTimeline) return [];
    
    const years = activeTimeline.events.map(e => e.startDate.getFullYear());
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const padding = Math.max(10, (maxYear - minYear) * 0.1);
    const adjustedMinYear = Math.floor(minYear - padding);
    
    const sortedEvents = [...activeTimeline.events].sort((a, b) => 
      a.startDate.getFullYear() - b.startDate.getFullYear()
    );
    
    const safeTimelineScale = timelineScale || 2;
    const safeTimelinePanX = timelinePanX || 0;
    const pixelsPerYear = safeTimelineScale * 50;
    const baseY = 150;
    const eventHeight = 60;
    const levels = [];
    
    return sortedEvents.map((event) => {
      const year = event.startDate.getFullYear();
      const x = (year - adjustedMinYear) * pixelsPerYear + safeTimelinePanX + 300;
      
      // Y位置の衝突検出
      let level = 0;
      let y = baseY;
      
      while (level < 10) {
        let hasCollision = false;
        for (let i = 0; i < levels.length; i++) {
          const prevEvent = levels[i];
          if (prevEvent.level === level && 
              Math.abs(x - prevEvent.x) < 150) {
            hasCollision = true;
            break;
          }
        }
        
        if (!hasCollision) break;
        level++;
        y = baseY + level * (eventHeight + 20);
      }
      
      levels.push({ x, y, level });
      
      return {
        ...event,
        displayX: x,
        displayY: y,
        level
      };
    });
  }, [viewMode, activeTimeline, timelineScale, timelinePanX]);

  // 年表ビューモード用のホイール処理
  const handleTimelineWheel = useCallback((e) => {
    if (viewMode !== 'timeline') return;
    
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const currentScale = timelineScale || 2;
    const newScale = Math.max(0.2, Math.min(10, currentScale * zoomFactor));
    if (setTimelineScale) {
      setTimelineScale(newScale);
    }
  }, [viewMode, timelineScale, setTimelineScale]);

  // 年表ビューモード用のドラッグ処理
  const handleTimelineMouseDown = useCallback((e) => {
    if (viewMode !== 'timeline') return;
    if (e.target.closest('.timeline-card') || e.target.closest('.event-item')) return;
    
    let isDragging = true;
    let lastX = e.clientX;
    
    const handleMouseMove = (e) => {
      if (isDragging && setTimelinePanX) {
        const deltaX = e.clientX - lastX;
        setTimelinePanX(prev => prev + deltaX);
        lastX = e.clientX;
      }
    };
    
    const handleMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [viewMode, setTimelinePanX]);

  const styles = createTimelineStyles(isDragging.current, timelineCardY);

  return (
    <div style={styles.app}>
      {/* ヘッダー */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {viewMode === 'timeline' && (
            <button
              onClick={backToMainView}
              style={{
                padding: "6px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                backgroundColor: "white",
                cursor: "pointer",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              ← 戻る
            </button>
          )}
          <h1 style={styles.title}>
            {viewMode === 'timeline' && activeTimeline 
              ? activeTimeline.name 
              : '#ハッシュタグ年表'
            }
          </h1>
        </div>
        <div style={styles.headerRight}>
          {viewMode === 'main' && (
            <>
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
            </>
          )}
          {viewMode === 'timeline' && activeTimeline && (
            <>
              <span style={{ fontSize: "14px", color: "#6b7280" }}>
                {activeTimeline.events.length}件のイベント
              </span>
              <span style={styles.zoomInfo}>
                ズーム: {(timelineScale || 1).toFixed(1)}x
              </span>
            </>
          )}
        </div>
      </div>

      {/* メインタイムライン */}
      <div
        ref={timelineRef}
        style={{
          ...styles.timeline,
          transition: isTransitioning ? 'all 0.3s ease-in-out' : 'none',
        }}
        onWheel={viewMode === 'timeline' ? handleTimelineWheel : handleWheel}
        onMouseDown={viewMode === 'timeline' ? handleTimelineMouseDown : handleMouseDown}
        onMouseMove={viewMode === 'main' ? handleMouseMove : undefined}
        onMouseUp={viewMode === 'main' ? handleMouseUp : undefined}
        onMouseLeave={viewMode === 'main' ? handleMouseUp : undefined}
        onDoubleClick={viewMode === 'main' ? handleDoubleClick : undefined}
      >
        {/* 年マーカー - メインビューまたは年表ビュー */}
        {viewMode === 'main' ? generateYearMarkers() : generateTimelineYearMarkers()}

        {/* 検索パネル - メインビューのみ */}
        {viewMode === 'main' && (
          <SearchPanel
            searchTerm={searchTerm}
            highlightedEvents={highlightedEvents}
            createdTimelines={createdTimelines}
            onSearchChange={handleSearchChange}
            onCreateTimeline={createTimeline}
            onViewTimeline={viewTimeline}
            getTopTagsFromSearch={getTopTagsFromSearch}
            styles={styles}
          />
        )}

        {/* 年表概要カード - 年表ビューのみ */}
        {viewMode === 'timeline' && activeTimeline && (
          <div
            className="timeline-card"
            style={{
              position: "absolute",
              left: "20px",
              top: "80px",
              width: "260px",
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              padding: "20px",
              zIndex: 5,
              transition: isTransitioning ? 'all 0.3s ease-in-out' : 'none',
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "12px"
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#374151",
                  margin: 0
                }}
              >
                {activeTimeline.name}
              </h3>
              <button
                onClick={closeTimelineView}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "18px",
                  color: "#6b7280",
                  cursor: "pointer",
                  padding: "0",
                  width: "20px",
                  height: "20px"
                }}
              >
                ×
              </button>
            </div>
            
            <div
              style={{
                fontSize: "14px",
                color: "#6b7280",
                marginBottom: "16px"
              }}
            >
              {activeTimeline.events.length}件のイベント<br />
              {Math.min(...activeTimeline.events.map(e => e.startDate.getFullYear()))}年 - {Math.max(...activeTimeline.events.map(e => e.startDate.getFullYear()))}年
            </div>

            {/* 主要タグ */}
            {activeTimeline.tags.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#374151",
                    fontWeight: "600",
                    marginBottom: "8px"
                  }}
                >
                  主要タグ
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "4px"
                  }}
                >
                  {activeTimeline.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "#dbeafe",
                        color: "#1d4ed8",
                        fontSize: "11px",
                        borderRadius: "4px",
                        border: "1px solid #93c5fd"
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 作成日 */}
            <div
              style={{
                fontSize: "12px",
                color: "#9ca3af",
                paddingTop: "12px",
                borderTop: "1px solid #f3f4f6"
              }}
            >
              作成日: {activeTimeline.createdAt.toLocaleDateString()}
            </div>
          </div>
        )}

        {/* ドラッグ可能な年表カード - メインビューのみ */}
        {viewMode === 'main' && (
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
        )}

        {/* 横軸ライン - 年表ビューのみ */}
        {viewMode === 'timeline' && (
          <div
            style={{
              position: "absolute",
              left: "300px",
              top: "140px",
              right: "20px",
              height: "2px",
              backgroundColor: "#d1d5db",
              zIndex: 2,
              transition: isTransitioning ? 'all 0.3s ease-in-out' : 'none',
            }}
          />
        )}

        {/* イベント表示 */}
        {viewMode === 'main' 
          ? adjustEventPositions().map((event) => {
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
                    transition: isTransitioning ? 'all 0.5s ease-in-out' : 'none',
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#666",
                      marginBottom: "2px",
                    }}
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
            })
          : timelinePositionedEvents.map((event) => (
              <div
                key={event.id}
                className="event-item"
                style={{
                  position: "absolute",
                  left: event.displayX - 60,
                  top: event.displayY,
                  width: "120px",
                  zIndex: 3,
                  transition: isTransitioning ? 'all 0.5s ease-in-out' : 'none',
                }}
              >
                {/* 接続線 */}
                <div
                  style={{
                    position: "absolute",
                    left: "60px",
                    top: "-10px",
                    width: "2px",
                    height: event.level === 0 ? "10px" : `${event.level * 80 + 10}px`,
                    backgroundColor: "#6b7280",
                    zIndex: 1
                  }}
                />
                
                {/* イベントカード */}
                <div
                  style={{
                    backgroundColor: "white",
                    border: "2px solid #3b82f6",
                    borderRadius: "6px",
                    padding: "8px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    textAlign: "center",
                    position: "relative",
                    zIndex: 2
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#6b7280",
                      marginBottom: "4px",
                      fontWeight: "500"
                    }}
                  >
                    {event.startDate.getFullYear()}年
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#374151",
                      lineHeight: "1.2",
                      marginBottom: "4px"
                    }}
                  >
                    {event.title}
                  </div>
                  {event.description && (
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#6b7280",
                        lineHeight: "1.3",
                        marginTop: "4px"
                      }}
                    >
                      {event.description.length > 50 
                        ? event.description.substring(0, 50) + "..."
                        : event.description
                      }
                    </div>
                  )}
                </div>
              </div>
            ))
        }

        {/* 現在ライン */}
        <div
          style={{
            position: "absolute",
            left: viewMode === 'main' 
              ? (2025.6 - TIMELINE_CONFIG.START_YEAR) * currentPixelsPerYear + panX
              : (() => {
                  if (!activeTimeline) return 0;
                  const years = activeTimeline.events.map(e => e.startDate.getFullYear());
                  const minYear = Math.min(...years);
                  const padding = Math.max(10, (Math.max(...years) - minYear) * 0.1);
                  const adjustedMinYear = Math.floor(minYear - padding);
                  const safeTimelineScale = timelineScale || 2;
                  const safeTimelinePanX = timelinePanX || 0;
                  return (2025.6 - adjustedMinYear) * safeTimelineScale * 50 + safeTimelinePanX + 300;
                })(),
            top: 0,
            height: "100%",
            borderLeft: "1px solid #f6a656ff",
            pointerEvents: "none",
            transition: isTransitioning ? 'all 0.3s ease-in-out' : 'none',
          }}
        />

        {/* ヘルプボックス - メインビューのみ */}
        {viewMode === 'main' && (
          <HelpBox 
            isHelpOpen={isHelpOpen}
            setIsHelpOpen={setIsHelpOpen}
            highlightedEvents={highlightedEvents}
            styles={styles}
          />
        )}

        {/* 年表ビュー用の操作ヒント */}
        {viewMode === 'timeline' && (
          <div
            style={{
              position: "absolute",
              bottom: "20px",
              right: "20px",
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              color: "white",
              padding: "8px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              zIndex: 10
            }}
          >
            マウスホイール: ズーム | ドラッグ: 移動
          </div>
        )}
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

      <TimelineModal
        isOpen={isTimelineModalOpen}
        timeline={selectedTimeline}
        onClose={closeTimelineModal}
        onDelete={deleteTimeline}
      />
    </div>
  );
};

export default HashtagTimeline;