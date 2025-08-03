import React, { useState, useRef, useCallback, useEffect } from "react";

const HashtagTimeline = () => {
  // 定数を最初に定義
  const startYear = -5000;
  const endYear = 5000;
  const totalYears = endYear - startYear;
  const basePixelsPerYear = 2;

  // イベントタイトルを制限する関数をコンポーネント内に移動
  const truncateTitle = useCallback((title, maxLength = 12) => {
    return title.length > maxLength
      ? title.substring(0, maxLength) + "..."
      : title;
  }, []);

  const [scale, setScale] = useState(2.5);
  const [panX, setPanX] = useState(() => {
    const targetYear = 2030;
    const initialPixelsPerYear = basePixelsPerYear * 2.5;
    const targetX = (targetYear - startYear) * initialPixelsPerYear;
    return window.innerWidth - targetX;
  });
  const [panY, setPanY] = useState(0); // Y軸のパン
  const [timelineCardY, setTimelineCardY] = useState(100);

  // イベントとタグの管理
  const [events, setEvents] = useState([
    // サンプルデータ
    {
      id: 1,
      title: "明治維新",
      startDate: new Date(1868, 0, 3),
      endDate: new Date(1868, 0, 3),
      description:
        "#江戸幕府 が終焉し、#明治政府 が成立。日本の近代化が始まる重要な転換点となった。",
      tags: ["明治維新", "江戸幕府", "明治政府", "日本史", "歴史"],
      position: { x: 0, y: 60 },
    },
    {
      id: 2,
      title: "終戦",
      startDate: new Date(1945, 7, 15),
      endDate: new Date(1945, 7, 15),
      description: "太平洋戦争が終結。日本が連合国に降伏した。",
      tags: ["終戦", "太平洋戦争", "日本史", "歴史"],
      position: { x: 0, y: 60 },
    },
    {
      id: 101,
      title: "バウハウス設立",
      startDate: new Date(1919, 3, 1),
      endDate: new Date(1919, 3, 1),
      description:
        "#モダニズム の原点。#バウハウス は機能美と合理性を追求した芸術学校。",
      tags: ["バウハウス", "モダニズム", "建築教育", "近代建築"],
      position: { x: 0, y: 80 },
    },
    {
      id: 102,
      title: "サヴォア邸",
      startDate: new Date(1931, 0, 1),
      endDate: new Date(1931, 0, 1),
      description: "近代建築の五原則を体現した #ル・コルビュジエ の代表作。",
      tags: ["ル・コルビュジエ", "近代建築", "モダニズム", "住宅建築"],
      position: { x: 0, y: 80 },
    },
    {
      id: 103,
      title: "落水荘",
      startDate: new Date(1939, 0, 1),
      endDate: new Date(1939, 0, 1),
      description: "自然との調和を実現した #有機的建築 の傑作。",
      tags: ["フランク・ロイド・ライト", "有機的建築", "アメリカ建築"],
      position: { x: 0, y: 90 },
    },
    {
      id: 104,
      title: "CIAM設立",
      startDate: new Date(1928, 0, 1),
      endDate: new Date(1928, 0, 1),
      description: "#CIAM は近代建築の国際的普及を目指す会議体。",
      tags: ["CIAM", "都市計画", "近代建築"],
      position: { x: 0, y: 100 },
    },
    {
      id: 105,
      title: "広島平和記念資料館",
      startDate: new Date(1955, 0, 1),
      endDate: new Date(1955, 0, 1),
      description: "#丹下健三 による戦後日本のモダニズム建築。",
      tags: ["丹下健三", "日本建築", "広島", "モダニズム"],
      position: { x: 0, y: 100 },
    },
    {
      id: 106,
      title: "TWAフライトセンター",
      startDate: new Date(1962, 0, 1),
      endDate: new Date(1962, 0, 1),
      description: "曲線的なフォルムが象徴的な #未来派建築 の代表作。",
      tags: ["サーリネン", "空港建築", "未来派建築"],
      position: { x: 0, y: 100 },
    },
    {
      id: 107,
      title: "メタボリズム",
      startDate: new Date(1960, 0, 1),
      endDate: new Date(1960, 0, 1),
      description: "新陳代謝する都市を構想した #メタボリズム 運動。",
      tags: ["メタボリズム", "都市構想", "日本建築"],
      position: { x: 0, y: 110 },
    },
    {
      id: 108,
      title: "大分県立図書館",
      startDate: new Date(1966, 0, 1),
      endDate: new Date(1966, 0, 1),
      description:
        "#磯崎新 初期の代表作。#モダニズム に根ざしつつ独自の構造美を持つ。",
      tags: ["磯崎新", "図書館建築", "日本建築"],
      position: { x: 0, y: 100 },
    },
    {
      id: 109,
      title: "ロイドビル",
      startDate: new Date(1986, 0, 1),
      endDate: new Date(1986, 0, 1),
      description: "#ハイテック建築 の象徴的作品。",
      tags: ["ハイテック建築", "リチャード・ロジャース", "イギリス建築"],
      position: { x: 0, y: 90 },
    },
    {
      id: 110,
      title: "ザハ・ハディド注目を浴びる",
      startDate: new Date(1983, 0, 1),
      endDate: new Date(1983, 0, 1),
      description: "1983年の #香港のピーク・クラブ 計画で国際的注目を浴びた。",
      tags: ["ザハ・ハディド", "女性建築家", "ポストモダン"],
      position: { x: 0, y: 90 },
    },
    {
      id: 111,
      title: "せんだいメディアテーク",
      startDate: new Date(2001, 0, 1),
      endDate: new Date(2001, 0, 1),
      description: "#日本建築 における情報化時代の先駆。",
      tags: ["伊東豊雄", "情報建築", "せんだいメディアテーク"],
      position: { x: 0, y: 100 },
    },
    {
      id: 112,
      title: "テルメ・ヴァルス",
      startDate: new Date(1996, 0, 1),
      endDate: new Date(1996, 0, 1),
      description: "素材と空間体験を重視した #ミニマリズム 建築の傑作。",
      tags: ["ピーター・ズントー", "スイス建築", "ミニマリズム"],
      position: { x: 0, y: 90 },
    },
    {
      id: 113,
      title: "ボルドーの家",
      startDate: new Date(1998, 0, 1),
      endDate: new Date(1998, 0, 1),
      description: "#OMA による可変性のある住宅。",
      tags: ["レム・コールハース", "OMA", "住宅建築"],
      position: { x: 0, y: 100 },
    },
    {
      id: 114,
      title: "東京国立博物館法隆寺宝物館",
      startDate: new Date(1999, 0, 1),
      endDate: new Date(1999, 0, 1),
      description: "静謐で洗練された日本の #現代建築 。",
      tags: ["谷口吉生", "ミュージアム建築", "日本建築"],
      position: { x: 0, y: 95 },
    },
    {
      id: 115,
      title: "光の教会",
      startDate: new Date(1989, 0, 1),
      endDate: new Date(1989, 0, 1),
      description: "#安藤忠雄 による光と空間の宗教建築。",
      tags: ["安藤忠雄", "光の教会", "宗教建築"],
      position: { x: 0, y: 100 },
    },
    {
      id: 116,
      title: "梅田スカイビル",
      startDate: new Date(1993, 0, 1),
      endDate: new Date(1993, 0, 1),
      description: "都市を空中でつなぐ構想を体現した #空中都市 建築。",
      tags: ["原広司", "空中都市", "日本建築"],
      position: { x: 0, y: 90 },
    },
    {
      id: 117,
      title: "中銀カプセルタワー",
      startDate: new Date(1972, 0, 1),
      endDate: new Date(1972, 0, 1),
      description: "#メタボリズム を象徴するカプセル型集合住宅。",
      tags: ["黒川紀章", "中銀カプセルタワー", "集合住宅"],
      position: { x: 0, y: 110 },
    },
    {
      id: 118,
      title: "私の家",
      startDate: new Date(1954, 0, 1),
      endDate: new Date(1954, 0, 1),
      description: "#戦後建築 の代表的な小住宅。",
      tags: ["清家清", "住宅建築", "戦後建築"],
      position: { x: 0, y: 100 },
    },
    {
      id: 119,
      title: "ヴィトラ・デザイン・ミュージアム",
      startDate: new Date(1989, 0, 1),
      endDate: new Date(1989, 0, 1),
      description: "ポストモダンの象徴的なデザインミュージアム。",
      tags: ["フランク・ゲーリー", "ポストモダン", "美術館"],
      position: { x: 0, y: 90 },
    },
    {
      id: 120,
      title: "シアトル図書館",
      startDate: new Date(2004, 0, 1),
      endDate: new Date(2004, 0, 1),
      description: "#レム・コールハース による #情報空間 の実験。",
      tags: ["OMA", "シアトル図書館", "情報空間"],
      position: { x: 0, y: 100 },
    },
  ]);

  const [allTags, setAllTags] = useState([
    "明治維新",
    "江戸幕府",
    "明治政府",
    "終戦",
    "太平洋戦争",
    "日本史",
    "歴史",
    "政治",
    "文化",
  ]);

  // 検索とフィルタリングの状態
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedEvents, setHighlightedEvents] = useState(new Set());

  // ヘルプボックスの開閉状態
  const [isHelpOpen, setIsHelpOpen] = useState(true);

  // モーダルの状態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [editingEvent, setEditingEvent] = useState(null); // 編集中のイベント
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: new Date(),
    manualTags: [], // 手動で追加されたタグ
  });

  const timelineRef = useRef(null);
  const isDragging = useRef(false);
  const isCardDragging = useRef(false);
  const lastMouseX = useRef(0);
  const lastMouseY = useRef(0);
  const isShiftPressed = useRef(false); // Shiftキーの状態を追跡

  // 初期位置に戻す関数
  const resetToInitialPosition = useCallback(() => {
    const targetYear = 2030;
    const initialPixelsPerYear = basePixelsPerYear * 2.5;
    const targetX = (targetYear - startYear) * initialPixelsPerYear;
    const initialPanX = window.innerWidth - targetX;
    
    setScale(2.5);
    setPanX(initialPanX);
    setPanY(0);
  }, [startYear, basePixelsPerYear]);

  const currentPixelsPerYear = basePixelsPerYear * scale;
  const extractTagsFromDescription = useCallback((description) => {
    const tagRegex = /#([^\s#]+)/g;
    const matches = [];
    let match;
    while ((match = tagRegex.exec(description)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  }, []);

  // 座標から年を計算
  const getYearFromX = useCallback(
    (x) => {
      return startYear + (x - panX) / currentPixelsPerYear;
    },
    [startYear, panX, currentPixelsPerYear]
  );

  // 年から座標を計算
  const getXFromYear = useCallback(
    (year) => {
      return (year - startYear) * currentPixelsPerYear + panX;
    },
    [startYear, currentPixelsPerYear, panX]
  );

  // ダブルクリックでイベント作成
  const handleDoubleClick = useCallback(
    (e) => {
      // パネルやカード上のダブルクリックは無視
      if (
        e.target.closest(".floating-panel") ||
        e.target.closest(".timeline-card")
      ) {
        return;
      }

      // イベント上でのダブルクリックかチェック
      const eventElement = e.target.closest("[data-event-id]");
      if (eventElement) {
        // 既存イベントの編集
        const eventId = parseInt(eventElement.dataset.eventId);
        const event = events.find((e) => e.id === eventId);
        if (event) {
          setEditingEvent(event);
          setNewEvent({
            title: event.title,
            description: event.description,
            date: event.startDate,
            manualTags: event.tags.filter(
              (tag) =>
                tag !== event.title &&
                !extractTagsFromDescription(event.description).includes(tag)
            ),
          });

          // モーダル位置をイベントの近くに設定
          const rect = eventElement.getBoundingClientRect();
          const timelineRect = timelineRef.current.getBoundingClientRect();
          setModalPosition({
            x: rect.left - timelineRect.left + rect.width / 2,
            y: rect.top - timelineRect.top + rect.height,
          });
          setIsModalOpen(true);
        }
        return;
      }

      // 新規イベント作成
      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const year = getYearFromX(clickX);

      // ズームレベルに応じて日付の精度を調整
      let clickDate;
      const adjustedScale = scale / 2.5; // 基準スケール
      if (adjustedScale < 1) {
        // 縮小時は1月1日固定
        clickDate = new Date(Math.round(year), 0, 1);
      } else {
        // 拡大時でも月単位で計算、常に1日に設定
        const yearStart =
          (Math.round(year) - startYear) * currentPixelsPerYear + panX;
        const monthOffset = (clickX - yearStart) / (currentPixelsPerYear / 12);
        const monthOfYear = Math.floor(Math.max(0, Math.min(11, monthOffset)));
        // 必ず1日に設定
        clickDate = new Date();
        clickDate.setFullYear(Math.round(year));
        clickDate.setMonth(monthOfYear);
        clickDate.setDate(1);
      }

      setEditingEvent(null);
      setNewEvent({
        title: "",
        description: "",
        date: clickDate,
        manualTags: [],
      });

      setModalPosition({ x: clickX, y: clickY });
      setIsModalOpen(true);
    },
    [
      getYearFromX,
      events,
      extractTagsFromDescription,
      currentPixelsPerYear,
      panX,
      scale,
      startYear,
    ]
  );

  // イベント保存
  const saveEvent = useCallback(() => {
    if (!newEvent.title.trim()) return;

    const extractedTags = extractTagsFromDescription(newEvent.description);
    const allEventTags = [
      newEvent.title,
      ...extractedTags,
      ...newEvent.manualTags,
    ];
    // 重複を排除
    const eventTags = [...new Set(allEventTags.filter((tag) => tag.trim()))];

    // 新しいタグをallTagsに追加
    const newTags = eventTags.filter((tag) => !allTags.includes(tag));
    if (newTags.length > 0) {
      setAllTags((prev) => [...prev, ...newTags]);
    }

    if (editingEvent) {
      // 既存イベントの更新
      const updatedEvent = {
        ...editingEvent,
        title: newEvent.title,
        startDate: newEvent.date,
        endDate: newEvent.date,
        description: newEvent.description,
        tags: eventTags,
      };
      setEvents((prev) =>
        prev.map((e) => (e.id === editingEvent.id ? updatedEvent : e))
      );
    } else {
      // 新規イベントの作成
      const event = {
        id: Date.now(),
        title: newEvent.title,
        startDate: newEvent.date,
        endDate: newEvent.date,
        description: newEvent.description,
        tags: eventTags,
        position: { x: modalPosition.x, y: modalPosition.y },
      };
      setEvents((prev) => [...prev, event]);
    }

    setIsModalOpen(false);
    setEditingEvent(null);
    setNewEvent({
      title: "",
      description: "",
      date: new Date(),
      manualTags: [],
    });
  }, [
    newEvent,
    modalPosition,
    allTags,
    editingEvent,
    extractTagsFromDescription,
  ]);

  // モーダルを閉じる
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingEvent(null);
    setNewEvent({
      title: "",
      description: "",
      date: new Date(),
      manualTags: [],
    });
  }, []);

  // ESCキーでモーダルを閉じる、Ctrl+Enterで保存
  const handleKeyDown = useCallback(
    (e) => {
      if (isModalOpen) {
        if (e.key === "Escape") {
          closeModal();
        } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          // Ctrl+Enter（WindowsなどのCtrlキー）またはCmd+Enter（MacのMetaキー）で保存
          e.preventDefault();
          saveEvent();
        }
      }
    },
    [isModalOpen, closeModal, saveEvent]
  );

  // ESCキーのイベントリスナーをセットアップ
  useEffect(() => {
    if (isModalOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isModalOpen, handleKeyDown]);

  // 手動タグの追加
  const addManualTag = useCallback(
    (tagText) => {
      const trimmedTag = tagText.trim();
      if (trimmedTag && !newEvent.manualTags.includes(trimmedTag)) {
        setNewEvent((prev) => ({
          ...prev,
          manualTags: [...prev.manualTags, trimmedTag],
        }));
      }
    },
    [newEvent.manualTags]
  );

  // 手動タグの削除
  const removeManualTag = useCallback((tagToRemove) => {
    setNewEvent((prev) => ({
      ...prev,
      manualTags: prev.manualTags.filter((tag) => tag !== tagToRemove),
    }));
  }, []);

  // 説明文からタグを抽出して表示用に統合
  const getAllCurrentTags = useCallback(() => {
    const extractedTags = extractTagsFromDescription(newEvent.description);
    const titleTag = newEvent.title.trim() ? [newEvent.title.trim()] : [];
    const allTags = [...titleTag, ...extractedTags, ...newEvent.manualTags];
    return [...new Set(allTags.filter((tag) => tag))]; // 重複排除
  }, [
    newEvent.title,
    newEvent.description,
    newEvent.manualTags,
    extractTagsFromDescription,
  ]);

  // タグ検索機能
  const handleSearchChange = useCallback(
    (e) => {
      const term = e.target.value;
      setSearchTerm(term);

      if (term.trim() === "") {
        setHighlightedEvents(new Set());
        return;
      }

      // 検索語を小文字で分割（スペース区切りで複数タグ検索可能）
      const searchTerms = term
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length > 0);

      const matchingEventIds = new Set();
      events.forEach((event) => {
        const eventTags = event.tags.map((tag) => tag.toLowerCase());
        const eventTitle = event.title.toLowerCase();

        // すべての検索語がタグまたはタイトルに含まれているかチェック
        const allTermsMatch = searchTerms.every(
          (searchTerm) =>
            eventTags.some((tag) => tag.includes(searchTerm)) ||
            eventTitle.includes(searchTerm)
        );

        if (allTermsMatch) {
          matchingEventIds.add(event.id);
        }
      });

      setHighlightedEvents(matchingEventIds);
    },
    [events]
  );

  // イベントの重なりを自動調整する（段階的配置方式）
  const adjustEventPositions = useCallback(() => {
    const eventWidth = 120; // イベントの幅（概算）
    const eventHeight = 40; // イベントの高さ
    const minGap = 10; // 最小間隔
    const baseY = 60; // 基準のY位置

    // X座標でソートして左から順に処理
    const sortedEvents = [...events].sort((a, b) => {
      const aX = getXFromYear(a.startDate.getFullYear());
      const bX = getXFromYear(b.startDate.getFullYear());
      return aX - bX;
    });

    const placedEvents = []; // すでに配置されたイベントの配列

    return sortedEvents.map((event) => {
      const eventX = getXFromYear(event.startDate.getFullYear());
      let assignedY = baseY; // 初期は基準位置
      let level = 0; // 段数

      // 重ならない段を見つけるまでループ
      while (true) {
        let hasCollision = false;

        // すでに配置されたイベントとの重なりをチェック
        for (const placedEvent of placedEvents) {
          const placedX = placedEvent.adjustedPosition.x;
          const placedY = placedEvent.adjustedPosition.y;

          // X軸での重なりチェック
          if (Math.abs(eventX - placedX) < eventWidth + minGap) {
            // Y軸での重なりチェック
            if (Math.abs(assignedY - placedY) < eventHeight + minGap) {
              hasCollision = true;
              break;
            }
          }
        }

        if (!hasCollision) {
          // 重ならない位置が見つかった
          break;
        }

        // 次の段に移動
        level++;
        assignedY = baseY + level * (eventHeight + minGap);

        // 安全装置：100段まで
        if (level >= 100) break;
      }

      const adjustedEvent = {
        ...event,
        adjustedPosition: { x: eventX, y: assignedY },
      };

      // 配置済みリストに追加
      placedEvents.push(adjustedEvent);

      return adjustedEvent;
    });
  }, [events, getXFromYear]);

  const getTopTagsFromSearch = useCallback(() => {
    if (searchTerm.trim() === "" || highlightedEvents.size === 0) {
      return allTags.slice(0, 6);
    }

    // ハイライトされたイベントのタグを集計
    const tagCounts = {};
    events.forEach((event) => {
      if (highlightedEvents.has(event.id)) {
        event.tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    // 使用頻度順にソートして上位6つを返す
    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([tag]) => tag);
  }, [searchTerm, highlightedEvents, allTags, events]);

  const handleWheel = useCallback(
    (e) => {
      // モーダルが開いている時はズームを無効化
      if (isModalOpen) return;

      e.preventDefault();
      const rect = timelineRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;

      const yearAtMouse = startYear + (mouseX - panX) / currentPixelsPerYear;

      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.25, Math.min(500, scale * zoomFactor)); // 最大500倍に拡大

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
    },
    [
      scale,
      panX,
      currentPixelsPerYear,
      startYear,
      totalYears,
      basePixelsPerYear,
      isModalOpen,
    ]
  );

  const handleMouseDown = useCallback(
    (e) => {
      // モーダルが開いている時はパンを無効化
      if (isModalOpen) return;

      // 年表カードやパネル上でのクリックは無視
      if (
        e.target.closest(".floating-panel") ||
        e.target.closest(".timeline-card")
      ) {
        return;
      }
      
      // Shiftキーの状態を記録
      isShiftPressed.current = e.shiftKey;
      
      isDragging.current = true;
      lastMouseX.current = e.clientX;
      lastMouseY.current = e.clientY;
    },
    [isModalOpen]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (isDragging.current) {
        if (isShiftPressed.current) {
          // Shiftキーが押されている場合はY軸パン
          const deltaY = e.clientY - lastMouseY.current;
          setPanY((prev) => prev + deltaY);
          lastMouseY.current = e.clientY;
        } else {
          // 通常のX軸パン
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
      }

      if (isCardDragging.current) {
        const deltaY = e.clientY - lastMouseY.current;
        setTimelineCardY((prev) =>
          Math.max(80, Math.min(window.innerHeight - 100, prev + deltaY))
        );
        lastMouseY.current = e.clientY;
      }
    },
    [panX, totalYears, currentPixelsPerYear]
  );

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
    if (adjustedScale > 12) yearInterval = 1; // 元の30
    else if (adjustedScale > 6) yearInterval = 2; // 元の15
    else if (adjustedScale > 2) yearInterval = 5; // 元の5
    else if (adjustedScale > 0.8) yearInterval = 10; // 元の2
    else if (adjustedScale > 0.4) yearInterval = 50; // 元の1
    else if (adjustedScale > 0.2) yearInterval = 100; // 元の0.5
    else if (adjustedScale > 0.1) yearInterval = 200; // 元の0.25
    else if (adjustedScale > 0.04) yearInterval = 500; // 元の0.1
    else yearInterval = 1000;

    for (let year = startYear; year <= endYear; year += yearInterval) {
      const x = (year - startYear) * currentPixelsPerYear + panX;
      if (x > -100 && x < window.innerWidth + 100) {
        markers.push(
          <div
            key={year}
            style={{
              position: "absolute",
              left: x,
              top: 0,
              height: "100%",
              borderLeft: "1px solid #ddd",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: "10px",
                left: "5px",
                fontSize: "12px",
                color: "#666",
                userSelect: "none",
              }}
            >
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
      width: "100vw",
      height: "100vh",
      backgroundColor: "white",
      overflow: "hidden",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    header: {
      position: "relative",
      backgroundColor: "#f5f3ed",
      borderBottom: "1px solid #e5e7eb",
      height: "64px",
      display: "flex",
      alignItems: "center",
      padding: "0 16px",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      zIndex: 2,
    },
    title: {
      fontSize: "20px",
      fontWeight: "bold",
      color: "#374151",
    },
    headerRight: {
      marginLeft: "auto",
      display: "flex",
      alignItems: "center",
      gap: "16px",
    },
    addButton: {
      backgroundColor: "#e29548ff",
      color: "white",
      padding: "8px 16px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
    },
    resetButton: {
      backgroundColor: "#6b7280",
      color: "white",
      padding: "6px 12px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
      fontSize: "14px",
      display: "flex",
      alignItems: "center",
      gap: "4px",
    },
    zoomInfo: {
      fontSize: "14px",
      color: "#6b7280",
    },
    timeline: {
      width: "100vw",
      height: "calc(100vh - 64px)",
      position: "relative",
      backgroundColor: "white",
      cursor: isDragging.current ? "grabbing" : "grab",
    },
    // 浮遊する検索パネル
    floatingPanel: {
      position: "absolute",
      top: "20px",
      left: "20px",
      width: "200px",
      backgroundColor: "#f5f5f3",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      zIndex: 10,
      padding: "16px",
    },
    searchInput: {
      width: "100%",
      padding: "8px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      marginBottom: "16px",
      fontSize: "14px",
      boxSizing: "border-box",
    },
    tagSection: {
      marginBottom: "16px",
    },
    sectionTitle: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#374151",
      marginBottom: "8px",
    },
    tagContainer: {
      display: "flex",
      flexWrap: "wrap",
      gap: "4px",
    },
    tag: {
      padding: "4px 8px",
      backgroundColor: "#c8eaeeff",
      color: "#1b5f65ff",
      fontSize: "12px",
      border: "1px solid #319ca5ff",
      borderRadius: "4px",
    },
    createButton: {
      width: "100%",
      backgroundColor: "#319ca5ff",
      color: "white",
      padding: "8px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
    },
    // ドラッグ可能な年表カード
    timelineCard: {
      position: "absolute",
      left: "20px",
      top: timelineCardY + "px",
      width: "200px",
      padding: "12px",
      backgroundColor: "#f9fafb",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      cursor: "move",
      zIndex: 9,
    },
    timelineTitle: {
      fontSize: "14px",
      fontWeight: "600",
      marginBottom: "8px",
      marginTop: "0px",
      userSelect: "none",
    },
    event: {
      position: "absolute",
      padding: "8px 12px",
      borderRadius: "6px",
      color: "white",
      cursor: "pointer",
      fontWeight: "500",
      fontSize: "14px",
      transform: "translateX(-50%)",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    },
    helpBox: {
      position: "absolute",
      bottom: "16px",
      right: "16px",
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      color: "white",
      padding: "12px",
      borderRadius: "6px",
      fontSize: "12px",
      lineHeight: "1.4",
    },
  };

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <h1 style={styles.title}>#ハッシュタグ年表</h1>
        <div style={styles.headerRight}>
          <button 
            style={styles.resetButton}
            onClick={resetToInitialPosition}
            title="初期位置に戻す"
          >
            🏠 初期位置
          </button>
          <button style={styles.addButton}>+ イベントを追加</button>
          <span style={styles.zoomInfo}>
            ズーム: {(scale / 2.5).toFixed(1)}x
          </span>
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
              {getTopTagsFromSearch().map((tag) => (
                <span key={tag} style={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <button
            style={{
              ...styles.createButton,
              opacity: highlightedEvents.size > 0 ? 1 : 0.5,
              cursor: highlightedEvents.size > 0 ? "pointer" : "not-allowed",
            }}
            disabled={highlightedEvents.size === 0}
          >
            年表を作成{" "}
            {highlightedEvents.size > 0 && `(${highlightedEvents.size})`}
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
        {adjustEventPositions().map((event) => {
          const isHighlighted = highlightedEvents.has(event.id);
          return (
            <div
              key={event.id}
              data-event-id={event.id}
              style={{
                position: "absolute",
                left: event.adjustedPosition.x,
                top: event.adjustedPosition.y + panY + "px", // panYを追加
                transform: "translateX(-50%)",
                cursor: "pointer",
                zIndex: isHighlighted ? 5 : 1,
                textAlign: "center",
                userSelect: "none",
              }}
            >
              {/* 年表示 */}
              <div
                style={{
                  fontSize: "10px",
                  color: "#666",
                  marginBottom: "2px",
                }}
              >
                {event.startDate.getFullYear()}
              </div>

              {/* イベントタイトル */}
              <div
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  color: "white",
                  fontWeight: "500",
                  fontSize: "11px",
                  minWidth: "60px",
                  maxWidth: "120px",
                  backgroundColor: isHighlighted
                    ? "#10b981"
                    : event.id === 1 || event.id === 2
                    ? event.id === 1
                      ? "#3b82f6"
                      : "#ef4444"
                    : "#6b7280",
                  border: isHighlighted ? "2px solid #059669" : "none",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  lineHeight: "1.1",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {truncateTitle(event.title)}
              </div>
            </div>
          );
        })}

        {/* 現在ライン */}
        <div
          style={{
            position: "absolute",
            left: (2025.6 - startYear) * currentPixelsPerYear + panX,
            top: 0,
            height: "100%",
            borderLeft: "1px solid #f6a656ff",
            pointerEvents: "none",
          }}
        />

        {/* イベント作成モーダル */}
        {isModalOpen && (
          <div
            style={{
              position: "absolute",
              left: Math.min(
                Math.max(20, modalPosition.x - 160),
                window.innerWidth - 340
              ),
              top: Math.min(
                Math.max(20, modalPosition.y),
                window.innerHeight - 500 // モーダルの高さを考慮して調整
              ),
              width: "320px",
              backgroundColor: "white",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              padding: "16px",
              zIndex: 20,
              maxHeight: "480px", // 最大高さを設定
              overflowY: "auto", // 内容が長い場合はスクロール可能に
            }}
          >
            <h3
              style={{
                margin: "0 0 12px 0",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              {editingEvent ? "イベントを編集" : "新しいイベント"}
            </h3>

            {/* 日時入力 */}
            <div style={{ marginBottom: "12px" }}>
              <input
                type="date"
                value={newEvent.date.toISOString().split("T")[0]}
                onChange={(e) =>
                  setNewEvent((prev) => ({
                    ...prev,
                    date: new Date(e.target.value),
                  }))
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* タイトル入力 */}
            <div style={{ marginBottom: "12px" }}>
              <input
                type="text"
                placeholder="イベントタイトル"
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent((prev) => ({ ...prev, title: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
                autoFocus
              />
            </div>

            {/* 説明文入力 */}
            <div style={{ marginBottom: "12px" }}>
              <textarea
                placeholder="説明文。例: #建築 #モダニズム による代表作"
                value={newEvent.description}
                onChange={(e) =>
                  setNewEvent((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                style={{
                  width: "100%",
                  height: "60px",
                  padding: "8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "14px",
                  resize: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* 統合されたタグ表示・編集 */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  marginBottom: "4px",
                }}
              >
                タグ (Enterで追加、×で削除)
              </label>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "4px",
                  minHeight: "40px",
                  padding: "8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  backgroundColor: "white",
                  alignItems: "flex-start",
                }}
              >
                {/* 既存タグの表示 */}
                {getAllCurrentTags().map((tag, index) => (
                  <span
                    key={`${tag}-${index}`}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#3b82f6",
                      color: "white",
                      fontSize: "12px",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      height: "24px",
                    }}
                  >
                    {tag}
                    {/* 手動タグのみ削除可能 */}
                    {newEvent.manualTags.includes(tag) && (
                      <button
                        onClick={() => removeManualTag(tag)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "white",
                          cursor: "pointer",
                          fontSize: "14px",
                          padding: "0",
                          width: "16px",
                          height: "16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "50%",
                        }}
                        onMouseOver={(e) =>
                          (e.target.style.backgroundColor =
                            "rgba(255,255,255,0.2)")
                        }
                        onMouseOut={(e) =>
                          (e.target.style.backgroundColor = "transparent")
                        }
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}

                {/* インライン追加フィールド */}
                <input
                  type="text"
                  placeholder={
                    getAllCurrentTags().length === 0
                      ? "タグを入力してEnterで追加"
                      : "新しいタグ"
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.target.value.trim()) {
                      e.preventDefault();
                      addManualTag(e.target.value.trim());
                      e.target.value = ""; // 入力をクリア
                    }
                  }}
                  style={{
                    border: "none",
                    outline: "none",
                    padding: "4px 8px",
                    fontSize: "12px",
                    minWidth: "100px",
                    backgroundColor: "transparent",
                    height: "24px",
                    flex: 1,
                  }}
                />
              </div>
              <div
                style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}
              >
                💡 タイトルと説明文の #タグ名 は自動的に追加されます<br />
                💡 Ctrl+Enter（Mac: Cmd+Enter）で保存
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={closeModal}
                style={{
                  padding: "6px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  backgroundColor: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                キャンセル
              </button>
              {editingEvent && (
                <button
                  onClick={() => {
                    if (window.confirm("このイベントを削除しますか？")) {
                      setEvents((prev) =>
                        prev.filter((e) => e.id !== editingEvent.id)
                      );
                      closeModal();
                    }
                  }}
                  style={{
                    padding: "6px 12px",
                    border: "none",
                    borderRadius: "4px",
                    backgroundColor: "#ef4444",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  削除
                </button>
              )}
              <button
                onClick={saveEvent}
                style={{
                  padding: "6px 12px",
                  border: "none",
                  borderRadius: "4px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                {editingEvent ? "更新" : "作成"}
              </button>
            </div>
          </div>
        )}

        {/* 開閉可能なヘルプボックス */}
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            right: "16px",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            borderRadius: "6px",
            fontSize: "12px",
            lineHeight: "1.4",
            maxWidth: "250px",
            zIndex: 10,
          }}
        >
          {/* ヘッダー */}
          <div
            style={{
              padding: "8px 12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: isHelpOpen
                ? "1px solid rgba(255,255,255,0.2)"
                : "none",
            }}
            onClick={() => setIsHelpOpen(!isHelpOpen)}
          >
            <span style={{ fontWeight: "500" }}>操作ガイド</span>
            <span
              style={{
                fontSize: "14px",
                transition: "transform 0.2s",
                transform: isHelpOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              ▼
            </span>
          </div>

          {/* コンテンツ */}
          {isHelpOpen && (
            <div style={{ padding: "8px 12px" }}>
              <div>マウスホイール: ズーム</div>
              <div>ドラッグ: 横パン移動</div>
              <div>Shift+ドラッグ: 縦パン移動</div>
              <div>年表カード: 縦ドラッグで移動</div>
              <div>ダブルクリック: イベント追加・編集</div>
              <div
                style={{
                  marginTop: "8px",
                  paddingTop: "8px",
                  borderTop: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <div>タグの作り方:</div>
                <div
                  style={{ marginLeft: "12px", fontSize: "11px", opacity: 0.9 }}
                >
                  説明文で{" "}
                  <code
                    style={{
                      backgroundColor: "rgba(255,255,255,0.2)",
                      padding: "1px 3px",
                      borderRadius: "2px",
                    }}
                  >
                    #タグ名
                  </code>{" "}
                  を使用
                </div>
              </div>
              {highlightedEvents.size > 0 && (
                <div
                  style={{
                    marginTop: "8px",
                    color: "#10b981",
                    paddingTop: "8px",
                    borderTop: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  {highlightedEvents.size}件ヒット中
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HashtagTimeline;