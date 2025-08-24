// src/components/UI/Header.js
import React, { useState } from 'react';
import { useTimelineStore } from '../../store/useTimelineStore';
import HeaderMenu from './HeaderMenu';
import logoImage from '../../assets/logo.png';

const Header = ({ user, authLoading, isAuthenticated, signInWithGoogle, signOut, onSave, fileOperations }) => {
  const { currentView, setView, resetView, scale, openNewEventModal } = useTimelineStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const styles = {
    header: {
      backgroundColor: "#f5f3ed",
      borderBottom: "1px solid #e5e7eb",
      height: "64px",
      display: "flex",
      alignItems: "center",
      padding: "0 20px",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      zIndex: 15,
      justifyContent: "space-between",
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      flex: '1',
    },
    headerCenter: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flex: "0 0 auto",
    },
    headerRight: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      flex: "1",
      justifyContent: "flex-end",
    },
    title: {
      fontSize: "18px",
      fontWeight: "bold",
      color: "#374151",
      margin: 0,
    },
    headerMenuButton: {
      padding: '4px',
      cursor: 'pointer',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.2s',
    },
    viewToggle: {
      display: "flex",
      backgroundColor: "#e5e7eb",
      borderRadius: "6px",
      padding: "2px",
    },
    viewButton: {
      padding: "6px 12px",
      border: "none",
      backgroundColor: "transparent",
      color: "#6b7280",
      fontSize: "13px",
      fontWeight: "500",
      borderRadius: "4px",
      cursor: "pointer",
      transition: "all 0.2s",
    },
    viewButtonActive: {
      backgroundColor: "#3b82f6",
      color: "white",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
    },
    actionButton: {
      padding: "6px 12px",
      backgroundColor: "#6b7280",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
      fontSize: "13px",
      display: "flex",
      alignItems: "center",
      gap: "4px",
    },
    accountContainer: { position: "relative" },
    loginButton: {
      padding: "8px 16px",
      backgroundColor: "#3b82f6",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "13px",
    },
    accountButton: {
      padding: "8px 12px",
      backgroundColor: "#f9fafb",
      border: "1px solid #e5e7eb",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "13px",
    },
  };

  return (
    <>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerMenuButton} onClick={() => setMenuOpen(true)} title="メニュー">
            <img src={logoImage} alt="Logo" style={{ width: 32, height: 32 }} />
          </div>
          <div style={styles.viewToggle}>
            <button onClick={() => setView('graph')} style={{...styles.viewButton, ...(currentView === 'graph' ? styles.viewButtonActive : {})}}>🕸️ グラフ</button>
            <button onClick={() => setView('timeline')} style={{...styles.viewButton, ...(currentView === 'timeline' ? styles.viewButtonActive : {})}}>📊 年表</button>
            <button onClick={() => setView('table')} style={{...styles.viewButton, ...(currentView === 'table' ? styles.viewButtonActive : {})}}>📋 テーブル</button>
            <button onClick={() => setView('wiki')} style={{...styles.viewButton, ...(currentView === 'wiki' ? styles.viewButtonActive : {})}}>📚 Wiki</button>
          </div>
        </div>

        <div style={styles.headerCenter}>
          <h1 style={styles.title}>#ハッシュタグ年表</h1>
        </div>

        <div style={styles.headerRight}>
          {currentView === 'timeline' && (
            <>
              <button style={styles.actionButton} onClick={resetView}>🎯 初期位置</button>
              <span>🔍 {(scale / 2.5).toFixed(1)}x</span>
            </>
          )}
          <button style={styles.actionButton} onClick={() => openNewEventModal()}>➕ イベント追加</button>
          {isAuthenticated && <button onClick={onSave} style={{...styles.actionButton, backgroundColor: '#10b981'}}>💾 保存</button>}
          
          <div style={styles.accountContainer}>
            {authLoading ? <span>...</span> : isAuthenticated ? (
              <button onClick={signOut} style={styles.accountButton}>👤 {user.email.split('@')[0]}</button>
            ) : (
              <button onClick={signInWithGoogle} style={styles.loginButton}>🔑 ログイン</button>
            )}
          </div>
        </div>
      </header>
      {menuOpen && <HeaderMenu onClose={() => setMenuOpen(false)} fileOperations={fileOperations} />}
    </>
  );
};

export default Header;
