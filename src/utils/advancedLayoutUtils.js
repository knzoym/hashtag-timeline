// src/utils/advancedLayoutUtils.js
import { TIMELINE_CONFIG } from "../constants/timelineConfig";
import { getXFromYear } from "./timelineUtils";

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

export class RowLaneLayoutManager {
  constructor(currentPixelsPerYear, panX, panY) {
    this.currentPixelsPerYear = currentPixelsPerYear;
    this.panX = panX;
    this.panY = panY;
    this.eventGroups = [];
    this.placedEvents = [];
  }

  getRowY(timelineIndex) {
    return TIMELINE_CONFIG.FIRST_ROW_Y + timelineIndex * TIMELINE_CONFIG.ROW_HEIGHT;
  }

  getLaneY(rowY, laneIndex) {
    const centerLane = Math.floor(TIMELINE_CONFIG.LANES_PER_ROW / 2);
    const offset = (laneIndex - centerLane) * TIMELINE_CONFIG.LANE_HEIGHT;
    return rowY + offset;
  }

  eventsOverlapHorizontally(event1X, event2X) {
    return Math.abs(event1X - event2X) < TIMELINE_CONFIG.EVENT_WIDTH + TIMELINE_CONFIG.MIN_EVENT_GAP;
  }

  canPlaceInLane(eventX, rowIndex, laneIndex) {
    const laneY = this.getLaneY(this.getRowY(rowIndex), laneIndex);
    
    for (const placedEvent of this.placedEvents) {
      if (placedEvent.rowIndex === rowIndex && 
          placedEvent.laneIndex === laneIndex &&
          this.eventsOverlapHorizontally(eventX, placedEvent.adjustedPosition.x)) {
        return false;
      }
    }
    return true;
  }

  findBestLane(eventX, rowIndex) {
    const lanePreference = [1, 0, 2];
    
    for (const laneIndex of lanePreference) {
      if (this.canPlaceInLane(eventX, rowIndex, laneIndex)) {
        return laneIndex;
      }
    }
    
    return null;
  }

  layoutTimelineEvents(timelines) {
    const layoutResults = [];

    timelines.forEach((timeline, timelineIndex) => {
      if (!timeline.isVisible || timeline.events.length === 0) return;

      const rowY = this.getRowY(timelineIndex);
      const sortedEvents = [...timeline.events].sort((a, b) => {
        const aX = getXFromYear(a.startDate.getFullYear(), this.currentPixelsPerYear, this.panX);
        const bX = getXFromYear(b.startDate.getFullYear(), this.currentPixelsPerYear, this.panX);
        return aX - bX;
      });

      const pendingGroups = new Map();

      sortedEvents.forEach(event => {
        const eventX = getXFromYear(event.startDate.getFullYear(), this.currentPixelsPerYear, this.panX);
        const bestLane = this.findBestLane(eventX, timelineIndex);

        if (bestLane !== null) {
          const finalY = this.getLaneY(rowY, bestLane);
          const placedEvent = {
            ...event,
            adjustedPosition: { x: eventX, y: finalY },
            timelineColor: timeline.color,
            axisY: rowY,
            idealY: this.getLaneY(rowY, 1),
            rowIndex: timelineIndex,
            laneIndex: bestLane,
            needsConnectionLine: bestLane !== 1
          };

          this.placedEvents.push(placedEvent);
          layoutResults.push(placedEvent);
        } else {
          const groupKey = `${Math.floor(eventX / (TIMELINE_CONFIG.EVENT_WIDTH + TIMELINE_CONFIG.MIN_EVENT_GAP))}`;
          
          if (!pendingGroups.has(groupKey)) {
            pendingGroups.set(groupKey, []);
          }
          pendingGroups.get(groupKey).push(event);
        }
      });

      pendingGroups.forEach((groupEvents, groupKey) => {
        if (groupEvents.length > 0) {
          const groupX = getXFromYear(
            groupEvents[0].startDate.getFullYear(), 
            this.currentPixelsPerYear, 
            this.panX
          );
          const groupY = this.getLaneY(rowY, 1);
          
          const eventGroup = new EventGroup(
            groupEvents,
            { x: groupX, y: groupY },
            timeline.id
          );
          
          this.eventGroups.push(eventGroup);
          layoutResults.push({
            ...eventGroup.getMainEvent(),
            adjustedPosition: { x: groupX, y: groupY },
            timelineColor: timeline.color,
            axisY: rowY,
            idealY: groupY,
            rowIndex: timelineIndex,
            laneIndex: 1,
            needsConnectionLine: false,
            isGroup: true,
            groupData: eventGroup
          });
        }
      });
    });

    return layoutResults;
  }

  layoutMainTimelineEvents(events, timelineEventIds) {
    const mainEvents = events.filter(event => !timelineEventIds.has(event.id));
    const layoutResults = [];

    const sortedMainEvents = mainEvents.sort((a, b) => {
      const aX = getXFromYear(a.startDate.getFullYear(), this.currentPixelsPerYear, this.panX);
      const bX = getXFromYear(b.startDate.getFullYear(), this.currentPixelsPerYear, this.panX);
      return aX - bX;
    });

    sortedMainEvents.forEach(event => {
      const eventX = getXFromYear(event.startDate.getFullYear(), this.currentPixelsPerYear, this.panX);
      let assignedY = TIMELINE_CONFIG.MAIN_TIMELINE_Y;
      let level = 0;

      while (level < 50) {
        let hasCollision = false;
        
        for (const placedEvent of this.placedEvents) {
          if (Math.abs(eventX - placedEvent.adjustedPosition.x) < TIMELINE_CONFIG.EVENT_WIDTH + TIMELINE_CONFIG.MIN_EVENT_GAP &&
              Math.abs(assignedY - placedEvent.adjustedPosition.y) < TIMELINE_CONFIG.EVENT_HEIGHT + TIMELINE_CONFIG.MIN_EVENT_GAP) {
            hasCollision = true;
            break;
          }
        }

        for (const layoutEvent of layoutResults) {
          if (Math.abs(eventX - layoutEvent.adjustedPosition.x) < TIMELINE_CONFIG.EVENT_WIDTH + TIMELINE_CONFIG.MIN_EVENT_GAP &&
              Math.abs(assignedY - layoutEvent.adjustedPosition.y) < TIMELINE_CONFIG.EVENT_HEIGHT + TIMELINE_CONFIG.MIN_EVENT_GAP) {
            hasCollision = true;
            break;
          }
        }

        if (!hasCollision) break;

        level++;
        assignedY = TIMELINE_CONFIG.MAIN_TIMELINE_Y + level * (TIMELINE_CONFIG.EVENT_HEIGHT + TIMELINE_CONFIG.MIN_EVENT_GAP);
      }

      const placedEvent = {
        ...event,
        adjustedPosition: { x: eventX, y: assignedY },
        needsConnectionLine: false
      };

      layoutResults.push(placedEvent);
    });

    return layoutResults;
  }

  executeLayout(events, timelines) {
    this.placedEvents = [];
    this.eventGroups = [];

    const timelineLayoutResults = this.layoutTimelineEvents(timelines);
    
    const timelineEventIds = new Set();
    timelines.forEach(timeline => {
      timeline.events.forEach(event => {
        timelineEventIds.add(event.id);
      });
    });

    const mainLayoutResults = this.layoutMainTimelineEvents(events, timelineEventIds);

    return {
      allEvents: [...timelineLayoutResults, ...mainLayoutResults],
      eventGroups: this.eventGroups
    };
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