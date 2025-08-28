// App.js - 未使用変数を整理し、統合座標管理に対応
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
    changeTab,
    updateFileName,
    getPageModeInfo
  } = usePageMode();
  
  const { isPersonalMode, isWikiMode, isMyPageMode } = getPageModeInfo();
  
  // 認証
  const { user, signInWithGoogle, signOut, isAuthenticated } = useAuth();
  
  // Supabase同期
  const {
    saveTimelineData,
    getUserTimelines,
    deleteTimeline: deleteTimelineFile,
  } = useSupabaseSync(user);
  
  // Wiki関連
  const wikiData = useWikiData(user);
  
  // タイムライン関連の参照
  const timelineRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // 統合座標管理
  const coordinates = useUnifiedCoordinates(timelineRef);
  
  // タイムラインデータ管理
  const timelineLogic = useTimelineLogic(timelineRef, coordinates);
  const {
    events, setEvents, timelines, setCreatedTimelines,
    searchTerm, highlightedEvents, selectedEvent, selectedTimeline, hoveredGroup,
    setHoveredGroup, addEvent, updateEvent, deleteEvent, createTimeline: baseCreateTimeline,
    deleteTimeline, updateTimeline, openNewEventModal, openEventModal, closeEventModal,
    openTimelineModal, closeTimelineModal, handleSearchChange, getTopTagsFromSearch
  } = timelineLogic;
  
  // ドラッグ&ドロップ対応
  const { handleDrop } = useDragDrop(setEvents, setCreatedTimelines);
  
  // ファイル操作
  const handleNew = useCallback(async () => {
    if (events.length > 0 || timelines.length > 0) {
      if (!window.confirm('現在のデータは失われます。新規作成しますか？')) {
        return;
      }
    }
    setEvents([]);
    setCreatedTimelines([]);
    updateFileName('新規ファイル');
  }, [events.length, timelines.length, setEvents, setCreatedTimelines, updateFileName]);

  const handleSave = useCallback(async () => {
    if (!user) {
      alert('保存するにはログインが必要です');
      return;
    }
    
    setIsSaving(true);
    try {
      await saveTimelineData({
        events,
        timelines,
        fileName: currentFileName || '名称未設定'
      });
      alert('保存しました');
    } catch (error) {
      console.error('Save failed:', error);
      alert('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  }, [user, events, timelines, currentFileName, saveTimelineData]);

  const handleLoadTimeline = useCallback((timelineData) => {
    setEvents(timelineData.events || []);
    setCreatedTimelines(timelineData.timelines || []);
    updateFileName(timelineData.name);
  }, [setEvents, setCreatedTimelines, updateFileName]);

  const handleCreateTimeline = useCallback((timelineData) => {
    const newTimeline = baseCreateTimeline(timelineData);
    console.log('App: Created timeline', newTimeline);
    return newTimeline;
  }, [baseCreateTimeline]);

  // メニューアクション
  const handleMenuAction = useCallback((actionId) => {
    console.log('App: handleMenuAction called', actionId);
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
      case 'initial-position':
        coordinates.resetToInitialPosition();
        break;
      default:
        console.log(`Menu action: ${actionId}`);
    }
  }, [handleNew, handleSave, openNewEventModal, coordinates]);
  
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
    onResetView: coordinates.resetToInitialPosition,
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
    <div 
      style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
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