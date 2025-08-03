import React, { useState, useRef, useCallback } from 'react';

const HashtagTimeline = () => {
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const timelineRef = useRef(null);
  const isDragging = useRef(false);
  const lastMouseX = useRef(0);

  const startYear = -5000;
  const endYear = 5000;
  const totalYears = endYear - startYear;
  
  const basePixelsPerYear = 2;
  const currentPixelsPerYear = basePixelsPerYear * scale;

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    const yearAtMouse = startYear + (mouseX - panX) / currentPixelsPerYear;
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(200, scale * zoomFactor));
    
    const newPixelsPerYear = basePixelsPerYear * newScale;
    const newPanX = mouseX - (yearAtMouse - startYear) * newPixelsPerYear;
    
    setScale(newScale);
    setPanX(newPanX);
  }, [scale, panX, currentPixelsPerYear]);

  const handleMouseDown = useCallback((e) => {
    isDragging.current = true;
    lastMouseX.current = e.clientX;
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    
    const deltaX = e.clientX - lastMouseX.current;
    setPanX(prev => prev + deltaX);
    lastMouseX.current = e.clientX;
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const generateYearMarkers = () => {
    const markers = [];
    
    let yearInterval;
    if (scale > 30) yearInterval = 1;
    else if (scale > 15) yearInterval = 2;
    else if (scale > 5) yearInterval = 5;
    else if (scale > 2) yearInterval = 10;
    else if (scale > 1) yearInterval = 50;
    else if (scale > 0.5) yearInterval = 100;
    else if (scale > 0.25) yearInterval = 200;
    else if (scale > 0.1) yearInterval = 500;
    else yearInterval = 1000;

    for (let year = startYear; year <= endYear; year += yearInterval) {
      const x = (year - startYear) * currentPixelsPerYear + panX;
      if (x > -100 && x < window.innerWidth + 100) {
        markers.push(
          <div key={year} style={{
            position: 'absolute',
            left: x,
            top: 0,
            height: '100%',
            borderLeft: '1px solid #ddd',
            pointerEvents: 'none'
          }}>
            <span style={{
              position: 'absolute',
              top: '10px',
              left: '5px',
              fontSize: '12px',
              color: '#666',
              userSelect: 'none'
            }}>
              {year}
            </span>
          </div>
        );
      }
    }
    return markers;
  };

  const styles = {
    app: {
      width: '100vw',
      height: '100vh',
      backgroundColor: 'white',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      position: 'relative',
      backgroundColor: '#f5f3ed',
      borderBottom: '1px solid #e5e7eb',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      zIndex: 2
    },
    title: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#374151'
    },
    headerRight: {
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    addButton: {
      backgroundColor: '#e29548ff',
      color: 'white',
      padding: '8px 16px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '500'
    },
    zoomInfo: {
      fontSize: '14px',
      color: '#6b7280'
    },
    mainArea: {
      display: 'flex',
      height: 'calc(100vh - 64px)'
    },
    sidebar: {
      position: 'relative',
      width: '200px',
      backgroundColor: '#f5f5f3',
      borderRight: '1px solid #e5e7eb',
      boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
      zIndex: 2
    },
    sidebarContent: {
      padding: '16px'
    },
    searchInput: {
      width: '80%',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      marginBottom: '16px',
      fontSize: '14px'
    },
    tagSection: {
      marginBottom: '16px'
    },
    sectionTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px'
    },
    tagContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px'
    },
    tag: {
      padding: '4px 8px',
      backgroundColor: '#c8eaeeff',
      color: '#1b5f65ff',
      fontSize: '12px',
      border: '1px solid #319ca5ff',
      borderRadius: '4px'
    },
    createButton: {
      width: '100%',
      backgroundColor: '#319ca5ff',
      color: 'white',
      padding: '8px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '500'
    },
    timelineCard: {
      padding: '12px',
      backgroundColor: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      marginBottom: '8px'
    },
    timelineTitle: {
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '8px',
      marginTop: '0px'
    },
    timeline: {
      flex: 1,
      position: 'relative',
      backgroundColor: 'white',
      cursor: isDragging.current ? 'grabbing' : 'grab'
    },
    event: {
      position: 'absolute',
      padding: '8px 12px',
      borderRadius: '6px',
      color: 'white',
      cursor: 'pointer',
      fontWeight: '500',
      fontSize: '14px',
      transform: 'translateX(-50%)',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    },
    helpBox: {
      position: 'absolute',
      bottom: '16px',
      right: '16px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '12px',
      borderRadius: '6px',
      fontSize: '12px',
      lineHeight: '1.4'
    }
  };

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <h1 style={styles.title}>#ハッシュタグ年表</h1>
        <div style={styles.headerRight}>
          <button style={styles.addButton}>+ イベントを追加</button>
          <span style={styles.zoomInfo}>ズーム: {scale.toFixed(1)}x</span>
        </div>
      </div>

      <div style={styles.mainArea}>
        <div style={styles.sidebar}>
          <div style={styles.sidebarContent}>
            <input
              type="text"
              placeholder="タグで絞り込み"
              style={styles.searchInput}
            />
            
            <div style={styles.tagSection}>
              <h3 style={styles.sectionTitle}>上位タグ</h3>
              <div style={styles.tagContainer}>
                {['歴史', '日本史', '政治', '文化'].map(tag => (
                  <span key={tag} style={styles.tag}>{tag}</span>
                ))}
              </div>
            </div>

            <button style={styles.createButton}>年表を作成</button>
          </div>

          <div style={{borderTop: '1px solid #e5e7eb', padding: '16px'}}>
            <div style={styles.timelineCard}>
              <h4 style={styles.timelineTitle}>ざっくり日本史</h4>
              <div style={styles.tagContainer}>
                <span style={styles.tag}>日本史</span>
                <span style={styles.tag}>歴史</span>
              </div>
            </div>
          </div>
        </div>

        <div 
          ref={timelineRef}
          style={styles.timeline}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {generateYearMarkers()}

          <div
            style={{
              ...styles.event,
              backgroundColor: '#3b82f6',
              left: (1868 - startYear) * currentPixelsPerYear + panX,
              top: '60px'
            }}
          >
            明治維新
          </div>

          <div
            style={{
              ...styles.event,
              backgroundColor: '#ef4444',
              left: (1945 - startYear) * currentPixelsPerYear + panX,
              top: '60px'
            }}
          >
            終戦
          </div>

          <div
            style={{
              position: 'absolute',
              left: (2025.6 - startYear) * currentPixelsPerYear + panX,
              top: 0,
              height: '100%',
              borderLeft: '1px solid #f6a656ff',
              pointerEvents: 'none'
            }}
          >
          </div>

          <div style={styles.helpBox}>
            <div>マウスホイール: ズーム</div>
            <div>ドラッグ: パン</div>
            <div>ダブルクリック: イベント追加（次回実装）</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HashtagTimeline;