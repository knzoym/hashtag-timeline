'use client';

import { useState, useEffect } from 'react';
import { Event, Timeline, TimelineEventOverride } from '@/types';
import { storage } from '@/lib/storage';

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [overrides, setOverrides] = useState<TimelineEventOverride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      setEvents(storage.events.getAll());
      setTimelines(storage.timelines.getAll());
      setOverrides(storage.overrides.getAll());
      setLoading(false);
    };
    loadData();
  }, []);

  const addEvent = (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
    const newEvent = storage.events.add(event);
    setEvents([...events, newEvent]);
    return newEvent;
  };

  const updateEvent = (id: string, updates: Partial<Event>) => {
    const updatedEvent = storage.events.update(id, updates);
    if (updatedEvent) {
      setEvents(events.map(e => e.id === id ? updatedEvent : e));
    }
    return updatedEvent;
  };

  const deleteEvent = (id: string) => {
    const success = storage.events.delete(id);
    if (success) {
      setEvents(events.filter(e => e.id !== id));
    }
    return success;
  };

  const addTimeline = (timeline: Omit<Timeline, 'id' | 'created_at' | 'updated_at'>) => {
    const newTimeline = storage.timelines.add(timeline);
    setTimelines([...timelines, newTimeline]);
    return newTimeline;
  };

  const updateTimeline = (id: string, updates: Partial<Timeline>) => {
    const updatedTimeline = storage.timelines.update(id, updates);
    if (updatedTimeline) {
      setTimelines(timelines.map(t => t.id === id ? updatedTimeline : t));
    }
    return updatedTimeline;
  };

  const deleteTimeline = (id: string) => {
    const success = storage.timelines.delete(id);
    if (success) {
      setTimelines(timelines.filter(t => t.id !== id));
    }
    return success;
  };

  const getEventsForTimeline = (timeline: Timeline): Event[] => {
    const timelineOverrides = overrides.filter(o => o.timeline_id === timeline.id);
    
    const registeredEventIds = new Set(
      timelineOverrides
        .filter(o => o.override === 'register')
        .map(o => o.event_id)
    );
    
    const hiddenEventIds = new Set(
      timelineOverrides
        .filter(o => o.override === 'hide')
        .map(o => o.event_id)
    );

    return events.filter(event => {
      if (hiddenEventIds.has(event.id)) return false;
      
      if (registeredEventIds.has(event.id)) return true;
      
      if (timeline.date_range) {
        if (timeline.date_range.start_year && event.date_year < timeline.date_range.start_year) return false;
        if (timeline.date_range.end_year && event.date_year > timeline.date_range.end_year) return false;
      }
      
      if (timeline.tags.length === 0) return true;
      
      if (timeline.logic.mode === 'AND') {
        return timeline.tags.every(tag => event.hashtags.includes(tag));
      } else {
        return timeline.tags.some(tag => event.hashtags.includes(tag));
      }
    });
  };

  return {
    events,
    timelines,
    overrides,
    loading,
    addEvent,
    updateEvent,
    deleteEvent,
    addTimeline,
    updateTimeline,
    deleteTimeline,
    getEventsForTimeline,
  };
}