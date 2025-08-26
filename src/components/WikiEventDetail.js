// src/components/WikiEventDetail.js
import React, { useState, useEffect, useCallback } from 'react';
import WikiRevisionForm from './WikiRevisionForm';
import WikiRevisionDiff from './WikiRevisionDiff';

const WikiEventDetail = ({ 
  eventId, 
  slug, 
  user, 
  onBack,
  supabaseClient 
}) => {
  const [currentTab, setCurrentTab] = useState('stable'); // 'stable' | 'latest' | 'history'
  const [stableVersion, setStableVersion] = useState(null);
  const [latestRevision, setLatestRevision] = useState(null);
  const [revisionHistory, setRevisionHistory] = useState([]);
  const [revisionScores, setRevisionScores] = useState(new Map());
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [showDiff, setShowDiff] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // データ読み込み
  const loadEventData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 安定版の取得
      const { data: stable, error: stableError } = await supabaseClient
        .from('event_stable')
        .select('*')
        .or(`event_id.eq.${eventId},slug.eq.${slug}`)
        .single();

      if (stableError && stableError.code !== 'PGRST116') {
        throw stableError;
      }

      setStableVersion(stable);

      if (stable) {
        // リビジョン履歴の取得
        const { data: revisions, error: revisionsError } = await supabaseClient
          .from('event_revisions')
          .select(`
            *,
            editor:profiles!event_revisions_editor_uid_fkey(username, display_name)
          `)
          .eq('event_id', stable.event_id)
          .order('created_at', { ascending: false });

        if (revisionsError) throw revisionsError;

        setRevisionHistory(revisions || []);
        setLatestRevision(revisions?.[0] || null);

        // スコア情報の取得
        const { data: scores, error: scoresError } = await supabaseClient
          .from('revision_scores')
          .select('*')
          .eq('event_id', stable.event_id);

        if (!scoresError && scores) {
          const scoreMap = new Map();
          scores.forEach(score => {
            scoreMap.set(score.revision_id, score);
          });
          setRevisionScores(scoreMap);
        }
      }
    } catch (err) {
      console.error('データ読み込みエラー:', err);
      setError(err.message || 'データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [eventId, slug, supabaseClient]);

  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  // 投票処理
  const handleVote = async (revisionId, kind) => {
    if (!user) {
      alert('投票するにはログインが必要です');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/rev.vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseClient.auth.session()?.access_token}`,
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          revision_id: revisionId,
          kind: kind
        })
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          alert(result.message || '既に投票済みです');
          return;
        }
        if (response.status === 403) {
          alert(result.message || '自分の編集には投票できません');
          return;
        }
        throw new Error(result.error || 'Failed to vote');
      }

      // スコアを更新
      setRevisionScores(prev => {
        const newScores = new Map(prev);
        newScores.set(revisionId, result.current_scores);
        return newScores;
      });

      alert(result.message);

      // データを再読み込みして最新状態を反映
      loadEventData();
    } catch (error) {
      console.error('投票エラー:', error);
      alert('投票に失敗しました: ' + error.message);
    }
  };

  // リバート処理
  const handleRevert = async (revisionId) => {
    if (!user) {
      alert('リバートするにはログインが必要です');
      return;
    }

    if (!window.confirm('この版に戻しますか？新しいリビジョンとして作成されます。')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/rev.revert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseClient.auth.session()?.access_token}`,
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          revision_id: revisionId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to revert');
      }

      alert(result.message);
      
      // データを再読み込み
      loadEventData();
      
      // 最新タブに切り替え
      setCurrentTab('latest');
    } catch (error) {
      console.error('リバートエラー:', error);
      alert('リバートに失敗しました: ' + error.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  const getScoreInfo = (revisionId) => {
    const score = revisionScores.get(revisionId);
    return score || { upvotes: 0, reports: 0, stable_score: 0 };
  };

  const styles = {
    container: {
      padding: '20px',
      backgroundColor: 'white',
      height: 'calc(100vh - 64px)',
      overflow: 'auto'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      paddingBottom: '16px',
      borderBottom: '2px solid #e5e7eb'
    },
    backButton: {
      padding: '8px 16px',
      backgroundColor: '#6b7280',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px'
    },
    editButton: {
      padding: '8px 16px',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      marginLeft: '8px'
    },
    tabContainer: {
      display: 'flex',
      borderBottom: '2px solid #e5e7eb',
      marginBottom: '20px'
    },
    tab: {
      padding: '12px 20px',
      border: 'none',
      backgroundColor: 'transparent',
      color: '#6b7280',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      borderBottom: '2px solid transparent'
    },
    tabActive: {
      borderBottom: '2px solid #3b82f6',
      color: '#3b82f6'
    },
    content: {
      backgroundColor: '#f9fafb',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '20px'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: '8px'
    },
    dateRange: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '16px'
    },
    description: {
      fontSize: '16px',
      lineHeight: '1.6',
      color: '#374151',
      marginBottom: '16px'
    },
    tagsContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginBottom: '16px'
    },
    tag: {
      padding: '4px 8px',
      backgroundColor: '#dbeafe',
      color: '#1e40af',
      fontSize: '12px',
      borderRadius: '12px',
      fontWeight: '500'
    },
    sourcesContainer: {
      marginBottom: '16px'
    },
    sourceLink: {
      color: '#3b82f6',
      textDecoration: 'none',
      display: 'block',
      marginBottom: '4px'
    },
    revisionList: {
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    },
    revisionItem: {
      padding: '16px',
      borderBottom: '1px solid #f3f4f6',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    revisionInfo: {
      flex: 1
    },
    revisionTitle: {
      fontWeight: '600',
      fontSize: '14px',
      color: '#374151',
      marginBottom: '4px'
    },
    revisionMeta: {
      fontSize: '12px',
      color: '#6b7280',
      marginBottom: '8px'
    },
    scoreInfo: {
      display: 'flex',
      gap: '12px',
      fontSize: '12px'
    },
    scoreItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    actionButtons: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center'
    },
    voteButton: {
      padding: '6px 12px',
      border: 'none',
      borderRadius: '4px',
      fontSize: '12px',
      cursor: 'pointer',
      fontWeight: '500'
    },
    upvoteButton: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    reportButton: {
      backgroundColor: '#ef4444',
      color: 'white'
    },
    revertButton: {
      backgroundColor: '#f59e0b',
      color: 'white'
    },
    diffButton: {
      backgroundColor: '#6b7280',
      color: 'white'
    },
    loadingMessage: {
      textAlign: 'center',
      padding: '40px',
      color: '#6b7280'
    },
    errorMessage: {
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '20px'
    },
    stableIndicator: {
      backgroundColor: '#10b981',
      color: 'white',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '500',
      marginLeft: '8px'
    },
    licenseInfo: {
      fontSize: '12px',
      color: '#9ca3af',
      fontStyle: 'italic'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingMessage}>読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorMessage}>
          エラー: {error}
        </div>
        <button onClick={onBack} style={styles.backButton}>
          ← 戻る
        </button>
      </div>
    );
  }

  if (!stableVersion) {
    return (
      <div style={styles.container}>
        <div style={styles.errorMessage}>
          イベントが見つかりませんでした
        </div>
        <button onClick={onBack} style={styles.backButton}>
          ← 戻る
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* ヘッダー */}
      <div style={styles.header}>
        <div>
          <button onClick={onBack} style={styles.backButton}>
            ← 一覧に戻る
          </button>
          {user && (
            <button
              onClick={() => setShowEditForm(true)}
              style={styles.editButton}
            >
              ✏️ 編集
            </button>
          )}
        </div>
      </div>

      {/* タブ */}
      <div style={styles.tabContainer}>
        <button
          onClick={() => setCurrentTab('stable')}
          style={{
            ...styles.tab,
            ...(currentTab === 'stable' ? styles.tabActive : {})
          }}
        >
          📋 安定版
        </button>
        <button
          onClick={() => setCurrentTab('latest')}
          style={{
            ...styles.tab,
            ...(currentTab === 'latest' ? styles.tabActive : {})
          }}
        >
          🔄 最新版
        </button>
        <button
          onClick={() => setCurrentTab('history')}
          style={{
            ...styles.tab,
            ...(currentTab === 'history' ? styles.tabActive : {})
          }}
        >
          📚 編集履歴 ({revisionHistory.length})
        </button>
      </div>

      {/* メインコンテンツ */}
      {currentTab === 'stable' && (
        <div style={styles.content}>
          <h1 style={styles.title}>
            {stableVersion.title}
            <span style={styles.stableIndicator}>安定版</span>
          </h1>
          <div style={styles.dateRange}>
            {formatDate(stableVersion.date_start)}
            {stableVersion.date_start !== stableVersion.date_end && 
              ` - ${formatDate(stableVersion.date_end)}`
            }
          </div>
          <p style={styles.description}>
            {stableVersion.description}
          </p>
          {stableVersion.tags && stableVersion.tags.length > 0 && (
            <div style={styles.tagsContainer}>
              {stableVersion.tags.map((tag, index) => (
                <span key={index} style={styles.tag}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {stableVersion.sources && stableVersion.sources.length > 0 && (
            <div style={styles.sourcesContainer}>
              <strong>参考資料:</strong>
              {stableVersion.sources.map((source, index) => (
                <a
                  key={index}
                  href={source}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.sourceLink}
                >
                  {source}
                </a>
              ))}
            </div>
          )}
          <div style={styles.licenseInfo}>
            ライセンス: {stableVersion.license || 'CC-BY-SA-4.0'}
          </div>
        </div>
      )}

      {currentTab === 'latest' && latestRevision && (
        <div style={styles.content}>
          <h1 style={styles.title}>
            {latestRevision.title}
            <span style={{ ...styles.stableIndicator, backgroundColor: '#f59e0b' }}>
              最新版
            </span>
          </h1>
          <div style={styles.dateRange}>
            {formatDate(latestRevision.date_start)}
            {latestRevision.date_start !== latestRevision.date_end && 
              ` - ${formatDate(latestRevision.date_end)}`
            }
          </div>
          <p style={styles.description}>
            {latestRevision.description}
          </p>
          {latestRevision.tags && latestRevision.tags.length > 0 && (
            <div style={styles.tagsContainer}>
              {latestRevision.tags.map((tag, index) => (
                <span key={index} style={styles.tag}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {latestRevision.sources && latestRevision.sources.length > 0 && (
            <div style={styles.sourcesContainer}>
              <strong>参考資料:</strong>
              {latestRevision.sources.map((source, index) => (
                <a
                  key={index}
                  href={source}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.sourceLink}
                >
                  {source}
                </a>
              ))}
            </div>
          )}
          <div style={styles.licenseInfo}>
            ライセンス: {latestRevision.license || 'CC-BY-SA-4.0'}
          </div>
        </div>
      )}

      {currentTab === 'history' && (
        <div style={styles.revisionList}>
          {revisionHistory.map((revision, index) => {
            const scoreInfo = getScoreInfo(revision.id);
            const isStable = revision.id === stableVersion.stable_revision_id;

            return (
              <div key={revision.id} style={styles.revisionItem}>
                <div style={styles.revisionInfo}>
                  <div style={styles.revisionTitle}>
                    {revision.title}
                    {isStable && <span style={styles.stableIndicator}>安定版</span>}
                  </div>
                  <div style={styles.revisionMeta}>
                    編集者: {revision.editor?.display_name || revision.editor?.username || '不明'} • 
                    {formatDateTime(revision.created_at)}
                  </div>
                  <div style={styles.scoreInfo}>
                    <div style={styles.scoreItem}>
                      <span>👍</span>
                      <span>{scoreInfo.upvotes}</span>
                    </div>
                    <div style={styles.scoreItem}>
                      <span>⚠️</span>
                      <span>{scoreInfo.reports}</span>
                    </div>
                    <div style={styles.scoreItem}>
                      <span>📊</span>
                      <span>{scoreInfo.stable_score.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <div style={styles.actionButtons}>
                  {user && (
                    <>
                      <button
                        onClick={() => handleVote(revision.id, 'upvote')}
                        style={{ ...styles.voteButton, ...styles.upvoteButton }}
                      >
                        👍 賛成
                      </button>
                      <button
                        onClick={() => handleVote(revision.id, 'report')}
                        style={{ ...styles.voteButton, ...styles.reportButton }}
                      >
                        ⚠️ 問題報告
                      </button>
                      {!isStable && index !== 0 && (
                        <button
                          onClick={() => handleRevert(revision.id)}
                          style={{ ...styles.voteButton, ...styles.revertButton }}
                        >
                          ↶ この版に戻す
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => {
                      setSelectedRevision(revision);
                      setShowDiff(true);
                    }}
                    style={{ ...styles.voteButton, ...styles.diffButton }}
                  >
                    📄 差分表示
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 編集フォーム */}
      {showEditForm && (
        <WikiRevisionForm
          eventId={stableVersion.event_id}
          initialData={latestRevision || stableVersion}
          user={user}
          supabaseClient={supabaseClient}
          onSave={() => {
            setShowEditForm(false);
            loadEventData();
          }}
          onCancel={() => setShowEditForm(false)}
        />
      )}

      {/* 差分表示 */}
      {showDiff && selectedRevision && (
        <WikiRevisionDiff
          baseRevision={stableVersion}
          compareRevision={selectedRevision}
          onClose={() => {
            setShowDiff(false);
            setSelectedRevision(null);
          }}
        />
      )}
    </div>
  );
};

export default WikiEventDetail;