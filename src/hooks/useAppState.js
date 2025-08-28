// src/hooks/useAppState.js
import { useState, useCallback, useEffect } from 'react';
import { initialEvents, initialTimelines } from '../lib/SampleEvents';
import { generateUniqueId } from '../utils/timelineUtils';

/**
 * アプリケーション全体の状態管理フック
 * イベント、年表、検索状態などの中核データを管理
 */
export const useAppState = () => {
  // 基本データ状態
  const [events, setEvents] = useState(initialEvents || []);
  const [timelines, setTimelines] = useState(initialTimelines || []);
  const [tempTimelines, setTempTimelines] = useState([]); // Wiki一時年表
  
  // UI状態
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedEvents, setHighlightedEvents] = useState(new Set());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTimeline, setSelectedTimeline] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // ホバー状態
  const [hoveredGroup, setHoveredGroup] = useState(null);
  
  // 保存状態の管理
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // イベント操作
  const addEvent = useCallback((eventData) => {
    const newEvent = {
      id: generateUniqueId(),
      title: eventData.title || '新規イベント',
      startDate: eventData.startDate || new Date(),
      endDate: eventData.endDate || null,
      description: eventData.description || '',
      tags: eventData.tags || [],
      timelineInfos: eventData.timelineInfos || [],
      position: eventData.position || { x: 0, y: 100 }
    };
    
    setEvents(prev => [...prev, newEvent]);
    setHasUnsavedChanges(true);
    
    console.log('イベント追加:', newEvent.title);
    return newEvent;
  }, []);

  const updateEvent = useCallback((updatedEvent) => {
    setEvents(prev => 
      prev.map(event => 
        event.id === updatedEvent.id ? updatedEvent : event
      )
    );
    setHasUnsavedChanges(true);
    
    console.log('イベント更新:', updatedEvent.title);
  }, []);

  const deleteEvent = useCallback((eventId) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
    setHasUnsavedChanges(true);
    
    console.log('イベント削除:', eventId);
  }, []);

  // 年表操作
  const createTimeline = useCallback(() => {
    if (highlightedEvents.size === 0) {
      console.warn('年表作成: 選択されたイベントがありません');
      return null;
    }

    const timelineName = window.prompt('年表名を入力してください:');
    if (!timelineName) return null;

    const newTimeline = {
      id: generateUniqueId(),
      name: timelineName,
      color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
      isVisible: true,
      eventIds: Array.from(highlightedEvents),
      eventCount: highlightedEvents.size,
      createdAt: new Date().toISOString()
    };

    // 選択されたイベントにtimelineInfo追加
    const eventIdsArray = Array.from(highlightedEvents);
    setEvents(prev => prev.map(event => {
      if (eventIdsArray.includes(event.id)) {
        const updatedTimelineInfos = [...(event.timelineInfos || [])];
        updatedTimelineInfos.push({
          timelineId: newTimeline.id,
          isTemporary: false
        });
        return { ...event, timelineInfos: updatedTimelineInfos };
      }
      return event;
    }));

    setTimelines(prev => [...prev, newTimeline]);
    setHighlightedEvents(new Set()); // 選択状態をクリア
    setHasUnsavedChanges(true);
    
    console.log('年表作成:', newTimeline.name, '対象イベント:', highlightedEvents.size);
    return newTimeline;
  }, [highlightedEvents]);

  const createTempTimeline = useCallback(() => {
    if (highlightedEvents.size === 0) {
      console.warn('一時年表作成: 選択されたイベントがありません');
      return null;
    }

    const timelineName = window.prompt('一時年表名を入力してください:');
    if (!timelineName) return null;

    const newTempTimeline = {
      id: generateUniqueId(),
      name: timelineName,
      color: `hsl(${Math.floor(Math.random() * 360)}, 60%, 65%)`,
      eventIds: Array.from(highlightedEvents),
      isTemporary: true,
      createdAt: new Date().toISOString()
    };

    setTempTimelines(prev => [...prev, newTempTimeline]);
    setHighlightedEvents(new Set()); // 選択状態をクリア
    
    console.log('一時年表作成:', newTempTimeline.name, '対象イベント:', highlightedEvents.size);
    return newTempTimeline;
  }, [highlightedEvents]);

  const updateTimeline = useCallback((updatedTimelines) => {
    if (Array.isArray(updatedTimelines)) {
      setTimelines(updatedTimelines);
    } else {
      setTimelines(prev => 
        prev.map(timeline => 
          timeline.id === updatedTimelines.id ? updatedTimelines : timeline
        )
      );
    }
    setHasUnsavedChanges(true);
    
    console.log('年表更新');
  }, []);

  const deleteTimeline = useCallback((timelineId) => {
    // 年表に属するイベントのtimelineInfosからも削除
    setEvents(prev => prev.map(event => ({
      ...event,
      timelineInfos: (event.timelineInfos || []).filter(info => info.timelineId !== timelineId)
    })));
    
    setTimelines(prev => prev.filter(timeline => timeline.id !== timelineId));
    setHasUnsavedChanges(true);
    
    console.log('年表削除:', timelineId);
  }, []);

  const deleteTempTimeline = useCallback((timelineId) => {
    setTempTimelines(prev => prev.filter(timeline => timeline.id !== timelineId));
    console.log('一時年表削除:', timelineId);
  }, []);

  // 一時年表を個人ファイルに保存
  const saveTempTimelineToPersonal = useCallback((tempTimeline) => {
    const personalTimeline = {
      ...tempTimeline,
      id: generateUniqueId(),
      isTemporary: false
    };

    // 関連イベントにtimelineInfo追加
    setEvents(prev => prev.map(event => {
      if (tempTimeline.eventIds.includes(event.id)) {
        const updatedTimelineInfos = [...(event.timelineInfos || [])];
        updatedTimelineInfos.push({
          timelineId: personalTimeline.id,
          isTemporary: false
        });
        return { ...event, timelineInfos: updatedTimelineInfos };
      }
      return event;
    }));

    setTimelines(prev => [...prev, personalTimeline]);
    setTempTimelines(prev => prev.filter(t => t.id !== tempTimeline.id));
    setHasUnsavedChanges(true);
    
    console.log('一時年表を個人ファイルに保存:', tempTimeline.name);
    return personalTimeline;
  }, []);

  // 検索・フィルタリング
  const handleSearchChange = useCallback((e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    
    // 検索結果のハイライト更新
    if (newSearchTerm.trim()) {
      const matchedEventIds = events
        .filter(event => {
          const searchLower = newSearchTerm.toLowerCase();
          return (
            event.title.toLowerCase().includes(searchLower) ||
            event.description.toLowerCase().includes(searchLower) ||
            event.tags.some(tag => tag.toLowerCase().includes(searchLower))
          );
        })
        .map(event => event.id);
      
      setHighlightedEvents(new Set(matchedEventIds));
    } else {
      setHighlightedEvents(new Set());
    }
  }, [events]);

  // 上位タグ取得
  const getTopTagsFromSearch = useCallback(() => {
    const matchedEvents = Array.from(highlightedEvents)
      .map(id => events.find(e => e.id === id))
      .filter(Boolean);
    
    if (matchedEvents.length === 0) {
      // 全イベントから頻出タグを取得
      const allTags = events.flatMap(event => event.tags || []);
      const tagCounts = {};
      allTags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
      
      return Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([tag]) => tag);
    }

    // 検索結果のタグを取得
    const searchTags = matchedEvents.flatMap(event => event.tags || []);
    const uniqueTags = [...new Set(searchTags)];
    return uniqueTags.slice(0, 6);
  }, [highlightedEvents, events]);

  // モーダル操作
  const handleEventClick = useCallback((event) => {
    setSelectedEvent(event);
  }, []);

  const handleTimelineClick = useCallback((timelineId) => {
    const timeline = timelines.find(t => t.id === timelineId);
    if (timeline) {
      setSelectedTimeline(timeline);
    }
  }, [timelines]);

  const closeEventModal = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  const closeTimelineModal = useCallback(() => {
    setSelectedTimeline(null);
  }, []);

  // データリセット
  const resetData = useCallback(() => {
    setEvents(initialEvents || []);
    setTimelines(initialTimelines || []);
    setTempTimelines([]);
    setSearchTerm('');
    setHighlightedEvents(new Set());
    setSelectedEvent(null);
    setSelectedTimeline(null);
    setHasUnsavedChanges(false);
    
    console.log('データリセット完了');
  }, []);

  // 保存フラグリセット
  const markAsSaved = useCallback(() => {
    setHasUnsavedChanges(false);
    setIsSaving(false);
  }, []);

  // 保存状態設定
  const setSavingState = useCallback((saving) => {
    setIsSaving(saving);
  }, []);

  // データロード
  const loadData = useCallback((data) => {
    if (data.events) setEvents(data.events);
    if (data.timelines) setTimelines(data.timelines);
    if (data.tempTimelines) setTempTimelines(data.tempTimelines);
    
    setHasUnsavedChanges(false);
    console.log('データロード完了');
  }, []);

  // 現在の状態を取得
  const getCurrentState = useCallback(() => {
    return {
      events,
      timelines,
      tempTimelines,
      searchTerm,
      highlightedEvents: Array.from(highlightedEvents),
      hasUnsavedChanges,
      timestamp: new Date().toISOString()
    };
  }, [events, timelines, tempTimelines, searchTerm, highlightedEvents, hasUnsavedChanges]);

  return {
    // データ状態
    events,
    timelines,
    tempTimelines,
    
    // UI状態
    searchTerm,
    highlightedEvents,
    selectedEvent,
    selectedTimeline,
    hoveredGroup,
    isSaving,
    hasUnsavedChanges,
    
    // イベント操作
    addEvent,
    updateEvent,
    deleteEvent,
    
    // 年表操作
    createTimeline,
    createTempTimeline,
    updateTimeline,
    deleteTimeline,
    deleteTempTimeline,
    saveTempTimelineToPersonal,
    
    // 検索・フィルタリング
    handleSearchChange,
    getTopTagsFromSearch,
    
    // モーダル操作
    handleEventClick,
    handleTimelineClick,
    closeEventModal,
    closeTimelineModal,
    
    // 状態設定
    setHighlightedEvents,
    setHoveredGroup,
    setSavingState,
    markAsSaved,
    
    // データ管理
    resetData,
    loadData,
    getCurrentState
  };
};