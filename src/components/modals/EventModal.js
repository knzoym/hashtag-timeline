// src/components/modals/EventModal.js
import React, { useState, useEffect } from 'react';

export const EventModal = ({
  event,
  onClose,
  onUpdate,
  onDelete,
  isWikiMode = false,
  showNetworkInfo = false,
  timelines = [],
  position = null // モーダルの表示位置
}) => {
  const [editedEvent, setEditedEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  
  useEffect(() => {
    if (event) {
      setEditedEvent({
        ...event,
        startDate: event.startDate ? event.startDate.toISOString().split('T')[0] : '',
        endDate: event.endDate ? event.endDate.toISOString().split('T')[0] : ''
      });
    }
  }, [event]);
  
  if (!event || !editedEvent) return null;
  
  // タグを自動抽出
  const extractTagsFromDescription = (description) => {
    if (!description) return [];
    const tagMatches = description.match(/#[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+/g);
    return tagMatches ? tagMatches.map(tag => tag.slice(1)) : [];
  };
  
  const handleSave = () => {
    const updatedEvent = {
      ...editedEvent,
      startDate: editedEvent.startDate ? new Date(editedEvent.startDate) : null,
      endDate: editedEvent.endDate ? new Date(editedEvent.endDate) : null,
      // タグを自動更新
      tags: [
        // タイトルからのタグ
        ...(editedEvent.title?.trim() ? [editedEvent.title.trim()] : []),
        // 説明文からのタグ
        ...extractTagsFromDescription(editedEvent.description || ''),
        // 手動追加されたタグ（重複除去）
        ...(editedEvent.tags || []).filter(tag => 
          tag !== event.title &&
          !extractTagsFromDescription(event.description || '').includes(tag)
        )
      ].filter((tag, index, array) => 
        array.indexOf(tag) === index && tag.trim()
      )
    };
    
    if (onUpdate) {
      onUpdate(updatedEvent);
    }
    setIsEditing(false);
  };
  
  const handleDelete = () => {
    if (deleteConfirm && onDelete) {
      onDelete(event.id);
      onClose();
    } else {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 3000);
    }
  };
  
  const handleCancel = () => {
    setEditedEvent({
      ...event,
      startDate: event.startDate ? event.startDate.toISOString().split('T')[0] : '',
      endDate: event.endDate ? event.endDate.toISOString().split('T')[0] : ''
    });
    setIsEditing(false);
  };
  
  // モーダル位置の計算
  const getModalStyle = () => {
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
      // イベント位置に近い場所に表示
      return {
        ...baseStyle,
        left: Math.min(position.x + 20, window.innerWidth - 420),
        top: Math.min(position.y, window.innerHeight - 400),
      };
    }
    
    // 中央表示
    return {
      ...baseStyle,
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)"
    };
  };
  
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
    
    // フォーム要素
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
      minHeight: "120px",
      padding: "12px 14px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "14px",
      resize: "vertical",
      fontFamily: "inherit",
      backgroundColor: "#ffffff"
    },
    
    dateRow: {
      display: "flex",
      gap: "16px"
    },
    
    dateField: {
      flex: 1
    },
    
    // ボタン
    buttonGroup: {
      display: "flex",
      gap: "12px"
    },
    
    button: {
      padding: "10px 20px",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s",
      border: "none"
    },
    
    primaryButton: {
      backgroundColor: "#3b82f6",
      color: "white"
    },
    
    secondaryButton: {
      backgroundColor: "#f3f4f6",
      color: "#374151",
      border: "1px solid #d1d5db"
    },
    
    dangerButton: {
      backgroundColor: "#ef4444",
      color: "white"
    },
    
    // 情報表示
    infoSection: {
      marginBottom: "16px",
      padding: "12px",
      backgroundColor: "#f8fafc",
      borderRadius: "8px",
      fontSize: "13px"
    },
    
    tagContainer: {
      display: "flex",
      flexWrap: "wrap",
      gap: "6px",
      marginTop: "8px"
    },
    
    tag: {
      padding: "4px 10px",
      backgroundColor: "#e0f2fe",
      color: "#0891b2",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "500"
    },
    
    closeButton: {
      position: "absolute",
      top: "16px",
      right: "16px",
      background: "none",
      border: "none",
      fontSize: "24px",
      cursor: "pointer",
      color: "#6b7280",
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  };
  
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* 閉じるボタン */}
        <button
          style={styles.closeButton}
          onClick={onClose}
          onMouseEnter={(e) => e.target.style.backgroundColor = "#f3f4f6"}
          onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
          title="閉じる"
        >
          ×
        </button>
        
        {isEditing ? (
          <>
            {/* 編集モード */}
            <div style={styles.header}>
              <div style={styles.title}>
                ✏️ イベントを編集
              </div>
            </div>
            
            <div style={styles.editContent}>
              <div style={styles.formGroup}>
                <label style={styles.label}>タイトル</label>
                <input
                  type="text"
                  value={editedEvent.title || ''}
                  onChange={(e) => setEditedEvent(prev => ({...prev, title: e.target.value}))}
                  style={styles.input}
                  placeholder="イベントのタイトル"
                  autoFocus
                />
              </div>
              
              <div style={styles.dateRow}>
                <div style={styles.dateField}>
                  <label style={styles.label}>開始日</label>
                  <input
                    type="date"
                    value={editedEvent.startDate || ''}
                    onChange={(e) => setEditedEvent(prev => ({...prev, startDate: e.target.value}))}
                    style={styles.input}
                  />
                </div>
                <div style={styles.dateField}>
                  <label style={styles.label}>終了日</label>
                  <input
                    type="date"
                    value={editedEvent.endDate || ''}
                    onChange={(e) => setEditedEvent(prev => ({...prev, endDate: e.target.value}))}
                    style={styles.input}
                  />
                </div>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>説明</label>
                <textarea
                  value={editedEvent.description || ''}
                  onChange={(e) => setEditedEvent(prev => ({...prev, description: e.target.value}))}
                  style={styles.textarea}
                  placeholder="イベントの詳細説明。#タグ名 の形式でタグを自動追加できます。"
                />
                <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                  💡 #タグ名 の形式で自動的にタグが追加されます
                </div>
              </div>
            </div>
            
            <div style={styles.footer}>
              <div style={styles.buttonGroup}>
                <button
                  onClick={handleCancel}
                  style={{ ...styles.button, ...styles.secondaryButton }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = "#e5e7eb"}
                  onMouseLeave={(e) => e.target.style.backgroundColor = "#f3f4f6"}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  style={{ ...styles.button, ...styles.primaryButton }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = "#2563eb"}
                  onMouseLeave={(e) => e.target.style.backgroundColor = "#3b82f6"}
                >
                  保存
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* 表示モード */}
            <div style={styles.header}>
              <div style={styles.title}>
                📅 {event.title || '（無題）'}
                {isWikiMode && (
                  <span style={{
                    fontSize: "12px",
                    padding: "4px 8px",
                    backgroundColor: "#dbeafe",
                    color: "#1d4ed8",
                    borderRadius: "12px",
                    fontWeight: "500"
                  }}>
                    Wiki
                  </span>
                )}
              </div>
              
              {event.startDate && (
                <div style={styles.subtitle}>
                  {event.startDate.toLocaleDateString('ja-JP')}
                  {event.endDate && event.endDate !== event.startDate && 
                    ` - ${event.endDate.toLocaleDateString('ja-JP')}`
                  }
                </div>
              )}
            </div>
            
            <div style={styles.content}>
              {/* 説明文 */}
              {event.description && (
                <div style={{
                  fontSize: "15px",
                  lineHeight: "1.6",
                  color: "#374151",
                  marginBottom: "20px",
                  whiteSpace: "pre-wrap"
                }}>
                  {event.description}
                </div>
              )}
              
              {/* タグ */}
              {event.tags && event.tags.length > 0 && (
                <div style={styles.formGroup}>
                  <div style={styles.label}>🏷️ タグ</div>
                  <div style={styles.tagContainer}>
                    {event.tags.map((tag, index) => (
                      <span key={index} style={styles.tag}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* ネットワーク情報 */}
              {showNetworkInfo && event.timelineInfos && event.timelineInfos.length > 0 && (
                <div style={styles.infoSection}>
                  <div style={{ fontWeight: "600", marginBottom: "8px" }}>🕸️ 接続している年表</div>
                  {event.timelineInfos.map((timelineInfo, index) => (
                    <div key={index} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px"
                    }}>
                      <div style={{
                        width: "12px",
                        height: "12px",
                        backgroundColor: timelineInfo.timelineColor,
                        borderRadius: "50%"
                      }} />
                      <span>{timelineInfo.timelineName}</span>
                      {timelineInfo.isTemporary && (
                        <span style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          backgroundColor: "#fef3c7",
                          color: "#92400e",
                          borderRadius: "8px"
                        }}>
                          仮登録
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Wiki専用情報 */}
              {isWikiMode && (
                <div style={styles.infoSection}>
                  <div style={{ fontWeight: "600", marginBottom: "8px" }}>ℹ️ Wiki情報</div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    このイベントはコミュニティによって管理されています。
                    編集には承認が必要な場合があります。
                  </div>
                </div>
              )}
            </div>
            
            <div style={styles.footer}>
              <button
                onClick={handleDelete}
                style={{
                  ...styles.button,
                  ...(deleteConfirm ? styles.dangerButton : styles.secondaryButton),
                  ...(deleteConfirm ? {} : { border: "1px solid #d1d5db" })
                }}
                onMouseEnter={(e) => {
                  if (deleteConfirm) {
                    e.target.style.backgroundColor = "#dc2626";
                  } else {
                    e.target.style.backgroundColor = "#fee2e2";
                    e.target.style.color = "#dc2626";
                  }
                }}
                onMouseLeave={(e) => {
                  if (deleteConfirm) {
                    e.target.style.backgroundColor = "#ef4444";
                  } else {
                    e.target.style.backgroundColor = "#f3f4f6";
                    e.target.style.color = "#374151";
                  }
                }}
              >
                {deleteConfirm ? "🗑️ 完全削除" : "削除"}
              </button>
              
              <div style={styles.buttonGroup}>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{ ...styles.button, ...styles.primaryButton }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = "#2563eb"}
                  onMouseLeave={(e) => e.target.style.backgroundColor = "#3b82f6"}
                >
                  編集
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};