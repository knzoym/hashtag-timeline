// src/components/SmoothTimelineConnection.js
import React from 'react';

export const SmoothTimelineConnection = ({ 
  timeline, 
  panY, 
  displayState, 
  onHover, 
  onClick,
  zIndex = 3 
}) => {
  if (!timeline.points || timeline.points.length < 2) return null;

  // 表示状態に基づくスタイル（太く、色付きに変更）
  const getConnectionStyle = () => {
    switch (displayState) {
      case 'selected':
        return {
          strokeWidth: 6,
          opacity: 1.0,
          color: timeline.color,
          glowEffect: true,
        };
      case 'hovered':
        return {
          strokeWidth: 5,
          opacity: 0.9,
          color: timeline.color,
          glowEffect: false,
        };
      case 'dimmed':
        return {
          strokeWidth: 2,
          opacity: 0.3,
          color: timeline.color,
          glowEffect: false,
        };
      default:
        return {
          strokeWidth: 3, // デフォルトも太くする
          opacity: 0.7,   // 色も見えるようにする
          color: timeline.color,
          glowEffect: false,
        };
    }
  };

  const style = getConnectionStyle();

  // 滑らかな曲線パス生成（画像を参考に）
  const generateSmoothPath = (points) => {
    if (points.length < 2) return '';

    let path = '';
    const adjustedPoints = points.map(p => ({
      x: p.x,
      y: p.y + panY
    }));

    // 各イベントから横に伸ばしてから接続
    for (let i = 0; i < adjustedPoints.length; i++) {
      const point = adjustedPoints[i];
      const horizontalExtend = 30; // 横に伸ばす距離

      if (i === 0) {
        // 最初のポイント: 横線から開始
        path += `M ${point.x - horizontalExtend} ${point.y} L ${point.x} ${point.y}`;
      } else {
        const prevPoint = adjustedPoints[i - 1];
        
        // 滑らかな曲線で接続
        const cp1x = prevPoint.x + horizontalExtend;
        const cp1y = prevPoint.y;
        const cp2x = point.x - horizontalExtend;
        const cp2y = point.y;
        
        // 3次ベジエ曲線
        path += ` L ${cp1x} ${cp1y}`;
        path += ` C ${cp1x + 20} ${cp1y}, ${cp2x - 20} ${cp2y}, ${cp2x} ${cp2y}`;
        path += ` L ${point.x} ${point.y}`;
      }
    }

    return path;
  };

  const pathD = generateSmoothPath(timeline.points);

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto', // 常にイベント処理を有効にする
        zIndex: zIndex, // 明示的にzIndexを制御
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

      {/* クリック可能な透明な非常に太い線（ホバー/クリック用） - ちらつき防止 */}
      <path
        d={pathD}
        stroke="transparent"
        strokeWidth="20" // さらに太い判定領域
        fill="none"
        style={{ 
          cursor: 'pointer',
        }}
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
          transition: 'all 0.2s ease',
          pointerEvents: 'none', // 表示線はクリックイベントを受けない
        }}
      />

      {/* 接続ポイント（選択/ホバー時のみ表示） */}
      {(displayState === 'selected' || displayState === 'hovered') && 
        timeline.points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y + panY}
            r="4" // 少し大きくする
            fill={timeline.color}
            stroke="white"
            strokeWidth="2"
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