import React from "react";

export const TimelineCardList = ({ 
  timelines, 
  onToggleTimeline, 
  onDeleteTimeline,
  styles 
}) => {
  if (timelines.length === 0) return null;

  return (
    <div style={styles.timelineCardList}>
      <h3 style={styles.sectionTitle}>作成済み年表</h3>
      <div style={styles.cardContainer}>
        {timelines.map((timeline) => (
          <div
            key={timeline.id}
            style={{
              ...styles.timelineCard,
              backgroundColor: timeline.isVisible ? "#e0f2fe" : "#f9fafb",
              borderColor: timeline.isVisible ? "#0891b2" : "#e5e7eb",
            }}
            onClick={() => onToggleTimeline(timeline.id)}
          >
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>{timeline.name}</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTimeline(timeline.id);
                }}
                style={styles.deleteButton}
              >
                ×
              </button>
            </div>
            <div style={styles.cardInfo}>
              {timeline.eventCount}件 • {timeline.createdAt.toLocaleDateString()}
            </div>
            {timeline.tags.length > 0 && (
              <div style={styles.cardTags}>
                {timeline.tags.map((tag) => (
                  <span key={tag} style={styles.cardTag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div style={styles.visibilityIndicator}>
              {timeline.isVisible ? "表示中" : "非表示"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};