// src/hooks/useUndoRedo.js
import { useState, useCallback, useRef } from 'react';

export const useUndoRedo = (initialState, maxHistorySize = 50) => {
  const [currentState, setCurrentState] = useState(initialState);
  const [history, setHistory] = useState([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isInternalUpdate = useRef(false);

  // 新しい状態を履歴に追加
  const pushState = useCallback((newState, actionType = 'update') => {
    if (isInternalUpdate.current) {
      return;
    }

    setHistory(prevHistory => {
      // 現在の位置より後の履歴を削除（新しい操作をした場合）
      const newHistory = prevHistory.slice(0, currentIndex + 1);
      
      // 新しい状態を追加
      newHistory.push({
        state: JSON.parse(JSON.stringify(newState)), // ディープコピー
        actionType,
        timestamp: Date.now()
      });

      // 履歴サイズの制限
      if (newHistory.length > maxHistorySize) {
        return newHistory.slice(1);
      }

      return newHistory;
    });

    setCurrentIndex(prevIndex => {
      const newIndex = Math.min(prevIndex + 1, maxHistorySize - 1);
      return newIndex;
    });

    setCurrentState(newState);
  }, [currentIndex, maxHistorySize]);

  // Undo操作
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const previousState = history[newIndex];
      
      isInternalUpdate.current = true;
      setCurrentState(previousState.state || previousState);
      setCurrentIndex(newIndex);
      
      // 次のtickでフラグをリセット
      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 0);
    }
  }, [currentIndex, history]);

  // Redo操作
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      const nextState = history[newIndex];
      
      isInternalUpdate.current = true;
      setCurrentState(nextState.state || nextState);
      setCurrentIndex(newIndex);
      
      // 次のtickでフラグをリセット
      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 0);
    }
  }, [currentIndex, history]);

  // 現在の状態を更新（履歴に追加せずに）
  const updateState = useCallback((newState) => {
    isInternalUpdate.current = true;
    setCurrentState(newState);
    setTimeout(() => {
      isInternalUpdate.current = false;
    }, 0);
  }, []);

  // 履歴をリセット
  const resetHistory = useCallback((newInitialState) => {
    const initialState = newInitialState || currentState;
    setHistory([initialState]);
    setCurrentIndex(0);
    setCurrentState(initialState);
  }, [currentState]);

  return {
    state: currentState,
    pushState,
    undo,
    redo,
    updateState,
    resetHistory,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    historyLength: history.length,
    currentIndex
  };
};