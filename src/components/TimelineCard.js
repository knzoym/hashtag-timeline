// components/TimelineCard.js
import React from "react";

export const TimelineCard = ({ 
  timeline, 
  position,
  onToggleTimeline, 
  onDeleteTimeline,
  onCardDragStart,
  onCardDrag,
  onCardDragEnd,
  isDragging
}) => {
  const handleMouseDown = (e) => {
    e.stopPropagation();
    onCardDragStart(timeline.id, e);
  };

  return (
    <div
      style={{
        position: "absolute",
        left: "20px",
        top: position.y + "px",
        width: "240px",
        padding: "12px",
        backgroundColor: timeline.isVisible ? "#e0f2fe" : "#f9fafb",
        border: timeline.isVisible ? "2px solid #0891b2" : "1px solid #e5e7eb",
        borderRadius: "8px",
        boxShadow: isDragging 
          ? "0 8px 25px rgba(0, 0, 0, 0.3)" 
          : "0 4px 12px rgba(0, 0, 0, 0.15)",
        cursor: isDragging ? "grabbing" : "grab",
        zIndex: isDragging ? 15 : 10,
        userSelect: "none",
        transform: isDragging ? "scale(1.02)" : "scale(1)",
        transition: isDragging ? "none" : "all 0.2s ease",
      }}
      onMouseDown={handleMouseDown}
    >
      {/* ヘッダー */}
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

      {/* 統計情報 */}
      <div style={{
        fontSize: "12px",
        color: "#6b7280",
        marginBottom: "8px"
      }}>
        {timeline.eventCount}件のイベント • {timeline.createdAt.toLocaleDateString()}
      </div>

      {/* 年代範囲 */}
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

      {/* タグ */}
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
                backgroundColor: timeline.isVisible ? "#cce7ff" : "#f3f4f6",
                color: timeline.isVisible ? "#0369a1" : "#374151",
                fontSize: "10px",
                borderRadius: "3px",
                border: timeline.isVisible ? "1px solid #0891b2" : "1px solid #d1d5db"
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

      {/* 表示切り替えボタン */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleTimeline(timeline.id);
        }}
        style={{
          width: "100%",
          padding: "6px 12px",
          backgroundColor: timeline.isVisible ? "#0891b2" : "#6b7280",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: "500",
          transition: "background-color 0.2s"
        }}
      >
        {timeline.isVisible ? "非表示にする" : "表示する"}
      </button>

      {/* ドラッグハンドル */}
      <div style={{
        position: "absolute",
        right: "8px",
        top: "8px",
        width: "16px",
        height: "16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "2px",
        cursor: "grab",
        opacity: 0.5
      }}>
        <div style={{ width: "3px", height: "3px", backgroundColor: "#9ca3af", borderRadius: "50%" }} />
        <div style={{ width: "3px", height: "3px", backgroundColor: "#9ca3af", borderRadius: "50%" }} />
        <div style={{ width: "3px", height: "3px", backgroundColor: "#9ca3af", borderRadius: "50%" }} />
      </div>
    </div>
  );
};