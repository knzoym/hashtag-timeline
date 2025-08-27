// src/components/common/TabSystem.js - TimelineTab統合版
import React from 'react';
import { usePageMode } from '../../contexts/PageModeContext';

// 実際のタブコンポーネントをインポート
import TimelineTab from '../tabs/TimelineTab';

// 他のタブは段階的に統合（まずはプレースホルダー）
const PlaceholderTab = ({ tabName, ...props }) => (
  <div style={{
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    padding: '40px',
    color: '#6b7280',
    fontSize: '16px',
    gap: '16px'
  }}>
    <div style={{ fontSize: '48px' }}>🚧</div>
    <div>📋 {tabName} タブ</div>
    <div style={{ fontSize: '14px', textAlign: 'center', maxWidth: '400px' }}>
      このタブは現在統合中です。TimelineTabの統合が完了次第、順次実装します。
    </div>
    <div style={{ 
      fontSize: '12px', 
      fontFamily: 'monospace',
      backgroundColor: '#f3f4f6',
      padding: '8px 12px',
      borderRadius: '4px'
    }}>
      受信Props: {Object.keys(props).length} 個 | 
      Events: {props.events?.length || 0} | 
      Timelines: {props.timelines?.length || 0}
    </div>
  </div>
);

const TabSystem = ({ 
  // 共通のデータとハンドラー
  events,
  timelines,
  user,
  onEventUpdate,
  onEventDelete,
  onTimelineUpdate,
  onAddEvent,
  
  // Timeline/Network固有
  timelineRef,
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
  searchTerm,
  
  // Wiki関連
  wikiData,
  showPendingEvents,
  
  // その他のハンドラー
  onResetView,
  onMenuAction,
  onSearchChange,
  onCreateTimeline,
  onDeleteTimeline,
  getTopTagsFromSearch,
  
  // モーダル関連
  selectedEvent,
  selectedTimeline,
  onCloseEventModal,
  onCloseTimelineModal,
  hoveredGroup,
  setHoveredGroup
}) => {
  const {
    currentTab,
    currentPageMode,
    getPageModeInfo
  } = usePageMode();
  
  const { isPersonalMode, isWikiMode } = getPageModeInfo();
  
  // 現在のタブに応じてコンポーネントを選択
  const renderCurrentTab = () => {
    const commonProps = {
      events,
      timelines,
      user,
      onEventUpdate,
      onEventDelete,
      onTimelineUpdate,
      onAddEvent,
      isPersonalMode,
      isWikiMode,
      currentPageMode
    };
    
    switch (currentTab) {
      case 'timeline':
        return (
          <TimelineTab
            {...commonProps}
            timelineRef={timelineRef}
            scale={scale}
            panX={panX}
            panY={panY}
            currentPixelsPerYear={currentPixelsPerYear}
            onWheel={onWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onDoubleClick={onDoubleClick}
            highlightedEvents={highlightedEvents}
            onResetView={onResetView}
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            onCreateTimeline={onCreateTimeline}
            onDeleteTimeline={onDeleteTimeline}
            getTopTagsFromSearch={getTopTagsFromSearch}
            selectedEvent={selectedEvent}
            selectedTimeline={selectedTimeline}
            onCloseEventModal={onCloseEventModal}
            onCloseTimelineModal={onCloseTimelineModal}
            hoveredGroup={hoveredGroup}
            setHoveredGroup={setHoveredGroup}
          />
        );
        
      case 'network':
        return (
          <PlaceholderTab 
            tabName="ネットワーク" 
            {...commonProps}
            description="地下鉄路線図風のイベントネットワーク表示"
          />
        );
        
      case 'table':
        return (
          <PlaceholderTab 
            tabName="テーブル" 
            {...commonProps}
            description="イベントのテーブル表示とインライン編集"
          />
        );
        
      case 'event-edit':
        return (
          <PlaceholderTab 
            tabName="イベント編集" 
            {...commonProps}
            description="Scrapbox風のイベント詳細編集"
          />
        );
        
      case 'revision':
        return isWikiMode ? (
          <PlaceholderTab 
            tabName="更新履歴" 
            {...commonProps}
            wikiData={wikiData}
            description="Wikiの編集履歴と承認システム"
          />
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: '#6b7280',
            fontSize: '16px',
            gap: '16px'
          }}>
            <div>⚠️ 更新タブはWikiモード専用です</div>
            <div style={{ fontSize: '14px', textAlign: 'center', maxWidth: '400px' }}>
              Wikiページに切り替えて、コミュニティの編集履歴を確認してください。
            </div>
          </div>
        );
        
      default:
        return (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: '#ef4444',
            fontSize: '16px',
            gap: '16px'
          }}>
            <div>❌ 不明なタブ: {currentTab}</div>
            <div style={{ fontSize: '14px' }}>
              サポートされていないタブが選択されています
            </div>
          </div>
        );
    }
  };
  
  const styles = {
    container: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }
  };
  
  return (
    <div style={styles.container}>
      <React.Suspense 
        fallback={
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            📊 {currentTab} タブを読み込み中...
          </div>
        }
      >
        {renderCurrentTab()}
      </React.Suspense>
    </div>
  );
};

export default TabSystem;