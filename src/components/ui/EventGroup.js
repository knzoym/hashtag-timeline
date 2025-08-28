// src/components/ui/EventGroup.js
import React, { useState } from "react";
import { TIMELINE_CONFIG } from "../../constants/timelineConfig";

export const EventGroupIcon = ({ 
  groupData, 
  position, 
  panY = 0, 
  panX = 0,
  timelineColor = "#6b7280",
  onHover,
  onDoubleClick,
  onClick,
  isHighlighted = false,
  scale = 1,
  style = {}
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  if (!groupData) return null;
  
  const count = groupData.getDisplayCount ? groupData.getDisplayCount() : groupData.events?.length || 0;
  
  // グループ内イベントの年数範囲を取得
  const events = groupData.events || [];
  if (events.length === 0) return null;
  
  const years = events
    .map(event => event.startDate ? event.startDate.getFullYear() : null)
    .filter(Boolean)
    .sort((a, b) => a - b);
    
  const minYear = years[0];
  const maxYear = years[years.length - 1];
  const yearDisplay = minYear === maxYear ? `${minYear}` : `${minYear}-${maxYear}`;
  
  const iconSize = Math.max(20, 30 * scale);
  const fontSize = Math.max(8, 11 * scale);
  const yearFontSize = Math.max(7, 10 * scale);
  
  const baseStyles = {
    position: "absolute",
    left: position.x,
    top: position.y + panY - 7,
    transform: "translateX(-50%)",
    cursor: "pointer",
    zIndex: isHighlighted ? 50 : 30,
    textAlign: "center",
    userSelect: "none",
    transition: "all 0.2s ease",
    ...style
  };
  
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (onHover) onHover(groupData.id, groupData);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    if (onHover) onHover(null, null);
  };
  
  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) onClick(groupData.id, groupData);
  };
  
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (onDoubleClick) onDoubleClick(e, groupData);
  };
  
  return (
    <div
      data-event-id={groupData.getMainEvent ? groupData.getMainEvent().id : events[0]?.id}
      data-is-group="true"
      data-group-id={groupData.id}
      style={baseStyles}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleDoubleClick}
      title={`${count}個のイベント (${yearDisplay})\nクリックで展開`}
    >
      {/* 年数表示 */}
      <div style={{ 
        fontSize: `${yearFontSize}px`, 
        color: "#666", 
        marginBottom: "2px",
        fontWeight: "500"
      }}>
        {yearDisplay}
      </div>
      
      {/* グループアイコン */}
      <div
        style={{
          width: `${iconSize}px`,
          height: `${Math.max(12, 14 * scale)}px`,
          borderRadius: "4px",
          backgroundColor: timelineColor,
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: `${fontSize}px`,
          fontWeight: "600",
          border: "2px solid rgba(255,255,255,0.9)",
          boxShadow: isHovered ? 
            "0 4px 12px rgba(0, 0, 0, 0.2)" : 
            "0 2px 6px rgba(0, 0, 0, 0.1)",
          padding: "2px 4px",
          transform: isHovered ? "scale(1.1)" : "scale(1)",
          transition: "all 0.2s ease"
        }}
      >
        +{count}
      </div>
      
      {/* ホバー時の追加情報 */}
      {isHovered && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          marginTop: "4px",
          padding: "2px 6px",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          color: "white",
          borderRadius: "4px",
          fontSize: "9px",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          zIndex: 1000
        }}>
          クリックで展開
        </div>
      )}
    </div>
  );
};

export const GroupTooltip = ({ 
  groupData, 
  position, 
  panY = 0,
  panX = 0,
  maxItems = 5,
  showYears = true
}) => {
  if (!groupData || !position) return null;

  const events = groupData.events || [];
  if (events.length === 0) return null;
  
  const displayEvents = events.slice(0, maxItems);
  const remainingCount = events.length - maxItems;

  return (
    <div
      style={{
        position: "absolute",
        left: position.x + panX + 25,
        top: position.y + panY - 10,
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        color: "white",
        padding: "12px 16px",
        borderRadius: "8px",
        fontSize: "12px",
        maxWidth: "280px",
        minWidth: "200px",
        zIndex: 1000,
        pointerEvents: "none",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
        border: "1px solid rgba(255, 255, 255, 0.1)"
      }}
    >
      {/* ヘッダー */}
      <div style={{ 
        fontWeight: "bold", 
        marginBottom: "8px",
        fontSize: "13px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
        paddingBottom: "6px"
      }}>
        📁 {events.length}個のイベント
      </div>
      
      {/* イベントリスト */}
      <div style={{ marginBottom: "8px" }}>
        {displayEvents.map((event, index) => (
          <div key={event.id || index} style={{ 
            fontSize: "11px", 
            opacity: 0.9, 
            marginBottom: "4px",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}>
            <div style={{
              width: "4px",
              height: "4px",
              backgroundColor: "rgba(255, 255, 255, 0.6)",
              borderRadius: "50%",
              flexShrink: 0
            }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: "500" }}>
                {event.title || '（無題）'}
              </span>
              {showYears && event.startDate && (
                <span style={{ opacity: 0.7, marginLeft: "6px" }}>
                  ({event.startDate.getFullYear()})
                </span>
              )}
            </div>
          </div>
        ))}
        
        {remainingCount > 0 && (
          <div style={{ 
            fontSize: "10px", 
            opacity: 0.7,
            fontStyle: "italic",
            textAlign: "center",
            marginTop: "6px",
            padding: "4px 0",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)"
          }}>
            他 {remainingCount} 件...
          </div>
        )}
      </div>
      
      {/* フッター */}
      <div style={{ 
        fontSize: "10px", 
        opacity: 0.7,
        textAlign: "center",
        fontStyle: "italic"
      }}>
        💡 クリックで詳細表示
      </div>
    </div>
  );
};

