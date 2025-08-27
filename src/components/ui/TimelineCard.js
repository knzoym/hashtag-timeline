// TimelineCard.js の適切な修正
// 既存の実装を尊重し、panY の適切な反映のみを修正

import React, { memo } from 'react';

const TimelineCard = memo(({
  timeline,
  position, // { x, y } - y は既に panY が考慮済み
  compact = false,
  onEdit,
  onDelete,
  onToggleVisibility,
  onClick,
  style = {}
}) => {
  // 統計情報の計算（既存ロジックを維持）
  const stats = {
    originalEvents: timeline.events?.length || 0,
    temporaryEvents: timeline.temporaryEvents?.length || 0,
    removedEvents: timeline.removedEvents?.length || 0,
    get totalEvents() {
      return this.originalEvents + this.temporaryEvents;
    }
  };

  // 日付範囲の計算
  let dateRange = null;
  const allEvents = [...(timeline.events || []), ...(timeline.temporaryEvents || [])];
  if (allEvents.length > 0) {
    const dates = allEvents
      .filter(event => event.startDate)
      .map(event => new Date(event.startDate))
      .sort((a, b) => a - b);
    
    if (dates.length > 0) {
      const minYear = dates[0].getFullYear();
      const maxYear = dates[dates.length - 1].getFullYear();
      dateRange = minYear === maxYear ? `${minYear}年` : `${minYear}年〜${maxYear}年`;
    }
  }

  const baseStyles = {
    position: "absolute",
    left: `${position.x}px`,
    top: `${position.y}px`, // panY は呼び出し側で既に考慮済み
    width: compact ? "180px" : "220px",
    minHeight: compact ? "80px" : "120px",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(8px)",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    cursor: onClick ? "pointer" : "default",
    padding: compact ? "8px" : "12px",
    zIndex: 25,
    ...style
  };

  const headerStyles = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: compact ? "6px" : "8px"
  };

  const titleStyles = {
    fontSize: compact ? "12px" : "14px",
    fontWeight: "600",
    color: "#1f2937",
    lineHeight: "1.2",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    flex: 1
  };

  const buttonStyles = {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px",
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

  return (
    <div
      style={baseStyles}
      onClick={onClick}
      className="no-pan" // パン操作を無効化
    >
      {/* カラーインジケーター */}
      <div style={colorIndicatorStyles} />
      
      {/* ヘッダー */}
      <div style={headerStyles}>
        <div style={titleStyles}>
          {timeline.name || '無題の年表'}
          {timeline.isTemporary && (
            <span style={{
              fontSize: "8px",
              padding: "2px 6px",
              borderRadius: "8px",
              fontWeight: "600",
              color: "white",
              backgroundColor: "#f59e0b",
              marginLeft: "4px"
            }}>
              仮
            </span>
          )}
        </div>
        
        <div style={{ display: "flex", gap: "2px" }}>
          {/* 表示/非表示切り替え */}
          {onToggleVisibility && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(timeline.id);
              }}
              style={{
                ...buttonStyles,
                color: timeline.isVisible ? "#6b7280" : "#d1d5db"
              }}
              title={timeline.isVisible ? "非表示にする" : "表示する"}
            >
              {timeline.isVisible ? "👁️" : "👁️‍🗨️"}
            </button>
          )}
          
          {/* 編集ボタン */}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(timeline);
              }}
              style={buttonStyles}
              title="編集"
            >
              ✏️
            </button>
          )}
          
          {/* 削除ボタン */}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`年表「${timeline.name}」を削除しますか？`)) {
                  onDelete(timeline.id);
                }
              }}
              style={{
                ...buttonStyles,
                color: "#ef4444"
              }}
              title="削除"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
      
      {/* 統計情報（非コンパクトモード） */}
      {!compact && (
        <div style={statsStyles}>
          {stats.totalEvents > 0 && `📊 ${stats.totalEvents}件`}
          {stats.temporaryEvents > 0 && ` (仮: ${stats.temporaryEvents})`}
          {stats.removedEvents > 0 && ` (削除: ${stats.removedEvents})`}
        </div>
      )}
      
      {/* 日付範囲 */}
      {!compact && dateRange && (
        <div style={dateRangeStyles}>
          📅 {dateRange}
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
    </div>
  );
});

TimelineCard.displayName = 'TimelineCard';

export { TimelineCard };