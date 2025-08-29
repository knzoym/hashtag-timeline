import React from 'react';
import { EventCard } from '../ui/EventCard';
import { EventGroupIcon, GroupTooltip, GroupCard } from '../ui/EventGroup';

export const TimelineView = ({
  layoutData,
  panY,
  highlightedEvents = [],
  hoveredGroup,
  expandedGroups,
  setHoveredGroup,
  toggleEventGroup,
  handleEventDoubleClick,
  calculateTextWidth,
}) => {
  const { allEvents, eventGroups } = layoutData;

  return (
    <>
      {/* 通常イベント表示 */}
      {allEvents
        .filter((event) => !event.hiddenByGroup)
        .map((event, index) => {
          const eventX = event.adjustedPosition.x;
          const eventY = event.adjustedPosition.y + panY;
          const isHighlighted = highlightedEvents?.some((e) => e.id === event.id) || false;

          return (
            <React.Fragment key={`event-${event.id}-${index}`}>
              <EventCard
                event={event}
                style={{
                  position: 'absolute',
                  left: `${eventX}px`,
                  top: `${eventY}px`,
                  transform: 'translateX(-50%)',
                }}
                isHighlighted={isHighlighted}
                onDoubleClick={() => handleEventDoubleClick(event)}
                onMouseDown={(e) => e.stopPropagation()}
                calculateTextWidth={calculateTextWidth}
                className="no-pan"
              />
              {/* 延長線 */}
              {event.timelineInfo?.needsExtensionLine && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${eventX}px`,
                    top: `${Math.min(eventY, event.timelineInfo.axisY + panY)}px`,
                    width: '2px',
                    height: `${Math.abs(eventY - (event.timelineInfo.axisY + panY))}px`,
                    backgroundColor: event.timelineColor || '#6b7280',
                    opacity: 0.6,
                    zIndex: 1,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}

      {/* イベントグループアイコン */}
      {eventGroups?.map((groupData) => (
        <EventGroupIcon
          key={`group-icon-${groupData.id}`}
          groupData={groupData}
          position={groupData.position}
          panY={panY}
          panX={0}
          timelineColor={groupData.timelineColor || '#6b7280'}
          onHover={setHoveredGroup}
          onClick={toggleEventGroup}
          onDoubleClick={(e, group) => {
            e.stopPropagation();
            if (group.events.length === 1) {
              handleEventDoubleClick(group.events[0]);
            } else {
              toggleEventGroup(group.id);
            }
          }}
          isHighlighted={hoveredGroup === groupData.id}
        />
      ))}

      {/* グループツールチップ */}
      {hoveredGroup && eventGroups.find((g) => g.id === hoveredGroup) && (
        <GroupTooltip
          groupData={eventGroups.find((g) => g.id === hoveredGroup)}
          position={eventGroups.find((g) => g.id === hoveredGroup)?.position}
          panY={panY}
          panX={0}
        />
      )}

      {/* 展開されたグループカード */}
      {Array.from(expandedGroups).map((groupId) => {
        const groupData = eventGroups.find((g) => g.id === groupId);
        if (!groupData) return null;
        return (
          <GroupCard
            key={`group-card-${groupId}`}
            groupData={groupData}
            position={{ x: groupData.position.x + 30, y: groupData.position.y - 50 }}
            panY={panY}
            panX={0}
            timelineColor={groupData.timelineColor || '#6b7280'}
            onEventDoubleClick={handleEventDoubleClick}
            onClose={() => toggleEventGroup(groupId)}
            onEventClick={handleEventDoubleClick}
          />
        );
      })}
    </>
  );
};