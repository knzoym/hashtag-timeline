import React from 'react';
import SearchPanel from './SearchPanel';

export const FloatingUI = ({
  // SearchPanel props
  searchTerm,
  highlightedEvents,
  onSearchChange,
  handleCreateTimeline,
  getTopTagsFromSearch,
  timelines,
  tempTimelines,
  isWikiMode,

  // Buttons props
  resetToInitialPosition,
  handleAddEventAtPosition,
}) => {
  return (
    <>
      {/* 左上の検索パネル */}
      <div
        className="no-pan"
        style={{
          position: 'absolute',
          left: '20px',
          top: '20px',
          zIndex: 30,
        }}
      >
        <SearchPanel
          searchTerm={searchTerm}
          highlightedEvents={highlightedEvents}
          onSearchChange={onSearchChange}
          onCreateTimeline={handleCreateTimeline}
          getTopTagsFromSearch={getTopTagsFromSearch}
          timelines={timelines}
          tempTimelines={tempTimelines}
          isWikiMode={isWikiMode}
        />
      </div>

      {/* 右下のボタン群 */}
      <div
        className="no-pan"
        style={{
          position: 'absolute',
          right: '20px',
          bottom: '20px',
          zIndex: 30,
          display: 'flex',
          gap: '10px',
        }}
      >
        <button
          onClick={resetToInitialPosition}
          style={{
            backgroundColor: '#6b7280', color: 'white', border: 'none',
            borderRadius: '8px', padding: '8px 12px', fontSize: '12px',
            cursor: 'pointer', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
          }}
          title="初期位置に戻す"
        >
          初期位置
        </button>

        <button
          onClick={() => handleAddEventAtPosition(window.innerWidth / 2, window.innerHeight / 2)}
          style={{
            backgroundColor: isWikiMode ? '#6b7280' : '#3b82f6', color: 'white',
            border: 'none', borderRadius: '50%', width: '56px', height: '56px',
            fontSize: '24px', cursor: isWikiMode ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', opacity: isWikiMode ? 0.5 : 1,
          }}
          title={isWikiMode ? 'Wikiでは承認申請が必要です' : 'イベントを追加'}
        >
          +
        </button>
      </div>
    </>
  );
};