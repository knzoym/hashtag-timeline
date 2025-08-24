// src/utils/layoutUtils.js

export class EventGroup {
  constructor(events, position, timelineId) {
    this.events = events;
    this.position = position;
    this.timelineId = timelineId;
    this.id = `group_${timelineId}_${position.x}_${position.y}`;
    this.isExpanded = false;
  }

  getDisplayCount() {
    return this.events.length;
  }

  getMainEvent() {
    return this.events[0];
  }
}

export class GroupExpansionManager {
  constructor() {
    this.expandedGroups = new Set();
    this.groupCards = new Map();
  }

  toggleGroup(groupId) {
    if (this.expandedGroups.has(groupId)) {
      this.expandedGroups.delete(groupId);
      this.groupCards.delete(groupId);
    } else {
      this.expandedGroups.clear();
      this.groupCards.clear();
      this.expandedGroups.add(groupId);
    }
  }

  isExpanded(groupId) {
    return this.expandedGroups.has(groupId);
  }
  
  setGroupCard(groupId, cardData) {
    this.groupCards.set(groupId, cardData);
  }

  getGroupCard(groupId) {
    return this.groupCards.get(groupId);
  }

  closeAllGroups() {
    this.expandedGroups.clear();
    this.groupCards.clear();
  }
}

export function layoutWithGroups({
  events,
  getEventX,
  laneTop,
  laneHeight,
  minWidthPx = 60,
  groupPaddingPx = 8,
  calculateTextWidth,
}) {
  const allEventsById = new Map(events.filter(Boolean).map(e => [e.id, e]));
  const occ = [[], [], []];
  const groups = new Map();
  const out = [];
  const outEventMap = new Map();

  const getEventWidth = (event) => {
    if (calculateTextWidth && event.title) {
      const textWidth = calculateTextWidth(event.title.length > 12 ? event.title.substring(0, 12) + "..." : event.title);
      return Math.max(minWidthPx, textWidth + 16);
    }
    return minWidthPx;
  };

  const overlapsX = (a, b) => a.x1 < b.x2 && a.x2 > b.x1;

  const makeRect = (ev, lane) => {
    const w = getEventWidth(ev);
    const x1 = getEventX(ev.id) - w / 2;
    const x2 = getEventX(ev.id) + w / 2;
    return { type: 'event', id: ev.id, lane, x1, x2, y: laneTop(lane), height: laneHeight, width: w };
  };

  const findCollision = (laneRects, rect) => {
    for (const r of laneRects) {
      if (overlapsX(rect, r)) {
        return r;
      }
    }
    return null;
  };

  const attachToGroup = (groupId, newEvent) => {
    const groupInfo = groups.get(groupId);
    if (!groupInfo) return;
    groupInfo.eventIds.add(newEvent.id);
    groupInfo.eventGroup.events.push(newEvent);
    const hiddenEvent = { ...newEvent, hiddenByGroup: true };
    out.push(hiddenEvent);
    outEventMap.set(newEvent.id, hiddenEvent);
    const newEventRect = makeRect(newEvent, 2);
    groupInfo.x1 = Math.min(groupInfo.x1, newEventRect.x1 - groupPaddingPx);
    groupInfo.x2 = Math.max(groupInfo.x2, newEventRect.x2 + groupPaddingPx);
    const groupRectInOcc = occ[2].find(r => r.id === groupId);
    if (groupRectInOcc) {
      groupRectInOcc.x1 = groupInfo.x1;
      groupRectInOcc.x2 = groupInfo.x2;
    }
  };

  const createGroup = (eventsToGroup) => {
    if (!eventsToGroup || eventsToGroup.length === 0) return;
    const idsToGroup = new Set(eventsToGroup.map(e => e.id));
    occ[2] = occ[2].filter(r => r.type === 'group' || !idsToGroup.has(r.id));
    idsToGroup.forEach(id => {
      const outEvent = outEventMap.get(id);
      if (outEvent) outEvent.hiddenByGroup = true;
    });
    const firstRect = makeRect(eventsToGroup[0], 2);
    const gid = `grp_${(firstRect.x1 | 0)}_${Math.random().toString(36).slice(2, 6)}`;
    const eventGroup = new EventGroup([...eventsToGroup], { x: (firstRect.x1 + firstRect.x2) / 2, y: laneTop(2) }, gid);
    const groupInfo = { id: gid, x1: firstRect.x1 - groupPaddingPx, x2: firstRect.x2 + groupPaddingPx, y: laneTop(2), height: laneHeight, eventIds: idsToGroup, eventGroup: eventGroup };
    eventsToGroup.forEach(eventInGroup => {
        const r = makeRect(eventInGroup, 2);
        groupInfo.x1 = Math.min(groupInfo.x1, r.x1 - groupPaddingPx);
        groupInfo.x2 = Math.max(groupInfo.x2, r.x2 + groupPaddingPx);
    });
    eventGroup.position = { x: (groupInfo.x1 + groupInfo.x2) / 2, y: groupInfo.y };
    groups.set(gid, groupInfo);
    occ[2].push({ type: 'group', id: gid, ...groupInfo });
  };

  const sortedEvents = [...events].filter(Boolean).sort((a, b) => getEventX(a.id) - getEventX(b.id));

  for (const ev of sortedEvents) {
    let placed = false;
    for (const lane of [1, 0, 2]) {
      const rect = makeRect(ev, lane);
      if (!findCollision(occ[lane], rect)) {
        occ[lane].push(rect);
        const outEvent = { ...ev, adjustedPosition: { x: getEventX(ev.id), y: rect.y }, hiddenByGroup: false, calculatedWidth: rect.width };
        out.push(outEvent);
        outEventMap.set(ev.id, outEvent);
        placed = true;
        break;
      }
    }
    if (placed) continue;
    const rect = makeRect(ev, 2);
    const collidedRect = findCollision(occ[2], rect);
    if (collidedRect) {
      if (collidedRect.type === 'group') {
        attachToGroup(collidedRect.id, ev);
      } else {
        const collidedEvent = allEventsById.get(collidedRect.id);
        createGroup([collidedEvent, ev]);
      }
    }
  }

  for (const group of groups.values()) {
    const mainEvent = group.eventGroup.getMainEvent();
    out.push({ ...mainEvent, id: group.id, isGroup: true, groupData: group.eventGroup, title: `${group.eventIds.size}件`, adjustedPosition: { x: (group.x1 + group.x2) / 2, y: group.y }, hiddenByGroup: false });
  }

  return { allEvents: out, eventGroups: [...groups.values()].map(g => g.eventGroup) };
}
