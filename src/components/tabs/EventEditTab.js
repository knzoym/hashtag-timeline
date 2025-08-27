// src/components/tabs/EventEditTab.js - Scrapbox風編集インターフェース
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
  
  // 現在選択されているイベント
  const selectedEvent = useMemo(() => {
    return events.find(e => e.id === selectedEventId) || events[0];
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
  
  // タグからリンクを抽出（Scrapbox風）
  const extractTagLinks = useCallback((text) => {
    if (!text || !enableLinking) return text;
    
    return text.replace(
      /#([\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+)/g,
      (match, tagName) => {
        const linkedEvents = events.filter(event => 
          event.tags?.includes(tagName) && event.id !== selectedEventId
        );
        
        if (linkedEvents.length > 0) {
          return `<a href="#" class="tag-link" data-tag="${tagName}" style="color: #3b82f6; text-decoration: none; font-weight: 500;">${match}</a>`;
        }
        return match;
      }
    );
  }, [events, selectedEventId, enableLinking]);
  
  // イベント編集の開始
  const startEditing = useCallback((event) => {
    setEditingEvent({
      ...event,
      originalTitle: event.title,
      originalDescription: event.description,
      originalTags: [...(event.tags || [])],
      originalStartDate: event.startDate,
      originalEndDate: event.endDate
    });
  }, []);
  
  // 編集の保存
  const saveEdit = useCallback(() => {
    if (!editingEvent) return;
    
    const updatedEvent = {
      ...editingEvent,
      // タグを自動抽出して追加
      tags: [
        // 手動で追加されたタグ
        ...(editingEvent.tags || []),
        // 説明文からのタグ
        ...extractTagsFromDescription(editingEvent.description || '')
      ].filter((tag, index, array) => array.indexOf(tag) === index) // 重複除去
    };
    
    // originalプロパティを削除
    const { originalTitle, originalDescription, originalTags, originalStartDate, originalEndDate, ...cleanedEvent } = updatedEvent;
    
    onEventUpdate(cleanedEvent);
    setEditingEvent(null);
  }, [editingEvent, onEventUpdate, extractTagsFromDescription]);
  
  // 編集のキャンセル
  const cancelEdit = useCallback(() => {
    setEditingEvent(null);
  }, []);
  
  // タグクリックハンドラー
  const handleTagClick = useCallback((tagName) => {
    const taggedEvents = events.filter(event => 
      event.tags?.includes(tagName) && event.id !== selectedEventId
    );
    
    if (taggedEvents.length > 0) {
      setSelectedEventId(taggedEvents[0].id);
    }
  }, [events, selectedEventId]);
  
  // 新しいイベント作成
  const createNewEvent = useCallback(() => {
    if (onAddEvent) {
      const newEvent = onAddEvent();
      if (newEvent) {
        setSelectedEventId(newEvent.id);
        startEditing(newEvent);
      }
    }
  }, [onAddEvent, startEditing]);
  
  // 説明文のレンダリング（Scrapbox風リンク処理）
  const renderDescription = useCallback((description, isEditing = false) => {
    if (isEditing || !enableLinking) {
      return description;
    }
    
    const linkedDescription = extractTagLinks(description || '');
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: linkedDescription }}
        onClick={(e) => {
          if (e.target.classList.contains('tag-link')) {
            e.preventDefault();
            const tagName = e.target.getAttribute('data-tag');
            handleTagClick(tagName);
          }
        }}
        style={{
          lineHeight: '1.6',
          fontSize: '15px',
          color: '#374151'
        }}
      />
    );
  }, [enableLinking, extractTagLinks, handleTagClick]);
  
  const styles = {
    container: {
      flex: 1,
      display: 'flex',
      height: '100%',
      backgroundColor: '#f8fafc'
    },
    
    // 左サイドバー: イベントリスト
    sidebar: {
      width: '280px',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column'
    },
    searchContainer: {
      padding: '16px',
      borderBottom: '1px solid #e5e7eb'
    },
    searchInput: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      marginBottom: '8px'
    },
    createButton: {
      width: '100%',
      padding: '8px 12px',
      backgroundColor: '#10b981',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
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
      borderLeft: '3px solid #3b82f6'
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
    
    // メインエディタエリア
    mainEditor: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    },
    editorHeader: {
      padding: '16px 20px',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
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
      padding: '6px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      backgroundColor: '#ffffff',
      color: '#374151',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.2s'
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
      padding: '20px',
      overflow: 'auto',
      backgroundColor: '#ffffff'
    },
    
    // フォーム要素
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '6px'
    },
    input: {
      width: '100%',
      padding: '10px 14px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      transition: 'border-color 0.2s'
    },
    textarea: {
      width: '100%',
      minHeight: '200px',
      padding: '10px 14px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      lineHeight: '1.6',
      resize: 'vertical',
      fontFamily: 'inherit',
      transition: 'border-color 0.2s'
    },
    dateGroup: {
      display: 'flex',
      gap: '16px'
    },
    dateField: {
      flex: 1
    },
    
    // タグ関連
    tagContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
      marginTop: '8px'
    },
    tag: {
      padding: '4px 8px',
      backgroundColor: '#e5e7eb',
      color: '#374151',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500'
    },
    tagLink: {
      backgroundColor: '#dbeafe',
      color: '#3b82f6',
      cursor: 'pointer'
    },
    
    // 右サイドバー: 関連イベント
    rightSidebar: {
      width: '280px',
      backgroundColor: '#ffffff',
      borderLeft: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    },
    relatedHeader: {
      padding: '16px',
      borderBottom: '1px solid #e5e7eb',
      fontSize: '14px',
      fontWeight: '600',
      color: '#1f2937'
    },
    relatedList: {
      flex: 1,
      overflow: 'auto'
    },
    relatedItem: {
      padding: '12px 16px',
      borderBottom: '1px solid #f3f4f6',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    relatedTitle: {
      fontSize: '13px',
      fontWeight: '500',
      color: '#1f2937',
      marginBottom: '4px'
    },
    relatedMeta: {
      fontSize: '11px',
      color: '#6b7280',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    commonTagsContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '2px',
      marginTop: '4px'
    },
    commonTag: {
      padding: '1px 4px',
      backgroundColor: '#fef3c7',
      color: '#92400e',
      borderRadius: '8px',
      fontSize: '10px'
    }
  };
  
  return (
    <div style={styles.container}>
      {/* 左サイドバー: イベントリスト */}
      <div style={styles.sidebar}>
        {/* 検索とイベント作成 */}
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="イベントを検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <button
            onClick={createNewEvent}
            style={styles.createButton}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
          >
            ➕ 新しいイベント
          </button>
        </div>
        
        {/* イベントリスト */}
        <div style={styles.eventList}>
          {searchTerm ? (
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
            </div>
            <div style={styles.editorActions}>
              {editingEvent ? (
                <>
                  <button
                    onClick={saveEdit}
                    style={{...styles.actionButton, ...styles.primaryButton}}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                  >
                    💾 保存
                  </button>
                  <button
                    onClick={cancelEdit}
                    style={styles.actionButton}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
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
                    🗑️ 削除
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* エディタコンテンツ */}
          <div style={styles.editorContent}>
            {editingEvent ? (
              /* 編集モード */
              <>
                <div style={styles.formGroup}>
                  <label style={styles.label}>📝 タイトル</label>
                  <input
                    type="text"
                    value={editingEvent.title || ''}
                    onChange={(e) => setEditingEvent({...editingEvent, title: e.target.value})}
                    placeholder="イベントのタイトル"
                    style={styles.input}
                  />
                </div>
                
                <div style={styles.dateGroup}>
                  <div style={styles.dateField}>
                    <label style={styles.label}>📅 開始日</label>
                    <input
                      type="date"
                      value={editingEvent.startDate ? editingEvent.startDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent, 
                        startDate: e.target.value ? new Date(e.target.value) : null
                      })}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.dateField}>
                    <label style={styles.label}>📅 終了日</label>
                    <input
                      type="date"
                      value={editingEvent.endDate ? editingEvent.endDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent, 
                        endDate: e.target.value ? new Date(e.target.value) : null
                      })}
                      style={styles.input}
                    />
                  </div>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>📋 説明（#タグでリンク作成）</label>
                  <textarea
                    value={editingEvent.description || ''}
                    onChange={(e) => setEditingEvent({...editingEvent, description: e.target.value})}
                    placeholder="イベントの詳細説明... #タグ を使って他のイベントにリンク"
                    style={styles.textarea}
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>🏷️ タグ</label>
                  <div style={styles.tagContainer}>
                    {(editingEvent.tags || []).map((tag, index) => (
                      <span key={index} style={styles.tag}>
                        #{tag}
                        <button
                          onClick={() => {
                            const newTags = editingEvent.tags.filter((_, i) => i !== index);
                            setEditingEvent({...editingEvent, tags: newTags});
                          }}
                          style={{
                            marginLeft: '4px',
                            background: 'none',
                            border: 'none',
                            color: '#6b7280',
                            cursor: 'pointer',
                            fontSize: '10px'
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* 表示モード */
              <>
                <div style={styles.formGroup}>
                  <label style={styles.label}>📝 タイトル</label>
                  <div style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>
                    {selectedEvent.title || '（無題）'}
                  </div>
                </div>
                
                <div style={styles.dateGroup}>
                  <div style={styles.dateField}>
                    <label style={styles.label}>📅 開始日</label>
                    <div>{selectedEvent.startDate ? selectedEvent.startDate.toLocaleDateString('ja-JP') : '未設定'}</div>
                  </div>
                  <div style={styles.dateField}>
                    <label style={styles.label}>📅 終了日</label>
                    <div>{selectedEvent.endDate ? selectedEvent.endDate.toLocaleDateString('ja-JP') : '未設定'}</div>
                  </div>
                </div>
                
                {selectedEvent.description && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>📋 説明</label>
                    {renderDescription(selectedEvent.description)}
                  </div>
                )}
                
                {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>🏷️ タグ</label>
                    <div style={styles.tagContainer}>
                      {selectedEvent.tags.map((tag, index) => (
                        <span 
                          key={index} 
                          style={{
                            ...styles.tag,
                            ...styles.tagLink
                          }}
                          onClick={() => handleTagClick(tag)}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      
      {/* 右サイドバー: 関連イベント */}
      {selectedEvent && showRelatedEvents && (
        <div style={styles.rightSidebar}>
          <div style={styles.relatedHeader}>
            🔗 関連イベント ({relatedEvents.length})
          </div>
          <div style={styles.relatedList}>
            {relatedEvents.map(event => (
              <div
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
                style={styles.relatedItem}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <div style={styles.relatedTitle}>{event.title || '（無題）'}</div>
                <div style={styles.relatedMeta}>
                  <span>{event.startDate ? event.startDate.toLocaleDateString('ja-JP') : '日付未設定'}</span>
                  <span>関連度: {event.relevanceScore}</span>
                </div>
                <div style={styles.commonTagsContainer}>
                  {event.commonTags.map((tag, index) => (
                    <span key={index} style={styles.commonTag}>#{tag}</span>
                  ))}
                </div>
              </div>
            ))}
            
            {relatedEvents.length === 0 && (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                関連するイベントがありません
                <br />
                <small>タグを追加すると関連イベントが表示されます</small>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* イベントが選択されていない場合 */}
      {!selectedEvent && (
        <div style={styles.mainEditor}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: '#6b7280',
            fontSize: '16px',
            gap: '16px'
          }}>
            <div>✏️ イベントを選択して編集を開始</div>
            <button
              onClick={createNewEvent}
              style={{...styles.actionButton, ...styles.primaryButton, fontSize: '16px', padding: '12px 24px'}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
            >
              ➕ 新しいイベントを作成
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventEditTab;