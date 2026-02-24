'use client';

import { useState } from 'react';
import { Event, Timeline } from '@/types';
import { EventModal } from './EventModal';

interface TimelineViewProps {
  events: Event[];
  timelines: Timeline[];
  selectedTimeline?: Timeline;
  onAddEvent: (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdateEvent: (id: string, updates: Partial<Event>) => void;
  onDeleteEvent: (id: string) => void;
  getEventsForTimeline: (timeline: Timeline) => Event[];
}

export function TimelineView({
  events,
  timelines,
  selectedTimeline,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  getEventsForTimeline,
}: TimelineViewProps) {
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>();

  const displayEvents = selectedTimeline
    ? getEventsForTimeline(selectedTimeline).sort((a, b) => a.date_year - b.date_year)
    : events.sort((a, b) => a.date_year - b.date_year);

  const handleAddEvent = () => {
    setEditingEvent(undefined);
    setIsEventModalOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingEvent) {
      onUpdateEvent(editingEvent.id, eventData);
    } else {
      onAddEvent(eventData);
    }
  };

  const yearRange = displayEvents.length > 0
    ? {
        min: Math.min(...displayEvents.map(e => e.date_year)),
        max: Math.max(...displayEvents.map(e => e.date_year))
      }
    : { min: 1900, max: 2100 };

  const yearScale = (year: number) => {
    const range = yearRange.max - yearRange.min;
    if (range === 0) return 50;
    return ((year - yearRange.min) / range) * 90 + 5;
  };

  const getTagColor = (tag: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
    ];
    return colors[tag.length % colors.length];
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">
            {selectedTimeline ? selectedTimeline.title : '全てのイベント'}
          </h2>
          {selectedTimeline && (
            <p className="text-gray-600 text-sm">{selectedTimeline.description}</p>
          )}
        </div>
        <button
          onClick={handleAddEvent}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          イベント追加
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="relative">
          <div className="absolute left-4 top-0 w-0.5 bg-gray-300 h-full"></div>
          
          <div className="space-y-4">
            {displayEvents.map((event, index) => (
              <div key={event.id} className="relative pl-12">
                <div className="absolute left-2 w-4 h-4 bg-blue-500 rounded-full -translate-x-1/2"></div>
                
                <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{event.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {event.date_year}
                        {event.date_month && `/${event.date_month}`}
                        {event.date_day && `/${event.date_day}`}
                      </p>
                      {event.description && (
                        <p className="text-gray-700 mb-3">{event.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {event.hashtags.map((tag) => (
                          <span
                            key={tag}
                            className={`px-2 py-1 rounded text-xs ${getTagColor(tag)}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="ml-4 flex gap-2">
                      <button
                        onClick={() => handleEditEvent(event)}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => onDeleteEvent(event.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
        event={editingEvent}
      />
    </div>
  );
}