// src/components/ui/TimelineCard.js
import React, { useState } from 'react';

export const TimelineCard = ({
  timeline,
  position = { x: 0, y: 0 },
  panY = 0,
  panX = 0,
  onDeleteTimeline,
  onClick,
  onEdit,
  isDragging = false,
  style = {},
  showStats = true,
  compact = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // 統計情報の計算
  const stats = {
    totalEvents: (timeline.events?.length || 0) + 
                 (timeline.temporaryEvents?.length || 0),
    originalEvents: timeline.events?.length || 0,
    temporaryEvents: timeline.temporaryEvents?.length || 0,
    removedEvents: timeline.removedEvents?.length || 0,
    dateRange: null
  };
  
  // 日付範囲の計算
  if (timeline.events && timeline.events.length > 0) {
    const dates = timeline.events
      .map(e => e.startDate)
      .filter(Boolean)
      .sort((a, b) => a - b);
    
    if (dates.length > 0) {
      const startYear = dates[0].getFullYear();
      const endYear = dates[dates.length - 1].getFullYear();
      stats.dateRange = startYear === endYear ? 
        `${startYear}年` : 
        `${startYear}年 - ${endYear}年`;
    }
  }
  
  const baseStyles = {
    position: "absolute",
    left: `${position.x + panX - 220}px`,
    top: `${position.y + panY}px`,
    transform: "translateY(-50%)",
    width: compact ? "140px" : "200px",
    padding: compact ? "8px" : "12px",
    backgroundColor: "#ffffff",
    border: `2px solid ${timeline.color || "#e5e7eb"}`,
    borderRadius: "8px",
    cursor: onClick ? "pointer" : "default",
    zIndex: isDragging ? 1000 : 10,
    userSelect: "none",
    boxShadow: isHovered ? 
      "0 8px 25px rgba(0,0,0,0.15)" : 
      "0 2px 8px rgba(0,0,0,0.1)",
    transition: "all 0.2s ease",
    opacity: isDragging ? 0.8 : 1,
    ...style
  };
  
  const headerStyles = {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: compact ? "4px" : "8px"
  };
  
  const titleStyles = {
    fontSize: compact ? "12px" : "14px",
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
    lineHeight: "1.2",
    marginRight: "8px",
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical"
  };
  
  const buttonStyles = {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: compact ? "12px" : "14px",
    width: compact ? "16px" : "20px",
    height: compact ? "16px" : "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "3px",
    transition: "all 0.2s"
  };
  
  const statsStyles = {
    fontSize: compact ? "10px" : "11px",
    color: "#6b7280",
    marginBottom: compact ? "4px" : "6px"
  };
  
  const dateRangeStyles = {
    fontSize: compact ? "9px" : "10px",
    color: "#9ca3af",
    fontWeight: "500"
  };
  
  const colorIndicatorStyles = {
    position: "absolute",
    top: "0",
    left: "0",
    right: "0",
    height: "3px",
    backgroundColor: timeline.color || "#e5e7eb",
    borderRadius: "6px 6px 0 0"
  };
  
  const badgeStyles = {
    fontSize: "8px",
    padding: "2px 6px",
    borderRadius: "8px",
    fontWeight: "600",
    color: "white",
    marginLeft: "4px"
  };
  
  return (
    <div
      style={baseStyles}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={timeline.description || timeline.name}
    >
      {/* カラーインジケーター */}
      <div style={colorIndicatorStyles} />
      
      {/* ヘッダー */}
      <div style={headerStyles}>
        <div style={titleStyles}>
          {timeline.name}
          {timeline.isTemporary && (
            <span style={{
              ...badgeStyles,
              backgroundColor: "#f59e0b"
            }}>
              仮
            </span>
          )}
          {timeline.isPublic && (
            <span style={{
              ...badgeStyles,
              backgroundColor: "#3b82f6"
            }}>
              公開
            </span>
          )}
        </div>
        
        <div style={{ display: "flex", gap: "2px" }}>
          {/* 編集ボタン */}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(timeline);
              }}
              style={{
                ...buttonStyles,
                color: "#6b7280"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#f3f4f6";
                e.target.style.color = "#374151";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "#6b7280";
              }}
              title="年表を編集"
            >
              ✏️
            </button>
          )}
          
          {/* 削除ボタン */}
          {onDeleteTimeline && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`年表「${timeline.name}」を削除しますか？`)) {
                  onDeleteTimeline(timeline.id);
                }
              }}
              style={{
                ...buttonStyles,
                color: "#ef4444"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#fecaca";
                e.target.style.color = "#dc2626";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "#ef4444";
              }}
              title="年表を削除"
            >
              ×
            </button>
          )}
        </div>
      </div>
      
      {/* 統計情報 */}
      {showStats && (
        <div style={statsStyles}>
          <div style={{ marginBottom: "2px" }}>
            📊 {stats.totalEvents} 件のイベント
          </div>
          
          {!compact && (stats.temporaryEvents > 0 || stats.removedEvents > 0) && (
            <div style={{ fontSize: "9px", color: "#9ca3af" }}>
              {stats.temporaryEvents > 0 && `仮登録: ${stats.temporaryEvents}`}
              {stats.temporaryEvents > 0 && stats.removedEvents > 0 && " / "}
              {stats.removedEvents > 0 && `削除: ${stats.removedEvents}`}
            </div>
          )}
          
          {stats.dateRange && (
            <div style={dateRangeStyles}>
              📅 {stats.dateRange}
            </div>
          )}
        </div>
      )}
      
      {/* タグ表示（非コンパクトモード） */}
      {!compact && timeline.tags && timeline.tags.length > 0 && (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "2px",
          marginTop: "4px"
        }}>
          {timeline.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              style={{
                fontSize: "8px",
                padding: "1px 4px",
                backgroundColor: "#f3f4f6",
                color: "#6b7280",
                borderRadius: "6px",
                fontWeight: "500"
              }}
            >
              #{tag}
            </span>
          ))}
          {timeline.tags.length > 3 && (
            <span style={{
              fontSize: "8px",
              color: "#9ca3af",
              fontStyle: "italic"
            }}>
              +{timeline.tags.length - 3}
            </span>
          )}
        </div>
      )}
      
      {/* ドラッグ中のオーバーレイ */}
      {isDragging && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "10px",
          fontWeight: "600",
          color: "#3b82f6"
        }}>
          移動中...
        </div>
      )}
    </div>
  );
};