// src/components/WikiBrowser.js
import React, { useState, useEffect, useCallback } from 'react';
import WikiEventCard from './WikiEventCard';
import WikiEventForm from './WikiEventForm';

const WikiBrowser = ({ 
  user, 
  wikiData, 
  onImportEvent,
  onBackToTimeline 
}) => {
  const [currentTab, setCurrentTab] = useState('browse'); // 'browse', 'contribute', 'history'
  const [searchTerm, setSearchTerm] = useState('');
  const [sharedEvents, setSharedEvents] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const { 
    getSharedEvents, 
    createSharedEvent, 
    updateSharedEvent,
    importEventToPersonal,
    getRecentActivity,
    loading: apiLoading
  } = wikiData;

  // 共用イベント読み込み
  const loadSharedEvents = useCallback(async () => {
    setLoading(true);
    const events = await getSharedEvents(searchTerm);
    setSharedEvents(events);
    setLoading(false);
  }, [getSharedEvents, searchTerm]);

  // 編集履歴読み込み
  const loadRecentActivity = useCallback(async () => {
    const activity = await getRecentActivity(15);
    setRecentActivity(activity);
  }, [getRecentActivity]);

  // 初回読み込み
  useEffect(() => {
    loadSharedEvents();
  }, [loadSharedEvents]);

  useEffect(() => {
    if (currentTab === 'history') {
      loadRecentActivity();
    }
  }, [currentTab, loadRecentActivity]);

  // 検索実行（500ms のデバウンス）
  useEffect(() => {
    const timer = setTimeout(() => {
      loadSharedEvents();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // イベント保存
  const handleSaveEvent = async (eventData) => {
    let result;
    
    if (editingEvent) {
      result = await updateSharedEvent(editingEvent.id, {
        title: eventData.title,
        description: eventData.description,
        tags: eventData.tags
      });
    } else {
      result = await createSharedEvent(eventData);
    }

    if (result) {
      setShowEventForm(false);
      setEditingEvent(null);
      await loadSharedEvents();
    }
  };

  // インポート処理
  const handleImportEvent = async (sharedEvent) => {
    const personalEvent = importEventToPersonal(sharedEvent);
    onImportEvent(personalEvent);
    
    // インポート成功通知
    alert(`「${sharedEvent.title}」を個人年表にインポートしました`);
  };

  const styles = {
    container: {
      padding: '20px',
      backgroundColor: 'white',
      height: 'calc(100vh - 64px)',
      overflow: 'auto'
    },
    header: {
      backgroundColor: '#f8fafc',
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '24px',
      textAlign: 'center'
    },
    title: {
      margin: '0 0 8px 0',
      fontSize: '28px',
      color: '#1f2937'
    },
    subtitle: {
      margin: '0',
      fontSize: '16px',
      color: '#6b7280'
    },
    tabContainer: {
      display: 'flex',
      borderBottom: '2px solid #e5e7eb',
      marginBottom: '20px'
    },
    tab: {
      padding: '12px 16px',
      border: 'none',
      backgroundColor: 'transparent',
      color: '#6b7280',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      borderBottom: '2px solid transparent'
    },
    tabActive: {
      borderBottom: '2px solid #3b82f6',
      color: '#3b82f6'
    },
    searchBar: {
      backgroundColor: '#f9fafb',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '20px'
    },
    searchInput: {
      width: '100%',
      padding: '10px 14px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      marginBottom: '12px'
    },
    filterContainer: {
      display: 'flex',
      gap: '12px',
      fontSize: '12px',
      alignItems: 'center'
    },
    createButton: {
      padding: '8px 16px',
      backgroundColor: '#10b981',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      cursor: 'pointer',
      fontWeight: '500'
    },
    backButton: {
      padding: '8px 16px',
      backgroundColor: '#6b7280',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      cursor: 'pointer',
      marginRight: '12px'
    },
    loadingMessage: {
      textAlign: 'center',
      padding: '40px',
      color: '#6b7280'
    },
    contributeSection: {
      textAlign: 'center',
      padding: '60px 20px',
      backgroundColor: '#f9fafb',
      borderRadius: '12px'
    },
    historyContainer: {
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      backgroundColor: 'white'
    },
    historyItem: {
      padding: '12px 16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  };

  return (
    <div style={styles.container}>
      {/* ヘッダー */}
      <div style={styles.header}>
        <h1 style={styles.title}>📚 TLwiki (Timeline Wiki)</h1>
        <p style={styles.subtitle}>
          みんなでイベント情報を蓄積・共有し、個人の年表作成を支援
        </p>
        <div style={{ marginTop: '16px' }}>
          <button style={styles.backButton} onClick={onBackToTimeline}>
            ← 年表に戻る
          </button>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div style={styles.tabContainer}>
        {[
          { id: 'browse', label: '📖 イベントを探す', desc: 'Wikiから個人ファイルに追加' },
          { id: 'contribute', label: '✏️ 編集に参加', desc: '共用データベースを充実させる' },
          { id: 'history', label: '📋 編集履歴', desc: 'コミュニティの貢献を確認' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            style={{
              ...styles.tab,
              ...(currentTab === tab.id ? styles.tabActive : {})
            }}
          >
            <span>{tab.label}</span>
            <span style={{ fontSize: '10px', opacity: 0.8 }}>{tab.desc}</span>
          </button>
        ))}
      </div>

      {/* メインコンテンツ */}
      {currentTab === 'browse' && (
        <div>
          {/* 検索・フィルター */}
          <div style={styles.searchBar}>
            <input
              type="text"
              placeholder="イベント名、タグで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            
            <div style={styles.filterContainer}>
              <span>🔍 検索結果: {sharedEvents.length}件</span>
              {user && (
                <button 
                  style={styles.createButton}
                  onClick={() => setShowEventForm(true)}
                >
                  ✨ 新しいイベントを提案
                </button>
              )}
            </div>
          </div>

          {/* イベント一覧 */}
          <div>
            {loading || apiLoading ? (
              <div style={styles.loadingMessage}>
                読み込み中...
              </div>
            ) : sharedEvents.length === 0 ? (
              <div style={styles.loadingMessage}>
                {searchTerm ? '検索結果が見つかりませんでした' : 'イベントがまだありません'}
              </div>
            ) : (
              sharedEvents.map(event => (
                <WikiEventCard
                  key={event.id}
                  event={event}
                  onImport={() => handleImportEvent(event)}
                  onEdit={user ? () => {
                    setEditingEvent(event);
                    setShowEventForm(true);
                  } : null}
                  canEdit={user && user.id === event.created_by}
                />
              ))
            )}
          </div>
        </div>
      )}

      {currentTab === 'contribute' && (
        <div style={styles.contributeSection}>
          <h2 style={{ marginBottom: '16px', color: '#374151' }}>
            🤝 コミュニティに貢献しよう
          </h2>
          <p style={{ marginBottom: '24px', color: '#6b7280', lineHeight: '1.6' }}>
            あなたの知識でTLwikiをより豊かに。<br/>
            イベントの追加、既存情報の改善など、様々な形で参加できます。
          </p>
          {user ? (
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                style={styles.createButton}
                onClick={() => {
                  setEditingEvent(null);
                  setShowEventForm(true);
                }}
              >
                📝 新しいイベントを追加
              </button>
            </div>
          ) : (
            <p style={{ color: '#ef4444', fontWeight: '500' }}>
              編集に参加するにはログインが必要です
            </p>
          )}
        </div>
      )}

      {currentTab === 'history' && (
        <div>
          <h2 style={{ marginBottom: '16px' }}>最近の編集活動</h2>
          <div style={styles.historyContainer}>
            {recentActivity.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                編集履歴がありません
              </div>
            ) : (
              recentActivity.map((activity, index) => (
                <div 
                  key={activity.id} 
                  style={{
                    ...styles.historyItem,
                    borderBottom: index < recentActivity.length - 1 ? '1px solid #f3f4f6' : 'none'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: '500' }}>
                      {activity.profiles?.display_name || activity.profiles?.username || '匿名'}
                    </span>
                    <span style={{ margin: '0 8px', color: '#6b7280' }}>が</span>
                    <span style={{ color: '#3b82f6' }}>{activity.shared_events.title}</span>
                    <span style={{ margin: '0 8px', color: '#6b7280' }}>を</span>
                    <span style={{ color: '#059669' }}>
                      {activity.edit_type === 'create' ? '新規作成' : '更新'}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                    {new Date(activity.created_at).toLocaleString('ja-JP')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* イベント作成・編集フォーム */}
      {showEventForm && user && (
        <WikiEventForm
          event={editingEvent}
          onSave={handleSaveEvent}
          onCancel={() => {
            setShowEventForm(false);
            setEditingEvent(null);
          }}
          loading={apiLoading}
        />
      )}
    </div>
  );
};

export default WikiBrowser;