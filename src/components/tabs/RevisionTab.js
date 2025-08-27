// src/components/tabs/RevisionTab.js
import React, { useState, useEffect, useMemo } from 'react';
import { SearchPanel } from '../ui/SearchPanel';
import { TimelineCard } from '../ui/TimelineCard';
import { EventGroupIcon, GroupTooltip, GroupCard } from '../ui/EventGroup';

const RevisionTab = ({
  wikiData,
  user,
  isWikiMode,
  showRevisionHistory = true
}) => {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all', 'events', 'approvals', 'edits'
  const [timeRange, setTimeRange] = useState('week'); // 'day', 'week', 'month', 'all'
  
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
  
  // 更新履歴を取得
  useEffect(() => {
    if (!wikiData || !showRevisionHistory) return;
    
    const loadRevisions = async () => {
      setLoading(true);
      try {
        // wikiData.getRecentRevisions() などのAPIを呼び出し
        const recentRevisions = await wikiData.getRecentRevisions?.({ 
          limit: 100,
          timeRange 
        }) || [];
        
        setRevisions(recentRevisions);
      } catch (error) {
        console.error('Failed to load revisions:', error);
        setRevisions([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadRevisions();
  }, [wikiData, timeRange, showRevisionHistory]);
  
  // フィルタリングされた更新履歴
  const filteredRevisions = useMemo(() => {
    let filtered = revisions;
    
    // タイプ別フィルタ
    if (filterType !== 'all') {
      filtered = filtered.filter(revision => {
        switch (filterType) {
          case 'events':
            return revision.type === 'event_create' || revision.type === 'event_update';
          case 'approvals':
            return revision.type === 'approval' || revision.type === 'rejection';
          case 'edits':
            return revision.type === 'event_update' || revision.type === 'event_edit';
          default:
            return true;
        }
      });
    }
    
    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [revisions, filterType]);
  
  // 統計情報
  const stats = useMemo(() => {
    const now = new Date();
    const timeRanges = {
      day: 1,
      week: 7,
      month: 30,
      all: Infinity
    };
    
    const daysBack = timeRanges[timeRange];
    const cutoff = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    
    const recentRevisions = revisions.filter(r => 
      new Date(r.created_at) >= cutoff
    );
    
    return {
      total: recentRevisions.length,
      events: recentRevisions.filter(r => r.type === 'event_create').length,
      updates: recentRevisions.filter(r => r.type === 'event_update').length,
      approvals: recentRevisions.filter(r => r.type === 'approval').length,
      contributors: new Set(recentRevisions.map(r => r.user_id)).size
    };
  }, [revisions, timeRange]);
  
  // 更新タイプのアイコンとラベル
  const getRevisionTypeInfo = (type) => {
    const typeMap = {
      event_create: { icon: '➕', label: 'イベント作成', color: '#10b981' },
      event_update: { icon: '✏️', label: 'イベント編集', color: '#3b82f6' },
      event_delete: { icon: '🗑️', label: 'イベント削除', color: '#ef4444' },
      approval: { icon: '✅', label: '承認', color: '#10b981' },
      rejection: { icon: '❌', label: '却下', color: '#ef4444' },
      vote_upvote: { icon: '👍', label: '賛成票', color: '#10b981' },
      vote_report: { icon: '⚠️', label: '報告', color: '#f59e0b' },
      revert: { icon: '↶', label: '差し戻し', color: '#6b7280' }
    };
    
    return typeMap[type] || { icon: '📝', label: '更新', color: '#6b7280' };
  };
  
  // 時間の相対表示
  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'たった今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    
    return date.toLocaleDateString('ja-JP');
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
      padding: '20px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e7eb'
    },
    headerTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '8px'
    },
    headerSubtitle: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '16px'
    },
    
    // 統計とフィルター
    statsAndFilters: {
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      flexWrap: 'wrap'
    },
    statsContainer: {
      display: 'flex',
      gap: '16px'
    },
    statItem: {
      textAlign: 'center'
    },
    statNumber: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#1f2937'
    },
    statLabel: {
      fontSize: '12px',
      color: '#6b7280',
      marginTop: '2px'
    },
    
    // フィルター
    filterContainer: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center'
    },
    filterSelect: {
      padding: '6px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      backgroundColor: '#ffffff',
      fontSize: '14px'
    },
    
    // 更新リスト
    revisionList: {
      flex: 1,
      overflow: 'auto',
      backgroundColor: '#ffffff'
    },
    revisionItem: {
      padding: '16px 20px',
      borderBottom: '1px solid #f3f4f6',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    revisionIcon: {
      fontSize: '16px',
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
      flexShrink: 0
    },
    revisionContent: {
      flex: 1
    },
    revisionHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '4px'
    },
    revisionType: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#1f2937'
    },
    revisionUser: {
      fontSize: '13px',
      color: '#6b7280'
    },
    revisionTime: {
      fontSize: '12px',
      color: '#9ca3af',
      marginLeft: 'auto'
    },
    revisionDescription: {
      fontSize: '14px',
      color: '#374151',
      marginBottom: '8px'
    },
    revisionMeta: {
      display: 'flex',
      gap: '12px',
      fontSize: '12px',
      color: '#6b7280'
    },
    
    // ローディングとエンプティ状態
    loadingContainer: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#6b7280'
    },
    emptyContainer: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#6b7280',
      gap: '12px'
    }
  };
  
  return (
    <div style={styles.container}>
      {/* ヘッダー */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>📝 TLwiki 更新履歴</div>
        <div style={styles.headerSubtitle}>
          コミュニティによるイベント情報の更新を追跡
        </div>
        
        <div style={styles.statsAndFilters}>
          {/* 統計情報 */}
          <div style={styles.statsContainer}>
            <div style={styles.statItem}>
              <div style={styles.statNumber}>{stats.total}</div>
              <div style={styles.statLabel}>総更新数</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statNumber}>{stats.events}</div>
              <div style={styles.statLabel}>新規イベント</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statNumber}>{stats.updates}</div>
              <div style={styles.statLabel}>編集</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statNumber}>{stats.contributors}</div>
              <div style={styles.statLabel}>貢献者</div>
            </div>
          </div>
          
          {/* フィルター */}
          <div style={styles.filterContainer}>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="day">今日</option>
              <option value="week">今週</option>
              <option value="month">今月</option>
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
              <option value="approvals">承認・却下</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* 更新リスト */}
      {loading ? (
        <div style={styles.loadingContainer}>
          読み込み中...
        </div>
      ) : filteredRevisions.length === 0 ? (
        <div style={styles.emptyContainer}>
          <div style={{ fontSize: '48px' }}>📝</div>
          <div>更新履歴がありません</div>
          <div style={{ fontSize: '14px', textAlign: 'center', maxWidth: '300px' }}>
            選択した期間・フィルターに該当する更新がありませんでした
          </div>
        </div>
      ) : (
        <div style={styles.revisionList}>
          {filteredRevisions.map((revision, index) => {
            const typeInfo = getRevisionTypeInfo(revision.type);
            
            return (
              <div
                key={revision.id || index}
                style={styles.revisionItem}
                onClick={() => setSelectedRevision(revision)}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                {/* アイコン */}
                <div 
                  style={{
                    ...styles.revisionIcon,
                    backgroundColor: typeInfo.color
                  }}
                >
                  {typeInfo.icon}
                </div>
                
                {/* コンテンツ */}
                <div style={styles.revisionContent}>
                  <div style={styles.revisionHeader}>
                    <span style={styles.revisionType}>{typeInfo.label}</span>
                    <span style={styles.revisionUser}>
                      by {revision.user_name || revision.user_email?.split('@')[0] || '匿名'}
                    </span>
                    <span style={styles.revisionTime}>
                      {getRelativeTime(revision.created_at)}
                    </span>
                  </div>
                  
                  <div style={styles.revisionDescription}>
                    {revision.event_title && (
                      <strong>"{revision.event_title}"</strong>
                    )}
                    {revision.description || revision.summary || 
                      `${typeInfo.label}を実行しました`
                    }
                  </div>
                  
                  <div style={styles.revisionMeta}>
                    {revision.event_id && (
                      <span>イベントID: {revision.event_id}</span>
                    )}
                    {revision.score && (
                      <span>スコア: {revision.score > 0 ? '+' : ''}{revision.score}</span>
                    )}
                    {revision.vote_count && (
                      <span>{revision.vote_count}票</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* 詳細モーダル（選択された更新の詳細） */}
      {selectedRevision && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            margin: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                更新詳細
              </h3>
              <button
                onClick={() => setSelectedRevision(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
              <p><strong>タイプ:</strong> {getRevisionTypeInfo(selectedRevision.type).label}</p>
              <p><strong>実行者:</strong> {selectedRevision.user_name || selectedRevision.user_email || '匿名'}</p>
              <p><strong>実行時刻:</strong> {new Date(selectedRevision.created_at).toLocaleString('ja-JP')}</p>
              
              {selectedRevision.event_title && (
                <p><strong>対象イベント:</strong> {selectedRevision.event_title}</p>
              )}
              
              {selectedRevision.description && (
                <div>
                  <strong>詳細:</strong>
                  <div style={{ 
                    marginTop: '8px',
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedRevision.description}
                  </div>
                </div>
              )}
              
              {/* 変更差分がある場合 */}
              {selectedRevision.diff && (
                <div>
                  <strong>変更内容:</strong>
                  <div style={{ 
                    marginTop: '8px',
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedRevision.diff}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevisionTab;