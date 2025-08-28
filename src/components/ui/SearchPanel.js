// src/components/ui/SearchPanel.js
import React, { useCallback } from 'react';
import { WikiImportButton } from './WikiImportButton';

const SearchPanel = ({
  searchTerm = '',
  onSearchChange,
  highlightedEvents,
  topTags = [],
  onCreateTimeline,
  timelines = [],
  onDeleteTimeline,
  isWikiMode = false,
  user = null,
  onEventImported = null,
  wikiEvents = []
}) => {
  const highlightedEventsSize = highlightedEvents?.size || 0;

  // Wiki検索結果のインポート処理
  const handleWikiSearchImport = useCallback((importData) => {
    try {
      if (importData.type === 'events' && importData.data.length > 0) {
        onEventImported?.(importData.data);
      } else if (importData.type === 'timeline' && importData.data) {
        onEventImported?.({ 
          type: 'timeline', 
          data: importData.data 
        });
      }
    } catch (err) {
      console.error('Wiki検索結果インポートエラー:', err);
      alert(`インポートエラー: ${err.message}`);
    }
  }, [onEventImported]);

  // 現在の検索結果からインポート対象を抽出
  const getImportTargetEvents = useCallback(() => {
    if (!isWikiMode) return [];
    
    // highlightedEventsがある場合はそれを使用、なければ検索にマッチしたwikiEvents
    if (highlightedEventsSize > 0 && wikiEvents.length > 0) {
      return wikiEvents.filter(event => 
        highlightedEvents?.has ? highlightedEvents.has(event.id) : true
      );
    }
    
    return [];
  }, [isWikiMode, highlightedEventsSize, wikiEvents, highlightedEvents]);

  const importTargetEvents = getImportTargetEvents();

  // タグクリックハンドラー
  const handleTagClick = (tag) => {
    if (onSearchChange && tag) {
      const currentSearchTerm = (typeof searchTerm === 'string') ? searchTerm : '';
      const newSearchTerm = currentSearchTerm.trim() ? 
        `${currentSearchTerm.trim()} ${tag}` : 
        tag;
      onSearchChange({ target: { value: newSearchTerm } });
    }
  };

  const safeSearchTerm = (typeof searchTerm === 'string') ? searchTerm : '';
  const hasSearchTerm = safeSearchTerm.trim().length > 0;

  const styles = {
    searchPanel: {
      backgroundColor: "#ffffff",
      borderRadius: "12px",
      padding: "20px",
      marginBottom: "16px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      border: "1px solid #e5e7eb"
    },
    
    searchInput: {
      width: "100%",
      padding: "12px 16px",
      border: "2px solid #e5e7eb",
      borderRadius: "8px",
      fontSize: "16px",
      marginBottom: "16px",
      backgroundColor: "#f9fafb",
      transition: "border-color 0.2s ease, background-color 0.2s ease"
    },
    
    statsContainer: {
      padding: "12px",
      backgroundColor: "#f0f9ff",
      borderRadius: "8px",
      marginBottom: "16px",
      fontSize: "14px",
      color: "#1e40af",
      textAlign: "center",
      fontWeight: "500"
    },
    
    createButton: {
      width: "100%",
      padding: "12px 20px",
      backgroundColor: "#10b981",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background-color 0.2s ease",
      marginBottom: "16px"
    },
    
    createButtonDisabled: {
      backgroundColor: "#9ca3af",
      cursor: "not-allowed"
    },

    // Wiki専用スタイル
    wikiIndicator: {
      fontSize: "12px",
      color: "#3b82f6",
      backgroundColor: "#dbeafe",
      padding: "6px 12px",
      borderRadius: "8px",
      marginBottom: "16px",
      display: "inline-block",
      fontWeight: "500"
    },

    importSection: {
      marginTop: "16px",
      padding: "16px",
      backgroundColor: "#f0f9ff",
      borderRadius: "8px",
      border: "1px solid #e0f2fe"
    },

    importTitle: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#1e40af",
      marginBottom: "12px",
      display: "flex",
      alignItems: "center",
      gap: "8px"
    },

    // タグセクション
    tagSection: {
      marginBottom: "20px"
    },
    
    sectionTitle: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#374151",
      marginBottom: "12px",
      display: "flex",
      alignItems: "center",
      gap: "8px"
    },
    
    tagContainer: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px"
    },
    
    tag: {
      padding: "6px 12px",
      backgroundColor: "#f0f9ff",
      color: "#1e40af",
      borderRadius: "16px",
      fontSize: "13px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s ease",
      border: "1px solid #e0f2fe"
    },
    
    tagHover: {
      backgroundColor: "#3b82f6",
      color: "white"
    },

    // 年表セクション
    timelineSection: {
      marginBottom: "16px"
    },
    
    timelineList: {
      display: "flex",
      flexDirection: "column",
      gap: "4px"
    },
    
    timelineItem: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "6px 8px",
      marginBottom: "4px",
      backgroundColor: "#f9fafb",
      borderRadius: "4px",
      fontSize: "12px"
    },
    
    timelineItemTitle: {
      fontWeight: "500",
      color: "#374151",
      flex: 1,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    
    timelineItemCount: {
      color: "#6b7280",
      fontSize: "11px",
      marginLeft: "8px"
    },
    
    deleteButton: {
      background: "none",
      border: "none",
      color: "#ef4444",
      cursor: "pointer",
      fontSize: "12px",
      padding: "2px 4px",
      borderRadius: "2px",
      marginLeft: "4px"
    }
  };
  
  return (
    <div style={styles.searchPanel}>
      {/* Wiki モードインジケーター */}
      {isWikiMode && (
        <div style={styles.wikiIndicator}>
          📚 TLwiki モード - 共同編集データを表示中
        </div>
      )}
      
      {/* 検索入力 */}
      <input
        type="text"
        placeholder={isWikiMode ? 
          "Wiki イベントを検索..." : 
          "タグ・タイトルで絞り込み"
        }
        value={safeSearchTerm}
        onChange={onSearchChange}
        style={styles.searchInput}
        onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
        onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
      />
      
      {/* 統計情報 */}
      {highlightedEventsSize > 0 && (
        <div style={styles.statsContainer}>
          🎯 {highlightedEventsSize} 件が選択中
          {hasSearchTerm && (
            <div style={{ marginTop: "4px" }}>
              検索: "{safeSearchTerm.trim()}"
            </div>
          )}
        </div>
      )}
      
      {/* Wiki検索結果インポートセクション */}
      {isWikiMode && importTargetEvents.length > 0 && (
        <div style={styles.importSection}>
          <div style={styles.importTitle}>
            📥 個人ファイルに追加
          </div>
          <WikiImportButton
            wikiEvents={importTargetEvents}
            user={user}
            onImportComplete={handleWikiSearchImport}
            buttonText={`検索結果${importTargetEvents.length}件を追加`}
            variant="primary"
          />
        </div>
      )}
      
      {/* 上位タグ表示 */}
      {topTags.length > 0 && (
        <div style={styles.tagSection}>
          <h3 style={styles.sectionTitle}>
            🏷️ {highlightedEventsSize > 0 ? '関連タグ' : (isWikiMode ? '人気タグ' : 'よく使われるタグ')}
          </h3>
          <div style={styles.tagContainer}>
            {topTags.map((tag) => (
              <span 
                key={tag} 
                style={styles.tag}
                onClick={() => handleTagClick(tag)}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = styles.tagHover.backgroundColor;
                  e.target.style.color = styles.tagHover.color;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = styles.tag.backgroundColor;
                  e.target.style.color = styles.tag.color;
                }}
                title={`"${tag}" で検索`}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* 年表作成ボタン（個人モードのみ） */}
      {!isWikiMode && onCreateTimeline && (
        <button
          style={{
            ...styles.createButton,
            ...(highlightedEventsSize === 0 ? styles.createButtonDisabled : {})
          }}
          disabled={highlightedEventsSize === 0}
          onClick={onCreateTimeline}
          onMouseEnter={(e) => {
            if (highlightedEventsSize > 0) {
              e.target.style.backgroundColor = "#059669";
            }
          }}
          onMouseLeave={(e) => {
            if (highlightedEventsSize > 0) {
              e.target.style.backgroundColor = "#10b981";
            }
          }}
        >
          📊 年表を作成
          {highlightedEventsSize > 0 && ` (${highlightedEventsSize})`}
        </button>
      )}

      {/* 年表リスト表示 */}
      {timelines.length > 0 && (
        <div style={styles.timelineSection}>
          <h3 style={styles.sectionTitle}>
            📊 {isWikiMode ? '表示中の年表' : '作成済み年表'}
          </h3>
          <div style={styles.timelineList}>
            {timelines.map((timeline) => (
              <div key={timeline.id} style={styles.timelineItem}>
                <div style={styles.timelineItemTitle}>
                  {timeline.name}
                </div>
                <div style={styles.timelineItemCount}>
                  {timeline.events?.length || 0}件
                </div>
                {!isWikiMode && onDeleteTimeline && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`年表「${timeline.name}」を削除しますか？`)) {
                        onDeleteTimeline(timeline.id);
                      }
                    }}
                    style={styles.deleteButton}
                    title="年表を削除"
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#fee2e2'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPanel;