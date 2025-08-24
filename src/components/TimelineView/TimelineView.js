// src/components/TimelineView/TimelineView.js
import React, { useRef, useCallback, useMemo } from 'react';
import { useTimelineStore } from '../../store/useTimelineStore';
import { getXFromYear, getYearFromX } from '../../utils/timelineUtils';
import { TIMELINE_CONFIG } from '../../constants/timelineConfig';
import { layoutWithGroups } from '../../utils/layoutUtils';
import YearMarkers from './YearMarkers';
import EventCard from './EventCard';
import { SearchPanel } from './SearchPanel';

const TimelineView = () => {
  const { 
    events, scale, panX, panY, setPan, setScale, 
    openNewEventModal, openEditEventModal, highlightedEvents 
  } = useTimelineStore();
  
  const timelineRef = useRef(null);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const currentPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * scale;

  const positionedData = useMemo(() => {
    const calculateTextWidth = (text) => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        context.font = `500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        return context.measureText(text).width;
    };

    const getEventX = (id) => {
        const event = events.find(e => e.id === id);
        if (!event) return 0;
        return getXFromYear(event.startDate.getFullYear(), currentPixelsPerYear, 0);
    };

    const laneTop = (lane) => TIMELINE_CONFIG.MAIN_TIMELINE_Y + 60 + lane * 40;

    return layoutWithGroups({
        events, 
        getEventX, 
        laneTop, 
        laneHeight: 36, 
        calculateTextWidth
    });
  }, [events, currentPixelsPerYear]);

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('button') || e.target.closest('[data-event-id]')) return;
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    if (timelineRef.current) timelineRef.current.style.cursor = 'grabbing';
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;
    setPan({ panX: panX + deltaX, panY: panY + deltaY });
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, [panX, panY, setPan]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    if (timelineRef.current) timelineRef.current.style.cursor = 'grab';
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const yearAtMouse = getYearFromX(mouseX, currentPixelsPerYear, panX);
    const newScale = Math.max(0.25, Math.min(500, scale * (e.deltaY > 0 ? 0.9 : 1.1)));
    const newPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * newScale;
    const newPanX = mouseX - (yearAtMouse + 5000) * newPixelsPerYear;
    setScale(newScale);
    setPan({ panX: newPanX, panY });
  }, [scale, panX, panY, currentPixelsPerYear, setScale, setPan]);

  const handleDoubleClick = useCallback((e) => {
    const eventElement = e.target.closest('[data-event-id]');
    if (eventElement) {
      const eventId = parseInt(eventElement.dataset.eventId, 10);
      const event = events.find(ev => ev.id === eventId);
      if(event) openEditEventModal(event, {x: e.clientX, y: e.clientY});
      return;
    }
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const year = getYearFromX(clickX, currentPixelsPerYear, panX);
    openNewEventModal({ x: e.clientX, y: e.clientY }, new Date(Math.round(year), 0, 1));
  }, [currentPixelsPerYear, panX, events, openEditEventModal, openNewEventModal]);

  return (
    <div
      ref={timelineRef}
      style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#fdfdfc', cursor: 'grab', overflow: 'hidden' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
    >
      <div style={{ position: 'absolute', transform: `translate(${panX}px, ${panY}px)` }}>
        <YearMarkers />
        {positionedData.allEvents.filter(e => !e.hiddenByGroup).map(event => (
          <EventCard 
            key={event.id} 
            event={event}
            isHighlighted={highlightedEvents.has(event.id)}
          />
        ))}
      </div>
      <SearchPanel />
    </div>
  );
};

export default TimelineView;
