// src/constants/appConfig.js
export const APP_CONFIG = {
  APP_NAME: '#TL',
  FULL_APP_NAME: '#ハッシュタグ年表',
  
  // ページモード
  PAGE_MODES: {
    PERSONAL: 'personal',
    WIKI: 'wiki',
    MYPAGE: 'mypage'
  },
  
  // タブ定義
  TABS: {
    TIMELINE: {
      id: 'timeline',
      name: 'Timeline',
      label: '年表',
      icon: '📊',
      component: 'TimelineTab',
      availableInModes: ['personal', 'wiki']
    },
    NETWORK: {
      id: 'network',
      name: 'Network',
      label: 'ネットワーク',
      icon: '🕸️',
      component: 'NetworkTab',
      availableInModes: ['personal', 'wiki']
    },
    TABLE: {
      id: 'table',
      name: 'Table',
      label: 'テーブル',
      icon: '📋',
      component: 'TableTab',
      availableInModes: ['personal', 'wiki']
    },
    EVENT_EDIT: {
      id: 'event-edit',
      name: 'EventEdit',
      label: 'イベント編集',
      icon: '✏️',
      component: 'EventEditTab',
      availableInModes: ['personal', 'wiki']
    },
    REVISION: {
      id: 'revision',
      name: 'Revision',
      label: '更新',
      icon: '📝',
      component: 'RevisionTab',
      availableInModes: ['wiki'] // Wiki専用
    }
  },
  
  // デフォルトタブ（ページモード別）
  DEFAULT_TABS: {
    personal: 'timeline',
    wiki: 'timeline',
    mypage: null // マイページはタブなし
  },
  
  // メニュー構成
  MENUS: {
    FILE: {
      label: 'ファイル',
      items: [
        { id: 'new', label: '新規作成', shortcut: 'Ctrl+N', icon: '📄' },
        { id: 'open', label: '開く', shortcut: 'Ctrl+O', icon: '📂' },
        { id: 'save', label: '保存', shortcut: 'Ctrl+S', icon: '💾' },
        { id: 'save-as', label: '名前を付けて保存', icon: '💾' },
        { id: 'export', label: 'エクスポート', icon: '📤' },
        { id: 'import', label: 'インポート', icon: '📥' }
      ]
    },
    EDIT: {
      label: '編集',
      items: [
        { id: 'undo', label: '元に戻す', shortcut: 'Ctrl+Z', icon: '↶' },
        { id: 'redo', label: 'やり直し', shortcut: 'Ctrl+Y', icon: '↷' },
        { id: 'add-event', label: 'イベントを追加', icon: '➕' },
        { id: 'initial-position', label: '初期位置', icon: '🎯' }
      ]
    },
    HELP: {
      label: 'ヘルプ',
      items: [
        { id: 'getting-started', label: 'はじめかた', icon: '🚀' },
        { id: 'operations', label: '操作方法', icon: '📖' },
        { id: 'tips', label: 'ヒント', icon: '💡' },
        { id: 'feedback', label: 'フィードバック', icon: '💭' },
        { id: 'version', label: 'バージョン情報', icon: 'ℹ️' },
        { id: 'about', label: 'このアプリについて', icon: '📱' }
      ]
    }
  }
};

// ページモード別の利用可能タブを取得
export const getAvailableTabsForMode = (pageMode) => {
  return Object.values(APP_CONFIG.TABS).filter(tab => 
    tab.availableInModes.includes(pageMode)
  );
};

// タブがページモードで有効かチェック
export const isTabAvailableInMode = (tabId, pageMode) => {
  const tab = APP_CONFIG.TABS[tabId.toUpperCase().replace('-', '_')];
  return tab && tab.availableInModes.includes(pageMode);
};