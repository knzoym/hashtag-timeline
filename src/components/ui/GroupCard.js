// components/ui/GroupCard.js - グループ表示コンポーネント（年表色対応・パフォーマンス改善版）
import React, { useState } from 'react';
import { EventCard } from './EventCard';

/**
 * グループアイコン：数字で表示される折りたたみ状態
 */
export const GroupIcon = ({ 
  groupData, 
  onDoubleClick, 
  onHover, 
  style = {},
  isHighlighted = false,
  timelineColor = '#4b5563' // 年表色対応
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const iconStyles = {
    position: 'relative',
    width: '32px',
    height: '32px',
    backgroundColor: timelineColor, // 年表色を使用
    color: '#ffffff',
    border: `2px solid ${timelineColor}`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    userSelect: 'none',
    boxShadow: isHighlighted 
      ? '0 4px 12px rgba(75, 85, 99, 0.4)' 
      : '0 2px 4px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease',
    zIndex: 15,
    ...style
  };

  const tooltipStyles = {
    position: 'absolute',
    bottom: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    zIndex: 100,
    opacity: showTooltip ? 1 : 0,
    visibility: showTooltip ? 'visible' : 'hidden',
    transition: 'opacity 0.2s, visibility 0.2s',
    pointerEvents: 'none'
  };

  const handleMouseEnter = () => {
    setShowTooltip(true);
    if (onHover) onHover(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
    if (onHover) onHover(false);
  };

  return (
    <div
      style={iconStyles}
      onDoubleClick={onDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-group-id={groupData.id}
      title={`${groupData.count}個のイベント`}
    >
      {groupData.count}
      
      {/* ツールチップ */}
      <div style={tooltipStyles}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          グループ ({groupData.count}個)
        </div>
        {groupData.events.slice(0, 3).map((event, index) => (
          <div key={event.id} style={{ fontSize: '11px', opacity: 0.9 }}>
            • {event.title}
          </div>
        ))}
        {groupData.count > 3 && (
          <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>
            ...他{groupData.count - 3}個
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * グループカード：展開状態でイベントを並べて表示
 */
export const GroupCard = ({ 
  groupData, 
  onEventDoubleClick, 
  onClose, 
  style = {},
  panY = 0,
  panX = 0,
  calculateTextWidth
}) => {
  // transform を使用してGPU加速によるパフォーマンス向上
  const cardStyles = {
    position: 'absolute',
    minWidth: '200px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: '2px solid #d1d5db',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
    padding: '12px',
    zIndex: 50,
    backdropFilter: 'blur(4px)',
    // パフォーマンス改善：transformを使用
    transform: `translate(${panX}px, ${panY}px)`,
    willChange: 'transform', // GPU加速の有効化
    ...style
  };

  const headerStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    paddingBottom: '6px',
    borderBottom: '1px solid #e5e7eb'
  };

  const titleStyles = {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151'
  };

  const closeButtonStyles = {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '2px',
    borderRadius: '4px',
    transition: 'background-color 0.2s'
  };

  const eventsContainerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxHeight: '200px',
    overflowY: 'auto'
  };

  return (
    <div style={cardStyles} data-group-card={groupData.id}>
      {/* ヘッダー */}
      <div style={headerStyles}>
        <div style={titleStyles}>
          グループ ({groupData.count}個のイベント)
        </div>
        <button
          style={closeButtonStyles}
          onClick={onClose}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          ×
        </button>
      </div>

      {/* イベントリスト */}
      <div style={eventsContainerStyles}>
        {groupData.events.map((event, index) => (
          <div 
            key={event.id}
            style={{
              transform: 'scale(0.9)',
              transformOrigin: 'left center',
              marginLeft: '5%'
            }}
          >
            <EventCard
              event={event}
              onDoubleClick={() => onEventDoubleClick(event)}
              style={{
                width: '100%',
                marginBottom: '2px'
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 延長線コンポーネント
 */
export const ExtensionLine = ({ lineData, panY, panX = 0 }) => {
  // パフォーマンス改善：transformを使用
  const lineStyles = {
    position: 'absolute',
    width: '2px',
    height: `${Math.abs(lineData.toY - lineData.fromY)}px`,
    backgroundColor: lineData.color,
    opacity: lineData.opacity || 0.6,
    zIndex: 1,
    pointerEvents: 'none',
    // GPU加速によるパフォーマンス向上
    transform: `translate(${lineData.fromX + panX}px, ${Math.min(lineData.fromY, lineData.toY) + panY}px)`,
    willChange: 'transform'
  };

  return <div style={lineStyles} />;
};