// src/components/TimelineView.js
import React, { useState, useCallback, useMemo } from "react";
import { TIMELINE_CONFIG } from "../constants/timelineConfig";

export const TimelineView = ({ timeline, onClose, onBackToMain }) => {
  const [scale, setScale] = useState(2);
  const [panX, setPanX] = useState(0);

  // 年表のイベントを年代順にソート
  const sortedEvents = useMemo(() => {
    return [...timeline.events].sort((a, b) => 
      a.startDate.getFullYear() - b.startDate.getFullYear()
    );
  }, [timeline.events]);

  // 年代の範囲を計算
  const { minYear, maxYear } = useMemo(() => {
    if (sortedEvents.length === 0) return { minYear: 2000, maxYear: 2030 };
    
    const years = sortedEvents.map(event => event.startDate.getFullYear());
    const min = Math.min(...years);
    const max = Math.max(...years);
    const padding = Math.max(10, (max - min) * 0.1); // 10年または範囲の10%のパディング
    
    return {
      minYear: Math.floor(min - padding),
      maxYear: Math.ceil(max + padding)
    };
  }, [sortedEvents]);

  // 初期パン位置を計算（最初の年を左端に）
  const initialPanX = useMemo(() => {
    const timelineWidth = (maxYear - minYear) * scale * 50; // 50px per year
    return Math.max(0, (window.innerWidth - 300 - timelineWidth) / 2); // 300pxはカード幅
  }, [minYear, maxYear, scale]);

  React.useEffect(() => {
    setPanX(initialPanX);
  }, [initialPanX]);

  // 年マーカー生成
  const generateYearMarkers = useCallback(() => {
    const markers = [];
    const pixelsPerYear = scale * 50;
    
    // スケールに応じて年間隔を調整
    let yearInterval = 1;
    if (scale < 0.5) yearInterval = 50;
    else if (scale < 1) yearInterval = 20;
    else if (scale < 2) yearInterval = 10;
    else if (scale < 5) yearInterval = 5;
    
    const startYear = Math.floor(minYear / yearInterval) * yearInterval;
    const endYear = Math.ceil(maxYear / yearInterval) * yearInterval;
    
    for (let year = startYear; year <= endYear; year += yearInterval) {
      const x = (year - minYear) * pixelsPerYear + panX + 300; // 300pxはカード幅分のオフセット
      
      if (x > 250 && x < window.innerWidth + 100) {
        markers.push(
          <div
            key={year}
            style={{
              position: "absolute",
              left: x,
              top: 80,
              height: "calc(100vh - 160px)",
              borderLeft: "1px solid #e5e7eb",
              pointerEvents: "none",
              zIndex: 1
            }}
          >
            <span
              style={{
                position: "absolute",
                top: "-25px",
                left: "5px",
                fontSize: "12px",
                color: "#6b7280",
                fontWeight: "500",
                userSelect: "none",
                backgroundColor: "white",
                padding: "2px 4px",
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
  }, [minYear, maxYear, scale, panX]);

  // イベント配置
  const positionedEvents = useMemo(() => {
    const pixelsPerYear = scale * 50;
    const baseY = 150;
    const eventHeight = 60;
    const levels = [];
    
    return sortedEvents.map((event, index) => {
      const year = event.startDate.getFullYear();
      const x = (year - minYear) * pixelsPerYear + panX + 300;
      
      // Y位置の衝突検出（簡易版）
      let level = 0;
      let y = baseY;
      
      // 前のイベントとの重なりをチェック
      while (level < 10) {
        let hasCollision = false;
        for (let i = 0; i < levels.length; i++) {
          const prevEvent = levels[i];
          if (prevEvent.level === level && 
              Math.abs(x - prevEvent.x) < 150) { // 150px以内なら衝突
            hasCollision = true;
            break;
          }
        }
        
        if (!hasCollision) break;
        level++;
        y = baseY + level * (eventHeight + 20);
      }
      
      levels.push({ x, y, level });
      
      return {
        ...event,
        displayX: x,
        displayY: y,
        level
      };
    });
  }, [sortedEvents, minYear, scale, panX]);

  // ズーム処理
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.2, Math.min(10, scale * zoomFactor));
    setScale(newScale);
  }, [scale]);

  // ドラッグ処理
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.timeline-card') || e.target.closest('.event-item')) return;
    
    let isDragging = true;
    let lastX = e.clientX;
    
    const handleMouseMove = (e) => {
      if (isDragging) {
        const deltaX = e.clientX - lastX;
        setPanX(prev => prev + deltaX);
        lastX = e.clientX;
      }
    };
    
    const handleMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#f9fafb",
        position: "relative",
        overflow: "hidden",
        cursor: "grab"
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
    >
      {/* ヘッダー */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "60px",
          backgroundColor: "white",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          zIndex: 10,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
        }}
      >
        <button
          onClick={onBackToMain}
          style={{
            padding: "6px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            backgroundColor: "white",
            cursor: "pointer",
            fontSize: "14px",
            marginRight: "16px",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          ← 戻る
        </button>
        <h1
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#374151",
            margin: 0
          }}
        >
          {timeline.name}
        </h1>
        <div
          style={{
            marginLeft: "auto",
            fontSize: "14px",
            color: "#6b7280"
          }}
        >
          {timeline.events.length}件のイベント • ズーム: {scale.toFixed(1)}x
        </div>
      </div>

      {/* 年表概要カード */}
      <div
        className="timeline-card"
        style={{
          position: "absolute",
          left: "20px",
          top: "80px",
          width: "260px",
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          padding: "20px",
          zIndex: 5
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "12px"
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#374151",
              margin: 0
            }}
          >
            {timeline.name}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "18px",
              color: "#6b7280",
              cursor: "pointer",
              padding: "0",
              width: "20px",
              height: "20px"
            }}
          >
            ×
          </button>
        </div>
        
        <div
          style={{
            fontSize: "14px",
            color: "#6b7280",
            marginBottom: "16px"
          }}
        >
          {timeline.events.length}件のイベント<br />
          {minYear}年 - {maxYear}年
        </div>

        {/* 主要タグ */}
        {timeline.tags.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "12px",
                color: "#374151",
                fontWeight: "600",
                marginBottom: "8px"
              }}
            >
              主要タグ
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "4px"
              }}
            >
              {timeline.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: "4px 8px",
                    backgroundColor: "#dbeafe",
                    color: "#1d4ed8",
                    fontSize: "11px",
                    borderRadius: "4px",
                    border: "1px solid #93c5fd"
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 作成日 */}
        <div
          style={{
            fontSize: "12px",
            color: "#9ca3af",
            paddingTop: "12px",
            borderTop: "1px solid #f3f4f6"
          }}
        >
          作成日: {timeline.createdAt.toLocaleDateString()}
        </div>
      </div>

      {/* 年マーカー */}
      {generateYearMarkers()}

      {/* 横軸ライン */}
      <div
        style={{
          position: "absolute",
          left: "300px",
          top: "140px",
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
          className="event-item"
          style={{
            position: "absolute",
            left: event.displayX - 60,
            top: event.displayY,
            width: "120px",
            zIndex: 3
          }}
        >
          {/* 接続線 */}
          <div
            style={{
              position: "absolute",
              left: "60px",
              top: "-10px",
              width: "2px",
              height: event.level === 0 ? "10px" : `${event.level * 80 + 10}px`,
              backgroundColor: "#6b7280",
              zIndex: 1
            }}
          />
          
          {/* イベントカード */}
          <div
            style={{
              backgroundColor: "white",
              border: "2px solid #3b82f6",
              borderRadius: "6px",
              padding: "8px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              textAlign: "center",
              position: "relative",
              zIndex: 2
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: "#6b7280",
                marginBottom: "4px",
                fontWeight: "500"
              }}
            >
              {event.startDate.getFullYear()}年
            </div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#374151",
                lineHeight: "1.2",
                marginBottom: "4px"
              }}
            >
              {event.title}
            </div>
            {event.description && (
              <div
                style={{
                  fontSize: "10px",
                  color: "#6b7280",
                  lineHeight: "1.3",
                  marginTop: "4px"
                }}
              >
                {event.description.length > 50 
                  ? event.description.substring(0, 50) + "..."
                  : event.description
                }
              </div>
            )}
          </div>
        </div>
      ))}

      {/* 操作ヒント */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          color: "white",
          padding: "8px 12px",
          borderRadius: "6px",
          fontSize: "12px",
          zIndex: 10
        }}
      >
        マウスホイール: ズーム | ドラッグ: 移動
      </div>
    </div>
  );
};