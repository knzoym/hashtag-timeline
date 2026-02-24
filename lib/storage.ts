import { Event, Timeline, TimelineEventOverride } from '@/types';

const STORAGE_KEY = {
  EVENTS: 'hashtag_timeline_events',
  TIMELINES: 'hashtag_timeline_timelines',
  OVERRIDES: 'hashtag_timeline_overrides',
};

export const storage = {
  events: {
    getAll: (): Event[] => {
      if (typeof window === 'undefined') return [];
      const data = localStorage.getItem(STORAGE_KEY.EVENTS);
      return data ? JSON.parse(data) : [];
    },
    save: (events: Event[]) => {
      if (typeof window === 'undefined') return;
      localStorage.setItem(STORAGE_KEY.EVENTS, JSON.stringify(events));
    },
    add: (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Event => {
      const events = storage.events.getAll();
      const newEvent: Event = {
        ...event,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      events.push(newEvent);
      storage.events.save(events);
      return newEvent;
    },
    update: (id: string, updates: Partial<Event>): Event | null => {
      const events = storage.events.getAll();
      const index = events.findIndex(e => e.id === id);
      if (index === -1) return null;
      
      events[index] = {
        ...events[index],
        ...updates,
        id: events[index].id,
        created_at: events[index].created_at,
        updated_at: new Date().toISOString(),
      };
      storage.events.save(events);
      return events[index];
    },
    delete: (id: string): boolean => {
      const events = storage.events.getAll();
      const filtered = events.filter(e => e.id !== id);
      if (filtered.length === events.length) return false;
      storage.events.save(filtered);
      return true;
    }
  },
  
  timelines: {
    getAll: (): Timeline[] => {
      if (typeof window === 'undefined') return [];
      const data = localStorage.getItem(STORAGE_KEY.TIMELINES);
      return data ? JSON.parse(data) : [];
    },
    save: (timelines: Timeline[]) => {
      if (typeof window === 'undefined') return;
      localStorage.setItem(STORAGE_KEY.TIMELINES, JSON.stringify(timelines));
    },
    add: (timeline: Omit<Timeline, 'id' | 'created_at' | 'updated_at'>): Timeline => {
      const timelines = storage.timelines.getAll();
      const newTimeline: Timeline = {
        ...timeline,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      timelines.push(newTimeline);
      storage.timelines.save(timelines);
      return newTimeline;
    },
    update: (id: string, updates: Partial<Timeline>): Timeline | null => {
      const timelines = storage.timelines.getAll();
      const index = timelines.findIndex(t => t.id === id);
      if (index === -1) return null;
      
      timelines[index] = {
        ...timelines[index],
        ...updates,
        id: timelines[index].id,
        created_at: timelines[index].created_at,
        updated_at: new Date().toISOString(),
      };
      storage.timelines.save(timelines);
      return timelines[index];
    },
    delete: (id: string): boolean => {
      const timelines = storage.timelines.getAll();
      const filtered = timelines.filter(t => t.id !== id);
      if (filtered.length === timelines.length) return false;
      storage.timelines.save(filtered);
      return true;
    }
  },
  
  overrides: {
    getAll: (): TimelineEventOverride[] => {
      if (typeof window === 'undefined') return [];
      const data = localStorage.getItem(STORAGE_KEY.OVERRIDES);
      return data ? JSON.parse(data) : [];
    },
    save: (overrides: TimelineEventOverride[]) => {
      if (typeof window === 'undefined') return;
      localStorage.setItem(STORAGE_KEY.OVERRIDES, JSON.stringify(overrides));
    }
  }
};