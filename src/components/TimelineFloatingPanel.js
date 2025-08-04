import React, { useState, useCallback, useMemo } from "react";

export const TimelineFloatingPanel = ({ 
  timeline, 
  onClose, 
  onDelete,
  position = { x: 250, y: 80 } 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panelPosition, setPanelPosition] = useState(position);
  const [localScale, setLocalScale] = useState(2);
  const [localPanX, setLocalPanX] = useState(0);

  // 年表の年代範囲を計算
  const { minYear, maxYear, adjustedMinYear } = useMemo(() => {
    if (!timeline?.events?.length) return { minYear: 2000, maxYear: 2030, adjustedMinYear: 2000 };
    
    const years = timeline.events.map(e => e.startDate.getFullYear());
    const min = Math.min(...years);
    const max = Math.max(...years);
    const padding = Math.max(5, (max - min) * 0.1);
    const adjustedMin = Math.floor(min - padding);
    
    return {
      minYear: min,
      maxYear: max,
      adjustedMinYear: adjustedMin
    };
  }, [timeline]);

  // 初期パン位置を設定
  React.useEffect(() => {
    if (timeline?.events?.length) {
      const panelWidth = 400;
      const timelineDisplayWidth = panelWidth - 40; // パディング考慮
      const initialPanX = Math.max(0, (timelineDisplayWidth - (maxYear - adjustedMinYear) * localScale * 2) / 2);
      setLocalPanX(initialPanX);
    }
  }, [timeline, adjustedMinYear, maxYear, localScale]);

  // 年マーカー生成
  const generateYearMarkers = useCallback(() => {
    const markers = [];
    const pixelsPerYear = localScale * 2;
    
    let yearInterval = 1;
    if (localScale < 0.5) yearInterval = 20;
    else if (localScale < 1) yearInterval = 10;
    else if (localScale < 2) yearInterval = 5;
    else if (localScale < 5) yearInterval = 2;
    
    const startYear = Math.floor(adjustedMinYear / yearInterval) * yearInterval;
    const endYear = Math.ceil((adjustedMinYear + 380/pixelsPerYear) / yearInterval) * yearInterval;
    
    for (let year = startYear; year <= endYear; year += yearInterval) {
      const x = (year - adjustedMinYear) * pixelsPerYear + localPanX + 20;
      
      if (x > 15 && x < 385) {
        markers.push(
          <div
            key={year}
            style={{
              position: "absolute",
              left: x,
              top: 80,
              height: "120px",
              borderLeft: "1px solid #e5e7eb",
              pointerEvents: "none",
              zIndex: 1
            }}
          >
            <span
              style={{
                position: "absolute",
                top: "-15px",
                left: "2px",
                fontSize: "10px",
                color: "#6b7280",
                fontWeight: "500",
                userSelect: "none",
                backgroundColor: "white",
                padding: "1px 2px",
                borderRadius: "2px"
              }}
            >
              {year}
            </span>
          </div>
        );
      }
    }
    return markers;
  }, [adjustedMinYear, localScale, localPanX]);

  // イベント位置計算
  const positionedEvents = useMemo(() => {
    if (!timeline?.events?.length) return [];
    
    const sortedEvents = [...timeline.events].sort((a, b) => 
      a.startDate.getFullYear() - b.startDate.getFullYear()
    );
    
    const pixelsPerYear = localScale * 2;
    const baseY = 110;
    const eventHeight = 40;
    const levels = [];
    
    return sortedEvents.map((event) => {
      const year = event.startDate.getFullYear();
      const x = (year - adjustedMinYear) * pixelsPerYear + localPanX + 20;
      
      // Y位置の衝突検出
      let level = 0;
      let y = baseY;
      
      while (level < 5) {
        let hasCollision = false;
        for (let i = 0; i < levels.length; i++) {
          const prevEvent = levels[i];
          if (prevEvent.level === level && 
              Math.abs(x - prevEvent.x) < 60) {
            hasCollision = true;
            break;
          }
        }
        
        if (!hasCollision) break;
        level++;
        y = baseY + level * (eventHeight + 10);
      }
      
      levels.push({ x, y, level });
      
      return {
        ...event,
        displayX: x,
        displayY: y,
        level
      };
    });
  }, [timeline, adjustedMinYear, localScale, localPanX]);

  // ドラッグ処理
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.timeline-controls') || e.target.closest('.event-mini-card')) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - panelPosition.x,
      y: e.clientY - panelPosition.y
    });
  }, [panelPosition]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      setPanelPosition({
        x: Math.max(20, Math.min(window.innerWidth - 420, e.clientX - dragStart.x)),
        y: Math.max(80, Math.min(window.innerHeight - 300, e.clientY - dragStart.y))
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // ズーム処理
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(5, localScale * zoomFactor));
    setLocalScale(newScale);
  }, [localScale]);

  // パン処理
  const handleTimelinePan = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.shiftKey) {
      let isDragging = true;
      let lastX = e.clientX;
      
      const handlePanMove = (e) => {
        if (isDragging) {
          const deltaX = e.clientX - lastX;
          setLocalPanX(prev => Math.max(-200, Math.min(200, prev + deltaX)));
          lastX = e.clientX;
        }
      };
      
      const handlePanUp = () => {
        isDragging = false;
        document.removeEventListener('mousemove', handlePanMove);
        document.removeEventListener('mouseup', handlePanUp);
      };
      
      document.addEventListener('mousemove', handlePanMove);
      document.addEventListener('mouseup', handlePanUp);
    }
  }, []);

  if (!timeline) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: panelPosition.x,
        top: panelPosition.y,
        width: "400px",
        height: "240px",
        backgroundColor: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        zIndex: 15,
        cursor: isDragging ? "grabbing" : "move",
        overflow: "hidden"
      }}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
    >
      {/* ヘッダー */}
      <div
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "#f9fafb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <div>
          <h4 style={{ 
            fontSize: "14px", 
            fontWeight: "600", 
            color: "#374151", 
            margin: "0 0 2px 0" 
          }}>
            {timeline.name}
          </h4>
          <div style={{ fontSize: "11px", color: "#6b7280" }}>
            {timeline.events.length}件 • {minYear}年-{maxYear}年
          </div>
        </div>
        <div className="timeline-controls" style={{ display: "flex", gap: "4px" }}>
          <button
            onClick={() => onDelete(timeline.id)}
            style={{
              padding: "4px 6px",
              border: "1px solid #ef4444",
              borderRadius: "3px",
              backgroundColor: "white",
              color: "#ef4444",
              cursor: "pointer",
              fontSize: "11px"
            }}
          >
            削除
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "4px 6px",
              border: "none",
              borderRadius: "3px",
              backgroundColor: "#6b7280",
              color: "white",
              cursor: "pointer",
              fontSize: "11px"
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* 年表内容 */}
      <div 
        style={{ 
          position: "relative", 
          height: "calc(100% - 50px)",
          overflow: "hidden"
        }}
        onMouseDown={handleTimelinePan}
      >
        {/* 年マーカー */}
        {generateYearMarkers()}

        {/* 横軸ライン */}
        <div
          style={{
            position: "absolute",
            left: "20px",
            top: "100px",
            right: "20px",
            height: "2px",
            backgroundColor: "#d1d5db",
            zIndex: 2
          }}
        />

        {/* イベント表示 */}
        {positionedEvents.map((event) => (
          <div
            key={event.id}
            className="event-mini-card"
            style={{
              position: "absolute",
              left: event.displayX - 25,
              top: event.displayY,
              width: "50px",
              zIndex: 3
            }}
          >
            {/* 接続線 */}
            <div
              style={{
                position: "absolute",
                left: "25px",
                top: "-10px",
                width: "1px",
                height: event.level === 0 ? "10px" : `${event.level * 50 + 10}px`,
                backgroundColor: "#6b7280",
                zIndex: 1
              }}
            />
            
            {/* イベントカード */}
            <div
              style={{
                backgroundColor: "white",
                border: "1px solid #3b82f6",
                borderRadius: "3px",
                padding: "3px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                textAlign: "center",
                position: "relative",
                zIndex: 2
              }}
            >
              <div
                style={{
                  fontSize: "8px",
                  color: "#6b7280",
                  marginBottom: "1px",
                  fontWeight: "500"
                }}
              >
                {event.startDate.getFullYear()}
              </div>
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: "600",
                  color: "#374151",
                  lineHeight: "1.1",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
                title={event.title}
              >
                {event.title.length > 8 
                  ? event.title.substring(0, 8) + "..."
                  : event.title
                }
              </div>
            </div>
          </div>
        ))}

        {/* 操作ヒント */}
        <div
          style={{
            position: "absolute",
            bottom: "5px",
            right: "5px",
            fontSize: "9px",
            color: "#9ca3af",
            backgroundColor: "rgba(255,255,255,0.8)",
            padding: "2px 4px",
            borderRadius: "2px"
          }}
        >
          ホイール:ズーム | Shift+ドラッグ:移動
        </div>
      </div>
    </div>
  );
};