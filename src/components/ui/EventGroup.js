// src/components/ui/EventGroup.js - 固定サイズ・クリック詳細表示版
import React, { useState } from "react";

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
  scale = 1, // 使用しない（固定サイズ）
  style = {}
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  
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
  
  // 固定サイズ設定（scaleに依存しない）
  const iconSize = 42; // 固定値
  const fontSize = 14; // 固定値
  const yearFontSize = 12; // 固定値
  
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
    // クリックで詳細ポップアップ表示
    setShowDetailPopup(true);
    if (onClick) onClick(groupData.id, groupData);
  };
  
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (onDoubleClick) onDoubleClick(e, groupData);
  };

  const handleCloseDetail = () => {
    setShowDetailPopup(false);
  };
  
  return (
    <>
      <div
        data-event-id={groupData.getMainEvent ? groupData.getMainEvent().id : events[0]?.id}
        data-is-group="true"
        data-group-id={groupData.id}
        style={baseStyles}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
        title={`${count}個のイベント (${yearDisplay})\nクリックで詳細表示`}
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
        
        {/* グループアイコン（固定サイズ・年表色統一） */}
        <div
          style={{
            width: `${iconSize}px`,
            height: "22px", // 固定値
            borderRadius: "6px",
            backgroundColor: groupColor, // 年表色を使用
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: `${fontSize}px`,
            fontWeight: "700",
            border: "3px solid rgba(255,255,255,0.9)",
            boxShadow: isHovered ? 
              "0 6px 16px rgba(0, 0, 0, 0.25)" : 
              "0 3px 8px rgba(0, 0, 0, 0.15)",
            padding: "3px 6px",
            transform: isHovered ? "scale(1.15)" : "scale(1)",
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
            marginTop: "6px",
            padding: "3px 8px",
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            color: "white",
            borderRadius: "5px",
            fontSize: "10px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 1000
          }}>
            クリックで詳細表示
          </div>
        )}
      </div>

      {/* クリック時の詳細ポップアップ */}
      {showDetailPopup && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "400px",
            maxHeight: "500px",
            backgroundColor: "white",
            border: `3px solid ${groupColor}`,
            borderRadius: "12px",
            boxShadow: "0 16px 48px rgba(0, 0, 0, 0.3)",
            zIndex: 2000,
            overflow: "hidden"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div style={{
            backgroundColor: groupColor,
            color: "white",
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <div style={{ fontWeight: "bold", fontSize: "16px", marginBottom: "2px" }}>
                イベントグループ詳細
              </div>
              <div style={{ fontSize: "13px", opacity: 0.9 }}>
                {events.length} 件のイベント ({yearDisplay})
              </div>
            </div>
            
            <button
              onClick={handleCloseDetail}
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
            >
              ×
            </button>
          </div>
          
          {/* コンテンツ */}
          <div style={{
            maxHeight: "350px",
            overflowY: "auto",
            overflowX: "hidden"
          }}>
            {events.map((event, index) => (
              <div
                key={event.id || index}
                style={{
                  padding: "12px 16px",
                  borderBottom: index < events.length - 1 ? "1px solid #f3f4f6" : "none",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px"
                }}
              >
                {/* 日付インジケーター */}
                <div style={{
                  flexShrink: 0,
                  width: "8px",
                  height: "8px",
                  backgroundColor: groupColor,
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
              </div>
            ))}
          </div>
          
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
      )}

      {/* ポップアップ背景オーバーレイ */}
      {showDetailPopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1999
          }}
          onClick={handleCloseDetail}
        />
      )}
    </>
  );
};

export const GroupTooltip = ({ 
  groupData, 
  position, 
  panY = 0,
  panX = 0,
  maxItems = 5,
  showYears = true,
  onClick = null // クリック機能追加
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
        padding: "14px 18px",
        borderRadius: "10px",
        fontSize: "13px",
        maxWidth: "320px",
        minWidth: "220px",
        zIndex: 1000,
        pointerEvents: "auto", // クリック可能にする
        cursor: "pointer", // クリック可能を示す
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        // パフォーマンス改善：transformを使用
        transform: `translate(${position.x + panX + 30}px, ${position.y + panY - 12}px)`,
        willChange: 'transform'
      }}
      onClick={onClick} // クリック機能追加
    >
      {/* ヘッダー */}
      <div style={{ 
        fontWeight: "bold", 
        marginBottom: "10px",
        fontSize: "14px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
        paddingBottom: "8px"
      }}>
        📋 {events.length}個のイベント
      </div>
      
      {/* イベントリスト */}
      <div style={{ marginBottom: "10px" }}>
        {displayEvents.map((event, index) => (
          <div key={event.id || index} style={{ 
            fontSize: "12px", 
            opacity: 0.9, 
            marginBottom: "5px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <div style={{
              width: "5px",
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
            marginTop: "8px",
            padding: "5px 0",
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
  maxHeight = "450px",
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
    width: "360px",
    maxHeight,
    backgroundColor: "white",
    border: `3px solid ${groupColor}`,
    borderRadius: "14px",
    boxShadow: "0 16px 48px rgba(0, 0, 0, 0.3)",
    zIndex: 1000,
    overflow: "hidden",
    // パフォーマンス改善：transformを使用
    transform: `translate(${position.x + panX}px, ${position.y + panY}px)`,
    willChange: 'transform',
    ...style
  };
  
  const headerStyles = {
    backgroundColor: groupColor,
    color: "white",
    padding: "18px 22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };
  
  const contentStyles = {
    maxHeight: "calc(450px - 70px)",
    overflowY: "auto",
    overflowX: "hidden"
  };
  
  const eventItemStyles = {
    padding: "14px 18px",
    borderBottom: "1px solid #f3f4f6",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "flex-start",
    gap: "14px"
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
            fontSize: "22px",
            padding: "5px",
            width: "36px",
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
              width: "10px",
              height: "10px",
              backgroundColor: groupColor,
              borderRadius: "50%",
              marginTop: "7px"
            }} />
            
            {/* イベント情報 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* タイトル */}
              <div style={{
                fontWeight: "600",
                fontSize: "15px",
                color: "#1f2937",
                marginBottom: "5px",
                lineHeight: "1.3"
              }}>
                {event.title || '（無題）'}
              </div>
              
              {/* 日付 */}
              {event.startDate && (
                <div style={{
                  fontSize: "13px",
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
                  marginBottom: "7px",
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
                  gap: "5px"
                }}>
                  {event.tags.slice(0, 3).map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      style={{
                        fontSize: "11px",
                        padding: "3px 7px",
                        backgroundColor: "#e0f2fe",
                        color: "#0891b2",
                        borderRadius: "9px",
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
          padding: "14px 18px",
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