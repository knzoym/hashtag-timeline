// src/store/useTimelineStore.js
import { create } from 'zustand';
import { sampleEvents, initialTags } from '../utils/eventUtils';
import { extractTagsFromDescription } from '../utils/timelineUtils';
import { TIMELINE_CONFIG } from '../constants/timelineConfig';

const calculateInitialPanX = () => {
  const initialPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * TIMELINE_CONFIG.DEFAULT_SCALE;
  const targetX = (2024 - -5000) * initialPixelsPerYear;
  return window.innerWidth / 2 - targetX;
};

export const useTimelineStore = create((set, get) => ({
  // --- STATE ---
  events: sampleEvents,
  timelines: [],
  allTags: initialTags,
  
  // View Controls
  scale: TIMELINE_CONFIG.DEFAULT_SCALE,
  panX: calculateInitialPanX(),
  panY: 0,
  currentView: 'timeline', // デフォルトをtimelineに変更
  
  // UI State
  isModalOpen: false,
  editingEvent: null,
  newEventData: { title: '', description: '', date: new Date(), manualTags: [] },
  modalPosition: { x: 0, y: 0 },
  
  // Timeline Modal State
  timelineModalOpen: false,
  selectedTimelineForModal: null,
  
  // Search State
  searchTerm: '',
  highlightedEvents: new Set(),

  // --- ACTIONS ---

  // Event Actions
  setEvents: (events) => {
    set({ events: Array.isArray(events) ? events : [] });
  },

  addEvent: (event) => {
    if (!event || !event.id) return;
    set((state) => ({ 
      events: [...state.events, event] 
    }));
  },

  updateEvent: (updatedEvent) => {
    if (!updatedEvent || !updatedEvent.id) return;
    set((state) => ({
      events: state.events.map((e) => e.id === updatedEvent.id ? updatedEvent : e),
    }));
  },

  deleteEvent: (eventId) => {
    if (!eventId) return;
    set((state) => ({
      events: state.events.filter((e) => e.id !== eventId),
      timelines: state.timelines.map(timeline => ({
          ...timeline,
          events: timeline.events.filter(e => e.id !== eventId),
          temporaryEvents: (timeline.temporaryEvents || []).filter(e => e.id !== eventId),
          removedEvents: (timeline.removedEvents || []).filter(e => e.id !== eventId),
      }))
    }));
  },

  // Timeline Actions
  setTimelines: (timelines) => {
    set({ timelines: Array.isArray(timelines) ? timelines : [] });
  },

  createTimeline: () => {
    const { events, highlightedEvents, searchTerm, timelines } = get();
    if (highlightedEvents.size === 0) return;
    
    const filteredEvents = events.filter((event) => highlightedEvents.has(event.id));
    const newTimeline = {
      id: Date.now(),
      name: searchTerm.trim() || "新しい年表",
      searchTerm: searchTerm,
      tags: [searchTerm.trim()],
      events: filteredEvents,
      createdAt: new Date(),
      eventCount: filteredEvents.length,
      isVisible: true,
      color: `hsl(${Math.random() * 360}, 60%, 50%)`,
    };
    
    set({ 
      timelines: [...timelines, newTimeline], 
      searchTerm: '', 
      highlightedEvents: new Set() 
    });
  },

  deleteTimeline: (timelineId) => {
    if (!timelineId) return;
    if (window.confirm("この年表を削除しますか？")) {
        set((state) => ({ 
          timelines: state.timelines.filter((t) => t.id !== timelineId) 
        }));
    }
  },

  addEventToTimeline: (event, timelineId) => {
    if (!event || !timelineId) return;
    set(state => ({
      timelines: state.timelines.map(timeline => {
        if (timeline.id === timelineId) {
          const temporaryEvents = timeline.temporaryEvents || [];
          const removedEvents = timeline.removedEvents || [];
          
          // 既に存在する場合は削除リストから除去
          if (temporaryEvents.some(e => e.id === event.id) || timeline.events.some(e => e.id === event.id)) {
            return { 
              ...timeline, 
              removedEvents: removedEvents.filter(e => e.id !== event.id) 
            };
          }
          
          // 新規追加
          return { 
            ...timeline, 
            temporaryEvents: [...temporaryEvents, event], 
            removedEvents: removedEvents.filter(e => e.id !== event.id) 
          };
        }
        return timeline;
      })
    }));
  },

  removeEventFromTimeline: (timelineId, eventId) => {
    if (!timelineId || !eventId) return;
    set(state => ({
      timelines: state.timelines.map(timeline => {
        if (timeline.id === timelineId) {
          const eventToRemove = timeline.events.find(e => e.id === eventId);
          return {
            ...timeline,
            temporaryEvents: (timeline.temporaryEvents || []).filter(e => e.id !== eventId),
            removedEvents: eventToRemove ? [...(timeline.removedEvents || []), eventToRemove] : (timeline.removedEvents || []),
          };
        }
        return timeline;
      })
    }));
  },
  
  // View Control Actions
  setView: (view) => {
    const validViews = ['graph', 'timeline', 'table', 'wiki', 'mypage'];
    if (validViews.includes(view)) {
      set({ currentView: view });
    }
  },

  setPan: (pan) => {
    if (typeof pan === 'object' && pan !== null) {
      set(state => ({
        panX: typeof pan.panX === 'number' ? pan.panX : state.panX,
        panY: typeof pan.panY === 'number' ? pan.panY : state.panY,
      }));
    }
  },

  setScale: (newScale) => {
    if (typeof newScale === 'number' && newScale > 0) {
      set({ scale: newScale });
    }
  },

  resetView: () => {
    set({ 
      scale: TIMELINE_CONFIG.DEFAULT_SCALE, 
      panX: calculateInitialPanX(), 
      panY: 0 
    });
  },

  // Search Actions
  setSearchTerm: (term) => {
    const searchTerm = typeof term === 'string' ? term : '';
    set({ searchTerm });
    
    if (!searchTerm.trim()) {
      set({ highlightedEvents: new Set() });
      return;
    }

    const { events } = get();
    const searchTerms = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);
    const matchingEventIds = new Set(
      events.filter(event => 
        searchTerms.every(st => 
          event.title.toLowerCase().includes(st) || 
          (event.tags && event.tags.some(tag => tag.toLowerCase().includes(st)))
        )
      ).map(e => e.id)
    );
    
    set({ highlightedEvents: matchingEventIds });
  },

  // Modal Actions
  openNewEventModal: (position, date) => {
    const modalPosition = position || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const eventDate = date || new Date();
    
    set({ 
      isModalOpen: true, 
      editingEvent: null, 
      newEventData: { 
        title: '', 
        description: '', 
        date: eventDate, 
        manualTags: [] 
      }, 
      modalPosition 
    });
  },

  openEditEventModal: (event, position) => {
    if (!event) return;
    
    const modalPosition = position || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const extractedTags = event.description ? extractTagsFromDescription(event.description) : [];
    const manualTags = (event.tags || []).filter(tag => 
      tag !== event.title && !extractedTags.includes(tag)
    );
    
    set({ 
      isModalOpen: true, 
      editingEvent: event, 
      newEventData: { 
        title: event.title || '', 
        description: event.description || '', 
        date: event.startDate || new Date(), 
        manualTags 
      }, 
      modalPosition 
    });
  },

  closeModal: () => {
    set({ 
      isModalOpen: false, 
      editingEvent: null 
    });
  },

  updateNewEventData: (data) => {
    if (typeof data !== 'object' || data === null) return;
    set((state) => ({ 
      newEventData: { 
        ...state.newEventData, 
        ...data 
      } 
    }));
  },

  saveEvent: () => {
    const { newEventData, editingEvent, allTags, events } = get();
    
    if (!newEventData.title || !newEventData.title.trim()) return;
    
    const extractedTags = newEventData.description ? extractTagsFromDescription(newEventData.description) : [];
    const titleTag = newEventData.title.trim() ? [newEventData.title.trim()] : [];
    const manualTags = Array.isArray(newEventData.manualTags) ? newEventData.manualTags : [];
    
    const tags = [...new Set([...titleTag, ...extractedTags, ...manualTags])];
    const newTags = tags.filter(tag => !allTags.includes(tag));
    
    // 新しいタグを追加
    if (newTags.length > 0) {
      set(state => ({ allTags: [...state.allTags, ...newTags] }));
    }

    if (editingEvent) {
      // 既存イベントの更新
      const updatedEvent = { 
        ...editingEvent, 
        title: newEventData.title, 
        startDate: newEventData.date, 
        endDate: newEventData.date, 
        description: newEventData.description || '', 
        tags 
      };
      
      set(state => ({
        events: state.events.map((e) => e.id === editingEvent.id ? updatedEvent : e),
      }));
    } else {
      // 新しいイベントの追加
      const newEvent = { 
        id: Date.now(), 
        title: newEventData.title, 
        startDate: newEventData.date, 
        endDate: newEventData.date, 
        description: newEventData.description || '', 
        tags 
      };
      
      set(state => ({ events: [...state.events, newEvent] }));
    }
    
    // モーダルを閉じる
    set({ 
      isModalOpen: false, 
      editingEvent: null 
    });
  },

  // Timeline Modal Actions
  openTimelineModal: (timeline) => {
    if (!timeline) return;
    set({ 
      timelineModalOpen: true, 
      selectedTimelineForModal: timeline 
    });
  },

  closeTimelineModal: () => {
    set({ 
      timelineModalOpen: false, 
      selectedTimelineForModal: null 
    });
  },
}));