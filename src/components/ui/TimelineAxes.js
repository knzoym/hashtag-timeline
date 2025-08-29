import React, { useMemo } from 'react';
import { TimelineCard } from './TimelineCard';
import { TIMELINE_CONFIG } from '../../constants/timelineConfig';

export const TimelineAxes = ({
  axes,
  displayTimelines,
  panY,
  onTimelineClick,
  onDeleteTempTimeline,
  onDeleteTimeline,
}) => {
  // 年表カードの重なり回避計算（設定値統一）
  const adjustedCardPositions = useMemo(() => {
    if (!axes || axes.length === 0) return [];

    const cardPositions = [];
    const CARD_HEIGHT = 80;
    const MIN_SPACING = 10;

    // axesのyPositionをそのまま使用（VisualTab.jsと統一）
    axes.forEach((axis) => {
      const timeline = displayTimelines?.find((t) => t.id === axis.id);
      if (!timeline) return;

      // VisualTab.jsで計算されたyPositionをそのまま使用（軸線と同じ高さ）
      const initialCardY = axis.yPosition;

      cardPositions.push({
        ...axis,
        timeline,
        originalY: initialCardY,
        adjustedY: initialCardY,
        cardHeight: CARD_HEIGHT,
      });
    });

    // Y座標順にソートして重なりを解決
    cardPositions.sort((a, b) => a.originalY - b.originalY);

    // 重なり回避処理
    for (let i = 1; i < cardPositions.length; i++) {
      const current = cardPositions[i];
      const previous = cardPositions[i - 1];

      const previousBottom = previous.adjustedY + previous.cardHeight + MIN_SPACING;
      if (current.adjustedY < previousBottom) {
        const overlap = previousBottom - current.adjustedY;
        console.log(`年表カード重なり検出: "${current.timeline.name}" を ${overlap}px 下に移動`);
        current.adjustedY = previousBottom;
      }
    }

    console.log(`年表カード位置調整完了: ${cardPositions.length}枚（座標統一）`);
    return cardPositions;
  }, [axes, displayTimelines]);

  return (
    <>
      {/* 年表軸（VisualTab.jsで計算されたyPositionを使用） */}
      {axes.map((axis) => {
        // VisualTab.jsで計算されたyPositionを直接使用
        const axisY = axis.yPosition;

        // 軸線をイベント範囲に限定（startX から endX まで）
        const axisStartX = Math.max(0, axis.startX - (TIMELINE_CONFIG.AXIS_PADDING || 50));
        const axisEndX = axis.endX + (TIMELINE_CONFIG.AXIS_PADDING || 50);
        const axisWidth = axisEndX - axisStartX;

        console.log(`年表軸 "${axis.name}": VisualTab座標Y=${axisY}, 範囲 ${axisStartX.toFixed(0)} - ${axisEndX.toFixed(0)}`);

        return (
          <div
            key={`timeline-axis-${axis.id}`}
            style={{
              position: 'absolute',
              left: `${axisStartX}px`,
              top: `${axisY + panY}px`,
              width: `${Math.max(100, axisWidth)}px`,
              height: '3px',
              backgroundColor: axis.color || '#6b7280',
              zIndex: 2,
              opacity: 0.8,
              display: 'block',
              pointerEvents: 'none',
            }}
          />
        );
      })}

      {/* 年表概要カード（重なり回避済み位置） */}
      {adjustedCardPositions.map((cardData) => {
        const isTemporary = cardData.timeline.type === 'temporary';

        return (
          <TimelineCard
            key={`timeline-card-${cardData.id}`}
            timeline={cardData.timeline}
            position={{ 
              x: cardData.cardX, 
              y: cardData.adjustedY
            }}
            isTemporary={isTemporary}
            panY={panY}
            panX={0}
            onEdit={() => onTimelineClick && onTimelineClick(cardData.timeline)}
            onDelete={() => {
              if (isTemporary && onDeleteTempTimeline) {
                onDeleteTempTimeline(cardData.id);
              } else if (!isTemporary && onDeleteTimeline) {
                onDeleteTimeline(cardData.id);
              }
            }}
            className="no-pan"
          />
        );
      })}
    </>
  );
};