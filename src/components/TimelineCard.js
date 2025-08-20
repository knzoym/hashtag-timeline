// src/components/TimelineCard.js
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
        left: (position.x) - 220 + "px",
        top: (position.y + panY) + "px", // Apply panY offset
        transform: "translateY(-50%)",
        width: "160px", 
        padding: "8px", 
        backgroundColor: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: "6px", 
        cursor: "default",
        zIndex: 3,
        userSelect: "none",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)", 
      }}
    >
        {/* 削除ボタン */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteTimeline(timeline.id);
          }}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "none",
            border: "none",
            color: "#ef4444",
            cursor: "pointer",
            fontSize: "14px", 
            width: "18px", 
            height: "18px", 
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          title="年表を削除"
        >
          ×
        </button>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "4px" 
      }}>
        <div style={{
          fontSize: "13px", 
          fontWeight: "600",
          color: "#374151",
          flex: 1,
          lineHeight: "1.2"
        }}>
          {timeline.name} ({timeline.eventCount})
        </div>
      </div>

      <div style={{
        fontSize: "11px", 
        color: "#6b7280",
        marginBottom: "6px" 
      }}>
      </div>

      {timeline.events.length > 0 && (
        <div style={{
          fontSize: "10px", 
          color: "#6b7280",
          marginBottom: "6px" 
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
          marginBottom: "4px" 
        }}>
          {timeline.tags.slice(0, 3).map((tag) => ( 
            <span
              key={tag}
              style={{
                padding: "1px 5px", 
                backgroundColor: "#f3f4f6",
                color: "#374151",
                fontSize: "9px", 
                borderRadius: "3px",
                border: "1px solid #d1d5db"
              }}
            >
              {tag}
            </span>
          ))}
          {timeline.tags.length > 3 && ( 
            <span style={{
              fontSize: "9px", 
              color: "#9ca3af",
              padding: "1px 4px" 
            }}>
              +{timeline.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
};