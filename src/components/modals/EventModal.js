// src/components/modals/EventModal.js - フック順序修正版
import React, { useState, useEffect, useCallback } from 'react';

export const EventModal = ({
  event,
  onClose,
  onUpdate,
  onDelete,
  onImport,
  isWikiMode = false,
  showNetworkInfo = false,
  timelines = [],
  position = null
}) => {
  // すべてのフックを最初に配置
  const [editedEvent, setEditedEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(true); // デフォルトで編集モード
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  // useCallbackも最初に配置
  const handleImportEvent = useCallback((importData) => {
    try {
      if (importData.type === 'events' && importData.data.length > 0) {
        const importedEvent = importData.data[0];
        
        setEditedEvent(prev => ({
          ...prev,
          title: importedEvent.title || prev.title,
          description: importedEvent.description || prev.description,
          startDate: importedEvent.startDate || prev.startDate,
          endDate: importedEvent.endDate || prev.endDate,
          tags: [
            ...(prev.tags || []),
            ...(importedEvent.tags || [])
          ].filter((tag, index, array) => array.indexOf(tag) === index)
        }));
        
        if (onImport) {
          onImport(importedEvent);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('インポートエラー:', error);
      return false;
    }
  }, [onImport]);

  const extractTagsFromDescription = useCallback((description) => {
    if (!description) return [];
    const tagMatches = description.match(/#[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+/g);
    return tagMatches ? tagMatches.map(tag => tag.slice(1)) : [];
  }, []);

  const handleSave = useCallback(() => {
    if (!editedEvent) return;
    
    const updatedEvent = {
      ...editedEvent,
      startDate: editedEvent.startDate ? new Date(editedEvent.startDate) : null,
      endDate: editedEvent.endDate ? new Date(editedEvent.endDate) : null,
      tags: [
        ...(editedEvent.title?.trim() ? [editedEvent.title.trim()] : []),
        ...extractTagsFromDescription(editedEvent.description || ''),
        ...(editedEvent.tags || []).filter(tag => 
          tag !== event?.title &&
          !extractTagsFromDescription(event?.description || '').includes(tag)
        )
      ].filter((tag, index, array) => 
        array.indexOf(tag) === index && tag.trim()
      )
    };
    
    if (onUpdate) {
      onUpdate(updatedEvent);
    }
    setIsEditing(false);
  }, [editedEvent, event, onUpdate, extractTagsFromDescription]);

  const handleDelete = useCallback(() => {
    if (deleteConfirm && onDelete && event) {
      onDelete(event.id);
      onClose();
    } else {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 3000);
    }
  }, [deleteConfirm, onDelete, event, onClose]);

  const handleCancel = useCallback(() => {
    if (!event) return;
    
    setEditedEvent({
      ...event,
      startDate: event.startDate ? event.startDate.toISOString().split('T')[0] : '',
      endDate: event.endDate ? event.endDate.toISOString().split('T')[0] : ''
    });
    setIsEditing(false);
  }, [event]);

  const addTag = useCallback(() => {
    if (newTag.trim() && !editedEvent?.tags?.includes(newTag.trim())) {
      setEditedEvent(prev => ({
        ...prev,
        tags: [...(prev?.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  }, [newTag, editedEvent?.tags]);

  const removeTag = useCallback((tagToRemove) => {
    setEditedEvent(prev => ({
      ...prev,
      tags: (prev?.tags || []).filter(tag => tag !== tagToRemove)
    }));
  }, []);

  const removeFromTimeline = useCallback((timelineId) => {
    if (editedEvent?.timelineInfos) {
      setEditedEvent(prev => ({
        ...prev,
        timelineInfos: prev.timelineInfos.map(info => 
          info.timelineId === timelineId 
            ? { ...info, isTemporary: true }
            : info
        )
      }));
    }
  }, [editedEvent?.timelineInfos]);

  const getModalStyle = useCallback(() => {
    const baseStyle = {
      position: "fixed",
      backgroundColor: "white",
      borderRadius: "12px",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
      zIndex: 10000,
      minWidth: "400px",
      maxWidth: "600px",
      maxHeight: "80vh",
      overflow: "hidden"
    };
    
    if (position) {
      return {
        ...baseStyle,
        left: Math.min(position.x + 20, window.innerWidth - 420),
        top: Math.min(position.y, window.innerHeight - 400),
      };
    }
    
    return {
      ...baseStyle,
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)"
    };
  }, [position]);

  // useEffectも他のフックの後に配置
  useEffect(() => {
    if (event) {
      setEditedEvent({
        ...event,
        startDate: event.startDate ? event.startDate.toISOString().split('T')[0] : '',
        endDate: event.endDate ? event.endDate.toISOString().split('T')[0] : ''
      });
    }
  }, [event]);

  // early returnは全フック呼び出し後に配置
  if (!event) return null;
  if (!editedEvent) return null;
  
  const styles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    
    modal: getModalStyle(),
    
    header: {
      padding: "24px 24px 0",
      borderBottom: isEditing ? "none" : "1px solid #e5e7eb"
    },
    
    title: {
      fontSize: "20px",
      fontWeight: "700",
      color: "#1f2937",
      marginBottom: "8px",
      display: "flex",
      alignItems: "center",
      gap: "12px"
    },
    
    subtitle: {
      fontSize: "14px",
      color: "#6b7280",
      marginBottom: "16px"
    },
    
    content: {
      padding: "24px",
      maxHeight: "60vh",
      overflow: "auto"
    },
    
    editContent: {
      padding: "16px 24px"
    },
    
    footer: {
      padding: "16px 24px",
      borderTop: "1px solid #e5e7eb",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#f9fafb"
    },
    
    formGroup: {
      marginBottom: "20px"
    },
    
    label: {
      display: "block",
      fontSize: "14px",
      fontWeight: "600",
      color: "#374151",
      marginBottom: "6px"
    },
    
    input: {
      width: "100%",
      padding: "10px 14px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "14px",
      transition: "border-color 0.2s",
      backgroundColor: "#ffffff"
    },
    
    textarea: {
      width: "100%",
      padding: "10px 14px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "14px",
      minHeight: "100px",
      resize: "vertical",
      fontFamily: "inherit"
    },
    
    tagContainer: {
      display: "flex",
      flexWrap: "wrap",
      gap: "6px",
      marginBottom: "8px"
    },
    
    tag: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      padding: "4px 8px",
      backgroundColor: "#dbeafe",
      color: "#1e40af",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "500"
    },
    
    tagRemove: {
      cursor: "pointer",
      fontSize: "14px",
      color: "#ef4444"
    },
    
    tagInputContainer: {
      display: "flex",
      gap: "8px"
    },
    
    tagInput: {
      flex: 1,
      padding: "6px 10px",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      fontSize: "12px"
    },
    
    tagAddButton: {
      padding: "6px 12px",
      backgroundColor: "#10b981",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "12px",
      cursor: "pointer"
    },
    
    timelineList: {
      marginTop: "8px"
    },
    
    timelineItem: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "8px 12px",
      backgroundColor: "#f8fafc",
      borderRadius: "6px",
      marginBottom: "4px"
    },
    
    timelineName: {
      fontSize: "13px",
      color: "#374151"
    },
    
    removeButton: {
      padding: "2px 6px",
      backgroundColor: "#ef4444",
      color: "white",
      border: "none",
      borderRadius: "4px",
      fontSize: "10px",
      cursor: "pointer"
    },
    
    button: {
      padding: "8px 16px",
      borderRadius: "6px",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "background-color 0.2s",
      border: "none"
    },
    
    primaryButton: {
      backgroundColor: "#3b82f6",
      color: "white"
    },
    
    secondaryButton: {
      backgroundColor: "#e5e7eb",
      color: "#374151"
    },
    
    dangerButton: {
      backgroundColor: "#ef4444",
      color: "white"
    },
    
    buttonGroup: {
      display: "flex",
      gap: "8px"
    },
    
    closeButton: {
      position: "absolute",
      top: "16px",
      right: "16px",
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      border: "none",
      backgroundColor: "#f3f4f6",
      color: "#6b7280",
      fontSize: "18px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  };
  
  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <button
          style={styles.closeButton}
          onClick={onClose}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
        >
          ×
        </button>
        
        {/* 編集モードのみ表示（表示モードは削除） */}
        <>
          <div style={styles.header}>
            <h2 style={styles.title}>
              イベントを編集
            </h2>
          </div>
          
          <div style={styles.editContent}>
            <div style={styles.formGroup}>
              <label style={styles.label}>タイトル</label>
              <input
                type="text"
                value={editedEvent.title || ''}
                onChange={(e) => setEditedEvent(prev => ({ ...prev, title: e.target.value }))}
                style={styles.input}
                placeholder="イベントのタイトルを入力"
                autoFocus
              />
            </div>
            
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>開始日</label>
                <input
                  type="date"
                  value={editedEvent.startDate || ''}
                  onChange={(e) => setEditedEvent(prev => ({ ...prev, startDate: e.target.value }))}
                  style={styles.input}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>終了日（任意）</label>
                <input
                  type="date"
                  value={editedEvent.endDate || ''}
                  onChange={(e) => setEditedEvent(prev => ({ ...prev, endDate: e.target.value }))}
                  style={styles.input}
                />
              </div>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>説明</label>
              <textarea
                value={editedEvent.description || ''}
                onChange={(e) => setEditedEvent(prev => ({ ...prev, description: e.target.value }))}
                style={styles.textarea}
                placeholder="イベントの説明を入力"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>タグ</label>
              {editedEvent.tags && editedEvent.tags.length > 0 && (
                <div style={styles.tagContainer}>
                  {editedEvent.tags.map(tag => (
                    <span key={tag} style={styles.tag}>
                      #{tag}
                      <span 
                        style={styles.tagRemove}
                        onClick={() => removeTag(tag)}
                      >
                        ×
                      </span>
                    </span>
                  ))}
                </div>
              )}
              <div style={styles.tagInputContainer}>
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  style={styles.tagInput}
                  placeholder="新しいタグを追加"
                />
                <button
                  onClick={addTag}
                  style={styles.tagAddButton}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                >
                  追加
                </button>
              </div>
            </div>

            {/* 年表情報表示（編集モード内） */}
            {showNetworkInfo && editedEvent.timelineInfos && editedEvent.timelineInfos.length > 0 && (
              <div style={styles.formGroup}>
                <label style={styles.label}>含まれる年表</label>
                <div style={styles.timelineList}>
                  {editedEvent.timelineInfos.map(info => {
                    const timeline = timelines.find(t => t.id === info.timelineId);
                    return timeline ? (
                      <div key={info.timelineId} style={styles.timelineItem}>
                        <span style={styles.timelineName}>
                          {timeline.name}
                          {info.isTemporary && (
                            <span style={{ color: '#f59e0b', fontSize: '11px' }}> (仮削除)</span>
                          )}
                        </span>
                        <button
                          onClick={() => removeFromTimeline(info.timelineId)}
                          style={styles.removeButton}
                        >
                          削除
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
          
          <div style={styles.footer}>
            <button
              onClick={handleDelete}
              style={{ 
                ...styles.button, 
                ...styles.dangerButton,
                ...(deleteConfirm ? { backgroundColor: "#991b1b" } : {})
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = deleteConfirm ? '#7f1d1d' : '#dc2626'}
              onMouseLeave={(e) => e.target.style.backgroundColor = deleteConfirm ? '#991b1b' : '#ef4444'}
            >
              {deleteConfirm ? "完全削除" : "削除"}
            </button>
            
            <div style={styles.buttonGroup}>
              <button
                onClick={handleCancel}
                style={{ ...styles.button, ...styles.secondaryButton }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#d1d5db'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#e5e7eb'}
              >
                キャンセル
              </button>
              
              <button
                onClick={handleSave}
                style={{ ...styles.button, ...styles.primaryButton }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
              >
                保存
              </button>
            </div>
          </div>
        </>
      </div>
    </div>
  );
};

export default EventModal;