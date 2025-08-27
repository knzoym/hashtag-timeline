// // src/pages/App.js - 統合されたメインアプリケーション
// import React, { useRef, useCallback, useState, useEffect } from 'react';
// import { PageModeProvider, usePageMode } from '../contexts/PageModeContext';
// import Header from '../components/common/Header';
// import TabSystem from '../components/common/TabSystem';
// import MyPage from '../components/personal/MyPage';
// import Sidebar from '../components/layout/Sidebar';

// // フック類
// import { useTimelineLogic } from '../hooks/useTimelineLogic';
// import { useDragDrop } from '../hooks/useDragDrop';
// import { useAuth } from '../hooks/useAuth';
// import { useSupabaseSync } from '../hooks/useSupabaseSync';
// import { useWikiData } from '../hooks/useWikiData';
// import { useIsDesktop } from '../hooks/useMediaQuery';

// // UIコンポーネント
// import { SearchPanel } from '../components/ui/SearchPanel';
// import { TimelineCard } from '../components/ui/TimelineCard';
// import { EventGroupIcon, GroupTooltip, GroupCard } from '../components/ui/EventGroup';


// // モーダル類
// import { EventModal } from '../components/modals/EventModal';
// import TimelineModal from '../components/modals/TimelineModal';

// // その他のコンポーネント
// import TimelineErrorBoundary from '../components/common/TimelineErrorBoundary';

// // スタイル・設定
// import { createTimelineStyles } from '../styles/timelineStyles';
// import { APP_CONFIG } from '../constants/appConfig';

// const AppContent = () => {
//   const {
//     currentPageMode,
//     currentTab,
//     currentFileName,
//     changePageMode,
//     changeTab,
//     updateFileName,
//     getPageModeInfo,
//     PAGE_MODES
//   } = usePageMode();
  
//   const { isPersonalMode, isWikiMode, isMyPageMode } = getPageModeInfo();
  
//   // 認証
//   const { user, loading: authLoading, signInWithGoogle, signOut, isAuthenticated } = useAuth();
  
//   // Supabase同期
//   const {
//     saveTimelineData,
//     getUserTimelines,
//     deleteTimeline: deleteTimelineFile,
//     upsertProfile,
//     loading: syncLoading,
//   } = useSupabaseSync(user);
  
//   // Wiki関連
//   const wikiData = useWikiData(user);
  
//   // デスクトップ判定
//   const isDesktop = useIsDesktop();
  
//   // サイドバー状態
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
  
//   // タイムライン関連の参照とロジック
//   const timelineRef = useRef(null);
//   const [isDragging, setIsDragging] = useState(false);
//   const [lastMouseX, setLastMouseX] = useState(0);
//   const [lastMouseY, setLastMouseY] = useState(0);
//   const [isShiftPressed, setIsShiftPressed] = useState(false);
  
//   // タイムラインロジック
//   const {
//     events,
//     setEvents,
//     Timelines,
//     setCreatedTimelines,
//     scale,
//     setScale,
//     panX,
//     setPanX,
//     panY,
//     setPanY,
//     currentPixelsPerYear,
//     searchTerm,
//     setSearchTerm,
//     highlightedEvents,
//     setHighlightedEvents,
//     selectedEvent,
//     setSelectedEvent,
//     selectedTimeline,
//     setSelectedTimeline,
//     hoveredGroup,
//     setHoveredGroup,
    
//     // イベント・年表操作
//     addEvent,
//     updateEvent,
//     deleteEvent,
//     createTimeline,
//     deleteTimeline,
//     updateTimeline,
    
//     // UI操作
//     openNewEventModal,
//     openEventModal,
//     closeEventModal,
//     openTimelineModal,
//     closeTimelineModal,
//     resetToInitialPosition,
    
//     // 検索・タグ操作
//     handleSearchChange,
//     getTopTagsFromSearch,
    
//     // テキスト幅計算
//     calculateTextWidth,
//   } = useTimelineLogic(
//     timelineRef,
//     isDragging,
//     lastMouseX,
//     lastMouseY,
//     isShiftPressed
//   );
  
//   // ドラッグ&ドロップ
//   const {
//     handleWheel,
//     handleMouseDown,
//     handleMouseMove,
//     handleMouseUp,
//     handleDoubleClick,
//     handleDragMouseDown
//   } = useDragDrop({
//     scale,
//     setScale,
//     panX,
//     setPanX,
//     panY,
//     setPanY,
//     setIsDragging,
//     setLastMouseX,
//     setLastMouseY,
//     openNewEventModal,
//     openEventModal
//   });
  
