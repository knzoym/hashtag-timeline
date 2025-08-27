// src/pages/App.js - 完全復活版
import React, { useRef, useCallback, useState, useEffect } from 'react';
import { PageModeProvider, usePageMode } from './contexts/PageModeContext';
import Header from './components/common/Header';
import TabSystem from './components/common/TabSystem';
import MyPage from './components/personal/MyPage';

// フック類
import { useTimelineLogic } from './hooks/useTimelineLogic';
import { useDragDrop } from './hooks/useDragDrop';
import { useAuth } from './hooks/useAuth';
import { useSupabaseSync } from './hooks/useSupabaseSync';
import { useWikiData } from './hooks/useWikiData';
import { useIsDesktop } from './hooks/useMediaQuery';

// // エラーバウンダリ
// import TimelineErrorBoundary from '../components/common/TimelineErrorBoundary';

const AppContent = () => {
  const {
    currentPageMode,
    currentTab,
    currentFileName,
    changePageMode,
    changeTab,
    updateFileName,
    getPageModeInfo,
    PAGE_MODES
  } = usePageMode();
  
  const { isPersonalMode, isWikiMode, isMyPageMode } = getPageModeInfo();
  
  // 認証
  const { user, loading: authLoading, signInWithGoogle, signOut, isAuthenticated } = useAuth();
  
  // Supabase同期
  const {
    saveTimelineData,
    getUserTimelines,
    deleteTimeline: deleteTimelineFile,
  } = useSupabaseSync(user);
  
  // Wiki関連
  const wikiData = useWikiData(user);
  
  // デスクトップ判定
  const isDesktop = useIsDesktop();
  
  // タイムライン関連の参照
  const timelineRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // タイムラインロジック（単一のデータソース）
  const {
    events,
    setEvents,
    timelines: Timelines,
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
    createTimeline: baseCreateTimeline,
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
    calculateTextWidth
  } = useTimelineLogic(timelineRef);

  // ドラッグ&ドロップ機能
  const {
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDoubleClick
  } = useDragDrop({
    scale,
    setScale,
    panX,
    setPanX,
    panY,
    setPanY,
    openNewEventModal,
    openEventModal
  });

  // 年表作成処理（修正版）
  const handleCreateTimeline = useCallback((highlightedEventsList) => {
    console.log('App: 年表作成開始', {
      eventsCount: highlightedEventsList?.length || 0,
      currentTimelines: Timelines.length,
      highlightedType: typeof highlightedEventsList
    });

    if (Array.isArray(highlightedEventsList) && highlightedEventsList.length > 0) {
      // 直接イベント配列が渡された場合
      const allTags = [];
      highlightedEventsList.forEach(event => {
        if (event.tags && Array.isArray(event.tags)) {
          allTags.push(...event.tags);
        }
      });
      
      const tagCount = {};
      allTags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
      
      const topTags = Object.entries(tagCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([tag]) => tag);

      const timelineName = topTags.length > 0 ? `#${topTags[0]}` : "新しい年表";

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

      console.log('App: 新年表作成', newTimeline);

      setCreatedTimelines(prevTimelines => {
        const updatedTimelines = [...prevTimelines, newTimeline];
        console.log('App: 年表状態更新', {
          previous: prevTimelines.length,
          updated: updatedTimelines.length
        });
        return updatedTimelines;
      });

      // 検索クリア
      setSearchTerm('');
      setHighlightedEvents(new Set());

      console.log('App: 年表作成完了', timelineName);
      return newTimeline;
    } else {
      // 従来の処理
      console.log('App: ベース年表作成処理を呼び出し');
      return baseCreateTimeline();
    }
  }, [Timelines.length, setCreatedTimelines, setSearchTerm, setHighlightedEvents, baseCreateTimeline]);

  // ファイル操作
  const handleNew = useCallback(() => {
    if (events.length > 0 || Timelines.length > 0) {
      if (!window.confirm('現在の作業内容が失われますが、よろしいですか？')) {
        return;
      }
    }
    
    setEvents([]);
    setCreatedTimelines([]);
    updateFileName(null);
    resetToInitialPosition();
  }, [events.length, Timelines.length, setEvents, setCreatedTimelines, updateFileName, resetToInitialPosition]);
  
  const handleSave = useCallback(async () => {
    if (!isAuthenticated || isSaving) return;
    
    setIsSaving(true);
    try {
      const timelineData = {
        events: events,
        timelines: Timelines,
        version: "1.0",
        savedAt: new Date().toISOString(),
      };
      
      const title = currentFileName || `年表 ${new Date().toLocaleDateString("ja-JP")}`;
      const result = await saveTimelineData(timelineData, title);
      
      if (result) {
        updateFileName(title);
        console.log('ファイルを保存しました');
      } else {
        alert('保存に失敗しました');
      }
    } finally {
      setIsSaving(false);
    }
  }, [isAuthenticated, events, Timelines, currentFileName, saveTimelineData, updateFileName, isSaving]);
  
  const handleLoadTimeline = useCallback((timelineData) => {
    if (timelineData.events) {
      const eventsWithDates = timelineData.events.map((event) => ({
        ...event,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
      }));
      setEvents(eventsWithDates);
    }
    
    if (timelineData.timelines) {
      const timelinesWithDates = timelineData.timelines.map((timeline) => ({
        ...timeline,
        events: timeline.events?.map((event) => ({
          ...event,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
        })) || [],
        temporaryEvents: timeline.temporaryEvents?.map((event) => ({
          ...event,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
        })) || [],
        removedEvents: timeline.removedEvents?.map((event) => ({
          ...event,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
        })) || [],
      }));
      setCreatedTimelines(timelinesWithDates);
    }
    
    if (timelineData.fileName) {
      updateFileName(timelineData.fileName);
    }
    
    changePageMode(PAGE_MODES.PERSONAL);
  }, [setEvents, setCreatedTimelines, updateFileName, changePageMode, PAGE_MODES.PERSONAL]);
  
  // Wikiイベントインポート
  const handleWikiEventImport = useCallback((wikiEvent) => {
    setEvents((prevEvents) => [...prevEvents, wikiEvent]);
  }, [setEvents]);
  
  // メニューアクション処理
  const handleMenuAction = useCallback((actionId) => {
    switch (actionId) {
      case 'new':
        handleNew();
        break;
      case 'save':
        handleSave();
        break;
      case 'add-event':
        openNewEventModal();
        break;
      case 'reset-view':
        resetToInitialPosition();
        break;
      default:
        console.log(`Menu action: ${actionId}`);
    }
  }, [handleNew, handleSave, openNewEventModal, resetToInitialPosition]);
  
  // TabSystem用のprops
  const tabSystemProps = {
    events,
    timelines: Timelines,
    user,
    onEventUpdate: updateEvent,
    onEventDelete: deleteEvent,
    onTimelineUpdate: (updatedTimelines) => {
      console.log('App: onTimelineUpdate called', updatedTimelines.length);
      setCreatedTimelines(updatedTimelines);
    },
    onAddEvent: addEvent,
    
    // Timeline/Network固有
    timelineRef,
    scale,
    panX,
    panY,
    currentPixelsPerYear,
    onWheel: handleWheel,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onDoubleClick: handleDoubleClick,
    highlightedEvents,
    searchTerm,
    onSearchChange: handleSearchChange,
    
    // Wiki関連
    wikiData,
    showPendingEvents: false,
    
    // その他
    onResetView: resetToInitialPosition,
    onMenuAction: handleMenuAction,
    selectedEvent,
    selectedTimeline,
    onCloseEventModal: closeEventModal,
    onCloseTimelineModal: closeTimelineModal,
    hoveredGroup,
    setHoveredGroup,
    
    // 検索・年表関連
    onCreateTimeline: handleCreateTimeline,
    onDeleteTimeline: deleteTimeline,
    getTopTagsFromSearch
  };

  console.log('App render:', {
    events: events.length,
    timelines: Timelines.length,
    currentTab,
    isMyPageMode
  });
  
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <Header
        user={user}
        isAuthenticated={isAuthenticated}
        onSignIn={signInWithGoogle}
        onSignOut={signOut}
        onMenuAction={handleMenuAction}
        isSaving={isSaving}
      />
      
      {/* メインコンテンツ */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {isMyPageMode ? (
          <MyPage
            user={user}
            supabaseSync={{ getUserTimelines, deleteTimelineFile }}
            onLoadTimeline={handleLoadTimeline}
            onBackToTimeline={() => changePageMode(PAGE_MODES.PERSONAL)}
          />
        ) : (
          <TabSystem {...tabSystemProps} />
        )}
      </div>
      
      {/* デバッグ情報 */}
      <div style={{
        padding: '8px 16px',
        backgroundColor: '#1f2937',
        color: 'white',
        fontSize: '12px',
        fontFamily: 'monospace',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          Timeline統合版 | 
          Mode: {currentPageMode} | 
          Tab: {currentTab || 'none'} | 
          Events: {events.length} | 
          Timelines: {Timelines.length}
        </div>
        <div>
          {isAuthenticated && `${user?.email?.split('@')[0]}`}
          {isSaving && ' | 保存中...'}
        </div>
      </div>
    </div>
  );
};

// メインアプリケーションコンポーネント
const App = () => {
  return (
    // <TimelineErrorBoundary>
      <PageModeProvider>
        <AppContent />
      </PageModeProvider>
    // </TimelineErrorBoundary>
  );
};

export default App;