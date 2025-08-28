// src/App.js - 無限レンダリング修正版
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
  const {
    currentTab,
    currentFileName,
    updateFileName,
    getPageModeInfo,
    showPendingEvents,
    togglePendingEvents,
  } = usePageMode();

  const { isWikiMode, isMyPageMode } = getPageModeInfo;

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
  // 新規追加：Wiki一時年表の管理
  const [tempTimelines, setTempTimelines] = useState([]);

  const [timelines, setTimelines] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTimeline, setSelectedTimeline] = useState(null);
  const [hoveredGroup, setHoveredGroup] = useState(null);

  // Wiki関連状態
  const [wikiEvents, setWikiEvents] = useState([]);
  const [wikiLoading, setWikiLoading] = useState(false);

  // Wiki承認システム用の状態管理
  const [pendingEventsData, setPendingEventsData] = useState([]);
  const [approvalNotifications, setApprovalNotifications] = useState([]);

  // この定義をApp.js内の適切な位置（使用箇所より前）に配置
  const displayEventsWithApproval = useMemo(() => {
    return isWikiMode ? wikiEvents : events;
  }, [isWikiMode, wikiEvents, events]);

  // 承認待ちイベント読み込み - 修正版
  const loadPendingEvents = useCallback(async () => {
    if (isWikiMode && showPendingEvents && wikiData) {
      try {
        const pendingRevisions = await wikiData.getPendingRevisions("pending");

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
  }, [isWikiMode, showPendingEvents, wikiData]);

  // 承認待ちイベント読み込み
  useEffect(() => {
    if (!isWikiMode) return;

    let mounted = true;
    const loadWiki = async () => {
      setWikiLoading(true);
      try {
        const data = await wikiData.getSharedEvents("", 100);
        if (mounted) setWikiEvents(data);
      } catch (err) {
        console.error(err);
        if (mounted) setWikiEvents([]);
      } finally {
        if (mounted) setWikiLoading(false);
      }
    };

    loadWiki();
    return () => {
      mounted = false;
    };
  }, [isWikiMode]);

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
    [user, wikiData, addApprovalNotification, loadPendingEvents]
  );

  // === 検索関連 ===
  const highlightedEvents = useMemo(() => {
    const safeTerm = typeof searchTerm === "string" ? searchTerm.trim() : "";
    if (!safeTerm) return new Set();

    const term = safeTerm.toLowerCase();
    const matchingEvents = displayEventsWithApproval.filter((event) => {
      // タイトル検索
      if (event.title?.toLowerCase().includes(term)) return true;

      // タグ検索
      const normalizedTerm = term.startsWith("#") ? term.slice(1) : term;
      return event.tags?.some((tag) =>
        tag.toLowerCase().includes(normalizedTerm.toLowerCase())
      );
    });

    return new Set(matchingEvents.map((event) => event.id));
  }, [searchTerm, displayEventsWithApproval]);

  const getTopTagsFromSearch = useCallback(() => {
    const allTags = Array.from(highlightedEvents)
      .map((id) => displayEventsWithApproval.find((e) => e.id === id))
      .filter(Boolean)
      .flatMap((event) => event.tags || []);

    const tagCount = {};
    allTags.forEach((tag) => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });

    return Object.entries(tagCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([tag]) => tag);
  }, [highlightedEvents, displayEventsWithApproval]);

  // === イベント操作（修正版） ===
  const addEvent = useCallback((eventData) => {
    const newEvent = {
      id: Date.now() + Math.random(),
      title: eventData.title || "新規イベント",
      startDate: eventData.startDate || new Date(),
      endDate: eventData.endDate || eventData.startDate || new Date(),
      description: eventData.description || "",
      tags: eventData.tags || [],
      timelineInfos: eventData.timelineInfos || [],
    };

    setEvents((prev) => [...prev, newEvent]);
    console.log("イベント追加:", newEvent.title);
    return newEvent;
  }, []);

  const updateEvent = useCallback((eventId, updates) => {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === eventId ? { ...event, ...updates } : event
      )
    );
    console.log("イベント更新:", eventId);
  }, []);

  const deleteEvent = useCallback((eventId) => {
    setEvents((prev) => prev.filter((event) => event.id !== eventId));
    console.log("イベント削除:", eventId);
  }, []);

  // === 年表操作（修正版） ===
  const createTimeline = useCallback((timelineData = {}) => {
    const newTimeline = {
      id: Date.now() + Math.random(),
      name: timelineData.name || "新しい年表",
      description: timelineData.description || "",
      color: timelineData.color || "#3b82f6",
      events: timelineData.events || [],
      tags: timelineData.tags || [],
      createdAt: new Date(),
      ...timelineData,
    };

    setTimelines((prev) => [...prev, newTimeline]);
    console.log("年表作成:", newTimeline.name);
    return newTimeline;
  }, []);

  const updateTimeline = useCallback((timelineId, updates) => {
    setTimelines((prev) =>
      prev.map((timeline) =>
        timeline.id === timelineId ? { ...timeline, ...updates } : timeline
      )
    );
    console.log("年表更新:", timelineId);
  }, []);

  const deleteTimeline = useCallback((timelineId) => {
    setTimelines((prev) =>
      prev.filter((timeline) => timeline.id !== timelineId)
    );
    console.log("年表削除:", timelineId);
  }, []);

  // === UI操作（修正版） ===
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

  // 既存のhandleCreateTimeline（個人モード用）は維持
  const handleCreateTimeline = useCallback(() => {
    if (!highlightedEvents || highlightedEvents.size === 0) {
      console.log("年表作成: ハイライトされたイベントがありません");
      return;
    }

    const timelineName = prompt("年表名を入力してください:");
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
    };

    setTimelines((prev) => [...prev, newTimeline]);

    // 選択されたイベントに年表情報を追加
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
    setSearchTerm(""); // 検索をクリア
  }, [highlightedEvents, setSearchTerm]);

  // 一時年表作成（Wiki専用）
  const handleCreateTempTimeline = useCallback(() => {
    if (!highlightedEvents || highlightedEvents.size === 0) {
      console.log("一時年表作成: ハイライトされたイベントがありません");
      return;
    }

    const timelineName = prompt("一時年表名を入力してください:");
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
      createdFrom: "search_result",
    };

    setTempTimelines((prev) => [...prev, newTempTimeline]);
    console.log("一時年表作成完了:", newTempTimeline);
    setSearchTerm("");
  }, [highlightedEvents]);

  // 一時年表削除
  const handleDeleteTempTimeline = useCallback((timelineId) => {
    setTempTimelines((prev) => prev.filter((t) => t.id !== timelineId));
    console.log("一時年表削除:", timelineId);
  }, []);

  // 一時年表を個人ファイルに保存
  const handleSaveTempTimelineToPersonal = useCallback(
    (tempTimeline) => {
      if (!user) {
        alert("個人ファイルへの保存にはログインが必要です");
        return;
      }

      const newPersonalTimelineId = `timeline_${Date.now()}`;
      const personalTimeline = {
        id: newPersonalTimelineId,
        name: tempTimeline.name,
        color: tempTimeline.color,
        isVisible: true,
        createdAt: new Date(),
        type: "personal",
        source: {
          type: "temp_timeline_conversion",
          originalId: tempTimeline.id,
          convertedAt: new Date(),
        },
      };

      // 個人年表として追加
      setTimelines((prev) => [...prev, personalTimeline]);

      // イベントにtimelineInfosを追加
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          tempTimeline.eventIds?.includes(event.id)
            ? {
                ...event,
                timelineInfos: [
                  ...(event.timelineInfos || []),
                  { timelineId: newPersonalTimelineId, isTemporary: false },
                ],
              }
            : event
        )
      );

      handleDeleteTempTimeline(tempTimeline.id);
      alert(`「${tempTimeline.name}」を個人年表として保存しました`);
    },
    [user, handleDeleteTempTimeline]
  );

  // === モーダル操作 ===
  const handleCloseEventModal = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  const handleCloseTimelineModal = useCallback(() => {
    setSelectedTimeline(null);
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

  // TabSystemに渡すprops（無限ループ修正版）
  const tabSystemProps = useMemo(
    () => ({
      // 共通のデータとハンドラー
      events: displayEventsWithApproval,
      timelines,
      tempTimelines,
      user,
      onEventUpdate: updateEvent,
      onEventDelete: deleteEvent,
      onTimelineUpdate: updateTimeline,
      onEventAdd: handleAddEvent,

      // Timeline/Network固有（coordinatesオブジェクトを渡さない）
      timelineRef,
      highlightedEvents,
      searchTerm,

      // Wiki関連
      wikiData,
      showPendingEvents,

      // その他のハンドラー
      onMenuAction: handleMenuAction,
      onSearchChange: handleSearchChange,
      onTimelineCreate: handleCreateTimeline,
      onCreateTempTimeline: handleCreateTempTimeline,
      onTimelineDelete: deleteTimeline,
      onDeleteTempTimeline: handleDeleteTempTimeline,
      onSaveTempTimelineToPersonal: handleSaveTempTimelineToPersonal,
      getTopTagsFromSearch,
      onEventClick: handleEventClick,
      onTimelineClick: handleTimelineClick,

      // モーダル関連
      selectedEvent,
      selectedTimeline,
      onCloseEventModal: handleCloseEventModal,
      onCloseTimelineModal: handleCloseTimelineModal,
      hoveredGroup,
      setHoveredGroup,

      // 承認システム
      onApprovalAction: handleApprovalAction,
    }),
    [
      displayEventsWithApproval,
      timelines,
      tempTimelines,
      user,
      updateEvent,
      deleteEvent,
      updateTimeline,
      handleAddEvent,
      timelineRef,
      highlightedEvents,
      searchTerm,
      wikiData,
      showPendingEvents,
      handleMenuAction,
      handleSearchChange,
      handleCreateTimeline,
      handleCreateTempTimeline,
      deleteTimeline,
      handleDeleteTempTimeline,
      handleSaveTempTimelineToPersonal,
      getTopTagsFromSearch,
      handleEventClick,
      handleTimelineClick,
      selectedEvent,
      selectedTimeline,
      handleCloseEventModal,
      handleCloseTimelineModal,
      hoveredGroup,
      setHoveredGroup,
      handleApprovalAction,
    ]
  );

  return (
    <div className="App">
      <Header
        currentTab={currentTab}
        currentFileName={currentFileName}
        user={user}
        isAuthenticated={!!user}
        onSignIn={signInWithGoogle}
        onSignOut={signOut}
        onMenuAction={handleMenuAction}
        isSaving={isSaving}
      />

      {isMyPageMode ? (
        <MyPage
          user={user}
          onBackToTimeline={() => {
            /* ページモード切り替え処理 */
          }}
          onLoadTimeline={(data) => {
            /* 年表読み込み処理 */
          }}
        />
      ) : (
        <>
          {/* Wiki初期化中のローディング表示 */}
          {isWikiMode && wikiLoading && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  backgroundColor: "white",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "4px solid #e5e7eb",
                    borderTop: "4px solid #3b82f6",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 16px",
                  }}
                ></div>
                <div>TLwikiデータを読み込み中...</div>
              </div>
            </div>
          )}

          <TabSystem {...tabSystemProps} />
        </>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// メインApp（Provider付き）
const App = () => {
  return (
    <PageModeProvider>
      <AppContent />
    </PageModeProvider>
  );
};

export default App;