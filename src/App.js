import React, { useState, useRef, useCallback } from 'react';

const HashtagTimeline = () => {
  // 定数を最初に定義
  const startYear = -5000;
  const endYear = 5000;
  const totalYears = endYear - startYear;
  const basePixelsPerYear = 2;

  const [scale, setScale] = useState(2.5); // 2.5を新しい1xとする
  const [panX, setPanX] = useState(() => {
    // 初期位置: 2030年が右端に見えるように計算
    const targetYear = 2030;
    const initialPixelsPerYear = basePixelsPerYear * 2.5; // basePixelsPerYear * initialScale
    const targetX = (targetYear - startYear) * initialPixelsPerYear;
    return window.innerWidth - targetX;
  });
  const [timelineCardY, setTimelineCardY] = useState(100); // 年表カードのY位置
  const timelineRef = useRef(null);
  const isDragging = useRef(false);
  const isCardDragging = useRef(false);
  const lastMouseX = useRef(0);
  const lastMouseY = useRef(0);

  const currentPixelsPerYear = basePixelsPerYear * scale;

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    const yearAtMouse = startYear + (mouseX - panX) / currentPixelsPerYear;
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.25, Math.min(500, scale * zoomFactor)); 
    
    const newPixelsPerYear = basePixelsPerYear * newScale;
    let newPanX = mouseX - (yearAtMouse - startYear) * newPixelsPerYear;
    
    // ズーム後もパン制限を適用
    const timelineWidth = totalYears * newPixelsPerYear;
    const viewportWidth = window.innerWidth;
    const minPanX = -(timelineWidth - viewportWidth);
    const maxPanX = 0;
    
    newPanX = Math.max(minPanX, Math.min(maxPanX, newPanX));
    
    setScale(newScale);
    setPanX(newPanX);
  }, [scale, panX, currentPixelsPerYear, startYear, totalYears, basePixelsPerYear]);

  const handleMouseDown = useCallback((e) => {
    // 年表カードやパネル上でのクリックは無視
    if (e.target.closest('.floating-panel') || e.target.closest('.timeline-card')) {
      return;
    }
    isDragging.current = true;
    lastMouseX.current = e.clientX;
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (isDragging.current) {
      const deltaX = e.clientX - lastMouseX.current;
      const newPanX = panX + deltaX;
      
      // パンの範囲制限を計算
      const timelineWidth = totalYears * currentPixelsPerYear;
      const viewportWidth = window.innerWidth;
      
      // 左端制限: 年表の開始点（-5000年）が画面右端を超えない
      const minPanX = -(timelineWidth - viewportWidth);
      // 右端制限: 年表の開始点（-5000年）が画面左端を超えない  
      const maxPanX = 0;
      
      // 制限内でパンを更新
      setPanX(Math.max(minPanX, Math.min(maxPanX, newPanX)));
      lastMouseX.current = e.clientX;
    }
    
    if (isCardDragging.current) {
      const deltaY = e.clientY - lastMouseY.current;
      setTimelineCardY(prev => Math.max(80, Math.min(window.innerHeight - 100, prev + deltaY)));
      lastMouseY.current = e.clientY;
    }
  }, [panX, totalYears, currentPixelsPerYear]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    isCardDragging.current = false;
  }, []);

  // 年表カードのドラッグ開始
  const handleCardMouseDown = useCallback((e) => {
    e.stopPropagation();
    isCardDragging.current = true;
    lastMouseY.current = e.clientY;
  }, []);

  const generateYearMarkers = () => {
    const markers = [];
    
    // スケールの基準を2.5倍に調整したので、条件も調整
    const adjustedScale = scale / 2.5;
    let yearInterval;
    if (adjustedScale > 12) yearInterval = 1;        // 元の30
    else if (adjustedScale > 6) yearInterval = 2;    // 元の15
    else if (adjustedScale > 2) yearInterval = 5;    // 元の5
    else if (adjustedScale > 1) yearInterval = 10; // 元の2
    else if (adjustedScale > 0.4) yearInterval = 50; // 元の1
    else if (adjustedScale > 0.2) yearInterval = 100;// 元の0.5
    else if (adjustedScale > 0.1) yearInterval = 200;// 元の0.25
    else if (adjustedScale > 0.04) yearInterval = 500;// 元の0.1
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
    timeline: {
      width: '100vw',
      height: 'calc(100vh - 64px)',
      position: 'relative',
      backgroundColor: 'white',
      cursor: isDragging.current ? 'grabbing' : 'grab'
    },
    // 浮遊する検索パネル
    floatingPanel: {
      position: 'absolute',
      top: '20px',
      left: '20px',
      width: '200px',
      backgroundColor: '#f5f5f3',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: 10,
      padding: '16px'
    },
    searchInput: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      marginBottom: '16px',
      fontSize: '14px',
      boxSizing: 'border-box'
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
    // ドラッグ可能な年表カード
    timelineCard: {
      position: 'absolute',
      left: '20px',
      top: timelineCardY + 'px',
      width: '200px',
      padding: '12px',
      backgroundColor: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      cursor: 'move',
      zIndex: 9
    },
    timelineTitle: {
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '8px',
      marginTop: '0px',
      userSelect: 'none'
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
          <span style={styles.zoomInfo}>ズーム: {(scale / 2.5).toFixed(1)}x</span>
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

        {/* 浮遊する検索パネル */}
        <div className="floating-panel" style={styles.floatingPanel}>
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

        {/* ドラッグ可能な年表カード */}
        <div 
          className="timeline-card"
          style={styles.timelineCard}
          onMouseDown={handleCardMouseDown}
        >
          <h4 style={styles.timelineTitle}>ざっくり日本史</h4>
          <div style={styles.tagContainer}>
            <span style={styles.tag}>日本史</span>
            <span style={styles.tag}>歴史</span>
          </div>
        </div>

        {/* サンプルイベント */}
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

        {/* 現在ライン */}
        <div
          style={{
            position: 'absolute',
            left: (2025.6 - startYear) * currentPixelsPerYear + panX,
            top: 0,
            height: '100%',
            borderLeft: '1px solid #f6a656ff',
            pointerEvents: 'none'
          }}
        />

        <div style={styles.helpBox}>
          <div>マウスホイール: ズーム</div>
          <div>ドラッグ: パン</div>
          <div>年表カード: 縦ドラッグで移動</div>
          <div>ダブルクリック: イベント追加（次回実装）</div>
        </div>
      </div>
    </div>
  );
};

export default HashtagTimeline;