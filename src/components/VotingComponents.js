// src/components/VotingComponents.js
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
    if (disabled || voting) return;
    
    setVoting(true);
    try {
      await onVote(revisionId, kind);
    } finally {
      setVoting(false);
    }
  };

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: disabled || voting ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    opacity: disabled ? 0.5 : 1
  };

  return (
    <div style={{ 
      display: 'flex', 
      gap: '8px', 
      alignItems: 'center',
      fontSize: '12px'
    }}>
      {/* Upvoteボタン */}
      <button
        onClick={() => handleVote('upvote')}
        disabled={disabled || voting}
        style={{
          ...buttonStyle,
          backgroundColor: hasVoted.upvote ? '#10b981' : '#f3f4f6',
          color: hasVoted.upvote ? 'white' : '#374151'
        }}
        title="この編集が良いと思う"
      >
        👍 {currentVotes.upvotes}
      </button>

      {/* Reportボタン */}
      <button
        onClick={() => handleVote('report')}
        disabled={disabled || voting}
        style={{
          ...buttonStyle,
          backgroundColor: hasVoted.report ? '#ef4444' : '#f3f4f6',
          color: hasVoted.report ? 'white' : '#374151'
        }}
        title="この編集に問題がある"
      >
        🚨 {currentVotes.reports}
      </button>

      {voting && (
        <span style={{ fontSize: '11px', color: '#6b7280' }}>
          投票中...
        </span>
      )}
    </div>
  );
};

// スコア表示コンポーネント
export const ScoreDisplay = ({ score, upvotes, reports, isStable = false }) => {
  const getScoreColor = (score) => {
    if (score >= 5) return '#10b981'; // 緑
    if (score >= 0) return '#f59e0b'; // 黄
    return '#ef4444'; // 赤
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px',
      fontSize: '12px'
    }}>
      {/* 総合スコア */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px',
        padding: '2px 6px',
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
                
                <div style={{ 
                  fontSize: '11px', 
                  color: '#6b7280',
                  marginBottom: '6px'
                }}>
                  編集者: {revision.profiles?.display_name || revision.profiles?.username || '匿名'} • 
                  {new Date(revision.created_at).toLocaleString('ja-JP')}
                </div>

                <ScoreDisplay 
                  score={revision.stable_score || 0}
                  upvotes={revision.upvotes || 0}
                  reports={revision.reports || 0}
                />
              </div>

              {canRevert && !isLatest && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRevert(revision.rev_id);
                  }}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  復元
                </button>
              )}
            </div>

            {revision.data?.description && (
              <div style={{ 
                fontSize: '12px', 
                color: '#374151',
                lineHeight: '1.4',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>
                {revision.data.description}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// 安定版/最新版切り替えコンポーネント
export const VersionToggle = ({ 
  currentView, 
  onViewChange, 
  stableCount, 
  latestCount 
}) => {
  const buttonStyle = {
    padding: '6px 12px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    borderRadius: '4px',
    transition: 'all 0.2s'
  };

  const activeStyle = {
    backgroundColor: '#3b82f6',
    color: 'white'
  };

  const inactiveStyle = {
    color: '#6b7280'
  };

  return (
    <div style={{ 
      display: 'flex', 
      backgroundColor: '#f3f4f6', 
      borderRadius: '6px',
      padding: '2px'
    }}>
      <button
        onClick={() => onViewChange('stable')}
        style={{
          ...buttonStyle,
          ...(currentView === 'stable' ? activeStyle : inactiveStyle)
        }}
      >
        安定版 ({stableCount})
      </button>
      <button
        onClick={() => onViewChange('latest')}
        style={{
          ...buttonStyle,
          ...(currentView === 'latest' ? activeStyle : inactiveStyle)
        }}
      >
        最新版 ({latestCount})
      </button>
    </div>
  );
};