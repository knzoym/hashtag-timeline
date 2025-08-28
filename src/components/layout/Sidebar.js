// src/components/layout/Sidebar.js
import React, { useState, useCallback } from 'react';
import logoImage from '../../assets/logo.png';

const Sidebar = ({ 
  isOpen, 
  onToggle, 
  onMenuItemClick,
  currentUser,
  isSaving,
  canSave,
  logoSrc,
  isWikiMode = false,
  currentPageMode = 'personal'
}) => {
  const [expandedSections, setExpandedSections] = useState(new Set(['ファイル内操作']));
  const [expandedSubmenus, setExpandedSubmenus] = useState(new Set());
  const [isHovering, setIsHovering] = useState(false);;

  const toggleSection = (section) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const toggleSubmenu = (itemId) => {
    const newExpanded = new Set(expandedSubmenus);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedSubmenus(newExpanded);
  };

  // メニューアイテム（既存の配列を動的生成版に変更）
  const menuItems = getMenuItems();
    {
      section: 'ファイル内操作',
      icon: '',
      items: [
        { 
          id: 'add-event', 
          label: 'イベントを追加', 
          icon: '➕',
          shortcut: 'ダブルクリック',
          disabled: isWikiMode
        },
        { 
          id: 'reset-view', 
          label: '表示を初期位置に', 
          icon: '🎯',
          shortcut: 'ヘッダーボタン'
        },
        { 
          id: 'sample-events', 
          label: 'サンプルイベント', 
          icon: '📌',
          disabled: isWikiMode,
          subItems: [
            { id: 'sample-architecture', label: '建築史イベント', icon: '🏛️' },
            { id: 'sample-history', label: '日本史イベント', icon: '🗾' },
            { id: 'sample-clear', label: 'サンプルをクリア', icon: '🗑️' }
          ]
        },
        { 
          id: 'clear-all', 
          label: 'すべてのデータをクリア', 
          icon: '🗑️',
          danger: true,
          disabled: isWikiMode
        }
      ]
    },
    {
      section: 'ファイル操作',
      icon: '',
      items: [
        { 
          id: 'new', 
          label: '新規作成', 
          icon: '📄', 
          shortcut: 'Ctrl+N',
          disabled: isWikiMode
        },
        { 
          id: 'open', 
          label: 'ファイルを開く', 
          icon: '📂', 
          shortcut: 'Ctrl+O',
          disabled: !currentUser || isWikiMode,
          tooltip: !currentUser ? 'ログインが必要です' : 
                   isWikiMode ? 'Wikiモードでは利用できません' : null
        },
        { 
          id: 'save', 
          label: '保存', 
          icon: '💾', 
          shortcut: 'Ctrl+S',
          disabled: !currentUser || !canSave || isSaving || isWikiMode,
          tooltip: !currentUser ? 'ログインが必要です' : 
                   isWikiMode ? 'Wikiモードでは利用できません' : null
        },
        { 
          id: 'save-as', 
          label: '名前を付けて保存', 
          icon: '💾', 
          disabled: !currentUser || !canSave || isWikiMode,
          tooltip: !currentUser ? 'ログインが必要です' : 
                   isWikiMode ? 'Wikiモードでは利用できません' : null
        },
        { 
          id: 'export', 
          label: 'エクスポート', 
          icon: '📤',
          disabled: isWikiMode,
          subItems: [
            { id: 'export-json', label: 'JSON形式で書き出し', icon: '{ }' },
            { id: 'export-csv', label: 'CSV形式で書き出し', icon: '📊' },
            { id: 'export-image', label: '画像として書き出し', icon: '🖼️' }
          ]
        },
        { 
          id: 'import', 
          label: 'インポート', 
          icon: '📥',
          disabled: isWikiMode,
          subItems: [
            { id: 'import-json', label: 'JSONファイル', icon: '{ }' },
            { id: 'import-csv', label: 'CSVファイル', icon: '📊' }
          ]
        }
      ]
    },
    {
      section: 'Wiki連携',
      icon: '🔄',
      items: [
        {
          id: 'sync-samples',
          label: 'サンプルをTLwikiに同期',
          icon: '📤',
          disabled: !currentUser,
          tooltip: !currentUser ? 'ログインが必要です' : 'ローカルサンプルをTLwikiに登録'
        },
        {
          id: 'import-wiki-search', 
          label: '検索結果を個人に追加',
          icon: '📥',
          disabled: !currentUser || !isWikiMode,
          tooltip: !currentUser ? 'ログインが必要です' : 
                   !isWikiMode ? 'Wikiモードでのみ利用可能' : '現在の検索結果を個人ファイルに追加'
        },
        {
          id: 'import-wiki-timeline',
          label: '表示年表を個人に追加',
          icon: '📋',
          disabled: !currentUser || !isWikiMode,
          tooltip: !currentUser ? 'ログインが必要です' : 
                   !isWikiMode ? 'Wikiモードでのみ利用可能' : '現在表示中の年表を個人ファイルに追加'
        }
      ]
    },
    {
      section: 'アカウント',
      icon: '',
      items: currentUser ? [
        { 
          id: 'mypage', 
          label: 'マイページ', 
          icon: '📂',
          shortcut: 'ヘッダーメニュー'
        },
        { 
          id: 'profile', 
          label: 'プロフィール設定', 
          icon: '⚙️'
        },
        { 
          id: 'logout', 
          label: 'ログアウト', 
          icon: '🚪',
          shortcut: 'ヘッダーメニュー'
        }
      ] : [
        { 
          id: 'login', 
          label: 'ログイン', 
          icon: '🔑',
          shortcut: 'ヘッダーボタン'
        },
        { 
          id: 'about-login', 
          label: 'ログインについて', 
          icon: 'ℹ️'
        }
      ]
    },
    {
      section: 'ヘルプ',
      icon: '',
      items: [
        { 
          id: 'shortcuts', 
          label: 'キーボードショートカット', 
          icon: '⌨️' 
        },
        { 
          id: 'usage-guide', 
          label: '使い方ガイド', 
          icon: '📖' 
        },
        { 
          id: 'tips', 
          label: '便利な使い方', 
          icon: '💡' 
        },
        { 
          id: 'feedback', 
          label: 'フィードバックを送る', 
          icon: '💭' 
        },
        { 
          id: 'version', 
          label: 'バージョン情報', 
          icon: 'ℹ️' 
        },
        { 
          id: 'about', 
          label: 'このアプリについて', 
          icon: '📱' 
        }
      ]
    }
  // メニューアイテム動的生成関数
  const getMenuItems = () => [

  const handleItemClick = (itemId, section) => {
    if (onMenuItemClick) {
      onMenuItemClick(itemId, section);
    }
  };

  const sidebarStyles = {
    // コンパクトサイドバー（常時表示）
    compactSidebar: {
      position: 'fixed',
      left: 0,
      top: 0,
      width: 60,
      height: '100vh',
      backgroundColor: '#f9fafb',
      borderRight: '1px solid #e5e7eb',
      zIndex: 101,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: '12px',
    },
    logoContainer: {
      width: 40,
      height: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      borderRadius: '8px',
      transition: 'all 0.2s',
      backgroundColor: isHovering ? '#e5e7eb' : 'transparent',
      position: 'relative',
    },
    logo: {
      width: 32,
      height: 32,
      objectFit: 'contain',
      transition: 'opacity 0.2s',
      opacity: isHovering ? 0 : 1,
    },
    menuIcon: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      opacity: isHovering ? 1 : 0,
      transition: 'opacity 0.2s',
    },
    // フルサイドバー
    fullSidebar: {
      position: 'fixed',
      left: isOpen ? 60 : -250,
      top: 0,
      width: 250,
      height: '100vh',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e5e7eb',
      transition: 'left 0.3s ease',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: isOpen ? '2px 0 8px rgba(0, 0, 0, 0.1)' : 'none',
    },
    headerSpace: {
      height: '64px',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: '16px',
      backgroundColor: '#f8fafc',
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      justifyContent: 'space-between'
    },
    modeIndicator: {
      fontSize: '12px',
      padding: '4px 8px',
      borderRadius: '12px',
      fontWeight: '500',
      marginRight: '12px'
    },
    content: {
      flex: 1,
      overflowY: 'auto',
      padding: '8px 0',
    },
    section: {
      marginBottom: '4px',
    },
    sectionHeader: {
      padding: '10px 16px',
      fontSize: '13px',
      fontWeight: '600',
      color: '#374151',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      userSelect: 'none',
      transition: 'background-color 0.2s',
      borderRadius: '0',
    },
    sectionIcon: {
      marginRight: '8px',
      fontSize: '16px',
    },
    chevron: {
      fontSize: '12px',
      transition: 'transform 0.2s',
    },
    menuItem: {
      padding: '8px 16px 8px 40px',
      fontSize: '13px',
      color: '#4b5563',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      transition: 'background-color 0.2s',
      userSelect: 'none',
      position: 'relative',
    },
    menuItemDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    menuItemDanger: {
      color: '#dc2626',
    },
    menuItemIcon: {
      marginRight: '10px',
      fontSize: '14px',
      width: '20px',
      textAlign: 'center',
    },
    menuItemLabel: {
      flex: 1,
    },
    shortcut: {
      fontSize: '10px',
      color: '#9ca3af',
      marginLeft: '8px',
      fontStyle: 'italic',
    },
    submenu: {
      backgroundColor: '#f9fafb',
      borderLeft: '3px solid #e5e7eb',
      marginLeft: '12px',
    },
    submenuItem: {
      padding: '6px 16px 6px 32px',
      fontSize: '12px',
      color: '#6b7280',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      transition: 'background-color 0.2s',
    },
    tooltip: {
      position: 'absolute',
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginLeft: '8px',
      padding: '4px 8px',
      backgroundColor: '#1f2937',
      color: 'white',
      fontSize: '11px',
      borderRadius: '4px',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      opacity: 0,
      transition: 'opacity 0.2s',
    },
    footer: {
      borderTop: '1px solid #e5e7eb',
      padding: '12px 16px',
      fontSize: '11px',
      color: '#9ca3af',
      backgroundColor: '#f9fafb',
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* コンパクトサイドバー */}
      <div style={sidebarStyles.compactSidebar}>
        <div
          style={sidebarStyles.logoContainer}
          onClick={onToggle}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          title={isOpen ? 'サイドバーを閉じる' : 'サイドバーを開く'}
        >
          <img src={logoSrc || logoImage} alt="Logo" style={sidebarStyles.logo} />
          <div style={sidebarStyles.menuIcon}>
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ color: '#4b5563' }}
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </div>
        </div>
      </div>

      {/* フルサイドバー */}
      <div style={sidebarStyles.fullSidebar}>
        <div style={sidebarStyles.headerSpace}>
          #ハッシュタグ年表
          
          {/* ページモード表示 */}
          <span style={{
            ...sidebarStyles.modeIndicator,
            backgroundColor: isWikiMode ? '#dbeafe' : '#ecfdf5',
            color: isWikiMode ? '#1d4ed8' : '#059669'
          }}>
            {isWikiMode ? '📚 Wiki' : '📁 個人'}
          </span>
        </div>
        
        <div style={sidebarStyles.content}>
          {menuItems.map(({ section, icon, items }) => (
            <div key={section} style={sidebarStyles.section}>
              <div
                style={sidebarStyles.sectionHeader}
                onClick={() => toggleSection(section)}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <div>
                  <span style={sidebarStyles.sectionIcon}>{icon}</span>
                  {section}
                </div>
                <span 
                  style={{
                    ...sidebarStyles.chevron,
                    transform: expandedSections.has(section) ? 'rotate(90deg)' : 'rotate(0deg)'
                  }}
                >
                  ▶
                </span>
              </div>
              
              {expandedSections.has(section) && (
                <div>
                  {items.map((item) => (
                    <div key={item.id}>
                      <div
                        style={{
                          ...sidebarStyles.menuItem,
                          ...(item.disabled ? sidebarStyles.menuItemDisabled : {}),
                          ...(item.danger ? sidebarStyles.menuItemDanger : {})
                        }}
                        onClick={() => !item.disabled && (item.subItems ? toggleSubmenu(item.id) : handleItemClick(item.id, section))}
                        onMouseEnter={(e) => {
                          if (!item.disabled) {
                            e.target.style.backgroundColor = '#f3f4f6';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                        }}
                        title={item.tooltip}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          <span style={sidebarStyles.menuItemIcon}>{item.icon}</span>
                          <span style={sidebarStyles.menuItemLabel}>{item.label}</span>
                          {item.subItems && (
                            <span 
                              style={{
                                ...sidebarStyles.chevron,
                                transform: expandedSubmenus.has(item.id) ? 
                                  'rotate(90deg)' : 'rotate(0deg)'
                              }}
                            >
                              ▶
                            </span>
                          )}
                        </div>
                        {item.shortcut && (
                          <span style={sidebarStyles.shortcut}>{item.shortcut}</span>
                        )}
                      </div>
                      
                      {item.subItems && expandedSubmenus.has(item.id) && (
                        <div style={sidebarStyles.submenu}>
                          {item.subItems.map((subItem) => (
                            <div
                              key={subItem.id}
                              style={sidebarStyles.submenuItem}
                              onClick={() => handleItemClick(subItem.id, section)}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                              <span style={sidebarStyles.menuItemIcon}>{subItem.icon}</span>
                              <span>{subItem.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* フッター */}
        <div style={sidebarStyles.footer}>
          <div style={{ marginBottom: '4px' }}>
            {currentPageMode === 'wiki' ? 
              'TLwiki - 共同編集モード' : 
              '個人ファイル - 編集モード'
            }
          </div>
          {currentUser ? (
            <div style={{ fontSize: '10px' }}>
              ログイン中: {currentUser.email.split('@')[0]}
            </div>
          ) : (
            <div style={{ fontSize: '10px' }}>
              ログインで保存・Wiki機能が利用可能
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;