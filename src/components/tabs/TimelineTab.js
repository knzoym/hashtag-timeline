// src/components/tabs/TimelineTab.js - 基本機能修正版
import React, { useRef, useCallback, useMemo } from 'react';
import { SearchPanel } from '../ui/SearchPanel';
import { TimelineCard } from '../ui/TimelineCard';
import { EventModal } from '../modals/EventModal';
import { useTimelineLogic } from '../../hooks/useTimelineLogic';
import { TIMELINE_CONFIG } from '../../constants/timelineConfig';
import { truncateTitle } from '../../utils/timelineUtils';

const TimelineTab = ({
  // TabSystemから受け取るprops
  events: propEvents,
  timelines: propTimelines,
  user,
  onEventUpdate,
  onEventDelete,
  onTimelineUpdate,
  onAddEvent,
  isPersonalMode,
  isWikiMode,
  
  // Timeline固有のprops
  timelineRef: externalTimelineRef,
  scale: propScale,
  panX: propPanX,
  panY: propPanY,
  currentPixelsPerYear: propCurrentPixelsPerYear,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onDoubleClick,
  highlightedEvents: propHighlightedEvents,
  onResetView,
  
  // その他
  searchTerm: propSearchTerm,
  onSearchChange
}) => {
  // タイムライン専用の参照
  const internalTimelineRef = useRef(null);
  const timelineRef = externalTimelineRef || internalTimelineRef;
  
  // 基本的なLogicを使用
  const {
    events,
    timelines,
    searchTerm,
    setSearchTerm,
    highlightedEvents,
    setHighlightedEvents,
    selectedEvent,
    setSelectedEvent,
    deleteTimeline,
    openNewEventModal,
    openEventModal,
    handleSearchChange,
    getTopTagsFromSearch,
    calculateTextWidth,
    updateEvent,
    deleteEvent,
    modalPosition,
    setCreatedTimelines
  } = useTimelineLogic(timelineRef);

  // 最終的なデータを決定（propsが優先）
  const finalEvents = propEvents || events || [];
  const finalTimelines = propTimelines || timelines || [];
  const finalPanX = propPanX !== undefined ? propPanX : 0;
  const finalPanY = propPanY !== undefined ? propPanY : 0;
  const finalCurrentPixelsPerYear = propCurrentPixelsPerYear || 50;
  const finalHighlightedEvents = propHighlightedEvents || highlightedEvents || new Set();
  const finalSearchTerm = propSearchTerm !== undefined ? propSearchTerm : searchTerm || '';

  console.log('TimelineTab render:', {
    events: finalEvents.length,
    timelines: finalTimelines.length,
    panX: finalPanX,
    panY: finalPanY,
    pixelsPerYear: finalCurrentPixelsPerYear
  });

  // 年からX座標を計算
  const getXFromYear = useCallback((year) => {
    return (year - 1900) * finalCurrentPixelsPerYear + finalPanX;
  }, [finalCurrentPixelsPerYear, finalPanX]);

  // 年マーカー生成
  const generateYearMarkers = useCallback(() => {
    const markers = [];
    const viewportWidth = window.innerWidth;
    const startYear = Math.floor((0 - finalPanX) / finalCurrentPixelsPerYear) - 1;
    const endYear = Math.floor((viewportWidth - finalPanX) / finalCurrentPixelsPerYear) + 1;
    
    console.log('年マーカー生成:', {
      startYear,
      endYear,
      pixelsPerYear: finalCurrentPixelsPerYear,
      panX: finalPanX
    });
    
    for (let year = Math.max(1800, Math.floor(startYear / 10) * 10); 
         year <= Math.min(2100, endYear); 
         year += 10) {
      const x = getXFromYear(year);
      if (x > -50 && x < viewportWidth + 50) {
        markers.push(
          <div
            key={year}
            style={{
              position: 'absolute',
              left: `${x}px`,
              top: '10px',
              fontSize: '12px',
              color: '#6b7280',
              fontWeight: '500',
              pointerEvents: 'none',
              userSelect: 'none',
              zIndex: 10,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '2px 6px',
              borderRadius: '3px',
              border: '1px solid rgba(221, 221, 221, 0.7)'
            }}
          >
            {year}
          </div>
        );
      }
    }
    console.log(`年マーカー ${markers.length}件生成`);
    return markers;
  }, [getXFromYear, finalPanX, finalCurrentPixelsPerYear]);

  // 基本的なイベントレイアウト
  const layoutEvents = useMemo(() => {
    if (!finalEvents || finalEvents.length === 0) {
      console.log('イベントなし');
      return [];
    }

    console.log(`イベントレイアウト開始: ${finalEvents.length}件`);
    
    const results = [];
    const occupiedPositions = new Map();

    // 日付でソート
    const sortedEvents = [...finalEvents].sort((a, b) => {
      if (!a.startDate || !b.startDate) return 0;
      return new Date(a.startDate) - new Date(b.startDate);
    });

    sortedEvents.forEach((event, index) => {
      if (!event.startDate) {
        console.warn(`イベント "${event.title}" に開始日がありません`);
        return;
      }

      const eventDate = new Date(event.startDate);
      const eventX = getXFromYear(eventDate.getFullYear());
      const textWidth = calculateTextWidth ? calculateTextWidth(event.title || "") : 80;
      const eventWidth = Math.max(80, textWidth + 20);

      // 重複回避のためのY位置調整
      let level = 0;
      let eventY = TIMELINE_CONFIG.MAIN_TIMELINE_Y;
      
      while (level < 10) {
        const testY = TIMELINE_CONFIG.MAIN_TIMELINE_Y + level * 60;
        const levelEvents = occupiedPositions.get(testY) || [];
        
        const hasCollision = levelEvents.some(occupied => 
          Math.abs(eventX - occupied.x) < (eventWidth + occupied.width) / 2 + 30
        );
        
        if (!hasCollision) {
          eventY = testY;
          if (!occupiedPositions.has(testY)) {
            occupiedPositions.set(testY, []);
          }
          occupiedPositions.get(testY).push({ x: eventX, width: eventWidth });
          break;
        }
        level++;
      }

      results.push({
        ...event,
        adjustedPosition: { x: eventX, y: eventY },
        calculatedWidth: eventWidth,
        level
      });

      console.log(`イベント配置: "${event.title}" → (${eventX}, ${eventY})`);
    });

    console.log(`レイアウト完了: ${results.length}件`);
    return results;
  }, [finalEvents, getXFromYear, calculateTextWidth]);

  // 年表軸の計算
  const timelineAxes = useMemo(() => {
    if (!finalTimelines || finalTimelines.length === 0) {
      console.log('年表なし');
      return [];
    }

    const axes = finalTimelines
      .filter(timeline => {
        const hasEvents = (timeline.events?.length || 0) > 0;
        const isVisible = timeline.isVisible !== false;
        return hasEvents && isVisible;
      })
      .map((timeline, index) => {
        const axisY = TIMELINE_CONFIG.FIRST_ROW_Y + index * TIMELINE_CONFIG.ROW_HEIGHT;
        
        const allEvents = timeline.events || [];
        if (allEvents.length === 0) return null;
        
        const years = allEvents.map(e => new Date(e.startDate).getFullYear());
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        const startX = getXFromYear(minYear);
        const endX = getXFromYear(maxYear);

        console.log(`年表軸: "${timeline.name}" ${minYear}-${maxYear} → X:${startX}-${endX}, Y:${axisY}`);

        return {
          id: timeline.id,
          name: timeline.name,
          color: timeline.color || '#e5e7eb',
          yPosition: axisY,
          startX,
          endX,
          cardX: Math.max(50, startX - 100),
          eventCount: allEvents.length
        };
      })
      .filter(Boolean);

    console.log(`年表軸 ${axes.length}件生成`);
    return axes;
  }, [finalTimelines, getXFromYear]);

  // 年表作成ハンドラー
  const handleCreateTimeline = useCallback(() => {
    console.log('年表作成開始');
    
    let highlightedEventsList = [];
    if (finalHighlightedEvents?.has) {
      highlightedEventsList = finalEvents.filter(event => 
        finalHighlightedEvents.has(event.id)
      );
    } else if (Array.isArray(finalHighlightedEvents)) {
      highlightedEventsList = finalEvents.filter(event => 
        finalHighlightedEvents.includes(event.id)
      );
    }
    
    console.log(`ハイライト済みイベント: ${highlightedEventsList.length}件`);
    
    if (highlightedEventsList.length === 0) {
      alert("検索でイベントを選択してから年表を作成してください");
      return;
    }

    const topTags = getTopTagsFromSearch ? 
      getTopTagsFromSearch(highlightedEventsList) : [];
    const timelineName = topTags.length > 0 ? 
      `#${topTags[0]}` : "新しい年表";

    const newTimeline = {
      id: Date.now(),
      name: timelineName,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      events: highlightedEventsList,
      temporaryEvents: [],
      removedEvents: [],
      isVisible: true,
      createdAt: new Date(),
      tags: topTags
    };

    console.log('年表作成:', newTimeline);

    if (propTimelines && onTimelineUpdate) {
      onTimelineUpdate([...finalTimelines, newTimeline]);
    } else {
      setCreatedTimelines(prev => [...prev, newTimeline]);
    }

    // 検索クリア
    if (onSearchChange) {
      onSearchChange({ target: { value: '' } });
    } else {
      setSearchTerm('');
      setHighlightedEvents(new Set());
    }

    console.log(`年表作成完了: ${timelineName}`);
  }, [
    finalEvents, 
    finalHighlightedEvents, 
    finalTimelines,
    getTopTagsFromSearch,
    propTimelines,
    onTimelineUpdate,
    setCreatedTimelines,
    onSearchChange,
    setSearchTerm,
    setHighlightedEvents
  ]);

  // イベントクリック
  const handleEventClick = useCallback((event) => {
    console.log('イベントクリック:', event.title);
    setSelectedEvent(event);
  }, [setSelectedEvent]);

  // 追加ボタン
  const handleAddEvent = useCallback(() => {
    console.log('イベント追加');
    if (onAddEvent) {
      onAddEvent();
    } else {
      openNewEventModal();
    }
  }, [onAddEvent, openNewEventModal]);

  // リセットボタン
  const handleResetView = useCallback(() => {
    console.log('ビューリセット');
    if (onResetView) {
      onResetView();
    }
  }, [onResetView]);

  // 検索変更
  const handleSearchChangeWrapper = useCallback((e) => {
    if (onSearchChange) {
      onSearchChange(e);
    } else {
      handleSearchChange(e);
    }
  }, [onSearchChange, handleSearchChange]);

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      {/* メインタイムライン表示エリア */}
      <div
        ref={timelineRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'grab',
          backgroundColor: '#f8fafc'
        }}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onDoubleClick={onDoubleClick}
      >
        {/* 年マーカー */}
        {generateYearMarkers()}

        {/* メインタイムライン線 */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${TIMELINE_CONFIG.MAIN_TIMELINE_Y + finalPanY}px`,
            height: '3px',
            backgroundColor: '#374151',
            zIndex: 1
          }}
        />

        {/* 年表線 */}
        {timelineAxes.map((axis) => (
          <div
            key={`timeline-axis-${axis.id}`}
            style={{
              position: 'absolute',
              left: `${axis.startX}px`,
              top: `${axis.yPosition + finalPanY}px`,
              width: `${Math.max(100, axis.endX - axis.startX)}px`,
              height: '3px',
              backgroundColor: axis.color,
              zIndex: 2
            }}
          />
        ))}

        {/* 年表カード */}
        {timelineAxes.map((axis) => (
          <div
            key={`timeline-card-${axis.id}`}
            style={{
              position: 'absolute',
              left: `${axis.cardX}px`,
              top: `${axis.yPosition + finalPanY - 25}px`,
              zIndex: 15
            }}
          >
            <TimelineCard
              timeline={finalTimelines.find(t => t.id === axis.id)}
              compact={true}
              onClick={() => console.log('年表カードクリック')}
              onToggleVisibility={() => deleteTimeline(axis.id)}
            />
          </div>
        ))}

        {/* イベント表示 */}
        {layoutEvents.length === 0 ? (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              padding: '20px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              textAlign: 'center',
              zIndex: 30
            }}
          >
            <div style={{ fontSize: '16px', color: '#856404', marginBottom: '8px' }}>
              📊 イベントが表示されていません
            </div>
            <div style={{ fontSize: '12px', color: '#6c757d' }}>
              Events: {finalEvents.length}件読み込み済み
            </div>
          </div>
        ) : (
          layoutEvents.map((event) => {
            const eventX = event.adjustedPosition.x;
            const eventY = event.adjustedPosition.y + finalPanY;
            const isHighlighted = finalHighlightedEvents?.has ? 
              finalHighlightedEvents.has(event.id) : 
              finalHighlightedEvents?.includes && finalHighlightedEvents.includes(event.id);

            return (
              <div
                key={event.id}
                style={{
                  position: 'absolute',
                  left: `${eventX - event.calculatedWidth / 2}px`,
                  top: `${eventY}px`,
                  width: `${event.calculatedWidth}px`,
                  height: `${TIMELINE_CONFIG.EVENT_HEIGHT}px`,
                  backgroundColor: isHighlighted ? '#fef3c7' : '#ffffff',
                  border: `2px solid ${isHighlighted ? '#f59e0b' : '#6b7280'}`,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  userSelect: 'none',
                  zIndex: 20,
                  transition: 'all 0.2s ease',
                  boxShadow: isHighlighted ? 
                    '0 2px 8px rgba(245, 158, 11, 0.3)' : 
                    '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
                onClick={() => handleEventClick(event)}
                title={`${event.title} (${event.startDate ? new Date(event.startDate).getFullYear() : '?'})`}
              >
                {truncateTitle(event.title || '無題', event.calculatedWidth - 20)}
              </div>
            );
          })
        )}
      </div>

      {/* 検索パネル */}
      <SearchPanel
        searchTerm={finalSearchTerm}
        highlightedEvents={finalHighlightedEvents}
        timelines={finalTimelines}
        onSearchChange={handleSearchChangeWrapper}
        onCreateTimeline={handleCreateTimeline}
        onDeleteTimeline={deleteTimeline}
        getTopTagsFromSearch={() => {
          const highlightedList = finalEvents.filter(event => 
            finalHighlightedEvents?.has?.(event.id) || 
            finalHighlightedEvents?.includes?.(event.id)
          );
          return getTopTagsFromSearch ? getTopTagsFromSearch(highlightedList) : [];
        }}
        isWikiMode={isWikiMode}
        showAdvancedOptions={true}
      />

      {/* 追加ボタン */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 100
      }}>
        <button
          style={{
            padding: '12px 16px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
          onClick={handleAddEvent}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
        >
          + イベント追加
        </button>
      </div>
      
      {/* リセットボタン */}
      {onResetView && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '180px',
          zIndex: 100
        }}>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            onClick={handleResetView}
            title="初期位置に戻す"
          >
            🎯 初期位置
          </button>
        </div>
      )}

      {/* デバッグ情報 */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        padding: '8px 12px',
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        borderRadius: '4px',
        fontSize: '10px',
        fontFamily: 'monospace',
        zIndex: 100
      }}>
        📊 Events: {finalEvents.length} | 
        Timelines: {finalTimelines.length} | 
        Layout: {layoutEvents.length} | 
        Axes: {timelineAxes.length} | 
        Highlighted: {finalHighlightedEvents?.size || finalHighlightedEvents?.length || 0}
        <br />
        PanX: {Math.round(finalPanX)} | 
        PanY: {Math.round(finalPanY)} | 
        PixelsPerYear: {finalCurrentPixelsPerYear}
      </div>

      {/* モーダル */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdate={propEvents ? onEventUpdate : updateEvent}
          onDelete={propEvents ? onEventDelete : deleteEvent}
          isWikiMode={isWikiMode}
          position={modalPosition}
          timelines={finalTimelines}
        />
      )}
    </div>
  );
};

export default TimelineTab;