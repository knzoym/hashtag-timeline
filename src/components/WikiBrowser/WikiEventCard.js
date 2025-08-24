// src/components/WikiEventCard.js
import React from 'react';

const WikiEventCard = ({ event, onImport, onEdit, canEdit }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.getFullYear();
  };

  const styles = {
    card: {
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px',
      backgroundColor: 'white',
      transition: 'box-shadow 0.2s',
      cursor: 'default'
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '8px'
    },
    titleContainer: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '8px'
    },
    title: {
      margin: 0,
      fontSize: '16px',
      fontWeight: '600',
      color: '#374151'
    },
    year: {
      fontSize: '14px',
      color: '#6b7280',
      backgroundColor: '#f3f4f6',
      padding: '2px 6px',
      borderRadius: '4px',
      fontWeight: '500'
    },
    description: {
      margin: '0 0 12px 0',
      fontSize: '14px',
      lineHeight: '1.4',
      color: '#374151'
    },
    tagsContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px',
      marginBottom: '8px'
    },
    tag: {
      fontSize: '11px',
      backgroundColor: '#dbeafe',
      color: '#1e40af',
      padding: '2px 6px',
      borderRadius: '4px'
    },
    metadata: {
      fontSize: '11px',
      color: '#9ca3af',
      display: 'flex',
      gap: '12px',
      marginBottom: '12px'
    },
    buttonContainer: {
      display: 'flex',
      gap: '8px'
    },
    importButton: {
      padding: '6px 12px',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '12px',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'background-color 0.2s'
    },
    editButton: {
      padding: '6px 12px',
      backgroundColor: '#f59e0b',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '12px',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'background-color 0.2s'
    },
    disabledButton: {
      backgroundColor: '#9ca3af',
      cursor: 'not-allowed'
    }
  };

  const handleCardHover = (e, isEntering) => {
    e.currentTarget.style.boxShadow = isEntering 
      ? '0 4px 12px rgba(0, 0, 0, 0.1)' 
      : 'none';
  };

  return (
    <div 
      style={styles.card}
      onMouseEnter={(e) => handleCardHover(e, true)}
      onMouseLeave={(e) => handleCardHover(e, false)}
    >
      <div style={styles.cardHeader}>
        <div style={{ flex: 1 }}>
          <div style={styles.titleContainer}>
            <h3 style={styles.title}>{event.title}</h3>
            <span style={styles.year}>
              {formatDate(event.start_date)}年
            </span>
          </div>
          
          {event.description && (
            <p style={styles.description}>
              {event.description}
            </p>
          )}
          
          {event.tags && event.tags.length > 0 && (
            <div style={styles.tagsContainer}>
              {event.tags.map(tag => (
                <span key={tag} style={styles.tag}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
          
          <div style={styles.metadata}>
            <span>編集回数: {event.edit_count || 1}</span>
            <span>最終更新: {new Date(event.updated_at).toLocaleDateString('ja-JP')}</span>
            <span>
              作成者: {event.profiles?.display_name || event.profiles?.username || '匿名'}
            </span>
          </div>
        </div>
        
        <div style={styles.buttonContainer}>
          <button 
            style={styles.importButton}
            onClick={onImport}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            📥 インポート
          </button>
          
          {onEdit && (
            <button 
              style={{
                ...styles.editButton,
                ...(canEdit ? {} : styles.disabledButton)
              }}
              onClick={canEdit ? onEdit : undefined}
              disabled={!canEdit}
              title={canEdit ? '編集する' : '自分が作成したイベントのみ編集できます'}
              onMouseEnter={(e) => {
                if (canEdit) {
                  e.target.style.backgroundColor = '#d97706';
                }
              }}
              onMouseLeave={(e) => {
                if (canEdit) {
                  e.target.style.backgroundColor = '#f59e0b';
                }
              }}
            >
              ✏️ 編集
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WikiEventCard;