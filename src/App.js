import React, { useState, useRef, useCallback } from 'react';

const HashtagTimeline = () => {
  // 定数を最初に定義
  const startYear = -5000;
  const endYear = 5000;
  const totalYears = endYear - startYear;
  const basePixelsPerYear = 2;

  const [scale, setScale] = useState(2.5);
  const [panX, setPanX] = useState(() => {
    const targetYear = 2030;
    const initialPixelsPerYear = basePixelsPerYear * 2.5;
    const targetX = (targetYear - startYear) * initialPixelsPerYear;
    return window.innerWidth - targetX;
  });
  const [timelineCardY, setTimelineCardY] = useState(100);
  
  // イベントとタグの管理
  const [events, setEvents] = useState([
    // サンプルデータ
    {
      id: 1,
      title: '明治維新',
      startDate: new Date(1868, 0, 3),
      endDate: new Date(1868, 0, 3),
      description: '#江戸幕府 が終焉し、#明治政府 が成立。日本の近代化が始まる重要な転換点となった。',
      tags: ['明治維新', '江戸幕府', '明治政府', '日本史', '歴史'],
      position: { x: 0, y: 60 }
    },
    {
      id: 2,
      title: '終戦',
      startDate: new Date(1945, 7, 15),
      endDate: new Date(1945, 7, 15),
      description: '太平洋戦争が終結。日本が連合国に降伏した。',
      tags: ['終戦', '太平洋戦争', '日本史', '歴史'],
      position: { x: 0, y: 60 }
    },
    {
      id: 101,
      title: 'バウハウス設立',
      startDate: new Date(1919, 3, 1),
      endDate: new Date(1919, 3, 1),
      description: '#モダニズム の原点。#バウハウス は機能美と合理性を追求した芸術学校。',
      tags: ['バウハウス', 'モダニズム', '建築教育', '近代建築'],
      position: { x: 0, y: 80 }
    },
    {
      id: 102,
      title: 'ル・コルビュジエ「サヴォア邸」完成',
      startDate: new Date(1931, 0, 1),
      endDate: new Date(1931, 0, 1),
      description: '近代建築の五原則を体現した #ル・コルビュジエ の代表作。',
      tags: ['ル・コルビュジエ', '近代建築', 'モダニズム', '住宅建築'],
      position: { x: 0, y: 80 }
    },
    {
      id: 103,
      title: 'フランク・ロイド・ライト「落水荘」完成',
      startDate: new Date(1939, 0, 1),
      endDate: new Date(1939, 0, 1),
      description: '自然との調和を実現した #有機的建築 の傑作。',
      tags: ['フランク・ロイド・ライト', '有機的建築', 'アメリカ建築'],
      position: { x: 0, y: 90 }
    },
    {
      id: 104,
      title: 'CIAMの設立',
      startDate: new Date(1928, 0, 1),
      endDate: new Date(1928, 0, 1),
      description: '#CIAM は近代建築の国際的普及を目指す会議体。',
      tags: ['CIAM', '都市計画', '近代建築'],
      position: { x: 0, y: 100 }
    },
    {
      id: 105,
      title: '丹下健三「広島平和記念資料館」完成',
      startDate: new Date(1955, 0, 1),
      endDate: new Date(1955, 0, 1),
      description: '#丹下健三 による戦後日本のモダニズム建築。',
      tags: ['丹下健三', '日本建築', '広島', 'モダニズム'],
      position: { x: 0, y: 100 }
    },
    {
      id: 106,
      title: 'エーロ・サーリネン「TWAフライトセンター」完成',
      startDate: new Date(1962, 0, 1),
      endDate: new Date(1962, 0, 1),
      description: '曲線的なフォルムが象徴的な #未来派建築 の代表作。',
      tags: ['サーリネン', '空港建築', '未来派建築'],
      position: { x: 0, y: 100 }
    },
    {
      id: 107,
      title: '建築運動「メタボリズム」提唱',
      startDate: new Date(1960, 0, 1),
      endDate: new Date(1960, 0, 1),
      description: '新陳代謝する都市を構想した #メタボリズム 運動。',
      tags: ['メタボリズム', '都市構想', '日本建築'],
      position: { x: 0, y: 110 }
    },
    {
      id: 108,
      title: '磯崎新「大分県立図書館」完成',
      startDate: new Date(1966, 0, 1),
      endDate: new Date(1966, 0, 1),
      description: '#磯崎新 初期の代表作。#モダニズム に根ざしつつ独自の構造美を持つ。',
      tags: ['磯崎新', '図書館建築', '日本建築'],
      position: { x: 0, y: 100 }
    },
    {
      id: 109,
      title: 'リチャード・ロジャース「ロイドビル」完成',
      startDate: new Date(1986, 0, 1),
      endDate: new Date(1986, 0, 1),
      description: '#ハイテック建築 の象徴的作品。',
      tags: ['ハイテック建築', 'リチャード・ロジャース', 'イギリス建築'],
      position: { x: 0, y: 90 }
    },
    {
      id: 110,
      title: 'ザハ・ハディドが注目される',
      startDate: new Date(1983, 0, 1),
      endDate: new Date(1983, 0, 1),
      description: '1983年の #香港のピーク・クラブ 計画で国際的注目を浴びた。',
      tags: ['ザハ・ハディド', '女性建築家', 'ポストモダン'],
      position: { x: 0, y: 90 }
    },
    {
      id: 111,
      title: '伊東豊雄「せんだいメディアテーク」完成',
      startDate: new Date(2001, 0, 1),
      endDate: new Date(2001, 0, 1),
      description: '#日本建築 における情報化時代の先駆。',
      tags: ['伊東豊雄', '情報建築', 'せんだいメディアテーク'],
      position: { x: 0, y: 100 }
    },
    {
      id: 112,
      title: 'ピーター・ズントー「テルメ・ヴァルス」完成',
      startDate: new Date(1996, 0, 1),
      endDate: new Date(1996, 0, 1),
      description: '素材と空間体験を重視した #ミニマリズム 建築の傑作。',
      tags: ['ピーター・ズントー', 'スイス建築', 'ミニマリズム'],
      position: { x: 0, y: 90 }
    },
    {
      id: 113,
      title: 'レム・コールハース「ボルドーの家」完成',
      startDate: new Date(1998, 0, 1),
      endDate: new Date(1998, 0, 1),
      description: '#OMA による可変性のある住宅。',
      tags: ['レム・コールハース', 'OMA', '住宅建築'],
      position: { x: 0, y: 100 }
    },
    {
      id: 114,
      title: '谷口吉生「東京国立博物館 法隆寺宝物館」完成',
      startDate: new Date(1999, 0, 1),
      endDate: new Date(1999, 0, 1),
      description: '静謐で洗練された日本の #現代建築 。',
      tags: ['谷口吉生', 'ミュージアム建築', '日本建築'],
      position: { x: 0, y: 95 }
    },
    {
      id: 115,
      title: '安藤忠雄「光の教会」完成',
      startDate: new Date(1989, 0, 1),
      endDate: new Date(1989, 0, 1),
      description: '#安藤忠雄 による光と空間の宗教建築。',
      tags: ['安藤忠雄', '光の教会', '宗教建築'],
      position: { x: 0, y: 100 }
    },
    {
      id: 116,
      title: '原広司「梅田スカイビル」完成',
      startDate: new Date(1993, 0, 1),
      endDate: new Date(1993, 0, 1),
      description: '都市を空中でつなぐ構想を体現した #空中都市 建築。',
      tags: ['原広司', '空中都市', '日本建築'],
      position: { x: 0, y: 90 }
    },
    {
      id: 117,
      title: '黒川紀章「中銀カプセルタワー」完成',
      startDate: new Date(1972, 0, 1),
      endDate: new Date(1972, 0, 1),
      description: '#メタボリズム を象徴するカプセル型集合住宅。',
      tags: ['黒川紀章', '中銀カプセルタワー', '集合住宅'],
      position: { x: 0, y: 110 }
    },
    {
      id: 118,
      title: '清家清「私の家」完成',
      startDate: new Date(1954, 0, 1),
      endDate: new Date(1954, 0, 1),
      description: '#戦後建築 の代表的な小住宅。',
      tags: ['清家清', '住宅建築', '戦後建築'],
      position: { x: 0, y: 100 }
    },
    {
      id: 119,
      title: 'ヴィトラ・デザイン・ミュージアム（フランク・ゲーリー）完成',
      startDate: new Date(1989, 0, 1),
      endDate: new Date(1989, 0, 1),
      description: 'ポストモダンの象徴的なデザインミュージアム。',
      tags: ['フランク・ゲーリー', 'ポストモダン', '美術館'],
      position: { x: 0, y: 90 }
    },
    {
      id: 120,
      title: 'OMA「シアトル図書館」完成',
      startDate: new Date(2004, 0, 1),
      endDate: new Date(2004, 0, 1),
      description: '#レム・コールハース による #情報空間 の実験。',
      tags: ['OMA', 'シアトル図書館', '情報空間'],
      position: { x: 0, y: 100 }
    }
  ]);
  
  const [allTags, setAllTags] = useState([
    '明治維新', '江戸幕府', '明治政府', '終戦', '太平洋戦争', 
    '日本史', '歴史', '政治', '文化'
  ]);
  
  // 検索とフィルタリングの状態
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedEvents, setHighlightedEvents] = useState(new Set());
  
  // モーダルの状態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: new Date()
  });

  const timelineRef = useRef(null);
  const isDragging = useRef(false);
  const isCardDragging = useRef(false);
  const lastMouseX = useRef(0);
  const lastMouseY = useRef(0);

  const currentPixelsPerYear = basePixelsPerYear * scale;



  // 座標から年を計算
  const getYearFromX = useCallback((x) => {
    return startYear + (x - panX) / currentPixelsPerYear;
  }, [startYear, panX, currentPixelsPerYear]);

  // 年から座標を計算
  const getXFromYear = useCallback((year) => {
    return (year - startYear) * currentPixelsPerYear + panX;
  }, [startYear, currentPixelsPerYear, panX]);

  // ダブルクリックでイベント作成
  const handleDoubleClick = useCallback((e) => {
    // パネルやカード上のダブルクリックは無視
    if (e.target.closest('.floating-panel') || e.target.closest('.timeline-card')) {
      return;
    }

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const year = getYearFromX(clickX);
    const clickDate = new Date(Math.round(year), 0, 1);
    
    setNewEvent({
      title: '',
      description: '',
      date: clickDate
    });
    
    setModalPosition({ x: clickX, y: clickY });
    setIsModalOpen(true);
  }, [getYearFromX]);

  // タグを説明文から抽出
  const extractTagsFromDescription = (description) => {
    const tagRegex = /#([^\s#]+)/g;
    const matches = [];
    let match;
    while ((match = tagRegex.exec(description)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  };

  // イベント保存
  const saveEvent = useCallback(() => {
    if (!newEvent.title.trim()) return;

    const extractedTags = extractTagsFromDescription(newEvent.description);
    const eventTags = [newEvent.title, ...extractedTags];
    
    // 新しいタグをallTagsに追加
    const newTags = eventTags.filter(tag => !allTags.includes(tag));
    if (newTags.length > 0) {
      setAllTags(prev => [...prev, ...newTags]);
    }

    const event = {
      id: Date.now(), // 簡単なID生成
      title: newEvent.title,
      startDate: newEvent.date,
      endDate: newEvent.date,
      description: newEvent.description,
      tags: eventTags,
      position: { x: modalPosition.x, y: modalPosition.y }
    };

    setEvents(prev => [...prev, event]);
    setIsModalOpen(false);
    setNewEvent({ title: '', description: '', date: new Date() });
  }, [newEvent, modalPosition, allTags]);

  // モーダルを閉じる
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setNewEvent({ title: '', description: '', date: new Date() });
  }, []);

  // タグ検索機能
  const handleSearchChange = useCallback((e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim() === '') {
      setHighlightedEvents(new Set());
      return;
    }
    
    // 検索語を小文字で分割（スペース区切りで複数タグ検索可能）
    const searchTerms = term.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    
    const matchingEventIds = new Set();
    events.forEach(event => {
      const eventTags = event.tags.map(tag => tag.toLowerCase());
      const eventTitle = event.title.toLowerCase();
      
      // すべての検索語がタグまたはタイトルに含まれているかチェック
      const allTermsMatch = searchTerms.every(searchTerm => 
        eventTags.some(tag => tag.includes(searchTerm)) || 
        eventTitle.includes(searchTerm)
      );
      
      if (allTermsMatch) {
        matchingEventIds.add(event.id);
      }
    });
    
    setHighlightedEvents(matchingEventIds);
  }, [events]);

  // 検索にヒットしたタグを上位タグとして表示
  const getTopTagsFromSearch = useCallback(() => {
    if (searchTerm.trim() === '' || highlightedEvents.size === 0) {
      return allTags.slice(0, 6);
    }
    
    // ハイライトされたイベントのタグを集計
    const tagCounts = {};
    events.forEach(event => {
      if (highlightedEvents.has(event.id)) {
        event.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    // 使用頻度順にソートして上位6つを返す
    return Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([tag]) => tag);
  }, [searchTerm, highlightedEvents, allTags, events]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    const yearAtMouse = startYear + (mouseX - panX) / currentPixelsPerYear;
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.25, Math.min(50, scale * zoomFactor)); // 最小0.25(元の0.1), 最大50(元の20)
    
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
    else if (adjustedScale > 0.8) yearInterval = 10; // 元の2
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
        onDoubleClick={handleDoubleClick}
      >
        {generateYearMarkers()}

        {/* 浮遊する検索パネル */}
        <div className="floating-panel" style={styles.floatingPanel}>
          <input
            type="text"
            placeholder="タグで絞り込み"
            value={searchTerm}
            onChange={handleSearchChange}
            style={styles.searchInput}
          />
          
          <div style={styles.tagSection}>
            <h3 style={styles.sectionTitle}>上位タグ</h3>
            <div style={styles.tagContainer}>
              {getTopTagsFromSearch().map(tag => (
                <span key={tag} style={styles.tag}>{tag}</span>
              ))}
            </div>
          </div>

          <button 
            style={{
              ...styles.createButton,
              opacity: highlightedEvents.size > 0 ? 1 : 0.5,
              cursor: highlightedEvents.size > 0 ? 'pointer' : 'not-allowed'
            }}
            disabled={highlightedEvents.size === 0}
          >
            年表を作成 {highlightedEvents.size > 0 && `(${highlightedEvents.size})`}
          </button>
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

        {/* 動的イベント表示 */}
        {events.map(event => {
          const isHighlighted = highlightedEvents.has(event.id);
          return (
            <div
              key={event.id}
              style={{
                ...styles.event,
                backgroundColor: isHighlighted 
                  ? '#10b981' // ハイライト色（緑）
                  : event.id === 1 || event.id === 2 
                    ? (event.id === 1 ? '#3b82f6' : '#ef4444')
                    : '#6b7280', // デフォルト色（グレー）
                left: getXFromYear(event.startDate.getFullYear()),
                top: event.position.y + 'px',
                border: isHighlighted ? '2px solid #059669' : 'none',
                transform: 'translateX(-50%)',
                zIndex: isHighlighted ? 5 : 1
              }}
            >
              {event.title}
            </div>
          );
        })}

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

        {/* イベント作成モーダル */}
        {isModalOpen && (
          <div style={{
            position: 'absolute',
            left: Math.min(modalPosition.x, window.innerWidth - 300),
            top: Math.min(modalPosition.y, window.innerHeight - 200),
            width: '280px',
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            padding: '16px',
            zIndex: 20
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
              新しいイベント
            </h3>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>
                日付: {newEvent.date.getFullYear()}年
              </label>
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="イベントタイトル"
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <textarea
                placeholder="説明（#タグ を含めることができます）"
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                style={{
                  width: '100%',
                  height: '60px',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeModal}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={saveEvent}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                作成
              </button>
            </div>
          </div>
        )}

        <div style={styles.helpBox}>
          <div>マウスホイール: ズーム</div>
          <div>ドラッグ: パン</div>
          <div>年表カード: 縦ドラッグで移動</div>
          <div>ダブルクリック: イベント追加</div>
          {highlightedEvents.size > 0 && (
            <div style={{ marginTop: '8px', color: '#10b981' }}>
              🔍 {highlightedEvents.size}件ヒット
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HashtagTimeline;