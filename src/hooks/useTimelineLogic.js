import { useCallback } from 'react';
import { useTimelineState } from './useTimelineState';
import { useTimelineCoordinates } from './useTimelineCoordinates';
import { useTimelineSearch } from './useTimelineSearch';
import { useEventLayout } from './useEventLayout';
import { useTimelineUI } from './useTimelineUI';
import { truncateTitle } from '../utils/timelineUtils';
import { TIMELINE_CONFIG } from '../constants/timelineConfig';

export const useTimelineLogic = (timelineRef) => {
  console.log('🚀 useTimelineLogic 統合版初期化');

  // 責任分離されたhooks
  const dataState = useTimelineState();
  const coordinates = useTimelineCoordinates();
  const search = useTimelineSearch(dataState.events);
  const ui = useTimelineUI();

  // テキスト幅計算（共通ユーティリティ）
  const calculateTextWidth = useCallback((text, fontSize = 11) => {
    try {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      context.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      return context.measureText(text || '').width;
    } catch (error) {
      console.warn('calculateTextWidth エラー:', error);
      return (text?.length || 0) * 8;
    }
  }, []);

  // レイアウト計算（calculateTextWidthが必要なのでここで実行）
  const layout = useEventLayout(
    dataState.events, 
    dataState.timelines, 
    coordinates.getXFromYear,
    calculateTextWidth
  );

  // 年表作成（複数hooksの協調が必要）
  const createTimelineFromSearch = useCallback(() => {
    const highlightedEventsList = dataState.events.filter(event => 
      search.highlightedEvents.has(event.id)
    );
    
    if (highlightedEventsList.length === 0) {
      alert("検索でイベントを選択してから年表を作成してください");
      return null;
    }

    const topTags = search.getTopTagsFromSearch(highlightedEventsList);
    const timelineName = topTags.length > 0 ? topTags[0] : "新しい年表";

    const timeline = dataState.createTimeline({
      name: timelineName,
      events: highlightedEventsList,
      tags: topTags
    });

    search.setHighlightedEvents(new Set()); // 選択をクリア
    console.log(`📋 年表作成完了: ${timelineName}`);
    return timeline;
  }, [dataState.events, dataState.createTimeline, search.highlightedEvents, search.getTopTagsFromSearch, search.setHighlightedEvents]);

  // 年表軸情報の計算
  const getTimelineAxesForDisplay = useCallback(() => {
    return (dataState.timelines || [])
      .filter(timeline => timeline.isVisible && 
        ((timeline.events?.length || 0) > 0 || (timeline.temporaryEvents?.length || 0) > 0))
      .map((timeline, index) => {
        const timelineY = TIMELINE_CONFIG.FIRST_ROW_Y + index * TIMELINE_CONFIG.ROW_HEIGHT;
        
        const allEvents = [...(timeline.events || []), ...(timeline.temporaryEvents || [])];
        const years = allEvents
          .filter(e => e.startDate)
          .map(e => e.startDate.getFullYear());
        
        if (years.length === 0) return null;
        
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        const startX = coordinates.getXFromYear(minYear);
        const endX = coordinates.getXFromYear(maxYear);
        
        return {
          id: timeline.id,
          name: timeline.name,
          color: timeline.color,
          yPosition: timelineY,
          startX: Math.max(0, startX),
          endX: Math.min(window.innerWidth, endX),
          cardX: Math.max(50, startX - 20),
          eventCount: allEvents.length
        };
      })
      .filter(Boolean);
  }, [dataState.timelines, coordinates.getXFromYear]);

  // 統合されたAPIを提供（既存の名前を維持）
  return {
    // === データ系 ===
    events: dataState.events,
    setEvents: dataState.setEvents,
    timelines: dataState.timelines,
    Timelines: dataState.timelines, // 既存コード互換性
    setCreatedTimelines: dataState.setTimelines,
    allTags: dataState.allTags,
    setAllTags: dataState.setAllTags,

    // === 座標系 ===
    scale: coordinates.scale,
    setScale: coordinates.setScale,
    panX: coordinates.panX,
    setPanX: coordinates.setPanX,
    panY: coordinates.panY,
    setPanY: coordinates.setPanY,
    currentPixelsPerYear: coordinates.currentPixelsPerYear,
    resetToInitialPosition: coordinates.resetToInitialPosition,

    // === 検索系 ===
    searchTerm: search.searchTerm,
    setSearchTerm: search.setSearchTerm,
    highlightedEvents: search.highlightedEvents,
    setHighlightedEvents: search.setHighlightedEvents,
    handleSearchChange: search.handleSearchChange,
    getTopTagsFromSearch: search.getTopTagsFromSearch,

    // === レイアウト系 ===
    layoutEvents: layout.layoutEvents,
    // 既存コード互換性のため
    advancedEventPositions: {
      allEvents: layout.layoutEvents || [],
      eventGroups: []
    },

    // === UI系 ===
    isModalOpen: ui.isModalOpen,
    setIsModalOpen: ui.setIsModalOpen,
    modalPosition: ui.modalPosition,
    setModalPosition: ui.setModalPosition,
    editingEvent: ui.editingEvent,
    setEditingEvent: ui.setEditingEvent,
    newEvent: ui.newEvent,
    setNewEvent: ui.setNewEvent,
    timelineModalOpen: ui.timelineModalOpen,
    selectedTimelineForModal: ui.selectedTimelineForModal,
    isHelpOpen: ui.isHelpOpen,
    setIsHelpOpen: ui.setIsHelpOpen,

    // === 操作系 ===
    addEvent: dataState.addEvent,
    updateEvent: dataState.updateEvent,
    deleteEvent: dataState.deleteEvent,
    createTimeline: createTimelineFromSearch,
    deleteTimeline: dataState.deleteTimeline,
    openNewEventModal: ui.openNewEventModal,
    closeModal: ui.closeModal,
    openTimelineModal: ui.openTimelineModal,
    closeTimelineModal: ui.closeTimelineModal,
    getTimelineAxesForDisplay,

    // === ユーティリティ ===
    calculateTextWidth,
    truncateTitle,

    // === 後方互換性（既存コードが期待する値） ===
    cardPositions: {},
    expandedGroups: new Set(),
    hoveredGroup: null,
    setHoveredGroup: () => {},
    groupManager: { 
      toggleGroup: () => {}, 
      isExpanded: () => false,
      expandedGroups: new Set()
    },
    toggleEventGroup: () => {},
    handleGroupHover: () => {},
    moveEvent: () => {},
    moveTimeline: () => {},
    addEventToTimeline: () => {},
    removeEventFromTimeline: () => {},
    timelinePositions: new Map(),
    eventPositions: new Map(),
    
    // イベント処理（既存コード互換性）
    handleDoubleClick: () => {
      console.log('📝 ダブルクリック処理');
      ui.openNewEventModal();
    },
    saveEvent: () => {
      console.log('💾 イベント保存処理');
    },
    addManualTag: () => {},
    removeManualTag: () => {},
    getAllCurrentTags: () => [],
    handleEventChange: () => {},
    handleWheel: () => {},
    handleMouseDown: () => {},
    handleMouseMove: () => {},
    handleMouseUp: () => {}
  };
};