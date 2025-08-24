// src/components/TableView/TableView.js
import React, { useState, useMemo, useCallback } from "react";
import { useTimelineStore } from '../../store/useTimelineStore';
import { extractTagsFromDescription } from "../../utils/timelineUtils";

const TableView = () => {
  const {
    events,
    highlightedEvents,
    updateEvent,
    deleteEvent
  } = useTimelineStore();

  const [sortField, setSortField] = useState("startDate");
  const [sortOrder, setSortOrder] = useState("asc");
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");

  const sortedEvents = useMemo(() => {
    let eventsToShow = [...events];


    return eventsToShow.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'startDate') {
        aValue = a.startDate.getTime();
        bValue = b.startDate.getTime();
      } else if (sortField === 'title') {
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
      }
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [events, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const saveEdit = useCallback((eventId, field) => {
      const event = sortedEvents.find((e) => e.id === eventId);
      if (!event) return;

      let processedValue = editValue;
      if (field === "startDate") {
        processedValue = new Date(editValue);
      }

      const updatedEvent = { ...event, [field]: processedValue };

      if (field === "title" || field === "description") {
        const extracted = extractTagsFromDescription(updatedEvent.description || "");
        const titleTag = updatedEvent.title.trim() ? [updatedEvent.title.trim()] : [];
        const manualTags = event.tags.filter(
          (tag) => tag !== event.title && !extractTagsFromDescription(event.description || "").includes(tag)
        );
        updatedEvent.tags = [...new Set([...titleTag, ...extracted, ...manualTags])];
      }

      updateEvent(updatedEvent);
      setEditingCell(null);
  }, [editValue, sortedEvents, updateEvent]);


  const startEdit = (eventId, field, value) => {
    setEditingCell({ eventId, field });
    setEditValue(field === 'startDate' ? value.toISOString().split('T')[0] : value || '');
  };

  const handleEventDelete = (eventId) => {
      if (window.confirm("このイベントを削除しますか？")) {
          deleteEvent(eventId);
      }
  };

  const styles = {
    container: { padding: "20px", backgroundColor: "white", height: "100%", overflow: "auto" },
    table: { border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden", backgroundColor: "white" },
    header: { display: "grid", gridTemplateColumns: "1fr 120px 2fr 2fr 100px", backgroundColor: "#f9fafb", fontWeight: "600" },
    headerCell: { padding: "12px", cursor: "pointer", userSelect: "none" },
    row: { display: "grid", gridTemplateColumns: "1fr 120px 2fr 2fr 100px", borderTop: "1px solid #f3f4f6" },
    cell: { padding: "12px", display: "flex", alignItems: "center", minHeight: '40px' },
    input: { width: "100%", border: "1px solid #3b82f6", borderRadius: "4px", padding: "4px 8px", boxSizing: 'border-box' },
  };

  return (
    <div style={styles.container}>
      <div style={styles.table}>
        <div style={styles.header}>
          <div style={styles.headerCell} onClick={() => handleSort('title')}>タイトル</div>
          <div style={styles.headerCell} onClick={() => handleSort('startDate')}>日付</div>
          <div style={styles.headerCell}>説明</div>
          <div style={styles.headerCell}>タグ</div>
          <div style={styles.headerCell}>操作</div>
        </div>
        {sortedEvents.map(event => (
          <div key={event.id} style={{...styles.row, backgroundColor: highlightedEvents.has(event.id) ? '#f0fdf4' : 'white'}}>
            <div style={styles.cell} onClick={() => startEdit(event.id, 'title', event.title)}>
              {editingCell?.eventId === event.id && editingCell?.field === 'title' ? (
                <input style={styles.input} value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => saveEdit(event.id, 'title')} autoFocus />
              ) : event.title}
            </div>
            <div style={styles.cell} onClick={() => startEdit(event.id, 'startDate', event.startDate)}>
              {editingCell?.eventId === event.id && editingCell?.field === 'startDate' ? (
                <input style={styles.input} type="date" value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => saveEdit(event.id, 'startDate')} autoFocus />
              ) : event.startDate.toLocaleDateString('ja-JP')}
            </div>
            <div style={styles.cell} onClick={() => startEdit(event.id, 'description', event.description)}>
                {editingCell?.eventId === event.id && editingCell?.field === 'description' ? (
                    <textarea value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => saveEdit(event.id, 'description')} autoFocus style={{...styles.input, height: '60px', resize: 'vertical'}} />
                ) : (event.description || '...')}
            </div>
            <div style={styles.cell}>{event.tags.join(', ')}</div>
            <div style={styles.cell}>
              <button onClick={() => handleEventDelete(event.id)}>削除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableView;