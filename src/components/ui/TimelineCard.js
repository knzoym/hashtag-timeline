// src/components/ui/TimelineCard.js - パフォーマンス改善版
import React from 'react';

export const TimelineCard = ({
  timeline,
  position = { x: 0, y: 0 },
  isTemporary = false,
  onEdit,
  onDelete,
  onToggleVisibility,
  onSaveToPersonal,
  className = "",
  user = null,
  panY = 0,
  panX = 0
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
    opacity: 0.95
  } : {};

  const baseStyles = {
    position: 'absolute',
    width: '180px',
    padding: '10px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    zIndex: 15,
    fontSize: '12px',
    userSelect: 'none',
    // パフォーマンス改善：transformを使用してGPU加速
    transform: `translate(${position.x + panX - 200}px, ${position.y + panY - 40}px)`,
    willChange: 'transform',
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
          whiteSpace: 'nowrap',
          paddingRight: '4px'
        }}>
          {isTemporary ? 'sample' : ''} {timeline.name}
        </div>
        
        {/* 操作ボタン群 */}
        <div style={{ display: 'flex', gap: '4px' }}>
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
                fontSize: '12px',
                padding: '2px',
                opacity: timeline.isVisible !== false ? 1 : 0.5,
                borderRadius: '3px'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              title={timeline.isVisible !== false ? '年表を非表示' : '年表を表示'}
            >
              {timeline.isVisible !== false ? '👁️' : '🙈'}
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
                borderRadius: '3px'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#fee2e2'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
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
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: timeline.color,
              border: '1px solid #e5e7eb',
              flexShrink: 0
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
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '500',
            cursor: 'pointer',
            marginTop: '4px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
        >
          💾 個人ファイルに保存
        </button>
      )}

      {/* タグ表示（最大3個） */}
      {timeline.tags && timeline.tags.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '3px',
          marginTop: '6px'
        }}>
          {timeline.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              style={{
                padding: '2px 6px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                fontSize: '10px',
                borderRadius: '4px',
                border: '1px solid #d1d5db'
              }}
            >
              #{tag}
            </span>
          ))}
          {timeline.tags.length > 3 && (
            <span style={{
              fontSize: '10px',
              color: '#9ca3af',
              padding: '2px 4px'
            }}>
              +{timeline.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* 作成日時 */}
      <div style={{
        fontSize: '10px',
        color: '#9ca3af',
        marginTop: '6px',
        textAlign: 'right'
      }}>
        {isTemporary ? (
          "一時作成"
        ) : timeline.createdAt ? (
          new Date(timeline.createdAt).toLocaleDateString('ja-JP')
        ) : (
          ""
        )}
      </div>
    </div>
  );
};