// src/components/tabs/EventEditTab.js - ちらつき修正版
import React, { useState, useCallback, useMemo } from 'react';

const EventEditTab = ({
  events = [],
  timelines = [],
  user,
  onEventUpdate,
  onEventDelete,
  onAddEvent,
  isPersonalMode,
  isWikiMode,
  enableLinking = true,
  showRelatedEvents = true,
  onMenuAction
}) => {
  const [selectedEventId, setSelectedEventId] = useState(() => events[0]?.id || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEvent, setEditingEvent] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 現在選択されているイベント（安全な取得）
  const selectedEvent = useMemo(() => {
    if (!events || events.length === 0) return null;
    
    const event = events.find(e => e.id === selectedEventId);
    if (!event && events.length > 0) {
      const firstEvent = events[0];
      setSelectedEventId(firstEvent.id);
      return firstEvent;
    }
    return event;
  }, [events, selectedEventId]);
  
  // 関連イベントを取得（タグベース）
  const relatedEvents = useMemo(() => {
    if (!selectedEvent || !showRelatedEvents) return [];
    
    const eventTags = selectedEvent.tags || [];
    if (eventTags.length === 0) return [];
    
    return events
      .filter(event => event.id !== selectedEvent.id)
      .map(event => {
        const commonTags = (event.tags || []).filter(tag => eventTags.includes(tag));
        return {
          ...event,
          commonTags,
          relevanceScore: commonTags.length
        };
      })
      .filter(event => event.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10);
  }, [selectedEvent, events, showRelatedEvents]);
  
  // 検索結果
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const term = searchTerm.toLowerCase().trim();
    return events
      .filter(event => 
        event.id !== selectedEventId &&
        (event.title?.toLowerCase().includes(term) ||
         event.description?.toLowerCase().includes(term) ||
         event.tags?.some(tag => tag.toLowerCase().includes(term)))
      )
      .slice(0, 20);
  }, [searchTerm, events, selectedEventId]);
  
  // タグを抽出するヘルパー関数
  const extractTagsFromDescription = useCallback((description) => {
    if (!description) return [];
    const tagMatches = description.match(/#[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+/g);
    return tagMatches ? tagMatches.map(tag => tag.slice(1)) : [];
  }, []);
  
  // 編集開始
  const startEditing = useCallback((event) => {
    setEditingEvent({
      ...event,
      title: event.title || '',
      description: event.description || '',
      tags: [...(event.tags || [])],
      startDate: event.startDate || new Date(),
      endDate: event.endDate || null
    });
    setPreviewMode(false);
  }, []);
  
  // 編集保存
  const saveEdit = useCallback(async () => {
    if (!editingEvent || !editingEvent.title.trim()) {
      alert('タイトルを入力してください');
      return;
    }

    try {
      setIsLoading(true);
      
      const extractedTags = extractTagsFromDescription(editingEvent.description);
      const allTags = [...new Set([...editingEvent.tags, ...extractedTags])];

      const updatedEvent = {
        ...editingEvent,
        title: editingEvent.title.trim(),
        tags: allTags,
        updatedAt: new Date()
      };

      await onEventUpdate?.(updatedEvent);
      setEditingEvent(null);
    } catch (error) {
      console.error('イベント更新エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [editingEvent, extractTagsFromDescription, onEventUpdate]);
  
  // 編集キャンセル
  const cancelEdit = useCallback(() => {
    setEditingEvent(null);
    setPreviewMode(false);
  }, []);

  const styles = {
    container: {
      display: 'flex',
      height: '100%',
      backgroundColor: '#f9fafb'
    },
    sidebar: {
      width: '300px',
      borderRight: '1px solid #e5e7eb',
      backgroundColor: 'white',
      display: 'flex',
      flexDirection: 'column'
    },
    searchBox: {
      padding: '16px',
      borderBottom: '1px solid #e5e7eb'
    },
    searchInput: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      boxSizing: 'border-box'
    },
    eventList: {
      flex: 1,
      overflow: 'auto'
    },
    eventItem: {
      padding: '12px 16px',
      borderBottom: '1px solid #f3f4f6',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    eventItemActive: {
      backgroundColor: '#eff6ff',
      borderLeft: '4px solid #3b82f6'
    },
    eventTitle: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#1f2937',
      marginBottom: '4px'
    },
    eventDate: {
      fontSize: '12px',
      color: '#6b7280'
    },
    mainEditor: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'white'
    },
    editorHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 24px',
      borderBottom: '1px solid #e5e7eb'
    },
    editorTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1f2937'
    },
    editorActions: {
      display: 'flex',
      gap: '8px'
    },
    actionButton: {
      padding: '8px 16px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      backgroundColor: 'white',
      color: '#374151',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500'
    },
    primaryButton: {
      backgroundColor: '#3b82f6',
      color: 'white',
      borderColor: '#3b82f6'
    },
    dangerButton: {
      backgroundColor: '#ef4444',
      color: 'white',
      borderColor: '#ef4444'
    },
    editorContent: {
      flex: 1,
      padding: '24px',
      overflow: 'auto'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '8px'
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      boxSizing: 'border-box'
    },
    textarea: {
      width: '100%',
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      minHeight: '120px',
      resize: 'vertical',
      fontFamily: 'inherit',
      boxSizing: 'border-box'
    },
    dateInput: {
      width: '200px',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px'
    },
    tagContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
      marginTop: '8px'
    },
    tag: {
      padding: '4px 8px',
      backgroundColor: '#eff6ff',
      color: '#1e40af',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500'
    },
    loadingContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      backgroundColor: '#f9fafb'
    },
    loadingMessage: {
      textAlign: 'center',
      color: '#6b7280',
      fontSize: '16px'
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '4px solid #e5e7eb',
      borderTop: '4px solid #3b82f6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 16px'
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '16px'
    },
    addButton: {
      marginTop: '16px',
      padding: '12px 24px',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer'
    }
  };

  // データが空の場合の表示
  if (!events || events.length === 0) {
    return (
      <div style={styles.loadingContainer}>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div style={styles.loadingMessage}>
          {isLoading ? (
            <>
              <div style={styles.spinner}></div>
              データを読み込み中...
            </>
          ) : (
            <>
              <div style={styles.emptyIcon}>📝</div>
              <div>編集可能なイベントがありません</div>
              <button 
                onClick={() => onAddEvent?.()}
                style={styles.addButton}
              >
                ➕ 最初のイベントを作成
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* サイドバー */}
      <div style={styles.sidebar}>
        {/* 検索ボックス */}
        <div style={styles.searchBox}>
          <input
            type="text"
            placeholder="イベントを検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        
        {/* イベントリスト */}
        <div style={styles.eventList}>
          {searchTerm.trim() ? (
            // 検索結果表示
            <>
              {searchResults.length > 0 && (
                <>
                  <div style={{ padding: '8px 16px', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>
                    検索結果 ({searchResults.length})
                  </div>
                  {searchResults.map(event => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEventId(event.id)}
                      style={{
                        ...styles.eventItem,
                        ...(selectedEventId === event.id ? styles.eventItemActive : {})
                      }}
                      onMouseEnter={(e) => selectedEventId !== event.id && (e.target.style.backgroundColor = '#f9fafb')}
                      onMouseLeave={(e) => selectedEventId !== event.id && (e.target.style.backgroundColor = 'transparent')}
                    >
                      <div style={styles.eventTitle}>{event.title || '（無題）'}</div>
                      <div style={styles.eventDate}>
                        {event.startDate ? event.startDate.toLocaleDateString('ja-JP') : '日付未設定'}
                      </div>
                    </div>
                  ))}
                </>
              )}
              {searchResults.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                  検索結果がありません
                </div>
              )}
            </>
          ) : (
            // 全イベント表示
            <>
              <div style={{ padding: '8px 16px', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>
                全てのイベント ({events.length})
              </div>
              {events.map(event => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEventId(event.id)}
                  style={{
                    ...styles.eventItem,
                    ...(selectedEventId === event.id ? styles.eventItemActive : {})
                  }}
                  onMouseEnter={(e) => selectedEventId !== event.id && (e.target.style.backgroundColor = '#f9fafb')}
                  onMouseLeave={(e) => selectedEventId !== event.id && (e.target.style.backgroundColor = 'transparent')}
                >
                  <div style={styles.eventTitle}>{event.title || '（無題）'}</div>
                  <div style={styles.eventDate}>
                    {event.startDate ? event.startDate.toLocaleDateString('ja-JP') : '日付未設定'}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      
      {/* メインエディタ */}
      {selectedEvent && (
        <div style={styles.mainEditor}>
          {/* エディタヘッダー */}
          <div style={styles.editorHeader}>
            <div style={styles.editorTitle}>
              {editingEvent ? '✏️ 編集中' : selectedEvent.title || '（無題）'}
              {isLoading && <span style={{ marginLeft: '8px', color: '#3b82f6' }}>保存中...</span>}
            </div>
            <div style={styles.editorActions}>
              {editingEvent ? (
                <>
                  <button
                    onClick={saveEdit}
                    disabled={isLoading}
                    style={{...styles.actionButton, ...styles.primaryButton, opacity: isLoading ? 0.5 : 1}}
                    onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = '#2563eb')}
                    onMouseLeave={(e) => !isLoading && (e.target.style.backgroundColor = '#3b82f6')}
                  >
                    💾 保存
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={isLoading}
                    style={{...styles.actionButton, opacity: isLoading ? 0.5 : 1}}
                    onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = '#f3f4f6')}
                    onMouseLeave={(e) => !isLoading && (e.target.style.backgroundColor = '#ffffff')}
                  >
                    ❌ キャンセル
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => startEditing(selectedEvent)}
                    style={{...styles.actionButton, ...styles.primaryButton}}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                  >
                    ✏️ 編集
                  </button>
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    style={styles.actionButton}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
                  >
                    {previewMode ? '📝 編集' : '👁️ プレビュー'}
                  </button>
                  <button
                    onClick={() => onEventDelete && onEventDelete(selectedEvent.id)}
                    style={{...styles.actionButton, ...styles.dangerButton}}
                    title="イベントを削除"
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                  >
                    🗑️削除
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* エディタコンテンツ */}
          <div style={styles.editorContent}>
            {editingEvent ? (
              // 編集フォーム
              <>
                <div style={styles.formGroup}>
                  <label style={styles.label}>タイトル</label>
                  <input
                    type="text"
                    value={editingEvent.title}
                    onChange={(e) => setEditingEvent(prev => ({...prev, title: e.target.value}))}
                    style={styles.input}
                    placeholder="イベントタイトルを入力"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>開始日</label>
                  <input
                    type="date"
                    value={editingEvent.startDate ? editingEvent.startDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditingEvent(prev => ({
                      ...prev, 
                      startDate: e.target.value ? new Date(e.target.value) : null
                    }))}
                    style={styles.dateInput}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>説明</label>
                  <textarea
                    value={editingEvent.description}
                    onChange={(e) => setEditingEvent(prev => ({...prev, description: e.target.value}))}
                    style={styles.textarea}
                    placeholder="イベントの詳細を入力... #タグ を含めることができます"
                  />
                </div>

                {editingEvent.tags && editingEvent.tags.length > 0 && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>タグ</label>
                    <div style={styles.tagContainer}>
                      {editingEvent.tags.map((tag, index) => (
                        <span key={index} style={styles.tag}>#{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              // 表示モード
              <>
                <div style={styles.formGroup}>
                  <label style={styles.label}>タイトル</label>
                  <div style={{fontSize: '16px', fontWeight: '500'}}>{selectedEvent.title || '（無題）'}</div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>日付</label>
                  <div>{selectedEvent.startDate ? selectedEvent.startDate.toLocaleDateString('ja-JP') : '日付未設定'}</div>
                </div>

                {selectedEvent.description && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>説明</label>
                    <div style={{whiteSpace: 'pre-wrap', lineHeight: '1.6'}}>{selectedEvent.description}</div>
                  </div>
                )}

                {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>タグ</label>
                    <div style={styles.tagContainer}>
                      {selectedEvent.tags.map((tag, index) => (
                        <span key={index} style={styles.tag}>#{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 関連イベント */}
                {relatedEvents.length > 0 && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>関連イベント</label>
                    <div>
                      {relatedEvents.slice(0, 5).map(event => (
                        <div 
                          key={event.id}
                          onClick={() => setSelectedEventId(event.id)}
                          style={{
                            padding: '8px 12px',
                            margin: '4px 0',
                            backgroundColor: '#f9fafb',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          {event.title} <span style={{color: '#6b7280'}}>({event.commonTags.length}個の共通タグ)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventEditTab;