// src/components/common/PageMode.js
import React from 'react';
import { usePageMode } from '../../contexts/PageModeContext';
import { APP_CONFIG } from '../../constants/appConfig';

/**
 * ページモード切り替えコンポーネント
 * Header.jsで使用される独立したモード切り替えUI
 */
const PageMode = ({ 
  style = {},
  size = 'medium' // 'small' | 'medium' | 'large'
}) => {
  const { 
    currentPageMode, 
    changePageMode, 
    getPageModeInfo 
  } = usePageMode();

  const { isPersonalMode, isWikiMode, isMyPageMode } = getPageModeInfo();

  // サイズ設定
  const sizeConfig = {
    small: {
      padding: '4px 8px',
      fontSize: '11px',
      gap: '2px'
    },
    medium: {
      padding: '6px 12px',
      fontSize: '12px',
      gap: '4px'
    },
    large: {
      padding: '8px 16px',
      fontSize: '14px',
      gap: '6px'
    }
  };

  const currentSizeConfig = sizeConfig[size] || sizeConfig.medium;

  const styles = {
    container: {
      display: 'flex',
      alignItems: 'center',
      gap: currentSizeConfig.gap,
      backgroundColor: '#f3f4f6',
      borderRadius: '6px',
      padding: '2px',
      ...style
    },
    
    modeButton: {
      padding: currentSizeConfig.padding,
      borderRadius: '4px',
      border: 'none',
      backgroundColor: 'transparent',
      color: '#6b7280',
      fontSize: currentSizeConfig.fontSize,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontWeight: '500',
      whiteSpace: 'nowrap'
    },
    
    modeButtonActive: {
      backgroundColor: '#ffffff',
      color: '#1f2937',
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
    },

    modeButtonHover: {
      backgroundColor: '#e5e7eb'
    }
  };

  const handleModeChange = (mode) => {
    if (mode !== currentPageMode) {
      changePageMode(mode);
    }
  };

  const handleMouseEnter = (e, isActive) => {
    if (!isActive) {
      e.target.style.backgroundColor = styles.modeButtonHover.backgroundColor;
    }
  };

  const handleMouseLeave = (e, isActive) => {
    if (!isActive) {
      e.target.style.backgroundColor = 'transparent';
    }
  };

  return (
    <div style={styles.container}>
      {/* 個人モード */}
      <button
        onClick={() => handleModeChange(APP_CONFIG.PAGE_MODES.PERSONAL)}
        style={{
          ...styles.modeButton,
          ...(isPersonalMode ? styles.modeButtonActive : {})
        }}
        onMouseEnter={(e) => handleMouseEnter(e, isPersonalMode)}
        onMouseLeave={(e) => handleMouseLeave(e, isPersonalMode)}
        title="個人ファイル管理モード"
      >
        個人
      </button>

      {/* Wikiモード */}
      <button
        onClick={() => handleModeChange(APP_CONFIG.PAGE_MODES.WIKI)}
        style={{
          ...styles.modeButton,
          ...(isWikiMode ? styles.modeButtonActive : {})
        }}
        onMouseEnter={(e) => handleMouseEnter(e, isWikiMode)}
        onMouseLeave={(e) => handleMouseLeave(e, isWikiMode)}
        title="TLwiki共有モード"
      >
        Wiki
      </button>

      {/* マイページモード */}
      <button
        onClick={() => handleModeChange(APP_CONFIG.PAGE_MODES.MYPAGE)}
        style={{
          ...styles.modeButton,
          ...(isMyPageMode ? styles.modeButtonActive : {})
        }}
        onMouseEnter={(e) => handleMouseEnter(e, isMyPageMode)}
        onMouseLeave={(e) => handleMouseLeave(e, isMyPageMode)}
        title="保存ファイル管理ページ"
      >
        マイページ
      </button>
    </div>
  );
};

/**
 * ページモード情報を表示するインジケーターコンポーネント
 */
export const PageModeIndicator = ({ 
  showIcon = true,
  showText = true,
  style = {} 
}) => {
  const { getPageModeInfo } = usePageMode();
  const { isPersonalMode, isWikiMode, isMyPageMode, currentPageMode } = getPageModeInfo();

  const modeConfig = {
    [APP_CONFIG.PAGE_MODES.PERSONAL]: {
      icon: '👤',
      label: '個人',
      color: '#10b981',
      bgColor: '#d1fae5'
    },
    [APP_CONFIG.PAGE_MODES.WIKI]: {
      icon: '📚',
      label: 'Wiki',
      color: '#3b82f6',
      bgColor: '#dbeafe'
    },
    [APP_CONFIG.PAGE_MODES.MYPAGE]: {
      icon: '📂',
      label: 'マイページ',
      color: '#8b5cf6',
      bgColor: '#ede9fe'
    }
  };

  const config = modeConfig[currentPageMode];
  if (!config) return null;

  const indicatorStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 8px',
    backgroundColor: config.bgColor,
    color: config.color,
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    ...style
  };

  return (
    <div style={indicatorStyles}>
      {showIcon && <span>{config.icon}</span>}
      {showText && <span>{config.label}</span>}
    </div>
  );
};

/**
 * ページモード別の権限チェック用ヘルパーコンポーネント
 */
export const PageModeGuard = ({ 
  allowedModes = [], 
  children, 
  fallback = null 
}) => {
  const { currentPageMode } = usePageMode();

  if (!allowedModes.includes(currentPageMode)) {
    return fallback || (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#6b7280',
        backgroundColor: '#f9fafb',
        borderRadius: '8px'
      }}>
        この機能は{allowedModes.join('・')}モードでのみ利用できます
      </div>
    );
  }

  return children;
};

export default PageMode;