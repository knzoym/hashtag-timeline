// src/App.js - 既存構造に最小限のWiki機能を追加
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

// 修正済みフック
import { useUnifiedCoordinates } from "./hooks/useUnifiedCoordinates";
import { useAuth } from "./hooks/useAuth";
import { useSupabaseSync } from "./hooks/useSupabaseSync";
import { useWikiData } from "./hooks/useWikiData";
import { useSampleSync } from "./hooks/useSampleSync";

const AppContent = () => {
  const { currentTab, currentFileName, updateFileName, getPageModeInfo } =
    usePageMode();

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

  // 統合座標管理
  const coordinates = useUnifiedCoordinates(timelineRef);

  // データ管理（App.jsレベルで統一管理）
  const [events, setEvents] = useState([
    // 初期サンプルデータ（テスト用）
    {
      id: 1,
      title: "サンプルイベント1",
      startDate: new Date(2023, 0, 15),
      endDate: new Date(2023, 0, 15),
      description: "これはサンプルイベントです",
      tags: ["テスト", "サンプル"],
      timelineInfos: [], // 統一データ構造
    },
    {
      id: 2,
      title: "サンプルイベント2",
      startDate: new Date(2023, 5, 10),
      endDate: new Date(2023, 5, 10),
      description: "2つ目のサンプルイベント",
      tags: ["テスト", "例"],
      timelineInfos: [], // 統一データ構造
    },
  ]);
  const [timelines, setTimelines] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTimeline, setSelectedTimeline] = useState(null);
  const [hoveredGroup, setHoveredGroup] = useState(null);

  // Wiki関連状態
  const [wikiEvents, setWikiEvents] = useState([]);
  const [wikiLoading, setWikiLoading] = useState(false);

  // Wiki機能の初期化
  useEffect(() => {
    const initializeWiki = async () => {
      if (isWikiMode) {
        setWikiLoading(true);
        try {
          const events = await wikiData.getSharedEvents("", 100);
          setWikiEvents(events);
          console.log("✅ Wikiイベント読み込み完了:", events.length);
        } catch (err) {
          console.error("Wikiイベント読み込みエラー:", err);
        } finally {
          setWikiLoading(false);
        }
      }
    };

    initializeWiki();
  }, [isWikiMode, wikiData]);

  // PageModeContextから承認待ち表示状態を取得
  const { showPendingEvents, togglePendingEvents } = usePageMode();

  // Wiki承認システム用の状態管理
  const [pendingEventsData, setPendingEventsData] = useState([]);
  const [approvalNotifications, setApprovalNotifications] = useState([]);

  // 承認待ちイベント読み込み
  useEffect(() => {
    const loadPendingEvents = async () => {
      if (isWikiMode && showPendingEvents && wikiData) {
        try {
          const pendingRevisions = await wikiData.getPendingRevisions(
            "pending"
          );

          // リビジョンデータをイベント形式に変換
          const pendingEvents = pendingRevisions.map((revision) => ({
            ...revision.data,
            id: `pending_${revision.rev_id}`,
            wikiRevisionId: revision.rev_id,
            approval_status: revision.approval_status,
            created_at: revision.created_at,
            upvotes: revision.upvotes,
            reports: revision.reports,
            stable_score: revision.stable_score,
          }));

          setPendingEventsData(pendingEvents);
          console.log("承認待ちイベント読み込み完了:", pendingEvents.length);
        } catch (error) {
          console.error("承認待ちイベント読み込みエラー:", error);
          setPendingEventsData([]);
        }
      } else {
        setPendingEventsData([]);
      }
    };

    loadPendingEvents();
  }, [isWikiMode, showPendingEvents, wikiData]);

  // 表示用イベントデータの決定（承認待ちを含む）
  const displayEventsWithApproval = useMemo(() => {
    if (!isWikiMode) {
      return events; // 個人モードではそのまま
    }

    // Wikiモード：安定版 + 承認待ち（表示オプションON時）
    let wikiDisplayEvents = [...wikiEvents];

    if (showPendingEvents && pendingEventsData.length > 0) {
      wikiDisplayEvents = [...wikiDisplayEvents, ...pendingEventsData];
    }

    return wikiDisplayEvents;
  }, [isWikiMode, events, wikiEvents, showPendingEvents, pendingEventsData]);

  // 承認通知システム
  const addApprovalNotification = useCallback((message, type = "info") => {
    const notification = {
      id: Date.now(),
      message,
      type, // 'success', 'error', 'info', 'warning'
      timestamp: new Date(),
    };

    setApprovalNotifications((prev) => [notification, ...prev.slice(0, 4)]); // 最大5件まで保持

    // 3秒後に自動削除
    setTimeout(() => {
      setApprovalNotifications((prev) =>
        prev.filter((n) => n.id !== notification.id)
      );
    }, 3000);
  }, []);

  // Wiki承認システム用のイベントハンドラー
  const handleApprovalAction = useCallback(
    async (action, revisionId, data = {}) => {
      if (!user || !wikiData) {
        addApprovalNotification("承認操作にはログインが必要です", "error");
        return;
      }

      try {
        let result;

        switch (action) {
          case "approve":
            result = await wikiData.approveRevision(revisionId);
            if (result) {
              addApprovalNotification("編集を承認しました", "success");
              // データを再読み込み
              loadPendingEvents();
            }
            break;

          case "reject":
            result = await wikiData.rejectRevision(revisionId, data.reason);
            if (result) {
              addApprovalNotification("編集を却下しました", "info");
              loadPendingEvents();
            }
            break;

          case "auto_approve":
            result = await wikiData.executeAutoApproval();
            if (result) {
              addApprovalNotification(
                `${result.approved_count || 0}件の編集を自動承認しました`,
                "success"
              );
              loadPendingEvents();
            }
            break;

          default:
            console.warn("未知の承認アクション:", action);
        }
      } catch (error) {
        console.error("承認操作エラー:", error);
        addApprovalNotification(
          `承認操作に失敗しました: ${error.message}`,
          "error"
        );
      }
    },
    [user, wikiData, addApprovalNotification]
  );

  // TimelineTabコンポーネントに渡すprops
  const timelineTabProps = {
    events: displayEventsWithApproval, // 承認待ちを含むイベントデータ
    timelines,
    selectedEvent,
    selectedTimeline,
    hoveredGroup,
    searchTerm,
    coordinates,
    onEventClick,
    onTimelineClick,
    onEventUpdate,
    onEventAdd,
    onCreateTimeline,
    onSearchChange,
    // Wiki承認システム関連
    isWikiMode,
    showPendingEvents,
    onTogglePendingEvents: togglePendingEvents,
    wikiData,
    user,
    // 承認システムハンドラー
    onApprovalAction: handleApprovalAction,
    approvalNotifications,
  };

  // 承認通知の表示コンポーネント（既存UIに追加）
  const ApprovalNotifications = () => {
    if (approvalNotifications.length === 0) return null;

    const notificationStyles = {
      container: {
        position: "fixed",
        top: "80px",
        right: "20px",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        maxWidth: "400px",
      },
      notification: {
        padding: "12px 16px",
        borderRadius: "6px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        border: "1px solid",
        fontSize: "14px",
        fontWeight: "500",
        animation: "slideInRight 0.3s ease-out",
      },
      success: {
        backgroundColor: "#ecfdf5",
        borderColor: "#10b981",
        color: "#166534",
      },
      error: {
        backgroundColor: "#fef2f2",
        borderColor: "#ef4444",
        color: "#dc2626",
      },
      info: {
        backgroundColor: "#eff6ff",
        borderColor: "#3b82f6",
        color: "#1e40af",
      },
      warning: {
        backgroundColor: "#fefbf0",
        borderColor: "#f59e0b",
        color: "#d97706",
      },
    };

    return (
      <div style={notificationStyles.container}>
        {approvalNotifications.map((notification) => (
          <div
            key={notification.id}
            style={{
              ...notificationStyles.notification,
              ...notificationStyles[notification.type],
            }}
          >
            {notification.message}
          </div>
        ))}
      </div>
    );
  };

  // メニューアクションに承認システム操作を追加
  const handleWikiMenuAction = useCallback(
    (actionId) => {
      switch (actionId) {
        case "auto-approve":
          handleApprovalAction("auto_approve");
          break;
        case "pending-toggle":
          togglePendingEvents();
          break;
        default:
          // 既存のメニューアクション処理
          handleMenuAction(actionId);
      }
    },
    [handleApprovalAction, togglePendingEvents, handleMenuAction]
  );

  // 表示するイベントデータの決定
  const displayEvents = useMemo(() => {
    return isWikiMode ? wikiEvents : events;
  }, [isWikiMode, events, wikiEvents]);

  // 検索でハイライトされるイベント（配列形式でSearchPanelに対応）
  const highlightedEvents = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const term = searchTerm.toLowerCase();
    const matchingEvents = displayEvents.filter((event) => {
      return (
        event.title?.toLowerCase().includes(term) ||
        event.description?.toLowerCase().includes(term) ||
        event.tags?.some((tag) => tag.toLowerCase().includes(term))
      );
    });

    return matchingEvents;
  }, [searchTerm, displayEvents]);

  // === イベント操作（個人モード用） ===
  const addEvent = useCallback(
    (newEventData) => {
      if (isWikiMode) return null; // Wikiモードでは個人イベント追加不可

      const event = {
        id: Date.now(),
        title: newEventData?.title || "新規イベント",
        startDate: newEventData?.startDate || new Date(),
        endDate: newEventData?.endDate || newEventData?.startDate || new Date(),
        description: newEventData?.description || "",
        tags: newEventData?.tags || [],
        timelineInfos: [],
      };
      setEvents((prev) => [...prev, event]);
      console.log("イベント追加:", event.title);
      return event;
    },
    [isWikiMode]
  );

  const updateEvent = useCallback(
    (updatedEvent) => {
      if (isWikiMode) return; // Wikiモードでは編集不可

      const normalizedEvent = {
        ...updatedEvent,
        timelineInfos: updatedEvent.timelineInfos || [],
      };

      setEvents((prev) =>
        prev.map((event) =>
          event.id === normalizedEvent.id ? normalizedEvent : event
        )
      );
      console.log("イベント更新:", normalizedEvent.title);
    },
    [isWikiMode]
  );

  const deleteEvent = useCallback(
    (eventId) => {
      if (isWikiMode) return; // Wikiモードでは削除不可

      setEvents((prev) => prev.filter((event) => event.id !== eventId));
      console.log("イベント削除:", eventId);
    },
    [isWikiMode]
  );

  // === 年表操作（個人モード用） ===
  const createTimeline = useCallback(
    (timelineData) => {
      if (isWikiMode) return null; // Wikiモードでは年表作成不可

      const timeline = {
        id: Date.now(),
        name: timelineData?.name || "新規年表",
        events: timelineData?.events || [],
        createdAt: new Date(),
        ...timelineData,
      };
      setTimelines((prev) => [...prev, timeline]);
      console.log("年表作成:", timeline.name);
      return timeline;
    },
    [isWikiMode]
  );

  const updateTimeline = useCallback((updatedTimeline) => {
    setTimelines((prev) =>
      prev.map((timeline) =>
        timeline.id === updatedTimeline.id ? updatedTimeline : timeline
      )
    );
    console.log("年表更新:", updatedTimeline.name);
  }, []);

  const deleteTimeline = useCallback((timelineId) => {
    setTimelines((prev) =>
      prev.filter((timeline) => timeline.id !== timelineId)
    );
    console.log("年表削除:", timelineId);
  }, []);

  // === Wiki機能 ===
  const handleWikiImport = useCallback(
    (importData) => {
      if (isWikiMode) return; // Wikiモードでは個人ファイルに追加不可

      try {
        if (importData.type === "events") {
          const newEvents = importData.data;
          setEvents((prev) => [...prev, ...newEvents]);
          console.log("✅ Wikiイベントインポート完了:", newEvents.length);
        } else if (importData.type === "timeline") {
          const timelineData = importData.data;
          setEvents((prev) => [...prev, ...timelineData.events]);

          const newTimeline = {
            id: timelineData.id,
            name: timelineData.name,
            events: timelineData.events.map((e) => e.id),
            createdAt: timelineData.createdAt,
            source: timelineData.source,
          };
          setTimelines((prev) => [...prev, newTimeline]);

          console.log("✅ Wiki年表インポート完了:", timelineData.name);
        }
      } catch (err) {
        console.error("インポート処理エラー:", err);
        alert(`インポート処理でエラーが発生しました: ${err.message}`);
      }
    },
    [isWikiMode]
  );

  // === UI操作 ===
  const handleSearchChange = useCallback((e) => {
    const value = typeof e === "string" ? e : e?.target?.value || "";
    setSearchTerm(value);
  }, []);

  const handleEventClick = useCallback((event) => {
    setSelectedEvent(event);
  }, []);

  const handleTimelineClick = useCallback((timeline) => {
    setSelectedTimeline(timeline);
  }, []);

  const handleAddEvent = useCallback(
    (eventData) => {
      return addEvent(eventData);
    },
    [addEvent]
  );

  const handleCreateTimeline = useCallback(
    (timelineData) => {
      return createTimeline(timelineData);
    },
    [createTimeline]
  );

  const getTopTagsFromSearch = useCallback(() => {
    const allTags = highlightedEvents.flatMap((event) => event.tags || []);
    const tagCount = {};
    allTags.forEach((tag) => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });

    return Object.entries(tagCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([tag]) => tag);
  }, [highlightedEvents]);

  // === ファイル操作 ===
  const handleSave = useCallback(async () => {
    if (!user || isWikiMode) {
      alert("個人ファイルの保存にはログインが必要です");
      return;
    }

    setIsSaving(true);
    try {
      await saveTimelineData({
        events,
        timelines,
        fileName: currentFileName || "名称未設定",
      });
      alert("保存しました");
    } catch (error) {
      console.error("Save failed:", error);
      alert("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  }, [user, isWikiMode, events, timelines, currentFileName, saveTimelineData]);

  // === メニューアクション ===
  const handleMenuAction = useCallback(
    (actionId) => {
      console.log("App: handleMenuAction called", actionId);
      switch (actionId) {
        case "save":
          handleSave();
          break;
        case "add-event":
          if (!isWikiMode) {
            addEvent();
          }
          break;
        case "initial-position":
          coordinates.resetToInitialPosition();
          break;

        // Wiki連携機能
        case "import-wiki-search":
          if (!isWikiMode) {
            alert("Wiki機能は個人ページモードでは利用できません");
            return;
          }
          const searchResults = wikiEvents.filter((event) =>
            highlightedEvents.some((he) => he.id === event.id)
          );
          if (searchResults.length > 0) {
            const importData =
              sampleSync.importWikiEventsToPersonal(searchResults);
            if (importData.length > 0) {
              handleWikiImport({ type: "events", data: importData });
            }
          } else {
            alert("インポートするイベントを検索で選択してください");
          }
          break;

        default:
          console.log(`Menu action: ${actionId}`);
      }
    },
    [
      handleSave,
      isWikiMode,
      addEvent,
      coordinates,
      wikiEvents,
      highlightedEvents,
      sampleSync,
      handleWikiImport,
    ]
  );

  // MyPageモード時は別のコンポーネントを表示
  if (isMyPageMode) {
    return <MyPage />;
  }

  // 通常のアプリケーションUI
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

      <TabSystem
        // 基本データ
        events={displayEvents}
        timelines={timelines}
        user={user}
        // Wiki関連
        isWikiMode={isWikiMode}
        wikiLoading={wikiLoading}
        onEventImported={handleWikiImport}
        // 操作ハンドラ
        onEventUpdate={updateEvent}
        onEventDelete={deleteEvent}
        onEventAdd={handleAddEvent}
        onEventClick={handleEventClick}
        onTimelineCreate={handleCreateTimeline}
        onTimelineUpdate={updateTimeline}
        onTimelineDelete={deleteTimeline}
        onTimelineClick={handleTimelineClick}
        onSearchChange={handleSearchChange}
        onCloseEventModal={() => setSelectedEvent(null)}
        onCloseTimelineModal={() => setSelectedTimeline(null)}
        // 座標系とUI
        coordinates={coordinates}
        timelineRef={timelineRef}
        highlightedEvents={highlightedEvents}
        searchTerm={searchTerm}
        // その他
        hoveredGroup={hoveredGroup}
        setHoveredGroup={setHoveredGroup}
        getTopTagsFromSearch={getTopTagsFromSearch}
        onResetView={() => coordinates.resetToInitialPosition()}
        onMenuAction={handleMenuAction}
      />
    </div>
  );
};

const App = () => {
  return (
    <PageModeProvider>
      <AppContent />
    </PageModeProvider>
  );
};

export default App;
