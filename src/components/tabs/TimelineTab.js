// src/components/tabs/TimelineTab.js - 完全統合版
import React, { useRef, useCallback, useMemo } from 'react';
import { SearchPanel } from '../ui/SearchPanel';
import { TimelineCard } from '../ui/TimelineCard';
import { EventModal } from '../modals/EventModal';
import { TIMELINE_CONFIG } from '../../constants/timelineConfig';
import { truncateTitle } from '../../utils/timelineUtils';

const TimelineTab = ({
  // TabSystemからの必須データ（これが唯一のデータソース）
  events,
  timelines,
  user,
  onEventUpdate,
  onEventDelete,
  onTimelineUpdate,
  onAddEvent,
  isPersonalMode,
  isWikiMode,
  
  // Timeline固有のprops
  timelineRef: externalTimelineRef,
  scale,
  panX,
  panY,
  currentPixelsPerYear,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onDoubleClick,
  highlightedEvents,
  onResetView,
  
  // 検索・年表関連
  searchTerm,
  onSearchChange,
  onCreateTimeline,
  onDeleteTimeline,
  getTopTagsFromSearch
}) => {
  // 内部参照のみ
  const internalTimelineRef = useRef(null);
  const timelineRef = externalTimelineRef || internalTimelineRef;

  // ローカル状態（UI用のみ）
  const [selectedEvent, setSelectedEvent] = React.useState(null);

  // データの安全性チェック
  const safeEvents = events || [];
  const safeTimelines = timelines || [];
  const safeHighlightedEvents = highlightedEvents || new Set();
  const safeSearchTerm = searchTerm || '';
  
  // 座標系のデフォルト値
  const finalPanX = panX !== undefined ? panX : 0;
  const finalPanY = panY !== undefined ? panY : 0;
  const finalCurrentPixelsPerYear = currentPixelsPerYear || 50;

  console.log('TimelineTab render:', {
    events: safeEvents.length,
    timelines: safeTimelines.length,
    panX: finalPanX,
    panY: finalPanY,
    pixelsPerYear: finalCurrentPixelsPerYear,
    highlighted: safeHighlightedEvents.size || safeHighlightedEvents.length || 0
  });

  // 年からX座標を計算
  const getXFromYear = useCallback((year) => {
    return (year - 1900) * finalCurrentPixelsPerYear + finalPanX;
  }, [finalCurrentPixelsPerYear, finalPanX]);

  // テキスト幅計算
  const calculateTextWidth = useCallback((text, fontSize = 11) => {
    try {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      context.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      return context.measureText(text || '').width;
    } catch (error) {
      console.warn('calculateTextWidth エラー:', error);
      return (text?.length || 0) * 8;
    }
  }, []);

  // 年マーカー生成
  const generateYearMarkers = useCallback(() => {
    const markers = [];
    const viewportWidth = window.innerWidth;
    const startYear = Math.floor((0 - finalPanX) / finalCurrentPixelsPerYear) - 1;
    const endYear = Math.floor((viewportWidth - finalPanX) / finalCurrentPixelsPerYear) + 1;
    
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

  // イベントレイアウト計算
  const layoutEvents = useMemo(() => {
    if (!safeEvents || safeEvents.length === 0) {
      console.log('イベントなし');
      return [];
    }

    console.log(`イベントレイアウト開始: ${safeEvents.length}件`);
    
    const results = [];
    const occupiedPositions = new Map();

    // 年表に属するイベントIDを収集
    const timelineEventIds = new Set();
    safeTimelines.forEach(timeline => {
      if (timeline.isVisible !== false) {
        (timeline.events || []).forEach(event => timelineEventIds.add(event.id));
        (timeline.temporaryEvents || []).forEach(event => timelineEventIds.add(event.id));
      }
    });

    // 全イベントを処理
    const sortedEvents = [...safeEvents].sort((a, b) => {
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
      const textWidth = calculateTextWidth(event.title || "", 11);
      const eventWidth = Math.max(80, textWidth + 20);

      let eventY;
      let timelineIndex = -1;

      // 年表に属するかチェック
      if (timelineEventIds.has(event.id)) {
        // 属する年表のインデックスを取得
        timelineIndex = safeTimelines.findIndex(timeline => {
          if (timeline.isVisible === false) return false;
          return (timeline.events || []).some(e => e.id === event.id) ||
                 (timeline.temporaryEvents || []).some(e => e.id === event.id);
        });

        if (timelineIndex >= 0) {
          // 年表線の位置に配置
          eventY = TIMELINE_CONFIG.FIRST_ROW_Y + timelineIndex * TIMELINE_CONFIG.ROW_HEIGHT;
          console.log(`年表イベント "${event.title}" → 年表 ${timelineIndex} (Y=${eventY})`);
        } else {
          // 年表に属しているはずだが見つからない場合はメイン線に
          eventY = TIMELINE_CONFIG.MAIN_TIMELINE_Y;
        }
      } else {
        // メインタイムライン上で重複回避
        let level = 0;
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
        console.log(`メインイベント "${event.title}" → level ${level} (Y=${eventY})`);
      }

      results.push({
        ...event,
        adjustedPosition: { x: eventX, y: eventY },
        calculatedWidth: eventWidth,
        timelineIndex,
        isOnTimeline: timelineIndex >= 0
      });
    });

    console.log(`レイアウト完了: ${results.length}件`);
    return results;
  }, [safeEvents, safeTimelines, getXFromYear, calculateTextWidth]);

  // 年表軸の計算
  const timelineAxes = useMemo(() => {
    if (!safeTimelines || safeTimelines.length === 0) {
      console.log('年表なし');
      return [];
    }

    const axes = safeTimelines
      .filter(timeline => {
        const hasEvents = (timeline.events?.length || 0) > 0 || 
                         (timeline.temporaryEvents?.length || 0) > 0;
        const isVisible = timeline.isVisible !== false;
        return hasEvents && isVisible;
      })
      .map((timeline, index) => {
        const axisY = TIMELINE_CONFIG.FIRST_ROW_Y + index * TIMELINE_CONFIG.ROW_HEIGHT;
        
        const allEvents = [...(timeline.events || []), ...(timeline.temporaryEvents || [])];
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
  }, [safeTimelines, getXFromYear]);

  // 年表作成ハンドラー
  const handleCreateTimeline = useCallback(() => {
    console.log('年表作成開始');
    
    let highlightedEventsList = [];
    if (safeHighlightedEvents?.has) {
      highlightedEventsList = safeEvents.filter(event => 
        safeHighlightedEvents.has(event.id)
      );
    } else if (Array.isArray(safeHighlightedEvents)) {
      highlightedEventsList = safeEvents.filter(event => 
        safeHighlightedEvents.includes(event.id)
      );
    }
    
    console.log(`ハイライト済みイベント: ${highlightedEventsList.length}件`);
    
    if (highlightedEventsList.length === 0) {
      alert("検索でイベントを選択してから年表を作成してください");
      return;
    }

    // 上位コンポーネントの年表作成関数を呼び出し
    if (onCreateTimeline) {
      onCreateTimeline(highlightedEventsList);
    }
  }, [safeEvents, safeHighlightedEvents, onCreateTimeline]);

  // イベントクリック
  const handleEventClick = useCallback((event) => {
    console.log('イベントクリック:', event.title);
    setSelectedEvent(event);
  }, []);

  // 追加ボタン
  const handleAddEvent = useCallback(() => {
    console.log('イベント追加');
    if (onAddEvent) {
      onAddEvent();
    }
  }, [onAddEvent]);

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
              timeline={safeTimelines.find(t => t.id === axis.id)}
              compact={true}
              onClick={() => console.log('年表カードクリック')}
              onToggleVisibility={() => onDeleteTimeline && onDeleteTimeline(axis.id)}
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
              Events: {safeEvents.length}件読み込み済み
            </div>
          </div>
        ) : (
          layoutEvents.map((event) => {
            const eventX = event.adjustedPosition.x;
            const eventY = event.adjustedPosition.y + finalPanY;
            const isHighlighted = safeHighlightedEvents?.has ? 
              safeHighlightedEvents.has(event.id) : 
              safeHighlightedEvents?.includes && safeHighlightedEvents.includes(event.id);

            // 年表に属する場合は年表の色を使用
            let borderColor = '#6b7280';
            if (event.isOnTimeline && event.timelineIndex >= 0) {
              const timeline = safeTimelines[event.timelineIndex];
              borderColor = timeline?.color || '#6b7280';
            }

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
                  border: `2px solid ${isHighlighted ? '#f59e0b' : borderColor}`,
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
        searchTerm={safeSearchTerm}
        highlightedEvents={safeHighlightedEvents}
        timelines={safeTimelines}
        onSearchChange={onSearchChange}
        onCreateTimeline={handleCreateTimeline}
        onDeleteTimeline={onDeleteTimeline}
        getTopTagsFromSearch={() => {
          if (!getTopTagsFromSearch) return [];
          const highlightedList = safeEvents.filter(event => 
            safeHighlightedEvents?.has?.(event.id) || 
            safeHighlightedEvents?.includes?.(event.id)
          );
          return getTopTagsFromSearch(highlightedList);
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
            onClick={onResetView}
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
        📊 Events: {safeEvents.length} | 
        Timelines: {safeTimelines.length} | 
        Layout: {layoutEvents.length} | 
        Axes: {timelineAxes.length} | 
        Highlighted: {safeHighlightedEvents?.size || safeHighlightedEvents?.length || 0}
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
          onUpdate={onEventUpdate}
          onDelete={onEventDelete}
          isWikiMode={isWikiMode}
          timelines={safeTimelines}
        />
      )}
    </div>
  );
};

export default TimelineTab;