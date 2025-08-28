// hooks/useTimelineLogic.js - データロジックのみに特化
import { useState, useCallback, useMemo } from 'react';
import { sampleEvents, initialTags } from '../utils/eventUtils';

export const useTimelineLogic = (timelineRef, coordinates) => {
  console.log('🚀 useTimelineLogic 初期化 - データロジック版');

  // === 基本データ状態 ===
  const [events, setEvents] = useState(() => {
    console.log('  初期イベント数:', sampleEvents?.length || 0);
    return sampleEvents || [];
  });
  
  const [timelines, setTimelines] = useState([]);
  const [allTags] = useState(() => initialTags || []);

  // === 検索・UI状態 ===
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTimeline, setSelectedTimeline] = useState(null);
  const [hoveredGroup, setHoveredGroup] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });

  // === 検索によるハイライト状態 ===
  const highlightedEvents = useMemo(() => {
    // searchTermが文字列であることを確認
    const safeTerm = (typeof searchTerm === 'string') ? searchTerm.trim() : '';
    if (!safeTerm) return new Set();
    
    const term = safeTerm.toLowerCase();
    const matchingEvents = events.filter(event => {
      // タイトル検索
      if (event.title?.toLowerCase().includes(term)) return true;
      
      // タグ検索（#なしでも#ありでも検索可能）
      const normalizedTerm = term.startsWith('#') ? term.slice(1) : term;
      if (event.tags?.some(tag => tag.toLowerCase().includes(normalizedTerm))) return true;
      
      // 説明文検索
      if (event.description?.toLowerCase().includes(term)) return true;
      
      return false;
    });
    
    return new Set(matchingEvents.map(e => e.id));
  }, [searchTerm, events]);

  // === テキスト幅計算 ===
  const calculateTextWidth = useCallback((text, fontSize = 11) => {
    try {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      context.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      return context.measureText(text || '').width;
    } catch (error) {
      console.warn('calculateTextWidth エラー:', error);
      return (text?.length || 0) * 8;
    }
  }, []);

  // === トップタグ取得（年表名生成用） ===
  const getTopTagsFromSearch = useCallback((eventsList) => {
    if (!eventsList) {
      eventsList = events.filter(event => highlightedEvents.has(event.id));
    }

    const allTags = [];
    eventsList.forEach(event => {
      if (event.tags && Array.isArray(event.tags)) {
        allTags.push(...event.tags);
      }
    });
    
    // タグをカウント
    const tagCount = {};
    allTags.forEach(tag => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
    
    return Object.entries(tagCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([tag]) => tag);
  }, [events, highlightedEvents]);

  // === イベント操作 ===
  const addEvent = useCallback((newEvent) => {
    const event = {
      ...newEvent,
      id: newEvent.id || Date.now(),
      startDate: new Date(newEvent.date || newEvent.startDate),
      endDate: new Date(newEvent.date || newEvent.endDate || newEvent.startDate)
    };
    setEvents(prev => [...prev, event]);
    console.log('✅ イベント追加:', event.title);
    return event;
  }, []);

  const updateEvent = useCallback((updatedEvent) => {
    setEvents(prev => prev.map(event => 
      event.id === updatedEvent.id ? updatedEvent : event
    ));
    console.log('✅ イベント更新:', updatedEvent.title);
  }, []);

  const deleteEvent = useCallback((eventId) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
    console.log('🗑️ イベント削除:', eventId);
  }, []);

  // === 年表操作 ===
  const createTimeline = useCallback(() => {
    const highlightedEventsList = events.filter(event => 
      highlightedEvents.has(event.id)
    );
    
    if (highlightedEventsList.length === 0) {
      alert("検索でイベントを選択してから年表を作成してください");
      return null;
    }

    const topTags = getTopTagsFromSearch(highlightedEventsList);
    const timelineName = topTags.length > 0 ? `#${topTags[0]}` : "新しい年表";

    const timeline = {
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

    setTimelines(prev => [...prev, timeline]);
    setSearchTerm(''); // 検索をクリア
    console.log('📋 年表作成完了:', timeline.name);
    return timeline;
  }, [events, highlightedEvents, getTopTagsFromSearch]);

  const deleteTimeline = useCallback((timelineId) => {
    setTimelines(prev => prev.filter(timeline => timeline.id !== timelineId));
    console.log('🗑️年表削除:', timelineId);
  }, []);

  // === モーダル操作 ===
  const openEventModal = useCallback((event, position = { x: 0, y: 0 }) => {
    setSelectedEvent(event);
    setModalPosition(position);
    setShowEventModal(true);
    console.log('📝 イベントモーダル開く:', event?.title);
  }, []);

  const closeEventModal = useCallback(() => {
    setShowEventModal(false);
    setSelectedEvent(null);
    console.log('📝 イベントモーダル閉じる');
  }, []);

  const openNewEventModal = useCallback((position = { x: 0, y: 0 }) => {
    setModalPosition(position);
    setShowNewEventModal(true);
    console.log('➕ 新規イベントモーダル開く');
  }, []);

  const closeNewEventModal = useCallback(() => {
    setShowNewEventModal(false);
    console.log('➕ 新規イベントモーダル閉じる');
  }, []);

  const openTimelineModal = useCallback((timeline, position = { x: 0, y: 0 }) => {
    setSelectedTimeline(timeline);
    setModalPosition(position);
    setShowTimelineModal(true);
    console.log('📊 年表モーダル開く:', timeline?.name);
  }, []);

  const closeTimelineModal = useCallback(() => {
    setShowTimelineModal(false);
    setSelectedTimeline(null);
    console.log('📊 年表モーダル閉じる');
  }, []);

  // === 検索操作 ===
  const handleSearchChange = useCallback((e) => {
    // eがイベントオブジェクトかstring値かを判定
    const term = typeof e === 'string' ? e : e?.target?.value || '';
    setSearchTerm(term);
    console.log('🔍 検索更新:', term);
  }, []);

  // === 年表軸情報の計算（座標系が必要な場合） ===
  const timelineAxes = useMemo(() => {
    if (!coordinates?.getXFromYear) return [];
    
    return timelines
      .filter(timeline => timeline.isVisible && 
        ((timeline.events?.length || 0) > 0 || (timeline.temporaryEvents?.length || 0) > 0))
      .map((timeline, index) => {
        const timelineY = 200 + index * 100; // TIMELINE_CONFIG.FIRST_ROW_Y相当
        
        const allEvents = [...(timeline.events || []), ...(timeline.temporaryEvents || [])];
        const years = allEvents
          .filter(e => e.startDate)
          .map(e => e.startDate.getFullYear());
        
        if (years.length === 0) return null;
        
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        const startX = coordinates.getXFromYear(minYear);
        const endX = coordinates.getXFromYear(maxYear);
        
        return {
          id: timeline.id,
          name: timeline.name,
          color: timeline.color,
          yPosition: timelineY,
          startX: Math.max(0, startX),
          endX: Math.min(window.innerWidth || 1920, endX),
          cardX: Math.max(50, startX - 20),
          eventCount: allEvents.length,
          minYear,
          maxYear
        };
      })
      .filter(Boolean);
  }, [timelines, coordinates]);

  // === デバッグ情報 ===
  console.log("useTimelineLogic state:", {
    events: events?.length || 0,
    timelines: timelines?.length || 0,
    highlightedEvents: highlightedEvents?.size || 0,
    searchTerm: searchTerm,
    timelineAxes: timelineAxes?.length || 0
  });

  // === 戻り値（既存コード互換性を保持） ===
  return {
    // データ
    events,
    timelines,
    Timelines: timelines, // 既存コード互換性
    allTags,
    setEvents,
    setTimelines,
    setCreatedTimelines: setTimelines, // 既存コード互換性
    
    // 検索
    searchTerm,
    highlightedEvents,
    handleSearchChange,
    getTopTagsFromSearch,
    
    // UI状態
    selectedEvent,
    selectedTimeline,
    hoveredGroup,
    setHoveredGroup,
    showEventModal,
    showTimelineModal,
    showNewEventModal,
    modalPosition,
    
    // イベント操作
    addEvent,
    updateEvent,
    deleteEvent,
    
    // 年表操作
    createTimeline,
    deleteTimeline,
    timelineAxes, // 座標系連携
    
    // モーダル操作
    openEventModal,
    closeEventModal,
    openNewEventModal,
    closeNewEventModal,
    openTimelineModal,
    closeTimelineModal,
    
    // ユーティリティ
    calculateTextWidth
  };
};