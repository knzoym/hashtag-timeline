// src/components/ui/SearchPanel.js - 昔の方式を参考にした簡略版
import React from "react";
import { useMemo } from "react"; 

const SearchPanel = ({
  searchTerm = "",
  highlightedEvents = [],
  onSearchChange,
  onCreateTimeline,
  getTopTagsFromSearch,
  timelines = [],
  tempTimelines = [],
  isWikiMode = false,
}) => {
  // モード別の表示年表を決定
  const { displayTimelines, displayTempTimelines } = useMemo(() => {
    if (isWikiMode) {
      // Wikiモード: tempTimelinesのみ表示
      return {
        displayTimelines: [],
        displayTempTimelines: tempTimelines,
      };
    } else {
      // 個人モード: timelinesのみ表示
      return {
        displayTimelines: timelines,
        displayTempTimelines: [],
      };
    }
  }, [isWikiMode, timelines, tempTimelines]);

  const highlightedCount = Array.isArray(highlightedEvents)
    ? highlightedEvents.length
    : highlightedEvents?.size || 0;

  const hasHighlightedEvents = highlightedCount > 0;
  const topTags =
    hasHighlightedEvents && getTopTagsFromSearch
      ? getTopTagsFromSearch(Array.from(highlightedEvents))
      : [];

  const styles = {
    panel: {
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      border: "1px solid #e5e7eb",
      borderRadius: "12px",
      padding: "16px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      minWidth: "280px",
      backdropFilter: "blur(4px)",
    },
    searchBox: {
      width: "100%",
      padding: "8px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "14px",
      marginBottom: "12px",
      transition: "border-color 0.2s",
      boxSizing: "border-box",
    },
    resultInfo: {
      fontSize: "13px",
      color: "#6b7280",
      marginBottom: "8px",
      fontWeight: "500",
    },
    tagList: {
      display: "flex",
      flexWrap: "wrap",
      gap: "4px",
      marginBottom: "12px",
    },
    tag: {
      padding: "4px 8px",
      backgroundColor: "#dbeafe",
      color: "#1e40af",
      borderRadius: "12px",
      fontSize: "11px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
    buttonGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    },
    button: {
      padding: "8px 12px",
      border: "none",
      borderRadius: "6px",
      fontSize: "12px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "background-color 0.2s",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "4px",
    },
    primaryButton: {
      backgroundColor: "#3b82f6",
      color: "white",
    },
    wikiButton: {
      backgroundColor: "#10b981",
      color: "white",
    },
    disabledButton: {
      backgroundColor: "#f3f4f6",
      color: "#9ca3af",
      cursor: "not-allowed",
    },
    timelineList: {
      marginTop: "8px",
      fontSize: "11px",
      color: "#6b7280",
    },
    timelineItem: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      marginBottom: "2px",
    },
    timelineDot: {
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      flexShrink: 0,
    },
  };

  const handleSearchInput = (e) => {
    if (onSearchChange) {
      onSearchChange(e);
    }
  };

  const handleTagClick = (tag) => {
    if (onSearchChange) {
      onSearchChange({ target: { value: tag } });
    }
  };

  const handleCreateTimeline = () => {
    if (onCreateTimeline && hasHighlightedEvents) {
      onCreateTimeline();
    }
  };

  return (
    <div style={styles.panel}>
      {/* 検索入力 */}
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearchInput}
        placeholder="タグやキーワードで検索..."
        style={{
          ...styles.searchBox,
          borderColor: hasHighlightedEvents ? "#3b82f6" : "#d1d5db",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
        onBlur={(e) =>
          (e.target.style.borderColor = hasHighlightedEvents
            ? "#3b82f6"
            : "#d1d5db")
        }
      />

      {/* 検索結果情報 */}
      {searchTerm && (
        <div style={styles.resultInfo}>
          {highlightedCount > 0
            ? `${highlightedCount}件のイベントが見つかりました`
            : "該当するイベントがありません"}
        </div>
      )}

      {/* 人気タグ */}
      {topTags.length > 0 && (
        <div>
          <div
            style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}
          >
            関連タグ:
          </div>
          <div style={styles.tagList}>
            {topTags.map((tag, index) => (
              <span
                key={index}
                style={styles.tag}
                onClick={() => handleTagClick(tag)}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "#bfdbfe")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "#dbeafe")
                }
                title={`「${tag}」で検索`}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 年表作成ボタン */}
      {hasHighlightedEvents && (
        <div style={styles.buttonGroup}>
          <button
            onClick={handleCreateTimeline}
            style={{
              ...styles.button,
              ...(isWikiMode ? styles.wikiButton : styles.primaryButton),
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = isWikiMode
                ? "#059669"
                : "#2563eb";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = isWikiMode
                ? "#10b981"
                : "#3b82f6";
            }}
          >
            {isWikiMode ? "📋 一時年表を作成" : "📊 年表を作成"}
          </button>
        </div>
      )}

      {/* 既存年表リスト - モード別表示 */}
      {(displayTimelines.length > 0 || displayTempTimelines.length > 0) && (
        <div style={styles.timelineList}>
          <div
            style={{
              fontWeight: "600",
              marginBottom: "4px",
              fontSize: "12px",
              color: "#374151",
            }}
          >
            {isWikiMode ? "一時作成した年表:" : "既存の年表:"}
          </div>

          {/* 個人モード: 通常年表のみ表示 */}
          {displayTimelines.map((timeline) => (
            <div key={timeline.id} style={styles.timelineItem}>
              <div
                style={{
                  ...styles.timelineDot,
                  backgroundColor: timeline.color || "#6b7280",
                }}
              />
              <span title={timeline.description || timeline.name}>
                {timeline.name} ({timeline.eventCount || 0})
              </span>
            </div>
          ))}

          {/* Wikiモード: 一時年表のみ表示 */}
          {displayTempTimelines.map((timeline) => (
            <div key={timeline.id} style={styles.timelineItem}>
              <div
                style={{
                  ...styles.timelineDot,
                  backgroundColor: timeline.color || "#6b7280",
                  border: "1px dashed #3b82f6",
                }}
              />
              <span title="一時作成された年表">
                📋 {timeline.name} (
                {timeline.eventCount || timeline.pendingCount || 0})
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 空状態メッセージ */}
      {!searchTerm &&
        !hasHighlightedEvents &&
        displayTimelines.length === 0 &&
        displayTempTimelines.length === 0 && (
          <div
            style={{
              fontSize: "12px",
              color: "#9ca3af",
              textAlign: "center",
              fontStyle: "italic",
              marginTop: "8px",
            }}
          >
            タグやキーワードで検索して
            <br />
            {isWikiMode ? "一時年表" : "年表"}を作成しましょう
          </div>
        )}
    </div>
  );
};

export default SearchPanel;
