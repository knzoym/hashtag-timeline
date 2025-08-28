// src/components/tabs/RevisionTab.js - 承認システム統合版
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ApprovalSystem from '../wiki/ApprovalSystem';

const RevisionTab = ({ 
  wikiData, 
  user, 
  isWikiMode,
  showRevisionHistory 
}) => {
  const [currentView, setCurrentView] = useState('activity'); // 'activity' | 'approval'
  const [revisions, setRevisions] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [timeRange, setTimeRange] = useState('24h');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState(null);

  // 更新履歴読み込み
  const loadRevisions = useCallback(async () => {
    if (!isWikiMode || !wikiData) return;

    try {
      setLoading(true);
      
      // 通常の更新履歴
      const recentRevisions = await wikiData.getRecentRevisions(50, timeRange);
      setRevisions(recentRevisions);

      // 承認待ち件数を取得
      const pendingRevisions = await wikiData.getPendingRevisions('pending', 100);
      setPendingCount(pendingRevisions.length);

      console.log('更新履歴読み込み完了:', {
        revisions: recentRevisions.length,
        pending: pendingRevisions.length
      });
      
    } catch (error) {
      console.error('Failed to load revisions:', error);
      setRevisions([]);
      setPendingCount(0);
    } finally {
      setLoading(false);
    }
  }, [wikiData, timeRange, isWikiMode]);

  useEffect(() => {
    loadRevisions();
  }, [loadRevisions]);

  // フィルタリングされた更新履歴
  const filteredRevisions = useMemo(() => {
    let filtered = revisions;
    
    if (filterType !== 'all') {
      filtered = filtered.filter(revision => {
        switch (filterType) {
          case 'events':
            return revision.type === 'event_create' || revision.type === 'event_update';
          case 'approvals':
            return revision.approval_status === 'approved' || revision.approval_status === 'rejected';
          case 'edits':
            return revision.type === 'event_update' || revision.type === 'event_edit';
          case 'pending':
            return revision.approval_status === 'pending';
          default:
            return true;
        }
      });
    }
    
    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [revisions, filterType]);
  
  // 統計情報
  const stats = useMemo(() => {
    return {
      total: filteredRevisions.length,
      pending: revisions.filter(r => r.approval_status === 'pending').length,
      approved: revisions.filter(r => r.approval_status === 'approved').length,
      rejected: revisions.filter(r => r.approval_status === 'rejected').length
    };
  }, [revisions, filteredRevisions]);

  // Wiki専用タブなので、Wikiモードでない場合は警告表示
  if (!isWikiMode) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        color: '#6b7280',
        fontSize: '16px',
        gap: '16px'
      }}>
        <div>⚠️ 更新タブはWikiモード専用です</div>
        <div style={{ fontSize: '14px', textAlign: 'center', maxWidth: '400px' }}>
          Wikiページに切り替えて、コミュニティの編集履歴を確認してください。
        </div>
      </div>
    );
  }

  // 更新タイプのアイコンとラベル
  const getRevisionTypeInfo = (type) => {
    const typeMap = {
      event_create: { icon: '➕', label: 'イベント作成', color: '#10b981' },
      event_update: { icon: '✏️', label: 'イベント編集', color: '#3b82f6' },
      approval: { icon: '✅', label: '編集承認', color: '#059669' },
      rejection: { icon: '❌', label: '編集却下', color: '#dc2626' },
      auto_approval: { icon: '🤖', label: '自動承認', color: '#8b5cf6' }
    };
    
    return typeMap[type] || { icon: '❓', label: '不明', color: '#6b7280' };
  };

  // 相対時間表示
  const getRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}分前`;
    } else if (diffHours < 24) {
      return `${diffHours}時間前`;
    } else {
      return date.toLocaleDateString('ja-JP');
    }
  };

  const styles = {
    container: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#f8fafc'
    },
    header: {
      padding: '20px 24px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e7eb'
    },
    headerTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '4px'
    },
    headerSubtitle: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '20px'
    },
    viewSwitcher: {
      display: 'flex',
      marginBottom: '20px',
      backgroundColor: '#f3f4f6',
      borderRadius: '8px',
      padding: '2px'
    },
    viewButton: {
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
    viewButtonActive: {
      backgroundColor: '#3b82f6',
      color: 'white',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
    },
    statsAndFilters: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      flexWrap: 'wrap',
      gap: '16px'
    },
    statsContainer: {
      display: 'flex',
      gap: '24px'
    },
    statItem: {
      textAlign: 'center'
    },
    statNumber: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1f2937',
      lineHeight: '1'
    },
    statLabel: {
      fontSize: '12px',
      color: '#6b7280',
      marginTop: '2px'
    },
    pendingBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      backgroundColor: '#fef3c7',
      color: '#92400e',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '600'
    },
    filterContainer: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center'
    },
    filterSelect: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: 'white'
    },
    loadingContainer: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
      color: '#6b7280'
    },
    emptyContainer: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      color: '#6b7280',
      fontSize: '16px'
    },
    revisionsList: {
      flex: 1,
      padding: '20px',
      overflow: 'auto'
    },
    revisionCard: {
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px',
      transition: 'all 0.2s'
    },
    revisionHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '8px'
    },
    revisionTypeInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    revisionIcon: {
      fontSize: '16px'
    },
    revisionType: {
      fontSize: '14px',
      fontWeight: '600'
    },
    revisionTime: {
      fontSize: '12px',
      color: '#6b7280'
    },
    revisionContent: {
      fontSize: '14px',
      color: '#374151',
      lineHeight: '1.5',
      marginBottom: '8px'
    },
    revisionMeta: {
      display: 'flex',
      gap: '16px',
      fontSize: '12px',
      color: '#6b7280'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerTitle}>📝 TLwiki 管理画面</div>
        <div style={styles.headerSubtitle}>
          コミュニティによる編集の管理と承認
        </div>
        
        {/* ビュー切り替え */}
        <div style={styles.viewSwitcher}>
          <button
            onClick={() => setCurrentView('activity')}
            style={{
              ...styles.viewButton,
              ...(currentView === 'activity' ? styles.viewButtonActive : {})
            }}
          >
            📊 更新履歴
          </button>
          <button
            onClick={() => setCurrentView('approval')}
            style={{
              ...styles.viewButton,
              ...(currentView === 'approval' ? styles.viewButtonActive : {})
            }}
          >
            ⚖️ 承認管理
            {pendingCount > 0 && (
              <span style={styles.pendingBadge}>
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* 更新履歴ビューのフィルター */}
        {currentView === 'activity' && (
          <div style={styles.statsAndFilters}>
            {/* 統計情報 */}
            <div style={styles.statsContainer}>
              <div style={styles.statItem}>
                <div style={styles.statNumber}>{stats.total}</div>
                <div style={styles.statLabel}>総更新数</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statNumber}>{stats.pending}</div>
                <div style={styles.statLabel}>承認待ち</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statNumber}>{stats.approved}</div>
                <div style={styles.statLabel}>承認済み</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statNumber}>{stats.rejected}</div>
                <div style={styles.statLabel}>却下済み</div>
              </div>
            </div>
            
            {/* フィルター */}
            <div style={styles.filterContainer}>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="1h">1時間</option>
                <option value="24h">24時間</option>
                <option value="7d">7日間</option>
                <option value="30d">30日間</option>
                <option value="all">全期間</option>
              </select>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="all">すべて</option>
                <option value="events">イベント作成</option>
                <option value="edits">編集</option>
                <option value="pending">承認待ち</option>
                <option value="approvals">承認・却下</option>
              </select>
            </div>
          </div>
        )}
      </div>
      
      {/* メインコンテンツ */}
      {currentView === 'approval' ? (
        <ApprovalSystem 
          user={user} 
          wikiData={wikiData}
        />
      ) : (
        /* 更新履歴表示 */
        loading ? (
          <div style={styles.loadingContainer}>
            📊 更新履歴を読み込み中...
          </div>
        ) : filteredRevisions.length === 0 ? (
          <div style={styles.emptyContainer}>
            <div>📭</div>
            <div>表示する更新履歴がありません</div>
            <div style={{ fontSize: '14px' }}>
              フィルターを変更するか、時間範囲を広げてみてください
            </div>
          </div>
        ) : (
          <div style={styles.revisionsList}>
            {filteredRevisions.map((revision, index) => {
              const typeInfo = getRevisionTypeInfo(revision.type || 'event_update');
              
              return (
                <div
                  key={revision.rev_id || index}
                  style={styles.revisionCard}
                  onMouseEnter={(e) => e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'}
                  onMouseLeave={(e) => e.target.style.boxShadow = 'none'}
                >
                  <div style={styles.revisionHeader}>
                    <div style={styles.revisionTypeInfo}>
                      <span style={{ ...styles.revisionIcon, color: typeInfo.color }}>
                        {typeInfo.icon}
                      </span>
                      <span style={{ ...styles.revisionType, color: typeInfo.color }}>
                        {typeInfo.label}
                      </span>
                      
                      {/* 承認状態表示 */}
                      {revision.approval_status && (
                        <span style={{
                          marginLeft: '8px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500',
                          backgroundColor: {
                            pending: '#fef3c7',
                            approved: '#d1fae5',
                            rejected: '#fee2e2',
                            auto_approved: '#ede9fe'
                          }[revision.approval_status] || '#f3f4f6',
                          color: {
                            pending: '#92400e',
                            approved: '#166534',
                            rejected: '#dc2626',
                            auto_approved: '#7c3aed'
                          }[revision.approval_status] || '#6b7280'
                        }}>
                          {{
                            pending: '⏳ 承認待ち',
                            approved: '✅ 承認済み',
                            rejected: '❌ 却下済み',
                            auto_approved: '🤖 自動承認'
                          }[revision.approval_status]}
                        </span>
                      )}
                    </div>
                    
                    <span style={styles.revisionTime}>
                      {getRelativeTime(revision.created_at)}
                    </span>
                  </div>
                  
                  <div style={styles.revisionContent}>
                    <strong>{revision.data?.title || revision.events?.title || '無題'}</strong>
                    {revision.data?.description && (
                      <div style={{ marginTop: '4px', fontSize: '13px', color: '#6b7280' }}>
                        {revision.data.description.length > 100 
                          ? revision.data.description.substring(0, 100) + '...'
                          : revision.data.description
                        }
                      </div>
                    )}
                  </div>
                  
                  <div style={styles.revisionMeta}>
                    <span>
                      編集者: {revision.profiles?.display_name || revision.profiles?.username || '匿名'}
                    </span>
                    <span>👍 {revision.upvotes || 0}</span>
                    <span>⚠️ {revision.reports || 0}</span>
                    <span>📊 {revision.stable_score?.toFixed(1) || '0.0'}</span>
                    {revision.approval_status === 'approved' && revision.approved_by && (
                      <span>承認者: {revision.approved_by}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};

export default RevisionTab;