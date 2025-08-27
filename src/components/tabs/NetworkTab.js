// src/components/tabs/NetworkTab.js
import React from 'react';
import { useEnhancedEventLayout } from '../../hooks/useEnhancedEventLayout';
import { TIMELINE_CONFIG } from '../../constants/timelineConfig';
import { SearchPanel } from '../ui/SearchPanel';
import { TimelineCard } from '../ui/TimelineCard';
import { EventGroupIcon, GroupTooltip, GroupCard } from '../ui/EventGroup';

const NetworkTab = ({
  // 基本データ
  events,
  timelines,
  user,
  onEventUpdate,
  onEventDelete,
  onTimelineUpdate,
  onAddEvent,
  isPersonalMode,
  isWikiMode,
  
  // Network固有
  timelineRef,
  scale,
  panX,
  panY,
  currentPixelsPerYear,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onDoubleClick,
  highlightedEvents,
  onResetView,
  showMultipleTimelineConnections = true,
  
  // その他
  searchTerm = '',
  selectedEvent,
  onCloseEventModal
}) => {
  // ネットワーク表示用のレイアウト計算
  const { allEvents: layoutEvents, eventGroups } = useEnhancedEventLayout(
    events,
    timelines,
    currentPixelsPerYear,
    panX,
    panY
  );
  
  // イベント間の接続線を計算
  const calculateConnections = (event) => {
    if (!showMultipleTimelineConnections || !event.timelineInfos) return [];
    
    const connections = [];
    event.timelineInfos.forEach(timelineInfo => {
      const timeline = timelines.find(t => t.id === timelineInfo.timelineId);
      if (timeline && timeline.isVisible) {
        connections.push({
          timelineId: timeline.id,
          timelineName: timeline.name,
          timelineColor: timeline.color,
          y: timeline.y || TIMELINE_CONFIG.FIRST_ROW_Y,
          isTemporary: timelineInfo.isTemporary
        });
      }
    });
    
    return connections;
  };
  
  // 地下鉄路線図スタイルの描画
  const getNetworkEventStyle = (event, connections) => {
    const baseStyle = {
      position: 'absolute',
      cursor: 'pointer',
      borderRadius: '50%', // 円形のステーション
      fontSize: '10px',
      transition: 'all 0.2s',
      border: '3px solid #ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      boxSizing: 'border-box',
      zIndex: 10,
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    };
    
    // 複数路線の交差点の場合、特別なスタイル
    if (connections.length > 1) {
      return {
        ...baseStyle,
        width: TIMELINE_CONFIG.SUBWAY_STATION_RADIUS * 3,
        height: TIMELINE_CONFIG.SUBWAY_STATION_RADIUS * 3,
        backgroundColor: '#1f2937', // 交差駅は黒
        color: 'white',
        border: '3px solid #ffffff'
      };
    }
    
    // 単一路線の場合
    const primaryConnection = connections[0];
    return {
      ...baseStyle,
      width: TIMELINE_CONFIG.SUBWAY_STATION_RADIUS * 2,
      height: TIMELINE_CONFIG.SUBWAY_STATION_RADIUS * 2,
      backgroundColor: primaryConnection?.timelineColor || '#6b7280',
      color: 'white',
      border: primaryConnection?.isTemporary ? 
        `2px dashed ${primaryConnection.timelineColor}` : 
        `2px solid ${primaryConnection?.timelineColor || '#6b7280'}`
    };
  };
  
  // 接続線の描画
  const renderConnections = (event, connections) => {
    if (connections.length === 0) return null;
    
    const eventX = event.adjustedPosition.x;
    const eventY = event.adjustedPosition.y;
    
    return connections.map((connection, index) => (
      <g key={`connection-${event.id}-${connection.timelineId}`}>
        {/* 垂直接続線 */}
        <line
          x1={eventX}
          y1={eventY}
          x2={eventX}
          y2={connection.y}
          stroke={connection.timelineColor}
          strokeWidth={TIMELINE_CONFIG.SUBWAY_LINE_WIDTH}
          strokeDasharray={connection.isTemporary ? "5,5" : "none"}
          opacity={0.8}
        />
        
        {/* 接続点 */}
        <circle
          cx={eventX}
          cy={connection.y}
          r={TIMELINE_CONFIG.SUBWAY_LINE_WIDTH / 2}
          fill={connection.timelineColor}
          opacity={0.8}
        />
      </g>
    ));
  };
  
  const styles = {
    container: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      position: 'relative'
    },
    networkContainer: {
      flex: 1,
      position: 'relative',
      overflow: 'hidden',
      cursor: 'grab',
      backgroundColor: '#f8fafc' // 地下鉄路線図風の背景
    },
    networkContainerDragging: {
      cursor: 'grabbing'
    },
    svgOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 1
    },
    floatingInfo: {
      position: 'absolute',
      top: '16px',
      left: '16px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      padding: '12px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      fontSize: '12px',
      zIndex: 100
    },
    legend: {
      position: 'absolute',
      bottom: '16px',
      left: '16px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      padding: '12px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      fontSize: '11px',
      zIndex: 100
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '4px'
    },
    legendLine: {
      width: '20px',
      height: '3px',
      borderRadius: '2px'
    },
    resetButton: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      padding: '8px 12px',
      backgroundColor: '#6b7280',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '12px',
      zIndex: 100
    }
  };
  
  return (
    <div style={styles.container}>
      {/* ネットワーク表示エリア */}
      <div 
        ref={timelineRef}
        style={styles.networkContainer}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onDoubleClick={onDoubleClick}
      >
        {/* SVG オーバーレイ（接続線用） */}
        <svg style={styles.svgOverlay}>
          <defs>
            {/* グラデーション定義 */}
            <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e5e7eb" />
              <stop offset="100%" stopColor="#9ca3af" />
            </linearGradient>
          </defs>
          
          {/* 年表線（地下鉄路線風） */}
          {timelines.filter(t => t.isVisible).map(timeline => (
            <g key={`timeline-${timeline.id}`}>
              <line
                x1={0}
                y1={timeline.y || TIMELINE_CONFIG.FIRST_ROW_Y}
                x2="100%"
                y2={timeline.y || TIMELINE_CONFIG.FIRST_ROW_Y}
                stroke={timeline.color || '#e5e7eb'}
                strokeWidth={TIMELINE_CONFIG.SUBWAY_LINE_WIDTH}
                opacity={0.8}
              />
              
              {/* 路線名ラベル */}
              <text
                x={50}
                y={(timeline.y || TIMELINE_CONFIG.FIRST_ROW_Y) - 8}
                fill={timeline.color || '#6b7280'}
                fontSize="10px"
                fontWeight="bold"
              >
                {timeline.name}
              </text>
            </g>
          ))}
          
          {/* メインタイムライン */}
          <line
            x1={0}
            y1={TIMELINE_CONFIG.MAIN_TIMELINE_Y}
            x2="100%"
            y2={TIMELINE_CONFIG.MAIN_TIMELINE_Y}
            stroke="#374151"
            strokeWidth={TIMELINE_CONFIG.SUBWAY_LINE_WIDTH + 1}
          />
          
          {/* イベント接続線 */}
          {layoutEvents.map(event => {
            if (event.hiddenByGroup || event.isGroup) return null;
            
            const connections = calculateConnections(event);
            return renderConnections(event, connections);
          })}
        </svg>
        
        {/* イベント（駅）の描画 */}
        {layoutEvents.map(event => {
          if (event.hiddenByGroup) return null;
          
          if (event.isGroup) {
            // グループの場合は特別な表示
            return (
              <div
                key={event.id}
                style={{
                  position: 'absolute',
                  left: event.adjustedPosition.x - 20,
                  top: event.adjustedPosition.y - 20,
                  width: 40,
                  height: 40,
                  backgroundColor: '#1f2937',
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  zIndex: 10,
                  border: '3px solid #ffffff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
                title={`${event.groupData?.getDisplayCount() || 0}件のイベント`}
              >
                {event.groupData?.getDisplayCount() || 0}
              </div>
            );
          }
          
          const connections = calculateConnections(event);
          
          return (
            <div
              key={event.id}
              style={{
                ...getNetworkEventStyle(event, connections),
                left: event.adjustedPosition.x - (connections.length > 1 ? 
                  TIMELINE_CONFIG.SUBWAY_STATION_RADIUS * 1.5 : 
                  TIMELINE_CONFIG.SUBWAY_STATION_RADIUS
                ),
                top: event.adjustedPosition.y - (connections.length > 1 ? 
                  TIMELINE_CONFIG.SUBWAY_STATION_RADIUS * 1.5 : 
                  TIMELINE_CONFIG.SUBWAY_STATION_RADIUS
                ),
                ...(highlightedEvents.includes(event.id) ? {
                  transform: 'scale(1.2)',
                  zIndex: 20
                } : {})
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (onDoubleClick) onDoubleClick(e, event);
              }}
              title={`${event.title}\n${event.startDate?.toLocaleDateString('ja-JP') || ''}\n接続: ${connections.map(c => c.timelineName).join(', ')}`}
            >
              {/* イベント名の表示（省略形） */}
              <span style={{ 
                fontSize: connections.length > 1 ? '8px' : '10px',
                fontWeight: 'bold',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                maxWidth: '100%'
              }}>
                {event.title ? event.title.slice(0, connections.length > 1 ? 2 : 3) : '?'}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* フローティング情報パネル */}
      <div style={styles.floatingInfo}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🕸️ ネットワークビュー</div>
        <div>イベント: {layoutEvents.filter(e => !e.hiddenByGroup && !e.isGroup).length}件</div>
        <div>年表: {timelines.filter(t => t.isVisible).length}本</div>
        {searchTerm && (
          <div>検索: "{searchTerm}"</div>
        )}
      </div>
      
      {/* 凡例 */}
      <div style={styles.legend}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>凡例</div>
        
        <div style={styles.legendItem}>
          <div style={{
            ...styles.legendLine,
            backgroundColor: '#374151'
          }} />
          <span>メインタイムライン</span>
        </div>
        
        {timelines.filter(t => t.isVisible).slice(0, 3).map(timeline => (
          <div key={timeline.id} style={styles.legendItem}>
            <div style={{
              ...styles.legendLine,
              backgroundColor: timeline.color
            }} />
            <span>{timeline.name}</span>
          </div>
        ))}
        
        <div style={styles.legendItem}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: '#1f2937',
            border: '2px solid #ffffff'
          }} />
          <span>交差駅（複数年表）</span>
        </div>
        
        <div style={styles.legendItem}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: 'transparent',
            border: '2px dashed #6b7280'
          }} />
          <span>仮登録イベント</span>
        </div>
      </div>
      
      {/* リセットボタン */}
      <button 
        style={styles.resetButton} 
        onClick={onResetView}
        title="初期位置に戻す"
      >
        🎯 初期位置
      </button>
      
      {/* イベントモーダル */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={onCloseEventModal}
          onUpdate={onEventUpdate}
          onDelete={onEventDelete}
          isWikiMode={isWikiMode}
          showNetworkInfo={true}
        />
      )}
    </div>
  );
};

export default NetworkTab;