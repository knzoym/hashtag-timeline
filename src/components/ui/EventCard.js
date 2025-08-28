// components/ui/EventCard.js - 年表色対応版
import React from 'react';
import { TIMELINE_CONFIG } from '../../constants/timelineConfig';

/**
 * 色の明度を計算して、適切なテキスト色を決定
 */
function getContrastColor(hexColor) {
  if (!hexColor) return '#000000';
  
  // HSL色からRGBに変換（簡易版）
  if (hexColor.startsWith('hsl')) {
    // hsl(240, 70%, 50%) のような形式をパース
    const match = hexColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (match) {
      const l = parseInt(match[3]);
      return l > 50 ? '#000000' : '#ffffff';
    }
  }
  
  // 16進数カラーの場合
  if (hexColor.startsWith('#')) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }
  
  return '#000000'; // デフォルトは黒
}

/**
 * 背景色を少し暗くする
 */
function darkenColor(hslColor, amount = 10) {
  if (!hslColor || !hslColor.startsWith('hsl')) return hslColor;
  
  const match = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (match) {
    const h = match[1];
    const s = match[2];
    const l = Math.max(0, parseInt(match[3]) - amount);
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  return hslColor;
}

export const EventCard = ({ 
  event, 
  isHighlighted = false,
  onDoubleClick,
  onMouseDown,
  style = {},
  className = "",
  ...props
}) => {
  // 年表情報に基づく色設定
  const getEventColors = () => {
    if (event.timelineInfo) {
      // 年表に属するイベント：年表色の背景＋適切なテキスト色
      const backgroundColor = event.timelineInfo.timelineColor;
      const textColor = getContrastColor(backgroundColor);
      const borderColor = darkenColor(backgroundColor, 20);
      
      return {
        backgroundColor,
        color: textColor,
        borderColor
      };
    } else if (isHighlighted) {
      // ハイライト時
      return {
        backgroundColor: '#3b82f6',
        color: '#ffffff',
        borderColor: '#1d4ed8'
      };
    } else {
      // デフォルト（メインタイムライン）
      return {
        backgroundColor: '#6b7280',
        color: '#ffffff',
        borderColor: '#4b5563'
      };
    }
  };

  const colors = getEventColors();
  const year = event.startDate ? event.startDate.getFullYear() : '';

  const cardStyles = {
    position: 'relative',
    minWidth: '60px',
    maxWidth: '180px',
    height: `${TIMELINE_CONFIG.EVENT_HEIGHT}px`,
    backgroundColor: colors.backgroundColor,
    color: colors.color,
    border: `2px solid ${colors.borderColor}`,
    borderRadius: '8px',
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: '500',
    cursor: 'pointer',
    userSelect: 'none',
    boxShadow: isHighlighted 
      ? '0 4px 12px rgba(59, 130, 246, 0.4)' 
      : '0 2px 4px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    lineHeight: '1.2',
    overflow: 'hidden',
    zIndex: isHighlighted ? 20 : 10,
    ...style
  };

  // ホバー効果
  const handleMouseEnter = (e) => {
    e.target.style.transform = 'scale(1.05)';
    e.target.style.boxShadow = isHighlighted 
      ? '0 6px 16px rgba(59, 130, 246, 0.6)' 
      : '0 4px 8px rgba(0, 0, 0, 0.2)';
  };

  const handleMouseLeave = (e) => {
    e.target.style.transform = 'scale(1)';
    e.target.style.boxShadow = isHighlighted 
      ? '0 4px 12px rgba(59, 130, 246, 0.4)' 
      : '0 2px 4px rgba(0, 0, 0, 0.1)';
  };

  return (
    <div
      style={cardStyles}
      className={className}
      onDoubleClick={onDoubleClick}
      onMouseDown={onMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-event-id={event.id}
      title={`${event.title} (${year})`}
      {...props}
    >
      {/* イベントタイトル */}
      <div style={{
        fontSize: '10px',
        fontWeight: '600',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '100%'
      }}>
        {event.title || 'Untitled'}
      </div>
      
      {/* 年号 */}
      {year && (
        <div style={{
          fontSize: '9px',
          opacity: 0.9,
          marginTop: '1px'
        }}>
          {year}
        </div>
      )}
      
      {/* 年表所属インジケーター */}
      {event.timelineInfo && (
        <div style={{
          position: 'absolute',
          top: '-2px',
          right: '-2px',
          width: '8px',
          height: '8px',
          backgroundColor: colors.borderColor,
          borderRadius: '50%',
          border: '1px solid white'
        }} />
      )}
      
      {/* 延長線が必要な場合のインジケーター */}
      {event.timelineInfo?.needsExtensionLine && (
        <div style={{
          position: 'absolute',
          bottom: '-2px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '12px',
          height: '2px',
          backgroundColor: colors.borderColor,
          opacity: 0.7
        }} />
      )}
    </div>
  );
};