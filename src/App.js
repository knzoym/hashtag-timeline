// App.js - データ構造統一修正版
import React, { useRef, useCallback, useState, useMemo } from 'react';
import { PageModeProvider, usePageMode } from './contexts/PageModeContext';
import Header from './components/common/Header';
import TabSystem from './components/common/TabSystem';
import MyPage from './components/personal/MyPage';

// 修正済みフック
import { useUnifiedCoordinates } from './hooks/useUnifiedCoordinates';
import { useAuth } from './hooks/useAuth';
import { useSupabaseSync } from './hooks/useSupabaseSync';
import { useWikiData } from './hooks/useWikiData';

const AppContent = () => {
  const {
    currentTab,
    currentFileName,
    updateFileName,
    getPageModeInfo
  } = usePageMode();
  
  const { isWikiMode, isMyPageMode } = getPageModeInfo();
  
  // 認証
  const { user, signInWithGoogle, signOut } = useAuth();
  
  // Supabase同期
  const {
    saveTimelineData
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
      tags: ["テスト", "サンプル"],
      timelineInfos: [] // 統一データ構造
    },
    {
      id: 2,
      title: "サンプルイベント2", 
      startDate: new Date(2023, 5, 10),
      endDate: new Date(2023, 5, 10),
      description: "2つ目のサンプルイベント",
      tags: ["テスト", "例"],
      timelineInfos: [] // 統一データ構造
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
  
  // イベント操作 - timelineInfos統一対応
  const addEvent = useCallback((newEventData) => {
    const event = {
      id: Date.now(),
      title: newEventData?.title || '新規イベント',
      startDate: newEventData?.startDate || new Date(),
      endDate: newEventData?.endDate || newEventData?.startDate || new Date(),
      description: newEventData?.description || '',
      tags: newEventData?.tags || [],
      timelineInfos: [] // 必須フィールドを初期化
    };
    setEvents(prev => [...prev, event]);
    console.log('イベント追加:', event.title, 'timelineInfos初期化済み');
    return event;
  }, []);

  const updateEvent = useCallback((updatedEvent) => {
    // timelineInfosフィールドが存在しない場合は空配列で初期化
    const normalizedEvent = {
      ...updatedEvent,
      timelineInfos: updatedEvent.timelineInfos || []
    };
    
    setEvents(prev => prev.map(event => 
      event.id === normalizedEvent.id ? normalizedEvent : event
    ));
    console.log('イベント更新:', normalizedEvent.title);
  }, []);

  const deleteEvent = useCallback((eventId) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
    console.log('イベント削除:', eventId);
  }, []);
  
  // イベントを年表に追加/削除する統一関数
  const addEventToTimeline = useCallback((event, timelineId) => {
    const timeline = timelines.find(t => t.id === timelineId);
    if (!timeline) {
      console.warn(`年表が見つかりません: ${timelineId}`);
      return;
    }

    // イベントのtimelineInfosを更新
    const updatedTimelineInfos = [...(event.timelineInfos || [])];
    const existingIndex = updatedTimelineInfos.findIndex(info => info.timelineId === timelineId);
    
    if (existingIndex === -1) {
      // 新規追加 - 仮登録状態で追加
      updatedTimelineInfos.push({
        timelineId,
        timelineName: timeline.name,
        isTemporary: true,
        addedAt: new Date()
      });
      
      const updatedEvent = {
        ...event,
        timelineInfos: updatedTimelineInfos
      };
      
      updateEvent(updatedEvent);
      console.log(`イベント「${event.title}」を年表「${timeline.name}」に仮登録`);
    } else {
      console.log(`イベント「${event.title}」は既に年表「${timeline.name}」に登録済み`);
    }
  }, [timelines, updateEvent]);

  const removeEventFromTimeline = useCallback((event, timelineId) => {
    const updatedTimelineInfos = (event.timelineInfos || []).filter(
      info => info.timelineId !== timelineId
    );
    
    const updatedEvent = {
      ...event,
      timelineInfos: updatedTimelineInfos
    };
    
    updateEvent(updatedEvent);
    
    const timeline = timelines.find(t => t.id === timelineId);
    console.log(`イベント「${event.title}」を年表「${timeline?.name || timelineId}」から削除`);
  }, [timelines, updateEvent]);
  
  // 年表操作 - 新しい関連付け方式対応
  const createTimeline = useCallback((timelineData) => {
    if (highlightedEvents.length === 0) {
      alert("検索でイベントを選択してから年表を作成してください");
      return null;
    }

    const timeline = {
      id: Date.now(),
      name: timelineData?.name || `年表_${new Date().toLocaleDateString()}`,
      color: timelineData?.color || `hsl(${Math.random() * 360}, 70%, 50%)`,
      isVisible: true,
      createdAt: new Date(),
      ...timelineData
    };
    
    setTimelines(prev => [...prev, timeline]);
    
    // ハイライトされたイベントを年表に関連付け
    highlightedEvents.forEach(event => {
      const updatedTimelineInfos = [...(event.timelineInfos || [])];
      updatedTimelineInfos.push({
        timelineId: timeline.id,
        timelineName: timeline.name,
        isTemporary: false, // 年表作成時は正式登録
        addedAt: new Date()
      });
      
      const updatedEvent = {
        ...event,
        timelineInfos: updatedTimelineInfos
      };
      
      updateEvent(updatedEvent);
    });
    
    console.log('年表作成:', timeline.name, '含むイベント:', highlightedEvents.length);
    return timeline;
  }, [highlightedEvents, updateEvent]);

  const updateTimeline = useCallback((updatedTimeline) => {
    setTimelines(prev => prev.map(timeline => 
      timeline.id === updatedTimeline.id ? updatedTimeline : timeline
    ));
    
    // timelineName更新時は、関連するイベントのtimelineInfosも更新
    if (updatedTimeline.name) {
      setEvents(prevEvents => prevEvents.map(event => ({
        ...event,
        timelineInfos: (event.timelineInfos || []).map(info =>
          info.timelineId === updatedTimeline.id 
            ? { ...info, timelineName: updatedTimeline.name }
            : info
        )
      })));
    }
    
    console.log('年表更新:', updatedTimeline.name);
  }, []);

  const deleteTimeline = useCallback((timelineId) => {
    const timeline = timelines.find(t => t.id === timelineId);
    
    // 関連するイベントのtimelineInfosからも削除
    setEvents(prevEvents => prevEvents.map(event => ({
      ...event,
      timelineInfos: (event.timelineInfos || []).filter(info => info.timelineId !== timelineId)
    })));
    
    setTimelines(prev => prev.filter(timeline => timeline.id !== timelineId));
    console.log('年表削除:', timeline?.name || timelineId);
  }, [timelines]);
  
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

  // イベント追加時のハンドラー（VisualTab → App.js）
  const handleAddEvent = useCallback((eventData) => {
    console.log('App.js: handleAddEvent呼び出し:', eventData);
    return addEvent(eventData);
  }, [addEvent]);

  // 年表作成時のハンドラー（VisualTab → App.js）
  const handleCreateTimeline = useCallback((timelineData) => {
    console.log('App.js: handleCreateTimeline呼び出し:', timelineData);
    return createTimeline(timelineData);
  }, [createTimeline]);
  
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
    selectedTimeline: !!selectedTimeline
  });

  // MyPageモード時は別のコンポーネントを表示
  if (isMyPageMode) {
    return <MyPage />;
  }

  // 通常のアプリケーションUI
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header 
        user={user}
        signInWithGoogle={signInWithGoogle}
        signOut={signOut}
        onMenuAction={handleMenuAction}
        currentFileName={currentFileName}
        canSave={events.length > 0 || timelines.length > 0}
        isSaving={isSaving}
      />
      
      <TabSystem
        // データ
        events={events}
        timelines={timelines}
        searchTerm={searchTerm}
        highlightedEvents={highlightedEvents}
        selectedEvent={selectedEvent}
        selectedTimeline={selectedTimeline}
        
        // 操作ハンドラ
        onEventUpdate={updateEvent}
        onEventDelete={deleteEvent}
        onEventAdd={handleAddEvent}
        onEventClick={handleEventClick}
        onEventAddToTimeline={addEventToTimeline}
        onEventRemoveFromTimeline={removeEventFromTimeline}
        
        onTimelineCreate={handleCreateTimeline}
        onTimelineUpdate={updateTimeline}
        onTimelineDelete={deleteTimeline}
        onTimelineClick={handleTimelineClick}
        
        onSearchChange={handleSearchChange}
        onCloseEventModal={closeEventModal}
        onCloseTimelineModal={closeTimelineModal}
        
        // 座標系とUI
        coordinates={coordinates}
        timelineRef={timelineRef}
        
        // その他のUI状態
        hoveredGroup={hoveredGroup}
        setHoveredGroup={setHoveredGroup}
        getTopTagsFromSearch={getTopTagsFromSearch}
        
        // モード
        isWikiMode={isWikiMode}
        wikiData={wikiData}
      />
    </div>
  );
};

const App = () => {
  return (
    <PageModeProvider>
      <AppContent />
    </PageModeProvider>
  );
};

export default App;