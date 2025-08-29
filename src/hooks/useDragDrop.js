// src/hooks/useDragDrop.js - ドラッグ機能修正版（グローバルイベント管理改善）
import { useState, useCallback, useRef, useEffect } from "react";

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
  const mouseDownData = useRef(null); // マウスダウン時のデータを保持

  // グローバルマウス移動ハンドラー
  const handleGlobalMouseMove = useCallback((e) => {
    if (!dragState.isDragging) return;

    // 縦方向のみの移動に制限
    const verticalDelta = e.clientY - dragState.startPosition.y;
    
    const constrainedPosition = {
      x: dragState.startPosition.x, // X座標固定
      y: dragState.startPosition.y + verticalDelta, // Y座標のみ変更
    };

    setDragState((prev) => ({
      ...prev,
      currentPosition: constrainedPosition,
    }));

    // デバッグログ（10px以上移動時のみ）
    if (Math.abs(verticalDelta) > 10) {
      console.log(`ドラッグ中: Y移動量=${verticalDelta.toFixed(0)}px`);
    }
  }, [dragState.isDragging, dragState.startPosition]);

  // グローバルマウスアップハンドラー
  const handleGlobalMouseUp = useCallback((e, timelineAxes, eventPositions) => {
    // 長押しタイマーをクリア
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // ドラッグ中でなければ早期リターン
    if (!dragState.isDragging) {
      console.log("ドラッグ中でない状態でマウスアップ");
      return;
    }

    const dropY = e.clientY;
    let targetTimeline = null;

    console.log(`ドロップ処理開始: Y=${dropY}, ドラッグ中=${dragState.isDragging}`);

    // 年表との重なりをチェック（判定精度向上）
    if (timelineAxes) {
      targetTimeline = timelineAxes.find((axis) => {
        const headerHeight = 64;
        const adjustedAxisY = axis.yPosition + headerHeight;
        
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
        // 年表に仮登録
        console.log(
          `仮登録実行: イベント「${dragState.draggedItem.title}」を年表「${targetTimeline.name}」に仮登録`
        );
        onEventAddToTimeline(dragState.draggedItem, targetTimeline.id);
      } else {
        // 年表エリア外へのドロップ
        if (dragState.draggedItem.timelineInfos && dragState.draggedItem.timelineInfos.length > 0) {
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
              Math.abs(pos.x - dragState.draggedItem.adjustedPosition.x) < 100 &&
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
    mouseDownData.current = null;
    console.log("ドラッグ処理完了");
  }, [
    dragState,
    onEventMove,
    onTimelineMove,
    onEventAddToTimeline,
    onEventRemoveFromTimeline,
  ]);

  // グローバルイベントリスナーの管理
  useEffect(() => {
    if (dragState.isDragging) {
      console.log("グローバルドラッグイベントリスナー設定");
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", (e) => handleGlobalMouseUp(e, mouseDownData.current?.timelineAxes));
      
      // ドラッグ中はテキスト選択を無効化
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "default";
    };
  }, [dragState.isDragging, handleGlobalMouseMove, handleGlobalMouseUp]);

  // 長押し開始（改善版）
  const handleMouseDown = useCallback((e, itemType, item) => {
    e.preventDefault();
    e.stopPropagation();

    const startPos = {
      x: e.clientX,
      y: e.clientY,
    };

    // マウスダウンデータを保存（グローバルハンドラーで参照）
    mouseDownData.current = {
      itemType,
      item,
      startPos,
      timelineAxes: null, // 後でVisualTabから設定される
    };

    console.log(`マウスダウン開始: "${item?.title || 'アイテム'}" (300ms長押し待機中)`);

    // 300ms長押しタイマー
    longPressTimer.current = setTimeout(() => {
      console.log(`300ms長押し完了: "${item?.title || 'アイテム'}" のドラッグ開始`);
      
      setDragState({
        isDragging: true,
        dragType: itemType,
        draggedItem: item,
        startPosition: startPos,
        currentPosition: startPos,
        targetTimeline: null,
      });
      
      dragStarted.current = true;
    }, 300);

    // 早期移動検出（5px閾値）
    const handleEarlyMove = (moveEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - startPos.x);
      const deltaY = Math.abs(moveEvent.clientY - startPos.y);

      if (deltaX > 5 || deltaY > 5) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
        document.removeEventListener("mousemove", handleEarlyMove);
        document.removeEventListener("mouseup", handleEarlyUp);
        console.log("早期移動検出: 長押しキャンセル");
      }
    };

    // 早期アップ検出
    const handleEarlyUp = () => {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      document.removeEventListener("mousemove", handleEarlyMove);
      document.removeEventListener("mouseup", handleEarlyUp);
      console.log("早期マウスアップ: 長押しキャンセル");
    };

    // 長押し判定期間中のリスナー設定
    document.addEventListener("mousemove", handleEarlyMove);
    document.addEventListener("mouseup", handleEarlyUp);
  }, []);

  // ドラッグ中止（改善版）
  const cancelDrag = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

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
    mouseDownData.current = null;
    console.log("ドラッグキャンセル");
  }, []);

  // 外部からtimelineAxesを設定する関数
  const setTimelineAxes = useCallback((axes) => {
    if (mouseDownData.current) {
      mouseDownData.current.timelineAxes = axes;
    }
  }, []);

  return {
    dragState,
    handleMouseDown,
    handleMouseMove: handleGlobalMouseMove, // 互換性のため
    handleMouseUp: handleGlobalMouseUp, // 互換性のため
    cancelDrag,
    isDragging: dragState.isDragging,
    setTimelineAxes, // 新規追加
  };
};