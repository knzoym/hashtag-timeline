// src/hooks/useFileOperations.js
import { useCallback, useState } from 'react';
import { useTimelineStore } from '../store/useTimelineStore';
import { useSupabaseSync } from './useSupabaseSync';
import { useAuth } from './useAuth';

export const useFileOperations = () => {
  const { events, timelines, setEvents, setTimelines } = useTimelineStore.getState();
  const { user, isAuthenticated } = useAuth();
  const { saveTimelineData, getUserTimelines, deleteTimelineFile } = useSupabaseSync(user);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveTimeline = useCallback(async (title = `年表 ${new Date().toLocaleDateString("ja-JP")}`) => {
    if (!isAuthenticated || isSaving) return;
    setIsSaving(true);
    try {
      const timelineData = { events, timelines, version: "1.0", savedAt: new Date().toISOString() };
      const result = await saveTimelineData(timelineData, title);
      if (result) alert("ファイルを保存しました");
      else alert("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  }, [isAuthenticated, isSaving, events, timelines, saveTimelineData]);

  const handleLoadTimeline = useCallback((timelineData) => {
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
  }, [setEvents, setTimelines]);

  const handleExportJSON = useCallback(() => {
    const timelineData = { events, timelines, version: "1.0", exportedAt: new Date().toISOString() };
    const dataStr = JSON.stringify(timelineData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `timeline_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [events, timelines]);

  const handleImportJSON = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            handleLoadTimeline(data);
            alert('JSONファイルを読み込みました');
          } catch (error) {
            alert('ファイルの読み込みに失敗しました');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [handleLoadTimeline]);

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
