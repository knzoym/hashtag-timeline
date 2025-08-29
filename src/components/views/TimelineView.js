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
  // ドラッグ関連のプロパティ
  timelineAxes = [],
  onEventUpdate,
  onDragStart, // 追加
  isDragging = false, // 追加
}) => {
  const { allEvents, eventGroups } = layoutData;

  // highlightedEventsの型を統一的にチェックする関数
  const isEventHighlighted = (eventId) => {
    if (!highlightedEvents) return false;
    
    // Setの場合
    if (highlightedEvents.has) {
      return highlightedEvents.has(eventId);
    }
    
    // 配列の場合
    if (Array.isArray(highlightedEvents)) {
      return highlightedEvents.some((e) => e.id === eventId);
    }
    
    return false;
  };

  return (
    <>
      {/* 通常イベント表示 */}
      {allEvents
        .filter((event) => !event.hiddenByGroup)
        .map((event, index) => {
          const eventX = event.adjustedPosition.x;
          const eventY = event.adjustedPosition.y + panY;
          const isHighlighted = isEventHighlighted(event.id);

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
                // ドラッグに必要なプロパティ
                onDragStart={onDragStart}
                isDragging={isDragging}
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
          className="no-pan"
        />
      ))}

      {/* ホバー中のグループツールチップ */}
      {hoveredGroup && (
        <GroupTooltip
          groupData={hoveredGroup}
          position={hoveredGroup.position}
          panY={panY}
        />
      )}

      {/* 展開されたグループカード */}
      {Array.from(expandedGroups).map((groupId) => {
        const groupData = eventGroups?.find((g) => g.id === groupId);
        if (!groupData) return null;

        return (
          <GroupCard
            key={`expanded-group-${groupId}`}
            groupData={groupData}
            position={groupData.position}
            panY={panY}
            panX={0}
            timelineColor={groupData.timelineColor || '#6b7280'}
            onEventDoubleClick={handleEventDoubleClick}
            onClose={() => toggleEventGroup(groupId)}
            calculateTextWidth={calculateTextWidth}
            // グループ内EventCardにもプロパティを渡す
            timelineAxes={timelineAxes}
            onEventUpdate={onEventUpdate}
          />
        );
      })}
    </>
  );
};