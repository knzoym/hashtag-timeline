// src/components/ui/DropZone.js - ドロップゾーン表示システム
import React, { useMemo } from 'react';
import { TIMELINE_CONFIG } from '../../constants/timelineConfig';

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
            `「${timeline.name}」に追加` : 
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
 * メインタイムライン削除ゾーン
 */
export const MainTimelineDropZone = ({ 
  yPosition, 
  panY, 
  isActive = false,
  isHighlighted = false,
  style = {}
}) => {
  const mainDropZoneStyles = {
    position: 'absolute',
    left: '50px',
    right: '50px',
    top: `${yPosition + panY - 25}px`,
    height: '50px',
    borderRadius: '8px',
    border: isHighlighted ? '2px solid #f59e0b' : '2px dashed rgba(156, 163, 175, 0.4)',
    backgroundColor: isHighlighted ? 'rgba(245, 158, 11, 0.1)' : 'rgba(156, 163, 175, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: isHighlighted ? 100 : 40,
    opacity: isActive ? 1 : 0.6,
    transform: isHighlighted ? 'scale(1.01)' : 'scale(1)',
    transition: 'all 0.2s ease',
    pointerEvents: 'none',
    ...style
  };

  const labelStyles = {
    color: isHighlighted ? '#d97706' : '#9ca3af',
    fontSize: '13px',
    fontWeight: '500',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  };

  return (
    <div style={mainDropZoneStyles} data-main-timeline-dropzone="true">
      <div style={labelStyles}>
        <span>📍</span>
        {isHighlighted ? 'メインタイムラインに戻す' : 'メインタイムライン'}
      </div>
    </div>
  );
};

/**
 * 削除ゾーン（年表外エリア）
 */
export const RemovalZone = ({ 
  isActive = false,
  isHighlighted = false,
  draggedEvent = null,
  style = {}
}) => {
  const removalZoneStyles = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: isHighlighted ? '200px' : '150px',
    height: isHighlighted ? '80px' : '60px',
    borderRadius: '12px',
    border: isHighlighted ? '3px solid #ef4444' : '2px dashed rgba(239, 68, 68, 0.4)',
    backgroundColor: isHighlighted ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: isHighlighted ? 120 : 60,
    opacity: isActive ? 1 : 0.8,
    transform: isHighlighted ? 'scale(1.05)' : 'scale(1)',
    transition: 'all 0.3s ease',
    pointerEvents: 'none',
    backdropFilter: 'blur(4px)',
    boxShadow: isHighlighted ? '0 8px 24px rgba(239, 68, 68, 0.3)' : '0 4px 12px rgba(239, 68, 68, 0.1)',
    ...style
  };

  const iconStyles = {
    fontSize: isHighlighted ? '24px' : '20px',
    marginBottom: '4px',
    color: isHighlighted ? '#dc2626' : '#ef4444'
  };

  const labelStyles = {
    color: isHighlighted ? '#dc2626' : '#ef4444',
    fontSize: isHighlighted ? '13px' : '12px',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: '1.2'
  };

  return (
    <div style={removalZoneStyles} data-removal-zone="true">
      <div style={iconStyles}>
        {isHighlighted ? '🗑️' : '❌'}
      </div>
      <div style={labelStyles}>
        {isHighlighted ? 
          `${draggedEvent?.title || 'イベント'}を\n年表から削除` : 
          '年表から削除'
        }
      </div>
    </div>
  );
};

/**
 * ドロップゾーン管理システム
 */
export const DropZoneManager = ({ 
  isActive = false,
  timelineAxes = [],
  displayTimelines = [],
  panY = 0,
  draggedEvent = null,
  highlightedZone = null, // 'timeline-{id}' | 'main' | 'remove'
  mainTimelineY = null,
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
        {/* 年表ドロップゾーン */}
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

        {/* メインタイムラインドロップゾーン */}
        {mainTimelineY && (
          <MainTimelineDropZone
            yPosition={mainTimelineY}
            panY={panY}
            isActive={isActive}
            isHighlighted={highlightedZone === 'main'}
          />
        )}

        {/* 削除ゾーン（固定位置） */}
        <RemovalZone
          isActive={isActive}
          isHighlighted={highlightedZone === 'remove'}
          draggedEvent={draggedEvent}
        />
      </div>
    </>
  );
};

export default DropZoneManager;