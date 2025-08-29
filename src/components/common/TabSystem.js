// src/components/common/TabSystem.js - viewMode修正版
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
  
  // Timeline/Network固有
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
  onTimelineDelete,
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
  
  // 修正: 関数として呼び出し
  const { isPersonalMode, isWikiMode } = getPageModeInfo();
  
  console.log('TabSystem rendering:', {
    currentTab,
    currentPageMode,
    eventsCount: events?.length || 0,
    timelinesCount: timelines?.length || 0
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
      ...commonProps,
      onAddEvent: onEventAdd,
      onCreateTimeline: onTimelineCreate,
      onDeleteTimeline: onTimelineDelete,
      onEventClick,
      onTimelineClick,
      
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
    
    try {
      switch (currentTab) {
        case 'timeline':
          console.log('Rendering timeline tab with viewMode=timeline');
          return (
            <VisualTab
              {...visualProps}
              viewMode="timeline"
            />
          );
          
        case 'network':
          console.log('Rendering network tab with viewMode=network');
          return (
            <VisualTab
              {...visualProps}
              viewMode="network"
            />
          );
          
        case 'table':
          return (
            <TableTab
              {...commonProps}
              onEventClick={onEventClick}
              onTimelineClick={onTimelineClick}
            />
          );
          
        case 'event-edit':
          return (
            <EventEditTab
              {...commonProps}
              selectedEvent={selectedEvent}
              onEventSelect={onEventClick}
            />
          );
          
        case 'revision':
          // Wiki専用タブ
          if (!isWikiMode) {
            return (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280'
              }}>
                更新タブはWikiモード専用です
              </div>
            );
          }
          
          return (
            <RevisionTab
              user={user}
              wikiData={wikiData}
              isWikiMode={isWikiMode}
            />
          );
          
        default:
          return (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
              fontSize: '16px'
            }}>
              タブ「{currentTab}」が見つかりません
            </div>
          );
      }
    } catch (error) {
      console.error('タブレンダリングエラー:', error);
      return (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: '#dc2626',
          fontSize: '16px',
          gap: '10px'
        }}>
          <div>タブの表示中にエラーが発生しました</div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            {error.message}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            再読み込み
          </button>
        </div>
      );
    }
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {renderCurrentTab()}
    </div>
  );
};

export default TabSystem;