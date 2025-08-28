// src/components/common/Header.js - getPageModeInfo修正版
import React, { useState, useMemo } from 'react';
import { usePageMode } from '../../contexts/PageModeContext';
import { APP_CONFIG } from '../../constants/appConfig';

// ロゴ画像をインポート
import logoJP from '../../assets/logoJP.png';
import logoLong from '../../assets/logoLong.png';
import logoShort from '../../assets/logoShort.png';

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
  const { isPersonalMode, isWikiMode, isMyPageMode } = getPageModeInfo; // 関数呼び出しを削除
  
  // レンダリング毎にランダムロゴを選択
  const randomLogo = useMemo(() => {
    const logos = [
      { src: logoJP, alt: 'TL Logo JP', name: 'logoJP' },
      { src: logoLong, alt: 'TL Logo Long', name: 'logoLong' },
      { src: logoShort, alt: 'TL Logo Short', name: 'logoShort' }
    ];
    
    const randomIndex = Math.floor(Math.random() * logos.length);
    return logos[randomIndex];
  }, []); // 空の依存配列でコンポーネントマウント時のみ実行
  
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
    logoLink: {
      display: 'flex',
      alignItems: 'center',
      textDecoration: 'none',
      cursor: 'pointer',
      transition: 'opacity 0.2s'
    },
    logoImage: {
      height: '36px', // ヘッダー内で適切なサイズ
      width: 'auto',
      objectFit: 'contain',
      transition: 'opacity 0.2s'
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
  const availableTabs = getAvailableTabs;
  
  return (
    <header style={styles.header}>
      {/* 左側：ロゴとファイル情報 */}
      <div style={styles.leftSection}>
        {/* ランダムロゴ表示 */}
        <a 
          href="#" 
          style={styles.logoLink}
          onClick={(e) => {
            e.preventDefault();
            // ロゴクリック時の処理（必要に応じて）
            console.log(`現在のロゴ: ${randomLogo.name}`);
          }}
          onMouseEnter={(e) => {
            e.target.style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            e.target.style.opacity = '1';
          }}
          title={`${APP_CONFIG.FULL_APP_NAME} (${randomLogo.name})`}
        >
          <img
            src={randomLogo.src}
            alt={randomLogo.alt}
            style={styles.logoImage}
            onError={(e) => {
              // 画像読み込みエラー時のフォールバック
              console.error('ロゴ画像の読み込みに失敗:', randomLogo.name);
              e.target.style.display = 'none';
              // フォールバックテキストを表示
              e.target.parentNode.innerHTML = `
                <span style="
                  font-size: 24px; 
                  font-weight: bold; 
                  color: #1f2937;
                  text-decoration: none;
                ">
                  ${APP_CONFIG.APP_NAME}
                </span>
              `;
            }}
          />
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
          <button
            onClick={() => handlePageModeChange(APP_CONFIG.PAGE_MODES.MYPAGE)}
            style={{
              ...styles.pageModeButton,
              ...(isMyPageMode ? styles.pageModeButtonActive : {})
            }}
          >
            マイページ
          </button>
        </div>
        
        {/* ユーザーメニュー */}
        <div style={styles.userMenu}>
          {isAuthenticated && user ? (
            <>
              <button
                style={styles.userButton}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
              >
                <span>👤</span>
                <span>{user.email || user.name || 'ユーザー'}</span>
                <span>▼</span>
              </button>
              
              {userMenuOpen && (
                <div style={styles.dropdown}>
                  <button
                    style={styles.dropdownItem}
                    onClick={() => {
                      setUserMenuOpen(false);
                      handlePageModeChange(APP_CONFIG.PAGE_MODES.MYPAGE);
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    📂 マイページ
                  </button>
                  <button
                    style={styles.dropdownItem}
                    onClick={() => {
                      setUserMenuOpen(false);
                      if (onSignOut) onSignOut();
                    }}
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
              style={{...styles.userButton, ...styles.loginButton}}
              onClick={onSignIn}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
            >
              <span>🔑</span>
              <span>ログイン</span>
            </button>
          )}
        </div>
      </div>
      
      {/* 保存状態インジケーター */}
      {isSaving && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(59, 130, 246, 0.9)',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '16px',
          fontSize: '12px',
          fontWeight: '500',
          zIndex: 1002
        }}>
          💾 保存中...
        </div>
      )}
      
      {/* ドロップダウン外側クリック時の処理 */}
      {userMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000
          }}
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;