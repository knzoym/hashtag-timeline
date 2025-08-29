// src/hooks/useDragDrop.js - 300ms長押し・縦方向制限強化版
import { useState, useCallback, useRef } from "react";

export const useDragDrop = (
  onEventMove,
  onTimelineMove,
  onEventAddToTimeline,
  onEventRemoveFromTimeline
) => {
  const [dragState, setDragState] = useState({
    isDragging: false,
    dragType: null, // 'event' | 'timeline'
    draggedItem: null,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    targetTimeline: null,
  });

  const longPressTimer = useRef(null);
  const dragStarted = useRef(false);

  // 長押し開始
  const handleMouseDown = useCallback((e, itemType, item) => {
    e.preventDefault();
    e.stopPropagation();

    const startPos = {
      x: e.clientX,
      y: e.clientY,
    };

    // 300msに短縮
    longPressTimer.current = setTimeout(() => {
      setDragState({
        isDragging: true,
        dragType: itemType,
        draggedItem: item,
        startPosition: startPos,
        currentPosition: startPos,
        targetTimeline: null,
      });
      dragStarted.current = true;

      // ドラッグ中のカーソル変更
      document.body.style.cursor = "grabbing";
      console.log(`300ms長押し完了: "${item?.title || 'アイテム'}" のドラッグ開始`);
    }, 300); // 300msの長押し

    // マウスが動いたら長押しをキャンセル（閾値を5pxに設定）
    const handleEarlyMove = (moveEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - startPos.x);
      const deltaY = Math.abs(moveEvent.clientY - startPos.y);

      if (deltaX > 5 || deltaY > 5) {
        clearTimeout(longPressTimer.current);
        document.removeEventListener("mousemove", handleEarlyMove);
        console.log("早期移動検出: 長押しキャンセル");
      }
    };

    document.addEventListener("mousemove", handleEarlyMove);

    // マウスアップで長押しをキャンセル
    const handleEarlyUp = () => {
      clearTimeout(longPressTimer.current);
      document.removeEventListener("mousemove", handleEarlyMove);
      document.removeEventListener("mouseup", handleEarlyUp);
    };

    document.addEventListener("mouseup", handleEarlyUp);
  }, []);

  // ドラッグ中のマウス移動（縦方向制限強化）
  const handleMouseMove = useCallback(
    (e) => {
      if (!dragState.isDragging) return;

      // 縦方向のみの移動に厳格に制限
      const verticalDelta = e.clientY - dragState.startPosition.y;
      
      // 横方向の移動を完全に無視
      const constrainedPosition = {
        x: dragState.startPosition.x, // X座標は開始位置で完全固定
        y: dragState.startPosition.y + verticalDelta, // Y座標のみ変更
      };

      setDragState((prev) => ({
        ...prev,
        currentPosition: constrainedPosition,
      }));

      // デバッグ用（縦移動量）
      if (Math.abs(verticalDelta) > 10) { // 10px以上移動した時のみログ
        console.log(`縦方向ドラッグ: Y移動量=${verticalDelta.toFixed(0)}px`);
      }
    },
    [dragState.isDragging, dragState.startPosition]
  );

  // ドロップ処理（年表判定の精度向上）
  const handleMouseUp = useCallback(
    (e, timelineAxes, eventPositions) => {
      if (!dragState.isDragging) return;

      const dropY = e.clientY;
      let targetTimeline = null;

      console.log(`ドロップ処理開始: Y=${dropY}`);

      // 年表との重なりをチェック（判定精度向上）
      if (timelineAxes) {
        targetTimeline = timelineAxes.find((axis) => {
          // ヘッダー高さを考慮した年表軸の実際の画面座標
          const headerHeight = 64;
          const adjustedAxisY = axis.yPosition + headerHeight;

          // 判定範囲を年表軸の上下40pxに設定（従来の60px→40pxに縮小）
          const axisRect = {
            top: adjustedAxisY - 40,
            bottom: adjustedAxisY + 40,
          };

          const isInRange = dropY >= axisRect.top && dropY <= axisRect.bottom;
          
          console.log(
            `年表判定 "${axis.name}": 軸Y=${adjustedAxisY}, 範囲=${axisRect.top}-${axisRect.bottom}, ドロップY=${dropY}, 判定=${isInRange}`
          );
          
          return isInRange;
        });
      }

      if (dragState.dragType === "event") {
        if (targetTimeline) {
          // 年表に仮登録（年表エリアでのドロップを優先）
          console.log(
            `仮登録実行: イベント「${dragState.draggedItem.title}」を年表「${targetTimeline.name}」に仮登録`
          );
          onEventAddToTimeline(dragState.draggedItem, targetTimeline.id);
        } else {
          // 年表エリア外への ドロップ
          if (dragState.draggedItem.timelineInfos && dragState.draggedItem.timelineInfos.length > 0) {
            // 年表に属するイベントが年表エリア外にドロップされた場合は仮削除
            console.log(
              `仮削除実行: イベント「${dragState.draggedItem.title}」を仮削除状態に変更`
            );
            onEventRemoveFromTimeline(
              dragState.draggedItem.timelineInfos[0]?.timelineId,
              dragState.draggedItem.id
            );
          } else if (dragState.draggedItem.timelineId) {
            // 従来のtimelineId形式との互換性
            console.log(
              `従来形式仮削除: イベント「${dragState.draggedItem.title}」を年表「${dragState.draggedItem.timelineName}」から仮削除`
            );
            onEventRemoveFromTimeline(
              dragState.draggedItem.timelineId,
              dragState.draggedItem.id
            );
          } else {
            // メインタイムラインでの位置調整
            console.log("メインタイムラインでの位置調整");
            const targetY =
              dropY -
              dragState.startPosition.y +
              dragState.draggedItem.adjustedPosition.y;

            const conflictingEvents = eventPositions?.filter(
              (pos) =>
                pos.id !== dragState.draggedItem.id &&
                !pos.timelineId &&
                Math.abs(pos.x - dragState.draggedItem.adjustedPosition.x) <
                  100 &&
                Math.abs(pos.y - targetY) < 50
            ) || [];

            onEventMove(dragState.draggedItem.id, targetY, conflictingEvents);
          }
        }
      }

      // ドラッグ状態をリセット
      setDragState({
        isDragging: false,
        dragType: null,
        draggedItem: null,
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        targetTimeline: null,
      });

      document.body.style.cursor = "default";
      dragStarted.current = false;
      console.log("ドラッグ処理完了");
    },
    [dragState, onEventMove, onTimelineMove, onEventAddToTimeline, onEventRemoveFromTimeline]
  );

  // ドラッグ中止
  const cancelDrag = useCallback(() => {
    clearTimeout(longPressTimer.current);
    setDragState({
      isDragging: false,
      dragType: null,
      draggedItem: null,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      targetTimeline: null,
    });
    document.body.style.cursor = "default";
    dragStarted.current = false;
    console.log("ドラッグキャンセル");
  }, []);

  return {
    dragState,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    cancelDrag,
    isDragging: dragState.isDragging,
  };
};