// src/components/TimelineView/EventCard.js
import React from 'react';
import { truncateTitle } from '../../utils/timelineUtils';

const EventCard = ({ event, isHighlighted, onMouseDown }) => {
  const truncatedTitle = truncateTitle(event.title);

  const eventColors = {
    backgroundColor: isHighlighted ? "#10b981" : (event.timelineColor || '#6b7280'),
    textColor: "white",
    borderColor: isHighlighted ? "#059669" : (event.timelineColor || 'transparent'),
  };

  const styles = {
    wrapper: {
      position: 'absolute',
      left: event.adjustedPosition.x,
      top: event.adjustedPosition.y,
      transform: 'translateX(-50%)',
      zIndex: isHighlighted ? 5 : 4,
      textAlign: 'center',
      userSelect: 'none',
      cursor: 'pointer',
    },
    year: {
      fontSize: '10px',
      color: '#666',
      marginBottom: '2px',
    },
    card: {
      padding: '4px 8px',
      borderRadius: '4px',
      color: eventColors.textColor,
      backgroundColor: eventColors.backgroundColor,
      border: `2px solid ${eventColors.borderColor}`,
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      fontSize: '11px',
      fontWeight: '500',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      width: event.calculatedWidth || 'auto',
    },
  };

  return (
    <div 
      style={styles.wrapper}
      data-event-id={event.id}
      onMouseDown={onMouseDown}
    >
      <div style={styles.year}>{event.startDate.getFullYear()}</div>
      <div style={styles.card}>
        {truncatedTitle}
      </div>
    </div>
  );
};

export default EventCard;
