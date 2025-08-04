// hooks/useTimelineLogic.js
import { useState, useCallback, useEffect } from "react";
import { TIMELINE_CONFIG } from "../constants/timelineConfig";
import { sampleEvents, initialTags } from "../utils/eventUtils";
import { 
  extractTagsFromDescription, 
  truncateTitle,
  getYearFromX,
  getXFromYear 
} from "../utils/timelineUtils";

export const useTimelineLogic = (timelineRef, isDragging, isCardDragging, lastMouseX, lastMouseY, isShiftPressed) => {
  const calculateInitialPanX = () => {
    const initialPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * TIMELINE_CONFIG.DEFAULT_SCALE;
    const targetX = (2030 - (-5000)) * initialPixelsPerYear;
    return window.innerWidth - targetX;
  };

  // 基本状態
  const [scale, setScale] = useState(TIMELINE_CONFIG.DEFAULT_SCALE);
  const [panX, setPanX] = useState(() => calculateInitialPanX());
  const [panY, setPanY] = useState(0);
  const [timelineCardY, setTimelineCardY] = useState(100);

  // データ状態
  const [events, setEvents] = useState(sampleEvents);
  const [allTags, setAllTags] = useState(initialTags);

  // 検索・フィルタリング状態
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedEvents, setHighlightedEvents] = useState(new Set());

  // 年表管理状態
  const [createdTimelines, setCreatedTimelines] = useState([]);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [selectedTimeline, setSelectedTimeline] = useState(null);
  const [viewMode, setViewMode] = useState('main'); // 'main' | 'timeline'
  const [activeTimeline, setActiveTimeline] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // 年表ビュー用の状態
  const [timelineScale, setTimelineScale] = useState(2);
  const [timelinePanX, setTimelinePanX] = useState(0);

  // UI状態
  const [isHelpOpen, setIsHelpOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: new Date(),
    manualTags: [],
  });

  // 計算値
  const currentPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * scale;

  // 初期位置に戻す
  const resetToInitialPosition = useCallback(() => {
    setScale(TIMELINE_CONFIG.DEFAULT_SCALE);
    setPanX(calculateInitialPanX());
    setPanY(0);
  }, []);

  // 検索機能
  const handleSearchChange = useCallback((e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.trim() === "") {
      setHighlightedEvents(new Set());
      return;
    }

    const searchTerms = term
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 0);

    const matchingEventIds = new Set();
    events.forEach((event) => {
      const eventTags = event.tags.map((tag) => tag.toLowerCase());
      const eventTitle = event.title.toLowerCase();

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
  }, [events]);

  // 上位タグ取得
  const getTopTagsFromSearch = useCallback(() => {
    if (searchTerm.trim() === "" || highlightedEvents.size === 0) {
      return allTags.slice(0, 6);
    }

    const tagCounts = {};
    events.forEach((event) => {
      if (highlightedEvents.has(event.id)) {
        event.tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([tag]) => tag);
  }, [searchTerm, highlightedEvents, allTags, events]);

  // イベント配置調整（修正版）
  const adjustEventPositions = useCallback(() => {
    const sortedEvents = [...events].sort((a, b) => {
      const aX = getXFromYear(a.startDate.getFullYear(), currentPixelsPerYear, panX);
      const bX = getXFromYear(b.startDate.getFullYear(), currentPixelsPerYear, panX);
      return aX - bX;
    });

    const placedEvents = [];
    const BASE_Y = 60; // ハードコード値を使用
    const EVENT_WIDTH = 120;
    const EVENT_HEIGHT = 40;
    const MIN_GAP = 10;
    const MAX_LEVELS = 100;

    return sortedEvents.map((event) => {
      const eventX = getXFromYear(event.startDate.getFullYear(), currentPixelsPerYear, panX);
      let assignedY = BASE_Y;
      let level = 0;

      while (level < MAX_LEVELS) {
        let hasCollision = false;

        for (const placedEvent of placedEvents) {
          const placedX = placedEvent.adjustedPosition.x;
          const placedY = placedEvent.adjustedPosition.y;

          if (Math.abs(eventX - placedX) < EVENT_WIDTH + MIN_GAP) {
            if (Math.abs(assignedY - placedY) < EVENT_HEIGHT + MIN_GAP) {
              hasCollision = true;
              break;
            }
          }
        }

        if (!hasCollision) break;

        level++;
        assignedY = BASE_Y + level * (EVENT_HEIGHT + MIN_GAP);
      }

      const adjustedEvent = {
        ...event,
        adjustedPosition: { x: eventX, y: assignedY },
      };

      placedEvents.push(adjustedEvent);
      return adjustedEvent;
    });
  }, [events, currentPixelsPerYear, panX]);

  // ダブルクリックでイベント作成・編集
  const handleDoubleClick = useCallback((e) => {
    if (e.target.closest(".floating-panel") || e.target.closest(".timeline-card")) {
      return;
    }

    const eventElement = e.target.closest("[data-event-id]");
    if (eventElement) {
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

        const rect = eventElement.getBoundingClientRect();
        const timelineRect = timelineRef.current?.getBoundingClientRect();
        if (timelineRect) {
          setModalPosition({
            x: rect.left - timelineRect.left + rect.width / 2,
            y: rect.top - timelineRect.top + rect.height,
          });
        }
        setIsModalOpen(true);
      }
      return;
    }

    // 新規イベント作成
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const year = getYearFromX(clickX, currentPixelsPerYear, panX);
      const clickDate = new Date(Math.round(year), 0, 1);

      setEditingEvent(null);
      setNewEvent({
        title: "",
        description: "",
        date: clickDate,
        manualTags: [],
      });

      setModalPosition({ x: clickX, y: clickY });
      setIsModalOpen(true);
    }
  }, [events, currentPixelsPerYear, panX, timelineRef]);

  // イベント保存
  const saveEvent = useCallback(() => {
    if (!newEvent.title.trim()) return;

    const extractedTags = extractTagsFromDescription(newEvent.description);
    const allEventTags = [newEvent.title, ...extractedTags, ...newEvent.manualTags];
    const eventTags = [...new Set(allEventTags.filter((tag) => tag.trim()))];

    const newTags = eventTags.filter((tag) => !allTags.includes(tag));
    if (newTags.length > 0) {
      setAllTags((prev) => [...prev, ...newTags]);
    }

    if (editingEvent) {
      const updatedEvent = {
        ...editingEvent,
        title: newEvent.title,
        startDate: newEvent.date,
        endDate: newEvent.date,
        description: newEvent.description,
        tags: eventTags,
      };
      setEvents((prev) => prev.map((e) => (e.id === editingEvent.id ? updatedEvent : e)));
    } else {
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
    setNewEvent({ title: "", description: "", date: new Date(), manualTags: [] });
  }, [newEvent, modalPosition, allTags, editingEvent]);

  // モーダル操作
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingEvent(null);
    setNewEvent({ title: "", description: "", date: new Date(), manualTags: [] });
  }, []);

  // タグ操作
  const addManualTag = useCallback((tagText) => {
    const trimmedTag = tagText.trim();
    if (trimmedTag && !newEvent.manualTags.includes(trimmedTag)) {
      setNewEvent((prev) => ({
        ...prev,
        manualTags: [...prev.manualTags, trimmedTag],
      }));
    }
  }, [newEvent.manualTags]);

  const removeManualTag = useCallback((tagToRemove) => {
    setNewEvent((prev) => ({
      ...prev,
      manualTags: prev.manualTags.filter((tag) => tag !== tagToRemove),
    }));
  }, []);

  const getAllCurrentTags = useCallback(() => {
    const extractedTags = extractTagsFromDescription(newEvent.description);
    const titleTag = newEvent.title.trim() ? [newEvent.title.trim()] : [];
    const allCurrentTags = [...titleTag, ...extractedTags, ...newEvent.manualTags];
    return [...new Set(allCurrentTags.filter((tag) => tag))];
  }, [newEvent.title, newEvent.description, newEvent.manualTags]);

  // 年表作成
  const createTimeline = useCallback(() => {
    if (highlightedEvents.size === 0) return;

    const filteredEvents = events.filter(event => highlightedEvents.has(event.id));
    const topTags = getTopTagsFromSearch().slice(0, 3);
    const timelineName = searchTerm.trim() || topTags.join('・') || 'カスタム年表';

    const newTimeline = {
      id: Date.now(),
      name: timelineName,
      searchTerm: searchTerm,
      tags: topTags,
      events: filteredEvents,
      createdAt: new Date(),
      eventCount: filteredEvents.length
    };

    setCreatedTimelines(prev => [newTimeline, ...prev]);
    
    // アニメーション付きで年表ビューに切り替え
    setIsTransitioning(true);
    setActiveTimeline(newTimeline);
    
    // 年表ビュー用の初期位置を計算
    const years = filteredEvents.map(e => e.startDate.getFullYear());
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const padding = Math.max(10, (maxYear - minYear) * 0.1);
    const adjustedMinYear = Math.floor(minYear - padding);
    
    // 初期パン位置（最初のイベントが見える位置）
    const initialTimelinePanX = Math.max(0, (window.innerWidth - 300) / 2 - (minYear - adjustedMinYear) * timelineScale * 50);
    setTimelinePanX(initialTimelinePanX);
    
    setTimeout(() => {
      setViewMode('timeline');
      setIsTransitioning(false);
      // 検索をクリア
      setSearchTerm('');
      setHighlightedEvents(new Set());
    }, 100);
  }, [highlightedEvents, events, searchTerm, getTopTagsFromSearch, timelineScale]);

  // 年表表示
  const viewTimeline = useCallback((timeline) => {
    setIsTransitioning(true);
    setActiveTimeline(timeline);
    
    // 既存の年表を表示する場合の位置計算
    const years = timeline.events.map(e => e.startDate.getFullYear());
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const padding = Math.max(10, (maxYear - minYear) * 0.1);
    const adjustedMinYear = Math.floor(minYear - padding);
    
    const initialTimelinePanX = Math.max(0, (window.innerWidth - 300) / 2 - (minYear - adjustedMinYear) * 2 * 50);
    setTimelinePanX(initialTimelinePanX);
    
    setTimeout(() => {
      setViewMode('timeline');
      setIsTransitioning(false);
    }, 100);
  }, []);

  // メインビューに戻る
  const backToMainView = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setViewMode('main');
      setActiveTimeline(null);
      setIsTransitioning(false);
    }, 300);
  }, []);

  // 年表ビューを閉じる（年表削除）
  const closeTimelineView = useCallback(() => {
    if (activeTimeline && window.confirm('この年表を削除しますか？')) {
      setCreatedTimelines(prev => prev.filter(t => t.id !== activeTimeline.id));
    }
    backToMainView();
  }, [activeTimeline, backToMainView]);

  const closeTimelineModal = useCallback(() => {
    setIsTimelineModalOpen(false);
    setSelectedTimeline(null);
  }, []);

  // 年表削除
  const deleteTimeline = useCallback((timelineId) => {
    if (window.confirm('この年表を削除しますか？')) {
      setCreatedTimelines(prev => prev.filter(t => t.id !== timelineId));
    }
  }, []);

  // マウス・ホイールイベント処理（修正版）
  const handleWheel = useCallback((e) => {
    if (isModalOpen) return;

    e.preventDefault();
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const yearAtMouse = getYearFromX(mouseX, currentPixelsPerYear, panX);

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.25, Math.min(500, scale * zoomFactor));

    const newPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * newScale;
    let newPanX = mouseX - (yearAtMouse - (-5000)) * newPixelsPerYear;

    const timelineWidth = (5000 - (-5000)) * newPixelsPerYear;
    const viewportWidth = window.innerWidth;
    const minPanX = -(timelineWidth - viewportWidth);
    const maxPanX = 0;

    newPanX = Math.max(minPanX, Math.min(maxPanX, newPanX));

    setScale(newScale);
    setPanX(newPanX);
  }, [scale, panX, currentPixelsPerYear, isModalOpen, timelineRef]);

  const handleMouseDown = useCallback((e) => {
    if (isModalOpen) return;
    if (e.target.closest(".floating-panel") || e.target.closest(".timeline-card")) return;

    if (isShiftPressed.current !== undefined) {
      isShiftPressed.current = e.shiftKey;
    }
    if (isDragging.current !== undefined) {
      isDragging.current = true;
    }
    if (lastMouseX.current !== undefined) {
      lastMouseX.current = e.clientX;
    }
    if (lastMouseY.current !== undefined) {
      lastMouseY.current = e.clientY;
    }
  }, [isModalOpen, isShiftPressed, isDragging, lastMouseX, lastMouseY]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging.current) {
      if (isShiftPressed.current) {
        const deltaY = e.clientY - lastMouseY.current;
        setPanY((prev) => prev + deltaY);
        lastMouseY.current = e.clientY;
      } else {
        const deltaX = e.clientX - lastMouseX.current;
        const newPanX = panX + deltaX;

        const timelineWidth = (5000 - (-5000)) * currentPixelsPerYear;
        const viewportWidth = window.innerWidth;
        const minPanX = -(timelineWidth - viewportWidth);
        const maxPanX = 0;

        setPanX(Math.max(minPanX, Math.min(maxPanX, newPanX)));
        lastMouseX.current = e.clientX;
      }
    }

    if (isCardDragging.current) {
      const deltaY = e.clientY - lastMouseY.current;
      setTimelineCardY((prev) => Math.max(80, Math.min(window.innerHeight - 100, prev + deltaY)));
      lastMouseY.current = e.clientY;
    }
  }, [panX, currentPixelsPerYear, isDragging, isShiftPressed, lastMouseX, lastMouseY, isCardDragging]);

  const handleMouseUp = useCallback(() => {
    if (isDragging.current !== undefined) {
      isDragging.current = false;
    }
    if (isCardDragging.current !== undefined) {
      isCardDragging.current = false;
    }
  }, [isDragging, isCardDragging]);

  const handleCardMouseDown = useCallback((e) => {
    e.stopPropagation();
    if (isCardDragging.current !== undefined) {
      isCardDragging.current = true;
    }
    if (lastMouseY.current !== undefined) {
      lastMouseY.current = e.clientY;
    }
  }, [isCardDragging, lastMouseY]);

  // キーボードイベント処理
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isModalOpen) {
        if (e.key === "Escape") {
          closeModal();
        } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          saveEvent();
        }
      }
    };

    if (isModalOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isModalOpen, closeModal, saveEvent]);

  // イベント更新ハンドラー
  const handleEventChange = useCallback((updatedEvent) => {
    setNewEvent(updatedEvent);
  }, []);

  return {
    // 状態
    scale, panX, panY, timelineCardY, events, allTags, searchTerm, highlightedEvents,
    createdTimelines, isHelpOpen, isModalOpen, isTimelineModalOpen, modalPosition,
    editingEvent, newEvent, selectedTimeline, currentPixelsPerYear, viewMode, activeTimeline,
    isTransitioning, timelineScale, timelinePanX,
    
    // 関数
    setIsHelpOpen, resetToInitialPosition, handleSearchChange, handleDoubleClick,
    saveEvent, closeModal, addManualTag, removeManualTag, getAllCurrentTags,
    createTimeline, viewTimeline, backToMainView, closeTimelineView, closeTimelineModal, deleteTimeline,
    adjustEventPositions, getTopTagsFromSearch, truncateTitle,
    handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleCardMouseDown,
    handleEventChange, setTimelineScale, setTimelinePanX,
  };
};