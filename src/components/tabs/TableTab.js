// src/components/tabs/TimelineTab.js - 既存機能を統合した実装版
import React, { useRef, useCallback, useState, useEffect } from 'react';
import { SearchPanel } from '../ui/SearchPanel';
import { TimelineCard } from '../ui/TimelineCard';
import { EventGroupIcon, GroupTooltip, GroupCard } from '../ui/EventGroup';
import { EventModal } from '../modals/EventModal';
import { TimelineModal } from '../modals/TimelineModal';

// 既存のhooksとutils（そのまま使用）
import { useTimelineLogic } from '../../hooks/useTimelineLogic';
import { useDragDrop } from '../../hooks/useDragDrop';
import { createTimelineStyles } from '../../styles/timelineStyles';
import { TIMELINE_CONFIG } from '../../constants/timelineConfig';
import { extractTagsFromDescription, truncateTitle } from '../../utils/timelineUtils';

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
  // タイムライン専用の参照（外部から提供されない場合）
  const internalTimelineRef = useRef(null);
  const timelineRef = externalTimelineRef || internalTimelineRef;
  
  // ドラッグ状態管理
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouseX, setLastMouseX] = useState(0);
  const [lastMouseY, setLastMouseY] = useState(0);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  
  // 既存のTimelineLogicを使用（propsがある場合は上書き）
  const {
    events,
    setEvents,
    Timelines,
    setCreatedTimelines,
    scale,
    setScale,
    panX,
    setPanX,
    panY,
    setPanY,
    currentPixelsPerYear,
    searchTerm,
    setSearchTerm,
    highlightedEvents,
    setHighlightedEvents,
    selectedEvent,
    setSelectedEvent,
    selectedTimeline,
    setSelectedTimeline,
    hoveredGroup,
    setHoveredGroup,
    
    // 関数
    addEvent,
    updateEvent,
    deleteEvent,
    createTimeline,
    deleteTimeline,
    updateTimeline,
    openNewEventModal,
    openEventModal,
    closeEventModal,
    openTimelineModal,
    closeTimelineModal,
    resetToInitialPosition,
    handleSearchChange,
    getTopTagsFromSearch,
    calculateTextWidth,
    
    // その他のUI状態
    isModalOpen,
    modalPosition,
    editingEvent,
    newEvent,
    handleEventChange,
    saveEvent,
    closeModal,
    expandedGroups,
    setExpandedGroups,
    groupManager
  } = useTimelineLogic(timelineRef, { current: isDragging }, { current: lastMouseX }, { current: lastMouseY }, isShiftPressed);
  
  // Props優先でデータを上書き（外部状態がある場合）
  const finalEvents = propEvents || events;
  const finalTimelines = propTimelines || Timelines;
  const finalHighlightedEvents = propHighlightedEvents || highlightedEvents;
  const finalSearchTerm = propSearchTerm !== undefined ? propSearchTerm : searchTerm;
  
  // ドラッグ&ドロップ機能
  const {
    dragState,
    handleMouseDown: handleDragMouseDown,
    handleMouseMove: handleDragMouseMove,
    handleMouseUp: handleDragMouseUp,
    isDragging: isDragActive,
  } = useDragDrop(
    (eventId, newY, conflictingEvents) => {
      console.log(`Move event ${eventId} to Y=${newY}`);
    },
    (timelineId, newY) => {
      console.log(`Move timeline ${timelineId} to Y=${newY}`);
    },
    (event, timelineId) => {
      console.log(`Add event ${event.title} to timeline ${timelineId}`);
    },
    (timelineId, eventId) => {
      console.log(`Remove event ${eventId} from timeline ${timelineId}`);
    }
  );
  
  // スタイル
  const styles = createTimelineStyles();
  
  // 拡張イベントレイアウト（簡略化）
  const layoutEvents = finalEvents.map((event, index) => ({
    ...event,
    adjustedPosition: {
      x: 100 + (index % 10) * 120, // 仮のレイアウト
      y: TIMELINE_CONFIG.MAIN_TIMELINE_Y + Math.floor(index / 10) * 60
    },
    hiddenByGroup: false,
    calculatedWidth: calculateTextWidth ? 
      calculateTextWidth(event.title || '') + 20 : 
      120
  }));
  
  // イベント表示用のスタイル関数
  const getEventStyle = (event) => {
    const isHighlighted = Array.isArray(finalHighlightedEvents) ? 
      finalHighlightedEvents.includes(event.id) : 
      finalHighlightedEvents.has(event.id);
      
    return {
      position: 'absolute',
      left: `${event.adjustedPosition.x - (event.calculatedWidth || 60) / 2}px`,
      top: `${event.adjustedPosition.y - TIMELINE_CONFIG.EVENT_HEIGHT / 2 + (propPanY || panY)}px`,
      width: `${event.calculatedWidth || 60}px`,
      height: `${TIMELINE_CONFIG.EVENT_HEIGHT}px`,
      backgroundColor: isHighlighted ? '#fef3c7' : '#ffffff',
      border: `2px solid ${isHighlighted ? '#f59e0b' : '#e5e7eb'}`,
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: '11px',
      fontWeight: '500',
      color: '#374151',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      zIndex: isHighlighted ? 10 : 2,
      transition: 'all 0.2s ease',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      padding: '0 8px'
    };
  };
  
  // 年マーカー生成
  const generateYearMarkers = () => {
    const markers = [];
    const currentPanX = propPanX !== undefined ? propPanX : panX;
    const currentPixels = propCurrentPixelsPerYear || currentPixelsPerYear;
    const startYear = Math.floor((0 - currentPanX) / currentPixels) - 1;
    const endYear = Math.floor((window.innerWidth - currentPanX) / currentPixels) + 1;
    
    for (let year = startYear; year <= endYear; year += 10) {
      const x = year * currentPixels + currentPanX;
      if (x > -100 && x < window.innerWidth + 100) {
        markers.push(
          <div
            key={year}
            style={{
              position: 'absolute',
              left: `${x}px`,
              top: '20px',
              fontSize: '12px',
              color: '#6b7280',
              fontWeight: '500',
              pointerEvents: 'none',
              userSelect: 'none'
            }}
          >
            {year}
          </div>
        );
      }
    }
    return markers;
  };
  
  // イベント処理関数
  const handleEventDoubleClick = (event) => {
    if (onDoubleClick) {
      onDoubleClick(event);
    } else {
      openEventModal(event);
    }
  };
  
  const handleAddEvent = () => {
    if (onAddEvent) {
      onAddEvent();
    } else {
      openNewEventModal();
    }
  };
  
