// src/hooks/useFileOperations.js
import { useCallback, useState } from 'react';
import { useTimelineStore } from '../store/useTimelineStore';

export const useFileOperations = () => {
  const [isSaving, setIsSaving] = useState(false);

  // JSONエクスポート（ローカルファイル）
  const handleExportJSON = useCallback(() => {
    try {
      const { events, timelines } = useTimelineStore.getState();
      const timelineData = { 
        events, 
        timelines, 
        version: "1.0", 
        exportedAt: new Date().toISOString() 
      };
      
      const dataStr = JSON.stringify(timelineData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `timeline_${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('エクスポートに失敗しました');
    }
  }, []);

  // JSONインポート（ローカルファイル）
  const handleImportJSON = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            handleLoadTimeline(data);
            alert('JSONファイルを読み込みました');
          } catch (error) {
            console.error('Import error:', error);
            alert('ファイルの読み込みに失敗しました');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, []);

  // タイムラインデータの読み込み
  const handleLoadTimeline = useCallback((timelineData) => {
    try {
      const { setEvents, setTimelines } = useTimelineStore.getState();
      
      const parseDates = (event) => ({
        ...event,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
      });

      if (timelineData.events) {
        setEvents(timelineData.events.map(parseDates));
      }
      
      if (timelineData.timelines) {
        setTimelines(timelineData.timelines.map(timeline => ({
          ...timeline,
          events: (timeline.events || []).map(parseDates),
          temporaryEvents: (timeline.temporaryEvents || []).map(parseDates),
          removedEvents: (timeline.removedEvents || []).map(parseDates),
        })));
      }
    } catch (error) {
      console.error('Load timeline error:', error);
      alert('データの読み込みに失敗しました');
    }
  }, []);

  // クラウド保存（一時的に無効化）
  const handleSaveTimeline = useCallback(async (title) => {
    console.log('Cloud save temporarily disabled');
    alert('クラウド保存は一時的に無効化されています。JSONエクスポートをご利用ください。');
  }, []);

  // ユーザータイムライン取得（一時的に無効化）
  const getUserTimelines = useCallback(async () => {
    console.log('Cloud timelines temporarily disabled');
    return [];
  }, []);

  // タイムライン削除（一時的に無効化）
  const deleteTimelineFile = useCallback(async (timelineId) => {
    console.log('Cloud delete temporarily disabled');
    return { ok: false, message: 'クラウド削除は一時的に無効化されています' };
  }, []);

  return {
    isSaving,
    handleSaveTimeline,
    handleLoadTimeline,
    handleExportJSON,
    handleImportJSON,
    getUserTimelines,
    deleteTimelineFile
  };
};