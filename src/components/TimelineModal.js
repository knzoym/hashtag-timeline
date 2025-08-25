// src/components/TimelineModal.js
import React from 'react';

const TimelineModal = ({ 
  isOpen, 
  timeline, 
  onClose, 
  onEventRemove, 
  onEventAdd,
  allEvents 
}) => {
  if (!isOpen || !timeline) return null;

  // 仮登録・仮削除されたイベントを分類
  const temporaryEvents = timeline.temporaryEvents || [];
  const removedEvents = timeline.removedEvents || [];
  
  // 元々の検索でヒットしたイベント
  const originalEvents = timeline.events.filter(event => 
    !temporaryEvents.some(temp => temp.id === event.id) &&
    !removedEvents.some(removed => removed.id === event.id)
  );

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      style={{
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
      }}
      onClick={handleOverlayClick}
    >
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        position: 'relative'
      }}>
        {/* ヘッダー */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '2px solid',
          borderColor: timeline.color,
          paddingBottom: '12px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '600',
            color: '#374151'
          }}>
            {timeline.name}
          </h2>
          <button
            onClick={onClose}
            style={{
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
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>

        {/* 年表情報 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ color: '#374151' }}>検索条件: </strong>
            <span style={{ color: '#6b7280' }}>
              {timeline.searchTerm || 'カスタム年表'}
            </span>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ color: '#374151' }}>タグ: </strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
              {timeline.tags.map(tag => (
                <span
                  key={tag}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: timeline.color,
                    color: 'white',
                    fontSize: '12px',
                    borderRadius: '12px',
                    fontWeight: '500'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div>
            <strong style={{ color: '#374151' }}>作成日: </strong>
            <span style={{ color: '#6b7280' }}>
              {timeline.createdAt ? timeline.createdAt.toLocaleDateString('ja-JP') : '不明'}
            </span>
          </div>
        </div>

        {/* 元々のイベント */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981'
            }}></span>
            検索でヒットしたイベント ({originalEvents.length}件)
          </h3>
          <div style={{ maxHeight: '200px', overflow: 'auto' }}>
            {originalEvents.map(event => (
              <EventItem 
                key={event.id} 
                event={event} 
                type="original"
                onRemove={() => onEventRemove(timeline.id, event.id)}
                timelineColor={timeline.color}
              />
            ))}
          </div>
        </div>

        {/* 仮登録されたイベント */}
        {temporaryEvents.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#f59e0b'
              }}></span>
              仮登録されたイベント ({temporaryEvents.length}件)
            </h3>
            <div style={{ maxHeight: '200px', overflow: 'auto' }}>
              {temporaryEvents.map(event => (
                <EventItem 
                  key={event.id} 
                  event={event} 
                  type="temporary"
                  onRemove={() => onEventRemove(timeline.id, event.id)}
                  timelineColor={timeline.color}
                />
              ))}
            </div>
          </div>
        )}

        {/* 仮削除されたイベント */}
        {removedEvents.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#ef4444'
              }}></span>
              仮削除されたイベント ({removedEvents.length}件)
            </h3>
            <div style={{ maxHeight: '200px', overflow: 'auto' }}>
              {removedEvents.map(event => (
                <EventItem 
                  key={event.id} 
                  event={event} 
                  type="removed"
                  onAdd={() => onEventAdd(timeline.id, event.id)}
                  timelineColor={timeline.color}
                />
              ))}
            </div>
          </div>
        )}

        {/* 統計 */}
        <div style={{
          backgroundColor: '#f9fafb',
          padding: '12px',
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            <strong>合計: </strong>
            {originalEvents.length + temporaryEvents.length}件のイベント
            {removedEvents.length > 0 && ` (${removedEvents.length}件が仮削除)`}
          </div>
        </div>
      </div>
    </div>
  );
};

// イベント表示コンポーネント
const EventItem = ({ event, type, onRemove, onAdd, timelineColor }) => {
  const getTypeStyle = () => {
    switch (type) {
      case 'original':
        return {
          backgroundColor: '#f0fdf4',
          borderLeft: '3px solid #10b981'
        };
      case 'temporary':
        return {
          backgroundColor: '#fffbeb',
          borderLeft: '3px solid #f59e0b'
        };
      case 'removed':
        return {
          backgroundColor: '#fef2f2',
          borderLeft: '3px solid #ef4444'
        };
      default:
        return {};
    }
  };

  const getActionButton = () => {
    if (type === 'removed') {
      return (
        <button
          onClick={onAdd}
          style={{
            padding: '4px 8px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          復元
        </button>
      );
    } else {
      return (
        <button
          onClick={onRemove}
          style={{
            padding: '4px 8px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          削除
        </button>
      );
    }
  };

  return (
    <div style={{
      ...getTypeStyle(),
      padding: '12px',
      marginBottom: '8px',
      borderRadius: '6px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          fontWeight: '500',
          fontSize: '14px',
          color: '#374151',
          marginBottom: '4px'
        }}>
          {event.title}
        </div>
        <div style={{
          fontSize: '12px',
          color: '#6b7280'
        }}>
          {event.startDate.getFullYear()}年 • {event.tags.slice(0, 3).join(', ')}
        </div>
      </div>
      <div style={{ marginLeft: '12px' }}>
        {getActionButton()}
      </div>
    </div>
  );
};

export default TimelineModal;