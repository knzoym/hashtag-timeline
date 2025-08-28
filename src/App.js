// App.js - 既存構造を活用し、インポートエラーを解決
import React, { useRef, useCallback, useState } from 'react';
import { PageModeProvider, usePageMode } from './contexts/PageModeContext';
import Header from './components/common/Header';
import TabSystem from './components/common/TabSystem';
import MyPage from './components/personal/MyPage';

// 修正済みフック
import { useUnifiedCoordinates } from './hooks/useUnifiedCoordinates';
import { useTimelineLogic } from './hooks/useTimelineLogic';
import { useDragDrop } from './hooks/useDragDrop';
import { useAuth } from './hooks/useAuth';
import { useSupabaseSync } from './hooks/useSupabaseSync';
import { useWikiData } from './hooks/useWikiData';
import { useIsDesktop } from './hooks/useMediaQuery';

const AppContent = () => {
  const {
    currentPageMode,
    currentTab,
    currentFileName,
    changePageMode,
    changeTab,
    updateFileName,
    getPageModeInfo
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
  
  // 統合座標管理
  const coordinates = useUnifiedCoordinates(timelineRef);
  const {
    scale, setScale, panX, setPanX, panY, setPanY, 
    currentPixelsPerYear, resetToInitialPosition,
    handleWheel, handleMouseDown, handleMouseMove, handleMouseUp
  } = coordinates;
  
  // タイムラインデータ管理
  const timelineLogic = useTimelineLogic(timelineRef, coordinates);
  const {
    events, setEvents, timelines, setCreatedTimelines,
    searchTerm, highlightedEvents, selectedEvent, selectedTimeline, hoveredGroup,
    setHoveredGroup, addEvent, updateEvent, deleteEvent, createTimeline: baseCreateTimeline,
    deleteTimeline, updateTimeline, openNewEventModal, openEventModal, closeEventModal,
    openTimelineModal, closeTimelineModal, handleSearchChange, getTopTagsFromSearch,
    calculateTextWidth
  } = timelineLogic;

  // ドラッグ&ドロップ機能
  const dragDropHandlers = useDragDrop({
    scale, setScale, panX, setPanX, panY, setPanY,
    openNewEventModal, openEventModal
  });
  const { handleDoubleClick } = dragDropHandlers;

  // 年表作成処理（拡張版）
  const handleCreateTimeline = useCallback((highlightedEventsList) => {
    console.log('App: 年表作成開始', {
      eventsCount: highlightedEventsList?.length || 0,
      currentTimelines: timelines.length,
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

      console.log('App: 年表作成完了', timelineName);
      return newTimeline;
    } else {
      // 従来の処理
      console.log('App: ベース年表作成処理を呼び出し');
      return baseCreateTimeline();
    }
  }, [timelines.length, setCreatedTimelines, baseCreateTimeline]);

  // ファイル操作
  const handleNew = useCallback(() => {
    if (events.length > 0 || timelines.length > 0) {
      if (!window.confirm('現在の作業内容が失われますが、よろしいですか？')) {
        return;
      }
    }
    
    setEvents([]);
    setCreatedTimelines([]);
    updateFileName(null);
    resetToInitialPosition();
  }, [events.length, timelines.length, setEvents, setCreatedTimelines, updateFileName, resetToInitialPosition]);
  
  const handleSave = useCallback(async () => {
    if (!isAuthenticated || isSaving) return;
    
    setIsSaving(true);
    try {
      const timelineData = {
        events: events,
        timelines: timelines,
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
  }, [isAuthenticated, events, timelines, currentFileName, saveTimelineData, updateFileName, isSaving]);
  
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
      }));
      setCreatedTimelines(timelinesWithDates);
    }
    
    resetToInitialPosition();
    console.log('年表データを読み込みました');
  }, [setEvents, setCreatedTimelines, resetToInitialPosition]);

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
    timelines,
    user,
    onEventUpdate: updateEvent,
    onEventDelete: deleteEvent,
    onTimelineUpdate: (updatedTimelines) => {
      console.log('App: onTimelineUpdate called', updatedTimelines.length);
      setCreatedTimelines(updatedTimelines);
    },
    onAddEvent: addEvent,
    
    // Timeline/Network固有の座標系（統合版）
    timelineRef,
    coordinates, // 統合座標管理オブジェクト
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
    timelines: timelines.length,
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
            isAuthenticated={isAuthenticated}
            onLoadTimeline={handleLoadTimeline}
            getUserTimelines={getUserTimelines}
            deleteTimelineFile={deleteTimelineFile}
          />
        ) : (
          <TabSystem
            {...tabSystemProps}
            currentPageMode={currentPageMode}
            currentTab={currentTab}
            isPersonalMode={isPersonalMode}
            isWikiMode={isWikiMode}
            onTabChange={changeTab}
          />
        )}
      </div>
    </div>
  );
};

// PageModeProvider でラップして提供
const App = () => {
  return (
    <PageModeProvider>
      <AppContent />
    </PageModeProvider>
  );
};

export default App;