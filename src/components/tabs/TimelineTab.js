// src/components/tabs/TimelineTab.js - 動作版
import React, { useRef, useCallback, useState, useEffect } from 'react';
import { SearchPanel } from '../ui/SearchPanel';
import { TimelineCard } from '../ui/TimelineCard';
import { EventGroupIcon, GroupTooltip, GroupCard } from '../ui/EventGroup';
import { EventModal } from '../modals/EventModal';
import TimelineModal from '../modals/TimelineModal';

// 既存のhooksとutils
import { useTimelineLogic } from '../../hooks/useTimelineLogic';
import { TIMELINE_CONFIG } from '../../constants/timelineConfig';
import { truncateTitle } from '../../utils/timelineUtils';

const TimelineTab = ({
  isPersonalMode,
  isWikiMode,
  currentPageMode
}) => {
  // タイムライン専用の参照
  const timelineRef = useRef(null);
  
  // 既存のTimelineLogicを使用
  const timelineData = useTimelineLogic(
    timelineRef,
    { current: false }, // isDragging
    { current: 0 },     // lastMouseX
    { current: 0 },     // lastMouseY
    false              // isShiftPressed
  );
  
  // useTimelineLogicから全ての状態と関数を取得
  const {
    events,
    Timelines,
    scale,
    panX,
    panY,
    currentPixelsPerYear,
    searchTerm,
    highlightedEvents,
    selectedEvent,
    selectedTimeline,
    hoveredGroup,
    
    // 関数
    createTimeline,
    deleteTimeline,
    openNewEventModal,
    openEventModal,
    closeEventModal,
    openTimelineModal,
    closeTimelineModal,
    resetToInitialPosition,
    handleSearchChange,
    getTopTagsFromSearch,
    calculateTextWidth,
    updateEvent,
    deleteEvent,
    
    // UI状態
    isModalOpen,
    modalPosition,
    expandedGroups,
    
    // 既存のマウスハンドラー（これらは動作する）
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDoubleClick
  } = timelineData;
  
  // 拡張イベントレイアウト（簡単版）
  const layoutEvents = events.map((event, index) => {
    const baseX = (event.startDate ? 
      (event.startDate.getFullYear() - 2000) * currentPixelsPerYear + panX : 
      100 + index * 120
    );
    const baseY = TIMELINE_CONFIG.MAIN_TIMELINE_Y + (index % 3) * 60;
    
    return {
      ...event,
      adjustedPosition: { x: baseX, y: baseY },
      hiddenByGroup: false,
      calculatedWidth: calculateTextWidth ? 
        Math.max(60, calculateTextWidth(event.title || '') + 20) : 
        100,
      isGroup: false
    };
  });
  
  // イベント表示用のスタイル関数
  const getEventStyle = (event) => {
    const isHighlighted = highlightedEvents.has ? 
      highlightedEvents.has(event.id) : 
      false;
      
    return {
      position: 'absolute',
      left: `${event.adjustedPosition.x - (event.calculatedWidth || 60) / 2}px`,
      top: `${event.adjustedPosition.y - TIMELINE_CONFIG.EVENT_HEIGHT / 2 + panY}px`,
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
    const startYear = Math.floor((50 - panX) / currentPixelsPerYear);
    const endYear = Math.floor((window.innerWidth - panX) / currentPixelsPerYear);
    
    for (let year = startYear; year <= endYear; year += 5) {
      const x = (year - 2000) * currentPixelsPerYear + panX;
      if (x > 0 && x < window.innerWidth) {
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
              userSelect: 'none',
              zIndex: 5
            }}
          >
            {year}
          </div>
        );
      }
    }
    return markers;
  };
  
  // イベント処理関数（確実に動作するように修正）
  const handleEventDoubleClick = useCallback((event) => {
    console.log('🎯 Event double click:', event.title);
    if (openEventModal) {
      openEventModal(event);
    }
  }, [openEventModal]);
  
  const handleAddEvent = useCallback(() => {
    console.log('➕ Add event button clicked');
    if (openNewEventModal) {
      openNewEventModal();
    }
  }, [openNewEventModal]);
  
  const handleResetView = useCallback(() => {
    console.log('🎯 Reset view clicked');
    if (resetToInitialPosition) {
      resetToInitialPosition();
    }
  }, [resetToInitialPosition]);
  
  const handleCreateTimeline = useCallback(() => {
    console.log('📊 Create timeline clicked, highlighted:', highlightedEvents.size || 0);
    if (createTimeline) {
      createTimeline();
    }
  }, [createTimeline, highlightedEvents]);
  
  console.log('TimelineTab render:', {
    events: events?.length || 0,
    timelines: Timelines?.length || 0,
    scale,
    panX,
    panY,
    searchTerm,
    hasHandleWheel: !!handleWheel,
    hasOpenNewEventModal: !!openNewEventModal
  });
  
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
        onWheel={(e) => {
          console.log('Wheel event captured');
          if (handleWheel) handleWheel(e);
        }}
        onMouseDown={(e) => {
          console.log('Mouse down captured');
          if (handleMouseDown) handleMouseDown(e);
        }}
        onMouseMove={(e) => {
          if (handleMouseMove) handleMouseMove(e);
        }}
        onMouseUp={(e) => {
          if (handleMouseUp) handleMouseUp(e);
        }}
        onMouseLeave={(e) => {
          if (handleMouseUp) handleMouseUp(e);
        }}
        onDoubleClick={(e) => {
          console.log('Double click captured');
          if (handleDoubleClick) {
            handleDoubleClick(e);
          } else {
            // フォールバック
            handleAddEvent();
          }
        }}
      >
        {/* 年マーカー */}
        {generateYearMarkers()}
        
        {/* メインタイムライン線 */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${TIMELINE_CONFIG.MAIN_TIMELINE_Y + (panY || 0)}px`,
            height: '3px',
            backgroundColor: '#374151',
            zIndex: 1
          }}
        />
        
        {/* 年表線 */}
        {(Timelines || []).filter(t => t.isVisible !== false).map((timeline, index) => {
          const timelineY = TIMELINE_CONFIG.FIRST_ROW_Y + 
            index * TIMELINE_CONFIG.ROW_HEIGHT + (panY || 0);
          
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
          
          return (
            <div
              key={event.id}
              style={getEventStyle(event)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                console.log('Event double clicked:', event.title);
                handleEventDoubleClick(event);
              }}
              title={`${event.title}\n${event.startDate?.toLocaleDateString('ja-JP') || ''}\nダブルクリックで編集`}
            >
              {truncateTitle ? truncateTitle(event.title || '', 12) : event.title}
            </div>
          );
        })}
        
        {/* 年表カード */}
        {(Timelines || []).filter(t => t.isVisible !== false).map((timeline, index) => {
          const timelineY = TIMELINE_CONFIG.FIRST_ROW_Y + 
            index * TIMELINE_CONFIG.ROW_HEIGHT;
          
          return (
            <TimelineCard
              key={timeline.id}
              timeline={timeline}
              position={{ x: 50, y: timelineY }}
              panY={panY || 0}
              onDeleteTimeline={(timelineId) => {
                console.log('🗑️ Delete timeline:', timelineId);
                if (deleteTimeline) deleteTimeline(timelineId);
              }}
              onClick={(timeline) => {
                console.log('📊 Timeline clicked:', timeline.name);
                if (openTimelineModal) openTimelineModal(timeline);
              }}
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
            panY={panY || 0}
          />
        )}
      </div>
      
      {/* フローティングパネル - 機能確認用 */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 100
      }}>
        <button
          style={{
            padding: '12px 24px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onClick={handleAddEvent}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#059669';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#10b981';
            e.target.style.transform = 'translateY(0)';
          }}
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
            padding: '10px 16px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
          onClick={handleResetView}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#4b5563'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#6b7280'}
          title="初期位置に戻す"
        >
          🎯 初期位置
        </button>
      </div>
      
      {/* 操作テストパネル */}
      <div style={{
        position: 'absolute',
        top: '80px',
        right: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontSize: '12px',
        zIndex: 100,
        minWidth: '200px'
      }}>
        <div style={{ fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
          🔧 操作テスト
        </div>
        <div style={{ marginBottom: '4px', color: '#374151' }}>
          ズーム: {scale ? (scale / 2.5).toFixed(1) : '?'}x
        </div>
        <div style={{ marginBottom: '4px', color: '#374151' }}>
          パン: X={Math.round(panX || 0)}, Y={Math.round(panY || 0)}
        </div>
        <div style={{ marginBottom: '8px', color: '#374151' }}>
          選択中: {highlightedEvents?.size || 0} 件
        </div>
        
        {/* クイックアクション */}
        <div style={{ display: 'flex', gap: '4px', flexDirection: 'column' }}>
          <button
            style={{
              padding: '6px 12px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
              width: '100%'
            }}
            onClick={handleCreateTimeline}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            📊 年表作成テスト
          </button>
          
          <button
            style={{
              padding: '6px 12px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
              width: '100%'
            }}
            onClick={() => {
              console.log('🔍 検索テスト: 建築');
              if (handleSearchChange) {
                handleSearchChange({ target: { value: '建築' } });
              }
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#4b5563'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#6b7280'}
          >
            🔍 検索テスト (建築)
          </button>
        </div>
      </div>
      
      {/* Wiki/個人モードインジケーター */}
      {isWikiMode && (
        <div style={{
          position: 'absolute',
          bottom: '100px',
          right: '20px',
          padding: '6px 12px',
          backgroundColor: '#3b82f6',
          color: 'white',
          borderRadius: '12px',
          fontSize: '12px',
          zIndex: 100,
          fontWeight: '500'
        }}>
          📚 Wiki モード
        </div>
      )}
      
      {/* 検索パネル */}
      <SearchPanel
        searchTerm={searchTerm || ''}
        highlightedEvents={highlightedEvents || new Set()}
        timelines={Timelines || []}
        onSearchChange={(e) => {
          console.log('🔍 Search change:', e.target.value);
          if (handleSearchChange) handleSearchChange(e);
        }}
        onCreateTimeline={handleCreateTimeline}
        onDeleteTimeline={(timelineId) => {
          console.log('🗑️ SearchPanel: Delete timeline', timelineId);
          if (deleteTimeline) deleteTimeline(timelineId);
        }}
        getTopTagsFromSearch={getTopTagsFromSearch}
        isWikiMode={isWikiMode}
        showAdvancedOptions={true}
      />
      
      {/* モーダル */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => {
            console.log('❌ Close event modal');
            if (closeEventModal) closeEventModal();
          }}
          onUpdate={(updatedEvent) => {
            console.log('💾 Update event:', updatedEvent.title);
            if (updateEvent) updateEvent(updatedEvent);
          }}
          onDelete={(eventId) => {
            console.log('🗑️ Delete event:', eventId);
            if (deleteEvent) deleteEvent(eventId);
          }}
          isWikiMode={isWikiMode}
          position={modalPosition}
          timelines={Timelines || []}
        />
      )}
      
      {selectedTimeline && (
        <TimelineModal
          timeline={selectedTimeline}
          onClose={() => {
            console.log('❌ Close timeline modal');
            if (closeTimelineModal) closeTimelineModal();
          }}
          onUpdate={(updatedTimeline) => {
            console.log('💾 Update timeline:', updatedTimeline.name);
            // updateTimeline function implementation
          }}
          onDelete={(timelineId) => {
            console.log('🗑️ Delete timeline:', timelineId);
            if (deleteTimeline) deleteTimeline(timelineId);
          }}
          isWikiMode={isWikiMode}
        />
      )}
      
      {/* デバッグ情報（詳細版） */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        padding: '8px 12px',
        backgroundColor: 'rgba(0,0,0,0.9)',
        color: 'white',
        borderRadius: '6px',
        fontSize: '11px',
        fontFamily: 'monospace',
        zIndex: 100,
        maxWidth: '400px'
      }}>
        📊 Timeline統合状況:<br/>
        Events: {events?.length || 0} | 
        Timelines: {Timelines?.length || 0} | 
        Highlighted: {highlightedEvents?.size || 0}<br/>
        Scale: {scale ? (scale/2.5).toFixed(1) : '?'}x | 
        Pan: ({Math.round(panX || 0)}, {Math.round(panY || 0)})<br/>
        Search: "{searchTerm || ''}" | 
        Modal: {isModalOpen ? 'Open' : 'Closed'}<br/>
        Functions: Wheel={!!handleWheel} | 
        AddEvent={!!openNewEventModal} | 
        Search={!!handleSearchChange}
      </div>
    </div>
  );
};

export default TimelineTab;