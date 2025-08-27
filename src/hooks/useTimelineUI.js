// hooks/useTimelineUI.js
import { useState, useCallback } from 'react';

export const useTimelineUI = () => {
  console.log('🎨 useTimelineUI 初期化');

  // モーダル状態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: new Date(),
    manualTags: [],
  });

  // 年表モーダル
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [selectedTimelineForModal, setSelectedTimelineForModal] = useState(null);

  // その他のUI状態
  const [isHelpOpen, setIsHelpOpen] = useState(true);

  // モーダル操作
  const openNewEventModal = useCallback(() => {
    setEditingEvent(null);
    setNewEvent({
      title: "",
      description: "",
      date: new Date(),
      manualTags: [],
    });
    setIsModalOpen(true);
    console.log('📝 新規イベントモーダルを開きました');
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingEvent(null);
    setNewEvent({
      title: "",
      description: "",
      date: new Date(),
      manualTags: [],
    });
    console.log('✖️ モーダルを閉じました');
  }, []);

  const openTimelineModal = useCallback((timeline) => {
    setSelectedTimelineForModal(timeline);
    setTimelineModalOpen(true);
    console.log('📋 年表モーダルを開きました:', timeline?.name);
  }, []);

  const closeTimelineModal = useCallback(() => {
    setTimelineModalOpen(false);
    setSelectedTimelineForModal(null);
    console.log('✖️ 年表モーダルを閉じました');
  }, []);

  return {
    // モーダル状態
    isModalOpen,
    setIsModalOpen,
    modalPosition,
    setModalPosition,
    editingEvent,
    setEditingEvent,
    newEvent,
    setNewEvent,
    
    // 年表モーダル
    timelineModalOpen,
    selectedTimelineForModal,
    
    // その他
    isHelpOpen,
    setIsHelpOpen,
    
    // 操作
    openNewEventModal,
    closeModal,
    openTimelineModal,
    closeTimelineModal
  };
};