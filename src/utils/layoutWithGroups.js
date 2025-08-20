// src/utils/layoutWithGroups.js
export function layoutWithGroups({
  events,
  getEventX,      // (evId) => x1（panは入れない）
  laneTop,        // (lane: 0|1|2) => y
  laneHeight,     // laneの高さ(px)
  minWidthPx = 60,
  groupPaddingPx = 8,
}) {
  const occ = [[], [], []]; // laneごとの占有矩形
  const groups = new Map();
  const out = [];

  const overlapsX = (a, b) => !(a.x2 <= b.x1 || b.x2 <= a.x1);

  const makeRect = (ev, lane) => {
    const w = Math.max(ev.widthPx || minWidthPx, minWidthPx);
    const x1 = getEventX(ev.id);
    const x2 = x1 + w;
    return { type: "event", id: ev.id, lane, x1, x2, y: laneTop(lane), height: laneHeight };
  };

  const tryPlace = (laneRects, rect) => {
    for (const r of laneRects) {
      if (!overlapsX(rect, r)) continue;
      return r.type === "group" ? "collide-group" : "collide-event";
    }
    laneRects.push(rect);
    return "placed";
  };

  const findOverlappingGroup = (lane2, rect) =>
    lane2.find(r => r.type === "group" && overlapsX(r, rect));

  const attachToGroup = (lane2, rect, ev) => {
    const gRect = findOverlappingGroup(lane2, rect);
    if (!gRect) return false;
    const g = groups.get(gRect.id);
    g.x1 = Math.min(g.x1, rect.x1 - groupPaddingPx);
    g.x2 = Math.max(g.x2, rect.x2 + groupPaddingPx);
    gRect.x1 = g.x1;
    gRect.x2 = g.x2;
    g.eventIds.add(ev.id);
    return true;
  };

  const createGroup = (rect, ev) => {
    const gid = `grp_${(rect.x1|0)}_${(rect.x2|0)}_${Math.random().toString(36).slice(2,6)}`;
    const g = {
      id: gid, lane: 2,
      x1: rect.x1 - groupPaddingPx,
      x2: rect.x2 + groupPaddingPx,
      y: laneTop(2),
      height: laneHeight,
      eventIds: new Set([ev.id])
    };
    groups.set(gid, g);
    occ[2].push({ type: "group", id: gid, lane: 2, x1: g.x1, x2: g.x2, y: g.y, height: g.height });
    return g;
  };

  const sorted = [...events].sort((a, b) => getEventX(a.id) - getEventX(b.id));

  for (const ev of sorted) {
    let placed = false;
    for (const lane of [0,1,2]) {
      const rect = makeRect(ev, lane);
      const res = tryPlace(occ[lane], rect);

      if (res === "placed") {
        out.push({
          id: ev.id,
          startDate: ev.startDate,
          title: ev.title,
          adjustedPosition: { x: (rect.x1+rect.x2)/2, y: rect.y },
          widthPx: rect.x2 - rect.x1,
          timelineColor: ev.timelineColor,
        });
        placed = true;
        break;
      }
      if (lane < 2) continue;

      // lane=2：グループに吸収 or 新規作成。吸収されたイベントは非表示化
      if (res === "collide-group") {
        attachToGroup(occ[2], rect, ev);
      } else {
        if (!attachToGroup(occ[2], rect, ev)) createGroup(rect, ev);
      }
      out.push({
        id: ev.id,
        startDate: ev.startDate,
        title: ev.title,
        adjustedPosition: { x: (rect.x1+rect.x2)/2, y: rect.y },
        widthPx: rect.x2 - rect.x1,
        hiddenByGroup: true,
        timelineColor: ev.timelineColor,
      });
      placed = true;
      break;
    }

    if (!placed) {
      const rect = makeRect(ev, 2);
      createGroup(rect, ev);
      out.push({
        id: ev.id,
        startDate: ev.startDate,
        title: ev.title,
        adjustedPosition: { x: (rect.x1+rect.x2)/2, y: rect.y },
        widthPx: rect.x2 - rect.x1,
        hiddenByGroup: true,
        timelineColor: ev.timelineColor,
      });
    }
  }

  for (const g of groups.values()) {
    out.push({
      id: g.id,
      startDate: new Date(0),
      title: `+${g.eventIds.size}件`,
      isGroup: true,
      adjustedPosition: { x: (g.x1+g.x2)/2, y: g.y },
      widthPx: Math.max(g.x2 - g.x1, minWidthPx),
    });
  }

  return { allEvents: out };
}
