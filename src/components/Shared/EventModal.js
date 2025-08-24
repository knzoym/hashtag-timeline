// src/components/Shared/EventModal.js
import React from 'react';
import { useTimelineStore } from '../../store/useTimelineStore';
import { extractTagsFromDescription } from '../../utils/timelineUtils';

export const EventModal = () => {
  const { 
    isOpen, editingEvent, newEventData, modalPosition, 
    saveEvent, closeModal, updateNewEventData 
  } = useTimelineStore(state => ({
    isOpen: state.isModalOpen,
    editingEvent: state.editingEvent,
    newEventData: state.newEventData,
    modalPosition: state.modalPosition,
    saveEvent: state.saveEvent,
    closeModal: state.closeModal,
    updateNewEventData: state.updateNewEventData,
  }));

  if (!isOpen) return null;

  const getAllCurrentTags = () => {
    const extracted = extractTagsFromDescription(newEventData.description);
    const titleTag = newEventData.title.trim() ? [newEventData.title.trim()] : [];
    return [...new Set([...titleTag, ...extracted, ...newEventData.manualTags])];
  };

  const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.2)', zIndex: 1000 },
    modal: { position: 'fixed', left: modalPosition.x, top: modalPosition.y, transform: 'translate(-50%, 20px)', width: 320, backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '16px', zIndex: 1001 },
    input: { width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', marginBottom: '12px' },
    textarea: { width: '100%', height: '60px', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', marginBottom: '12px' },
    buttonContainer: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }
  };

  return (
    <div style={styles.overlay} onClick={closeModal}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <h3>{editingEvent ? "イベントを編集" : "新しいイベント"}</h3>
        <input 
          type="date"
          style={styles.input}
          value={newEventData.date.toISOString().split("T")[0]}
          onChange={(e) => updateNewEventData({ date: new Date(e.target.value) })}
        />
        <input 
          type="text" 
          placeholder="イベントタイトル"
          style={styles.input}
          value={newEventData.title}
          onChange={(e) => updateNewEventData({ title: e.target.value })}
          autoFocus
        />
        <textarea
          placeholder="説明文。例: #建築 #モダニズム"
          style={styles.textarea}
          value={newEventData.description}
          onChange={(e) => updateNewEventData({ description: e.target.value })}
        />
        <div>
            <strong>Tags:</strong> {getAllCurrentTags().join(', ')}
        </div>
        <div style={styles.buttonContainer}>
            <button onClick={closeModal}>キャンセル</button>
            <button onClick={saveEvent}>{editingEvent ? "更新" : "作成"}</button>
        </div>
      </div>
    </div>
  );
};
