// src/contexts/PageModeContext.js - getPageModeInfo完全修正版
import React, { createContext, useContext, useState, useCallback } from 'react';
import { APP_CONFIG } from '../constants/appConfig';

const PageModeContext = createContext();

export const usePageMode = () => {
  const context = useContext(PageModeContext);
  if (!context) {
    throw new Error('usePageMode must be used within PageModeProvider');
  }
  return context;
};

export const PageModeProvider = ({ children }) => {
  // ページモード状態
  const [currentPageMode, setCurrentPageMode] = useState(APP_CONFIG.PAGE_MODES.PERSONAL);
  const [currentTab, setCurrentTab] = useState(APP_CONFIG.DEFAULT_TABS.personal);
  const [currentFileName, setCurrentFileName] = useState(null);
  
  // Wiki承認待ちイベント表示オプション
  const [showPendingEvents, setShowPendingEvents] = useState(false);
  
  // ページモード変更
  const changePageMode = useCallback((newMode) => {
    if (!Object.values(APP_CONFIG.PAGE_MODES).includes(newMode)) {
      console.warn(`Invalid page mode: ${newMode}`);
      return;
    }
    
    setCurrentPageMode(newMode);
    
    // デフォルトタブに切り替え
    const defaultTab = APP_CONFIG.DEFAULT_TABS[newMode];
    if (defaultTab) {
      setCurrentTab(defaultTab);
    }
    
    // マイページに切り替わった場合、ファイル名をクリア
    if (newMode === APP_CONFIG.PAGE_MODES.MYPAGE) {
      setCurrentTab(null);
    }
    
    console.log(`Page mode changed to: ${newMode}`);
  }, []);
  
  // タブ変更
  const changeTab = useCallback((newTab) => {
    // 現在のページモードでそのタブが利用可能かチェック
    const tab = Object.values(APP_CONFIG.TABS).find(t => t.id === newTab);
    if (!tab) {
      console.warn(`Invalid tab: ${newTab}`);
      return;
    }
    
    if (!tab.availableInModes.includes(currentPageMode)) {
      console.warn(`Tab ${newTab} is not available in ${currentPageMode} mode`);
      return;
    }
    
    setCurrentTab(newTab);
    console.log(`Tab changed to: ${newTab} in ${currentPageMode} mode`);
  }, [currentPageMode]);
  
  // ファイル名更新
  const updateFileName = useCallback((fileName) => {
    setCurrentFileName(fileName);
  }, []);
  
  // ページモード情報を取得 - 修正版（関数として実装）
  const getPageModeInfo = useCallback(() => {
    return {
      isPersonalMode: currentPageMode === APP_CONFIG.PAGE_MODES.PERSONAL,
      isWikiMode: currentPageMode === APP_CONFIG.PAGE_MODES.WIKI,
      isMyPageMode: currentPageMode === APP_CONFIG.PAGE_MODES.MYPAGE,
      currentPageMode,
      currentTab,
      currentFileName,
      showPendingEvents
    };
  }, [currentPageMode, currentTab, currentFileName, showPendingEvents]);
  
  // 利用可能なタブを取得
  const getAvailableTabs = useCallback(() => {
    return Object.values(APP_CONFIG.TABS).filter(tab => 
      tab.availableInModes.includes(currentPageMode)
    );
  }, [currentPageMode]);
  
  // Wiki専用: 承認待ちイベント表示切り替え
  const togglePendingEvents = useCallback(() => {
    if (currentPageMode === APP_CONFIG.PAGE_MODES.WIKI) {
      setShowPendingEvents(prev => !prev);
    }
  }, [currentPageMode]);
  
  // ファイル操作用のフラグ
  const canUseFileOperations = currentPageMode === APP_CONFIG.PAGE_MODES.PERSONAL;
  const canEditWiki = currentPageMode === APP_CONFIG.PAGE_MODES.WIKI;
  
  const value = {
    // 現在の状態
    currentPageMode,
    currentTab,
    currentFileName,
    showPendingEvents,
    
    // 状態変更関数
    changePageMode,
    changeTab,
    updateFileName,
    togglePendingEvents,
    
    // ヘルパー関数（関数として提供）
    getPageModeInfo,
    getAvailableTabs,
    
    // フラグ
    canUseFileOperations,
    canEditWiki,
    
    // 設定
    PAGE_MODES: APP_CONFIG.PAGE_MODES,
    TABS: APP_CONFIG.TABS
  };
  
  return (
    <PageModeContext.Provider value={value}>
      {children}
    </PageModeContext.Provider>
  );
};