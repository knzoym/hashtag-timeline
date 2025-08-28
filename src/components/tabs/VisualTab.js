// src/components/tabs/VisualTab.js - TimelineTab と NetworkTab の統合版
import React from 'react';
import UnifiedTimelineView from './UnifiedTimelineView';
import EventModal from '../modals/EventModal';
import TimelineModal from '../modals/TimelineModal';

const VisualTab = ({
  // データ
  events = [],
  timelines = [],
  user,
  isPersonalMode,
  isWikiMode,
  currentPageMode,
  
  // 表示モード（'timeline' または 'network'）
  viewMode = 'timeline',
  
  // 座標系（統合版）
  timelineRef,
  coordinates,
  
  // イベント操作
  onEventUpdate,
  onEventDelete,
  onAddEvent,
  
  // タイムライン操作
  onTimelineUpdate,
  onCreateTimeline,
  onDeleteTimeline,
  
  // 表示制御
  highlightedEvents = [],
  searchTerm = '',
  onSearchChange,
  getTopTagsFromSearch,
  
  // モーダル
  selectedEvent,
  selectedTimeline,
  onCloseEventModal,
  onCloseTimelineModal,
  
  // ホバー
  hoveredGroup,
  setHoveredGroup,
  
  // その他
  onResetView
}) => {
  
  const isNetworkMode = viewMode === 'network';
  
  const styles = {
    container: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      position: 'relative'
    },
    header: {
      padding: '12px 16px',
      backgroundColor: '#f8fafc',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    modeInfo: {
      fontSize: '12px',
      color: '#6b7280',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    viewContainer: {
      flex: 1,
      position: 'relative',
      overflow: 'hidden'
    }
  };
  
  return (
    <div style={styles.container}>
      {/* モード表示ヘッダー */}
      <div style={styles.header}>
        <div style={styles.modeInfo}>
          {isNetworkMode ? (
            <>
              🕸️ ネットワークビュー | 
              イベント: {events.length} | 
              年表: {timelines.length} | 
              複数接続表示
            </>
          ) : (
            <>
              📊 年表ビュー | 
              イベント: {events.length} | 
              年表: {timelines.length}
            </>
          )}
        </div>
      </div>
      
      {/* 統合タイムライン表示エリア */}
      <div style={styles.viewContainer}>
        <UnifiedTimelineView
          ref={timelineRef}
          events={events}
          timelines={timelines}
          coordinates={coordinates}
          highlightedEvents={highlightedEvents}
          hoveredGroup={hoveredGroup}
          setHoveredGroup={setHoveredGroup}
          onAddEvent={onAddEvent}
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          getTopTagsFromSearch={getTopTagsFromSearch}
          onCreateTimeline={onCreateTimeline}
          onDeleteTimeline={onDeleteTimeline}
          onResetView={onResetView}
          isPersonalMode={isPersonalMode}
          isWikiMode={isWikiMode}
          isNetworkMode={isNetworkMode}
          showMultipleConnections={isNetworkMode}
        />
      </div>
      
      {/* イベントモーダル */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          timelines={timelines}
          onUpdate={onEventUpdate}
          onDelete={onEventDelete}
          onClose={onCloseEventModal}
          isPersonalMode={isPersonalMode}
          isWikiMode={isWikiMode}
        />
      )}
      
      {/* タイムラインモーダル */}
      {selectedTimeline && (
        <TimelineModal
          timeline={selectedTimeline}
          events={events}
          onUpdate={(updatedTimelines) => {
            console.log(`${isNetworkMode ? 'Network' : 'Timeline'}Tab: Timeline updated`, updatedTimelines);
            onTimelineUpdate(updatedTimelines);
          }}
          onDelete={onDeleteTimeline}
          onClose={onCloseTimelineModal}
          isPersonalMode={isPersonalMode}
          isWikiMode={isWikiMode}
        />
      )}
    </div>
  );
};

export default VisualTab;