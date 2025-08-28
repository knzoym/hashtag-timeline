// src/components/modals/TimelineModal.js - 一時年表対応版
import React, { useState, useEffect } from 'react';

const TimelineModal = ({
  timeline,
  onClose,
  onUpdate,
  onDelete,
  onSaveToPersonal, // 新規：個人ファイルに保存
  isWikiMode = false,
  isTemporary = false, // 新規：一時年表フラグ
  user = null
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (timeline) {
      setName(timeline.name || '');
      setColor(timeline.color || '#3b82f6');
      setDescription(timeline.description || '');
    }
  }, [timeline]);

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
      maxWidth: '500px',
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
    infoSection: {
      backgroundColor: '#f9fafb',
      padding: '12px',
      borderRadius: '6px',
      marginBottom: '20px'
    },
    infoTitle: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px'
    },
    infoText: {
      fontSize: '12px',
      color: '#6b7280',
      lineHeight: '1.4'
    },
    tempBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      backgroundColor: '#dbeafe',
      color: '#1e40af',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500',
      border: '1px solid #3b82f6'
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

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* ヘッダー */}
        <div style={styles.header}>
          <div style={styles.title}>
            {isTemporary ? '📋' : '📊'} 
            {isTemporary ? '一時年表' : '年表'}の詳細
            {isTemporary && (
              <span style={styles.tempBadge}>
                🔄 一時作成
              </span>
            )}
          </div>
          <button onClick={onClose} style={styles.closeButton}>
            ×
          </button>
        </div>

        {/* 一時年表の説明 */}
        {isTemporary && (
          <div style={styles.infoSection}>
            <div style={styles.infoTitle}>📋 一時年表について</div>
            <div style={styles.infoText}>
              検索結果から作成された一時的な年表です。個人ファイルに保存すると永続的な年表として利用できます。
              ページを離脱すると削除されます。
            </div>
          </div>
        )}

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

        {/* 統計情報 */}
        <div style={styles.infoSection}>
          <div style={styles.infoTitle}>📊 統計情報</div>
          <div style={styles.infoText}>
            <div>イベント数: {timeline.eventCount || timeline.eventIds?.length || 0}件</div>
            {timeline.createdAt && (
              <div>作成日時: {new Date(timeline.createdAt).toLocaleString('ja-JP')}</div>
            )}
            {timeline.type && (
              <div>種類: {timeline.type === 'temporary' ? '一時年表' : timeline.type === 'personal' ? '個人年表' : '不明'}</div>
            )}
          </div>
        </div>

        {/* ボタン群 */}
        <div style={styles.buttonGroup}>
          {/* 一時年表：個人保存ボタン */}
          {isTemporary && user && onSaveToPersonal && (
            <button
              onClick={handleSaveToPersonal}
              style={{...styles.button, ...styles.successButton}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
            >
              📥 個人ファイルに保存
            </button>
          )}

          {/* 通常年表：保存ボタン */}
          {!isReadonly && !isTemporary && (
            <button
              onClick={handleSave}
              style={{...styles.button, ...styles.primaryButton}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
            >
              💾 保存
            </button>
          )}

          {/* 削除ボタン */}
          {onDelete && (
            <button
              onClick={handleDelete}
              style={{...styles.button, ...styles.dangerButton}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
            >
              🗑️ 削除
            </button>
          )}

          {/* キャンセルボタン */}
          <button
            onClick={onClose}
            style={{...styles.button, ...styles.secondaryButton}}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimelineModal;