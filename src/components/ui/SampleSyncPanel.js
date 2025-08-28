// src/components/ui/SampleSyncPanel.js
import React, { useState } from 'react';
import { useSampleSync } from '../../hooks/useSampleSync';

const SampleSyncPanel = ({ user, onSyncComplete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { 
    loading, 
    error, 
    syncProgress, 
    syncSampleEventsToSupabase, 
    resetSyncState 
  } = useSampleSync(user);

  const handleSync = async () => {
    if (!user) {
      alert('Supabaseへの同期にはログインが必要です');
      return;
    }

    const confirmed = window.confirm(
      'ローカルのサンプルイベント（20件）をTLwikiに登録しますか？\n' +
      '重複チェックを行い、新規イベントのみ追加されます。'
    );

    if (!confirmed) return;

    try {
      const result = await syncSampleEventsToSupabase();
      if (result.success) {
        onSyncComplete?.(result);
      }
    } catch (err) {
      console.error('同期処理エラー:', err);
    }
  };

  return (
    <div style={{
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      margin: '16px 0'
    }}>
      {/* ヘッダー */}
      <div 
        style={{
          padding: '16px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '20px' }}>🔄</span>
          <div>
            <div style={{ fontWeight: '600', color: '#1f2937' }}>
              サンプルイベント同期
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              ローカルサンプル（20件）をTLwikiと同期
            </div>
          </div>
        </div>
        <span style={{ 
          fontSize: '18px', 
          color: '#9ca3af',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease'
        }}>
          ▼
        </span>
      </div>

      {/* 展開コンテンツ */}
      {isExpanded && (
        <div style={{ padding: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <p style={{ 
              fontSize: '14px', 
              color: '#4b5563',
              lineHeight: '1.5',
              margin: '0 0 12px 0'
            }}>
              ローカルに定義されているサンプルイベント（建築史・日本史）をTLwikiに登録します。
              既存のイベントとの重複はスキップされます。
            </p>
            
            {!user && (
              <div style={{
                padding: '12px',
                backgroundColor: '#fef3c7',
                borderLeft: '4px solid #f59e0b',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '14px', color: '#92400e', fontWeight: '500' }}>
                  ⚠️ ログインが必要です
                </div>
                <div style={{ fontSize: '12px', color: '#92400e', marginTop: '4px' }}>
                  TLwikiへの登録にはGoogleアカウントでのログインが必要です
                </div>
              </div>
            )}
          </div>

          {/* 進行状況表示 */}
          {syncProgress && (
            <div style={{
              padding: '12px',
              backgroundColor: syncProgress.phase === 'error' ? '#fef2f2' : '#f0f9ff',
              borderLeft: `4px solid ${syncProgress.phase === 'error' ? '#ef4444' : '#3b82f6'}`,
              marginBottom: '16px'
            }}>
              <div style={{
                fontSize: '14px',
                color: syncProgress.phase === 'error' ? '#dc2626' : '#1e40af',
                fontWeight: '500'
              }}>
                {syncProgress.message}
              </div>
              {syncProgress.phase === 'complete' && (
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  TLwikiページで結果を確認できます
                </div>
              )}
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fef2f2',
              borderLeft: '4px solid #ef4444',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '14px', color: '#dc2626', fontWeight: '500' }}>
                エラーが発生しました
              </div>
              <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
                {error}
              </div>
            </div>
          )}

          {/* アクションボタン */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSync}
              disabled={!user || loading}
              style={{
                padding: '10px 20px',
                backgroundColor: user && !loading ? '#3b82f6' : '#9ca3af',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: user && !loading ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? '同期中...' : 'TLwikiに同期'}
            </button>
            
            {(error || syncProgress) && (
              <button
                onClick={resetSyncState}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                リセット
              </button>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export { WikiImportButton, SampleSyncPanel };