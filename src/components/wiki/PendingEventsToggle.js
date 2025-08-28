// src/components/wiki/PendingEventsToggle.js - 承認待ちイベント表示切り替え
import React from 'react';

const PendingEventsToggle = ({ 
  showPending, 
  onToggle, 
  pendingCount = 0,
  disabled = false 
}) => {
  const styles = {
    container: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'all 0.2s'
    },
    checkbox: {
      width: '16px',
      height: '16px',
      cursor: 'pointer'
    },
    label: {
      fontSize: '14px',
      color: '#374151',
      fontWeight: '500',
      cursor: 'pointer',
      userSelect: 'none'
    },
    badge: {
      backgroundColor: showPending ? '#f59e0b' : '#6b7280',
      color: 'white',
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: '600',
      minWidth: '20px',
      textAlign: 'center'
    },
    tooltip: {
      fontSize: '12px',
      color: '#6b7280',
      fontStyle: 'italic'
    }
  };

  return (
    <div
      style={styles.container}
      onClick={() => !disabled && onToggle()}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.target.style.backgroundColor = '#f3f4f6';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.target.style.backgroundColor = 'white';
        }
      }}
    >
      <input
        type="checkbox"
        checked={showPending}
        onChange={onToggle}
        disabled={disabled}
        style={styles.checkbox}
      />
      
      <label style={styles.label}>
        承認待ちイベントを表示
      </label>
      
      <span style={styles.badge}>
        {pendingCount}
      </span>
      
      {showPending && pendingCount > 0 && (
        <span style={styles.tooltip}>
          オレンジ色のイベントが承認待ちです
        </span>
      )}
    </div>
  );
};

export default PendingEventsToggle;