// src/hooks/useDragDrop.js
import { useState, useCallback, useRef } from 'react';

export const useDragDrop = (onEventMove, onTimelineMove, onEventAddToTimeline, onEventRemoveFromTimeline) => {
  const [dragState, setDragState] = useState({
    isDragging: false,
    dragType: null, // 'event' | 'timeline'
    draggedItem: null,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    targetTimeline: null
  });

  const longPressTimer = useRef(null);
  const dragStarted = useRef(false);

  // 長押し開始
  const handleMouseDown = useCallback((e, itemType, item) => {
    e.preventDefault();
    e.stopPropagation(); // イベントの伝播を停止
    
    const startPos = {
      x: e.clientX,
      y: e.clientY
    };

    longPressTimer.current = setTimeout(() => {
      setDragState({
        isDragging: true,
        dragType: itemType,
        draggedItem: item,
        startPosition: startPos,
        currentPosition: startPos,
        targetTimeline: null
      });
      dragStarted.current = true;
      
      // ドラッグ中のカーソル変更
      document.body.style.cursor = 'grabbing';
    }, 500); // 500ms の長押し

    // マウスが動いたら長押しをキャンセル
    const handleEarlyMove = (moveEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - startPos.x);
      const deltaY = Math.abs(moveEvent.clientY - startPos.y);
      
      if (deltaX > 5 || deltaY > 5) {
        clearTimeout(longPressTimer.current);
        document.removeEventListener('mousemove', handleEarlyMove);
      }
    };

    document.addEventListener('mousemove', handleEarlyMove);
    
    // マウスアップで長押しをキャンセル
    const handleEarlyUp = () => {
      clearTimeout(longPressTimer.current);
      document.removeEventListener('mousemove', handleEarlyMove);
      document.removeEventListener('mouseup', handleEarlyUp);
    };

    document.addEventListener('mouseup', handleEarlyUp);
  }, []);

  // ドラッグ中のマウス移動
  const handleMouseMove = useCallback((e) => {
    if (!dragState.isDragging) return;

    // 縦方向のみの移動に制限
    const verticalDelta = e.clientY - dragState.startPosition.y;
    
    setDragState(prev => ({
      ...prev,
      currentPosition: {
        x: prev.startPosition.x, // X座標は開始位置で固定
        y: prev.startPosition.y + verticalDelta // Y座標のみ変更
      }
    }));
  }, [dragState.isDragging, dragState.startPosition]);

  // ドロップ処理
  const handleMouseUp = useCallback((e, timelineAxes, eventPositions) => {
    if (!dragState.isDragging) return;

    const dropY = e.clientY;
    let targetTimeline = null;
    
    console.log(`ドロップ位置: Y=${dropY}`);
    
    // 年表との重なりをチェック（優先処理）
    if (timelineAxes) {
      targetTimeline = timelineAxes.find(axis => {
        const axisRect = {
          top: axis.yPosition - 60, // 表示範囲と一致
          bottom: axis.yPosition + 60
        };
        console.log(`年表「${axis.name}」の範囲: ${axisRect.top} - ${axisRect.bottom}`);
        const isInRange = dropY >= axisRect.top && dropY <= axisRect.bottom;
        if (isInRange) {
          console.log(`年表「${axis.name}」の範囲内にドロップ`);
        }
        return isInRange;
      });
    }

    if (dragState.dragType === 'event') {
      if (targetTimeline) {
        // 年表に仮登録（年表エリアでのドロップを優先）
        console.log(`イベント「${dragState.draggedItem.title}」を年表「${targetTimeline.name}」に仮登録`);
        onEventAddToTimeline(dragState.draggedItem, targetTimeline.id);
      } else {
        console.log('メインタイムラインでの位置調整');
        // メインタイムラインでの位置調整
        const targetY = dropY - dragState.startPosition.y + dragState.draggedItem.adjustedPosition.y;
        
        // 年表に属さないイベントとの重なりのみをチェック
        const conflictingEvents = eventPositions.filter(pos => 
          pos.id !== dragState.draggedItem.id &&
          !pos.timelineId && // 年表に属さないイベントのみ
          Math.abs(pos.x - dragState.draggedItem.adjustedPosition.x) < 100 &&
          Math.abs(pos.y - targetY) < 50
        );

        if (conflictingEvents.length > 0) {
          // 重なりがある場合、他のイベントをずらす
          onEventMove(dragState.draggedItem.id, targetY, conflictingEvents);
        } else {
          onEventMove(dragState.draggedItem.id, targetY, []);
        }
      }
    } else if (dragState.dragType === 'timeline') {
      // 年表の移動
      const targetY = dropY - dragState.startPosition.y + dragState.draggedItem.yPosition;
      onTimelineMove(dragState.draggedItem.id, targetY);
    }

    // ドラッグ状態をリセット
    setDragState({
      isDragging: false,
      dragType: null,
      draggedItem: null,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      targetTimeline: null
    });

    document.body.style.cursor = 'default';
    dragStarted.current = false;
  }, [dragState, onEventMove, onTimelineMove, onEventAddToTimeline]);

  // ドラッグ中止
  const cancelDrag = useCallback(() => {
    clearTimeout(longPressTimer.current);
    setDragState({
      isDragging: false,
      dragType: null,
      draggedItem: null,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      targetTimeline: null
    });
    document.body.style.cursor = 'default';
    dragStarted.current = false;
  }, []);

  return {
    dragState,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    cancelDrag,
    isDragging: dragState.isDragging
  };
};