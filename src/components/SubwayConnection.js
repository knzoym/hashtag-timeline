// src/components/SubwayConnection.js
import React from 'react';

export const SubwayConnection = ({ timeline, panY }) => {
  if (!timeline.points || timeline.points.length < 2) return null;

  const strokeWidth = 4;
  const stationRadius = 6;

  // 地下鉄路線のような直線的な接続を生成
  const generateSubwayPath = (points) => {
    if (points.length < 2) return '';

    let path = `M ${points[0].x} ${points[0].y + panY}`;

    for (let i = 1; i < points.length; i++) {
      const curr = points[i];
      const prev = points[i - 1];
      
      // 水平線 + 垂直線 + 水平線のパターン
      const midX = (prev.x + curr.x) / 2;
      
      // 横→縦→横の3段階接続
      path += ` L ${midX} ${prev.y + panY}`;
      path += ` L ${midX} ${curr.y + panY}`;
      path += ` L ${curr.x} ${curr.y + panY}`;
    }

    return path;
  };

  const pathD = generateSubwayPath(timeline.points);

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 3,
      }}
    >
      <defs>
        <filter id={`shadow-${timeline.id}`}>
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.2)"/>
        </filter>
      </defs>
      
      {/* メインの路線 */}
      <path
        d={pathD}
        stroke={timeline.color}
        strokeWidth={strokeWidth}
        fill="none"
        filter={`url(#shadow-${timeline.id})`}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* 駅ポイント */}
      {timeline.points.map((point, index) => (
        <g key={index}>
          {/* 外側の白い円（駅の外枠） */}
          <circle
            cx={point.x}
            cy={point.y + panY}
            r={stationRadius + 2}
            fill="white"
            stroke={timeline.color}
            strokeWidth="2"
            filter={`url(#shadow-${timeline.id})`}
          />
          {/* 内側の色つき円（駅の中心） */}
          <circle
            cx={point.x}
            cy={point.y + panY}
            r={stationRadius - 1}
            fill={timeline.color}
          />
        </g>
      ))}
    </svg>
  );
};
