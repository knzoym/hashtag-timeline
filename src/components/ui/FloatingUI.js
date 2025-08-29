import React, { useState, useMemo } from 'react';
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
  handleManualTimelineUpdate,
  displayTimelines,
}) => {
  const [updateStatus, setUpdateStatus] = useState(null);

  // モード別の表示年表を決定
  const { displayTimelinesForUI, displayTempTimelinesForUI } = useMemo(() => {
    if (isWikiMode) {
      // Wikiモード: tempTimelinesのみ表示
      return {
        displayTimelinesForUI: [],
        displayTempTimelinesForUI: tempTimelines
      };
    } else {
      // 個人モード: timelinesのみ表示
      return {
        displayTimelinesForUI: timelines,
        displayTempTimelinesForUI: []
      };
    }
  }, [isWikiMode, timelines, tempTimelines]);

  // 更新ボタンのクリック処理
  const handleUpdateClick = async () => {
    setUpdateStatus('updating');
    
    try {
      const result = await handleManualTimelineUpdate();
      
      if (result.updatedCount > 0) {
        setUpdateStatus('success');
        setTimeout(() => setUpdateStatus(null), 2000);
      } else {
        setUpdateStatus('no_updates');
        setTimeout(() => setUpdateStatus(null), 1500);
      }
    } catch (error) {
      console.error('年表更新エラー:', error);
      setUpdateStatus('error');
      setTimeout(() => setUpdateStatus(null), 2000);
    }
  };

  // 更新が必要な年表があるかチェック（表示用）
  const hasUpdatableTimelines = displayTimelines?.some(timeline => 
    timeline.tags && timeline.tags.length > 0 && timeline.createdFrom !== 'search_result'
  );

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
          timelines={displayTimelinesForUI} // モード別の年表データ
          tempTimelines={displayTempTimelinesForUI} // モード別の一時年表データ
          isWikiMode={isWikiMode}
        />
      </div>

      {/* 右上の更新ボタン（目立たない位置） */}
      {hasUpdatableTimelines && (
        <div
          className="no-pan"
          style={{
            position: 'absolute',
            right: '20px',
            top: '20px',
            zIndex: 25, // 検索パネルより下
          }}
        >
          <button
            onClick={handleUpdateClick}
            disabled={updateStatus === 'updating'}
            style={{
              backgroundColor: updateStatus === 'success' ? '#10b981' : 
                              updateStatus === 'error' ? '#ef4444' :
                              updateStatus === 'no_updates' ? '#6b7280' : '#f3f4f6',
              color: updateStatus === 'success' || updateStatus === 'error' ? 'white' :
                     updateStatus === 'no_updates' ? 'white' : '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '11px',
              cursor: updateStatus === 'updating' ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              opacity: updateStatus === 'updating' ? 0.7 : 1,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              minWidth: '70px',
              justifyContent: 'center',
            }}
            title="タグ条件に基づいて年表を更新"
          >
            {updateStatus === 'updating' && (
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  border: '2px solid transparent',
                  borderTop: '2px solid currentColor',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
            )}
            <span>
              {updateStatus === 'updating' ? '更新中...' :
               updateStatus === 'success' ? '更新完了' :
               updateStatus === 'error' ? 'エラー' :
               updateStatus === 'no_updates' ? '更新なし' :
               '年表更新'}
            </span>
          </button>
        </div>
      )}

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
            backgroundColor: '#6b7280', 
            color: 'white', 
            border: 'none',
            borderRadius: '8px', 
            padding: '8px 12px', 
            fontSize: '12px',
            cursor: 'pointer', 
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
          }}
          title="初期位置に戻す"
        >
          初期位置
        </button>

        <button
          onClick={() => handleAddEventAtPosition(window.innerWidth / 2, window.innerHeight / 2)}
          style={{
            backgroundColor: isWikiMode ? '#6b7280' : '#3b82f6', 
            color: 'white',
            border: 'none', 
            borderRadius: '50%', 
            width: '56px', 
            height: '56px',
            fontSize: '24px', 
            cursor: isWikiMode ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)', 
            display: 'flex',
            alignItems: 'center', 
            justifyContent: 'center', 
            opacity: isWikiMode ? 0.5 : 1,
          }}
          title={isWikiMode ? 'Wikiでは承認申請が必要です' : 'イベントを追加'}
        >
          +
        </button>
      </div>

      {/* アニメーション用CSS */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};