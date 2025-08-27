// src/components/common/Header.js
import React, { useState } from 'react';
import { usePageMode } from '../../contexts/PageModeContext';
import { APP_CONFIG } from '../../constants/appConfig';

const Header = ({ 
  user, 
  isAuthenticated, 
  onSignIn, 
  onSignOut,
  onMenuAction,
  isSaving = false 
}) => {
  const {
    currentPageMode,
    currentTab,
    currentFileName,
    changePageMode,
    changeTab,
    getAvailableTabs,
    getPageModeInfo,
    canUseFileOperations
  } = usePageMode();
  
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { isPersonalMode, isWikiMode, isMyPageMode } = getPageModeInfo();
  
  // ページモード切り替え
  const handlePageModeChange = (mode) => {
    changePageMode(mode);
  };
  
  // タブ切り替え
  const handleTabChange = (tabId) => {
    changeTab(tabId);
  };
  
  // メニューアクション
  const handleMenuAction = (actionId) => {
    if (onMenuAction) {
      onMenuAction(actionId);
    }
  };
  
  const styles = {
    header: {
      height: '64px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: '24px',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    
    // 左側: ロゴとファイル情報
    leftSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    logo: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1f2937',
      textDecoration: 'none'
    },
    fileInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      color: '#6b7280'
    },
    fileName: {
      fontWeight: '500',
      color: '#374151'
    },
    unsavedIndicator: {
      color: '#ef4444',
      fontWeight: 'bold'
    },
    
    // 中央: タブ切り替え
    centerSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      padding: '4px'
    },
    tab: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 16px',
      borderRadius: '4px',
      border: 'none',
      backgroundColor: 'transparent',
      color: '#6b7280',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      whiteSpace: 'nowrap'
    },
    tabActive: {
      backgroundColor: '#ffffff',
      color: '#1f2937',
      fontWeight: '500',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    },
    tabDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    
    // 右側: ページモード切り替えとユーザーメニュー
    rightSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginLeft: 'auto'
    },
    pageModeSwitch: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      backgroundColor: '#f3f4f6',
      borderRadius: '6px',
      padding: '2px'
    },
    pageModeButton: {
      padding: '6px 12px',
      borderRadius: '4px',
      border: 'none',
      backgroundColor: 'transparent',
      color: '#6b7280',
      fontSize: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontWeight: '500'
    },
    pageModeButtonActive: {
      backgroundColor: '#ffffff',
      color: '#1f2937',
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
    },
    
    // ユーザーメニュー
    userMenu: {
      position: 'relative'
    },
    userButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 12px',
      borderRadius: '6px',
      border: '1px solid #d1d5db',
      backgroundColor: '#ffffff',
      color: '#374151',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    loginButton: {
      backgroundColor: '#3b82f6',
      color: 'white',
      border: '1px solid #3b82f6'
    },
    dropdown: {
      position: 'absolute',
      top: '100%',
      right: 0,
      marginTop: '4px',
      minWidth: '200px',
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      zIndex: 1001,
      padding: '8px 0'
    },
    dropdownItem: {
      width: '100%',
      padding: '8px 16px',
      border: 'none',
      backgroundColor: 'transparent',
      color: '#374151',
      fontSize: '14px',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'background-color 0.2s'
    }
  };
  
  // 利用可能なタブを取得
  const availableTabs = getAvailableTabs();
  
  return (
    <header style={styles.header}>
      {/* 左側：ロゴとファイル情報 */}
      <div style={styles.leftSection}>
        <a href="#" style={styles.logo}>
          {APP_CONFIG.APP_NAME}
        </a>
        
        {/* ファイル情報 */}
        {!isMyPageMode && (
          <div style={styles.fileInfo}>
            {isPersonalMode && (
              <>
                <span style={styles.fileName}>
                  {currentFileName || 'SampleFile01'}
                </span>
                {!currentFileName && (
                  <span style={styles.unsavedIndicator}>*</span>
                )}
              </>
            )}
          </div>
        )}
      </div>
      
      {/* 中央：タブ切り替え */}
      {!isMyPageMode && (
        <div style={styles.centerSection}>
          {availableTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{
                ...styles.tab,
                ...(currentTab === tab.id ? styles.tabActive : {}),
                ...(!tab.availableInModes.includes(currentPageMode) ? styles.tabDisabled : {})
              }}
              disabled={!tab.availableInModes.includes(currentPageMode)}
              title={tab.label}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* 右側：ページモード切り替えとユーザーメニュー */}
      <div style={styles.rightSection}>
        {/* ページモード切り替え */}
        <div style={styles.pageModeSwitch}>
          <button
            onClick={() => handlePageModeChange(APP_CONFIG.PAGE_MODES.PERSONAL)}
            style={{
              ...styles.pageModeButton,
              ...(isPersonalMode ? styles.pageModeButtonActive : {})
            }}
          >
            個人
          </button>
          <button
            onClick={() => handlePageModeChange(APP_CONFIG.PAGE_MODES.WIKI)}
            style={{
              ...styles.pageModeButton,
              ...(isWikiMode ? styles.pageModeButtonActive : {})
            }}
          >
            Wiki
          </button>
        </div>
        
        {/* ユーザーメニュー */}
        <div style={styles.userMenu}>
          {isAuthenticated ? (
            <>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={styles.userButton}
              >
                <span>👤</span>
                <span>{user?.email?.split('@')[0] || 'User'}</span>
                <span>▼</span>
              </button>
              
              {userMenuOpen && (
                <div style={styles.dropdown}>
                  <button
                    onClick={() => {
                      handlePageModeChange(APP_CONFIG.PAGE_MODES.MYPAGE);
                      setUserMenuOpen(false);
                    }}
                    style={styles.dropdownItem}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    📂 マイページ
                  </button>
                  <button
                    onClick={() => {
                      onSignOut?.();
                      setUserMenuOpen(false);
                    }}
                    style={styles.dropdownItem}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    🚪 ログアウト
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={onSignIn}
              style={{...styles.userButton, ...styles.loginButton}}
            >
              <span>🔑</span>
              <span>Guest</span>
              <span>▼</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;