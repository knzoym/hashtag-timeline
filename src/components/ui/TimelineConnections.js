// src/components/ui/TimelineConnections.js - 年表線描画システム
import React from 'react';

export const TimelineConnections = ({
  connections = [],
  panY = 0,
  onTimelineHover,
  onTimelineClick,
}) => {
  // 年表線のスタイル設定
  const getLineStyle = (displayState) => {
    switch (displayState) {
      case 'selected':
        return {
          strokeWidth: 4,
          opacity: 1.0,
          strokeDasharray: 'none',
        };
      case 'hovered':
        return {
          strokeWidth: 3,
          opacity: 0.8,
          strokeDasharray: 'none',
        };
      case 'dimmed':
        return {
          strokeWidth: 1,
          opacity: 0.3,
          strokeDasharray: 'none',
        };
      default:
        return {
          strokeWidth: 1.5,
          opacity: 0.5,
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

    // イベントから横に30px伸ばしてから滑らかに年表軸へ接続
    const horizontalExtend = 30;
    const midPointX = adjustedStart.x + horizontalExtend;
    
    // 制御点を使った3次ベジエ曲線
    const controlPoint1X = midPointX + 20;
    const controlPoint1Y = adjustedStart.y;
    const controlPoint2X = adjustedEnd.x - 20;
    const controlPoint2Y = adjustedEnd.y;

    return `
      M ${adjustedStart.x} ${adjustedStart.y}
      L ${midPointX} ${adjustedStart.y}
      C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${adjustedEnd.x} ${adjustedEnd.y}
    `.trim();
  };

  // 年表ごとにグループ化された線をまとめて処理
  const timelineGroups = React.useMemo(() => {
    const groups = {};
    
    connections.forEach(eventConnection => {
      eventConnection.connections.forEach(connection => {
        const timelineId = connection.timelineId;
        
        if (!groups[timelineId]) {
          groups[timelineId] = {
            timelineId,
            timelineName: connection.timelineName,
            timelineColor: connection.timelineColor,
            displayState: connection.displayState,
            paths: []
          };
        }
        
        groups[timelineId].paths.push({
          eventId: eventConnection.eventId,
          path: generateConnectionPath(connection),
          connection: connection
        });
      });
    });
    
    return Object.values(groups);
  }, [connections, panY]);

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
        {timelineGroups.map(group => (
          group.displayState === 'selected' && (
            <filter key={`glow-${group.timelineId}`} id={`glow-${group.timelineId}`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          )
        ))}
      </defs>

      {/* 年表ごとにグループ化して描画 */}
      {timelineGroups.map(group => {
        const style = getLineStyle(group.displayState);
        const color = group.timelineColor || '#6b7280';
        
        return (
          <g key={group.timelineId}>
            {/* 各イベントから年表への線 */}
            {group.paths.map((pathData, index) => (
              <g key={`${group.timelineId}-${pathData.eventId}-${index}`}>
                {/* クリック・ホバー検出用の太い透明線 */}
                <path
                  d={pathData.path}
                  stroke="transparent"
                  strokeWidth="12"
                  fill="none"
                  style={{
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                  }}
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    onTimelineHover?.(group.timelineId);
                  }}
                  onMouseLeave={(e) => {
                    e.stopPropagation();
                    onTimelineHover?.(null);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTimelineClick?.(group.timelineId);
                  }}
                />
                
                {/* 実際の表示線 */}
                <path
                  d={pathData.path}
                  stroke={color}
                  strokeWidth={style.strokeWidth}
                  opacity={style.opacity}
                  strokeDasharray={style.strokeDasharray}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter={group.displayState === 'selected' ? `url(#glow-${group.timelineId})` : undefined}
                  style={{
                    transition: 'all 0.2s ease',
                    pointerEvents: 'none',
                  }}
                />
              </g>
            ))}
            
            {/* 年表軸上の接続ポイント（選択・ホバー時のみ） */}
            {(group.displayState === 'selected' || group.displayState === 'hovered') &&
              group.paths.map((pathData, index) => {
                const endPoint = pathData.connection.endPoint;
                return (
                  <circle
                    key={`point-${group.timelineId}-${pathData.eventId}-${index}`}
                    cx={endPoint.x}
                    cy={endPoint.y + panY}
                    r="3"
                    fill={color}
                    stroke="white"
                    strokeWidth="1.5"
                    opacity={style.opacity}
                    filter={group.displayState === 'selected' ? `url(#glow-${group.timelineId})` : undefined}
                    style={{
                      pointerEvents: 'none',
                      transition: 'all 0.2s ease',
                    }}
                  />
                );
              })
            }
          </g>
        );
      })}

      {/* デバッグ情報（開発時のみ） */}
      {process.env.NODE_ENV === 'development' && timelineGroups.length > 0 && (
        <text
          x="20"
          y="20"
          fill="red"
          fontSize="10"
          fontFamily="monospace"
        >
          Timeline Connections: {timelineGroups.reduce((sum, g) => sum + g.paths.length, 0)}
        </text>
      )}
    </svg>
  );
};