export const GroupCard = ({ 
  groupData, 
  position, 
  panY = 0, 
  panX = 0, 
  timelineColor = "#6b7280",
  onEventDoubleClick,
  onClose,
  onEventClick,
  maxHeight = "400px",
  style = {}
}) => {
  const [hoveredEventId, setHoveredEventId] = useState(null);
  
  if (!groupData) return null;
  
  const events = groupData.events || [];
  if (events.length === 0) return null;
  
  const baseStyles = {
    position: "absolute",
    left: position.x + panX,
    top: position.y + panY,
    width: "320px",
    maxHeight,
    backgroundColor: "white",
    border: `2px solid ${timelineColor}`,
    borderRadius: "12px",
    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.25)",
    zIndex: 1000,
    overflow: "hidden",
    ...style
  };
  
  const headerStyles = {
    backgroundColor: timelineColor,
    color: "white",
    padding: "16px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };
  
  const contentStyles = {
    maxHeight: "calc(400px - 60px)",
    overflowY: "auto",
    overflowX: "hidden"
  };
  
  const eventItemStyles = {
    padding: "12px 16px",
    borderBottom: "1px solid #f3f4f6",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px"
  };
  
  // イベントクリックハンドラー
  const handleEventClick = (event) => {
    if (onEventClick) {
      onEventClick(event);
    }
  };
  
  const handleEventDoubleClick = (event) => {
    if (onEventDoubleClick) {
      onEventDoubleClick(event);
    }
  };
  
  return (
    <div style={baseStyles}>
      {/* ヘッダー */}
      <div style={headerStyles}>
        <div>
          <div style={{ fontWeight: "bold", fontSize: "16px", marginBottom: "2px" }}>
            📁 イベントグループ
          </div>
          <div style={{ fontSize: "12px", opacity: 0.9 }}>
            {events.length} 件のイベント
          </div>
        </div>
        
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "white",
            cursor: "pointer",
            fontSize: "20px",
            padding: "4px",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            opacity: 0.8,
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
            e.target.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "transparent";
            e.target.style.opacity = "0.8";
          }}
          title="グループを閉じる"
        >
          ×
        </button>
      </div>
      
      {/* コンテンツ */}
      <div style={contentStyles}>
        {events.map((event, index) => (
          <div
            key={event.id || index}
            style={{
              ...eventItemStyles,
              backgroundColor: hoveredEventId === event.id ? "#f8fafc" : "transparent"
            }}
            onClick={() => handleEventClick(event)}
            onDoubleClick={() => handleEventDoubleClick(event)}
            onMouseEnter={() => setHoveredEventId(event.id)}
            onMouseLeave={() => setHoveredEventId(null)}
          >
            {/* 日付インジケーター */}
            <div style={{
              flexShrink: 0,
              width: "8px",
              height: "8px",
              backgroundColor: timelineColor,
              borderRadius: "50%",
              marginTop: "6px"
            }} />
            
            {/* イベント情報 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* タイトル */}
              <div style={{
                fontWeight: "600",
                fontSize: "14px",
                color: "#1f2937",
                marginBottom: "4px",
                lineHeight: "1.3"
              }}>
                {event.title || '（無題）'}
              </div>
              
              {/* 日付 */}
              {event.startDate && (
                <div style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "4px"
                }}>
                  📅 {event.startDate.toLocaleDateString('ja-JP')}
                  {event.endDate && event.endDate !== event.startDate && 
                    ` - ${event.endDate.toLocaleDateString('ja-JP')}`
                  }
                </div>
              )}
              
              {/* 説明（短縮版） */}
              {event.description && (
                <div style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "6px",
                  lineHeight: "1.4",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical"
                }}>
                  {event.description}
                </div>
              )}
              
              {/* タグ */}
              {event.tags && event.tags.length > 0 && (
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "4px"
                }}>
                  {event.tags.slice(0, 3).map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      style={{
                        fontSize: "10px",
                        padding: "2px 6px",
                        backgroundColor: "#e0f2fe",
                        color: "#0891b2",
                        borderRadius: "8px",
                        fontWeight: "500"
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                  {event.tags.length > 3 && (
                    <span style={{
                      fontSize: "10px",
                      color: "#9ca3af",
                      fontStyle: "italic"
                    }}>
                      +{event.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* アクション */}
            <div style={{
              flexShrink: 0,
              opacity: hoveredEventId === event.id ? 1 : 0,
              transition: "opacity 0.2s ease"
            }}>
              <div style={{
                fontSize: "10px",
                color: "#9ca3af",
                textAlign: "center"
              }}>
                ダブルクリック<br/>で編集
              </div>
            </div>
          </div>
        ))}
        
        {/* フッター情報 */}
        <div style={{
          padding: "12px 16px",
          backgroundColor: "#f9fafb",
          fontSize: "11px",
          color: "#6b7280",
          textAlign: "center",
          borderTop: "1px solid #e5e7eb"
        }}>
          💡 各イベントをダブルクリックで詳細編集
        </div>
      </div>
    </div>
  );
};