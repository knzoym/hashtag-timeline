// src/components/modals/TimelineModal.js - 仮状態管理対応版
import React, { useState, useEffect, useMemo } from 'react';

const TimelineModal = ({
  timeline,
  events = [], // 全イベントリストを受け取る
  onClose,
  onUpdate,
  onDelete,
  onSaveToPersonal,
  onEventStatusChange, // 新規：イベントの状態変更ハンドラー
  isWikiMode = false,
  isTemporary = false,
  user = null
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [tagMode, setTagMode] = useState('AND');
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'events' | 'tags'

  useEffect(() => {
    if (timeline) {
      setName(timeline.name || '');
      setColor(timeline.color || '#3b82f6');
      setDescription(timeline.description || '');
      setTags(timeline.tags || []);
      setTagMode(timeline.tagMode || 'AND');
    }
  }, [timeline]);

  // 年表関連イベントを取得
  const timelineEvents = useMemo(() => {
    if (!timeline || !events) return { registered: [], pending: [], removed: [] };

    return {
      registered: events.filter(event => timeline.eventIds?.includes(event.id)),
      pending: events.filter(event => timeline.pendingEventIds?.includes(event.id)),
      removed: events.filter(event => timeline.removedEventIds?.includes(event.id))
    };
  }, [timeline, events]);

  const handleSave = () => {
    if (!name.trim()) {
      alert('年表名を入力してください');
      return;
    }

    const updatedTimeline = {
      ...timeline,
      name: name.trim(),
      color,
      description: description.trim(),
      tags,
      tagMode,
      updatedAt: new Date()
    };

    onUpdate?.(updatedTimeline);
    onClose();
  };

  const handleDelete = () => {
    const confirmMessage = isTemporary 
      ? `一時年表「${timeline?.name}」を削除しますか？`
      : `年表「${timeline?.name}」を削除しますか？`;
      
    if (window.confirm(confirmMessage)) {
      onDelete?.(timeline?.id);
      onClose();
    }
  };

  const handleSaveToPersonal = () => {
    if (!user) {
      alert('個人ファイルへの保存にはログインが必要です');
      return;
    }

    const confirmMessage = `「${timeline?.name}」を個人ファイルに保存しますか？`;
    if (window.confirm(confirmMessage)) {
      onSaveToPersonal?.(timeline);
      onClose();
    }
  };

  // イベント状態変更
  const handleEventStatusChange = (eventId, newStatus) => {
    if (onEventStatusChange) {
      onEventStatusChange(timeline.id, eventId, newStatus);
    }
  };

  // タグ追加
  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag('');
    }
  };

  // タグ削除
  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  if (!timeline) return null;

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '600px',
      width: '90%',
      maxHeight: '80vh',
      overflow: 'auto',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '20px',
      paddingBottom: '16px',
      borderBottom: '1px solid #e5e7eb'
    },
    title: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1f2937',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#6b7280',
      padding: '4px'
    },
    tabContainer: {
      display: 'flex',
      borderBottom: '1px solid #e5e7eb',
      marginBottom: '20px'
    },
    tab: {
      padding: '10px 16px',
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      borderBottom: '2px solid transparent'
    },
    activeTab: {
      color: '#3b82f6',
      borderBottomColor: '#3b82f6'
    },
    formGroup: {
      marginBottom: '16px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '6px'
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
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      minHeight: '80px',
      resize: 'vertical',
      boxSizing: 'border-box'
    },
    colorInput: {
      width: '60px',
      height: '40px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      cursor: 'pointer'
    },
    eventList: {
      maxHeight: '300px',
      overflowY: 'auto',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      padding: '12px'
    },
    eventItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px',
      borderRadius: '4px',
      marginBottom: '4px'
    },
    registeredEvent: {
      backgroundColor: '#ecfdf5',
      borderLeft: '3px solid #10b981'
    },
    pendingEvent: {
      backgroundColor: '#fef3c7',
      borderLeft: '3px solid #f59e0b'
    },
    removedEvent: {
      backgroundColor: '#fef2f2',
      borderLeft: '3px solid #ef4444'
    },
    eventTitle: {
      fontSize: '14px',
      fontWeight: '500'
    },
    eventDate: {
      fontSize: '12px',
      color: '#6b7280'
    },
    statusBadge: {
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500'
    },
    registeredBadge: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    pendingBadge: {
      backgroundColor: '#f59e0b',
      color: 'white'
    },
    removedBadge: {
      backgroundColor: '#ef4444',
      color: 'white'
    },
    actionButton: {
      padding: '4px 8px',
      border: 'none',
      borderRadius: '4px',
      fontSize: '12px',
      cursor: 'pointer',
      marginLeft: '8px'
    },
    tagContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginBottom: '12px'
    },
    tag: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      backgroundColor: '#e0e7ff',
      color: '#3730a3',
      borderRadius: '12px',
      fontSize: '12px'
    },
    tagInput: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center'
    },
    tagModeSelect: {
      padding: '4px 8px',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      fontSize: '12px'
    },
    stats: {
      backgroundColor: '#f9fafb',
      padding: '12px',
      borderRadius: '6px',
      marginBottom: '20px'
    },
    statsTitle: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px'
    },
    statsText: {
      fontSize: '12px',
      color: '#6b7280',
      lineHeight: '1.4'
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
      paddingTop: '16px',
      borderTop: '1px solid #e5e7eb'
    },
    button: {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    primaryButton: {
      backgroundColor: '#3b82f6',
      color: 'white'
    },
    successButton: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    dangerButton: {
      backgroundColor: '#ef4444',
      color: 'white'
    },
    secondaryButton: {
      backgroundColor: '#f3f4f6',
      color: '#374151'
    }
  };

  const isReadonly = isWikiMode && !isTemporary;

  const renderEventList = (eventList, status) => {
    const statusStyles = {
      registered: styles.registeredEvent,
      pending: styles.pendingEvent,
      removed: styles.removedEvent
    };

    const statusBadges = {
      registered: { ...styles.statusBadge, ...styles.registeredBadge },
      pending: { ...styles.statusBadge, ...styles.pendingBadge },
      removed: { ...styles.statusBadge, ...styles.removedBadge }
    };

    const statusLabels = {
      registered: '正式登録',
      pending: '仮登録',
      removed: '仮削除'
    };

    return eventList.map(event => (
      <div key={event.id} style={{...styles.eventItem, ...statusStyles[status]}}>
        <div>
          <div style={styles.eventTitle}>{event.title}</div>
          <div style={styles.eventDate}>
            {event.startDate ? new Date(event.startDate).toLocaleDateString('ja-JP') : '日付なし'}
          </div>
        </div>
        <div style={{display: 'flex', alignItems: 'center'}}>
          <span style={statusBadges[status]}>
            {statusLabels[status]}
          </span>
          {!isReadonly && (
            <div>
              {status === 'pending' && (
                <>
                  <button
                    style={{...styles.actionButton, backgroundColor: '#10b981', color: 'white'}}
                    onClick={() => handleEventStatusChange(event.id, 'registered')}
                  >
                    登録
                  </button>
                  <button
                    style={{...styles.actionButton, backgroundColor: '#ef4444', color: 'white'}}
                    onClick={() => handleEventStatusChange(event.id, 'none')}
                  >
                    削除
                  </button>
                </>
              )}
              {status === 'removed' && (
                <>
                  <button
                    style={{...styles.actionButton, backgroundColor: '#10b981', color: 'white'}}
                    onClick={() => handleEventStatusChange(event.id, 'registered')}
                  >
                    復活
                  </button>
                  <button
                    style={{...styles.actionButton, backgroundColor: '#ef4444', color: 'white'}}
                    onClick={() => handleEventStatusChange(event.id, 'none')}
                  >
                    完全削除
                  </button>
                </>
              )}
              {status === 'registered' && (
                <button
                  style={{...styles.actionButton, backgroundColor: '#f59e0b', color: 'white'}}
                  onClick={() => handleEventStatusChange(event.id, 'removed')}
                >
                  仮削除
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    ));
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* ヘッダー */}
        <div style={styles.header}>
          <div style={styles.title}>
            {isTemporary ? '📋 一時年表' : '📊 年表'}の詳細
          </div>
          <button onClick={onClose} style={styles.closeButton}>
            ×
          </button>
        </div>

        {/* タブ */}
        <div style={styles.tabContainer}>
          <button
            style={{...styles.tab, ...(activeTab === 'info' ? styles.activeTab : {})}}
            onClick={() => setActiveTab('info')}
          >
            基本情報
          </button>
          <button
            style={{...styles.tab, ...(activeTab === 'events' ? styles.activeTab : {})}}
            onClick={() => setActiveTab('events')}
          >
            イベント ({(timeline.eventIds?.length || 0) + (timeline.pendingEventIds?.length || 0) + (timeline.removedEventIds?.length || 0)})
          </button>
          <button
            style={{...styles.tab, ...(activeTab === 'tags' ? styles.activeTab : {})}}
            onClick={() => setActiveTab('tags')}
          >
            タグ管理
          </button>
        </div>

        {/* タブコンテンツ */}
        {activeTab === 'info' && (
          <div>
            {/* 統計情報 */}
            <div style={styles.stats}>
              <div style={styles.statsTitle}>統計情報</div>
              <div style={styles.statsText}>
                <div>正式登録: {timeline.eventIds?.length || 0}件</div>
                <div>仮登録: {timeline.pendingEventIds?.length || 0}件</div>
                <div>仮削除: {timeline.removedEventIds?.length || 0}件</div>
                <div>作成日時: {timeline.createdAt ? new Date(timeline.createdAt).toLocaleString('ja-JP') : '不明'}</div>
                <div>種類: {timeline.type === 'temporary' ? '一時年表' : timeline.type === 'personal' ? '個人年表' : '不明'}</div>
              </div>
            </div>

            {/* フォーム */}
            <div style={styles.formGroup}>
              <label style={styles.label}>年表名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
                placeholder="年表名を入力"
                readOnly={isReadonly}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>カラー</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={styles.colorInput}
                disabled={isReadonly}
              />
            </div>

            {!isTemporary && (
              <div style={styles.formGroup}>
                <label style={styles.label}>説明</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={styles.textarea}
                  placeholder="年表の説明を入力（任意）"
                  readOnly={isReadonly}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div>
            <div style={styles.formGroup}>
              <label style={styles.label}>正式登録イベント ({timelineEvents.registered.length}件)</label>
              <div style={styles.eventList}>
                {timelineEvents.registered.length > 0 ? 
                  renderEventList(timelineEvents.registered, 'registered') :
                  <div style={{color: '#9ca3af', textAlign: 'center', padding: '20px'}}>登録イベントはありません</div>
                }
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>仮登録イベント ({timelineEvents.pending.length}件)</label>
              <div style={styles.eventList}>
                {timelineEvents.pending.length > 0 ? 
                  renderEventList(timelineEvents.pending, 'pending') :
                  <div style={{color: '#9ca3af', textAlign: 'center', padding: '20px'}}>仮登録イベントはありません</div>
                }
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>仮削除イベント ({timelineEvents.removed.length}件)</label>
              <div style={styles.eventList}>
                {timelineEvents.removed.length > 0 ? 
                  renderEventList(timelineEvents.removed, 'removed') :
                  <div style={{color: '#9ca3af', textAlign: 'center', padding: '20px'}}>仮削除イベントはありません</div>
                }
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tags' && (
          <div>
            <div style={styles.formGroup}>
              <label style={styles.label}>管理対象タグ</label>
              <div style={styles.tagContainer}>
                {tags.map(tag => (
                  <div key={tag} style={styles.tag}>
                    #{tag}
                    {!isReadonly && (
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#3730a3',
                          cursor: 'pointer',
                          fontSize: '14px',
                          padding: '0 2px'
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              {!isReadonly && (
                <div style={styles.tagInput}>
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="新しいタグを入力"
                    style={{...styles.input, flex: 1}}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddTag}
                    style={{...styles.button, ...styles.primaryButton}}
                  >
                    追加
                  </button>
                </div>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>タグマッチング方式</label>
              <select
                value={tagMode}
                onChange={(e) => setTagMode(e.target.value)}
                style={styles.tagModeSelect}
                disabled={isReadonly}
              >
                <option value="AND">AND（すべてのタグが必要）</option>
                <option value="OR">OR（いずれかのタグがあればよい）</option>
              </select>
            </div>
          </div>
        )}

        {/* ボタン群 */}
        <div style={styles.buttonGroup}>
          {/* 一時年表：個人保存ボタン */}
          {isTemporary && user && onSaveToPersonal && (
            <button
              onClick={handleSaveToPersonal}
              style={{...styles.button, ...styles.successButton}}
            >
              個人ファイルに保存
            </button>
          )}

          {/* 通常年表：保存ボタン */}
          {!isReadonly && !isTemporary && (
            <button
              onClick={handleSave}
              style={{...styles.button, ...styles.primaryButton}}
            >
              保存
            </button>
          )}

          {/* 削除ボタン */}
          {onDelete && (
            <button
              onClick={handleDelete}
              style={{...styles.button, ...styles.dangerButton}}
            >
              削除
            </button>
          )}

          {/* キャンセルボタン */}
          <button
            onClick={onClose}
            style={{...styles.button, ...styles.secondaryButton}}
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimelineModal;