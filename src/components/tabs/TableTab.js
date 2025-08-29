// components/tabs/TableTab.js - 年表ベース仮状態管理版
import React, { useState, useMemo, useCallback } from 'react';
import { EventModal } from '../modals/EventModal';
import TimelineModal from '../modals/TimelineModal';

// 年表ベースヘルパー関数
const getEventTimelineStatus = (event, timeline) => {
  if (!timeline || !event) return 'none';
  
  if (timeline.eventIds?.includes(event.id)) {
    return 'registered';
  }
  
  if (timeline.pendingEventIds?.includes(event.id)) {
    return 'pending';
  }
  
  if (timeline.removedEventIds?.includes(event.id)) {
    return 'removed';
  }
  
  return 'none';
};

const updateTimelineEventStatus = (timeline, eventId, newStatus) => {
  const updated = {
    ...timeline,
    eventIds: [...(timeline.eventIds || [])],
    pendingEventIds: [...(timeline.pendingEventIds || [])],
    removedEventIds: [...(timeline.removedEventIds || [])]
  };
  
  // 既存の関係をクリア
  updated.eventIds = updated.eventIds.filter(id => id !== eventId);
  updated.pendingEventIds = updated.pendingEventIds.filter(id => id !== eventId);
  updated.removedEventIds = updated.removedEventIds.filter(id => id !== eventId);
  
  // 新しい関係を設定
  switch (newStatus) {
    case 'registered':
      updated.eventIds.push(eventId);
      break;
    case 'pending':
      updated.pendingEventIds.push(eventId);
      break;
    case 'removed':
      updated.removedEventIds.push(eventId);
      break;
    case 'none':
      // 何もしない（既にクリア済み）
      break;
  }
  
  // 統計情報を更新
  updated.eventCount = updated.eventIds.length;
  updated.pendingCount = updated.pendingEventIds.length;
  updated.removedCount = updated.removedEventIds.length;
  updated.updatedAt = new Date().toISOString();
  
  return updated;
};

