// hooks/useTimelineLogic.js の改善版
import { useState, useCallback, useEffect, useMemo } from "react";
import { TIMELINE_CONFIG } from "../constants/timelineConfig";
import { sampleEvents, initialTags } from "../utils/eventUtils";
import {
  extractTagsFromDescription,
  truncateTitle,
  getYearFromX,
  getXFromYear,
} from "../utils/timelineUtils";
import { GroupExpansionManager } from "../utils/advancedLayoutUtils";
import { layoutWithGroups } from "../utils/layoutWithGroups";

export const useTimelineLogic = (
  timelineRef,
  isDragging,
  lastMouseX,
  lastMouseY
) => {
  const calculateInitialPanX = () => {
    const initialPixelsPerYear =
      TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * TIMELINE_CONFIG.DEFAULT_SCALE;
    const targetX = (2080 - -5000) * initialPixelsPerYear;
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

  // 浮遊年表管理状態
  const [Timelines, setCreatedTimelines] = useState([]);
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

  // グループ管理状態
  const [groupManager] = useState(() => new GroupExpansionManager());
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [hoveredGroup, setHoveredGroup] = useState(null);

  // ドラッグ&ドロップ状態
  const [eventPositions, setEventPositions] = useState(new Map());
  const [timelinePositions, setTimelinePositions] = useState(new Map());
  
  // 年表モーダル状態
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [selectedTimelineForModal, setSelectedTimelineForModal] = useState(null);

  // 計算値
  const currentPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * scale;

  // テキスト幅を計算する関数
  const calculateTextWidth = useCallback((text, fontSize = 11) => {
    // 簡易的な文字幅計算（実際のブラウザレンダリングとほぼ同じ）
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    return context.measureText(text).width;
  }, []);

  // 改善された配置ロジック
  const advancedEventPositions = useMemo(() => {
    // 年表に含まれるイベントIDを収集
    const timelineEventIds = new Set();
    const temporaryEventIds = new Set(); // 仮登録されたイベント
    const eventTimelineMap = new Map(); // イベントID → 年表情報のマッピング
    
    Timelines.forEach(timeline => {
      // 元々の検索結果イベント
      timeline.events.forEach(event => {
        timelineEventIds.add(event.id);
        eventTimelineMap.set(event.id, {
          timelineId: timeline.id,
          timelineName: timeline.name,
          timelineColor: timeline.color,
          isTemporary: false
        });
      });
      
      // 仮登録されたイベント
      const temporaryEvents = timeline.temporaryEvents || [];
      temporaryEvents.forEach(event => {
        temporaryEventIds.add(event.id);
        eventTimelineMap.set(event.id, {
          timelineId: timeline.id,
          timelineName: timeline.name,
          timelineColor: timeline.color,
          isTemporary: true
        });
      });
    });

    // 年表の占有領域を記録（メインタイムラインとの干渉を避けるため）
    const timelineOccupiedRegions = [];

    // 年表内イベントレイアウト（先に処理して占有領域を確定）
    const processedTimelineEvents = [];
    const allEventGroups = [];

    // 年表内イベントレイアウト（先に処理して占有領域を確定）
    const allTimelineEvents = [];

    Timelines.forEach((timeline, timelineIndex) => {
      if (!timeline.isVisible) return;

      // 元々のイベントと仮登録イベントを統合
      const originalEvents = timeline.events || [];
      const temporaryEvents = timeline.temporaryEvents || [];
      const allTimelineEventsForThisTimeline = [...originalEvents, ...temporaryEvents];

      if (allTimelineEventsForThisTimeline.length === 0) return;

      const LANE_HEIGHT = 36;
      const baseY = TIMELINE_CONFIG.FIRST_ROW_Y + timelineIndex * TIMELINE_CONFIG.ROW_HEIGHT;
      const axisY = baseY + LANE_HEIGHT; // 2段目（index=1）が軸線
      
      const getEventX = (evId) => {
        const ev = allTimelineEventsForThisTimeline.find(e => e.id === evId);
        if (!ev) return 0;
        return getXFromYear(ev.startDate.getFullYear(), currentPixelsPerYear, panX);
      };

      const laneTop = (lane) => {
        // 軸線を中心とした配置
        if (lane === 0) return axisY - LANE_HEIGHT; // 1段目：軸線の上
        if (lane === 1) return axisY; // 2段目：軸線上
        if (lane === 2) return axisY + LANE_HEIGHT; // 3段目：軸線の下
        return axisY + lane * LANE_HEIGHT;
      };

      // 改善されたlayoutWithGroupsを使用
      const result = layoutWithGroups({
        events: allTimelineEventsForThisTimeline, // 仮登録イベントも含める
        getEventX,
        laneTop,
        laneHeight: LANE_HEIGHT,
        minWidthPx: 60,
        groupPaddingPx: 8,
        calculateTextWidth, // テキスト幅計算関数を渡す
      });

      // 各イベントに年表の色を設定し、占有領域を記録
      const eventsWithColor = result.allEvents.map(event => {
        // 仮登録かどうかを判定
        const isTemporary = temporaryEvents.some(temp => temp.id === event.id);
        
        const eventWithColor = {
          ...event,
          timelineColor: timeline.color,
          timelineId: timeline.id,
          timelineName: timeline.name,
          isTemporary: isTemporary
        };

        // 占有領域を記録（メインタイムラインとの干渉回避用）
        if (!event.hiddenByGroup) {
          const textWidth = calculateTextWidth(truncateTitle(event.title));
          const eventWidth = Math.max(60, textWidth + 16); // padding考慮
          timelineOccupiedRegions.push({
            x1: event.adjustedPosition.x - eventWidth / 2,
            x2: event.adjustedPosition.x + eventWidth / 2,
            y1: event.adjustedPosition.y - 10,
            y2: event.adjustedPosition.y + 50, // イベント高さ + マージン
          });
        }

        return eventWithColor;
      });

      processedTimelineEvents.push(...eventsWithColor);
      allEventGroups.push(...result.eventGroups);
    });

    // メインタイムラインのイベント（改善された干渉回避）
    const mainTimelineEvents = events.filter(event => 
      !timelineEventIds.has(event.id) && !temporaryEventIds.has(event.id)
    );
    const mainEvents = [];
    const occupiedPositions = new Map();

    // 年表との干渉をチェックする関数
    const checkTimelineCollision = (x, y, width) => {
      const eventRegion = {
        x1: x - width / 2,
        x2: x + width / 2,
        y1: y - 10,
        y2: y + 50,
      };

      return timelineOccupiedRegions.some(region => 
        eventRegion.x1 < region.x2 && 
        eventRegion.x2 > region.x1 && 
        eventRegion.y1 < region.y2 && 
        eventRegion.y2 > region.y1
      );
    };

    // メインタイムラインのイベント処理
    mainTimelineEvents.forEach(event => {
      const eventX = getXFromYear(event.startDate.getFullYear(), currentPixelsPerYear, panX);
      const textWidth = calculateTextWidth(truncateTitle(event.title));
      const eventWidth = Math.max(60, textWidth + 16);
      let eventY = TIMELINE_CONFIG.MAIN_TIMELINE_Y;
      let level = 0;

      // 重なりを避けるためのY位置調整（年表との干渉も考慮）
      while (level < 30) {
        const currentY = TIMELINE_CONFIG.MAIN_TIMELINE_Y + level * (TIMELINE_CONFIG.EVENT_HEIGHT + 10);
        const occupied = occupiedPositions.get(currentY) || [];
        
        // 他のメインイベントとの重なりチェック
        const hasMainCollision = occupied.some(range => 
          Math.abs(eventX - range.x) < (eventWidth + range.width) / 2 + 10
        );

        // 年表との重なりチェック
        const hasTimelineCollision = checkTimelineCollision(eventX, currentY, eventWidth);

        if (!hasMainCollision && !hasTimelineCollision) {
          eventY = currentY;
          // 占有位置を記録
          if (!occupiedPositions.has(currentY)) {
            occupiedPositions.set(currentY, []);
          }
          occupiedPositions.get(currentY).push({ x: eventX, width: eventWidth });
          break;
        }
        level++;
      }

      mainEvents.push({
        ...event,
        adjustedPosition: { x: eventX, y: eventY },
        hiddenByGroup: false,
        isGroup: false,
        timelineColor: null,
        calculatedWidth: eventWidth
      });
    });

    // 仮登録されたイベントをメインタイムラインに追加
    const temporaryEvents = [];
    temporaryEventIds.forEach(eventId => {
      const event = events.find(e => e.id === eventId);
      if (event) {
        const timelineInfo = eventTimelineMap.get(eventId);
        const eventX = getXFromYear(event.startDate.getFullYear(), currentPixelsPerYear, panX);
        const textWidth = calculateTextWidth(truncateTitle(event.title));
        const eventWidth = Math.max(60, textWidth + 16);
        let eventY = TIMELINE_CONFIG.MAIN_TIMELINE_Y;
        let level = 0;

        // 他のイベントとの重なりを避ける
        while (level < 30) {
          const currentY = TIMELINE_CONFIG.MAIN_TIMELINE_Y + level * (TIMELINE_CONFIG.EVENT_HEIGHT + 10);
          const occupied = occupiedPositions.get(currentY) || [];
          
          const hasCollision = occupied.some(range => 
            Math.abs(eventX - range.x) < (eventWidth + range.width) / 2 + 10
          );

          if (!hasCollision) {
            eventY = currentY;
            if (!occupiedPositions.has(currentY)) {
              occupiedPositions.set(currentY, []);
            }
            occupiedPositions.get(currentY).push({ x: eventX, width: eventWidth });
            break;
          }
          level++;
        }

        temporaryEvents.push({
          ...event,
          adjustedPosition: { x: eventX, y: eventY },
          hiddenByGroup: false,
          isGroup: false,
          timelineColor: timelineInfo.timelineColor,
          timelineId: timelineInfo.timelineId,
          timelineName: timelineInfo.timelineName,
          isTemporary: true,
          calculatedWidth: eventWidth
        });
      }
    });

    return {
      allEvents: [...mainEvents, ...temporaryEvents, ...allTimelineEvents],
      eventGroups: allEventGroups
    };
  }, [events, currentPixelsPerYear, panX, Timelines, calculateTextWidth]);

  // イベント更新（テーブルビュー用）
  const updateEvent = useCallback((updatedEvent) => {
    setEvents(prevEvents => 
      prevEvents.map(event => 
        event.id === updatedEvent.id ? updatedEvent : event
      )
    );

    // タグリストも更新
    const newTags = [...new Set([
      ...allTags,
      ...updatedEvent.tags.filter(tag => !allTags.includes(tag))
    ])];
    setAllTags(newTags);
  }, [allTags]);

  // イベント削除（テーブルビュー用）
  const deleteEvent = useCallback((eventId) => {
    setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
    
    // 年表からも削除
    setCreatedTimelines(prevTimelines => 
      prevTimelines.map(timeline => ({
        ...timeline,
        events: timeline.events.filter(event => event.id !== eventId)
      }))
    );
  }, []);

  // ドラッグ&ドロップ関連の関数
  const moveEvent = useCallback((eventId, newY, conflictingEvents) => {
    // 位置を固定せず、レイアウトシステムに任せる
    // ドラッグによる移動は一時的なもので、ズーム時に再レイアウトされる
    console.log(`イベント ${eventId} を移動: Y=${newY}, 衝突イベント数: ${conflictingEvents.length}`);
    // 実際の位置固定は行わず、レイアウトシステムが処理する
  }, []);

  const moveTimeline = useCallback((timelineId, newY) => {
    setTimelinePositions(prev => {
      const newPositions = new Map(prev);
      newPositions.set(timelineId, { y: newY });
      return newPositions;
    });
  }, []);

  const addEventToTimeline = useCallback((event, timelineId) => {
    setCreatedTimelines(prevTimelines => 
      prevTimelines.map(timeline => {
        if (timeline.id === timelineId) {
          const temporaryEvents = timeline.temporaryEvents || [];
          const removedEvents = timeline.removedEvents || [];
          
          // 仮削除リストから削除（復元の場合）
          const newRemovedEvents = removedEvents.filter(removed => removed.id !== event.id);
          
          // 既に仮登録されているかチェック
          const alreadyTemporary = temporaryEvents.some(temp => temp.id === event.id);
          const alreadyOriginal = timeline.events.some(orig => orig.id === event.id);
          
          if (!alreadyTemporary && !alreadyOriginal) {
            console.log(`イベント「${event.title}」を年表「${timeline.name}」に仮登録`);
            return {
              ...timeline,
              temporaryEvents: [...temporaryEvents, event],
              removedEvents: newRemovedEvents
            };
          } else {
            return {
              ...timeline,
              removedEvents: newRemovedEvents
            };
          }
        }
        return timeline;
      })
    );
  }, []);

  const removeEventFromTimeline = useCallback((timelineId, eventId) => {
    setCreatedTimelines(prevTimelines => 
      prevTimelines.map(timeline => {
        if (timeline.id === timelineId) {
          const temporaryEvents = timeline.temporaryEvents || [];
          const removedEvents = timeline.removedEvents || [];
          
          // 仮登録リストから削除
          const newTemporaryEvents = temporaryEvents.filter(temp => temp.id !== eventId);
          
          // 元々のイベントの場合は仮削除リストに追加
          const originalEvent = timeline.events.find(event => event.id === eventId);
          const newRemovedEvents = originalEvent 
            ? [...removedEvents, originalEvent]
            : removedEvents;
          
          return {
            ...timeline,
            temporaryEvents: newTemporaryEvents,
            removedEvents: newRemovedEvents
          };
        }
        return timeline;
      })
    );
  }, []);

  // 年表モーダル関連
  const openTimelineModal = useCallback((timeline) => {
    setSelectedTimelineForModal(timeline);
    setTimelineModalOpen(true);
  }, []);

  const closeTimelineModal = useCallback(() => {
    setTimelineModalOpen(false);
    setSelectedTimelineForModal(null);
  }, []);

  // 初期位置に戻す
  const resetToInitialPosition = useCallback(() => {
    setScale(TIMELINE_CONFIG.DEFAULT_SCALE);
    setPanX(calculateInitialPanX());
    setPanY(0);
    groupManager.closeAllGroups();
    setExpandedGroups(new Set());
  }, [groupManager]);

  // 検索機能
  const handleSearchChange = useCallback(
    (e) => {
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
    },
    [events]
  );

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

  // グループのトグル処理
  const toggleEventGroup = useCallback(
    (groupId, position) => {
      groupManager.toggleGroup(groupId);

      if (groupManager.isExpanded(groupId)) {
        groupManager.setGroupCard(groupId, {
          position: position,
          timestamp: Date.now(),
        });
      }

      setExpandedGroups(new Set(groupManager.expandedGroups));
    },
    [groupManager]
  );

  // グループホバー処理
  const handleGroupHover = useCallback((groupId, eventGroup) => {
    setHoveredGroup(groupId ? { id: groupId, data: eventGroup } : null);
  }, []);

  // ダブルクリック処理（グループ対応）
  const handleDoubleClick = useCallback(
    (e) => {
      if (
        e.target.closest(".floating-panel") ||
        e.target.closest(".timeline-card")
      ) {
        return;
      }

      const eventElement = e.target.closest("[data-event-id]");
      if (eventElement) {
        const eventId = parseInt(eventElement.dataset.eventId);
        const isGroup = eventElement.dataset.isGroup === "true";

        if (isGroup) {
          const groupId = eventElement.dataset.groupId;
          const rect = eventElement.getBoundingClientRect();
          const timelineRect = timelineRef.current?.getBoundingClientRect();

          if (timelineRect) {
            const position = {
              x: rect.left - timelineRect.left,
              y: rect.top - timelineRect.top,
            };
            toggleEventGroup(groupId, position);
          }
          return;
        }

        // 通常のイベント編集
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
    },
    [events, currentPixelsPerYear, panX, timelineRef, toggleEventGroup]
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
      setEvents((prev) =>
        prev.map((e) => (e.id === editingEvent.id ? updatedEvent : e))
      );
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
    setNewEvent({
      title: "",
      description: "",
      date: new Date(),
      manualTags: [],
    });
  }, [newEvent, modalPosition, allTags, editingEvent]);

  // モーダル操作
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

  // タグ操作
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

  const removeManualTag = useCallback((tagToRemove) => {
    setNewEvent((prev) => ({
      ...prev,
      manualTags: prev.manualTags.filter((tag) => tag !== tagToRemove),
    }));
  }, []);

  const getAllCurrentTags = useCallback(() => {
    const extractedTags = extractTagsFromDescription(newEvent.description);
    const titleTag = newEvent.title.trim() ? [newEvent.title.trim()] : [];
    const allCurrentTags = [
      ...titleTag,
      ...extractedTags,
      ...newEvent.manualTags,
    ];
    return [...new Set(allCurrentTags.filter((tag) => tag))];
  }, [newEvent.title, newEvent.description, newEvent.manualTags]);

  // 年表作成
  const createTimeline = useCallback(() => {
    if (highlightedEvents.size === 0) return;

    const filteredEvents = events.filter((event) =>
      highlightedEvents.has(event.id)
    );
    const topTags = getTopTagsFromSearch().slice(0, 3);
    const timelineName =
      searchTerm.trim() || topTags.join("・") || "カスタム年表";

    const newTimeline = {
      id: Date.now(),
      name: timelineName,
      searchTerm: searchTerm,
      tags: topTags,
      events: filteredEvents,
      createdAt: new Date(),
      eventCount: filteredEvents.length,
      isVisible: true,
      color: `hsl(${Math.random() * 360}, 60%, 50%)`,
      rowIndex: Timelines.length,
    };

    setCreatedTimelines((prevTimelines) => {
      const newRowY =
        TIMELINE_CONFIG.FIRST_ROW_Y +
        prevTimelines.length * TIMELINE_CONFIG.ROW_HEIGHT;
      setCardPositions((prevCardPositions) => ({
        ...prevCardPositions,
        [newTimeline.id]: { x: 20, y: newRowY },
      }));
      return [...prevTimelines, newTimeline];
    });

    // グループを閉じる
    groupManager.closeAllGroups();
    setExpandedGroups(new Set());

    // 検索をクリア
    setSearchTerm("");
    setHighlightedEvents(new Set());
  }, [
    highlightedEvents,
    events,
    searchTerm,
    getTopTagsFromSearch,
    Timelines.length,
    groupManager,
  ]);

  // 年表削除
  const deleteTimeline = useCallback(
    (timelineId) => {
      if (window.confirm("この年表を削除しますか？")) {
        setCreatedTimelines((prev) => prev.filter((t) => t.id !== timelineId));
        setCardPositions((prev) => {
          const newPositions = { ...prev };
          delete newPositions[timelineId];
          return newPositions;
        });

        // 関連するグループも閉じる
        groupManager.closeAllGroups();
        setExpandedGroups(new Set());
      }
    },
    [groupManager]
  );

  // 表示中の年表の軸線生成（軸線位置を修正）
  const getTimelineAxesForDisplay = useCallback(() => {
    const visibleTimelines = Timelines.filter((timeline) => timeline.isVisible);

    return visibleTimelines
      .map((timeline, timelineIndex) => {
        const baseY = TIMELINE_CONFIG.FIRST_ROW_Y + timelineIndex * TIMELINE_CONFIG.ROW_HEIGHT;
        
        // ROW_HEIGHTの中央に軸線を配置
        const axisY = baseY + TIMELINE_CONFIG.ROW_HEIGHT / 2;
        const yPosition = axisY + panY;

        if (timeline.events.length === 0) {
          return null;
        }
        const years = timeline.events.map((e) => e.startDate.getFullYear());
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
          maxYear,
        };
      })
      .filter(Boolean);
  }, [Timelines, currentPixelsPerYear, panX, panY]);

  // マウス・ホイールイベント処理
  const handleWheel = useCallback(
    (e) => {
      if (isModalOpen) return;

      e.preventDefault();
      if (!timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const yearAtMouse = getYearFromX(mouseX, currentPixelsPerYear, panX);

      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.25, Math.min(500, scale * zoomFactor));

      const newPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * newScale;
      let newPanX = mouseX - (yearAtMouse - -5000) * newPixelsPerYear;

      const timelineWidth = (5000 - -5000) * newPixelsPerYear;
      const viewportWidth = window.innerWidth;
      const minPanX = -(timelineWidth - viewportWidth);
      const maxPanX = 0;

      newPanX = Math.max(minPanX, Math.min(maxPanX, newPanX));

      setScale(newScale);
      setPanX(newPanX);
    },
    [scale, panX, currentPixelsPerYear, isModalOpen, timelineRef]
  );

  const handleMouseDown = useCallback(
    (e) => {
      if (isModalOpen) return;
      if (
        e.target.closest(".floating-panel") ||
        e.target.closest(".timeline-card")
      )
        return;

      if (isDragging.current !== undefined) {
        isDragging.current = true;
      }
      if (lastMouseX.current !== undefined) {
        lastMouseX.current = e.clientX;
      }
      if (lastMouseY.current !== undefined) {
        lastMouseY.current = e.clientY;
      }
    },
    [isModalOpen, isDragging, lastMouseX, lastMouseY]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (isDragging.current) {
        const deltaX = e.clientX - lastMouseX.current;
        const deltaY = e.clientY - lastMouseY.current;
        const newPanX = panX + deltaX;

        const timelineWidth = (5000 - -5000) * currentPixelsPerYear;
        const viewportWidth = window.innerWidth;
        const minPanX = -(timelineWidth - viewportWidth);
        const maxPanX = 0;
        setPanX(Math.max(minPanX, Math.min(maxPanX, newPanX)));
        setPanY((prev) => prev + deltaY);
        lastMouseX.current = e.clientX;
        lastMouseY.current = e.clientY;
      }
    },
    [panX, currentPixelsPerYear, isDragging, lastMouseX, lastMouseY]
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, [isDragging]);

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

  // イベント追加ボタンからモーダルを開くための関数
  const openNewEventModal = useCallback(() => {
    if (timelineRef.current) {
      const viewportWidth = window.innerWidth;
      const timelineRect = timelineRef.current.getBoundingClientRect();

      const centerX = viewportWidth / 2;
      const centerY = timelineRect.height / 2;

      const year = getYearFromX(centerX, currentPixelsPerYear, panX);
      const newDate = new Date(Math.round(year), 0, 1);

      setEditingEvent(null);
      setNewEvent({
        title: "",
        description: "",
        date: newDate,
        manualTags: [],
      });

      setModalPosition({ x: centerX, y: centerY });
      setIsModalOpen(true);
    }
  }, [timelineRef, currentPixelsPerYear, panX]);

  return {
    // 基本状態
    scale,
    panX,
    panY,
    events,
    allTags,
    searchTerm,
    highlightedEvents,
    isHelpOpen,
    isModalOpen,
    modalPosition,
    editingEvent,
    newEvent,
    currentPixelsPerYear,
    Timelines,
    cardPositions,

    // 高度レイアウト関連
    advancedEventPositions,
    expandedGroups,
    hoveredGroup,
    groupManager,

    // 基本関数
    setIsHelpOpen,
    resetToInitialPosition,
    handleSearchChange,
    handleDoubleClick,
    saveEvent,
    closeModal,
    addManualTag,
    removeManualTag,
    getAllCurrentTags,
    createTimeline,
    getTopTagsFromSearch,
    truncateTitle,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleEventChange,
    openNewEventModal,
    deleteTimeline,
    getTimelineAxesForDisplay,

    // 高度レイアウト関数
    toggleEventGroup,
    handleGroupHover,

    // テーブルビュー用関数
    updateEvent,
    deleteEvent,

    // ユーティリティ関数
    calculateTextWidth,

    setEditingEvent,
    setNewEvent,
    setModalPosition,
    setIsModalOpen,
    setEvents,

    // ドラッグ&ドロップ関連
    eventPositions,
    timelinePositions,
    moveEvent,
    moveTimeline,
    addEventToTimeline,
    removeEventFromTimeline,

    // 年表モーダル関連
    timelineModalOpen,
    selectedTimelineForModal,
    openTimelineModal,
    closeTimelineModal,
  };
};