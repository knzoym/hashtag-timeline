// src/components/wiki/WikiRevisionDiff.js - wikiフォルダに移動版
import React from 'react';

const WikiRevisionDiff = ({ baseRevision, compareRevision, onClose }) => {
  // 差分計算関数
  const calculateTextDiff = (oldText, newText) => {
    if (oldText === newText) {
      return { type: 'same', old: oldText, new: newText };
    }
    return { type: 'changed', old: oldText || '', new: newText || '' };
  };

  const calculateArrayDiff = (oldArray = [], newArray = []) => {
    const oldSet = new Set(oldArray);
    const newSet = new Set(newArray);
    
    return {
      added: newArray.filter(item => !oldSet.has(item)),
      removed: oldArray.filter(item => !newSet.has(item)),
      common: oldArray.filter(item => newSet.has(item))
    };
  };

  // 差分データ計算
  const baseData = baseRevision?.stable_data || baseRevision || {};
  const compareData = compareRevision?.data || compareRevision || {};

  const titleDiff = calculateTextDiff(baseData.title, compareData.title);
  const descriptionDiff = calculateTextDiff(baseData.description, compareData.description);
  const dateStartDiff = calculateTextDiff(baseData.date_start, compareData.date_start);
  const dateEndDiff = calculateTextDiff(baseData.date_end, compareData.date_end);
  const licenseDiff = calculateTextDiff(baseData.license, compareData.license);

  const tagsDiff = calculateArrayDiff(baseData.tags || [], compareData.tags || []);
  const sourcesDiff = calculateArrayDiff(baseData.sources || [], compareData.sources || []);

  // 変更があるかどうかをチェック
  const hasChanges = 
    titleDiff.type === 'changed' ||
    descriptionDiff.type === 'changed' ||
    dateStartDiff.type === 'changed' ||
    dateEndDiff.type === 'changed' ||
    licenseDiff.type === 'changed' ||
    tagsDiff.added.length > 0 ||
    tagsDiff.removed.length > 0 ||
    sourcesDiff.added.length > 0 ||
    sourcesDiff.removed.length > 0;

  // テキスト差分のレンダリング
  const renderTextDiff = (diff, isMultiline = false) => {
    if (diff.type === 'same') {
      return (
        <div style={styles.diffRow}>
          <div style={styles.diffCell}>
            <div style={styles.sameText}>{diff.old}</div>
          </div>
          <div style={{ ...styles.diffCell, ...styles.diffCellRight }}>
            <div style={styles.sameText}>{diff.new}</div>
          </div>
        </div>
      );
    }

    return (
      <div style={styles.diffRow}>
        <div style={styles.diffCell}>
          <div style={{ ...styles.diffText, ...styles.removedText }}>
            {diff.old || '（空）'}
          </div>
        </div>
        <div style={{ ...styles.diffCell, ...styles.diffCellRight }}>
          <div style={{ ...styles.diffText, ...styles.addedText }}>
            {diff.new || '（空）'}
          </div>
        </div>
      </div>
    );
  };

  // 配列差分のレンダリング
  const renderArrayDiff = (diff) => {
    return (
      <div style={styles.diffRow}>
        <div style={styles.diffCell}>
          <div style={styles.arrayDiff}>
            {diff.common.map((item, index) => (
              <span key={`common-${index}`} style={{ ...styles.arrayItem, ...styles.arrayItemSame }}>
                {item}
              </span>
            ))}
            {diff.removed.map((item, index) => (
              <span key={`removed-${index}`} style={{ ...styles.arrayItem, ...styles.arrayItemRemoved }}>
                {item}
              </span>
            ))}
          </div>
        </div>
        <div style={{ ...styles.diffCell, ...styles.diffCellRight }}>
          <div style={styles.arrayDiff}>
            {diff.common.map((item, index) => (
              <span key={`common-${index}`} style={{ ...styles.arrayItem, ...styles.arrayItemSame }}>
                {item}
              </span>
            ))}
            {diff.added.map((item, index) => (
              <span key={`added-${index}`} style={{ ...styles.arrayItem, ...styles.arrayItemAdded }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const styles = {
    overlay: {
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
      maxWidth: '1000px',
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
    title: {
      margin: 0,
      fontSize: '20px',
      fontWeight: '600',
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
    content: {
      padding: '20px'
    },
    revisionInfo: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
      marginBottom: '20px',
      padding: '16px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      border: '1px solid #e2e8f0'
    },
    revisionColumn: {
      textAlign: 'center'
    },
    revisionLabel: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '4px'
    },
    revisionMeta: {
      fontSize: '12px',
      color: '#6b7280'
    },
    legend: {
      display: 'flex',
      gap: '16px',
      marginBottom: '20px',
      padding: '12px',
      backgroundColor: '#f9fafb',
      borderRadius: '6px',
      fontSize: '12px'
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    legendColor: {
      width: '12px',
      height: '12px',
      borderRadius: '2px'
    },
    diffSection: {
      marginBottom: '24px'
    },
    diffSectionTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px',
      padding: '8px 0',
      borderBottom: '1px solid #e5e7eb'
    },
    diffContainer: {
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      overflow: 'hidden'
    },
    diffRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr'
    },
    diffCell: {
      padding: '12px',
      borderRight: '1px solid #d1d5db',
      backgroundColor: '#fafafa'
    },
    diffCellRight: {
      borderRight: 'none'
    },
    diffText: {
      fontSize: '14px',
      lineHeight: '1.4',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word'
    },
    sameText: {
      color: '#374151'
    },
    addedText: {
      backgroundColor: '#dcfce7',
      color: '#166534',
      padding: '2px 4px',
      borderRadius: '3px'
    },
    removedText: {
      backgroundColor: '#fee2e2',
      color: '#dc2626',
      padding: '2px 4px',
      borderRadius: '3px'
    },
    arrayDiff: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px'
    },
    arrayItem: {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '500'
    },
    arrayItemSame: {
      backgroundColor: '#f3f4f6',
      color: '#374151'
    },
    arrayItemAdded: {
      backgroundColor: '#dcfce7',
      color: '#166534'
    },
    arrayItemRemoved: {
      backgroundColor: '#fee2e2',
      color: '#dc2626'
    },
    noChanges: {
      textAlign: 'center',
      padding: '40px',
      color: '#6b7280',
      fontSize: '16px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    }
  };

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>リビジョン差分表示</h2>
          <button 
            style={styles.closeButton}
            onClick={onClose}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>

        <div style={styles.content}>
          {/* リビジョン情報 */}
          <div style={styles.revisionInfo}>
            <div style={styles.revisionColumn}>
              <div style={styles.revisionLabel}>基準版（安定版）</div>
              <div style={styles.revisionMeta}>
                作成日: {new Date(baseRevision.revision_created_at || baseRevision.created_at).toLocaleString('ja-JP')}
              </div>
            </div>
            <div style={styles.revisionColumn}>
              <div style={styles.revisionLabel}>比較版</div>
              <div style={styles.revisionMeta}>
                作成日: {new Date(compareRevision.created_at).toLocaleString('ja-JP')}
              </div>
            </div>
          </div>

          {/* 凡例 */}
          <div style={styles.legend}>
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendColor, backgroundColor: '#fee2e2' }}></div>
              <span>削除された内容</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendColor, backgroundColor: '#dcfce7' }}></div>
              <span>追加された内容</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendColor, backgroundColor: '#f3f4f6' }}></div>
              <span>変更なし</span>
            </div>
          </div>

          {!hasChanges ? (
            <div style={styles.noChanges}>
              この2つのリビジョン間に変更はありません
            </div>
          ) : (
            <>
              {/* タイトル */}
              <div style={styles.diffSection}>
                <div style={styles.diffSectionTitle}>
                  📝 タイトル
                </div>
                <div style={styles.diffContainer}>
                  {renderTextDiff(titleDiff)}
                </div>
              </div>

              {/* 日付 */}
              {(dateStartDiff.type === 'changed' || dateEndDiff.type === 'changed') && (
                <div style={styles.diffSection}>
                  <div style={styles.diffSectionTitle}>
                    📅 日付
                  </div>
                  <div style={styles.diffContainer}>
                    <div style={styles.diffRow}>
                      <div style={{ ...styles.diffCell, fontSize: '12px', fontWeight: '600', backgroundColor: '#f8fafc' }}>
                        開始日
                      </div>
                      <div style={{ ...styles.diffCell, ...styles.diffCellRight, fontSize: '12px', fontWeight: '600', backgroundColor: '#f8fafc' }}>
                        開始日
                      </div>
                    </div>
                    {renderTextDiff(dateStartDiff)}
                    <div style={styles.diffRow}>
                      <div style={{ ...styles.diffCell, fontSize: '12px', fontWeight: '600', backgroundColor: '#f8fafc' }}>
                        終了日
                      </div>
                      <div style={{ ...styles.diffCell, ...styles.diffCellRight, fontSize: '12px', fontWeight: '600', backgroundColor: '#f8fafc' }}>
                        終了日
                      </div>
                    </div>
                    {renderTextDiff(dateEndDiff)}
                  </div>
                </div>
              )}

              {/* 説明文 */}
              {descriptionDiff.type === 'changed' && (
                <div style={styles.diffSection}>
                  <div style={styles.diffSectionTitle}>
                    📄 説明文
                  </div>
                  <div style={styles.diffContainer}>
                    {renderTextDiff(descriptionDiff, true)}
                  </div>
                </div>
              )}

              {/* タグ */}
              {(tagsDiff.added.length > 0 || tagsDiff.removed.length > 0) && (
                <div style={styles.diffSection}>
                  <div style={styles.diffSectionTitle}>
                    🏷️ タグ
                  </div>
                  <div style={styles.diffContainer}>
                    {renderArrayDiff(tagsDiff)}
                  </div>
                </div>
              )}

              {/* 参考資料 */}
              {(sourcesDiff.added.length > 0 || sourcesDiff.removed.length > 0) && (
                <div style={styles.diffSection}>
                  <div style={styles.diffSectionTitle}>
                    🔗 参考資料
                  </div>
                  <div style={styles.diffContainer}>
                    {renderArrayDiff(sourcesDiff)}
                  </div>
                </div>
              )}

              {/* ライセンス */}
              {licenseDiff.type === 'changed' && (
                <div style={styles.diffSection}>
                  <div style={styles.diffSectionTitle}>
                    ⚖️ ライセンス
                  </div>
                  <div style={styles.diffContainer}>
                    {renderTextDiff(licenseDiff)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WikiRevisionDiff;