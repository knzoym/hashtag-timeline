// src/components/Sidebar.js
import React, { useState } from 'react';
import logoImage from '../assets/logo.png'; // ロゴ画像のパスを適宜変更

const Sidebar = ({ 
  isOpen, 
  onToggle, 
  onMenuItemClick,
  currentUser,
  isSaving,
  canSave,
  logoSrc = {logoImage}
}) => {
  const [expandedSections, setExpandedSections] = useState(new Set(['ファイル']));
  const [expandedSubmenus, setExpandedSubmenus] = useState(new Set());
  const [isHovering, setIsHovering] = useState(false);

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

  const menuItems = [
    {
      section: 'ファイル',
      icon: '📁',
      items: [
        { 
          id: 'new', 
          label: '新規作成', 
          icon: '📄', 
          shortcut: 'Ctrl+N',
          disabled: false 
        },
        { 
          id: 'open', 
          label: '開く', 
          icon: '📂', 
          shortcut: 'Ctrl+O',
          disabled: !currentUser,
          tooltip: !currentUser ? 'ログインが必要です' : null
        },
        { 
          id: 'save', 
          label: '保存', 
          icon: '💾', 
          shortcut: 'Ctrl+S',
          disabled: !currentUser || !canSave || isSaving,
          tooltip: !currentUser ? 'ログインが必要です' : null
        },
        { 
          id: 'export', 
          label: 'エクスポート', 
          icon: '📤',
          subItems: [
            { id: 'export-json', label: 'JSON形式', icon: '{ }' },
            { id: 'export-csv', label: 'CSV形式', icon: '📊' }
          ]
        },
        { 
          id: 'import', 
          label: 'インポート', 
          icon: '📥',
          disabled: false
        }
      ]
    },
    {
      section: '編集',
      icon: '✏️',
      items: [
        { 
          id: 'add-event', 
          label: 'イベントを追加', 
          icon: '➕',
          shortcut: 'ダブルクリック'
        },
        { 
          id: 'sample-events', 
          label: 'サンプルイベント', 
          icon: '📌',
          subItems: [
            { id: 'sample-architecture', label: '建築史', icon: '🏛️' },
            { id: 'sample-history', label: '日本史', icon: '🗾' },
            { id: 'sample-clear', label: 'サンプルをクリア', icon: '🗑️' }
          ]
        },
        { 
          id: 'clear-all', 
          label: 'すべてクリア', 
          icon: '🗑️',
          danger: true
        }
      ]
    },
    {
      section: 'ヘルプ',
      icon: '❓',
      items: [
        { 
          id: 'shortcuts', 
          label: 'ショートカット一覧', 
          icon: '⌨️' 
        },
        { 
          id: 'tips', 
          label: '使い方のヒント', 
          icon: '💡' 
        },
        { 
          id: 'feedback', 
          label: 'フィードバック', 
          icon: '💭' 
        },
        { 
          id: 'about', 
          label: 'このアプリについて', 
          icon: 'ℹ️' 
        }
      ]
    }
  ];

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
      top: 64,
      width: 60,
      height: 'calc(100vh - 64px)',
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
    // フルサイドバー（開いた状態）
    fullSidebar: {
      position: 'fixed',
      left: isOpen ? 60 : -250,
      top: 64,
      width: 250,
      height: 'calc(100vh - 64px)',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e5e7eb',
      transition: 'left 0.3s ease',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: isOpen ? '2px 0 8px rgba(0, 0, 0, 0.1)' : 'none',
    },
    content: {
      flex: 1,
      overflowY: 'auto',
      padding: '12px 0',
    },
    section: {
      marginBottom: '8px',
    },
    sectionHeader: {
      padding: '8px 16px',
      fontSize: '13px',
      fontWeight: '600',
      color: '#374151',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      userSelect: 'none',
      transition: 'background-color 0.2s',
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
      padding: '6px 16px 6px 32px',
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
      fontSize: '11px',
      color: '#9ca3af',
      marginLeft: '8px',
    },
    submenu: {
      marginLeft: '16px',
      borderLeft: '2px solid #f3f4f6',
    },
    submenuItem: {
      padding: '4px 16px 4px 24px',
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
    }
  };

  return (
    <>
      {/* コンパクトサイドバー（常時表示） */}
      <div style={sidebarStyles.compactSidebar}>
        <div
          style={sidebarStyles.logoContainer}
          onClick={onToggle}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          title={isOpen ? 'サイドバーを閉じる' : 'サイドバーを開く'}
        >
          <img 
            src={logoSrc} 
            alt="Logo"
            style={sidebarStyles.logo}
            onError={(e) => {
              // 画像が読み込めない場合のフォールバック
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '📊';
            }}
          />
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

      {/* フルサイドバー（展開時） */}
      <div style={sidebarStyles.fullSidebar}>
        <div style={sidebarStyles.content}>
          {menuItems.map(({ section, icon, items }) => (
            <div key={section} style={sidebarStyles.section}>
              <div
                style={sidebarStyles.sectionHeader}
                onClick={() => toggleSection(section)}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
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
                          ...(item.danger ? sidebarStyles.menuItemDanger : {}),
                        }}
                        onClick={() => {
                          if (item.disabled) return;
                          if (item.subItems) {
                            toggleSubmenu(item.id);
                          } else {
                            handleItemClick(item.id, section);
                          }
                        }}
                        onMouseEnter={(e) => {
                          if (!item.disabled) {
                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                          }
                          if (item.tooltip) {
                            const tooltip = e.currentTarget.querySelector('.tooltip');
                            if (tooltip) tooltip.style.opacity = '1';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          const tooltip = e.currentTarget.querySelector('.tooltip');
                          if (tooltip) tooltip.style.opacity = '0';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          <span style={sidebarStyles.menuItemIcon}>{item.icon}</span>
                          <span style={sidebarStyles.menuItemLabel}>{item.label}</span>
                          {item.subItems && (
                            <span 
                              style={{
                                ...sidebarStyles.chevron,
                                marginLeft: '8px',
                                transform: expandedSubmenus.has(item.id) ? 'rotate(90deg)' : 'rotate(0deg)'
                              }}
                            >
                              ▶
                            </span>
                          )}
                        </div>
                        {item.shortcut && (
                          <span style={sidebarStyles.shortcut}>{item.shortcut}</span>
                        )}
                        {item.tooltip && (
                          <div className="tooltip" style={sidebarStyles.tooltip}>
                            {item.tooltip}
                          </div>
                        )}
                      </div>
                      
                      {item.subItems && expandedSubmenus.has(item.id) && (
                        <div style={sidebarStyles.submenu}>
                          {item.subItems.map((subItem) => (
                            <div
                              key={subItem.id}
                              style={sidebarStyles.submenuItem}
                              onClick={() => handleItemClick(subItem.id, section)}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
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
          {currentUser ? (
            <div>
              ログイン中: {currentUser.email}
            </div>
          ) : (
            <div>
              ログインすると保存機能が使えます
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;