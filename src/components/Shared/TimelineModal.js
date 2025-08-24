// src/components/Shared/TimelineModal.js
import React from 'react';
import { useTimelineStore } from '../../store/useTimelineStore';

// EventItem sub-component for displaying events within the modal
const EventItem = ({ event, type, onRemove, onAdd }) => {
  const getTypeStyle = () => {
    switch (type) {
      case 'original':
        return { backgroundColor: '#f0fdf4', borderLeft: '3px solid #10b981' };
      case 'temporary':
        return { backgroundColor: '#fffbeb', borderLeft: '3px solid #f59e0b' };
      case 'removed':
        return { backgroundColor: '#fef2f2', borderLeft: '3px solid #ef4444' };
      default:
        return {};
    }
  };

  const styles = {
    item: {
      ...getTypeStyle(),
      padding: '12px',
      marginBottom: '8px',
      borderRadius: '6px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    info: {
      fontWeight: '500',
      fontSize: '14px',
      color: '#374151',
    },
    meta: {
      fontSize: '12px',
      color: '#6b7280'
    },
    actionButton: {
      padding: '4px 8px',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '12px',
      cursor: 'pointer'
    }
  };

  const actionButton = type === 'removed' ? (
    <button onClick={onAdd} style={{ ...styles.actionButton, backgroundColor: '#10b981' }}>
      復元
    </button>
  ) : (
    <button onClick={onRemove} style={{ ...styles.actionButton, backgroundColor: '#ef4444' }}>
      削除
    </button>
  );

  return (
    <div style={styles.item}>
      <div>
        <div style={styles.info}>{event.title}</div>
        <div style={styles.meta}>{event.startDate.getFullYear()}年 • {event.tags.slice(0, 3).join(', ')}</div>
      </div>
      <div>{actionButton}</div>
    </div>
  );
};


const TimelineModal = () => {
  const { 
    isOpen, 
    timeline, 
    closeTimelineModal, 
    removeEventFromTimeline, 
    addEventToTimeline 
  } = useTimelineStore(state => ({
    isOpen: state.timelineModalOpen,
    timeline: state.selectedTimelineForModal,
    onClose: state.closeTimelineModal,
    onEventRemove: state.removeEventFromTimeline,
    onEventAdd: state.addEventToTimeline,
  }));

  if (!isOpen || !timeline) return null;

  const temporaryEvents = timeline.temporaryEvents || [];
  const removedEvents = timeline.removedEvents || [];
  const originalEvents = timeline.events.filter(event => 
    !temporaryEvents.some(temp => temp.id === event.id) &&
    !removedEvents.some(removed => removed.id === event.id)
  );

  const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '600px', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid', borderColor: timeline.color, paddingBottom: '12px' },
    title: { margin: 0, fontSize: '20px', fontWeight: '600' },
    closeButton: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' },
    sectionTitle: { fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '12px' },
    eventList: { maxHeight: '150px', overflow: 'auto', paddingRight: '8px' },
  };

  return (
    <div style={styles.overlay} onClick={closeTimelineModal}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>{timeline.name}</h2>
          <button onClick={closeTimelineModal} style={styles.closeButton}>×</button>
        </div>
        
        {originalEvents.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
                <h3 style={styles.sectionTitle}>検索でヒットしたイベント ({originalEvents.length}件)</h3>
                <div style={styles.eventList}>
                    {originalEvents.map(event => <EventItem key={event.id} event={event} type="original" onRemove={() => removeEventFromTimeline(timeline.id, event.id)} />)}
                </div>
            </div>
        )}

        {temporaryEvents.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
                <h3 style={styles.sectionTitle}>仮登録されたイベント ({temporaryEvents.length}件)</h3>
                <div style={styles.eventList}>
                    {temporaryEvents.map(event => <EventItem key={event.id} event={event} type="temporary" onRemove={() => removeEventFromTimeline(timeline.id, event.id)} />)}
                </div>
            </div>
        )}

        {removedEvents.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
                <h3 style={styles.sectionTitle}>仮削除されたイベント ({removedEvents.length}件)</h3>
                <div style={styles.eventList}>
                    {removedEvents.map(event => <EventItem key={event.id} event={event} type="removed" onAdd={() => addEventToTimeline(event, timeline.id)} />)}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default TimelineModal;
