// src/components/WikiEventCard.js の修正版
import React from 'react';

const WikiEventCard = ({ event, onImport, onEdit, canEdit, onClick }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.getFullYear();
  };

  // date_startまたはstart_dateから日付を取得
  const getEventDate = () => {
    return event.date_start || event.start_date;
  };

  // タグの安全な処理
  const getEventTags = () => {
    return Array.isArray(event.tags) ? event.tags : [];
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

  const eventDate = getEventDate();
  const eventTags = getEventTags();

  return (
    <div 
      style={styles.card}
      onMouseEnter={(e) => handleCardHover(e, true)}
      onMouseLeave={(e) => handleCardHover(e, false)}
      onClick={onClick}
    >
      <div style={styles.cardHeader}>
        <div style={{ flex: 1 }}>
          <div style={styles.titleContainer}>
            <h3 style={styles.title}>{event.title}</h3>
            {eventDate && (
              <span style={styles.year}>
                {formatDate(eventDate)}年
              </span>
            )}
          </div>
          
          {event.description && (
            <p style={styles.description}>
              {event.description}
            </p>
          )}
          
          {eventTags.length > 0 && (
            <div style={styles.tagsContainer}>
              {eventTags.map((tag, index) => (
                <span key={`${tag}-${index}`} style={styles.tag}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
          
          <div style={styles.metadata}>
            <span>ID: {event.id}</span>
            {event.created_at && (
              <span>作成: {new Date(event.created_at).toLocaleDateString('ja-JP')}</span>
            )}
            {event.updated_at && (
              <span>更新: {new Date(event.updated_at).toLocaleDateString('ja-JP')}</span>
            )}
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
              title={canEdit ? '編集する' : '編集機能は現在無効です'}
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