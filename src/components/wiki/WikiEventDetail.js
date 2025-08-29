// src/components/wiki/WikiEventDetail.js - wikiフォルダに移動版
import React, { useState, useEffect, useCallback } from 'react';
import WikiRevisionForm from './WikiRevisionForm';
import WikiRevisionDiff from './WikiRevisionDiff';
import { useWikiData } from '../../hooks/useWikiData';

const WikiEventDetail = ({ 
  eventId, 
  user, 
  onBack,
  supabaseClient 
}) => {
  const [currentTab, setCurrentTab] = useState('stable'); // 'stable' | 'latest' | 'history'
  const [stableVersion, setStableVersion] = useState(null);
  const [latestRevision, setLatestRevision] = useState(null);
  const [revisionHistory, setRevisionHistory] = useState([]);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [showDiff, setShowDiff] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Wiki関連フックを使用
  const wikiData = useWikiData(user);

  // データ読み込み - 統一された方式
  const loadEventData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('イベント詳細取得開始:', { eventId });

      // useWikiDataのgetEventDetailを使用
      const eventDetail = await wikiData.getEventDetail(eventId);
      
      setStableVersion(eventDetail.stableVersion);
      setRevisionHistory(eventDetail.revisionHistory);
      setLatestRevision(eventDetail.latestRevision);

      console.log('イベント詳細取得完了:', {
        hasStable: !!eventDetail.stableVersion,
        revisionCount: eventDetail.revisionHistory.length,
        hasLatest: !!eventDetail.latestRevision
      });

    } catch (err) {
      console.error('イベント詳細読み込みエラー:', err);
      setError(err.message || 'データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [eventId, wikiData]);

  // 初期読み込み
  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  // 投票処理
  const handleVote = useCallback(async (revisionId, kind) => {
    if (!user) {
      setError('投票にはログインが必要です');
      return;
    }

    try {
      const result = await wikiData.voteOnRevision(revisionId, kind);
      if (result) {
        // 投票後にデータを再読み込み
        await loadEventData();
        console.log('投票完了とデータ再読み込み完了');
      }
    } catch (err) {
      console.error('投票処理エラー:', err);
      setError(err.message || '投票に失敗しました');
    }
  }, [user, wikiData, loadEventData]);

  // リバート処理
  const handleRevert = useCallback(async (revisionId) => {
    if (!user) {
      setError('リバートにはログインが必要です');
      return;
    }

    if (!window.confirm('この版に戻しますか？この操作は元に戻せません。')) {
      return;
    }

    try {
      const result = await wikiData.revertRevision(revisionId);
      if (result) {
        // リバート後にデータを再読み込み
        await loadEventData();
        console.log('リバート完了とデータ再読み込み完了');
      }
    } catch (err) {
      console.error('リバート処理エラー:', err);
      setError(err.message || 'リバートに失敗しました');
    }
  }, [user, wikiData, loadEventData]);

  // 編集権限チェック
  const canEdit = useCallback((targetRevision) => {
    if (!user || !targetRevision) return false;
    return user.id === targetRevision.edited_by || user.id === targetRevision.created_by;
  }, [user]);

  // 表示データ決定
  const getDisplayData = useCallback(() => {
    switch (currentTab) {
      case 'stable':
        return stableVersion;
      case 'latest':
        return latestRevision || stableVersion;
      case 'history':
        return selectedRevision || stableVersion;
      default:
        return stableVersion;
    }
  }, [currentTab, stableVersion, latestRevision, selectedRevision]);

  const displayData = getDisplayData();

  const styles = {
    container: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '12px',
      width: '100%',
      maxWidth: '900px',
      maxHeight: '90vh',
      overflow: 'auto',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px',
      borderBottom: '2px solid #e5e7eb'
    },
    backButton: {
      backgroundColor: '#f3f4f6',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#374151'
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#6b7280',
      padding: '4px',
      borderRadius: '50%',
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    errorAlert: {
      backgroundColor: '#fee2e2',
      border: '1px solid #fca5a5',
      color: '#dc2626',
      padding: '12px',
      borderRadius: '6px',
      margin: '20px',
      fontSize: '14px'
    },
    loadingMessage: {
      textAlign: 'center',
      padding: '40px',
      color: '#6b7280',
      fontSize: '16px'
    },
    content: {
      padding: '20px'
    },
    tabSwitcher: {
      display: 'flex',
      marginBottom: '20px',
      backgroundColor: '#f3f4f6',
      borderRadius: '8px',
      padding: '2px'
    },
    tab: {
      flex: 1,
      padding: '8px 16px',
      border: 'none',
      backgroundColor: 'transparent',
      color: '#6b7280',
      fontSize: '14px',
      fontWeight: '500',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    tabActive: {
      backgroundColor: '#3b82f6',
      color: 'white',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
    },
    eventHeader: {
      marginBottom: '20px'
    },
    eventTitle: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '8px'
    },
    eventDate: {
      fontSize: '16px',
      color: '#6b7280',
      marginBottom: '12px'
    },
    eventDescription: {
      fontSize: '16px',
      color: '#374151',
      lineHeight: '1.6',
      marginBottom: '16px',
      whiteSpace: 'pre-wrap'
    },
    tagsContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
      marginBottom: '16px'
    },
    tag: {
      backgroundColor: '#3b82f6',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px'
    },
    metadataContainer: {
      display: 'flex',
      gap: '16px',
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '20px',
      flexWrap: 'wrap'
    },
    actionButtons: {
      display: 'flex',
      gap: '12px',
      marginBottom: '20px',
      flexWrap: 'wrap'
    },
    button: {
      padding: '8px 16px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      border: 'none',
      transition: 'all 0.2s'
    },
    editButton: {
      backgroundColor: '#f59e0b',
      color: 'white'
    },
    voteButton: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    reportButton: {
      backgroundColor: '#ef4444',
      color: 'white'
    },
    revertButton: {
      backgroundColor: '#8b5cf6',
      color: 'white'
    },
    diffButton: {
      backgroundColor: '#6b7280',
      color: 'white'
    },
    disabledButton: {
      backgroundColor: '#d1d5db',
      color: '#9ca3af',
      cursor: 'not-allowed'
    },
    revisionList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxHeight: '400px',
      overflow: 'auto'
    },
    revisionItem: {
      padding: '12px',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      backgroundColor: '#f9fafb',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    revisionItemSelected: {
      backgroundColor: '#dbeafe',
      borderColor: '#3b82f6'
    },
    revisionMeta: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '12px',
      color: '#6b7280',
      marginBottom: '4px'
    },
    revisionTitle: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151'
    },
    revisionStats: {
      display: 'flex',
      gap: '8px',
      fontSize: '12px',
      color: '#6b7280'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.modal}>
          <div style={styles.loadingMessage}>
            データを読み込み中...
          </div>
        </div>
      </div>
    );
  }

  if (error && !stableVersion) {
    return (
      <div style={styles.container}>
        <div style={styles.modal}>
          <div style={styles.header}>
            <button style={styles.backButton} onClick={onBack}>
              ← 戻る
            </button>
            <button style={styles.closeButton} onClick={onBack}>×</button>
          </div>
          <div style={styles.errorAlert}>
            エラー: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <button 
            style={styles.backButton} 
            onClick={onBack}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
          >
            ← 戻る
          </button>
          <button 
            style={styles.closeButton} 
            onClick={onBack}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>

        {/* エラー表示 */}
        {error && (
          <div style={styles.errorAlert}>
            {error}
            <button 
              onClick={() => setError(null)} 
              style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
        )}

        <div style={styles.content}>
          {/* タブ切り替え */}
          <div style={styles.tabSwitcher}>
            <button
              onClick={() => setCurrentTab('stable')}
              style={{
                ...styles.tab,
                ...(currentTab === 'stable' ? styles.tabActive : {})
              }}
            >
              安定版
            </button>
            <button
              onClick={() => setCurrentTab('latest')}
              style={{
                ...styles.tab,
                ...(currentTab === 'latest' ? styles.tabActive : {})
              }}
              disabled={!latestRevision}
            >
              最新版
            </button>
            <button
              onClick={() => setCurrentTab('history')}
              style={{
                ...styles.tab,
                ...(currentTab === 'history' ? styles.tabActive : {})
              }}
            >
              履歴 ({revisionHistory.length})
            </button>
          </div>

          {/* メインコンテンツ */}
          {displayData ? (
            <>
              <div style={styles.eventHeader}>
                <h1 style={styles.eventTitle}>
                  {displayData.title || displayData.stable_data?.title || '無題'}
                </h1>
                
                {/* 日付表示 */}
                <div style={styles.eventDate}>
                  {(() => {
                    const startDate = displayData.date_start || displayData.stable_data?.date_start;
                    const endDate = displayData.date_end || displayData.stable_data?.date_end;
                    
                    if (!startDate) return '日付不明';
                    
                    const start = new Date(startDate).toLocaleDateString('ja-JP');
                    if (endDate && endDate !== startDate) {
                      const end = new Date(endDate).toLocaleDateString('ja-JP');
                      return `${start} - ${end}`;
                    }
                    return start;
                  })()}
                </div>

                {/* メタデータ */}
                <div style={styles.metadataContainer}>
                  <span>
                    編集回数: {revisionHistory.length}
                  </span>
                  <span>
                    最終更新: {displayData.updated_at ? new Date(displayData.updated_at).toLocaleDateString('ja-JP') : '不明'}
                  </span>
                  <span>
                    作成者: {displayData.profiles?.display_name || displayData.profiles?.username || '匿名'}
                  </span>
                  {displayData.stable_score !== undefined && (
                    <span>
                      安定スコア: {displayData.stable_score?.toFixed(1) || '0.0'}
                    </span>
                  )}
                </div>
              </div>

              {/* 説明文 */}
              <div style={styles.eventDescription}>
                {displayData.description || displayData.stable_data?.description || '説明文がありません'}
              </div>

              {/* タグ */}
              {((displayData.tags || displayData.stable_data?.tags || []).length > 0) && (
                <div style={styles.tagsContainer}>
                  {(displayData.tags || displayData.stable_data?.tags || []).map((tag, index) => (
                    <span key={index} style={styles.tag}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 参考資料 */}
              {((displayData.sources || displayData.stable_data?.sources || []).length > 0) && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>参考資料</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {(displayData.sources || displayData.stable_data?.sources || []).map((source, index) => (
                      <a 
                        key={index}
                        href={source} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '14px' }}
                      >
                        {source}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* アクションボタン */}
              <div style={styles.actionButtons}>
                {user && (
                  <button 
                    style={{ ...styles.button, ...styles.editButton }}
                    onClick={() => setShowEditForm(true)}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#d97706'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#f59e0b'}
                  >
                    編集を提案
                  </button>
                )}

                {user && latestRevision && (
                  <>
                    <button 
                      style={{ ...styles.button, ...styles.voteButton }}
                      onClick={() => handleVote(latestRevision.rev_id, 'upvote')}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                    >
                      👍 良い編集
                    </button>
                    <button 
                      style={{ ...styles.button, ...styles.reportButton }}
                      onClick={() => handleVote(latestRevision.rev_id, 'report')}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                    >
                      ⚠️ 問題報告
                    </button>
                  </>
                )}

                {selectedRevision && selectedRevision !== stableVersion && (
                  <button 
                    style={{ ...styles.button, ...styles.diffButton }}
                    onClick={() => {
                      setShowDiff(true);
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#4b5563'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#6b7280'}
                  >
                    📄 安定版と比較
                  </button>
                )}
              </div>

              {/* 履歴タブの場合：リビジョン一覧表示 */}
              {currentTab === 'history' && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                    編集履歴
                  </h3>
                  <div style={styles.revisionList}>
                    {revisionHistory.map((revision, index) => {
                      const isSelected = selectedRevision?.rev_id === revision.rev_id;
                      const isStable = stableVersion?.stable_revision_id === revision.rev_id;
                      
                      return (
                        <div
                          key={revision.rev_id}
                          onClick={() => setSelectedRevision(revision)}
                          style={{
                            ...styles.revisionItem,
                            ...(isSelected ? styles.revisionItemSelected : {})
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.target.style.backgroundColor = '#f3f4f6';
                              e.target.style.borderColor = '#d1d5db';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.target.style.backgroundColor = '#f9fafb';
                              e.target.style.borderColor = '#e5e7eb';
                            }
                          }}
                        >
                          <div style={styles.revisionMeta}>
                            <span>
                              {new Date(revision.created_at).toLocaleString('ja-JP')}
                              {isStable && <span style={{ color: '#10b981', fontWeight: '600' }}> [安定版]</span>}
                              {index === 0 && <span style={{ color: '#3b82f6', fontWeight: '600' }}> [最新]</span>}
                            </span>
                            <span>
                              編集者: {revision.profiles?.display_name || revision.profiles?.username || '匿名'}
                            </span>
                          </div>
                          <div style={styles.revisionTitle}>
                            {revision.data?.title || '無題'}
                          </div>
                          <div style={styles.revisionStats}>
                            <span>👍 {revision.upvotes || 0}</span>
                            <span>⚠️ {revision.reports || 0}</span>
                            <span>スコア: {revision.stable_score?.toFixed(1) || '0.0'}</span>
                          </div>
                          
                          {/* リビジョン固有のアクション */}
                          {user && (
                            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVote(revision.rev_id, 'upvote');
                                }}
                                style={{ ...styles.button, ...styles.voteButton, padding: '4px 8px' }}
                              >
                                👍
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVote(revision.rev_id, 'report');
                                }}
                                style={{ ...styles.button, ...styles.reportButton, padding: '4px 8px' }}
                              >
                                ⚠️
                              </button>
                              {!isStable && index !== 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRevert(revision.rev_id);
                                  }}
                                  style={{ ...styles.button, ...styles.revertButton, padding: '4px 8px' }}
                                >
                                  ↶
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRevision(revision);
                                  setShowDiff(true);
                                }}
                                style={{ ...styles.button, ...styles.diffButton, padding: '4px 8px' }}
                              >
                                📄
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={styles.loadingMessage}>
              イベントが見つかりません
            </div>
          )}
        </div>

        {/* 編集フォーム */}
        {showEditForm && (
          <WikiRevisionForm
            eventId={stableVersion?.event_id}
            initialData={latestRevision?.data || stableVersion?.stable_data || stableVersion}
            user={user}
            supabaseClient={supabaseClient}
            onSave={(savedData) => {
              setShowEditForm(false);
              console.log('リビジョン保存完了:', savedData);
              // データ再読み込み
              loadEventData();
            }}
            onCancel={() => setShowEditForm(false)}
          />
        )}

        {/* 差分表示 */}
        {showDiff && selectedRevision && stableVersion && (
          <WikiRevisionDiff
            baseRevision={stableVersion.stable_data || stableVersion}
            compareRevision={selectedRevision.data || selectedRevision}
            onClose={() => {
              setShowDiff(false);
              setSelectedRevision(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default WikiEventDetail;