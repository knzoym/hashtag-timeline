// src/App.js - 根本的問題修正版
import React, {
  useRef,
  useCallback,
  useState,
  useMemo,
  useEffect,
} from "react";
import { PageModeProvider, usePageMode } from "./contexts/PageModeContext";
import Header from "./components/common/Header";
import TabSystem from "./components/common/TabSystem";
import MyPage from "./components/personal/MyPage";

// 必要なフックを安全にインポート
import { useAuth } from "./hooks/useAuth";
import { useSupabaseSync } from "./hooks/useSupabaseSync";
import { useWikiData } from "./hooks/useWikiData";
import { useSampleSync } from "./hooks/useSampleSync";
import { useTimelineSearch } from "./hooks/useTimelineSearch";
import { sampleEvents } from "./utils/eventUtils";

// AppContentコンポーネント（PageModeProvider内で動作）
const AppContent = () => {
  const {
    currentTab,
    currentFileName,
    updateFileName,
    getPageModeInfo,
    showPendingEvents,
  } = usePageMode();

  const { isWikiMode, isMyPageMode } = getPageModeInfo();

  // 認証
  const { user, signInWithGoogle, signOut } = useAuth();

  // Supabase同期
  const { saveTimelineData } = useSupabaseSync(user);

  // Wiki関連
  const wikiData = useWikiData(user);
  const sampleSync = useSampleSync(user);

  // タイムライン関連の参照
  const timelineRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);

  // データ管理
  const [events, setEvents] = useState(sampleEvents || []);
  const [timelines, setTimelines] = useState([]);
  const [tempTimelines, setTempTimelines] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTimeline, setSelectedTimeline] = useState(null);
  const [hoveredGroup, setHoveredGroup] = useState(null);

  // Wiki関連状態
  const [wikiEvents, setWikiEvents] = useState([]);
  const [wikiLoading, setWikiLoading] = useState(false);

  // 検索機能
  const {
    searchTerm,
    highlightedEvents,
    handleSearchChange,
    getTopTagsFromSearch,
  } = useTimelineSearch(isWikiMode ? wikiEvents : events);

  // Wiki/個人イベントの表示切り替え
  const displayEvents = useMemo(() => {
    try {
      if (isWikiMode) {
        return showPendingEvents
          ? [...wikiEvents, ...tempTimelines.flatMap((t) => t.events || [])]
          : wikiEvents;
      }
      return events;
    } catch (error) {
      console.error("イベント表示エラー:", error);
      return [];
    }
  }, [isWikiMode, wikiEvents, events, showPendingEvents, tempTimelines]);

  // === イベント操作 ===
  const handleAddEvent = useCallback(
    (eventData) => {
      try {
        const newEvent = {
          id: Date.now(),
          title: eventData?.title || "新規イベント",
          startDate: eventData?.startDate || new Date(),
          endDate: eventData?.endDate || new Date(),
          description: eventData?.description || "",
          tags: eventData?.tags || [],
          timelineInfos: [],
          ...eventData,
        };

        if (isWikiMode) {
          // Wiki編集フォームを開く
          console.log("Wikiイベント作成フォームを開く");
        } else {
          setEvents((prev) => [...prev, newEvent]);
        }
      } catch (error) {
        console.error("イベント追加エラー:", error);
      }
    },
    [isWikiMode]
  );

  const updateEvent = useCallback((eventId, updateData) => {
    try {
      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId ? { ...event, ...updateData } : event
        )
      );
    } catch (error) {
      console.error("イベント更新エラー:", error);
    }
  }, []);

  const deleteEvent = useCallback((eventId) => {
    try {
      setEvents((prev) => prev.filter((event) => event.id !== eventId));
    } catch (error) {
      console.error("イベント削除エラー:", error);
    }
  }, []);

  // === 年表操作（修正版） ===
  const handleCreateTimeline = useCallback(() => {
    try {
      if (!highlightedEvents || highlightedEvents.size === 0) {
        console.log("年表作成: ハイライトされたイベントがありません");
        return;
      }

      // 検索テキストをデフォルト年表名として使用
      const defaultName = searchTerm.trim() || "新しい年表";
      const timelineName = prompt(`年表名を入力してください:`, defaultName);
      if (!timelineName) return;

      const newTimelineId = `timeline_${Date.now()}`;
      const selectedEventIds = Array.from(highlightedEvents);

      // 新しい年表を作成
      const newTimeline = {
        id: newTimelineId,
        name: timelineName,
        color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
        isVisible: true,
        createdAt: new Date(),
        type: "personal",
        eventIds: selectedEventIds, // イベントID配列を追加
        eventCount: selectedEventIds.length,
      };

      setTimelines((prev) => [...prev, newTimeline]);

      // 選択されたイベントにtimelineInfosを追加
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          selectedEventIds.includes(event.id)
            ? {
                ...event,
                timelineInfos: [
                  ...(event.timelineInfos || []),
                  { timelineId: newTimelineId, isTemporary: false },
                ],
              }
            : event
        )
      );

      console.log("年表作成完了:", newTimeline);
      // 検索をクリア（handleSearchChangeを使用）
      handleSearchChange({ target: { value: "" } });
    } catch (error) {
      console.error("年表作成エラー:", error);
    }
  }, [highlightedEvents, searchTerm, handleSearchChange]);

  // 一時年表作成（Wiki専用）
  const handleCreateTempTimeline = useCallback(() => {
    try {
      if (!highlightedEvents || highlightedEvents.size === 0) {
        console.log("一時年表作成: ハイライトされたイベントがありません");
        return;
      }

      // 検索テキストをデフォルト年表名として使用
      const defaultName = searchTerm.trim() || "一時年表";
      const timelineName = prompt("一時年表名を入力してください:", defaultName);
      if (!timelineName) return;

      const newTempTimelineId = `temp_timeline_${Date.now()}`;
      const selectedEventIds = Array.from(highlightedEvents);

      const newTempTimeline = {
        id: newTempTimelineId,
        name: timelineName,
        color: `hsl(${Math.floor(Math.random() * 360)}, 60%, 60%)`,
        isVisible: true,
        createdAt: new Date(),
        type: "temporary",
        eventIds: selectedEventIds,
        eventCount: selectedEventIds.length,
        createdFrom: "search_result",
      };

      setTempTimelines((prev) => [...prev, newTempTimeline]);
      console.log("一時年表作成完了:", newTempTimeline);

      // 検索をクリア
      handleSearchChange({ target: { value: "" } });
    } catch (error) {
      console.error("一時年表作成エラー:", error);
    }
  }, [highlightedEvents, searchTerm, handleSearchChange]);

  const updateTimeline = useCallback((timelineId, updateData) => {
    try {
      setTimelines((prev) =>
        prev.map((timeline) =>
          timeline.id === timelineId ? { ...timeline, ...updateData } : timeline
        )
      );
    } catch (error) {
      console.error("年表更新エラー:", error);
    }
  }, []);

  const deleteTimeline = useCallback((timelineId) => {
    try {
      setTimelines((prev) =>
        prev.filter((timeline) => timeline.id !== timelineId)
      );
    } catch (error) {
      console.error("年表削除エラー:", error);
    }
  }, []);

  // === Wiki機能 ===
  const loadWikiEvents = useCallback(async () => {
    if (!isWikiMode) return;

    try {
      setWikiLoading(true);
      const events = await wikiData.getWikiEvents();
      setWikiEvents(events);
    } catch (err) {
      console.error("Wikiイベント取得エラー:", err);
    } finally {
      setWikiLoading(false);
    }
  }, [isWikiMode, wikiData]);

  // Wiki初期化
  useEffect(() => {
    if (isWikiMode) {
      loadWikiEvents();
    }
  }, [isWikiMode, loadWikiEvents]);

  // === ファイル操作 ===
  const handleSave = useCallback(async () => {
    if (!user || isWikiMode) {
      alert("保存にはログインが必要です");
      return;
    }

    setIsSaving(true);
    try {
      const timelineData = {
        events,
        timelines,
        metadata: {
          savedAt: new Date(),
          fileName: currentFileName || "unnamed",
        },
      };

      await saveTimelineData(timelineData);
      console.log("✅ 保存完了");
    } catch (error) {
      console.error("保存エラー:", error);
      alert("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  }, [user, isWikiMode, events, timelines, currentFileName, saveTimelineData]);

  const handleMenuAction = useCallback(
    (actionId) => {
      switch (actionId) {
        case "save":
          handleSave();
          break;
        case "add-event":
          handleAddEvent({ title: "新規イベント" });
          break;
        default:
          console.log("Menu action:", actionId);
      }
    },
    [handleSave, handleAddEvent]
  );

  // === JSXレンダリング ===

  // マイページモードの場合
  if (isMyPageMode) {
    return (
      <div
        style={{ height: "100vh", display: "flex", flexDirection: "column" }}
      >
        <Header
          user={user}
          isAuthenticated={!!user}
          onSignIn={signInWithGoogle}
          onSignOut={signOut}
          onMenuAction={handleMenuAction}
          isSaving={isSaving}
        />
        <MyPage
          user={user}
          onBackToTimeline={() => window.location.reload()} // 暫定実装
          timelines={timelines}
          onLoadTimeline={() => {}} // 暫定実装
        />
      </div>
    );
  }

  // 通常のタブシステム
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Header
        user={user}
        isAuthenticated={!!user}
        onSignIn={signInWithGoogle}
        onSignOut={signOut}
        onMenuAction={handleMenuAction}
        isSaving={isSaving}
      />

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          backgroundColor: "#f9fafb",
        }}
      >
        <TabSystem
          // 基本データ
          events={displayEvents}
          timelines={timelines}
          tempTimelines={tempTimelines}
          user={user}
          // イベント操作
          onEventUpdate={updateEvent}
          onEventDelete={deleteEvent}
          onEventAdd={handleAddEvent}
          // 年表操作
          onTimelineUpdate={updateTimeline}
          onTimelineCreate={handleCreateTimeline}
          onTimelineDelete={deleteTimeline}
          // 検索・表示
          timelineRef={timelineRef}
          highlightedEvents={highlightedEvents}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          getTopTagsFromSearch={getTopTagsFromSearch}
          // モーダル管理
          selectedEvent={selectedEvent}
          selectedTimeline={selectedTimeline}
          onEventClick={setSelectedEvent}
          onTimelineClick={setSelectedTimeline}
          onCloseEventModal={() => setSelectedEvent(null)}
          onCloseTimelineModal={() => setSelectedTimeline(null)}
          hoveredGroup={hoveredGroup}
          setHoveredGroup={setHoveredGroup}
          // Wiki関連
          wikiData={wikiData}
          showPendingEvents={showPendingEvents}
          // その他
          onMenuAction={handleMenuAction}
        />
      </main>
    </div>
  );
};

// ErrorBoundary コンポーネント - null チェック修正版
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo || null, // null の可能性を明示的に処理
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            backgroundColor: "#fef2f2",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <h1 style={{ color: "#dc2626", marginBottom: "20px" }}>
            アプリケーションエラーが発生しました
          </h1>
          <details
            style={{
              maxWidth: "600px",
              textAlign: "left",
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #fecaca",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                fontWeight: "bold",
                marginBottom: "10px",
              }}
            >
              エラー詳細を表示
            </summary>
            <pre
              style={{
                fontSize: "12px",
                overflow: "auto",
                backgroundColor: "#f9fafb",
                padding: "10px",
                borderRadius: "4px",
              }}
            >
              {this.state.error && this.state.error.toString()}
              <br />
              {/* null チェックを追加してcomponentStackエラーを修正 */}
              {this.state.errorInfo && this.state.errorInfo.componentStack
                ? this.state.errorInfo.componentStack
                : "詳細なスタック情報は利用できません"}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            ページを再読み込み
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// メインのAppRootコンポーネント
const AppRoot = () => {
  return (
    <ErrorBoundary>
      <PageModeProvider>
        <AppContent />
      </PageModeProvider>
    </ErrorBoundary>
  );
};

export default AppRoot;