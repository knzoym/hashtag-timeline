// src/components/common/Header.js - メニューシステム実装版
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
  } = usePageMode();
  
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  
  // 修正: 関数として呼び出してからオブジェクト分割代入
  const { isPersonalMode, isWikiMode, isMyPageMode } = getPageModeInfo();
  
  // レンダリング毎にランダムロゴを選択
  const randomLogo = useMemo(() => {
    const logos = [
      { src: logoJP, alt: 'TL Logo JP', name: 'logoJP' },
      { src: logoLong, alt: 'TL Logo Long', name: 'logoLong' },
      { src: logoShort, alt: 'TL Logo Short', name: 'logoShort' }
    ];
    
    const randomIndex = Math.floor(Math.random() * logos.length);
    return logos[randomIndex];
  }, []);
  
  // メニュー項目の定義
  const fileMenuItems = [
    { id: 'new', label: '新規作成', icon: '📄', availableInModes: ['personal'], disabled: false },
    { id: 'open', label: '開く', icon: '📂', availableInModes: ['personal'], disabled: !isAuthenticated },
    { id: 'save', label: '保存', icon: '💾', availableInModes: ['personal'], disabled: !isAuthenticated || isMyPageMode },
    { id: 'save-as', label: '名前を付けて保存', icon: '💾', availableInModes: ['personal'], disabled: !isAuthenticated || isMyPageMode },
    { id: 'separator1', type: 'separator' },
    { id: 'export', label: 'エクスポート', icon: '📤', availableInModes: ['personal', 'wiki'], disabled: false },
    { id: 'import', label: 'インポート', icon: '📥', availableInModes: ['personal'], disabled: false },
  ];

  const editMenuItems = [
    { id: 'undo', label: '取り消し', icon: '↶', shortcut: 'Ctrl+Z', availableInModes: ['personal', 'wiki'], disabled: false },
    { id: 'redo', label: 'やり直し', icon: '↷', shortcut: 'Ctrl+Y', availableInModes: ['personal', 'wiki'], disabled: false },
    { id: 'separator1', type: 'separator' },
    { id: 'add-event', label: 'イベントを追加', icon: '➕', availableInModes: ['personal', 'wiki'], disabled: false },
    { id: 'separator2', type: 'separator' },
    { id: 'reset-view', label: '初期位置', icon: '🎯', availableInModes: ['personal', 'wiki'], availableInTabs: ['timeline', 'network'], disabled: false },
  ];

  const helpMenuItems = [
    { id: 'getting-started', label: 'はじめかた', icon: '🚀', availableInModes: ['personal', 'wiki', 'mypage'], disabled: false },
    { id: 'how-to-use', label: '操作方法', icon: '❓', availableInModes: ['personal', 'wiki', 'mypage'], disabled: false },
    { id: 'tips', label: 'ヒント', icon: '💡', availableInModes: ['personal', 'wiki', 'mypage'], disabled: false },
    { id: 'separator1', type: 'separator' },
    { id: 'feedback', label: 'フィードバック', icon: '📝', availableInModes: ['personal', 'wiki', 'mypage'], disabled: false },
    { id: 'separator2', type: 'separator' },
    { id: 'version', label: 'バージョン情報', icon: 'ℹ️', availableInModes: ['personal', 'wiki', 'mypage'], disabled: false },
    { id: 'about', label: 'このアプリについて', icon: '📖', availableInModes: ['personal', 'wiki', 'mypage'], disabled: false },
  ];
  
  // ページモード切り替え
  const handlePageModeChange = (mode) => {
    // メニューを閉じる
    setFileMenuOpen(false);
    setEditMenuOpen(false);
    setHelpMenuOpen(false);
    setUserMenuOpen(false);
    
    changePageMode(mode);
  };
  
  // タブ切り替え
  const handleTabChange = (tabId) => {
    changeTab(tabId);
  };
  
  // メニューアクション
  const handleMenuAction = (actionId) => {
    // メニューを閉じる
    setFileMenuOpen(false);
    setEditMenuOpen(false);
    setHelpMenuOpen(false);
    
    if (onMenuAction) {
      onMenuAction(actionId);
    }
  };

  // ログアウト処理の修正
  const handleSignOut = () => {
    setUserMenuOpen(false);
    
    // 安全にログアウト処理を実行
    try {
      if (onSignOut) {
        onSignOut();
      }
    } catch (error) {
      console.error('ログアウト処理エラー:', error);
    }
  };
  
  // メニュー項目がモードで利用可能かチェック
  const isMenuItemAvailable = (item) => {
    if (item.type === 'separator') return true;
    
    const modeAvailable = !item.availableInModes || item.availableInModes.includes(currentPageMode);
    const tabAvailable = !item.availableInTabs || item.availableInTabs.includes(currentTab);
    
    return modeAvailable && tabAvailable;
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
    
    // 左側: ロゴとメニュー
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
      height: '36px',
      width: 'auto',
      objectFit: 'contain',
      transition: 'opacity 0.2s'
    },
    
    // メニューバー
    menuBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    menuButton: {
      padding: '6px 12px',
      borderRadius: '4px',
      border: 'none',
      backgroundColor: 'transparent',
      color: '#374151',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      position: 'relative'
    },
    menuButtonHover: {
      backgroundColor: '#f3f4f6'
    },
    menuButtonActive: {
      backgroundColor: '#e5e7eb'
    },
    
    // ファイル情報
    fileInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      color: '#6b7280',
      marginLeft: '16px'
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
      padding: '4px',
      marginLeft: 'auto'
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
      gap: '16px'
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
    
    // ドロップダウン共通スタイル
    dropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      marginTop: '4px',
      minWidth: '180px',
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      zIndex: 1001,
      padding: '4px 0'
    },
    userDropdown: {
      right: 0,
      left: 'auto'
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
      transition: 'background-color 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    dropdownItemDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    dropdownSeparator: {
      height: '1px',
      backgroundColor: '#e5e7eb',
      margin: '4px 0'
    },
    shortcut: {
      marginLeft: 'auto',
      fontSize: '12px',
      color: '#6b7280'
    }
  };
  
  // 利用可能なタブを取得
  const availableTabs = getAvailableTabs();
  
  // メニュードロップダウンコンポーネント
  const MenuDropdown = ({ items, isOpen, style = {} }) => {
    if (!isOpen) return null;
    
    return (
      <div style={{ ...styles.dropdown, ...style }}>
        {items.map((item, index) => {
          if (item.type === 'separator') {
            return <div key={item.id || index} style={styles.dropdownSeparator} />;
          }
          
          const isAvailable = isMenuItemAvailable(item);
          const isDisabled = item.disabled || !isAvailable;
          
          if (!isAvailable) return null;
          
          return (
            <button
              key={item.id}
              style={{
                ...styles.dropdownItem,
                ...(isDisabled ? styles.dropdownItemDisabled : {})
              }}
              onClick={() => !isDisabled && handleMenuAction(item.id)}
              onMouseEnter={(e) => !isDisabled && (e.target.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={(e) => !isDisabled && (e.target.style.backgroundColor = 'transparent')}
              disabled={isDisabled}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.shortcut && (
                <span style={styles.shortcut}>{item.shortcut}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  };
  
  return (
    <header style={styles.header}>
      {/* 左側：ロゴとメニューバー */}
      <div style={styles.leftSection}>
        {/* ランダムロゴ表示 */}
        <a 
          href="#" 
          style={styles.logoLink}
          onClick={(e) => {
            e.preventDefault();
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
              console.error('ロゴ画像の読み込みに失敗:', randomLogo.name);
              e.target.style.display = 'none';
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
        
        {/* メニューバー */}
        <div style={styles.menuBar}>
          {/* ファイルメニュー */}
          <div style={{ position: 'relative' }}>
            <button
              style={{
                ...styles.menuButton,
                ...(fileMenuOpen ? styles.menuButtonActive : {})
              }}
              onClick={() => {
                setFileMenuOpen(!fileMenuOpen);
                setEditMenuOpen(false);
                setHelpMenuOpen(false);
              }}
              onMouseEnter={(e) => !fileMenuOpen && (e.target.style.backgroundColor = styles.menuButtonHover.backgroundColor)}
              onMouseLeave={(e) => !fileMenuOpen && (e.target.style.backgroundColor = 'transparent')}
            >
              ファイル
            </button>
            <MenuDropdown items={fileMenuItems} isOpen={fileMenuOpen} />
          </div>

          {/* 編集メニュー */}
          <div style={{ position: 'relative' }}>
            <button
              style={{
                ...styles.menuButton,
                ...(editMenuOpen ? styles.menuButtonActive : {})
              }}
              onClick={() => {
                setEditMenuOpen(!editMenuOpen);
                setFileMenuOpen(false);
                setHelpMenuOpen(false);
              }}
              onMouseEnter={(e) => !editMenuOpen && (e.target.style.backgroundColor = styles.menuButtonHover.backgroundColor)}
              onMouseLeave={(e) => !editMenuOpen && (e.target.style.backgroundColor = 'transparent')}
            >
              編集
            </button>
            <MenuDropdown items={editMenuItems} isOpen={editMenuOpen} />
          </div>

          {/* ヘルプメニュー */}
          <div style={{ position: 'relative' }}>
            <button
              style={{
                ...styles.menuButton,
                ...(helpMenuOpen ? styles.menuButtonActive : {})
              }}
              onClick={() => {
                setHelpMenuOpen(!helpMenuOpen);
                setFileMenuOpen(false);
                setEditMenuOpen(false);
              }}
              onMouseEnter={(e) => !helpMenuOpen && (e.target.style.backgroundColor = styles.menuButtonHover.backgroundColor)}
              onMouseLeave={(e) => !helpMenuOpen && (e.target.style.backgroundColor = 'transparent')}
            >
              ヘルプ
            </button>
            <MenuDropdown items={helpMenuItems} isOpen={helpMenuOpen} />
          </div>
        </div>
        
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
                <div style={{ ...styles.dropdown, ...styles.userDropdown }}>
                  <button
                    style={styles.dropdownItem}
                    onClick={() => {
                      setUserMenuOpen(false);
                      handlePageModeChange(APP_CONFIG.PAGE_MODES.MYPAGE);
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <span>📂</span>
                    <span>マイページ</span>
                  </button>
                  <button
                    style={styles.dropdownItem}
                    onClick={handleSignOut}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <span>🚪</span>
                    <span>ログアウト</span>
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
      
      {/* メニュー外側クリック時の処理 */}
      {(userMenuOpen || fileMenuOpen || editMenuOpen || helpMenuOpen) && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000
          }}
          onClick={() => {
            setUserMenuOpen(false);
            setFileMenuOpen(false);
            setEditMenuOpen(false);
            setHelpMenuOpen(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;