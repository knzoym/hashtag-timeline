// src/components/ui/EventGroup.js - 大型化・色統一・25%位置対応版
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
  
  // 大型化されたサイズ設定
  const iconSize = Math.max(TIMELINE_CONFIG.GROUP_ICON_SIZE, TIMELINE_CONFIG.GROUP_ICON_SIZE * scale);
  const fontSize = Math.max(TIMELINE_CONFIG.GROUP_FONT_SIZE, TIMELINE_CONFIG.GROUP_FONT_SIZE * scale);
  const yearFontSize = Math.max(12, 14 * scale);
  
  // 年表色を使用（グループデータから取得、なければデフォルト）
  const groupColor = groupData.timelineColor || timelineColor;
  
  const baseStyles = {
    position: "absolute",
    cursor: "pointer",
    zIndex: isHighlighted ? 50 : 30,
    textAlign: "center",
    userSelect: "none",
    transition: "all 0.2s ease",
    // パフォーマンス改善：transformを使用してGPU加速
    transform: `translate(${position.x - 21}px, ${position.y + panY - 10}px)`,
    willChange: 'transform',
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
        marginBottom: "4px",
        fontWeight: "500"
      }}>
        {yearDisplay}
      </div>
      
      {/* グループアイコン（大型化・年表色統一） */}
      <div
        style={{
          width: `${iconSize}px`,
          height: `${Math.max(18, 20 * scale)}px`,
          borderRadius: "6px", // 4px → 6px（大型化）
          backgroundColor: groupColor, // 年表色を使用
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: `${fontSize}px`,
          fontWeight: "700", // 600 → 700（強調）
          border: "3px solid rgba(255,255,255,0.9)", // 2px → 3px（大型化）
          boxShadow: isHovered ? 
            "0 6px 16px rgba(0, 0, 0, 0.25)" : // 強化されたシャドウ
            "0 3px 8px rgba(0, 0, 0, 0.15)",
          padding: "3px 6px", // 2px 4px → 3px 6px（大型化）
          transform: isHovered ? "scale(1.15)" : "scale(1)", // 1.1 → 1.15（より大きく）
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
          marginTop: "6px", // 4px → 6px（大型化）
          padding: "3px 8px", // 2px 6px → 3px 8px（大型化）
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          color: "white",
          borderRadius: "5px",
          fontSize: "10px",
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
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        color: "white",
        padding: "14px 18px", // 12px 16px → 14px 18px（大型化）
        borderRadius: "10px", // 8px → 10px（大型化）
        fontSize: "13px", // 12px → 13px（大型化）
        maxWidth: "320px", // 280px → 320px（大型化）
        minWidth: "220px", // 200px → 220px（大型化）
        zIndex: 1000,
        pointerEvents: "none",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)", // 強化されたシャドウ
        border: "1px solid rgba(255, 255, 255, 0.15)",
        // パフォーマンス改善：transformを使用
        transform: `translate(${position.x + panX + 30}px, ${position.y + panY - 12}px)`,
        willChange: 'transform'
      }}
    >
      {/* ヘッダー */}
      <div style={{ 
        fontWeight: "bold", 
        marginBottom: "10px", // 8px → 10px（大型化）
        fontSize: "14px", // 13px → 14px（大型化）
        borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
        paddingBottom: "8px" // 6px → 8px（大型化）
      }}>
        📋 {events.length}個のイベント
      </div>
      
      {/* イベントリスト */}
      <div style={{ marginBottom: "10px" }}>
        {displayEvents.map((event, index) => (
          <div key={event.id || index} style={{ 
            fontSize: "12px", 
            opacity: 0.9, 
            marginBottom: "5px", // 4px → 5px（大型化）
            display: "flex",
            alignItems: "center",
            gap: "8px" // 6px → 8px（大型化）
          }}>
            <div style={{
              width: "5px", // 4px → 5px（大型化）
              height: "5px",
              backgroundColor: groupData.timelineColor || "rgba(255, 255, 255, 0.6)",
              borderRadius: "50%",
              flexShrink: 0
            }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: "500" }}>
                {event.title || '（無題）'}
              </span>
              {showYears && event.startDate && (
                <span style={{ opacity: 0.7, marginLeft: "8px" }}>
                  ({event.startDate.getFullYear()})
                </span>
              )}
            </div>
          </div>
        ))}
        
        {remainingCount > 0 && (
          <div style={{ 
            fontSize: "11px", 
            opacity: 0.7,
            fontStyle: "italic",
            textAlign: "center",
            marginTop: "8px", // 6px → 8px（大型化）
            padding: "5px 0", // 4px 0 → 5px 0（大型化）
            borderTop: "1px solid rgba(255, 255, 255, 0.1)"
          }}>
            他 {remainingCount} 件...
          </div>
        )}
      </div>
      
      {/* フッター */}
      <div style={{ 
        fontSize: "11px", 
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
  maxHeight = "450px", // 400px → 450px（大型化）
  style = {}
}) => {
  const [hoveredEventId, setHoveredEventId] = useState(null);
  
  if (!groupData) return null;
  
  const events = groupData.events || [];
  if (events.length === 0) return null;
  
  // 年表色を使用
  const groupColor = groupData.timelineColor || timelineColor;
  
  const baseStyles = {
    position: "absolute",
    width: "360px", // 320px → 360px（大型化）
    maxHeight,
    backgroundColor: "white",
    border: `3px solid ${groupColor}`, // 2px → 3px、年表色使用
    borderRadius: "14px", // 12px → 14px（大型化）
    boxShadow: "0 16px 48px rgba(0, 0, 0, 0.3)", // 強化されたシャドウ
    zIndex: 1000,
    overflow: "hidden",
    // パフォーマンス改善：transformを使用
    transform: `translate(${position.x + panX}px, ${position.y + panY}px)`,
    willChange: 'transform',
    ...style
  };
  
  const headerStyles = {
    backgroundColor: groupColor, // 年表色を使用
    color: "white",
    padding: "18px 22px", // 16px 20px → 18px 22px（大型化）
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };
  
  const contentStyles = {
    maxHeight: "calc(450px - 70px)", // 調整
    overflowY: "auto",
    overflowX: "hidden"
  };
  
  const eventItemStyles = {
    padding: "14px 18px", // 12px 16px → 14px 18px（大型化）
    borderBottom: "1px solid #f3f4f6",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "flex-start",
    gap: "14px" // 12px → 14px（大型化）
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
          <div style={{ fontWeight: "bold", fontSize: "17px", marginBottom: "3px" }}>
            📋 イベントグループ
          </div>
          <div style={{ fontSize: "13px", opacity: 0.9 }}>
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
            fontSize: "22px", // 20px → 22px（大型化）
            padding: "5px", // 4px → 5px（大型化）
            width: "36px", // 32px → 36px（大型化）
            height: "36px",
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
              width: "10px", // 8px → 10px（大型化）
              height: "10px",
              backgroundColor: groupColor, // 年表色を使用
              borderRadius: "50%",
              marginTop: "7px" // 6px → 7px（大型化）
            }} />
            
            {/* イベント情報 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* タイトル */}
              <div style={{
                fontWeight: "600",
                fontSize: "15px", // 14px → 15px（大型化）
                color: "#1f2937",
                marginBottom: "5px", // 4px → 5px（大型化）
                lineHeight: "1.3"
              }}>
                {event.title || '（無題）'}
              </div>
              
              {/* 日付 */}
              {event.startDate && (
                <div style={{
                  fontSize: "13px", // 12px → 13px（大型化）
                  color: "#6b7280",
                  marginBottom: "5px"
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
                  fontSize: "13px",
                  color: "#6b7280",
                  marginBottom: "7px", // 6px → 7px（大型化）
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
                  gap: "5px" // 4px → 5px（大型化）
                }}>
                  {event.tags.slice(0, 3).map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      style={{
                        fontSize: "11px",
                        padding: "3px 7px", // 2px 6px → 3px 7px（大型化）
                        backgroundColor: "#e0f2fe",
                        color: "#0891b2",
                        borderRadius: "9px", // 8px → 9px（大型化）
                        fontWeight: "500"
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                  {event.tags.length > 3 && (
                    <span style={{
                      fontSize: "11px",
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
                fontSize: "11px",
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
          padding: "14px 18px", // 12px 16px → 14px 18px（大型化）
          backgroundColor: "#f9fafb",
          fontSize: "12px",
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