// src/components/common/TabSystem.js - VisualTab統合対応版
import React from 'react';
import { usePageMode } from '../../contexts/PageModeContext';

// 統合されたビジュアルタブとその他のタブコンポーネントをインポート
import VisualTab from '../tabs/VisualTab';
import TableTab from '../tabs/TableTab';
import EventEditTab from '../tabs/EventEditTab';
import RevisionTab from '../tabs/RevisionTab';

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
  coordinates, // 統合座標管理オブジェクト
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
  onEventClick,
  onTimelineClick,
  
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
    
    // VisualTab（Timeline/Network）共通のprops
    const visualProps = {
      timelineRef,
      coordinates, // 統合座標管理を使用
      highlightedEvents,
      onResetView,
      searchTerm,
      onSearchChange,
      onCreateTimeline,
      onDeleteTimeline,
      getTopTagsFromSearch,
      selectedEvent,
      selectedTimeline,
      onCloseEventModal,
      onCloseTimelineModal,
      hoveredGroup,
      setHoveredGroup
    };
    
    switch (currentTab) {
      case 'timeline':
        return (
          <VisualTab
            {...commonProps}
            {...visualProps}
            viewMode="timeline"
            onEventClick={onEventClick}
            onTimelineClick={onTimelineClick}
          />
        );
        
      case 'network':
        return (
          <VisualTab
            {...commonProps}
            {...visualProps}
            viewMode="network"
            onEventClick={onEventClick}
            onTimelineClick={onTimelineClick}
          />
        );
        
      case 'table':
        return (
          <TableTab
            {...commonProps}
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            highlightedEvents={highlightedEvents}
            selectedEvent={selectedEvent}
            selectedTimeline={selectedTimeline}
            onCloseEventModal={onCloseEventModal}
            onCloseTimelineModal={onCloseTimelineModal}
          />
        );
        
      case 'event-edit':
        return (
          <EventEditTab
            {...commonProps}
            enableLinking={true}
            showRelatedEvents={true}
            onMenuAction={onMenuAction}
          />
        );
        
      case 'revision':
        return isWikiMode ? (
          <RevisionTab 
            wikiData={wikiData}
            user={user}
            isWikiMode={isWikiMode}
            showRevisionHistory={true}
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
            {currentTab === 'network' ? '🕸️ ネットワーク' : currentTab === 'timeline' ? '📊 年表' : currentTab} タブを読み込み中...
          </div>
        }
      >
        {renderCurrentTab()}
      </React.Suspense>
    </div>
  );
};

export default TabSystem;