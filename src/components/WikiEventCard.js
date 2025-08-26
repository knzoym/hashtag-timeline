// src/components/WikiEventCard.js の投票機能付き拡張版
import React, { useState, useEffect } from 'react';
import { VoteButtons, ScoreDisplay, RevisionHistory } from './VotingComponents';

const WikiEventCard = ({ 
  event, 
  onImport, 
  onEdit, 
  canEdit, 
  wikiData, 
  user,
  showRevisions = false 
}) => {
  const [revisions, setRevisions] = useState([]);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [userVotes, setUserVotes] = useState({ upvote: false, report: false });
  const [loading, setLoading] = useState(false);

  // 投票関数を取得
  const { voteOnRevision, getEventRevisions, revertRevision } = wikiData;

  // リビジョン履歴を取得
  useEffect(() => {
    if (showRevisions && event.id) {
      loadRevisions();
    }
  }, [event.id, showRevisions]);

  const loadRevisions = async () => {
    const revisionData = await getEventRevisions(event.id);
    setRevisions(revisionData);
    if (revisionData.length > 0) {
      setSelectedRevision(revisionData[0]); // 最新版を選択
    }
  };

  // ユーザーの投票状態を確認（実装簡略化）
  useEffect(() => {
    // 実際の実装では、ユーザーがすでに投票しているかをチェック
    // ここでは仮実装
    setUserVotes({ upvote: false, report: false });
  }, [user, selectedRevision]);

  // 投票処理
  const handleVote = async (revisionId, kind) => {
    if (!user) {
      alert('投票するにはログインが必要です');
      return;
    }

    setLoading(true);
    try {
      const result = await voteOnRevision(revisionId, kind);
      if (result) {
        // 投票成功後、リビジョン情報を更新
        await loadRevisions();
        
        // ユーザーの投票状態を更新
        setUserVotes(prev => ({
          ...prev,
          [kind]: true
        }));

        // 成功メッセージ
        const message = kind === 'upvote' ? '良い編集として投票しました' : '問題を報告しました';
        // 簡易的な通知（実際のプロジェクトではより良いUI使用）
        alert(message);
      }
    } catch (error) {
      alert('投票に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // リバート処理
  const handleRevert = async (revisionId) => {
    if (!user) {
      alert('リバートするにはログインが必要です');
      return;
    }

    if (!window.confirm('この版に戻しますか？')) {
      return;
    }

    setLoading(true);
    try {
      const result = await revertRevision(revisionId);
      if (result) {
        await loadRevisions();
        alert('版を戻しました');
      }
    } catch (error) {
      alert('リバートに失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 表示用データ（安定版またはイベントデータ）
  const displayData = selectedRevision?.data || event;
  const currentRevision = selectedRevision || { 
    upvotes: event.upvotes || 0, 
    reports: event.reports || 0, 
    stable_score: event.stable_score || 0,
    rev_id: event.stable_revision_id
  };

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
    titleContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '8px'
    },
    titleLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flex: 1
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
      marginBottom: '12px'
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
      gap: '8px',
      alignItems: 'center',
      flexWrap: 'wrap'
    },
    button: {
      padding: '6px 12px',
      border: 'none',
      borderRadius: '4px',
      fontSize: '12px',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'background-color 0.2s'
    },
    importButton: {
      backgroundColor: '#3b82f6',
      color: 'white'
    },
    editButton: {
      backgroundColor: '#f59e0b',
      color: 'white'
    },
    historyButton: {
      backgroundColor: '#6b7280',
      color: 'white'
    },
    disabledButton: {
      backgroundColor: '#9ca3af',
      cursor: 'not-allowed'
    },
    divider: {
      height: '1px',
      backgroundColor: '#e5e7eb',
      margin: '12px 0'
    }
  };

  return (
    <div 
      style={styles.card}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* タイトル部分 */}
      <div style={styles.titleContainer}>
        <div style={styles.titleLeft}>
          <h3 style={styles.title}>{displayData.title}</h3>
          <span style={styles.year}>
            {formatDate(displayData.date_start || displayData.start_date)}年
          </span>
        </div>
        
        {/* スコア表示 */}
        <ScoreDisplay 
          score={currentRevision.stable_score}
          upvotes={currentRevision.upvotes}
          reports={currentRevision.reports}
          isStable={!showRevisions || selectedRevision === revisions[0]}
        />
      </div>
      
      {/* 説明文 */}
      {displayData.description && (
        <p style={styles.description}>
          {displayData.description}
        </p>
      )}
      
      {/* タグ */}
      {displayData.tags && displayData.tags.length > 0 && (
        <div style={styles.tagsContainer}>
          {displayData.tags.map(tag => (
            <span key={tag} style={styles.tag}>
              #{tag}
            </span>
          ))}
        </div>
      )}
      
      {/* メタデータ */}
      <div style={styles.metadata}>
        <span>編集回数: {event.edit_count || 1}</span>
        <span>最終更新: {new Date(event.updated_at).toLocaleDateString('ja-JP')}</span>
        <span>
          作成者: {event.profiles?.display_name || event.profiles?.username || '匿名'}
        </span>
      </div>

      <div style={styles.divider}></div>

      {/* 投票ボタン */}
      {currentRevision.rev_id && (
        <div style={{ marginBottom: '12px' }}>
          <VoteButtons 
            revisionId={currentRevision.rev_id}
            currentVotes={{
              upvotes: currentRevision.upvotes,
              reports: currentRevision.reports
            }}
            onVote={handleVote}
            disabled={loading || !user}
            hasVoted={userVotes}
          />
        </div>
      )}
      
      {/* アクションボタン */}
      <div style={styles.buttonContainer}>
        <button 
          style={{...styles.button, ...styles.importButton}}
          onClick={onImport}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
        >
          インポート
        </button>
        
        {onEdit && (
          <button 
            style={{
              ...styles.button,
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
            編集
          </button>
        )}

        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{...styles.button, ...styles.historyButton}}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#4b5563'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#6b7280'}
        >
          {showHistory ? '履歴を隠す' : '履歴を表示'}
        </button>

        {!user && (
          <span style={{ fontSize: '11px', color: '#6b7280' }}>
            投票・編集にはログインが必要です
          </span>
        )}
      </div>

      {/* 履歴表示 */}
      {showHistory && (
        <>
          <div style={styles.divider}></div>
          <div>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '14px', 
              fontWeight: '600',
              color: '#374151'
            }}>
              編集履歴
            </h4>
            <RevisionHistory 
              revisions={revisions}
              currentRevisionId={selectedRevision?.rev_id}
              onRevisionSelect={setSelectedRevision}
              onRevert={handleRevert}
              canRevert={user && canEdit}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default WikiEventCard;