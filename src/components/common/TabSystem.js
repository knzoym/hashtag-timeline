// src/components/common/TabSystem.js - 一時年表対応版
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
  tempTimelines, // 新規：一時年表
  user,
  onEventUpdate,
  onEventDelete,
  onTimelineUpdate,
  onEventAdd,
  
  // Timeline/Network固有
  timelineRef,
  coordinates,
  highlightedEvents,
  searchTerm,
  
  // Wiki関連
  wikiData,
  showPendingEvents,
  
  // その他のハンドラー
  onResetView,
  onMenuAction,
  onSearchChange,
  onTimelineCreate,
  onCreateTempTimeline, // 新規：一時年表作成
  onTimelineDelete,
  onDeleteTempTimeline, // 新規：一時年表削除
  onSaveTempTimelineToPersonal, // 新規：個人ファイル保存
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
  
  console.log('TabSystem props check:', {
    onEventAdd: !!onEventAdd,
    onTimelineCreate: !!onTimelineCreate,
    onCreateTempTimeline: !!onCreateTempTimeline,
    tempTimelines: tempTimelines?.length,
    currentTab
  });
  
  // 現在のタブに応じてコンポーネントを選択
  const renderCurrentTab = () => {
    const commonProps = {
      events,
      timelines,
      tempTimelines,
      user,
      onEventUpdate,
      onEventDelete,
      onTimelineUpdate,
      isPersonalMode,
      isWikiMode,
      currentPageMode
    };
    
    // VisualTab（Timeline/Network）共通のprops
    const visualProps = {
      // App.jsからの操作関数を正しく渡す
      onAddEvent: onEventAdd,
      onCreateTimeline: onTimelineCreate,
      onCreateTempTimeline: onCreateTempTimeline, // 新規追加
      onDeleteTimeline: onTimelineDelete,
      onDeleteTempTimeline: onDeleteTempTimeline, // 新規追加
      onSaveTempTimelineToPersonal: onSaveTempTimelineToPersonal, // 新規追加
      onEventClick,
      onTimelineClick,
      
      timelineRef,
      coordinates,
      highlightedEvents,
      onResetView,
      searchTerm,
      onSearchChange,
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
        console.log('TabSystem: timeline tab - passing props:', {
          onAddEvent: !!visualProps.onAddEvent,
          onCreateTimeline: !!visualProps.onCreateTimeline,
          onCreateTempTimeline: !!visualProps.onCreateTempTimeline,
          tempTimelines: tempTimelines?.length
        });
        return (
          <VisualTab
            {...commonProps}
            {...visualProps}
            viewMode="timeline"
          />
        );
        
      case 'network':
        console.log('TabSystem: network tab - passing props:', {
          onAddEvent: !!visualProps.onAddEvent,
          onCreateTimeline: !!visualProps.onCreateTimeline,
          onCreateTempTimeline: !!visualProps.onCreateTempTimeline,
          tempTimelines: tempTimelines?.length
        });
        return (
          <VisualTab
            {...commonProps}
            {...visualProps}
            viewMode="network"
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
            {...commonProps}
            wikiData={wikiData}
            showPendingEvents={showPendingEvents}
          />
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '400px',
            color: '#6b7280',
            fontSize: '16px'
          }}>
            更新タブはWikiモードでのみ利用可能です
          </div>
        );
        
      default:
        return (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '400px',
            color: '#6b7280',
            fontSize: '16px'
          }}>
            タブが見つかりません
          </div>
        );
    }
  };
  
  return renderCurrentTab();
};

export default TabSystem;