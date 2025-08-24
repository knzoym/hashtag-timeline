// src/components/WikiEventForm.js
import React, { useState, useEffect } from 'react';
import { extractTagsFromDescription } from '../utils/timelineUtils';

const WikiEventForm = ({ event, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    title: '',
    startDate: new Date(),
    description: '',
    manualTags: []
  });

  // 編集時の初期値設定
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        startDate: new Date(event.start_date) || new Date(),
        description: event.description || '',
        manualTags: event.tags || []
      });
    } else {
      setFormData({
        title: '',
        startDate: new Date(),
        description: '',
        manualTags: []
      });
    }
  }, [event]);

  // 全てのタグを取得（自動抽出 + 手動）
  const getAllTags = () => {
    const extractedTags = extractTagsFromDescription(formData.description);
    const titleTag = formData.title.trim() ? [formData.title.trim()] : [];
    return [...new Set([...titleTag, ...extractedTags, ...formData.manualTags])];
  };

  // フォーム送信
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const eventData = {
      title: formData.title.trim(),
      startDate: formData.startDate,
      description: formData.description.trim(),
      tags: getAllTags()
    };

    onSave(eventData);
  };

  // 手動タグ追加
  const addManualTag = (tagText) => {
    const trimmedTag = tagText.trim();
    if (trimmedTag && !formData.manualTags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        manualTags: [...prev.manualTags, trimmedTag]
      }));
    }
  };

  // 手動タグ削除
  const removeManualTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      manualTags: prev.manualTags.filter(tag => tag !== tagToRemove)
    }));
  };

  // キーボードイベント
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

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
      maxWidth: '500px',
      width: '90%',
      maxHeight: '80vh',
      overflow: 'auto',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      paddingBottom: '12px',
      borderBottom: '2px solid #e5e7eb'
    },
    title: {
      margin: 0,
      fontSize: '20px',
      fontWeight: '600',
      color: '#374151'
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#6b7280',
      padding: '4px',
      borderRadius: '50%',
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column'
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '4px'
    },
    input: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      outline: 'none'
    },
    textarea: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      minHeight: '80px',
      resize: 'vertical',
      outline: 'none'
    },
    tagContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px',
      minHeight: '40px',
      padding: '8px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      backgroundColor: 'white',
      alignItems: 'flex-start'
    },
    tag: {
      padding: '4px 8px',
      backgroundColor: '#3b82f6',
      color: 'white',
      fontSize: '12px',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      height: '24px'
    },
    removeTagButton: {
      background: 'none',
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px',
      padding: '0',
      width: '16px',
      height: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%'
    },
    tagInput: {
      border: 'none',
      outline: 'none',
      padding: '4px 8px',
      fontSize: '12px',
      minWidth: '100px',
      backgroundColor: 'transparent',
      height: '24px',
      flex: 1
    },
    hint: {
      fontSize: '11px',
      color: '#6b7280',
      marginTop: '4px'
    },
    buttonContainer: {
      display: 'flex',
      gap: '8px',
      justifyContent: 'flex-end',
      marginTop: '20px',
      paddingTop: '12px',
      borderTop: '1px solid #e5e7eb'
    },
    button: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    cancelButton: {
      backgroundColor: '#f3f4f6',
      color: '#374151'
    },
    saveButton: {
      backgroundColor: '#3b82f6',
      color: 'white'
    },
    disabledButton: {
      opacity: 0.6,
      cursor: 'not-allowed'
    }
  };

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            {event ? 'イベントを編集' : '新しいイベントを作成'}
          </h2>
          <button 
            style={styles.closeButton}
            onClick={onCancel}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>

        <form style={styles.form} onSubmit={handleSubmit}>
          {/* タイトル */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>タイトル *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              onKeyDown={handleKeyDown}
              style={styles.input}
              placeholder="イベントのタイトル"
              required
              autoFocus
            />
          </div>

          {/* 日付 */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>日付</label>
            <input
              type="date"
              value={formData.startDate.toISOString().split('T')[0]}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                startDate: new Date(e.target.value) 
              }))}
              onKeyDown={handleKeyDown}
              style={styles.input}
            />
          </div>

          {/* 説明 */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>説明</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              onKeyDown={handleKeyDown}
              style={styles.textarea}
              placeholder="イベントの説明。例: #建築 #モダニズム による代表作"
            />
            <div style={styles.hint}>
              💡 #タグ名 の形式で自動的にタグが追加されます
            </div>
          </div>

          {/* タグ表示・編集 */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>タグ</label>
            <div style={styles.tagContainer}>
              {getAllTags().map((tag, index) => (
                <span key={`${tag}-${index}`} style={styles.tag}>
                  {tag}
                  {formData.manualTags.includes(tag) && (
                    <button
                      type="button"
                      onClick={() => removeManualTag(tag)}
                      style={styles.removeTagButton}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
              
              <input
                type="text"
                style={styles.tagInput}
                placeholder={getAllTags().length === 0 ? "タグを入力してEnterで追加" : "新しいタグ"}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    e.preventDefault();
                    addManualTag(e.target.value.trim());
                    e.target.value = '';
                  } else {
                    handleKeyDown(e);
                  }
                }}
              />
            </div>
            <div style={styles.hint}>
              💡 Ctrl/Cmd+Enter で保存
            </div>
          </div>

          {/* ボタン */}
          <div style={styles.buttonContainer}>
            <button
              type="button"
              onClick={onCancel}
              style={{ ...styles.button, ...styles.cancelButton }}
              disabled={loading}
              onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#e5e7eb')}
              onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#f3f4f6')}
            >
              キャンセル
            </button>
            <button
              type="submit"
              style={{
                ...styles.button,
                ...styles.saveButton,
                ...(loading || !formData.title.trim() ? styles.disabledButton : {})
              }}
              disabled={loading || !formData.title.trim()}
              onMouseEnter={(e) => {
                if (!loading && formData.title.trim()) {
                  e.target.style.backgroundColor = '#2563eb';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && formData.title.trim()) {
                  e.target.style.backgroundColor = '#3b82f6';
                }
              }}
            >
              {loading ? '保存中...' : (event ? '更新' : '作成')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WikiEventForm;