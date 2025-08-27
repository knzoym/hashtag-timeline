// src/components/tabs/RevisionTab.js - Wiki更新履歴システム
import React, { useState, useEffect, useMemo } from 'react';

const RevisionTab = ({
  wikiData,
  user,
  isWikiMode,
  showRevisionHistory = true
}) => {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [timeRange, setTimeRange] = useState('week');
  
  // 更新履歴を取得
  useEffect(() => {
    if (!wikiData || !showRevisionHistory || !isWikiMode) {
      setLoading(false);
      return;
    }
    
    const loadRevisions = async () => {
      setLoading(true);
      try {
        // モックデータ（実際のAPIに置き換える）
        const mockRevisions = [
          {
            id: '1',
            type: 'event_create',
            user_name: 'user123',
            user_email: 'user@example.com',
            event_title: '明治維新',
            description: '新しいイベントを作成しました',
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            score: 5,
            vote_count: 8
          },
          {
            id: '2',
            type: 'event_update',
            user_name: 'historian_a',
            user_email: 'historian@example.com',
            event_title: '第二次世界大戦',
            description: '開始日と終了日を正確な情報に修正',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            score: 3,
            vote_count: 5,
            diff: '- 開始日: 1939年\n+ 開始日: 1939年9月1日'
          },
          {
            id: '3',
            type: 'approval',
            user_name: 'moderator1',
            user_email: 'mod@example.com',
            event_title: 'ベルリンの壁崩壊',
            description: '編集内容を承認しました',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
            score: 2,
            vote_count: 3
          }
        ];
        
        setRevisions(mockRevisions);
      } catch (error) {
        console.error('Failed to load revisions:', error);
        setRevisions([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadRevisions();
  }, [wikiData, timeRange, showRevisionHistory, isWikiMode]);
  
  // フィルタリングされた更新履歴
  const filteredRevisions = useMemo(() => {
    let filtered = revisions;
    
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
    return {
      total: filteredRevisions.length,
      events: filteredRevisions.filter(r => r.type === 'event_create').length,
      updates: filteredRevisions.filter(r => r.type === 'event_update').length,
      approvals: filteredRevisions.filter(r => r.type === 'approval').length
    };
  }, [filteredRevisions]);
  
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
      rejection: { icon: '❌', label: '編集却下', color: '#dc2626' }
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
              <div style={styles.statNumber}>{stats.approvals}</div>
              <div style={styles.statLabel}>承認</div>
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
          📊 更新履歴を読み込み中...
        </div>
      ) : filteredRevisions.length === 0 ? (
        <div style={styles.emptyContainer}>
          <div style={{ fontSize: '48px' }}>📭</div>
          <div style={{ fontSize: '16px', fontWeight: '600' }}>更新履歴がありません</div>
          <div style={{ fontSize: '14px', textAlign: 'center' }}>
            選択された期間とフィルターに該当する更新がありません
          </div>
        </div>
      ) : (
        <div style={styles.revisionList}>
          {filteredRevisions.map((revision) => {
            const typeInfo = getRevisionTypeInfo(revision.type);
            
            return (
              <div
                key={revision.id}
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
                      by {revision.user_name || '匿名'}
                    </span>
                    <span style={styles.revisionTime}>
                      {getRelativeTime(revision.created_at)}
                    </span>
                  </div>
                  
                  {revision.event_title && (
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px'
                    }}>
                      📅 {revision.event_title}
                    </div>
                  )}
                  
                  <div style={styles.revisionDescription}>
                    {revision.description}
                  </div>
                  
                  <div style={styles.revisionMeta}>
                    {revision.score !== undefined && (
                      <span>スコア: {revision.score > 0 ? '+' : ''}{revision.score}</span>
                    )}
                    {revision.vote_count && (
                      <span>投票: {revision.vote_count}票</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* 詳細モーダル */}
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
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            margin: '20px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: '20px', 
                fontWeight: '700',
                color: '#1f2937'
              }}>
                {getRevisionTypeInfo(selectedRevision.type).icon} 更新詳細
              </h3>
              <button
                onClick={() => setSelectedRevision(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '12px' }}>
                <strong>タイプ:</strong> {getRevisionTypeInfo(selectedRevision.type).label}
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <strong>実行者:</strong> {selectedRevision.user_name || '匿名'}
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <strong>実行時刻:</strong> {new Date(selectedRevision.created_at).toLocaleString('ja-JP')}
              </div>
              
              {selectedRevision.event_title && (
                <div style={{ marginBottom: '12px' }}>
                  <strong>対象イベント:</strong> {selectedRevision.event_title}
                </div>
              )}
              
              {selectedRevision.description && (
                <div style={{ marginBottom: '12px' }}>
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
              
              {selectedRevision.diff && (
                <div style={{ marginBottom: '12px' }}>
                  <strong>変更内容:</strong>
                  <div style={{ 
                    marginTop: '8px',
                    padding: '12px',
                    backgroundColor: '#1f2937',
                    color: '#f9fafb',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    overflow: 'auto'
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