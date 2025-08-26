// src/components/WikiRevisionDiff.js
import React from 'react';

const WikiRevisionDiff = ({ baseRevision, compareRevision, onClose }) => {
  // 配列の差分を計算
  const getArrayDiff = (baseArray = [], compareArray = []) => {
    const base = new Set(baseArray);
    const compare = new Set(compareArray);
    
    const added = [...compare].filter(item => !base.has(item));
    const removed = [...base].filter(item => !compare.has(item));
    const common = [...base].filter(item => compare.has(item));
    
    return { added, removed, common };
  };

  // テキストの差分を簡易的に表示（単語レベル）
  const getTextDiff = (baseText = '', compareText = '') => {
    if (baseText === compareText) {
      return { type: 'same', content: compareText };
    }
    return { type: 'changed', base: baseText, compare: compareText };
  };

  // 日付の差分
  const getDateDiff = (baseDate, compareDate) => {
    const base = new Date(baseDate).toLocaleDateString('ja-JP');
    const compare = new Date(compareDate).toLocaleDateString('ja-JP');
    
    if (base === compare) {
      return { type: 'same', content: compare };
    }
    return { type: 'changed', base, compare };
  };

  const titleDiff = getTextDiff(baseRevision.title, compareRevision.title);
  const descriptionDiff = getTextDiff(baseRevision.description, compareRevision.description);
  const dateStartDiff = getDateDiff(baseRevision.date_start, compareRevision.date_start);
  const dateEndDiff = getDateDiff(baseRevision.date_end, compareRevision.date_end);
  const tagsDiff = getArrayDiff(baseRevision.tags, compareRevision.tags);
  const sourcesDiff = getArrayDiff(baseRevision.sources, compareRevision.sources);
  const licenseDiff = getTextDiff(baseRevision.license, compareRevision.license);

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
      borderBottom: '2px solid #e5e7eb',
      backgroundColor: '#f8fafc'
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
      backgroundColor: '#f9fafb',
      borderRadius: '8px'
    },
    revisionColumn: {
      padding: '12px',
      backgroundColor: 'white',
      borderRadius: '6px',
      border: '1px solid #e5e7eb'
    },
    revisionLabel: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px'
    },
    revisionMeta: {
      fontSize: '12px',
      color: '#6b7280'
    },
    diffSection: {
      marginBottom: '24px'
    },
    diffSectionTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    diffContainer: {
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      overflow: 'hidden'
    },
    diffRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      minHeight: '40px'
    },
    diffCell: {
      padding: '12px',
      fontSize: '14px',
      lineHeight: '1.4',
      borderRight: '1px solid #e5e7eb'
    },
    diffCellRight: {
      borderRight: 'none'
    },
    sameContent: {
      backgroundColor: '#f8fafc',
      color: '#374151'
    },
    removedContent: {
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      textDecoration: 'line-through'
    },
    addedContent: {
      backgroundColor: '#f0fdf4',
      color: '#059669'
    },
    changedContent: {
      backgroundColor: '#fff7ed',
      color: '#c2410c'
    },
    arrayDiff: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    },
    arrayItem: {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      display: 'inline-block',
      marginRight: '4px',
      marginBottom: '4px'
    },
    arrayItemSame: {
      backgroundColor: '#f3f4f6',
      color: '#374151'
    },
    arrayItemAdded: {
      backgroundColor: '#dcfce7',
      color: '#059669'
    },
    arrayItemRemoved: {
      backgroundColor: '#fee2e2',
      color: '#dc2626',
      textDecoration: 'line-through'
    },
    noChanges: {
      textAlign: 'center',
      padding: '40px',
      color: '#6b7280',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      fontStyle: 'italic'
    },
    legend: {
      display: 'flex',
      gap: '16px',
      marginBottom: '20px',
      fontSize: '12px',
      padding: '12px',
      backgroundColor: '#f8fafc',
      borderRadius: '6px'
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    legendColor: {
      width: '12px',
      height: '12px',
      borderRadius: '2px'
    }
  };

  // 変更があるかどうかをチェック
  const hasChanges = 
    titleDiff.type === 'changed' ||
    descriptionDiff.type === 'changed' ||
    dateStartDiff.type === 'changed' ||
    dateEndDiff.type === 'changed' ||
    tagsDiff.added.length > 0 ||
    tagsDiff.removed.length > 0 ||
    sourcesDiff.added.length > 0 ||
    sourcesDiff.removed.length > 0 ||
    licenseDiff.type === 'changed';

  const renderTextDiff = (diff, isMultiline = false) => {
    if (diff.type === 'same') {
      return (
        <div style={styles.diffRow}>
          <div style={{ ...styles.diffCell, ...styles.sameContent }}>
            {isMultiline ? (
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>
                {diff.content}
              </pre>
            ) : (
              diff.content
            )}
          </div>
          <div style={{ ...styles.diffCell, ...styles.diffCellRight, ...styles.sameContent }}>
            {isMultiline ? (
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>
                {diff.content}
              </pre>
            ) : (
              diff.content
            )}
          </div>
        </div>
      );
    }

    return (
      <div style={styles.diffRow}>
        <div style={{ ...styles.diffCell, ...styles.removedContent }}>
          {isMultiline ? (
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>
              {diff.base}
            </pre>
          ) : (
            diff.base
          )}
        </div>
        <div style={{ ...styles.diffCell, ...styles.diffCellRight, ...styles.addedContent }}>
          {isMultiline ? (
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>
              {diff.compare}
            </pre>
          ) : (
            diff.compare
          )}
        </div>
      </div>
    );
  };

  const renderArrayDiff = (diff) => {
    if (diff.added.length === 0 && diff.removed.length === 0) {
      return (
        <div style={styles.diffRow}>
          <div style={{ ...styles.diffCell, ...styles.sameContent }}>
            <div style={styles.arrayDiff}>
              {diff.common.map((item, index) => (
                <span key={index} style={{ ...styles.arrayItem, ...styles.arrayItemSame }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div style={{ ...styles.diffCell, ...styles.diffCellRight, ...styles.sameContent }}>
            <div style={styles.arrayDiff}>
              {diff.common.map((item, index) => (
                <span key={index} style={{ ...styles.arrayItem, ...styles.arrayItemSame }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      );
    }

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