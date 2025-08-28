// src/hooks/useTabSystem.js
import { useCallback, useMemo } from 'react';
import { usePageMode } from '../contexts/PageModeContext';
import { APP_CONFIG } from '../constants/appConfig';

/**
 * タブシステム管理フック
 * ページモードに応じたタブの表示・切り替え・状態管理
 */
export const useTabSystem = () => {
  const {
    currentPageMode,
    currentTab,
    changeTab,
    getAvailableTabs,
    getPageModeInfo
  } = usePageMode();

  const { isPersonalMode, isWikiMode, isMyPageMode } = getPageModeInfo();

  // 現在のタブ情報を取得
  const getCurrentTabInfo = useCallback(() => {
    if (!currentTab) return null;
    
    const tabInfo = Object.values(APP_CONFIG.TABS).find(tab => tab.id === currentTab);
    return tabInfo ? {
      ...tabInfo,
      isAvailable: tabInfo.availableInModes.includes(currentPageMode),
      isActive: true
    } : null;
  }, [currentTab, currentPageMode]);

  // タブの有効性チェック
  const isTabEnabled = useCallback((tabId) => {
    const tab = Object.values(APP_CONFIG.TABS).find(t => t.id === tabId);
    return tab && tab.availableInModes.includes(currentPageMode);
  }, [currentPageMode]);

  // タブ切り替え（検証付き）
  const switchTab = useCallback((tabId) => {
    if (!isTabEnabled(tabId)) {
      console.warn(`Tab ${tabId} is not available in ${currentPageMode} mode`);
      return false;
    }
    
    changeTab(tabId);
    console.log(`Tab switched to: ${tabId}`);
    return true;
  }, [isTabEnabled, currentPageMode, changeTab]);

  // 次/前のタブに移動
  const switchToNextTab = useCallback(() => {
    const availableTabs = getAvailableTabs();
    if (availableTabs.length === 0) return false;
    
    const currentIndex = availableTabs.findIndex(tab => tab.id === currentTab);
    const nextIndex = (currentIndex + 1) % availableTabs.length;
    const nextTab = availableTabs[nextIndex];
    
    if (nextTab) {
      changeTab(nextTab.id);
      return true;
    }
    return false;
  }, [currentTab, getAvailableTabs, changeTab]);

  const switchToPreviousTab = useCallback(() => {
    const availableTabs = getAvailableTabs();
    if (availableTabs.length === 0) return false;
    
    const currentIndex = availableTabs.findIndex(tab => tab.id === currentTab);
    const prevIndex = currentIndex === 0 ? availableTabs.length - 1 : currentIndex - 1;
    const prevTab = availableTabs[prevIndex];
    
    if (prevTab) {
      changeTab(prevTab.id);
      return true;
    }
    return false;
  }, [currentTab, getAvailableTabs, changeTab]);

  // 特定の機能へのショートカット
  const switchToTimelineTab = useCallback(() => {
    return switchTab('timeline');
  }, [switchTab]);

  const switchToNetworkTab = useCallback(() => {
    return switchTab('network');
  }, [switchTab]);

  const switchToTableTab = useCallback(() => {
    return switchTab('table');
  }, [switchTab]);

  const switchToEventEditTab = useCallback(() => {
    return switchTab('event-edit');
  }, [switchTab]);

  const switchToRevisionTab = useCallback(() => {
    if (!isWikiMode) {
      console.warn('Revision tab is only available in Wiki mode');
      return false;
    }
    return switchTab('revision');
  }, [isWikiMode, switchTab]);

  // タブの表示状態を取得
  const getTabDisplayState = useCallback((tabId) => {
    const isEnabled = isTabEnabled(tabId);
    const isActive = currentTab === tabId;
    
    return {
      isEnabled,
      isActive,
      isVisible: isEnabled, // 現在は有効なタブのみ表示
      className: [
        'tab',
        isActive ? 'tab-active' : '',
        !isEnabled ? 'tab-disabled' : ''
      ].filter(Boolean).join(' ')
    };
  }, [currentTab, isTabEnabled]);

  // ページモード別のタブリスト（メモ化）
  const availableTabsForCurrentMode = useMemo(() => {
    return getAvailableTabs().map(tab => ({
      ...tab,
      ...getTabDisplayState(tab.id)
    }));
  }, [getAvailableTabs, getTabDisplayState]);

  // キーボードショートカット処理
  const handleTabKeyboardShortcut = useCallback((event) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case '1':
          event.preventDefault();
          return switchToTimelineTab();
        case '2':
          event.preventDefault();
          return switchToNetworkTab();
        case '3':
          event.preventDefault();
          return switchToTableTab();
        case '4':
          event.preventDefault();
          return switchToEventEditTab();
        case '5':
          event.preventDefault();
          return switchToRevisionTab();
        case 'Tab':
          event.preventDefault();
          return event.shiftKey ? switchToPreviousTab() : switchToNextTab();
        default:
          return false;
      }
    }
    return false;
  }, [
    switchToTimelineTab,
    switchToNetworkTab,
    switchToTableTab,
    switchToEventEditTab,
    switchToRevisionTab,
    switchToNextTab,
    switchToPreviousTab
  ]);

  // タブ状態の統計情報
  const getTabStats = useCallback(() => {
    const allTabs = Object.values(APP_CONFIG.TABS);
    const enabledTabs = allTabs.filter(tab => isTabEnabled(tab.id));
    
    return {
      total: allTabs.length,
      available: enabledTabs.length,
      current: currentTab,
      mode: currentPageMode
    };
  }, [isTabEnabled, currentTab, currentPageMode]);

  return {
    // 現在の状態
    currentTab,
    currentPageMode,
    isPersonalMode,
    isWikiMode,
    isMyPageMode,
    
    // タブ情報
    getCurrentTabInfo,
    availableTabsForCurrentMode,
    getTabDisplayState,
    getTabStats,
    
    // タブ操作
    switchTab,
    switchToNextTab,
    switchToPreviousTab,
    
    // 機能別ショートカット
    switchToTimelineTab,
    switchToNetworkTab,
    switchToTableTab,
    switchToEventEditTab,
    switchToRevisionTab,
    
    // ユーティリティ
    isTabEnabled,
    handleTabKeyboardShortcut
  };
};