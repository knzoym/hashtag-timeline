// src/pages/HashtagTimeline.js
import React, { useRef, useCallback, useState, useEffect } from "react";
import { EventModal } from "../components/EventModal";
import { SearchPanel } from "../components/SearchPanel";
import { HelpBox } from "../components/HelpBox";
import { TimelineCard } from "../components/TimelineCard";
import TableView from "../components/TableView";
import TimelineModal from "../components/TimelineModal";
import {
  EventGroupIcon,
  GroupTooltip,
  GroupCard,
} from "../components/EventGroup";
import { useTimelineLogic } from "../hooks/useTimelineLogic";
import { useDragDrop } from "../hooks/useDragDrop";
import { createTimelineStyles } from "../styles/timelineStyles";
import { extractTagsFromDescription } from "../utils/timelineUtils";
import { TIMELINE_CONFIG } from "../constants/timelineConfig";
import { useAuth } from "../hooks/useAuth";
import { useSupabaseSync } from "../hooks/useSupabaseSync";
import MyPage from "../components/MyPage";

const HashtagTimeline = () => {
  // ローディング状態
  const [isSaving, setIsSaving] = useState(false);

  // ビュー切り替え状態
  const [currentView, setCurrentView] = useState("timeline"); // 'timeline' | 'table' | 'mypage'

  // メインの状態管理
  const timelineRef = useRef(null);
  const isDragging = useRef(false);
  const lastMouseX = useRef(0);
  const lastMouseY = useRef(0);
  const isShiftPressed = useRef(false);

  // カスタムフックから必要な状態と関数を取得
  // 認証フック
  const { user, loading, signInWithGoogle, signOut, isAuthenticated } =
    useAuth();

  // Supabase同期フック
  const {
    saveTimelineData,
    getUserTimelines,
    deleteTimeline: deleteTimelineFile, // ファイル削除用の関数（別名で取得）
    upsertProfile,
    loading: syncLoading,
  } = useSupabaseSync(user);

  // ログイン時のプロファイル作成
  useEffect(() => {
    if (user && !syncLoading) {
      upsertProfile({});
    }
  }, [user]);

  const {
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

    // テーブルビュー用関数
    updateEvent,
    deleteEvent,

    // ユーティリティ関数
    calculateTextWidth,

    setEditingEvent,
    setNewEvent,
    setModalPosition,
    setIsModalOpen,
    events,

    // ドラッグ&ドロップ関連
    timelinePositions,
    moveEvent,
    moveTimeline,
    addEventToTimeline,
    removeEventFromTimeline,

    // 年表モーダル関連
    timelineModalOpen,
    selectedTimelineForModal,
    openTimelineModal,
    closeTimelineModal,

    // 年表データの読み込み・保存・削除
    setEvents,
    setCreatedTimelines,
  } = useTimelineLogic(
    timelineRef,
    isDragging,
    lastMouseX,
    lastMouseY,
    isShiftPressed
  );

  // 年表データの読み込み
  const handleLoadTimeline = useCallback((timelineData) => {
    if (timelineData.events) {
      // 日付を文字列からDateオブジェクトに変換
      const eventsWithDates = timelineData.events.map((event) => ({
        ...event,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
      }));
      setEvents(eventsWithDates);
    }
    if (timelineData.timelines) {
      // 年表内のイベントの日付も変換
      const timelinesWithDates = timelineData.timelines.map((timeline) => ({
        ...timeline,
        events:
          timeline.events?.map((event) => ({
            ...event,
            startDate: new Date(event.startDate),
            endDate: new Date(event.endDate),
          })) || [],
        temporaryEvents:
          timeline.temporaryEvents?.map((event) => ({
            ...event,
            startDate: new Date(event.startDate),
            endDate: new Date(event.endDate),
          })) || [],
        removedEvents:
          timeline.removedEvents?.map((event) => ({
            ...event,
            startDate: new Date(event.startDate),
            endDate: new Date(event.endDate),
          })) || [],
      }));
      setCreatedTimelines(timelinesWithDates);
    }
  }, []);

  // 年表データの保存
  const handleSaveTimeline = useCallback(async () => {
    if (!isAuthenticated || isSaving) return;

    setIsSaving(true);
    try {
      const timelineData = {
        events: events,
        timelines: Timelines,
        version: "1.0",
        savedAt: new Date().toISOString(),
      };

      const title = `年表 ${new Date().toLocaleDateString("ja-JP")}`;
      const result = await saveTimelineData(timelineData, title);

      if (result) {
        alert("ファイルを保存しました");
      } else {
        alert("保存に失敗しました");
      }
    } finally {
      setIsSaving(false);
    }
  }, [isAuthenticated, events, Timelines, saveTimelineData, isSaving]);

  // ドラッグ&ドロップ機能
  const {
    dragState,
    handleMouseDown: handleDragMouseDown,
    handleMouseMove: handleDragMouseMove,
    handleMouseUp: handleDragMouseUp,
    cancelDrag,
    isDragging: isDragActive,
  } = useDragDrop(
    moveEvent,
    moveTimeline,
    addEventToTimeline,
    removeEventFromTimeline
  );

  // テーブルビュー用のイベント削除ハンドラー
  const handleTableEventDelete = useCallback(
    (eventId) => {
      if (window.confirm("このイベントを削除しますか？")) {
        deleteEvent(eventId);
      }
    },
    [deleteEvent]
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

  // 表示用のイベント（シンプルに全て表示）
  const visibleEvents = advancedEventPositions.allEvents.filter(
    (event) => !event.hiddenByGroup
  );

  // ドラッグ中のマウス移動処理
  useEffect(() => {
    if (isDragActive) {
      const handleGlobalMouseMove = (e) => {
        handleDragMouseMove(e);
      };

      const handleGlobalMouseUp = (e) => {
        const currentTimelineAxes = getTimelineAxesForDisplay();
        const currentEventPositions = visibleEvents.map((event) => ({
          id: event.id,
          x: event.adjustedPosition.x,
          y: event.adjustedPosition.y,
          timelineId: event.timelineId,
        }));

        handleDragMouseUp(e, currentTimelineAxes, currentEventPositions);
      };

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          cancelDrag();
        }
      };

      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("mousemove", handleGlobalMouseMove);
        document.removeEventListener("mouseup", handleGlobalMouseUp);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [
    isDragActive,
    handleDragMouseMove,
    handleDragMouseUp,
    cancelDrag,
    getTimelineAxesForDisplay,
    visibleEvents,
  ]);

  return (
    <div style={styles.app}>
      {/* ヘッダー */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          {/* ビュー切り替えボタン */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setCurrentView("timeline")}
              style={{
                ...styles.resetButton,
                backgroundColor:
                  currentView === "timeline" ? "#3b82f6" : "#6b7280",
              }}
            >
              年表ビュー
            </button>
            <button
              onClick={() => setCurrentView("table")}
              style={{
                ...styles.resetButton,
                backgroundColor:
                  currentView === "table" ? "#3b82f6" : "#6b7280",
              }}
            >
              テーブルビュー
            </button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <h1 style={styles.title}>#ハッシュタグ年表</h1>
        </div>
        <div style={styles.headerRight}>
          {currentView === "timeline" && (
            <>
              <button
                style={styles.resetButton}
                onClick={resetToInitialPosition}
                title="初期位置に戻す"
              >
                初期位置
              </button>
              <span style={styles.zoomInfo}>
                ズーム: {(scale / 2.5).toFixed(1)}x
              </span>
            </>
          )}

          {/* 保存ボタン（ログイン時のみ表示） */}
          {isAuthenticated && (
            <button
              onClick={handleSaveTimeline}
              style={{
                ...styles.resetButton,
                backgroundColor: isSaving ? "#9ca3af" : "#10b981",
              }}
              disabled={isSaving}
            >
              {isSaving ? "保存中..." : "保存"}
            </button>
          )}

          {/* マイページボタン（ログイン時のみ表示） */}
          {isAuthenticated && (
            <>
              <button
                onClick={() => setCurrentView("mypage")}
                style={{
                  ...styles.resetButton,
                  backgroundColor:
                    currentView === "mypage" ? "#3b82f6" : "#6b7280",
                }}
              >
                マイページ
              </button>
            </>
          )}

          {/* 認証ボタン */}
          {loading ? (
            <span style={{ fontSize: "14px", color: "#666" }}>
              読み込み中...
            </span>
          ) : isAuthenticated ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "14px", color: "#374151" }}>
                {user.email}
              </span>
              <button onClick={signOut} style={styles.resetButton}>
                ログアウト
              </button>
            </div>
          ) : (
            <button onClick={signInWithGoogle} style={styles.resetButton}>
              ログイン
            </button>
          )}
        </div>
      </div>

      {/* メインコンテンツ */}
      {currentView === "table" ? (
        // テーブルビュー
        <TableView /* 既存のprops */ />
      ) : currentView === "mypage" ? (
        // マイページ
        <MyPage
          user={user}
          supabaseSync={{ getUserTimelines, deleteTimelineFile }}
          onLoadTimeline={handleLoadTimeline}
          onBackToTimeline={() => setCurrentView("timeline")}
        />
      ) : (
        // 年表ビュー
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

          {/* Part 1: 年号とグループアイコンを描画 */}
          {visibleEvents.map((event, index) => {
            if (event.isGroup) {
              return (
                <EventGroupIcon
                  key={`group-${event.groupData.id}-${index}`}
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

            const uniqueKey = event.timelineId
              ? `year-${event.id}-${event.timelineId}-${index}`
              : `year-${event.id}-main-${index}`;

            return (
              <div
                key={uniqueKey}
                style={{
                  position: "absolute",
                  left: event.adjustedPosition.x,
                  top: event.adjustedPosition.y + panY + 8 + "px",
                  transform: "translateX(-50%)",
                  zIndex: 2,
                  textAlign: "center",
                  pointerEvents: "none",
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
              </div>
            );
          })}

          {/* Part 2: イベントタイトルを描画 */}
          {visibleEvents.map((event, index) => {
            if (event.isGroup) return null;

            const isHighlighted = highlightedEvents.has(event.id);
            const truncatedTitle = truncateTitle(event.title);
            const eventWidth =
              event.calculatedWidth || calculateTextWidth(truncatedTitle) + 16;

            let eventColors = {
              backgroundColor: "#6b7280",
              textColor: "white",
            };

            if (event.timelineColor && !event.isRemoved) {
              eventColors = createEventColors(event.timelineColor);
            } else if (isHighlighted) {
              eventColors = { backgroundColor: "#10b981", textColor: "white" };
            } else if (event.id === 1 || event.id === 2) {
              eventColors = {
                backgroundColor: event.id === 1 ? "#3b82f6" : "#ef4444",
                textColor: "white",
              };
            }

            const uniqueKey = event.timelineId
              ? `event-${event.id}-${event.timelineId}-${index}`
              : `event-${event.id}-main-${index}`;

            return (
              <div
                key={uniqueKey}
                data-event-id={event.id}
                style={{
                  position: "absolute",
                  left: event.adjustedPosition.x,
                  top: event.adjustedPosition.y + panY + 15 + "px",
                  transform: "translateX(-50%)",
                  cursor: "ns-resize",
                  zIndex: isHighlighted ? 5 : 4,
                  textAlign: "center",
                  userSelect: "none",
                  opacity:
                    isDragActive && dragState.draggedItem?.id === event.id
                      ? 0.7
                      : 1,
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (e.detail === 1) {
                    const dragItem = {
                      ...event,
                      timelineId: event.timelineId || null,
                      timelineName: event.timelineName || null,
                      isTemporary: event.isTemporary || false,
                    };
                    handleDragMouseDown(e, "event", dragItem);
                  }
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
                      : event.isTemporary
                      ? `2px dashed ${event.timelineColor}`
                      : event.timelineColor && !event.isRemoved
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
            const baseCardY =
              cardPositions[timeline.id]?.y ||
              TIMELINE_CONFIG.FIRST_ROW_Y + index * TIMELINE_CONFIG.ROW_HEIGHT;
            const centeredCardY = baseCardY + TIMELINE_CONFIG.ROW_HEIGHT / 2;

            const customTimelinePosition = timelinePositions.get(timeline.id);
            const finalCardY = customTimelinePosition
              ? customTimelinePosition.y
              : centeredCardY;

            return (
              <TimelineCard
                key={timeline.id}
                timeline={timeline}
                position={{ x: xPosition, y: finalCardY }}
                panY={panY}
                onDeleteTimeline={deleteTimeline}
                onDoubleClick={() => openTimelineModal(timeline)}
                onMouseDown={(e) =>
                  handleDragMouseDown(e, "timeline", {
                    ...timeline,
                    yPosition: finalCardY,
                  })
                }
                isDragging={
                  isDragActive && dragState.draggedItem?.id === timeline.id
                }
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

              {isDragActive && dragState.dragType === "event" && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: axis.yPosition - 60,
                    width: "100%",
                    height: "120px",
                    backgroundColor: `${axis.color}15`,
                    border: `2px dashed ${axis.color}`,
                    borderRadius: "8px",
                    zIndex: 1,
                    pointerEvents: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    color: axis.color,
                    fontWeight: "500",
                    opacity: 0.8,
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "white",
                      padding: "6px 12px",
                      borderRadius: "16px",
                      border: `1px solid ${axis.color}`,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {axis.name} に仮登録
                  </div>
                </div>
              )}
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
      )}

      {/* 年表詳細モーダル */}
      <TimelineModal
        isOpen={timelineModalOpen}
        timeline={selectedTimelineForModal}
        onClose={closeTimelineModal}
        onEventRemove={removeEventFromTimeline}
        onEventAdd={addEventToTimeline}
        allEvents={events}
      />

      {/* ドラッグ中のプレビュー */}
      {isDragActive && dragState.draggedItem && (
        <>
          <div
            style={{
              position: "fixed",
              left: dragState.startPosition.x - 1,
              top: 0,
              width: "2px",
              height: "100vh",
              backgroundColor: "#3b82f6",
              opacity: 0.3,
              zIndex: 9998,
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "fixed",
              left: dragState.startPosition.x - 40,
              top: dragState.currentPosition.y - 15,
              zIndex: 9999,
              pointerEvents: "none",
              opacity: 0.9,
              backgroundColor: (() => {
                const headerHeight = 64;
                const nearTimeline = timelineAxes.find((axis) => {
                  const adjustedAxisY = axis.yPosition + headerHeight;
                  const distance = Math.abs(
                    dragState.currentPosition.y - adjustedAxisY
                  );
                  return distance < 60;
                });

                if (dragState.draggedItem.timelineId && !nearTimeline) {
                  return "#ef4444";
                }

                return nearTimeline ? nearTimeline.color : "#3b82f6";
              })(),
              color: "white",
              padding: "6px 12px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "500",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
              border: "1px solid white",
              transition: "background-color 0.2s ease",
            }}
          >
            {(() => {
              const headerHeight = 64;
              const nearTimeline = timelineAxes.find((axis) => {
                const adjustedAxisY = axis.yPosition + headerHeight;
                const distance = Math.abs(
                  dragState.currentPosition.y - adjustedAxisY
                );
                return distance < 60;
              });

              if (dragState.draggedItem.timelineId && !nearTimeline) {
                return `✕ ${dragState.draggedItem.timelineName}から削除`;
              }

              return nearTimeline
                ? `→ ${nearTimeline.name}`
                : dragState.draggedItem.title;
            })()}
          </div>
        </>
      )}

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
