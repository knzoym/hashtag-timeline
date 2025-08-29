// src/utils/timelineUpdateSystem.js - 年表動的更新システム

// src/utils/timelineUpdateSystem.js - グループ化閾値調整版

/**
 * グループ化判定 - イベント間の距離で重複判定
 */
export const shouldGroupEvents = (event1X, event1Width, event2X, event2Width, threshold = 80) => {
  const event1Left = event1X - event1Width / 2;
  const event1Right = event1X + event1Width / 2;
  const event2Left = event2X - event2Width / 2;  
  const event2Right = event2X + event2Width / 2;
  
  // 重複判定（マージン込み）
  const overlap = !(event1Right + 10 < event2Left || event2Right + 10 < event1Left);
  const distance = Math.abs(event1X - event2X);
  
  return overlap || distance < threshold;
};
export const checkTagCondition = (event, timeline) => {
  if (!timeline.tags || timeline.tags.length === 0) {
    return false; // タグ条件なしの年表は対象外
  }

  const eventTags = event.tags || [];
  const timelineTags = timeline.tags || [];
  const tagMode = timeline.tagMode || 'AND';

  if (tagMode === 'AND') {
    // すべてのタグが含まれている必要がある
    return timelineTags.every(tag => eventTags.includes(tag));
  } else if (tagMode === 'OR') {
    // いずれかのタグが含まれていればOK
    return timelineTags.some(tag => eventTags.includes(tag));
  }

  return false;
};

/**
 * 年表の自動更新チェック - イベント変更時に呼び出される
 */
export const checkTimelineAutoUpdate = (updatedEvent, allTimelines, oldEvent = null) => {
  const updates = [];

  console.log('年表自動更新チェック開始:', updatedEvent.title);

  allTimelines.forEach(timeline => {
    // 手動作成年表のみ対象（検索結果からの自動作成年表は除外）
    if (timeline.createdFrom === 'search_result' || timeline.type === 'temporary') {
      return;
    }

    const eventId = updatedEvent.id;
    const currentStatus = getEventTimelineStatus(updatedEvent, timeline);
    
    // 現在のタグ条件マッチ状況
    const newMatches = checkTagCondition(updatedEvent, timeline);
    const oldMatches = oldEvent ? checkTagCondition(oldEvent, timeline) : false;

    console.log(`年表「${timeline.name}」チェック:`, {
      newMatches,
      oldMatches,
      currentStatus,
      eventTags: updatedEvent.tags,
      timelineTags: timeline.tags
    });

    // タグ条件に新たにマッチした場合
    if (newMatches && !oldMatches && currentStatus === 'none') {
      updates.push({
        type: 'add_pending',
        timelineId: timeline.id,
        eventId,
        reason: `タグ条件「${timeline.tags.join(', ')}」にマッチ`
      });
    }
    // タグ条件から外れた場合
    else if (!newMatches && oldMatches && (currentStatus === 'registered' || currentStatus === 'pending')) {
      updates.push({
        type: 'add_removed',
        timelineId: timeline.id,
        eventId,
        reason: `タグ条件「${timeline.tags.join(', ')}」から外れた`
      });
    }
  });

  console.log('年表自動更新チェック結果:', updates);
  return updates;
};

/**
 * 年表状態判定ヘルパー
 */
const getEventTimelineStatus = (event, timeline) => {
  if (!timeline || !event) return "none";
  if (timeline.eventIds?.includes(event.id)) return "registered";
  if (timeline.pendingEventIds?.includes(event.id)) return "pending";
  if (timeline.removedEventIds?.includes(event.id)) return "removed";
  return "none";
};

/**
 * 年表の一括更新実行
 */
export const executeTimelineUpdates = (updates, timelines, setTimelines) => {
  if (updates.length === 0) return [];

  const updatedTimelines = [];

  updates.forEach(update => {
    const timeline = timelines.find(t => t.id === update.timelineId);
    if (!timeline) return;

    const updatedTimeline = {
      ...timeline,
      eventIds: [...(timeline.eventIds || [])],
      pendingEventIds: [...(timeline.pendingEventIds || [])],
      removedEventIds: [...(timeline.removedEventIds || [])]
    };

    // 既存の関係をクリア
    updatedTimeline.eventIds = updatedTimeline.eventIds.filter(id => id !== update.eventId);
    updatedTimeline.pendingEventIds = updatedTimeline.pendingEventIds.filter(id => id !== update.eventId);
    updatedTimeline.removedEventIds = updatedTimeline.removedEventIds.filter(id => id !== update.eventId);

    // 新しい状態を適用
    switch (update.type) {
      case 'add_pending':
        updatedTimeline.pendingEventIds.push(update.eventId);
        break;
      case 'add_registered':
        updatedTimeline.eventIds.push(update.eventId);
        break;
      case 'add_removed':
        updatedTimeline.removedEventIds.push(update.eventId);
        break;
      default:
        console.warn('不明な更新タイプ:', update.type);
    }

    // 統計情報更新
    updatedTimeline.eventCount = updatedTimeline.eventIds.length;
    updatedTimeline.pendingCount = updatedTimeline.pendingEventIds.length;
    updatedTimeline.removedCount = updatedTimeline.removedEventIds.length;
    updatedTimeline.updatedAt = new Date().toISOString();

    updatedTimelines.push(updatedTimeline);

    console.log(`年表「${timeline.name}」自動更新:`, update.reason, {
      eventCount: updatedTimeline.eventCount,
      pendingCount: updatedTimeline.pendingCount,
      removedCount: updatedTimeline.removedCount
    });
  });

  // 年表データを一括更新
  setTimelines(prev => {
    const updated = [...prev];
    updatedTimelines.forEach(updatedTimeline => {
      const index = updated.findIndex(t => t.id === updatedTimeline.id);
      if (index >= 0) {
        updated[index] = updatedTimeline;
      }
    });
    return updated;
  });

  return updatedTimelines;
};

/**
 * 全年表の手動更新実行 - 更新ボタン用
 */
export const executeFullTimelineUpdate = (allEvents, allTimelines, setTimelines) => {
  console.log('全年表手動更新開始:', allTimelines.length, '個の年表');
  
  const allUpdates = [];
  
  // 各イベントに対して全年表をチェック
  allEvents.forEach(event => {
    const updates = checkTimelineAutoUpdate(event, allTimelines);
    allUpdates.push(...updates);
  });
  
  console.log('手動更新対象:', allUpdates.length, '件');
  
  // 一括実行
  const updatedTimelines = executeTimelineUpdates(allUpdates, allTimelines, setTimelines);
  
  return {
    updatedCount: updatedTimelines.length,
    updateDetails: allUpdates
  };
};

/**
 * イベント変更時の自動更新フック
 */
export const useTimelineAutoUpdate = (timelines, setTimelines) => {
  return (updatedEvent, oldEvent = null) => {
    const updates = checkTimelineAutoUpdate(updatedEvent, timelines, oldEvent);
    if (updates.length > 0) {
      executeTimelineUpdates(updates, timelines, setTimelines);
      return updates;
    }
    return [];
  };
};