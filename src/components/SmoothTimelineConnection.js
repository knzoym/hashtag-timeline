// src/components/SmoothTimelineConnection.js - 完全修正版
import React from 'react';

export const SmoothTimelineConnection = ({ 
  timeline, 
  panY, 
  displayState, 
  onHover, 
  onClick,
  zIndex = 3,
  eventSizeScale = { scale: 1.0, fontSize: 11 }
}) => {
  if (!timeline.points || timeline.points.length < 2) return null;

  // 表示状態に基づくスタイル
  const getConnectionStyle = () => {
    const baseWidth = 3 * eventSizeScale.scale;
    
    switch (displayState) {
      case 'selected':
        return {
          strokeWidth: Math.max(2, baseWidth * 2),
          opacity: 1.0,
          color: timeline.color,
          glowEffect: true,
        };
      case 'hovered':
        return {
          strokeWidth: Math.max(2, baseWidth * 1.6),
          opacity: 0.9,
          color: timeline.color,
          glowEffect: false,
        };
      case 'dimmed':
        return {
          strokeWidth: Math.max(1, baseWidth * 0.6),
          opacity: 0.3,
          color: timeline.color,
          glowEffect: false,
        };
      default:
        return {
          strokeWidth: Math.max(1, baseWidth),
          opacity: 0.7,
          color: timeline.color,
          glowEffect: false,
        };
    }
  };

  const style = getConnectionStyle();

  // イベントボックスの左右から横方向に伸ばす接続パス生成
  const generateHorizontalConnectionPath = (points) => {
    if (points.length < 2) return '';

    let path = '';
    const adjustedPoints = points.map(p => ({
      x: p.x,
      y: p.y + panY,
      event: p.event
    }));

    // イベントの推定幅を計算
    const getEventWidth = (point) => {
      const baseWidth = 80;
      return Math.max(120 * eventSizeScale.scale, (baseWidth + 16) * eventSizeScale.scale);
    };

    for (let i = 0; i < adjustedPoints.length; i++) {
      const point = adjustedPoints[i];
      const eventWidth = getEventWidth(point);
      const horizontalExtend = Math.max(20, eventWidth / 2 + 10); // ボックス端から少し伸ばす
      
      if (i === 0) {
        // 最初のポイント: 右端から開始
        path += `M ${point.x + horizontalExtend} ${point.y}`;
      } else {
        const prevPoint = adjustedPoints[i - 1];
        const prevEventWidth = getEventWidth(prevPoint);
        const prevExtend = Math.max(20, prevEventWidth / 2 + 10);
        
        // 前のポイントの右端から現在のポイントの左端へ滑らかに接続
        const startX = prevPoint.x + prevExtend;
        const endX = point.x - horizontalExtend;
        
        // 制御点で滑らかなカーブを作成
        const midX = (startX + endX) / 2;
        const cp1X = startX + Math.min(50, Math.abs(endX - startX) / 3);
        const cp2X = endX - Math.min(50, Math.abs(endX - startX) / 3);
        
        // ベジエ曲線で接続
        path += ` L ${startX} ${prevPoint.y}`;
        path += ` C ${cp1X} ${prevPoint.y}, ${cp2X} ${point.y}, ${endX} ${point.y}`;
        path += ` L ${point.x - horizontalExtend} ${point.y}`;
      }
    }

    return path;
  };

  const pathD = generateHorizontalConnectionPath(timeline.points);

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        zIndex: zIndex,
      }}
    >
      <defs>
        {style.glowEffect && (
          <filter id={`glow-${timeline.id}`}>
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        )}
      </defs>

      {/* ホバー/クリック判定用の透明な太い線 */}
      <path
        d={pathD}
        stroke="transparent"
        strokeWidth="20"
        fill="none"
        style={{ cursor: 'pointer' }}
        onMouseEnter={(e) => {
          e.stopPropagation();
          onHover(timeline.id);
        }}
        onMouseLeave={(e) => {
          e.stopPropagation();
          onHover(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(timeline.id);
        }}
      />

      {/* 実際の表示線 */}
      <path
        d={pathD}
        stroke={style.color}
        strokeWidth={style.strokeWidth}
        fill="none"
        opacity={style.opacity}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={style.glowEffect ? `url(#glow-${timeline.id})` : undefined}
        style={{
          transition: 'all 0.1s ease', // パン遅延を軽減
          pointerEvents: 'none',
        }}
      />

      {/* 接続ポイント */}
      {(displayState === 'selected' || displayState === 'hovered') && 
        timeline.points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y + panY}
            r={Math.max(2, 4 * eventSizeScale.scale)}
            fill={timeline.color}
            stroke="white"
            strokeWidth={Math.max(1, 2 * eventSizeScale.scale)}
            opacity={style.opacity}
            style={{
              filter: style.glowEffect ? `url(#glow-${timeline.id})` : undefined,
              pointerEvents: 'none',
            }}
          />
        ))
      }
    </svg>
  );
};