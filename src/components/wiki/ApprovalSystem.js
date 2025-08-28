// src/components/wiki/ApprovalSystem.js - 編集承認システム
import React, { useState, useEffect, useCallback } from 'react';
import WikiRevisionDiff from './WikiRevisionDiff';

const ApprovalSystem = ({ user, wikiData }) => {
  const [pendingRevisions, setPendingRevisions] = useState([]);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [showDiff, setShowDiff] = useState(false);
  const [filterStatus, setFilterStatus] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 承認待ちリビジョン取得
  const loadPendingRevisions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const revisions = await wikiData.getPendingRevisions(filterStatus);
      setPendingRevisions(revisions);
      
      console.log('承認待ちリビジョン読み込み完了:', revisions.length);
    } catch (err) {
      console.error('承認待ちリビジョン読み込みエラー:', err);
      setError(err.message || '承認待ちリビジョンの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [wikiData, filterStatus]);

  useEffect(() => {
    loadPendingRevisions();
  }, [loadPendingRevisions]);

  // 承認処理
  const handleApprove = useCallback(async (revisionId) => {
    if (!user) {
      setError('承認にはログインが必要です');
      return;
    }

    if (!window.confirm('このリビジョンを承認して安定版に反映しますか？')) {
      return;
    }

    try {
      const result = await wikiData.approveRevision(revisionId);
      if (result) {
        console.log('リビジョン承認完了:', revisionId);
        await loadPendingRevisions(); // リストを更新
      }
    } catch (err) {
      console.error('承認処理エラー:', err);
      setError(err.message || '承認処理に失敗しました');
    }
  }, [user, wikiData, loadPendingRevisions]);

  // 却下処理
  const handleReject = useCallback(async (revisionId, reason = '') => {
    if (!user) {
      setError('却下にはログインが必要です');
      return;
    }

    const rejectReason = reason || window.prompt('却下理由を入力してください（任意）：');
    
    if (!window.confirm('このリビジョンを却下しますか？')) {
      return;
    }

    try {
      const result = await wikiData.rejectRevision(revisionId, rejectReason);
      if (result) {
        console.log('リビジョン却下完了:', revisionId);
        await loadPendingRevisions(); // リストを更新
      }
    } catch (err) {
      console.error('却下処理エラー:', err);
      setError(err.message || '却下処理に失敗しました');
    }
  }, [user, wikiData, loadPendingRevisions]);

  // ユーザー権限チェック
  const getUserPermissionLevel = useCallback(() => {
    if (!user) return 'none';
    
    // TODO: 実際の権限システムを実装
    // 暫定的に全ユーザーに承認権限を付与
    return 'moderator';
    
    // 将来的な実装例:
    // if (user.role === 'admin') return 'admin';
    // if (user.reputation >= 100) return 'moderator';  
    // if (user.reputation >= 10) return 'trusted';
    // return 'basic';
  }, [user]);

  const permissionLevel = getUserPermissionLevel();
  const canApprove = permissionLevel !== 'none';

  // リビジョン状態の表示情報
  const getRevisionStatusInfo = (revision) => {
    const statusMap = {
      pending: { 
        icon: '⏳', 
        label: '承認待ち', 
        color: '#f59e0b',
        bgColor: '#fef3c7'
      },
      approved: { 
        icon: '✅', 
        label: '承認済み', 
        color: '#10b981',
        bgColor: '#d1fae5'
      },
      rejected: { 
        icon: '❌', 
        label: '却下', 
        color: '#ef4444',
        bgColor: '#fee2e2'
      },
      auto_approved: { 
        icon: '🤖', 
        label: '自動承認', 
        color: '#8b5cf6',
        bgColor: '#ede9fe'
      }
    };

    const status = revision.approval_status || 'pending';
    return statusMap[status] || statusMap.pending;
  };

  // 自動承認条件チェック
  const checkAutoApprovalEligibility = (revision) => {
    const upvoteThreshold = 3;
    const reportThreshold = 2;
    const scoreThreshold = 2.0;
    const timeThreshold = 24 * 60 * 60 * 1000; // 24時間（ミリ秒）

    const upvotes = revision.upvotes || 0;
    const reports = revision.reports || 0;
    const score = revision.stable_score || 0;
    const age = new Date() - new Date(revision.created_at);

    return {
      meetsUpvoteThreshold: upvotes >= upvoteThreshold,
      meetsScoreThreshold: score >= scoreThreshold,
      hasMinimalReports: reports < reportThreshold,
      isOldEnough: age >= timeThreshold,
      isEligible: upvotes >= upvoteThreshold && 
                 score >= scoreThreshold && 
                 reports < reportThreshold && 
                 age >= timeThreshold
    };
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#f8fafc'
    },
    header: {
      padding: '20px',
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e7eb'
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '8px'
    },
    subtitle: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '16px'
    },
    filterContainer: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center'
    },
    filterButton: {
      padding: '8px 16px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      backgroundColor: 'white',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s'
    },
    filterButtonActive: {
      backgroundColor: '#3b82f6',
      color: 'white',
      borderColor: '#3b82f6'
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
    content: {
      flex: 1,
      padding: '20px',
      overflow: 'auto'
    },
    loadingMessage: {
      textAlign: 'center',
      padding: '40px',
      color: '#6b7280',
      fontSize: '16px'
    },
    emptyMessage: {
      textAlign: 'center',
      padding: '40px',
      color: '#6b7280',
      fontSize: '16px',
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    },
    revisionCard: {
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px',
      transition: 'all 0.2s'
    },
    revisionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '12px'
    },
    revisionInfo: {
      flex: 1
    },
    revisionTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '4px'
    },
    revisionMeta: {
      fontSize: '12px',
      color: '#6b7280',
      display: 'flex',
      gap: '12px',
      marginBottom: '8px'
    },
    statusBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '500'
    },
    revisionDescription: {
      fontSize: '14px',
      color: '#374151',
      lineHeight: '1.5',
      marginBottom: '12px'
    },
    revisionTags: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px',
      marginBottom: '12px'
    },
    tag: {
      backgroundColor: '#dbeafe',
      color: '#1e40af',
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '11px'
    },
    approvalInfo: {
      padding: '12px',
      backgroundColor: '#f8fafc',
      borderRadius: '6px',
      border: '1px solid #e2e8f0',
      marginBottom: '12px'
    },
    approvalTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px'
    },
    approvalStats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '8px',
      fontSize: '12px'
    },
    approvalStat: {
      display: 'flex',
      justifyContent: 'space-between'
    },
    actionButtons: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    },
    button: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    approveButton: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    rejectButton: {
      backgroundColor: '#ef4444',
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
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>編集承認管理</h2>
        <p style={styles.subtitle}>
          コミュニティによる編集提案の承認・却下を管理します
        </p>

        {/* フィルター */}
        <div style={styles.filterContainer}>
          <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
            表示フィルター：
          </span>
          {['pending', 'approved', 'rejected', 'all'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                ...styles.filterButton,
                ...(filterStatus === status ? styles.filterButtonActive : {})
              }}
              onMouseEnter={(e) => {
                if (filterStatus !== status) {
                  e.target.style.backgroundColor = '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                if (filterStatus !== status) {
                  e.target.style.backgroundColor = 'white';
                }
              }}
            >
              {{
                pending: '承認待ち',
                approved: '承認済み', 
                rejected: '却下済み',
                all: 'すべて'
              }[status]}
            </button>
          ))}
        </div>

        {!canApprove && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fef3c7',
            borderLeft: '4px solid #f59e0b',
            marginTop: '16px'
          }}>
            <div style={{ fontSize: '14px', color: '#92400e', fontWeight: '500' }}>
              ℹ️ 承認権限について
            </div>
            <div style={{ fontSize: '12px', color: '#92400e', marginTop: '4px' }}>
              編集の承認・却下を行うには、一定の信頼レベルが必要です
            </div>
          </div>
        )}
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
        {loading ? (
          <div style={styles.loadingMessage}>
            📋 承認待ちリビジョンを読み込み中...
          </div>
        ) : pendingRevisions.length === 0 ? (
          <div style={styles.emptyMessage}>
            {filterStatus === 'pending' ? 
              '現在承認待ちのリビジョンはありません' :
              `${filterStatus}のリビジョンはありません`
            }
          </div>
        ) : (
          <div>
            {pendingRevisions.map((revision) => {
              const statusInfo = getRevisionStatusInfo(revision);
              const autoApproval = checkAutoApprovalEligibility(revision);
              
              return (
                <div
                  key={revision.rev_id}
                  style={styles.revisionCard}
                  onMouseEnter={(e) => e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'}
                  onMouseLeave={(e) => e.target.style.boxShadow = 'none'}
                >
                  <div style={styles.revisionHeader}>
                    <div style={styles.revisionInfo}>
                      <h3 style={styles.revisionTitle}>
                        {revision.data?.title || '無題'}
                      </h3>
                      
                      <div style={styles.revisionMeta}>
                        <span>作成: {new Date(revision.created_at).toLocaleString('ja-JP')}</span>
                        <span>編集者: {revision.profiles?.display_name || revision.profiles?.username || '匿名'}</span>
                        <span>対象: {revision.event_title || 'イベント'}</span>
                      </div>

                      <div style={{
                        ...styles.statusBadge,
                        color: statusInfo.color,
                        backgroundColor: statusInfo.bgColor
                      }}>
                        {statusInfo.icon} {statusInfo.label}
                      </div>
                    </div>
                  </div>

                  {/* 説明文（短縮表示） */}
                  {revision.data?.description && (
                    <div style={styles.revisionDescription}>
                      {revision.data.description.length > 150 
                        ? revision.data.description.substring(0, 150) + '...'
                        : revision.data.description
                      }
                    </div>
                  )}

                  {/* タグ */}
                  {revision.data?.tags && revision.data.tags.length > 0 && (
                    <div style={styles.revisionTags}>
                      {revision.data.tags.slice(0, 5).map((tag, index) => (
                        <span key={index} style={styles.tag}>
                          #{tag}
                        </span>
                      ))}
                      {revision.data.tags.length > 5 && (
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          +{revision.data.tags.length - 5}個
                        </span>
                      )}
                    </div>
                  )}

                  {/* 承認情報 */}
                  <div style={styles.approvalInfo}>
                    <div style={styles.approvalTitle}>承認状況</div>
                    <div style={styles.approvalStats}>
                      <div style={styles.approvalStat}>
                        <span>👍 いいね:</span>
                        <span style={{ fontWeight: '600' }}>{revision.upvotes || 0}</span>
                      </div>
                      <div style={styles.approvalStat}>
                        <span>⚠️ 問題報告:</span>
                        <span style={{ fontWeight: '600' }}>{revision.reports || 0}</span>
                      </div>
                      <div style={styles.approvalStat}>
                        <span>📊 スコア:</span>
                        <span style={{ fontWeight: '600' }}>{revision.stable_score?.toFixed(1) || '0.0'}</span>
                      </div>
                      <div style={styles.approvalStat}>
                        <span>⏰ 経過時間:</span>
                        <span style={{ fontWeight: '600' }}>
                          {Math.floor((new Date() - new Date(revision.created_at)) / (1000 * 60 * 60))}時間
                        </span>
                      </div>
                    </div>

                    {/* 自動承認条件表示 */}
                    {revision.approval_status === 'pending' && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                          自動承認条件:
                        </div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
                          <span style={{ color: autoApproval.meetsUpvoteThreshold ? '#10b981' : '#6b7280' }}>
                            {autoApproval.meetsUpvoteThreshold ? '✓' : '○'} いいね3以上
                          </span>
                          <span style={{ color: autoApproval.meetsScoreThreshold ? '#10b981' : '#6b7280' }}>
                            {autoApproval.meetsScoreThreshold ? '✓' : '○'} スコア2.0以上
                          </span>
                          <span style={{ color: autoApproval.hasMinimalReports ? '#10b981' : '#6b7280' }}>
                            {autoApproval.hasMinimalReports ? '✓' : '○'} 問題報告2未満
                          </span>
                          <span style={{ color: autoApproval.isOldEnough ? '#10b981' : '#6b7280' }}>
                            {autoApproval.isOldEnough ? '✓' : '○'} 24時間経過
                          </span>
                        </div>
                        
                        {autoApproval.isEligible && (
                          <div style={{
                            marginTop: '8px',
                            padding: '6px 10px',
                            backgroundColor: '#d1fae5',
                            color: '#166534',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            🤖 自動承認の条件を満たしています
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* アクションボタン */}
                  <div style={styles.actionButtons}>
                    <button
                      onClick={() => {
                        setSelectedRevision(revision);
                        setShowDiff(true);
                      }}
                      style={{ ...styles.button, ...styles.diffButton }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#4b5563'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#6b7280'}
                    >
                      📄 差分表示
                    </button>

                    {canApprove && revision.approval_status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(revision.rev_id)}
                          style={{ ...styles.button, ...styles.approveButton }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                        >
                          ✅ 承認
                        </button>
                        
                        <button
                          onClick={() => handleReject(revision.rev_id)}
                          style={{ ...styles.button, ...styles.rejectButton }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                        >
                          ❌ 却下
                        </button>
                      </>
                    )}

                    {!canApprove && (
                      <span style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                        承認権限が必要です
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 差分表示モーダル */}
      {showDiff && selectedRevision && (
        <WikiRevisionDiff
          baseRevision={selectedRevision.stable_data || {}}
          compareRevision={selectedRevision.data || selectedRevision}
          onClose={() => {
            setShowDiff(false);
            setSelectedRevision(null);
          }}
        />
      )}
    </div>
  );
};

export default ApprovalSystem;