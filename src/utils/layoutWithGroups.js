// src/utils/layoutWithGroups.js
export function layoutWithGroups({
  events,
  getEventX,
  laneTop,
  laneHeight,
  minWidthPx = 60,
  groupPaddingPx = 8,
}) {
  // 全イベントをIDで簡単に検索できるようMapに変換
  const allEventsById = new Map(events.filter(Boolean).map(e => [e.id, e]));

  // 各レーンで占有されている矩形領域を管理
  const occ = [[], [], []];

  // 作成されたグループ情報を管理 (id => {id, x1, x2, ..., eventIds: Set})
  const groups = new Map();
  
  // 最終的に出力される全要素（イベント、グループ）の配置情報
  const out = [];

  // `out`配列に追加されたイベントをIDですぐに見つけられるようにするMap
  const outEventMap = new Map();

  // 水平方向の重なりをチェックする関数
  const overlapsX = (a, b) => a.x1 < b.x2 && a.x2 > b.x1;

  // イベントの矩形情報を作成する関数
  const makeRect = (ev, lane) => {
    const w = Math.max(ev.widthPx || minWidthPx, minWidthPx);
    const x1 = getEventX(ev.id);
    const x2 = x1 + w;
    return { type: 'event', id: ev.id, lane, x1, x2, y: laneTop(lane), height: laneHeight };
  };

  // 指定されたレーンで衝突する矩形を探す関数
  const findCollision = (laneRects, rect) => {
    for (const r of laneRects) {
      if (overlapsX(rect, r)) {
        return r;
      }
    }
    return null;
  };

  // 既存のグループに新しいイベントを追加する関数
  const attachToGroup = (groupId, newEvent) => {
    const groupInfo = groups.get(groupId);
    if (!groupInfo) return;

    // 新しいイベントをグループに追加し、非表示として`out`配列に登録
    groupInfo.eventIds.add(newEvent.id);
    const hiddenEvent = { ...newEvent, hiddenByGroup: true };
    out.push(hiddenEvent);
    outEventMap.set(newEvent.id, hiddenEvent);

    // グループの表示範囲を新しいイベントに合わせて広げる
    const newEventRect = makeRect(newEvent, 2);
    groupInfo.x1 = Math.min(groupInfo.x1, newEventRect.x1 - groupPaddingPx);
    groupInfo.x2 = Math.max(groupInfo.x2, newEventRect.x2 + groupPaddingPx);

    // `occ`配列内のグループ矩形情報も更新
    const groupRectInOcc = occ[2].find(r => r.id === groupId);
    if (groupRectInOcc) {
      groupRectInOcc.x1 = groupInfo.x1;
      groupRectInOcc.x2 = groupInfo.x2;
    }
  };

  // 複数のイベントから新しいグループを作成する関数
  const createGroup = (eventsToGroup) => {
    if (!eventsToGroup || eventsToGroup.length === 0) return;

    const idsToGroup = new Set(eventsToGroup.map(e => e.id));

    // グループ化されるイベントの矩形を`occ[2]`から削除
    occ[2] = occ[2].filter(r => r.type === 'group' || !idsToGroup.has(r.id));
    
    // `out`配列内の対象イベントを「非表示」に更新
    idsToGroup.forEach(id => {
      const outEvent = outEventMap.get(id);
      if (outEvent) outEvent.hiddenByGroup = true;
    });

    // 新しいグループの情報を作成
    const firstRect = makeRect(eventsToGroup[0], 2);
    const gid = `grp_${(firstRect.x1 | 0)}_${Math.random().toString(36).slice(2, 6)}`;
    const groupInfo = {
      id: gid,
      x1: firstRect.x1 - groupPaddingPx,
      x2: firstRect.x2 + groupPaddingPx,
      y: laneTop(2),
      height: laneHeight,
      eventIds: idsToGroup,
    };

    // 全てのイベントが収まるようにグループの範囲を計算
    eventsToGroup.forEach(eventInGroup => {
        const r = makeRect(eventInGroup, 2);
        groupInfo.x1 = Math.min(groupInfo.x1, r.x1 - groupPaddingPx);
        groupInfo.x2 = Math.max(groupInfo.x2, r.x2 + groupPaddingPx);
    });
    
    groups.set(gid, groupInfo);
    occ[2].push({ type: 'group', id: gid, ...groupInfo });
  };

  const sortedEvents = [...events].filter(Boolean).sort((a, b) => getEventX(a.id) - getEventX(b.id));

  for (const ev of sortedEvents) {
    let placed = false;

    // 1段目、2段目に配置を試みる
    for (const lane of [0, 1]) {
      const rect = makeRect(ev, lane);
      if (!findCollision(occ[lane], rect)) {
        occ[lane].push(rect);
        const outEvent = { ...ev, adjustedPosition: { x: (rect.x1 + rect.x2) / 2, y: rect.y } };
        out.push(outEvent);
        outEventMap.set(ev.id, outEvent);
        placed = true;
        break;
      }
    }

    if (placed) continue;

    // 3段目（グループ化レーン）の処理
    const rect = makeRect(ev, 2);
    const collidedRect = findCollision(occ[2], rect);

    if (!collidedRect) {
      // 3段目に衝突なし -> そのまま配置
      occ[2].push(rect);
      const outEvent = { ...ev, adjustedPosition: { x: (rect.x1 + rect.x2) / 2, y: rect.y } };
      out.push(outEvent);
      outEventMap.set(ev.id, outEvent);
    } else {
      // 3段目で衝突あり
      if (collidedRect.type === 'group') {
        // 既存グループと衝突 -> グループに吸収
        attachToGroup(collidedRect.id, ev);
      } else {
        // 他のイベントと衝突 -> 新しいグループを作成
        const collidedEvent = allEventsById.get(collidedRect.id);
        createGroup([collidedEvent, ev]);
      }
    }
  }

  // 最終的に表示されるグループの要素を`out`配列に追加
  for (const group of groups.values()) {
    const groupEvents = [...group.eventIds].map(id => allEventsById.get(id));
    const mainEvent = groupEvents[0]; // グループの代表イベント
    
    out.push({
      ...mainEvent,
      id: group.id,
      isGroup: true,
      groupData: { // EventGroupコンポーネントが期待するデータを模倣
        id: group.id,
        events: groupEvents,
        getDisplayCount: () => groupEvents.length,
        getMainEvent: () => mainEvent,
      },
      title: `+${group.eventIds.size}件`,
      adjustedPosition: { x: (group.x1 + group.x2) / 2, y: group.y },
    });
  }

  return {
    allEvents: out,
    eventGroups: [...groups.values()].map(g => g.groupData), // GroupCardなどで使うために返す
  };
}