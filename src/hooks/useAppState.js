// src/hooks/useAppState.js - updateEvent修正版
import { useState, useCallback, useEffect } from 'react';
import { initialEvents, initialTimelines } from '../lib/SampleEvents';
import { generateUniqueId } from '../utils/timelineUtils';

/**
 * アプリケーション全体の状態管理フック（updateEvent修正版）
 */
export const useAppState = () => {
  // 基本データ状態
  const [events, setEvents] = useState(initialEvents || []);
  const [timelines, setTimelines] = useState(initialTimelines || []);
  const [tempTimelines, setTempTimelines] = useState([]);
  
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

  // 修正版：updateEvent関数
  const updateEvent = useCallback((updatedEvent) => {
    console.log('📝 useAppState.updateEvent 開始');
    console.log('  更新対象:', updatedEvent.title);
    console.log('  更新前timelineInfos:', updatedEvent.timelineInfos);
    console.log('  対象ID:', updatedEvent.id);

    let updateSuccess = false;
    
    setEvents(prev => {
      console.log('  現在のイベント数:', prev.length);
      
      const updatedEvents = prev.map(event => {
        if (event.id === updatedEvent.id) {
          console.log('  マッチするイベント発見:', event.title);
          console.log('  更新前:', event.timelineInfos);
          console.log('  更新後:', updatedEvent.timelineInfos);
          updateSuccess = true;
          
          // 完全に新しいオブジェクトを作成（参照を変更して再レンダリングを確実に発生させる）
          return {
            ...event,
            ...updatedEvent,
            timelineInfos: [...(updatedEvent.timelineInfos || [])], // 新しい配列参照
          };
        }
        return event;
      });

      if (updateSuccess) {
        console.log('✅ useAppState.updateEvent 成功');
      } else {
        console.log('❌ useAppState.updateEvent 失敗 - IDが見つかりません');
        console.log('  探索対象ID:', updatedEvent.id);
        console.log('  存在するIDs:', prev.map(e => e.id));
      }

      return updatedEvents;
    });

    setHasUnsavedChanges(true);
    
    // 状態更新を確認するため少し待ってから検証
    setTimeout(() => {
      setEvents(currentEvents => {
        const verifyEvent = currentEvents.find(e => e.id === updatedEvent.id);
        if (verifyEvent) {
          console.log('📊 更新後の検証:', verifyEvent.title);
          console.log('  検証結果timelineInfos:', verifyEvent.timelineInfos);
          
          // 期待値と実際値を比較
          const expected = JSON.stringify(updatedEvent.timelineInfos || []);
          const actual = JSON.stringify(verifyEvent.timelineInfos || []);
          
          if (expected === actual) {
            console.log('✅ 状態更新完全成功');
          } else {
            console.log('❌ 状態更新不完全');
            console.log('  期待値:', expected);
            console.log('  実際値:', actual);
          }
        } else {
          console.log('❌ 検証失敗 - イベントが見つかりません');
        }
        return currentEvents; // 変更なしで返す
      });
    }, 50);

    return updatedEvent;
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
    setHighlightedEvents(new Set());
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
    setHighlightedEvents(new Set());
    
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
          const searchText = newSearchTerm.toLowerCase();
          return (
            event.title.toLowerCase().includes(searchText) ||
            event.description.toLowerCase().includes(searchText) ||
            (event.tags && event.tags.some(tag => 
              tag.toLowerCase().includes(searchText)
            ))
          );
        })
        .map(event => event.id);
      
      setHighlightedEvents(new Set(matchedEventIds));
    } else {
      setHighlightedEvents(new Set());
    }
  }, [events]);

  // タグから検索語句を取得
  const getTopTagsFromSearch = useCallback(() => {
    if (!searchTerm.trim()) return [];
    
    const allTags = events.flatMap(event => event.tags || []);
    const tagCounts = {};
    
    allTags.forEach(tag => {
      if (tag.toLowerCase().includes(searchTerm.toLowerCase())) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    });
    
    return Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);
  }, [searchTerm, events]);

  // モーダル関連
  const handleEventClick = useCallback((event) => {
    console.log('イベントクリック:', event.title);
    setSelectedEvent(event);
  }, []);

  const handleTimelineClick = useCallback((timeline) => {
    console.log('年表クリック:', timeline.name);
    setSelectedTimeline(timeline);
  }, []);

  const closeEventModal = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  const closeTimelineModal = useCallback(() => {
    setSelectedTimeline(null);
  }, []);

  // データリセット
  const resetData = useCallback(() => {
    setEvents([]);
    setTimelines([]);
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
    updateEvent, // 修正版
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