//   // キーボードイベント
//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       setIsShiftPressed(e.shiftKey);
      
//       // ショートカットキー
//       if (e.ctrlKey || e.metaKey) {
//         switch (e.key) {
//           case 's':
//             e.preventDefault();
//             handleSave();
//             break;
//           case 'n':
//             e.preventDefault();
//             handleNew();
//             break;
//           case 'o':
//             e.preventDefault();
//             if (isAuthenticated) {
//               changePageMode(PAGE_MODES.MYPAGE);
//             }
//             break;
//         }
//       }
//     };
    
//     const handleKeyUp = (e) => {
//       setIsShiftPressed(e.shiftKey);
//     };
    
//     window.addEventListener('keydown', handleKeyDown);
//     window.addEventListener('keyup', handleKeyUp);
    
//     return () => {
//       window.removeEventListener('keydown', handleKeyDown);
//       window.removeEventListener('keyup', handleKeyUp);
//     };
//   }, [isAuthenticated, changePageMode, PAGE_MODES.MYPAGE]);
  
//   // ファイル操作
//   const handleNew = useCallback(() => {
//     if (events.length > 0 || Timelines.length > 0) {
//       if (!window.confirm('現在の作業内容が失われますが、よろしいですか？')) {
//         return;
//       }
//     }
    
//     setEvents([]);
//     setCreatedTimelines([]);
//     updateFileName(null);
//     resetToInitialPosition();
//   }, [events.length, Timelines.length, setEvents, setCreatedTimelines, updateFileName, resetToInitialPosition]);
  
//   const handleSave = useCallback(async () => {
//     if (!isAuthenticated || isSaving) return;
    
//     setIsSaving(true);
//     try {
//       const timelineData = {
//         events: events,
//         timelines: Timelines,
//         version: "1.0",
//         savedAt: new Date().toISOString(),
//       };
      
//       const title = currentFileName || `年表 ${new Date().toLocaleDateString("ja-JP")}`;
//       const result = await saveTimelineData(timelineData, title);
      
//       if (result) {
//         updateFileName(title);
//         console.log('ファイルを保存しました');
//       } else {
//         alert('保存に失敗しました');
//       }
//     } finally {
//       setIsSaving(false);
//     }
//   }, [isAuthenticated, events, Timelines, currentFileName, saveTimelineData, updateFileName, isSaving]);
  
//   const handleLoadTimeline = useCallback((timelineData) => {
//     if (timelineData.events) {
//       const eventsWithDates = timelineData.events.map((event) => ({
//         ...event,
//         startDate: new Date(event.startDate),
//         endDate: new Date(event.endDate),
//       }));
//       setEvents(eventsWithDates);
//     }
    
//     if (timelineData.timelines) {
//       const timelinesWithDates = timelineData.timelines.map((timeline) => ({
//         ...timeline,
//         events: timeline.events?.map((event) => ({
//           ...event,
//           startDate: new Date(event.startDate),
//           endDate: new Date(event.endDate),
//         })) || [],
//         temporaryEvents: timeline.temporaryEvents?.map((event) => ({
//           ...event,
//           startDate: new Date(event.startDate),
//           endDate: new Date(event.endDate),
//         })) || [],
//         removedEvents: timeline.removedEvents?.map((event) => ({
//           ...event,
//           startDate: new Date(event.startDate),
//           endDate: new Date(event.endDate),
//         })) || [],
//       }));
//       setCreatedTimelines(timelinesWithDates);
//     }
    
//     if (timelineData.fileName) {
//       updateFileName(timelineData.fileName);
//     }
    
//     changePageMode(PAGE_MODES.PERSONAL);
//   }, [setEvents, setCreatedTimelines, updateFileName, changePageMode, PAGE_MODES.PERSONAL]);
  
//   // Wikiイベントインポート
//   const handleWikiEventImport = useCallback((wikiEvent) => {
//     setEvents((prevEvents) => [...prevEvents, wikiEvent]);
//   }, [setEvents]);
  