//   const handleSearchChange = (e) => {
//     if (onSearchChange) {
//       onSearchChange(e);
//     } else {
//       handleSearchChange(e);
//     }
//   };
  
  const handleResetView = () => {
    if (onResetView) {
      onResetView();
    } else {
      resetToInitialPosition();
    }
  };
  
  // キーボードイベント
  useEffect(() => {
    const handleKeyDown = (e) => {
      setIsShiftPressed(e.shiftKey);
    };
    
    const handleKeyUp = (e) => {
      setIsShiftPressed(e.shiftKey);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
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
          cursor: isDragActive ? 'grabbing' : 'grab',
          backgroundColor: '#f8fafc'
        }}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
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
            top: `${TIMELINE_CONFIG.MAIN_TIMELINE_Y + (propPanY || panY)}px`,
            height: '2px',
            backgroundColor: '#374151',
            zIndex: 1
          }}
        />
        
        {/* 年表線 */}
        {finalTimelines.filter(t => t.isVisible !== false).map((timeline, index) => {
          const timelineY = TIMELINE_CONFIG.FIRST_ROW_Y + 
            index * TIMELINE_CONFIG.ROW_HEIGHT + 
            (propPanY || panY);
          
          return (
            <div
              key={`timeline-${timeline.id}`}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${timelineY}px`,
                height: '3px',
                backgroundColor: timeline.color || '#e5e7eb',
                zIndex: 1
              }}
            />
          );
        })}
        
        {/* イベント表示 */}
        {layoutEvents.map((event) => {
          if (event.hiddenByGroup) return null;
          
          if (event.isGroup) {
            return (
              <EventGroupIcon
                key={`group-${event.id}`}
                groupData={event.groupData}
                position={event.adjustedPosition}
                panY={propPanY || panY}
                timelineColor={event.timelineColor || '#6b7280'}
                onHover={setHoveredGroup}
                onDoubleClick={() => handleEventDoubleClick(event)}
              />
            );
          }
          
          return (
            <div
              key={event.id}
              style={getEventStyle(event)}
              onDoubleClick={() => handleEventDoubleClick(event)}
              onMouseDown={(e) => handleDragMouseDown(e, 'event', event)}
              title={`${event.title}\n${event.startDate?.toLocaleDateString('ja-JP') || ''}`}
            >
              {truncateTitle(event.title || '', 12)}
            </div>
          );
        })}
        
        {/* 年表カード */}
        {finalTimelines.filter(t => t.isVisible !== false).map((timeline, index) => {
          const timelineY = TIMELINE_CONFIG.FIRST_ROW_Y + 
            index * TIMELINE_CONFIG.ROW_HEIGHT;
          
          return (
            <TimelineCard
              key={timeline.id}
              timeline={timeline}
              position={{ x: 50, y: timelineY }}
              panY={propPanY || panY}
              onDeleteTimeline={deleteTimeline}
              onClick={() => openTimelineModal(timeline)}
            />
          );
        })}
        
        {/* グループツールチップ */}
        {hoveredGroup && (
          <GroupTooltip 
            groupData={hoveredGroup.data || hoveredGroup}
            position={{ 
              x: hoveredGroup.position?.x || 0, 
              y: hoveredGroup.position?.y || 0 
            }}
            panY={propPanY || panY}
          />
        )}
        
        {/* 展開されたグループカード */}
        {Array.from(expandedGroups).map((groupId) => {
          // グループカードの実装は後で追加
          return null;
        })}
      </div>
      
      {/* フローティングパネル */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 100
      }}>
        <button
          style={{
            padding: '10px 20px',
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
      
      {/* Wiki/個人モードインジケーター */}
      {isWikiMode && (
        <div style={{
          position: 'absolute',
          top: '70px',
          right: '20px',
          padding: '4px 12px',
          backgroundColor: '#3b82f6',
          color: 'white',
          borderRadius: '12px',
          fontSize: '12px',
          zIndex: 100
        }}>
          📚 Wiki モード
        </div>
      )}
      
      {/* 検索パネル */}
      <SearchPanel
        searchTerm={finalSearchTerm}
        highlightedEvents={finalHighlightedEvents}
        timelines={finalTimelines}
        onSearchChange={handleSearchChange}
        onCreateTimeline={createTimeline}
        onDeleteTimeline={deleteTimeline}
        getTopTagsFromSearch={getTopTagsFromSearch}
        isWikiMode={isWikiMode}
        showAdvancedOptions={true}
      />
      
      {/* モーダル */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={closeEventModal}
          onUpdate={propEvents ? onEventUpdate : updateEvent}
          onDelete={propEvents ? onEventDelete : deleteEvent}
          isWikiMode={isWikiMode}
          position={modalPosition}
          timelines={finalTimelines}
        />
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
        📊 Events: {finalEvents.length} | Timelines: {finalTimelines.length} | 
        Highlighted: {Array.isArray(finalHighlightedEvents) ? 
          finalHighlightedEvents.length : 
          finalHighlightedEvents.size || 0
        }
      </div>
    </div>
  );
};

export default TimelineTab;