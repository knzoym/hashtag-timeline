// src/pages/AppTest.js - TimelineTab統合版
import React, { useRef, useCallback, useState, useEffect } from 'react';
import { PageModeProvider, usePageMode } from '../contexts/PageModeContext';
import Header from '../components/common/Header';
import TabSystem from '../components/common/TabSystem';

// 既存のhooksを使用
import { useAuth } from '../hooks/useAuth';
import { useTimelineLogic } from '../hooks/useTimelineLogic';
import { useDragDrop } from '../hooks/useDragDrop';
import { useSupabaseSync } from '../hooks/useSupabaseSync';
import { useWikiData } from '../hooks/useWikiData';
import { useIsDesktop } from '../hooks/useMediaQuery';

// 個人ページ用コンポーネント（既存）
import MyPage from '../components/personal/MyPage';

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
  
  // 認証とデータ同期
  const { user, loading: authLoading, signInWithGoogle, signOut, isAuthenticated } = useAuth();
  const {
    saveTimelineData,
    getUserTimelines,
    deleteTimeline: deleteTimelineFile,
  } = useSupabaseSync(user);
  const wikiData = useWikiData(user);
  const isDesktop = useIsDesktop();
  
  // タイムライン関連の参照とロジック
  const timelineRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouseX, setLastMouseX] = useState(0);
  const [lastMouseY, setLastMouseY] = useState(0);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // タイムラインロジック（既存のhookをそのまま使用）
  const {
    events,
    setEvents,
    Timelines,
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
    createTimeline,
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
  } = useTimelineLogic(
    timelineRef,
    { current: isDragging },
    { current: lastMouseX },
    { current: lastMouseY },
    isShiftPressed
  );
  
  // ドラッグ&ドロップ
  const {
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDoubleClick,
    handleDragMouseDown
  } = useDragDrop({
    scale,
    setScale,
    panX,
    setPanX,
    panY,
    setPanY,
    setIsDragging,
    setLastMouseX,
    setLastMouseY,
    openNewEventModal,
    openEventModal
  });
  
  // キーボードイベント
  useEffect(() => {
    const handleKeyDown = (e) => {
      setIsShiftPressed(e.shiftKey);
      
      // ショートカットキー
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'n':
            e.preventDefault();
            handleNew();
            break;
          case 'o':
            e.preventDefault();
            if (isAuthenticated) {
              changePageMode(PAGE_MODES.MYPAGE);
            }
            break;
        }
      }
    };
    
    const handleKeyUp = (e) => {
      setIsShiftPressed(e.shiftKey);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isAuthenticated, changePageMode, PAGE_MODES.MYPAGE]);
  
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
    onTimelineUpdate: updateTimeline,
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
    onCreateTimeline: createTimeline,
    onDeleteTimeline: deleteTimeline,
    getTopTagsFromSearch
  };
  
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
          🧪 Timeline統合テスト | 
          Mode: {currentPageMode} | 
          Tab: {currentTab || 'none'} | 
          Events: {events.length} | 
          Timelines: {Timelines.length}
        </div>
        <div>
          {isAuthenticated && `👤 ${user?.email?.split('@')[0]}`}
          {isSaving && ' | 💾 保存中...'}
        </div>
      </div>
    </div>
  );
};

// メインアプリケーションコンポーネント（コンテキストプロバイダーでラップ）
const AppTest = () => {
  return (
    <PageModeProvider>
      <AppContent />
    </PageModeProvider>
  );
};

export default AppTest;