const TableTab = ({
  events = [],
  timelines = [],
  highlightedEvents = [],
  onEventUpdate,
  onEventDelete,
  onTimelineUpdate,
  onCloseEventModal,
  onCloseTimelineModal,
  isWikiMode = false
}) => {
  const [selectedEvent] = useState(null);
  const [selectedTimeline] = useState(null);
  const [selectedTimelineId, setSelectedTimelineId] = useState(null);
  const [showPendingEvents, setShowPendingEvents] = useState(true);
  const [showRemovedEvents, setShowRemovedEvents] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'startDate', direction: 'asc' });
  const [editingCell, setEditingCell] = useState(null);
  const [tempValue, setTempValue] = useState('');

  // 選択された年表オブジェクトを取得
  const selectedTimelineForFilter = useMemo(() => {
    return selectedTimelineId ? timelines.find(t => t.id === selectedTimelineId) : null;
  }, [selectedTimelineId, timelines]);

  // フィルタリングされたイベント（年表ベース）
  const filteredEvents = useMemo(() => {
    console.log('TableTab: フィルタリング開始', {
      totalEvents: events.length,
      selectedTimelineId,
      showPendingEvents,
      showRemovedEvents
    });

    let filtered = [...events];

    // 年表でフィルタリング
    if (selectedTimelineForFilter) {
      filtered = events.filter(event => {
        const status = getEventTimelineStatus(event, selectedTimelineForFilter);
        
        switch (status) {
          case 'registered':
            return true; // 正式登録は常に表示
          case 'pending':
            return showPendingEvents; // 仮登録は表示オプション
          case 'removed':
            return showRemovedEvents; // 仮削除は表示オプション
          case 'none':
          default:
            return false; // 関係なしは非表示
        }
      });
      
      console.log(`年表「${selectedTimelineForFilter.name}」フィルタ結果: ${filtered.length}件`);
    }

    console.log('TableTab: フィルタリング完了', { filteredCount: filtered.length });
    return filtered;
  }, [events, selectedTimelineForFilter, selectedTimelineId, showPendingEvents, showRemovedEvents]);

  // ソート処理
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // 日付の場合
      if (sortConfig.key === 'startDate' || sortConfig.key === 'endDate') {
        aValue = aValue ? new Date(aValue) : new Date(0);
        bValue = bValue ? new Date(bValue) : new Date(0);
      }
      // 文字列の場合
      else if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredEvents, sortConfig]);

  // ソート変更
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // インライン編集開始
  const startEditing = useCallback((eventId, field) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setEditingCell({ eventId, field });
      setTempValue(event[field] || '');
    }
  }, [events]);

  // インライン編集保存
  const saveEdit = useCallback(() => {
    if (!editingCell) return;

    const event = events.find(e => e.id === editingCell.eventId);
    if (event) {
      const updatedEvent = {
        ...event,
        [editingCell.field]: editingCell.field === 'tags' 
          ? tempValue.split(',').map(tag => tag.trim()).filter(tag => tag)
          : tempValue
      };
      onEventUpdate(updatedEvent);
    }

    setEditingCell(null);
    setTempValue('');
  }, [editingCell, events, onEventUpdate, tempValue]);

  // インライン編集キャンセル
  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setTempValue('');
  }, []);

  // 年表操作（年表ベース）
  const handleTimelineOperation = useCallback((event, timelineId, operation) => {
    console.log(`年表操作: ${operation} - イベント「${event.title}」, 年表ID: ${timelineId}`);

    const timeline = timelines.find(t => t.id === timelineId);
    if (!timeline) {
      console.error('年表が見つかりません:', timelineId);
      return;
    }

    const currentStatus = getEventTimelineStatus(event, timeline);
    let newStatus = 'none';

    switch (operation) {
      case 'temporary-remove':
        // 登録イベント → 仮削除
        newStatus = 'removed';
        break;
      case 'remove':
        // 仮登録・仮削除イベント → 完全削除
        newStatus = 'none';
        break;
      case 'register':
        // 仮削除・仮登録イベント → 正式登録
        newStatus = 'registered';
        break;
      default:
        console.warn(`Unknown timeline operation: ${operation}`);
        return;
    }

    const updatedTimeline = updateTimelineEventStatus(timeline, event.id, newStatus);
    onTimelineUpdate(timeline.id, updatedTimeline);
  }, [timelines, onTimelineUpdate]);

  // タイムラインチップのレンダリング（年表ベース）
  const renderTimelineChips = useCallback((event) => {
    const styles = getStyles();
    
    // 各年表での状態を表示
    const timelineStatuses = timelines.map(timeline => ({
      timeline,
      status: getEventTimelineStatus(event, timeline)
    })).filter(({status}) => status !== 'none');

    if (timelineStatuses.length === 0) {
      return <span style={styles.noTimeline}>未分類</span>;
    }

    return (
      <div style={styles.chipContainer}>
        {timelineStatuses.map(({timeline, status}) => {
          const chipStyles = {
            ...styles.chip,
            backgroundColor: status === 'registered' ? 'rgba(16, 185, 129, 0.1)' :
                             status === 'pending' ? 'rgba(245, 158, 11, 0.1)' :
                             'rgba(239, 68, 68, 0.1)',
            color: status === 'registered' ? '#059669' :
                   status === 'pending' ? '#d97706' :
                   '#dc2626',
            border: status === 'registered' ? '1px solid #10b981' :
                    status === 'pending' ? '1px dashed #f59e0b' :
                    '1px solid #ef4444'
          };

          const statusLabels = {
            registered: '',
            pending: ' (仮登録)',
            removed: ' (仮削除)'
          };

          return (
            <span
              key={timeline.id}
              style={chipStyles}
              title={`${timeline.name}${statusLabels[status]}`}
            >
              {timeline.name}{statusLabels[status]}
            </span>
          );
        })}
      </div>
    );
  }, [timelines]);

  // アクションボタンのレンダリング（年表ベース）
  const renderActionButtons = useCallback((event) => {
    const styles = getStyles();
    
    if (!selectedTimelineForFilter) return null;

    const status = getEventTimelineStatus(event, selectedTimelineForFilter);

    if (status === 'none') {
      return (
        <span style={{ color: '#9ca3af', fontSize: '12px' }}>
          未関連付け
        </span>
      );
    }

    switch (status) {
      case 'removed':
        // 仮削除状態 → 正式登録 または 完全削除
        return (
          <div style={styles.actionButtons}>
            <button
              style={{ ...styles.actionButton, ...styles.registerButton }}
              onClick={() => handleTimelineOperation(event, selectedTimelineId, 'register')}
              title="正式登録"
            >
              登録
            </button>
            <button
              style={{ ...styles.actionButton, ...styles.removeButton }}
              onClick={() => handleTimelineOperation(event, selectedTimelineId, 'remove')}
              title="完全削除"
            >
              削除
            </button>
          </div>
        );
      
      case 'pending':
        // 仮登録状態 → 正式登録 または 削除
        return (
          <div style={styles.actionButtons}>
            <button
              style={{ ...styles.actionButton, ...styles.registerButton }}
              onClick={() => handleTimelineOperation(event, selectedTimelineId, 'register')}
              title="正式登録"
            >
              登録
            </button>
            <button
              style={{ ...styles.actionButton, ...styles.removeButton }}
              onClick={() => handleTimelineOperation(event, selectedTimelineId, 'remove')}
              title="削除"
            >
              削除
            </button>
          </div>
        );
      
      case 'registered':
      default:
        // 正式登録状態 → 仮削除
        return (
          <div style={styles.actionButtons}>
            <button
              style={{ ...styles.actionButton, ...styles.temporaryRemoveButton }}
              onClick={() => handleTimelineOperation(event, selectedTimelineId, 'temporary-remove')}
              title="仮削除"
            >
              仮削除
            </button>
          </div>
        );
    }
  }, [selectedTimelineForFilter, selectedTimelineId, handleTimelineOperation]);

  // スタイル定義を関数化
  const getStyles = () => ({
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#ffffff'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb',
      flexWrap: 'wrap',
      gap: '12px'
    },
    controls: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      flexWrap: 'wrap'
    },
    timelineSelect: {
      padding: '8px 12px',
      borderRadius: '6px',
      border: '1px solid #d1d5db',
      backgroundColor: 'white',
      minWidth: '200px'
    },
    checkboxGroup: {
      display: 'flex',
      gap: '16px'
    },
    checkboxContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    checkbox: {
      width: '16px',
      height: '16px'
    },
    checkboxLabel: {
      fontSize: '14px',
      color: '#374151'
    },
    stats: {
      fontSize: '14px',
      color: '#6b7280'
    },
    tableContainer: {
      flex: 1,
      overflow: 'auto'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    headerCell: {
      padding: '12px',
      textAlign: 'left',
      borderBottom: '2px solid #e5e7eb',
      backgroundColor: '#f3f4f6',
      fontWeight: '600',
      fontSize: '14px',
      cursor: 'pointer',
      userSelect: 'none'
    },
    headerCellSorted: {
      backgroundColor: '#e0e7ff',
      color: '#3730a3'
    },
    cell: {
      padding: '12px',
      borderBottom: '1px solid #e5e7eb',
      fontSize: '14px'
    },
    cellHighlighted: {
      backgroundColor: '#fef3c7'
    },
    cellEditing: {
      backgroundColor: '#eff6ff'
    },
    dateCell: {
      width: '120px',
      textAlign: 'center'
    },
    tagList: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px'
    },
    tag: {
      backgroundColor: '#e0e7ff',
      color: '#3730a3',
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '12px'
    },
    chipContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px'
    },
    chip: {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500'
    },
    noTimeline: {
      color: '#9ca3af',
      fontSize: '12px',
      fontStyle: 'italic'
    },
    actionCell: {
      width: '120px',
      textAlign: 'center'
    },
    actionButtons: {
      display: 'flex',
      gap: '6px',
      justifyContent: 'center'
    },
    actionButton: {
      padding: '4px 8px',
      border: 'none',
      borderRadius: '4px',
      fontSize: '12px',
      cursor: 'pointer',
      fontWeight: '500'
    },
    registerButton: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    temporaryRemoveButton: {
      backgroundColor: '#f59e0b',
      color: 'white'
    },
    removeButton: {
      backgroundColor: '#ef4444',
      color: 'white'
    },
    editInput: {
      width: '100%',
      padding: '4px',
      border: '1px solid #d1d5db',
      borderRadius: '4px'
    },
    editButtons: {
      display: 'flex',
      gap: '4px',
      marginTop: '4px'
    },
    editButton: {
      padding: '2px 6px',
      border: 'none',
      borderRadius: '3px',
      cursor: 'pointer',
      fontSize: '12px'
    },
    saveButton: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    cancelButton: {
      backgroundColor: '#6b7280',
      color: 'white'
    }
  });

  const styles = getStyles();

  return (
    <div style={styles.container}>
      {/* ヘッダーコントロール */}
      <div style={styles.header}>
        <div style={styles.controls}>
          {/* タイムライン選択 */}
          <select
            style={styles.timelineSelect}
            value={selectedTimelineId || ''}
            onChange={(e) => setSelectedTimelineId(e.target.value || null)}
          >
            <option value="">全ての年表</option>
            {timelines.filter(t => t.isVisible).map(timeline => (
              <option key={timeline.id} value={timeline.id}>
                {timeline.name} ({(timeline.eventIds?.length || 0)}件)
              </option>
            ))}
          </select>

          {/* 表示オプション */}
          {selectedTimelineForFilter && (
            <div style={styles.checkboxGroup}>
              <div style={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  id="showPending"
                  style={styles.checkbox}
                  checked={showPendingEvents}
                  onChange={(e) => setShowPendingEvents(e.target.checked)}
                />
                <label htmlFor="showPending" style={styles.checkboxLabel}>
                  仮登録 ({selectedTimelineForFilter.pendingEventIds?.length || 0})
                </label>
              </div>
              
              <div style={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  id="showRemoved"
                  style={styles.checkbox}
                  checked={showRemovedEvents}
                  onChange={(e) => setShowRemovedEvents(e.target.checked)}
                />
                <label htmlFor="showRemoved" style={styles.checkboxLabel}>
                  仮削除 ({selectedTimelineForFilter.removedEventIds?.length || 0})
                </label>
              </div>
            </div>
          )}
        </div>

        {/* 統計情報 */}
        <div style={styles.stats}>
          {filteredEvents.length}件のイベント
          {selectedTimelineForFilter && ` (${selectedTimelineForFilter.name})`}
        </div>
      </div>

      {/* テーブル */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th 
                style={{
                  ...styles.headerCell,
                  ...(sortConfig.key === 'title' ? styles.headerCellSorted : {})
                }}
                onClick={() => handleSort('title')}
              >
                タイトル {sortConfig.key === 'title' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                style={{
                  ...styles.headerCell,
                  ...(sortConfig.key === 'startDate' ? styles.headerCellSorted : {})
                }}
                onClick={() => handleSort('startDate')}
              >
                開始日 {sortConfig.key === 'startDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                style={{
                  ...styles.headerCell,
                  ...(sortConfig.key === 'endDate' ? styles.headerCellSorted : {})
                }}
                onClick={() => handleSort('endDate')}
              >
                終了日 {sortConfig.key === 'endDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th style={styles.headerCell}>タグ</th>
              <th style={styles.headerCell}>所属年表</th>
              {selectedTimelineForFilter && (
                <th style={styles.headerCell}>状態 / 操作</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedEvents.map(event => {
              const isHighlighted = Array.isArray(highlightedEvents) ?
                highlightedEvents.some(e => e.id === event.id) :
                highlightedEvents.has && highlightedEvents.has(event.id);

              return (
                <tr key={event.id}>
                  {/* タイトル */}
                  <td style={{
                    ...styles.cell,
                    ...(isHighlighted ? styles.cellHighlighted : {}),
                    ...(editingCell?.eventId === event.id && editingCell?.field === 'title' ? styles.cellEditing : {})
                  }}>
                    {editingCell?.eventId === event.id && editingCell?.field === 'title' ? (
                      <div>
                        <input
                          type="text"
                          style={styles.editInput}
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit();
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          autoFocus
                        />
                        <div style={styles.editButtons}>
                          <button 
                            style={{ ...styles.editButton, ...styles.saveButton }}
                            onClick={saveEdit}
                          >
                            ✓
                          </button>
                          <button 
                            style={{ ...styles.editButton, ...styles.cancelButton }}
                            onClick={cancelEdit}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span 
                        style={{ cursor: 'pointer' }}
                        onClick={() => startEditing(event.id, 'title')}
                        title="クリックして編集"
                      >
                        {event.title || '(無題)'}
                      </span>
                    )}
                  </td>

                  {/* 開始日 */}
                  <td style={{ ...styles.cell, ...styles.dateCell }}>
                    {event.startDate ? new Date(event.startDate).toLocaleDateString('ja-JP') : '-'}
                  </td>

                  {/* 終了日 */}
                  <td style={{ ...styles.cell, ...styles.dateCell }}>
                    {event.endDate ? new Date(event.endDate).toLocaleDateString('ja-JP') : '-'}
                  </td>

                  {/* タグ */}
                  <td style={styles.cell}>
                    {event.tags && event.tags.length > 0 ? (
                      <div style={styles.tagList}>
                        {event.tags.map((tag, index) => (
                          <span key={index} style={styles.tag}>#{tag}</span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '12px' }}>タグなし</span>
                    )}
                  </td>

                  {/* 所属年表 */}
                  <td style={styles.cell}>
                    {renderTimelineChips(event)}
                  </td>

                  {/* 状態 / 操作 */}
                  {selectedTimelineForFilter && (
                    <td style={styles.cell}>
                      {renderActionButtons(event)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {sortedEvents.length === 0 && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '16px'
          }}>
            {selectedTimelineForFilter ? 
              '選択された年表にイベントがありません' : 
              'イベントがありません'}
          </div>
        )}
      </div>

      {/* モーダル */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={onCloseEventModal}
          onUpdate={onEventUpdate}
          onDelete={onEventDelete}
          isWikiMode={isWikiMode}
        />
      )}

      {selectedTimeline && (
        <TimelineModal
          timeline={selectedTimeline}
          events={events}
          onClose={onCloseTimelineModal}
          onUpdate={onTimelineUpdate}
          onEventStatusChange={(timelineId, eventId, newStatus) => {
            const timeline = timelines.find(t => t.id === timelineId);
            if (timeline) {
              const updatedTimeline = updateTimelineEventStatus(timeline, eventId, newStatus);
              onTimelineUpdate(timelineId, updatedTimeline);
            }
          }}
          isWikiMode={isWikiMode}
        />
      )}
    </div>
  );
};

export default TableTab;