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

export const useTimelineLogic = (timelineRef, isDragging, isCardDragging, lastMouseX, lastMouseY,) => {
  const calculateInitialPanX = () => {
    const initialPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * TIMELINE_CONFIG.DEFAULT_SCALE;
    const targetX = (2080 - (-5000)) * initialPixelsPerYear;
    return window.innerWidth - targetX;
  };

  // 基本状態
  const [scale, setScale] = useState(TIMELINE_CONFIG.DEFAULT_SCALE);
  const [panX, setPanX] = useState(() => calculateInitialPanX());
  const [panY, setPanY] = useState(0);

  // データ状態
  const [events, setEvents] = useState(sampleEvents);
  const [allTags, setAllTags] = useState(initialTags);

  // 検索・フィルタリング状態
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedEvents, setHighlightedEvents] = useState(new Set());

  // 浮遊年表管理状態を修正
  const [Timelines, setCreatedTimelines] = useState([]);
  const [draggingCardId, setDraggingCardId] = useState(null);
  const [cardPositions, setCardPositions] = useState({});

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

  // イベント配置調整
  const adjustEventPositions = useCallback(() => {
    const sortedEvents = [...events].sort((a, b) => {
      const aX = getXFromYear(a.startDate.getFullYear(), currentPixelsPerYear, panX);
      const bX = getXFromYear(b.startDate.getFullYear(), currentPixelsPerYear, panX);
      return aX - bX;
    });

    const placedEvents = [];
    const BASE_Y = 60;
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

  // 年表作成（修正版）
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
      eventCount: filteredEvents.length,
      isVisible: true, // 作成時は表示状態
      color: `hsl(${Math.random() * 360}, 60%, 50%)` // ランダムな色を割り当て
    };

    setCreatedTimelines(prev => [...prev, newTimeline]);
    setCardPositions(prev => ({
        ...prev,
        [newTimeline.id]: { x: 20, y: 200 + Timelines.length * 100 }
    }));

    // 検索をクリア
    setSearchTerm('');
    setHighlightedEvents(new Set());
  }, [highlightedEvents, events, searchTerm, getTopTagsFromSearch, Timelines.length]);

  // 年表削除
  const deleteTimeline = useCallback((timelineId) => {
    if (window.confirm('この年表を削除しますか？')) {
      setCreatedTimelines(prev => prev.filter(t => t.id !== timelineId));
      setCardPositions(prev => {
          const newPositions = {...prev};
          delete newPositions[timelineId];
          return newPositions;
      });
    }
  }, []);

  // 表示中の年表のイベント配置計算（新規）
  const getTimelineEventsForDisplay = useCallback(() => {
    const visibleTimelines = Timelines.filter(timeline => timeline.isVisible);
    const timelineEvents = [];

    visibleTimelines.forEach((timeline, timelineIndex) => {
      timeline.events.forEach(event => {
        const eventX = getXFromYear(event.startDate.getFullYear(), currentPixelsPerYear, panX);

        // 年表別のY座標オフセット
        const timelineYOffset = 200 + timelineIndex * 80; // 各年表を80px間隔で配置

        timelineEvents.push({
          ...event,
          timelineId: timeline.id,
          timelineName: timeline.name,
          timelineColor: timeline.color,
          displayX: eventX,
          displayY: timelineYOffset,
          timelineIndex
        });
      });
    });

    return timelineEvents;
  }, [Timelines, currentPixelsPerYear, panX]);

  // 表示中の年表の軸線生成（新規）
  const getTimelineAxesForDisplay = useCallback(() => {
    const visibleTimelines = Timelines.filter(timeline => timeline.isVisible);

    return visibleTimelines.map((timeline, timelineIndex) => {
      const yPosition = 215 + timelineIndex * 80; // 各年表の軸位置

      // 年表の年代範囲を計算
      if (timeline.events.length === 0) {
        return null;
      }
      const years = timeline.events.map(e => e.startDate.getFullYear());
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);

      const startX = getXFromYear(minYear, currentPixelsPerYear, panX);
      const endX = getXFromYear(maxYear, currentPixelsPerYear, panX);

      return {
        id: timeline.id,
        name: timeline.name,
        color: timeline.color,
        yPosition,
        startX: Math.max(-100, startX),
        endX: Math.min(window.innerWidth + 100, endX),
        minYear,
        maxYear
      };
    }).filter(Boolean);
  }, [Timelines, currentPixelsPerYear, panX]);

  // マウス・ホイールイベント処理
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

    if (isDragging.current !== undefined) {
      isDragging.current = true;
    }
    if (lastMouseX.current !== undefined) {
      lastMouseX.current = e.clientX;
    }
    if (lastMouseY.current !== undefined) {
      lastMouseY.current = e.clientY;
    }
  }, [isModalOpen, isDragging, lastMouseX, lastMouseY]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging.current) {
        const deltaX = e.clientX - lastMouseX.current;
        const deltaY = e.clientY - lastMouseY.current;
        const newPanX = panX + deltaX;

        const timelineWidth = (5000 - (-5000)) * currentPixelsPerYear;
        const viewportWidth = window.innerWidth;
        const minPanX = -(timelineWidth - viewportWidth);
        const maxPanX = 0;
        setPanX(Math.max(minPanX, Math.min(maxPanX, newPanX)));
        setPanY((prev) => prev + deltaY);
        lastMouseX.current = e.clientX;
        lastMouseY.current = e.clientY;
    }

    if (isCardDragging.current && draggingCardId !== null) {
      const deltaY = e.clientY - lastMouseY.current;
      setCardPositions(prev => ({
          ...prev,
          [draggingCardId]: {
              ...(prev[draggingCardId] || { x: 20, y: 200 }),
              y: Math.max(80, Math.min(window.innerHeight - 100, (prev[draggingCardId]?.y || 200) + deltaY))
          }
      }));
      lastMouseY.current = e.clientY;
    }
  }, [panX, currentPixelsPerYear, isDragging, lastMouseX, lastMouseY, isCardDragging, draggingCardId]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    isCardDragging.current = false;
    setDraggingCardId(null);
  }, [isDragging, isCardDragging]);

  const handleCardDragStart = useCallback((id, e) => {
      e.stopPropagation();
      isCardDragging.current = true;
      setDraggingCardId(id);
      lastMouseY.current = e.clientY;
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
    scale, panX, panY, events, allTags, searchTerm, highlightedEvents,
    isHelpOpen, isModalOpen, modalPosition, editingEvent, newEvent, currentPixelsPerYear,
    draggingCardId,
    cardPositions,
    Timelines,

    // 関数
    setIsHelpOpen, resetToInitialPosition, handleSearchChange, handleDoubleClick,
    saveEvent, closeModal, addManualTag, removeManualTag, getAllCurrentTags,
    createTimeline, adjustEventPositions, getTopTagsFromSearch, truncateTitle,
    handleWheel, handleMouseDown, handleMouseMove, handleMouseUp,
    handleEventChange,
    handleCardDragStart,
    deleteTimeline,
    getTimelineEventsForDisplay,
    getTimelineAxesForDisplay,
  };
};