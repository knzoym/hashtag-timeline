// src/components/ui/TimelineCard.js - 一時年表対応版
import React from 'react';

export const TimelineCard = ({
  timeline,
  position = { x: 0, y: 0 },
  isTemporary = false, // 新規：一時年表フラグ
  onEdit,
  onDelete,
  onToggleVisibility,
  onSaveToPersonal, // 新規：個人ファイルに保存
  className = "",
  user = null
}) => {
  if (!timeline) return null;

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(timeline);
    }
  };

  const handleSaveToPersonal = (e) => {
    e.stopPropagation();
    if (onSaveToPersonal) {
      onSaveToPersonal(timeline);
    }
  };

  // 一時年表用のスタイル
  const tempStyles = isTemporary ? {
    border: '2px dashed #3b82f6',
    backgroundColor: '#dbeafe',
    opacity: 0.9
  } : {};

  const baseStyles = {
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: '200px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    zIndex: 15,
    fontSize: '12px',
    userSelect: 'none',
    ...tempStyles
  };

  return (
    <div
      className={className}
      style={baseStyles}
      onDoubleClick={handleDoubleClick}
      title={isTemporary ? "一時作成年表 - ダブルクリックで操作" : "ダブルクリックで編集"}
    >
      {/* ヘッダー */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <div style={{
          fontSize: '13px',
          fontWeight: '600',
          color: isTemporary ? '#1e40af' : '#374151',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {isTemporary ? '📋' : '📊'} {timeline.name}
        </div>
        
        {/* 操作ボタン群 */}
        <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
          {/* 表示切替（通常年表のみ） */}
          {!isTemporary && onToggleVisibility && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(timeline.id);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '2px',
                opacity: timeline.isVisible ? 1 : 0.5
              }}
              title={timeline.isVisible ? '年表を非表示' : '年表を表示'}
            >
              {timeline.isVisible ? '👁️' : '🙈'}
            </button>
          )}

          {/* 削除ボタン */}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const confirmMessage = isTemporary 
                  ? `一時年表「${timeline.name}」を削除しますか？`
                  : `年表「${timeline.name}」を削除しますか？`;
                if (window.confirm(confirmMessage)) {
                  onDelete(timeline.id);
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: '12px',
                padding: '2px 4px',
                borderRadius: '2px'
              }}
              title={isTemporary ? '一時年表を削除' : '年表を削除'}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* 統計情報 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
        color: '#6b7280',
        marginBottom: '8px'
      }}>
        <span>
          {timeline.eventCount || timeline.eventIds?.length || 0} イベント
        </span>
        {timeline.color && (
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: timeline.color,
              border: '1px solid #e5e7eb'
            }}
          />
        )}
      </div>

      {/* 一時年表専用：個人ファイル保存ボタン */}
      {isTemporary && user && onSaveToPersonal && (
        <button
          onClick={handleSaveToPersonal}
          style={{
            width: '100%',
            padding: '6px 12px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '500',
            cursor: 'pointer',
            marginTop: '4px'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
        >
          📥 個人ファイルに保存
        </button>
      )}

      {/* 一時年表の説明 */}
      {isTemporary && (
        <div style={{
          fontSize: '10px',
          color: '#6b7280',
          marginTop: '6px',
          fontStyle: 'italic'
        }}>
          一時作成された年表です
        </div>
      )}

      {/* 通常年表の作成日時 */}
      {!isTemporary && timeline.createdAt && (
        <div style={{
          fontSize: '10px',
          color: '#9ca3af',
          marginTop: '4px'
        }}>
          {new Date(timeline.createdAt).toLocaleDateString('ja-JP')}
        </div>
      )}
    </div>
  );
};