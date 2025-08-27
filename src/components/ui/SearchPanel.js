// src/components/ui/SearchPanel.js
import React from 'react';
import { TIMELINE_CONFIG } from '../../constants/timelineConfig';

export const SearchPanel = ({
  searchTerm,
  highlightedEvents = [],
  timelines = [],
  onSearchChange,
  onCreateTimeline,
  onDeleteTimeline,
  getTopTagsFromSearch,
  isWikiMode = false,
  showAdvancedOptions = false
}) => {
  const highlightedEventsSize = Array.isArray(highlightedEvents) ? 
    highlightedEvents.length : 
    (highlightedEvents.size || 0);

  const topTags = getTopTagsFromSearch ? getTopTagsFromSearch() : [];
  
  const styles = {
    searchPanel: {
      position: "absolute",
      top: "20px",
      left: "20px",
      width: "280px",
      backgroundColor: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      zIndex: 50,
      padding: "16px",
    },
    
    searchInput: {
      width: "100%",
      padding: "8px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      marginBottom: "16px",
      fontSize: "14px",
      boxSizing: "border-box",
      backgroundColor: "#ffffff"
    },
    
    // タグセクション
    tagSection: {
      marginBottom: "16px",
    },
    
    sectionTitle: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#374151",
      marginBottom: "8px",
    },
    
    tagContainer: {
      display: "flex",
      flexWrap: "wrap",
      gap: "4px",
    },
    
    tag: {
      padding: "4px 8px",
      backgroundColor: "#e0f2fe",
      color: "#0891b2",
      fontSize: "12px",
      border: "1px solid #0891b2",
      borderRadius: "12px",
      cursor: "pointer",
      transition: "all 0.2s",
      userSelect: "none"
    },
    
    tagHover: {
      backgroundColor: "#0891b2",
      color: "white"
    },
    
    // ボタン
    createButton: {
      width: "100%",
      backgroundColor: "#10b981",
      color: "white",
      padding: "10px 16px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
      fontSize: "14px",
      transition: "background-color 0.2s",
      marginBottom: "8px"
    },
    
    createButtonDisabled: {
      backgroundColor: "#9ca3af",
      cursor: "not-allowed",
    },
    
    // 統計情報
    statsContainer: {
      fontSize: "12px",
      color: "#6b7280",
      marginBottom: "12px",
      padding: "8px",
      backgroundColor: "#f9fafb",
      borderRadius: "4px"
    },
    
    // 年表一覧（コンパクト）
    timelineSection: {
      marginTop: "16px",
      borderTop: "1px solid #f3f4f6",
      paddingTop: "12px"
    },
    
    timelineList: {
      maxHeight: "120px",
      overflow: "auto"
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
    },
    
    // Wiki専用スタイル
    wikiIndicator: {
      fontSize: "10px",
      color: "#3b82f6",
      backgroundColor: "#dbeafe",
      padding: "2px 6px",
      borderRadius: "8px",
      marginBottom: "8px",
      display: "inline-block"
    }
  };
  
  // タグクリックハンドラー
  const handleTagClick = (tag) => {
    if (onSearchChange) {
      // 既存の検索語にタグを追加
      const newSearchTerm = searchTerm.trim() ? 
        `${searchTerm.trim()} ${tag}` : 
        tag;
      onSearchChange({ target: { value: newSearchTerm } });
    }
  };
  
  return (
    <div style={styles.searchPanel}>
      {/* Wiki モードインジケーター */}
      {isWikiMode && (
        <div style={styles.wikiIndicator}>
          📚 Wiki モード
        </div>
      )}
      
      {/* 検索入力 */}
      <input
        type="text"
        placeholder={isWikiMode ? 
          "Wiki イベントを検索..." : 
          "タグ・タイトルで絞り込み"
        }
        value={searchTerm}
        onChange={onSearchChange}
        style={styles.searchInput}
      />
      
      {/* 統計情報 */}
      {highlightedEventsSize > 0 && (
        <div style={styles.statsContainer}>
          🎯 {highlightedEventsSize} 件が選択中
          {searchTerm.trim() && (
            <div style={{ marginTop: "4px" }}>
              検索: "{searchTerm.trim()}"
            </div>
          )}
        </div>
      )}
      
      {/* 上位タグ表示 */}
      {topTags.length > 0 && (
        <div style={styles.tagSection}>
          <h3 style={styles.sectionTitle}>
            {highlightedEventsSize > 0 ? '関連タグ' : '人気タグ'}
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
          {highlightedEventsSize > 0 && ` (${highlightedEventsSize})`}
        </button>
      )}
      
      {/* Wiki モード用のインポートボタン */}
      {isWikiMode && highlightedEventsSize > 0 && (
        <button
          style={styles.createButton}
          onClick={() => {
            // Wiki イベントのインポート処理
            console.log('Wiki events import:', highlightedEventsSize);
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = "#059669"}
          onMouseLeave={(e) => e.target.style.backgroundColor = "#10b981"}
        >
          📥 個人ファイルに追加 ({highlightedEventsSize})
        </button>
      )}
      
      {/* 年表一覧（個人モードのみ） */}
      {!isWikiMode && timelines.length > 0 && showAdvancedOptions && (
        <div style={styles.timelineSection}>
          <h3 style={styles.sectionTitle}>作成した年表 ({timelines.length})</h3>
          <div style={styles.timelineList}>
            {timelines.filter(t => t.isVisible).map((timeline) => (
              <div key={timeline.id} style={styles.timelineItem}>
                <div 
                  style={{
                    width: "12px",
                    height: "12px",
                    backgroundColor: timeline.color || "#6b7280",
                    borderRadius: "2px",
                    marginRight: "8px",
                    flexShrink: 0
                  }}
                />
                <div style={styles.timelineItemTitle} title={timeline.name}>
                  {timeline.name}
                </div>
                <div style={styles.timelineItemCount}>
                  {timeline.eventCount || timeline.events?.length || 0}
                </div>
                {onDeleteTimeline && (
                  <button
                    style={styles.deleteButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTimeline(timeline.id);
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = "#fecaca"}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
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
      
      {/* 検索結果が0件の場合のメッセージ */}
      {searchTerm.trim() && highlightedEventsSize === 0 && (
        <div style={{
          fontSize: "12px",
          color: "#9ca3af",
          textAlign: "center",
          padding: "12px",
          fontStyle: "italic"
        }}>
          "{searchTerm.trim()}" に一致するイベントがありません
        </div>
      )}
    </div>
  );
};