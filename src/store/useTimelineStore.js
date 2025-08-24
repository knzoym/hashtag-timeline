// src/store/useTimelineStore.js
import { create } from 'zustand';
import { sampleEvents, initialTags } from '../utils/eventUtils';
import { extractTagsFromDescription, getYearFromX, getXFromYear } from '../utils/timelineUtils';
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
  currentView: 'graph', // 'graph', 'timeline', 'table', 'wiki', 'mypage'
  
  // UI State
  isModalOpen: false,
  editingEvent: null,
  newEventData: {
    title: '',
    description: '',
    date: new Date(),
    manualTags: [],
  },
  modalPosition: { x: 0, y: 0 },
  
  // Search State
  searchTerm: '',
  highlightedEvents: new Set(),

  // --- ACTIONS ---

  // Event Actions
  setEvents: (events) => set({ events }),
  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
  updateEvent: (updatedEvent) => set((state) => ({
    events: state.events.map((e) => e.id === updatedEvent.id ? updatedEvent : e),
  })),
  deleteEvent: (eventId) => set((state) => ({
    events: state.events.filter((e) => e.id !== eventId),
    timelines: state.timelines.map(timeline => ({
        ...timeline,
        events: timeline.events.filter(e => e.id !== eventId),
        temporaryEvents: (timeline.temporaryEvents || []).filter(e => e.id !== eventId),
        removedEvents: (timeline.removedEvents || []).filter(e => e.id !== eventId),
    }))
  })),

  // Timeline Actions
  setTimelines: (timelines) => set({ timelines }),
  createTimeline: () => {
    const { events, highlightedEvents, searchTerm, timelines } = get();
    if (highlightedEvents.size === 0) return;

    const filteredEvents = events.filter((event) => highlightedEvents.has(event.id));
    const timelineName = searchTerm.trim() || "新しい年表";

    const newTimeline = {
      id: Date.now(),
      name: timelineName,
      searchTerm: searchTerm,
      tags: [searchTerm.trim()],
      events: filteredEvents,
      createdAt: new Date(),
      eventCount: filteredEvents.length,
      isVisible: true,
      color: `hsl(${Math.random() * 360}, 60%, 50%)`,
    };
    set({ timelines: [...timelines, newTimeline], searchTerm: '', highlightedEvents: new Set() });
  },
  deleteTimeline: (timelineId) => {
    if (window.confirm("この年表を削除しますか？")) {
        set((state) => ({
            timelines: state.timelines.filter((t) => t.id !== timelineId)
        }));
    }
  },

  // View Control Actions
  setView: (view) => set({ currentView: view }),
  setPan: (pan) => set(pan),
  setScale: (newScale) => set({ scale: newScale }),
  resetView: () => set({
    scale: TIMELINE_CONFIG.DEFAULT_SCALE,
    panX: calculateInitialPanX(),
    panY: 0,
  }),

  // Search Actions
  setSearchTerm: (term) => {
    set({ searchTerm: term });
    if (term.trim() === "") {
      set({ highlightedEvents: new Set() });
      return;
    }
    const searchTerms = term.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    const matchingEventIds = new Set();
    get().events.forEach(event => {
      const eventTags = event.tags.map(tag => tag.toLowerCase());
      const eventTitle = event.title.toLowerCase();
      const allTermsMatch = searchTerms.every(
        st => eventTags.some(tag => tag.includes(st)) || eventTitle.includes(st)
      );
      if (allTermsMatch) {
        matchingEventIds.add(event.id);
      }
    });
    set({ highlightedEvents: matchingEventIds });
  },

  // Modal Actions
  openNewEventModal: (position, date) => set({
    isModalOpen: true,
    editingEvent: null,
    newEventData: { title: '', description: '', date: date || new Date(), manualTags: [] },
    modalPosition: position || { x: window.innerWidth / 2, y: window.innerHeight / 2 },
  }),
  openEditEventModal: (event, position) => set({
    isModalOpen: true,
    editingEvent: event,
    newEventData: {
      title: event.title,
      description: event.description,
      date: event.startDate,
      manualTags: event.tags.filter(
        (tag) => tag !== event.title && !extractTagsFromDescription(event.description).includes(tag)
      ),
    },
    modalPosition: position || { x: window.innerWidth / 2, y: window.innerHeight / 2 },
  }),
  closeModal: () => set({
    isModalOpen: false,
    editingEvent: null,
  }),
  updateNewEventData: (data) => set((state) => ({
    newEventData: { ...state.newEventData, ...data }
  })),
  saveEvent: () => {
    const { newEventData, editingEvent, events, allTags } = get();
    if (!newEventData.title.trim()) return;

    const extractedTags = extractTagsFromDescription(newEventData.description);
    const allEventTags = [
      newEventData.title,
      ...extractedTags,
      ...newEventData.manualTags,
    ];
    const eventTags = [...new Set(allEventTags.filter((tag) => tag.trim()))];
    
    const newTags = eventTags.filter((tag) => !allTags.includes(tag));
    if (newTags.length > 0) {
      set({ allTags: [...allTags, ...newTags] });
    }

    if (editingEvent) {
      const updatedEvent = {
        ...editingEvent,
        title: newEventData.title,
        startDate: newEventData.date,
        endDate: newEventData.date,
        description: newEventData.description,
        tags: eventTags,
      };
      get().updateEvent(updatedEvent);
    } else {
      const newEvent = {
        id: Date.now(),
        title: newEventData.title,
        startDate: newEventData.date,
        endDate: newEventData.date,
        description: newEventData.description,
        tags: eventTags,
      };
      get().addEvent(newEvent);
    }
    get().closeModal();
  },
}));
