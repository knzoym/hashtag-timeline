// components/SearchPanel.js
import React from "react";

export const SearchPanel = ({
  searchTerm,
  highlightedEvents,
  createdTimelines,
  onSearchChange,
  onCreateTimeline,
  onViewTimeline,
  getTopTagsFromSearch,
  styles,
}) => {
  return (
    <div className="floating-panel" style={styles.floatingPanel}>
      {/* 検索入力 */}
      <input
        type="text"
        placeholder="タグで絞り込み"
        value={searchTerm}
        onChange={onSearchChange}
        style={styles.searchInput}
      />

      {/* 上位タグ表示 */}
      <div style={styles.tagSection}>
        <h3 style={styles.sectionTitle}>上位タグ</h3>
        <div style={styles.tagContainer}>
          {getTopTagsFromSearch().map((tag) => (
            <span key={tag} style={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>

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

      {/* 作成済み年表一覧 */}
      {createdTimelines.length > 0 && (
        <div style={styles.timelineSection}>
          <h3 style={styles.sectionTitle}>作成済み年表</h3>
          <div style={styles.timelineList}>
            {createdTimelines.slice(0, 3).map((timeline) => (
              <div
                key={timeline.id}
                style={styles.timelineItem}
                onClick={() => onViewTimeline(timeline)}
              >
                <div style={styles.timelineItemTitle}>
                  {timeline.name}
                </div>
                <div style={styles.timelineItemInfo}>
                  {timeline.eventCount}件 • {timeline.createdAt.toLocaleDateString()}
                </div>
              </div>
            ))}
            {createdTimelines.length > 3 && (
              <div style={styles.timelineItemMore}>
                +{createdTimelines.length - 3}件の年表
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};