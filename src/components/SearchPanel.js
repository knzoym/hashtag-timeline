import React from "react";

export const SearchPanel = ({
  searchTerm,
  highlightedEvents,
  timelines,
  onSearchChange,
  onCreateTimeline,
  onToggleTimeline,
  onDeleteTimeline,
  getTopTagsFromSearch,
  styles,
}) => {
  return (
    <div className="floating-panel" style={styles.searchPanel}>
      {/* 検索入力 */}
      <input
        type="text"
        placeholder="タグで絞り込み"
        value={searchTerm}
        onChange={onSearchChange}
        style={styles.searchInput}
      />

      {/* 上位タグ表示
      <div style={styles.tagSection}>
        <h3 style={styles.sectionTitle}>上位タグ</h3>
        <div style={styles.tagContainer}>
          {getTopTagsFromSearch().map((tag) => (
            <span key={tag} style={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      </div> */}

      {/* 年表作成ボタン */}
      <button
        style={{
          ...styles.createButton,
          opacity: highlightedEvents.size > 0 ? 1 : 0.5,
          cursor: highlightedEvents.size > 0 ? "pointer" : "not-allowed",
        }}
        disabled={highlightedEvents.size === 0}
        onClick={onCreateTimeline}
      >
        年表を作成{" "}
        {highlightedEvents.size > 0 && `(${highlightedEvents.size})`}
      </button>

    </div>
  );
};