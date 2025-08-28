// src/components/ui/SearchPanel.js - Wiki対応修正版
import React, { useCallback } from 'react';

const SearchPanel = ({
  searchTerm = '',
  onSearchChange,
  highlightedEvents,
  topTags = [],
  onCreateTimeline,
  onCreateTempTimeline, // 新規：Wiki一時年表作成
  timelines = [],
  tempTimelines = [], // 新規：Wiki一時年表
  onDeleteTimeline,
  onDeleteTempTimeline, // 新規：一時年表削除
  isWikiMode = false,
  user = null,
  onEventImported = null,
  wikiEvents = []
}) => {
  const highlightedEventsSize = highlightedEvents?.size || highlightedEvents?.length || 0;

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
      padding: "16px",
      marginBottom: "16px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      border: "1px solid #e5e7eb",
      maxWidth: "280px"
    },
    
    searchInput: {
      width: "100%",
      padding: "10px 12px",
      border: "2px solid #e5e7eb",
      borderRadius: "6px",
      fontSize: "14px",
      marginBottom: "12px",
      backgroundColor: "#f9fafb",
      transition: "border-color 0.2s ease",
      boxSizing: "border-box"
    },
    
    statsContainer: {
      padding: "8px 12px",
      backgroundColor: "#f0f9ff",
      borderRadius: "6px",
      marginBottom: "12px",
      fontSize: "12px",
      color: "#1e40af",
      textAlign: "center",
      fontWeight: "500"
    },
    
    createButton: {
      width: "100%",
      padding: "10px 16px",
      backgroundColor: "#10b981",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background-color 0.2s ease",
      marginBottom: "12px"
    },
    
    tempCreateButton: {
      width: "100%",
      padding: "10px 16px",
      backgroundColor: "#3b82f6",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background-color 0.2s ease",
      marginBottom: "12px"
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
      borderRadius: "6px",
      marginBottom: "12px",
      display: "inline-block",
      fontWeight: "500"
    },

    // タグセクション
    tagSection: {
      marginBottom: "16px"
    },
    
    sectionTitle: {
      fontSize: "13px",
      fontWeight: "600",
      color: "#374151",
      marginBottom: "8px",
      display: "flex",
      alignItems: "center",
      gap: "6px"
    },
    
    tagContainer: {
      display: "flex",
      flexWrap: "wrap",
      gap: "6px"
    },
    
    tag: {
      padding: "4px 8px",
      backgroundColor: "#f0f9ff",
      color: "#1e40af",
      borderRadius: "12px",
      fontSize: "11px",
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
      marginBottom: "12px"
    },
    
    timelineList: {
      display: "flex",
      flexDirection: "column",
      gap: "6px"
    },
    
    timelineItem: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "6px 8px",
      backgroundColor: "#f9fafb",
      borderRadius: "4px",
      fontSize: "12px"
    },
    
    tempTimelineItem: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "6px 8px",
      backgroundColor: "#dbeafe",
      borderRadius: "4px",
      fontSize: "12px",
      border: "1px dashed #3b82f6"
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
          📚 TLwiki モード
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
        </div>
      )}
      
      {/* 年表作成ボタン */}
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
          {highlightedEventsSize > 0 && ` (${highlightedEventsSize}件)`}
        </button>
      )}

      {/* Wiki一時年表作成ボタン */}
      {isWikiMode && onCreateTempTimeline && (
        <button
          style={{
            ...styles.tempCreateButton,
            ...(highlightedEventsSize === 0 ? styles.createButtonDisabled : {})
          }}
          disabled={highlightedEventsSize === 0}
          onClick={onCreateTempTimeline}
          onMouseEnter={(e) => {
            if (highlightedEventsSize > 0) {
              e.target.style.backgroundColor = "#2563eb";
            }
          }}
          onMouseLeave={(e) => {
            if (highlightedEventsSize > 0) {
              e.target.style.backgroundColor = "#3b82f6";
            }
          }}
        >
          📋 一時年表を作成
          {highlightedEventsSize > 0 && ` (${highlightedEventsSize}件)`}
        </button>
      )}
      
      {/* 上位タグ表示 */}
      {topTags.length > 0 && (
        <div style={styles.tagSection}>
          <h3 style={styles.sectionTitle}>
            🏷️ {highlightedEventsSize > 0 ? '関連タグ' : 'よく使われるタグ'}
          </h3>
          <div style={styles.tagContainer}>
            {topTags.slice(0, 6).map((tag) => (
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

      {/* 個人年表リスト */}
      {!isWikiMode && timelines.length > 0 && (
        <div style={styles.timelineSection}>
          <h3 style={styles.sectionTitle}>
            📊 作成済み年表
          </h3>
          <div style={styles.timelineList}>
            {timelines.slice(0, 4).map((timeline) => (
              <div key={timeline.id} style={styles.timelineItem}>
                <div style={styles.timelineItemTitle}>
                  {timeline.name}
                </div>
                <div style={styles.timelineItemCount}>
                  {timeline.eventCount || 0}件
                </div>
                {onDeleteTimeline && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`年表「${timeline.name}」を削除しますか？`)) {
                        onDeleteTimeline(timeline.id);
                      }
                    }}
                    style={styles.deleteButton}
                    title="年表を削除"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wiki一時年表リスト */}
      {isWikiMode && tempTimelines.length > 0 && (
        <div style={styles.timelineSection}>
          <h3 style={styles.sectionTitle}>
            📋 一時作成年表
          </h3>
          <div style={styles.timelineList}>
            {tempTimelines.map((timeline) => (
              <div key={timeline.id} style={styles.tempTimelineItem}>
                <div style={styles.timelineItemTitle}>
                  {timeline.name}
                </div>
                <div style={styles.timelineItemCount}>
                  {timeline.eventIds?.length || 0}件
                </div>
                {onDeleteTempTimeline && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`一時年表「${timeline.name}」を削除しますか？`)) {
                        onDeleteTempTimeline(timeline.id);
                      }
                    }}
                    style={styles.deleteButton}
                    title="一時年表を削除"
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