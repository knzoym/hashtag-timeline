// src/components/EventGroup.js
import React from "react";
import { TIMELINE_CONFIG } from "../constants/timelineConfig";

export const EventGroupIcon = ({ 
  groupData, 
  position, 
  panY, 
  timelineColor,
  onHover,
  onDoubleClick 
}) => {
  const count = groupData.getDisplayCount();
  
  return (
    <div
      data-event-id={groupData.getMainEvent().id}
      data-is-group="true"
      data-group-id={groupData.id}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y + panY + "px",
        transform: "translateX(-50%)",
        cursor: "pointer",
        zIndex: 3,
        textAlign: "center",
        userSelect: "none",
      }}
      onMouseEnter={() => onHover(groupData.id, groupData)}
      onMouseLeave={() => onHover(null, null)}
      onDoubleClick={onDoubleClick}
    >
      <div style={{ fontSize: "10px", color: "#666", marginBottom: "2px" }}>
        {groupData.getMainEvent().startDate.getFullYear()}
      </div>
      
      <div
        style={{
          width: `${TIMELINE_CONFIG.GROUP_ICON_SIZE}px`,
          height: `${TIMELINE_CONFIG.GROUP_ICON_SIZE}px`,
          borderRadius: "50%",
          backgroundColor: timelineColor,
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "12px",
          fontWeight: "bold",
          border: "2px solid rgba(255,255,255,0.8)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
        }}
      >
        {count}
      </div>
    </div>
  );
};

export const GroupTooltip = ({ groupData, position, panY }) => {
  if (!groupData) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: position.x + 20,
        top: position.y + panY - 10,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        color: "white",
        padding: "8px 12px",
        borderRadius: "6px",
        fontSize: "12px",
        maxWidth: "200px",
        zIndex: 100,
        pointerEvents: "none",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
        {groupData.getDisplayCount()}個のイベント
      </div>
      {groupData.events.slice(0, 3).map((event, index) => (
        <div key={event.id} style={{ fontSize: "11px", opacity: 0.9 }}>
          • {event.title}
        </div>
      ))}
      {groupData.events.length > 3 && (
        <div style={{ fontSize: "11px", opacity: 0.7, fontStyle: "italic" }}>
          他{groupData.events.length - 3}件...
        </div>
      )}
      <div style={{ 
        marginTop: "4px", 
        fontSize: "10px", 
        opacity: 0.7 
      }}>
        ダブルクリックで詳細表示
      </div>
    </div>
  );
};

export const GroupCard = ({ 
  groupData, 
  position, 
  panY, 
  panX, 
  timelineColor,
  onEventDoubleClick,
  onClose 
}) => {
  return (
    <div
      style={{
        position: "absolute",
        left: position.x + panX,
        top: position.y + panY,
        width: "280px",
        maxHeight: "400px",
        backgroundColor: "white",
        border: `2px solid ${timelineColor}`,
        borderRadius: "8px",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          backgroundColor: timelineColor,
          color: "white",
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontWeight: "bold", fontSize: "14px" }}>
          グループ ({groupData.getDisplayCount()}件)
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "white",
            cursor: "pointer",
            fontSize: "18px",
            padding: "0",
            width: "24px",
            height: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            opacity: 0.8,
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.2)"}
          onMouseOut={(e) => e.target.style.backgroundColor = "transparent"}
        >
          ×
        </button>
      </div>

      <div style={{ maxHeight: "320px", overflowY: "auto", padding: "8px" }}>
        {groupData.events.map((event, index) => (
          <div
            key={event.id}
            data-event-id={event.id}
            style={{
              padding: "12px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              marginBottom: "8px",
              cursor: "pointer",
              transition: "all 0.2s",
              backgroundColor: "#f9fafb",
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#f3f4f6";
              e.target.style.borderColor = timelineColor;
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "#f9fafb";
              e.target.style.borderColor = "#e5e7eb";
            }}
            onDoubleClick={() => onEventDoubleClick(event)}
          >
            <div style={{ 
              fontWeight: "600", 
              fontSize: "13px", 
              marginBottom: "4px",
              color: "#374151" 
            }}>
              {event.title}
            </div>
            <div style={{ 
              fontSize: "11px", 
              color: "#6b7280",
              marginBottom: "4px" 
            }}>
              {event.startDate.getFullYear()}年
            </div>
            {event.description && (
              <div style={{ 
                fontSize: "11px", 
                color: "#374151",
                lineHeight: "1.4",
                maxHeight: "40px",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>
                {event.description}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};