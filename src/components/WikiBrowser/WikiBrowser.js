// src/components/WikiBrowser/WikiBrowser.js
import React, { useState, useEffect, useCallback } from 'react';
import { useTimelineStore } from '../../store/useTimelineStore';
import { useWikiData } from '../../hooks/useWikiData';

const WikiBrowser = ({ user, onImportEvent }) => {
  const setView = useTimelineStore(state => state.setView);
  const [searchTerm, setSearchTerm] = useState('');
  const [sharedEvents, setSharedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const wikiData = useWikiData(user);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const events = await wikiData.getSharedEvents(searchTerm);
    setSharedEvents(events);
    setLoading(false);
  }, [wikiData, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => loadEvents(), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, loadEvents]);

  const styles = {
    container: { padding: "20px", backgroundColor: "white", height: "100%", overflow: "auto" },
    header: { textAlign: 'center', marginBottom: '24px' },
    title: { margin: '0 0 8px 0', fontSize: '28px' },
    backButton: { padding: "8px 16px", backgroundColor: "#6b7280", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", marginTop: '16px' },
    searchInput: { width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box' },
    eventCard: { border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '12px' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📚 TLwiki (Timeline Wiki)</h1>
        <p>みんなでイベント情報を蓄積・共有</p>
        <button style={styles.backButton} onClick={() => setView('timeline')}>← 年表に戻る</button>
      </div>
      
      <input
        type="text"
        placeholder="Wiki内を検索..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={styles.searchInput}
      />

      <div>
        {loading ? <p>読み込み中...</p> : sharedEvents.map(event => (
          <div key={event.id} style={styles.eventCard}>
            <h4>{event.title} ({new Date(event.start_date).getFullYear()})</h4>
            <p>{event.description}</p>
            <button onClick={() => onImportEvent(wikiData.importEventToPersonal(event))}>インポート</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WikiBrowser;