//   // メニューアクション処理
//   const handleMenuAction = useCallback((actionId) => {
//     switch (actionId) {
//       case 'new':
//         handleNew();
//         break;
//       case 'save':
//         handleSave();
//         break;
//       case 'add-event':
//         openNewEventModal();
//         break;
//       case 'reset-view':
//         resetToInitialPosition();
//         break;
//       // その他のメニューアクション...
//       default:
//         console.log(`Menu action: ${actionId}`);
//     }
//   }, [handleNew, handleSave, openNewEventModal, resetToInitialPosition]);
  
//   // サイドバーメニューハンドラー
//   const handleSidebarMenuClick = useCallback((itemId, section) => {
//     handleMenuAction(itemId);
//     if (isDesktop) {
//       setSidebarOpen(false);
//     }
//   }, [handleMenuAction, isDesktop]);
  
//   // タブシステム用のprops
//   const tabSystemProps = {
//     events,
//     timelines: Timelines,
//     user,
//     onEventUpdate: updateEvent,
//     onEventDelete: deleteEvent,
//     onTimelineUpdate: updateTimeline,
//     onAddEvent: addEvent,
    
//     // Timeline/Network固有
//     timelineRef,
//     scale,
//     panX,
//     panY,
//     currentPixelsPerYear,
//     onWheel: handleWheel,
//     onMouseDown: handleMouseDown,
//     onMouseMove: handleMouseMove,
//     onMouseUp: handleMouseUp,
//     onDoubleClick: handleDoubleClick,
//     highlightedEvents,
//     searchTerm,
//     onSearchChange: handleSearchChange,
    
//     // Wiki関連
//     wikiData,
//     showPendingEvents: false, // 実際の状態から取得
    
//     // その他
//     onResetView: resetToInitialPosition,
//     onMenuAction: handleMenuAction,
//     selectedEvent,
//     selectedTimeline,
//     onCloseEventModal: closeEventModal,
//     onCloseTimelineModal: closeTimelineModal,
//     hoveredGroup,
//     setHoveredGroup,
    
//     // 検索・年表関連
//     onCreateTimeline: createTimeline,
//     onDeleteTimeline: deleteTimeline,
//     getTopTagsFromSearch
//   };
  
//   const styles = createTimelineStyles();
  
//   return (
//     <div style={styles.appContainer}>
//       {/* サイドバー（デスクトップのみ） */}
//       {isDesktop && (
//         <Sidebar
//           isOpen={sidebarOpen}
//           onToggle={() => setSidebarOpen(!sidebarOpen)}
//           onMenuItemClick={handleSidebarMenuClick}
//           currentUser={user}
//           isSaving={isSaving}
//           canSave={events.length > 0 || Timelines.length > 0}
//         />
//       )}
      
//       {/* メインコンテンツエリア */}
//       <div style={{
//         marginLeft: isDesktop ? (sidebarOpen ? 260 : 60) : 0,
//         transition: "margin-left 0.3s ease",
//         width: isDesktop ? `calc(100% - ${sidebarOpen ? 260 : 60}px)` : "100%",
//         height: "100vh",
//         display: "flex",
//         flexDirection: "column",
//       }}>
//         {/* ヘッダー */}
//         <Header
//           user={user}
//           isAuthenticated={isAuthenticated}
//           onSignIn={signInWithGoogle}
//           onSignOut={signOut}
//           onMenuAction={handleMenuAction}
//           isSaving={isSaving}
//         />
        
//         {/* メインコンテンツ */}
//         {isMyPageMode ? (
//           <MyPage
//             user={user}
//             supabaseSync={{ getUserTimelines, deleteTimelineFile }}
//             onLoadTimeline={handleLoadTimeline}
//             onBackToTimeline={() => changePageMode(PAGE_MODES.PERSONAL)}
//           />
//         ) : (
//           <TabSystem {...tabSystemProps} />
//         )}
//       </div>
//     </div>
//   );
// };

// // メインアプリケーションコンポーネント（コンテキストプロバイダーでラップ）
// const App = () => {
//   return (
//     <TimelineErrorBoundary>
//       <PageModeProvider>
//         <AppContent />
//       </PageModeProvider>
//     </TimelineErrorBoundary>
//   );
// };

// export default App;

// src/App.js
import React from 'react';
import AppTest from './pages/AppTest';
import './App.css';

function App() {
  return (
    <div className="App">
      <AppTest />
    </div>
  );
}

export default App;