// App.js - 完全修正版（構文エラー解消）
import React, { useRef, useCallback, useState, useMemo } from 'react';
import { PageModeProvider, usePageMode } from './contexts/PageModeContext';
import Header from './components/common/Header';
import TabSystem from './components/common/TabSystem';
import MyPage from './components/personal/MyPage';

// 修正済みフック
import { useUnifiedCoordinates } from './hooks/useUnifiedCoordinates';
import { useDragDrop } from './hooks/useDragDrop';
import { useAuth } from './hooks/useAuth';
import { useSupabaseSync } from './hooks/useSupabaseSync';
import { useWikiData } from './hooks/useWikiData';

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
  
  // データ管理（App.jsレベルで統一管理）
  const [events, setEvents] = useState([
    // 初期サンプルデータ（テスト用）
    {
      id: 1,
      title: "サンプルイベント1",
      startDate: new Date(2023, 0, 15),
      endDate: new Date(2023, 0, 15),
      description: "これはサンプルイベントです",
      tags: ["テスト", "サンプル"]
    },
    {
      id: 2,
      title: "サンプルイベント2", 
      startDate: new Date(2023, 5, 10),
      endDate: new Date(2023, 5, 10),
      description: "2つ目のサンプルイベント",
      tags: ["テスト", "例"]
    }
  ]);
  const [timelines, setTimelines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTimeline, setSelectedTimeline] = useState(null);
  const [hoveredGroup, setHoveredGroup] = useState(null);
  
  // 検索でハイライトされるイベント（配列形式でSearchPanelに対応）
  const highlightedEvents = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const term = searchTerm.toLowerCase();
    const matchingEvents = events.filter(event => {
      return event.title?.toLowerCase().includes(term) ||
             event.description?.toLowerCase().includes(term) ||
             event.tags?.some(tag => tag.toLowerCase().includes(term));
    });
    
    return matchingEvents;
  }, [searchTerm, events]);
  
  // イベント操作
  const addEvent = useCallback((newEventData) => {
    const event = {
      id: Date.now(),
      title: newEventData?.title || '新規イベント',
      startDate: newEventData?.startDate || new Date(),
      endDate: newEventData?.endDate || newEventData?.startDate || new Date(),
      description: newEventData?.description || '',
      tags: newEventData?.tags || []
    };
    setEvents(prev => [...prev, event]);
    console.log('イベント追加:', event.title);
    return event;
  }, []);

  const updateEvent = useCallback((updatedEvent) => {
    setEvents(prev => prev.map(event => 
      event.id === updatedEvent.id ? updatedEvent : event
    ));
  }, []);

  const deleteEvent = useCallback((eventId) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
  }, []);
  
  // 年表操作
  const createTimeline = useCallback((timelineData) => {
    if (highlightedEvents.length === 0) {
      alert("検索でイベントを選択してから年表を作成してください");
      return null;
    }

    const timeline = {
      id: Date.now(),
      name: timelineData?.name || `年表_${new Date().toLocaleDateString()}`,
      color: timelineData?.color || `hsl(${Math.random() * 360}, 70%, 50%)`,
      events: [...highlightedEvents], // 配列から直接コピー
      isVisible: true,
      createdAt: new Date(),
      ...timelineData
    };
    
    setTimelines(prev => [...prev, timeline]);
    console.log('年表作成:', timeline.name, '含むイベント:', timeline.events.length);
    return timeline;
  }, [highlightedEvents]);

  const deleteTimeline = useCallback((timelineId) => {
    setTimelines(prev => prev.filter(timeline => timeline.id !== timelineId));
  }, []);
  
  // UI操作
  const handleSearchChange = useCallback((e) => {
    const value = typeof e === 'string' ? e : (e?.target?.value || '');
    setSearchTerm(value);
    console.log('検索語変更:', value);
  }, []);
  
  const closeEventModal = useCallback(() => {
    setSelectedEvent(null);
  }, []);
  
  const closeTimelineModal = useCallback(() => {
    setSelectedTimeline(null);
  }, []);
  
  // イベントクリック時のモーダル表示
  const handleEventClick = useCallback((event) => {
    console.log('App.js: handleEventClick呼び出し:', event.title);
    setSelectedEvent(event);
  }, []);
  
  // タイムラインクリック時のモーダル表示  
  const handleTimelineClick = useCallback((timeline) => {
    console.log('App.js: handleTimelineClick呼び出し:', timeline.name);
    setSelectedTimeline(timeline);
  }, []);
  
  const getTopTagsFromSearch = useCallback(() => {
    const allTags = highlightedEvents.flatMap(event => event.tags || []);
    const tagCount = {};
    allTags.forEach(tag => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
    
    return Object.entries(tagCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([tag]) => tag);
  }, [highlightedEvents]);
  
  // ドラッグ&ドロップ対応
  const { handleDrop } = useDragDrop(setEvents, setTimelines);
  
  // ファイル操作
  const handleNew = useCallback(async () => {
    if (events.length > 0 || timelines.length > 0) {
      if (!window.confirm('現在のデータは失われます。新規作成しますか？')) {
        return;
      }
    }
    setEvents([]);
    setTimelines([]);
    updateFileName('新規ファイル');
  }, [events.length, timelines.length, updateFileName]);

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
    setTimelines(timelineData.timelines || []);
    updateFileName(timelineData.name);
  }, [updateFileName]);

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
        console.log('新規イベント作成');
        break;
      case 'initial-position':
        coordinates.resetToInitialPosition();
        break;
      default:
        console.log(`Menu action: ${actionId}`);
    }
  }, [handleNew, handleSave, coordinates]);
  
  console.log('App render:', {
    events: events.length,
    timelines: timelines.length,
    currentTab,
    isMyPageMode,
    selectedEvent: !!selectedEvent,
    selectedTimeline: !!selectedTimeline,
    selectedEventTitle: selectedEvent?.title,
    selectedTimelineName: selectedTimeline?.name
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
            events={events}
            timelines={timelines}
            user={user}
            onEventUpdate={updateEvent}
            onEventDelete={deleteEvent}
            onTimelineUpdate={setTimelines}
            onAddEvent={addEvent}
            
            timelineRef={timelineRef}
            coordinates={coordinates}
            highlightedEvents={highlightedEvents}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            
            wikiData={wikiData}
            showPendingEvents={false}
            
            onResetView={coordinates.resetToInitialPosition}
            onMenuAction={handleMenuAction}
            selectedEvent={selectedEvent}
            selectedTimeline={selectedTimeline}
            onCloseEventModal={closeEventModal}
            onCloseTimelineModal={closeTimelineModal}
            hoveredGroup={hoveredGroup}
            setHoveredGroup={setHoveredGroup}
            
            onCreateTimeline={createTimeline}
            onDeleteTimeline={deleteTimeline}
            getTopTagsFromSearch={getTopTagsFromSearch}
            onEventClick={handleEventClick}
            onTimelineClick={handleTimelineClick}
            
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