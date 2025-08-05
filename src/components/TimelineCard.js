import React from "react";

export const TimelineCard = ({
  timeline,
  position,
  panY, // Add panY prop
  onDeleteTimeline,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        left: "20px",
        top: (position.y + panY) + "px", // Apply panY offset
        width: "240px",
        padding: "12px",
        backgroundColor: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        cursor: "default",
        zIndex: 10,
        userSelect: "none",
      }}
    >
      {/* Rest of the component remains the same */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "8px"
      }}>
        <div style={{
          fontSize: "14px",
          fontWeight: "600",
          color: "#374151",
          flex: 1,
          lineHeight: "1.2"
        }}>
          {timeline.name}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteTimeline(timeline.id);
          }}
          style={{
            background: "none",
            border: "none",
            color: "#ef4444",
            cursor: "pointer",
            fontSize: "16px",
            padding: "0",
            width: "20px",
            height: "20px",
            marginLeft: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          title="年表を削除"
        >
          ×
        </button>
      </div>

      <div style={{
        fontSize: "12px",
        color: "#6b7280",
        marginBottom: "8px"
      }}>
        {timeline.eventCount}件のイベント • {timeline.createdAt.toLocaleDateString()}
      </div>

      {timeline.events.length > 0 && (
        <div style={{
          fontSize: "11px",
          color: "#6b7280",
          marginBottom: "8px"
        }}>
          {Math.min(...timeline.events.map(e => e.startDate.getFullYear()))}年 - {" "}
          {Math.max(...timeline.events.map(e => e.startDate.getFullYear()))}年
        </div>
      )}

      {timeline.tags.length > 0 && (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px",
          marginBottom: "10px"
        }}>
          {timeline.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              style={{
                padding: "2px 6px",
                backgroundColor: "#f3f4f6",
                color: "#374151",
                fontSize: "10px",
                borderRadius: "3px",
                border: "1px solid #d1d5db"
              }}
            >
              {tag}
            </span>
          ))}
          {timeline.tags.length > 4 && (
            <span style={{
              fontSize: "10px",
              color: "#9ca3af",
              padding: "2px 4px"
            }}>
              +{timeline.tags.length - 4}
            </span>
          )}
        </div>
      )}
    </div>
  );
};