// src/components/wiki/VoteButtons.js - 投票関連コンポーネント統一版
import React, { useState } from 'react';

// 投票ボタンコンポーネント
export const VoteButtons = ({ 
  revisionId, 
  currentVotes = { upvotes: 0, reports: 0 }, 
  onVote, 
  disabled = false,
  hasVoted = { upvote: false, report: false }
}) => {
  const [voting, setVoting] = useState(false);

  const handleVote = async (kind) => {
    if (voting || disabled) return;

    setVoting(true);
    try {
      await onVote(revisionId, kind);
    } catch (error) {
      console.error('投票エラー:', error);
    } finally {
      setVoting(false);
    }
  };

  const styles = {
    container: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center'
    },
    voteButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '6px 12px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '500',
      cursor: disabled || voting ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s',
      opacity: disabled ? 0.5 : 1
    },
    upvoteButton: {
      backgroundColor: hasVoted.upvote ? '#10b981' : '#f3f4f6',
      color: hasVoted.upvote ? 'white' : '#374151'
    },
    reportButton: {
      backgroundColor: hasVoted.report ? '#ef4444' : '#f3f4f6',
      color: hasVoted.report ? 'white' : '#374151'
    },
    loadingButton: {
      backgroundColor: '#d1d5db',
      color: '#9ca3af'
    }
  };

  return (
    <div style={styles.container}>
      <button
        onClick={() => handleVote('upvote')}
        disabled={disabled || voting}
        style={{
          ...styles.voteButton,
          ...(voting ? styles.loadingButton : styles.upvoteButton)
        }}
        onMouseEnter={(e) => {
          if (!disabled && !voting && !hasVoted.upvote) {
            e.target.style.backgroundColor = '#e5e7eb';
          } else if (!disabled && !voting && hasVoted.upvote) {
            e.target.style.backgroundColor = '#059669';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !voting) {
            e.target.style.backgroundColor = hasVoted.upvote ? '#10b981' : '#f3f4f6';
          }
        }}
      >
        👍 {voting ? '...' : currentVotes.upvotes || 0}
      </button>
      
      <button
        onClick={() => handleVote('report')}
        disabled={disabled || voting}
        style={{
          ...styles.voteButton,
          ...(voting ? styles.loadingButton : styles.reportButton)
        }}
        onMouseEnter={(e) => {
          if (!disabled && !voting && !hasVoted.report) {
            e.target.style.backgroundColor = '#e5e7eb';
          } else if (!disabled && !voting && hasVoted.report) {
            e.target.style.backgroundColor = '#dc2626';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !voting) {
            e.target.style.backgroundColor = hasVoted.report ? '#ef4444' : '#f3f4f6';
          }
        }}
      >
        ⚠️ {voting ? '...' : currentVotes.reports || 0}
      </button>
    </div>
  );
};

// スコア表示コンポーネント
export const ScoreDisplay = ({ 
  score = 0, 
  upvotes = 0, 
  reports = 0, 
  isStable = false 
}) => {
  const getScoreColor = (score) => {
    if (score >= 3) return '#10b981'; // 緑
    if (score >= 1) return '#3b82f6'; // 青
    if (score >= -1) return '#6b7280'; // グレー
    return '#ef4444'; // 赤
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px' 
    }}>
      {/* メインスコア */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        backgroundColor: isStable ? '#dbeafe' : '#f3f4f6',
        borderRadius: '4px',
        border: isStable ? '1px solid #3b82f6' : '1px solid #e5e7eb'
      }}>
        <span style={{ color: getScoreColor(score), fontWeight: '600' }}>
          {score > 0 ? '+' : ''}{score.toFixed(1)}
        </span>
        {isStable && <span style={{ color: '#3b82f6' }}>安定版</span>}
      </div>

      {/* 詳細スコア */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px',
        color: '#6b7280'
      }}>
        <span>👍 {upvotes}</span>
        <span>🚨 {reports}</span>
      </div>
    </div>
  );
};

// バージョン切り替えトグル
export const VersionToggle = ({
  stableCount = 0,
  latestCount = 0,
  currentMode = 'stable',
  onModeChange
}) => {
  const styles = {
    container: {
      display: 'flex',
      backgroundColor: '#f3f4f6',
      borderRadius: '8px',
      padding: '2px'
    },
    button: {
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
    activeButton: {
      backgroundColor: '#3b82f6',
      color: 'white',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
    }
  };

  return (
    <div style={styles.container}>
      <button
        onClick={() => onModeChange('stable')}
        style={{
          ...styles.button,
          ...(currentMode === 'stable' ? styles.activeButton : {})
        }}
      >
        安定版 ({stableCount})
      </button>
      <button
        onClick={() => onModeChange('latest')}
        style={{
          ...styles.button,
          ...(currentMode === 'latest' ? styles.activeButton : {})
        }}
      >
        最新版 ({latestCount})
      </button>
    </div>
  );
};

// リビジョン履歴表示コンポーネント
export const RevisionHistory = ({ 
  revisions, 
  currentRevisionId, 
  onRevisionSelect, 
  onRevert,
  canRevert = false 
}) => {
  if (!revisions || revisions.length === 0) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: '#6b7280' 
      }}>
        履歴がありません
      </div>
    );
  }

  return (
    <div style={{ maxHeight: '400px', overflow: 'auto' }}>
      {revisions.map((revision, index) => {
        const isSelected = revision.rev_id === currentRevisionId;
        const isLatest = index === 0;

        return (
          <div
            key={revision.rev_id}
            onClick={() => onRevisionSelect(revision)}
            style={{
              padding: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              marginBottom: '8px',
              cursor: 'pointer',
              backgroundColor: isSelected ? '#dbeafe' : '#f9fafb',
              borderColor: isSelected ? '#3b82f6' : '#e5e7eb',
              transition: 'all 0.2s'
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
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: '8px'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  {revision.data?.title || 'タイトルなし'}
                  {isLatest && (
                    <span style={{
                      marginLeft: '8px',
                      fontSize: '11px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      最新
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  {new Date(revision.created_at).toLocaleString('ja-JP')} • 
                  {revision.profiles?.display_name || revision.profiles?.username || '匿名'}
                </div>
              </div>
              
              <ScoreDisplay 
                score={revision.stable_score || 0}
                upvotes={revision.upvotes || 0}
                reports={revision.reports || 0}
                isStable={false}
              />
            </div>
            
            {/* 操作ボタン */}
            {canRevert && !isLatest && (
              <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onRevert) {
                      onRevert(revision.rev_id);
                    }
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  この版に戻す
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};