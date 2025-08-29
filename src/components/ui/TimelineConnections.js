// src/components/ui/TimelineConnections.js - 年表線描画システム
import React from 'react';

export const TimelineConnections = ({
  connections = [],
  panY = 0,
  onTimelineHover,
  onTimelineClick,
  onTimelineDoubleClick,
}) => {
  // 年表線のスタイル設定（太めに調整）
  const getLineStyle = (displayState) => {
    switch (displayState) {
      case 'selected':
        return {
          strokeWidth: 8, // 太く
          opacity: 1.0,
          strokeDasharray: 'none',
        };
      case 'hovered':
        return {
          strokeWidth: 6, // 太く
          opacity: 0.9,
          strokeDasharray: 'none',
        };
      case 'dimmed':
        return {
          strokeWidth: 3,
          opacity: 0.4,
          strokeDasharray: 'none',
        };
      default:
        return {
          strokeWidth: 4, // デフォルトも太く
          opacity: 0.7,
          strokeDasharray: 'none',
        };
    }
  };

  // 滑らかな曲線パス生成
  const generateConnectionPath = (connection) => {
    const { startPoint, endPoint } = connection;
    
    // パンY調整後の座標
    const adjustedStart = {
      x: startPoint.x,
      y: startPoint.y + panY
    };
    const adjustedEnd = {
      x: endPoint.x,
      y: endPoint.y + panY
    };

    // 直線的な接続（年月日順のイベント間）
    return `M ${adjustedStart.x} ${adjustedStart.y} L ${adjustedEnd.x} ${adjustedEnd.y}`;
  };

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // 全体は無効、個別の線で有効化
        zIndex: 5, // イベントより下、年表軸より上
      }}
    >
      <defs>
        {/* 各年表色に対応するグロー効果 */}
        {connections.map(connection => (
          connection.displayState === 'selected' && (
            <filter key={`glow-${connection.timelineId}`} id={`glow-${connection.timelineId}`}>
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          )
        ))}
      </defs>

      {/* 年表線を描画 */}
      {connections.map((connection, index) => {
        const style = getLineStyle(connection.displayState);
        const color = connection.timelineColor || '#6b7280';
        const pathD = generateConnectionPath(connection);
        
        return (
          <g key={`${connection.timelineId}-${index}`}>
            {/* クリック・ホバー検出用の太い透明線 */}
            <path
              d={pathD}
              stroke="transparent"
              strokeWidth="16"
              fill="none"
              style={{
                cursor: 'pointer',
                pointerEvents: 'auto',
              }}
              onMouseEnter={(e) => {
                e.stopPropagation();
                onTimelineHover?.(connection.timelineId);
              }}
              onMouseLeave={(e) => {
                e.stopPropagation();
                onTimelineHover?.(null);
              }}
              onClick={(e) => {
                e.stopPropagation();
                onTimelineClick?.(connection.timelineId);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onTimelineDoubleClick?.(connection.timelineId);
              }}
            />
            
            {/* 実際の表示線 */}
            <path
              d={pathD}
              stroke={color}
              strokeWidth={style.strokeWidth}
              opacity={style.opacity}
              strokeDasharray={style.strokeDasharray}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={connection.displayState === 'selected' ? `url(#glow-${connection.timelineId})` : undefined}
              style={{
                transition: 'all 0.2s ease',
                pointerEvents: 'none',
              }}
            />
          </g>
        );
      })}

      {/* デバッグ情報（開発時のみ） */}
      {process.env.NODE_ENV === 'development' && connections.length > 0 && (
        <text
          x="20"
          y="40"
          fill="red"
          fontSize="10"
          fontFamily="monospace"
        >
          Timeline Connections: {connections.length}
        </text>
      )}
    </svg>
  );
};