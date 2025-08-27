// src/components/tabs/TableTab.js
import React, { useState, useMemo } from 'react';
import { EventModal } from '../modals/EventModal';
import TimelineModal from '../modals/TimelineModal';

const TableTab = ({
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
  
  // 検索とフィルタリング
  searchTerm = '',
  onSearchChange,
  highlightedEvents = [],
  
  // モーダル関連
  selectedEvent,
  selectedTimeline,
  onCloseEventModal,
  onCloseTimelineModal
}) => {
  const [selectedTimelineId, setSelectedTimelineId] = useState(null);
  const [showTemporaryEvents, setShowTemporaryEvents] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'startDate', direction: 'asc' });
  const [editingCell, setEditingCell] = useState(null);
  const [tempValue, setTempValue] = useState('');
  
  // 選択されたタイムライン
  const selectedTimelineForFilter = useMemo(() => {
    return selectedTimelineId ? timelines.find(t => t.id === selectedTimelineId) : null;
  }, [selectedTimelineId, timelines]);
  
  // フィルタリングされたイベント
  const filteredEvents = useMemo(() => {
    let filtered = events;
    
    // タイムライン選択による絞り込み
    if (selectedTimelineForFilter) {
      filtered = filtered.filter(event => {
        const timelineInfo = event.timelineInfos?.find(info => 
          info.timelineId === selectedTimelineForFilter.id
        );
        return timelineInfo && (showTemporaryEvents || !timelineInfo.isTemporary);
      });
    }
    
    // 検索による絞り込み
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        event.title?.toLowerCase().includes(term) ||
        event.description?.toLowerCase().includes(term) ||
        event.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    return filtered;
  }, [events, selectedTimelineForFilter, showTemporaryEvents, searchTerm]);
  
  // ソート済みイベント
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (sortConfig.key === 'startDate' || sortConfig.key === 'endDate') {
        const aDate = aValue ? new Date(aValue) : new Date(0);
        const bDate = bValue ? new Date(bValue) : new Date(0);
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortConfig.direction === 'asc' 
        ? (aValue || 0) - (bValue || 0)
        : (bValue || 0) - (aValue || 0);
    });
  }, [filteredEvents, sortConfig]);
  
  // ソートハンドラー
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  // インライン編集開始
  const startEditing = (eventId, field) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setEditingCell({ eventId, field });
      setTempValue(event[field] || '');
    }
  };
  
  // インライン編集保存
  const saveEdit = () => {
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
  };
  
  // インライン編集キャンセル
  const cancelEdit = () => {
    setEditingCell(null);
    setTempValue('');
  };
  
  // 年表操作（仮登録・削除・登録）
  const handleTimelineOperation = (event, timelineId, operation) => {
    const updatedTimelineInfos = [...(event.timelineInfos || [])];
    const existingIndex = updatedTimelineInfos.findIndex(info => info.timelineId === timelineId);
    
    switch (operation) {
      case 'temporary-remove':
        // 登録イベント → 仮削除
        if (existingIndex >= 0) {
          updatedTimelineInfos[existingIndex] = { 
            ...updatedTimelineInfos[existingIndex], 
            isTemporary: true 
          };
        }
        break;
      case 'remove':
        // 仮登録イベント → 削除
        if (existingIndex >= 0) {
          updatedTimelineInfos.splice(existingIndex, 1);
        }
        break;
      case 'register':
        // 仮削除イベント → 登録
        if (existingIndex >= 0) {
          updatedTimelineInfos[existingIndex] = { 
            ...updatedTimelineInfos[existingIndex], 
            isTemporary: false 
          };
        }
        break;
      default:
        // 不正な操作の場合は何もしない
        console.warn(`Unknown timeline operation: ${operation}`);
        return;
    }
    
    onEventUpdate({ ...event, timelineInfos: updatedTimelineInfos });
  };
  
  // タイムラインチップのレンダリング
  const renderTimelineChips = (event) => {
    if (!event.timelineInfos || event.timelineInfos.length === 0) {
      return <span style={styles.noTimeline}>未分類</span>;
    }
    
    return (
      <div style={styles.chipContainer}>
        {event.timelineInfos.map(info => {
          const timeline = timelines.find(t => t.id === info.timelineId);
          if (!timeline) return null;
          
          return (
            <span
              key={info.timelineId}
              style={{
                ...styles.chip,
                backgroundColor: info.isTemporary ? 'rgba(107, 114, 128, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                color: info.isTemporary ? '#6b7280' : '#3b82f6',
                border: info.isTemporary ? '1px dashed #d1d5db' : '1px solid #bfdbfe'
              }}
              title={info.isTemporary ? '仮削除済み' : '登録済み'}
            >
              {timeline.name}
              {info.isTemporary && ' (仮削除)'}
            </span>
          );
        })}
      </div>
    );
  };
  
  // 操作ボタンのレンダリング
  const renderActionButtons = (event) => {
    if (!selectedTimelineForFilter) return null;
    
    const timelineInfo = event.timelineInfos?.find(info => 
      info.timelineId === selectedTimelineForFilter.id
    );
    
    if (!timelineInfo) return null;
    
    return (
      <div style={styles.actionButtons}>
        {!timelineInfo.isTemporary ? (
          <button
            style={{ ...styles.actionButton, ...styles.temporaryRemoveButton }}
            onClick={() => handleTimelineOperation(event, selectedTimelineForFilter.id, 'temporary-remove')}
            title="仮削除"
          >
            ⏸️
          </button>
        ) : (
          <>
            <button
              style={{ ...styles.actionButton, ...styles.registerButton }}
              onClick={() => handleTimelineOperation(event, selectedTimelineForFilter.id, 'register')}
              title="登録"
            >
              ✅
            </button>
            <button
              style={{ ...styles.actionButton, ...styles.removeButton }}
              onClick={() => handleTimelineOperation(event, selectedTimelineForFilter.id, 'remove')}
              title="完全削除"
            >
              🗑️
            </button>
          </>
        )}
      </div>
    );
  };
  
  const styles = {
    container: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#f8fafc'
    },
    
    // ヘッダーコントロール
    header: {
      padding: '16px 20px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      flexWrap: 'wrap'
    },
    
    // タイムライン選択
    timelineSelect: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      backgroundColor: '#ffffff',
      fontSize: '14px',
      minWidth: '200px'
    },
    
    // チェックボックス
    checkboxContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    
    checkbox: {
      width: '16px',
      height: '16px'
    },
    
    // 統計情報
    stats: {
      marginLeft: 'auto',
      fontSize: '14px',
      color: '#6b7280'
    },
    
    // テーブル
    tableContainer: {
      flex: 1,
      overflow: 'auto',
      backgroundColor: '#ffffff'
    },
    
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px'
    },
    
    // ヘッダー
    headerCell: {
      padding: '12px 16px',
      backgroundColor: '#f9fafb',
      border: '1px solid #e5e7eb',
      textAlign: 'left',
      fontWeight: '600',
      color: '#374151',
      cursor: 'pointer',
      userSelect: 'none',
      position: 'sticky',
      top: 0,
      zIndex: 10
    },
    
    headerCellSorted: {
      backgroundColor: '#e5e7eb'
    },
    
    // テーブルセル
    cell: {
      padding: '12px 16px',
      border: '1px solid #e5e7eb',
      verticalAlign: 'top',
      position: 'relative'
    },
    
    cellHighlighted: {
      backgroundColor: '#fef3c7'
    },
    
    cellEditing: {
      padding: '8px',
      backgroundColor: '#f0f9ff'
    },
    
    // インライン編集
    editInput: {
      width: '100%',
      padding: '4px 8px',
      border: '2px solid #3b82f6',
      borderRadius: '4px',
      fontSize: '14px',
      outline: 'none'
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
      fontSize: '12px',
      cursor: 'pointer'
    },
    
    saveButton: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    
    cancelButton: {
      backgroundColor: '#6b7280',
      color: 'white'
    },
    
    // チップ
    chipContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px'
    },
    
    chip: {
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500',
      whiteSpace: 'nowrap'
    },
    
    noTimeline: {
      color: '#9ca3af',
      fontSize: '12px',
      fontStyle: 'italic'
    },
    
    // 操作ボタン
    actionButtons: {
      display: 'flex',
      gap: '4px'
    },
    
    actionButton: {
      padding: '4px 8px',
      border: 'none',
      borderRadius: '4px',
      fontSize: '12px',
      cursor: 'pointer',
      transition: 'opacity 0.2s'
    },
    
    temporaryRemoveButton: {
      backgroundColor: 'rgba(251, 191, 36, 0.1)',
      color: '#f59e0b'
    },
    
    registerButton: {
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      color: '#10b981'
    },
    
    removeButton: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      color: '#ef4444'
    },
    
    // タグ表示
    tagList: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px'
    },
    
    tag: {
      padding: '2px 6px',
      backgroundColor: '#f3f4f6',
      color: '#6b7280',
      borderRadius: '8px',
      fontSize: '11px'
    },
    
    // 日付表示
    dateCell: {
      whiteSpace: 'nowrap',
      color: '#374151'
    },
    
    // アクション列
    actionCell: {
      width: '120px',
      textAlign: 'center'
    }
  };
  
  return (
    <div style={styles.container}>
      {/* ヘッダーコントロール */}
      <div style={styles.header}>
        {/* タイムライン選択 */}
        <select
          style={styles.timelineSelect}
          value={selectedTimelineId || ''}
          onChange={(e) => setSelectedTimelineId(e.target.value || null)}
        >
          <option value="">全ての年表</option>
          {timelines.filter(t => t.isVisible).map(timeline => (
            <option key={timeline.id} value={timeline.id}>
              {timeline.name}
            </option>
          ))}
        </select>
        
        {/* 仮削除イベント表示オプション */}
        {selectedTimelineForFilter && (
          <div style={styles.checkboxContainer}>
            <input
              type="checkbox"
              id="showTemporary"
              style={styles.checkbox}
              checked={showTemporaryEvents}
              onChange={(e) => setShowTemporaryEvents(e.target.checked)}
            />
            <label htmlFor="showTemporary">仮削除イベントも表示</label>
          </div>
        )}
        
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
                <th style={{ ...styles.headerCell, ...styles.actionCell }}>操作</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedEvents.map(event => {
              const isHighlighted = Array.isArray(highlightedEvents) ?
                highlightedEvents.includes(event.id) :
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
                  
                  {/* 操作 */}
                  {selectedTimelineForFilter && (
                    <td style={{ ...styles.cell, ...styles.actionCell }}>
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
            {searchTerm ? '検索条件に一致するイベントがありません' : 'イベントがありません'}
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
          onClose={onCloseTimelineModal}
          onUpdate={onTimelineUpdate}
          isWikiMode={isWikiMode}
        />
      )}
    </div>
  );
};

export default TableTab;