// src/hooks/useFileOperations.js
import { useCallback, useState, useRef, useEffect } from 'react';
import { useTimelineStore } from '../store/useTimelineStore';
import { useSupabaseSync } from './useSupabaseSync';
import { useAuth } from './useAuth';

export const useFileOperations = () => {
  // アクション関数は参照が安定しているため、直接取得します
  const setEvents = useTimelineStore(state => state.setEvents);
  const setTimelines = useTimelineStore(state => state.setTimelines);

  const { user, isAuthenticated } = useAuth();
  
  // useSupabaseSyncはuserに依存するため、返り値の参照が不安定になる可能性があります。
  // これをuseRefに格納することで、このフックが返す関数の安定性を確保します。
  const supabaseSync = useSupabaseSync(user);
  const supabaseSyncRef = useRef(supabaseSync);
  useEffect(() => {
    supabaseSyncRef.current = supabaseSync;
  }, [supabaseSync]);

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveTimeline = useCallback(async (title = `年表 ${new Date().toLocaleDateString("ja-JP")}`) => {
    if (!isAuthenticated || isSaving) return;
    setIsSaving(true);
    try {
      const { events, timelines } = useTimelineStore.getState();
      const timelineData = { events, timelines, version: "1.0", savedAt: new Date().toISOString() };
      const result = await supabaseSyncRef.current.saveTimelineData(timelineData, title);
      if (result) {
        alert("ファイルを保存しました");
      } else {
        alert("保存に失敗しました");
      }
    } finally {
      setIsSaving(false);
    }
  }, [isAuthenticated, isSaving]); // 依存配列内の値は安定的です

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
    const { events, timelines } = useTimelineStore.getState();
    const timelineData = { events, timelines, version: "1.0", exportedAt: new Date().toISOString() };
    const dataStr = JSON.stringify(timelineData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `timeline_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

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

  // ref経由で呼び出すことで、これらの関数自体の参照を安定させます
  const getUserTimelines = useCallback(async () => {
    return supabaseSyncRef.current.getUserTimelines();
  }, []);

  const deleteTimelineFile = useCallback(async (timelineId) => {
    return supabaseSyncRef.current.deleteTimelineFile(timelineId);
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
