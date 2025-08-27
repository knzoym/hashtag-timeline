// src/components/modals/TimelineModal.js
import React, { useState, useEffect } from 'react';

const TimelineModal = ({
  timeline,
  onClose,
  onUpdate,
  onDelete,
  isWikiMode = false,
  position = null
}) => {
  const [editedTimeline, setEditedTimeline] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  
  useEffect(() => {
    if (timeline) {
      setEditedTimeline({
        ...timeline
      });
    }
  }, [timeline]);
  
  if (!timeline || !editedTimeline) return null;
  
  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editedTimeline);
    }
    setIsEditing(false);
  };
  
  const handleDelete = () => {
    if (deleteConfirm && onDelete) {
      onDelete(timeline.id);
      onClose();
    } else {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 3000);
    }
  };
  
  const handleCancel = () => {
    setEditedTimeline({ ...timeline });
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
      maxWidth: "500px",
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
      backgroundColor: "#ffffff"
    },
    
    textarea: {
      width: "100%",
      minHeight: "80px",
      padding: "10px 14px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "14px",
      resize: "vertical",
      fontFamily: "inherit",
      backgroundColor: "#ffffff"
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
    
    infoSection: {
      marginBottom: "16px",
      padding: "12px",
      backgroundColor: "#f8fafc",
      borderRadius: "8px",
      fontSize: "13px"
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
        >
          ×
        </button>
        
        {isEditing ? (
          <>
            {/* 編集モード */}
            <div style={styles.header}>
              <div style={styles.title}>
                📊 年表を編集
              </div>
            </div>
            
            <div style={styles.editContent}>
              <div style={styles.formGroup}>
                <label style={styles.label}>年表名</label>
                <input
                  type="text"
                  value={editedTimeline.name || ''}
                  onChange={(e) => setEditedTimeline(prev => ({...prev, name: e.target.value}))}
                  style={styles.input}
                  placeholder="年表のタイトル"
                  autoFocus
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>説明</label>
                <textarea
                  value={editedTimeline.description || ''}
                  onChange={(e) => setEditedTimeline(prev => ({...prev, description: e.target.value}))}
                  style={styles.textarea}
                  placeholder="年表の説明（任意）"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>カラー</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={editedTimeline.color || '#3b82f6'}
                    onChange={(e) => setEditedTimeline(prev => ({...prev, color: e.target.value}))}
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      border: 'none', 
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>
                    {editedTimeline.color || '#3b82f6'}
                  </span>
                </div>
              </div>
            </div>
            
            <div style={styles.footer}>
              <div style={styles.buttonGroup}>
                <button
                  onClick={handleCancel}
                  style={{ ...styles.button, ...styles.secondaryButton }}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  style={{ ...styles.button, ...styles.primaryButton }}
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
                <div 
                  style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: timeline.color || '#3b82f6',
                    borderRadius: '4px'
                  }}
                />
                {timeline.name || '（無題の年表）'}
              </div>
            </div>
            
            <div style={styles.content}>
              {/* 統計情報 */}
              <div style={styles.infoSection}>
                <div style={{ fontWeight: '600', marginBottom: '8px' }}>📊 年表情報</div>
                <div style={{ marginBottom: '4px' }}>
                  イベント数: {timeline.events?.length || 0} 件
                </div>
                {timeline.temporaryEvents && timeline.temporaryEvents.length > 0 && (
                  <div style={{ marginBottom: '4px' }}>
                    仮登録: {timeline.temporaryEvents.length} 件
                  </div>
                )}
                {timeline.removedEvents && timeline.removedEvents.length > 0 && (
                  <div style={{ marginBottom: '4px' }}>
                    仮削除: {timeline.removedEvents.length} 件
                  </div>
                )}
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                  作成日: {timeline.createdAt ? 
                    new Date(timeline.createdAt).toLocaleDateString('ja-JP') : 
                    '不明'
                  }
                </div>
              </div>
              
              {/* 説明 */}
              {timeline.description && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontWeight: '600', marginBottom: '6px' }}>📝 説明</div>
                  <div style={{ 
                    fontSize: '14px', 
                    lineHeight: '1.5', 
                    color: '#374151',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {timeline.description}
                  </div>
                </div>
              )}
              
              {/* タグ */}
              {timeline.tags && timeline.tags.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontWeight: '600', marginBottom: '6px' }}>🏷️ タグ</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {timeline.tags.map((tag, index) => (
                      <span
                        key={index}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#e0f2fe',
                          color: '#0891b2',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
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
                  border: deleteConfirm ? "none" : "1px solid #d1d5db"
                }}
              >
                {deleteConfirm ? "🗑️ 完全削除" : "削除"}
              </button>
              
              <div style={styles.buttonGroup}>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{ ...styles.button, ...styles.primaryButton }}
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

export default TimelineModal;