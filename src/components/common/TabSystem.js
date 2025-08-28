// src/components/common/TabSystem.js - 無限レンダリング修正版
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
  tempTimelines,
  user,
  onEventUpdate,
  onEventDelete,
  onTimelineUpdate,
  onEventAdd,
  
  // Timeline/Network固有（coordinatesは完全削除）
  timelineRef,
  highlightedEvents,
  searchTerm,
  
  // Wiki関連
  wikiData,
  showPendingEvents,
  
  // その他のハンドラー
  onMenuAction,
  onSearchChange,
  onTimelineCreate,
  onCreateTempTimeline,
  onTimelineDelete,
  onDeleteTempTimeline,
  onSaveTempTimelineToPersonal,
  getTopTagsFromSearch,
  onEventClick,
  onTimelineClick,
  
  // モーダル関連
  selectedEvent,
  selectedTimeline,
  onCloseEventModal,
  onCloseTimelineModal,
  hoveredGroup,
  setHoveredGroup,

  // 承認システム
  onApprovalAction,
}) => {
  const {
    currentTab,
    currentPageMode,
    getPageModeInfo
  } = usePageMode();
  
  const { isPersonalMode, isWikiMode } = getPageModeInfo;
  
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
      onCreateTempTimeline: onCreateTempTimeline,
      onDeleteTimeline: onTimelineDelete,
      onDeleteTempTimeline: onDeleteTempTimeline,
      onSaveTempTimelineToPersonal: onSaveTempTimelineToPersonal,
      onEventClick,
      onTimelineClick,
      
      // coordinatesの代わりにrefのみを渡す
      timelineRef,
      highlightedEvents,
      searchTerm,
      onSearchChange,
      getTopTagsFromSearch,
      selectedEvent,
      selectedTimeline,
      onCloseEventModal,
      onCloseTimelineModal,
      hoveredGroup,
      setHoveredGroup,

      // Wiki関連
      showPendingEvents,
      wikiData,
      onApprovalAction,
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