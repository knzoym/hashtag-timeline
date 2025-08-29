import React, { useMemo } from 'react';
import { TimelineCard } from './TimelineCard';

export const TimelineAxes = ({
  axes,
  displayTimelines,
  panY,
  onTimelineClick,
  onDeleteTempTimeline,
  onDeleteTimeline,
}) => {
  // 年表カードの重なり回避計算
  const adjustedCardPositions = useMemo(() => {
    if (!axes || axes.length === 0) return [];

    const cardPositions = [];
    const CARD_HEIGHT = 80; // カードの高さ
    const MIN_SPACING = 10; // 最小間隔

    // 各軸の初期カード位置を計算
    axes.forEach((axis, index) => {
      const timeline = displayTimelines?.find((t) => t.id === axis.id);
      if (!timeline) return;

      const baselineY = window.innerHeight * 0.3;
      const axisY = baselineY + 100 + index * 120;
      const initialCardY = axisY + 70;

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

      // 前のカードとの重なりをチェック
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
      {/* 年表軸 */}
      {axes.map((axis, index) => {
        const baselineY = window.innerHeight * 0.3;
        const axisY = baselineY + 100 + index * 120;

        return (
          <div
            key={`timeline-axis-${axis.id}`}
            style={{
              position: 'absolute',
              left: '0px',
              right: '0px',
              top: `${axisY + panY}px`,
              width: '100%',
              height: '3px',
              backgroundColor: axis.color,
              zIndex: 2,
              opacity: 0.8,
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
              y: cardData.adjustedY // 調整済みY座標を使用
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