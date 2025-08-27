// src/components/tabs/EventEditTab.js
import React, { useState, useCallback, useMemo } from 'react';
import { SearchPanel } from '../ui/SearchPanel';
import { TimelineCard } from '../ui/TimelineCard';
import { EventGroupIcon, GroupTooltip, GroupCard } from '../ui/EventGroup';

const EventEditTab = ({
  events,
  timelines,
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
  const [selectedEventId, setSelectedEventId] = useState(null);
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
  
  // タグからリンクを抽出（Scrapbox風）
  const extractTagLinks = useCallback((text) => {
    if (!text || !enableLinking) return text;
    
    // #タグ のパターンをリンクに変換
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
        // タイトルからのタグ
        ...(editingEvent.title?.trim() ? [editingEvent.title.trim()] : []),
        // 説明文からのタグ
        ...(extractTagsFromDescription(editingEvent.description || [])),
        // 手動で追加されたタグ（重複除去）
        ...(editingEvent.tags || []).filter(tag => 
          tag !== editingEvent.originalTitle &&
          !extractTagsFromDescription(editingEvent.originalDescription || '').includes(tag)
        )
      ].filter((tag, index, array) => array.indexOf(tag) === index) // 重複除去
    };
    
    // originalプロパティを削除
    const { originalTitle, originalDescription, originalTags, originalStartDate, originalEndDate, ...cleanedEvent } = updatedEvent;
    
    onEventUpdate(cleanedEvent);
    setEditingEvent(null);
  }, [editingEvent, onEventUpdate]);
  
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
      // 最初の関連イベントに移動
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
      border: '1px solid #3b82f6'
    },
    dangerButton: {
      backgroundColor: '#ef4444',
      color: 'white',
      border: '1px solid #ef4444'
    },
    
    // エディタコンテンツ
    editorContent: {
      flex: 1,
      display: 'flex',
      overflow: 'hidden'
    },
    editingArea: {
      flex: 1,
      padding: '20px',
      overflow: 'auto'
    },
    previewArea: {
      flex: 1,
      padding: '20px',
      backgroundColor: '#ffffff',
      borderLeft: '1px solid #e5e7eb',
      overflow: 'auto'
    },
    
    // フォーム要素
    formGroup: {
      marginBottom: '16px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '4px'
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px'
    },
    textarea: {
      width: '100%',
      minHeight: '200px',
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      fontFamily: 'inherit',
      resize: 'vertical'
    },
    dateRow: {
      display: 'flex',
      gap: '12px'
    },
    dateInput: {
      flex: 1
    },
    
    // タグ表示
    tagContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px',
      marginTop: '8px'
    },
    tag: {
      padding: '2px 8px',
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
  
  // タグを抽出するヘルパー関数
  const extractTagsFromDescription = (description) => {
    if (!description) return [];
    const tagMatches = description.match(/#[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+/g);
    return tagMatches ? tagMatches.map(tag => tag.slice(1)) : [];
  };
  
  return (
    <div style={styles.container}>
      {/* 左サイドバー: イベントリスト */}
      <div style={styles.sidebar}>
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
            + 新しいイベント
          </button>
        </div>
        
        <div style={styles.eventList}>
          {/* 検索結果 */}
          {searchTerm && searchResults.length > 0 && (
            <>
              <div style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '600', color: '#6b7280', backgroundColor: '#f9fafb' }}>
                検索結果 ({searchResults.length}件)
              </div>
              {searchResults.map(event => (
                <div
                  key={`search-${event.id}`}
                  onClick={() => setSelectedEventId(event.id)}
                  style={{
                    ...styles.eventItem,
                    ...(selectedEventId === event.id ? styles.eventItemActive : {})
                  }}
                  onMouseEnter={(e) => !selectedEventId === event.id && (e.target.style.backgroundColor = '#f9fafb')}
                  onMouseLeave={(e) => !selectedEventId === event.id && (e.target.style.backgroundColor = 'transparent')}
                >
                  <div style={styles.eventTitle}>{event.title || '（無題）'}</div>
                  <div style={styles.eventDate}>
                    {event.startDate ? event.startDate.toLocaleDateString('ja-JP') : '日付未設定'}
                  </div>
                </div>
              ))}
              <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '8px 0' }} />
            </>
          )}
          
          {/* 全イベントリスト */}
          {!searchTerm && (
            <>
              <div style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '600', color: '#6b7280', backgroundColor: '#f9fafb' }}>
                全イベント ({events.length}件)
              </div>
              {events
                .sort((a, b) => (b.startDate || new Date(0)) - (a.startDate || new Date(0)))
                .map(event => (
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
                ))
              }
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
              {editingEvent ? '編集中' : selectedEvent.title || '（無題）'}
            </div>
            <div style={styles.editorActions}>
              {editingEvent ? (
                <>
                  <button
                    onClick={saveEdit}
                    style={{...styles.actionButton, ...styles.primaryButton}}
                  >
                    保存
                  </button>
                  <button
                    onClick={cancelEdit}
                    style={styles.actionButton}
                  >
                    キャンセル
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => startEditing(selectedEvent)}
                    style={{...styles.actionButton, ...styles.primaryButton}}
                  >
                    編集
                  </button>
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    style={styles.actionButton}
                  >
                    {previewMode ? '編集' : 'プレビュー'}
                  </button>
                  <button
                    onClick={() => onEventDelete && onEventDelete(selectedEvent.id)}
                    style={{...styles.actionButton, ...styles.dangerButton}}
                    title="イベントを削除"
                  >
                    削除
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* エディタコンテンツ */}
          <div style={styles.editorContent}>
            {editingEvent ? (
              // 編集モード
              <div style={styles.editingArea}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>タイトル</label>
                  <input
                    type="text"
                    value={editingEvent.title || ''}
                    onChange={(e) => setEditingEvent(prev => ({...prev, title: e.target.value}))}
                    style={styles.input}
                    placeholder="イベントのタイトル"
                  />
                </div>
                
                <div style={styles.dateRow}>
                  <div style={styles.dateInput}>
                    <label style={styles.label}>開始日</label>
                    <input
                      type="date"
                      value={editingEvent.startDate ? editingEvent.startDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditingEvent(prev => ({
                        ...prev, 
                        startDate: e.target.value ? new Date(e.target.value) : null
                      }))}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.dateInput}>
                    <label style={styles.label}>終了日</label>
                    <input
                      type="date"
                      value={editingEvent.endDate ? editingEvent.endDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditingEvent(prev => ({
                        ...prev, 
                        endDate: e.target.value ? new Date(e.target.value) : null
                      }))}
                      style={styles.input}
                    />
                  </div>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>説明文</label>
                  <textarea
                    value={editingEvent.description || ''}
                    onChange={(e) => setEditingEvent(prev => ({...prev, description: e.target.value}))}
                    style={styles.textarea}
                    placeholder="イベントの詳細な説明。#タグ名 の形式でタグを自動追加できます。"
                  />
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    💡 #タグ名 の形式で自動的にタグが追加されます
                  </div>
                </div>
                
                {/* 現在のタグ表示 */}
                {(editingEvent.tags || []).length > 0 && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>タグ</label>
                    <div style={styles.tagContainer}>
                      {(editingEvent.tags || []).map((tag, index) => (
                        <span key={index} style={styles.tag}>#{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // 表示モード
              <div style={styles.previewArea}>
                <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' }}>
                  {selectedEvent.title || '（無題）'}
                </h1>
                
                {selectedEvent.startDate && (
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                    📅 {selectedEvent.startDate.toLocaleDateString('ja-JP')}
                    {selectedEvent.endDate && selectedEvent.endDate !== selectedEvent.startDate && 
                      ` - ${selectedEvent.endDate.toLocaleDateString('ja-JP')}`
                    }
                  </div>
                )}
                
                <div style={{ 
                  fontSize: '16px', 
                  lineHeight: '1.6', 
                  color: '#374151',
                  marginBottom: '20px',
                  whiteSpace: 'pre-wrap'
                }}
                dangerouslySetInnerHTML={{ 
                  __html: extractTagLinks(selectedEvent.description || '（説明なし）') 
                }}
                onClick={(e) => {
                  if (e.target.classList.contains('tag-link')) {
                    e.preventDefault();
                    const tagName = e.target.dataset.tag;
                    if (tagName) handleTagClick(tagName);
                  }
                }}
                />
                
                {/* タグ表示 */}
                {(selectedEvent.tags || []).length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                      🏷️ タグ
                    </div>
                    <div style={styles.tagContainer}>
                      {(selectedEvent.tags || []).map((tag, index) => (
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
              </div>
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
            >
              新しいイベントを作成
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventEditTab;