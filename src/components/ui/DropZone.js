// src/components/ui/DropZone.js - 削除ゾーン除去・簡素化版
import React, { useMemo } from 'react';

/**
 * 年表ドロップゾーン - ドラッグ中に表示される
 */
export const TimelineDropZone = ({ 
  timeline, 
  yPosition, 
  panY, 
  isActive = false,
  isHighlighted = false,
  eventCount = 0,
  startX = 0,
  endX = 1000,
  style = {}
}) => {
  const dropZoneStyles = {
    position: 'absolute',
    left: `${Math.max(0, startX - 100)}px`,
    top: `${yPosition + panY - 30}px`,
    width: `${Math.min(window.innerWidth, endX - startX + 200)}px`,
    height: '60px',
    borderRadius: '12px',
    border: isHighlighted ? '3px solid #10b981' : '2px dashed rgba(107, 114, 128, 0.4)',
    backgroundColor: isHighlighted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: isHighlighted ? 100 : 50,
    opacity: isActive ? 1 : 0.7,
    transform: isHighlighted ? 'scale(1.02)' : 'scale(1)',
    transition: 'all 0.2s ease',
    pointerEvents: 'none',
    backdropFilter: 'blur(2px)',
    ...style
  };

  const labelStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: isHighlighted ? '#059669' : '#6b7280',
    fontSize: '14px',
    fontWeight: '600',
    textAlign: 'center'
  };

  const iconStyles = {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: timeline.color || '#6b7280',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold'
  };

  return (
    <div style={dropZoneStyles} data-timeline-dropzone={timeline.id}>
      <div style={labelStyles}>
        <div style={iconStyles}>
          {timeline.name.charAt(0)}
        </div>
        <div>
          {isHighlighted ? 
            `「${timeline.name}」に登録` : 
            `${timeline.name} (${eventCount}件)`
          }
        </div>
        {isHighlighted && (
          <div style={{ 
            fontSize: '16px', 
            color: '#10b981',
            animation: 'pulse 1s infinite' 
          }}>
            ✓
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * ドロップゾーン管理システム（簡素化版）
 */
export const DropZoneManager = ({ 
  isActive = false,
  timelineAxes = [],
  displayTimelines = [],
  panY = 0,
  draggedEvent = null,
  highlightedZone = null, // 'timeline-{id}' のみ
  mainTimelineY = null, // 使用しない（削除対象）
  style = {}
}) => {
  // アクティブな年表ドロップゾーンを計算
  const activeTimelineZones = useMemo(() => {
    if (!isActive) return [];
    
    return timelineAxes.map(axis => {
      const timeline = displayTimelines.find(t => t.id === axis.id) || axis.timeline || axis;
      const isHighlighted = highlightedZone === `timeline-${axis.id}`;
      
      return {
        id: axis.id,
        timeline,
        yPosition: axis.yPosition,
        startX: axis.startX,
        endX: axis.endX,
        eventCount: axis.eventCount || 0,
        isHighlighted
      };
    });
  }, [isActive, timelineAxes, displayTimelines, highlightedZone]);

  const containerStyles = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 45,
    ...style
  };

  if (!isActive) return null;

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}
      </style>
      
      <div style={containerStyles}>
        {/* 年表ドロップゾーンのみ表示 */}
        {activeTimelineZones.map(zone => (
          <TimelineDropZone
            key={zone.id}
            timeline={zone.timeline}
            yPosition={zone.yPosition}
            panY={panY}
            isActive={isActive}
            isHighlighted={zone.isHighlighted}
            eventCount={zone.eventCount}
            startX={zone.startX}
            endX={zone.endX}
          />
        ))}
      </div>
    </>
  );
};

export default DropZoneManager;