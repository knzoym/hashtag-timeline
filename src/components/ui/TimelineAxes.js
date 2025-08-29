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
  // 年表カードの重なり回避計算（修正版）
  const adjustedCardPositions = useMemo(() => {
    if (!axes || axes.length === 0) return [];

    const cardPositions = [];
    const CARD_HEIGHT = 80;
    const MIN_SPACING = 10;

    axes.forEach((axis) => {
      const timeline = displayTimelines?.find((t) => t.id === axis.id);
      if (!timeline) return;

      cardPositions.push({
        ...axis,
        timeline,
        originalY: axis.yPosition,
        adjustedY: axis.yPosition,
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

    console.log(`年表カード位置調整完了: ${cardPositions.length}枚`);
    return cardPositions;
  }, [axes, displayTimelines]);

  return (
    <>
      {/* 年表軸（修正版：正しい範囲で表示） */}
      {axes.map((axis) => {
        const axisY = axis.yPosition;

        // 軸線の範囲：startX から endX まで（VisualTabで計算済み）
        const axisStartX = axis.startX;
        const axisEndX = axis.endX;
        const axisWidth = axisEndX - axisStartX;

        // デバッグ情報
        console.log(`年表軸 "${axis.name}": Y=${axisY}, 範囲=${axisStartX.toFixed(0)}-${axisEndX.toFixed(0)} (幅=${axisWidth.toFixed(0)}px), 関連イベント=${axis.allEventCount || 0}件`);

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

        // カード位置のデバッグ情報
        console.log(`年表カード "${cardData.timeline.name}": X=${cardData.cardX}, Y=${cardData.adjustedY}, 軸線開始=${cardData.startX.toFixed(0)}`);

        return (
          <TimelineCard
            key={`timeline-card-${cardData.id}`}
            timeline={cardData.timeline}
            position={{ 
              x: cardData.cardX, // VisualTabで計算された適切な位置
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