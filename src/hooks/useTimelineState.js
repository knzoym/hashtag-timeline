// hooks/useTimelineState.js
import { useState, useCallback } from 'react';
import { sampleEvents, initialTags } from '../utils/eventUtils';

export const useTimelineState = () => {
  console.log('📊 useTimelineState 初期化');

  // イベントデータ
  const [events, setEvents] = useState(() => {
    console.log('  初期イベント:', sampleEvents?.length || 0);
    return sampleEvents || [];
  });
  
  const [allTags, setAllTags] = useState(() => {
    console.log('  初期タグ:', initialTags?.length || 0);
    return initialTags || [];
  });

  // 年表データ
  const [timelines, setTimelines] = useState([]);

  // イベント操作
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

  // 年表操作
  const createTimeline = useCallback((timelineData) => {
    const timeline = {
      id: Date.now(),
      name: '新しい年表',
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      events: [],
      temporaryEvents: [],
      removedEvents: [],
      isVisible: true,
      createdAt: new Date(),
      ...timelineData
    };
    setTimelines(prev => [...prev, timeline]);
    console.log('📋 年表作成:', timeline.name);
    return timeline;
  }, []);

  const deleteTimeline = useCallback((timelineId) => {
    setTimelines(prev => prev.filter(timeline => timeline.id !== timelineId));
    console.log('🗑️ 年表削除:', timelineId);
  }, []);

  return {
    // データ
    events,
    setEvents,
    timelines,
    setTimelines,
    allTags,
    setAllTags,
    
    // 操作
    addEvent,
    updateEvent,
    deleteEvent,
    createTimeline,
    deleteTimeline
  };
};