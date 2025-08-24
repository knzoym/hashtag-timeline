// src/components/TimelineView/SearchPanel.js
import React from 'react';
import { useTimelineStore } from '../../store/useTimelineStore';

export const SearchPanel = () => {
  const { 
    searchTerm, 
    highlightedEvents, 
    setSearchTerm, 
    createTimeline 
  } = useTimelineStore();

  const styles = {
    panel: {
      position: "absolute",
      top: "20px",
      left: "20px",
      width: "220px",
      backgroundColor: "rgba(245, 245, 243, 0.9)",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      zIndex: 10,
      padding: "16px",
    },
    input: {
      width: "100%",
      padding: "8px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      marginBottom: "12px",
      fontSize: "14px",
      boxSizing: "border-box",
    },
    button: {
      width: "100%",
      backgroundColor: "#319ca5ff",
      color: "white",
      padding: "8px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
      transition: 'opacity 0.2s',
    },
  };

  return (
    <div style={styles.panel}>
      <input
        type="text"
        placeholder="タグで絞り込み..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={styles.input}
      />
      <button
        style={{
          ...styles.button,
          opacity: highlightedEvents.size > 0 ? 1 : 0.5,
          cursor: highlightedEvents.size > 0 ? "pointer" : "not-allowed",
        }}
        disabled={highlightedEvents.size === 0}
        onClick={createTimeline}
      >
        年表を作成 ({highlightedEvents.size})
      </button>
    </div>
  );
};
