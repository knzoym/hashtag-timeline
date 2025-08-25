// src/pages/HashtagTimeline.js
import React, { useRef, useCallback, useState, useEffect } from "react";
import { EventModal } from "../components/EventModal";
import { SearchPanel } from "../components/SearchPanel";
import { TimelineCard } from "../components/TimelineCard";
import TableView from "../components/TableView";
import TimelineModal from "../components/TimelineModal";
import {
  EventGroupIcon,
  GroupTooltip,
  GroupCard,
} from "../components/EventGroup";
import { useTimelineLogic } from "../hooks/useTimelineLogic";
import { useDragDrop } from "../hooks/useDragDrop";
import { createTimelineStyles } from "../styles/timelineStyles";
import { extractTagsFromDescription } from "../utils/timelineUtils";
import { TIMELINE_CONFIG } from "../constants/timelineConfig";
import { useAuth } from "../hooks/useAuth";
import { useSupabaseSync } from "../hooks/useSupabaseSync";
import MyPage from "../components/MyPage";
import Sidebar from "../components/Sidebar";
import { useIsDesktop } from "../hooks/useMediaQuery";
import logoImage from "../assets/logo.png";
import WikiBrowser from "../components/WikiBrowser";
import { useWikiData } from "../hooks/useWikiData";
import { EventView } from "../components/EventView";

const HashtagTimeline = () => {
  // 認証フック
  const { user, loading, signInWithGoogle, signOut, isAuthenticated } =
    useAuth();

  // カスタムフックから必要な状態と関数を取得
  // Supabase同期フック
  const {
    saveTimelineData,
    getUserTimelines,
    deleteTimeline: deleteTimelineFile, // ファイル削除用の関数（別名で取得）
    upsertProfile,
    loading: syncLoading,
  } = useSupabaseSync(user);

  // アカウントメニュー用の状態を追加
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [currentFileName, setCurrentFileName] = useState(null); // 現在開いているファイル名

  // サイドバー状態
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isDesktop = useIsDesktop();

  // ローディング状態
  const [isSaving, setIsSaving] = useState(false);

  // メインの状態管理
  const timelineRef = useRef(null);
  const isDragging = useRef(false);
  const lastMouseX = useRef(0);
  const lastMouseY = useRef(0);
  const isShiftPressed = useRef(false);

  // ログイン時のプロファイル作成
  useEffect(() => {
    if (user && !syncLoading) {
      upsertProfile({});
    }
  }, [user]);

  const {
    // 基本状態
    scale,
    panX,
    panY,
    searchTerm,
    highlightedEvents,
    isHelpOpen,
    isModalOpen,
    modalPosition,
    editingEvent,
    newEvent,
    currentPixelsPerYear,
    cardPositions,

    // 高度レイアウト関連
    advancedEventPositions,
    expandedGroups,
    hoveredGroup,
    groupManager,

    // 関数
    setIsHelpOpen,
    resetToInitialPosition,
    handleSearchChange,
    handleDoubleClick,
    saveEvent,
    closeModal,
    addManualTag,
    removeManualTag,
    getAllCurrentTags,
    createTimeline,
    getTopTagsFromSearch,
    truncateTitle,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleEventChange,
    openNewEventModal,
    toggleEventGroup,
    handleGroupHover,

    Timelines,
    deleteTimeline,
    getTimelineAxesForDisplay,

    // テーブルビュー用関数
    updateEvent,
    deleteEvent,

    // ユーティリティ関数
    calculateTextWidth,

    setEditingEvent,
    setNewEvent,
    setModalPosition,
    setIsModalOpen,
    events,

    // ドラッグ&ドロップ関連
    timelinePositions,
    moveEvent,
    moveTimeline,
    addEventToTimeline,
    removeEventFromTimeline,

    // 年表モーダル関連
    timelineModalOpen,
    selectedTimelineForModal,
    openTimelineModal,
    closeTimelineModal,

    // 年表データの読み込み・保存・削除
    setEvents,
    setCreatedTimelines,
  } = useTimelineLogic(
    timelineRef,
    isDragging,
    lastMouseX,
    lastMouseY,
    isShiftPressed
  );

  // Wiki関連のフック追加
  const wikiData = useWikiData(user);

  // 既存のsetCurrentView の選択肢に 'wiki' を追加
  const [currentView, setCurrentView] = useState("timeline"); // 'timeline' | 'table' | 'mypage' | 'wiki'

  // Wikiからのイベントインポート処理
  const handleWikiEventImport = useCallback(
    (wikiEvent) => {
      // Wiki イベントを個人の events 配列に追加
      setEvents((prevEvents) => [...prevEvents, wikiEvent]);

      // 成功メッセージは WikiBrowser 内で表示するので、ここでは何もしない
    },
    [setEvents]
  );

  // 年表データの読み込み
  const handleLoadTimeline = useCallback((timelineData) => {
    if (timelineData.events) {
      // 日付を文字列からDateオブジェクトに変換
      const eventsWithDates = timelineData.events.map((event) => ({
        ...event,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
      }));
      setEvents(eventsWithDates);
    }
    if (timelineData.timelines) {
      // 年表内のイベントの日付も変換
      const timelinesWithDates = timelineData.timelines.map((timeline) => ({
        ...timeline,
        events:
          timeline.events?.map((event) => ({
            ...event,
            startDate: new Date(event.startDate),
            endDate: new Date(event.endDate),
          })) || [],
        temporaryEvents:
          timeline.temporaryEvents?.map((event) => ({
            ...event,
            startDate: new Date(event.startDate),
            endDate: new Date(event.endDate),
          })) || [],
        removedEvents:
          timeline.removedEvents?.map((event) => ({
            ...event,
            startDate: new Date(event.startDate),
            endDate: new Date(event.endDate),
          })) || [],
      }));
      setCreatedTimelines(timelinesWithDates);
    }
  }, []);

  // 年表データの保存
  const handleSaveTimeline = useCallback(async () => {
    if (!isAuthenticated || isSaving) return;

    setIsSaving(true);
    try {
      const timelineData = {
        events: events,
        timelines: Timelines,
        version: "1.0",
        savedAt: new Date().toISOString(),
      };

      const title = `年表 ${new Date().toLocaleDateString("ja-JP")}`;
      const result = await saveTimelineData(timelineData, title);

      if (result) {
        alert("ファイルを保存しました");
      } else {
        alert("保存に失敗しました");
      }
    } finally {
      setIsSaving(false);
    }
  }, [isAuthenticated, events, Timelines, saveTimelineData, isSaving]);

  // サイドバーのメニュー項目クリックハンドラー（拡張版）
  const handleSidebarMenuClick = useCallback(
    (itemId, section) => {
      switch (itemId) {
        // ファイル内操作
        case "add-event":
          openNewEventModal();
          break;
        case "reset-view":
          resetToInitialPosition();
          break;
        case "sample-architecture":
          // 建築史のサンプルイベントを追加
          console.log("建築史サンプルを追加");
          break;
        case "sample-history":
          // 日本史のサンプルイベントを追加
          console.log("日本史サンプルを追加");
          break;
        case "sample-clear":
          if (window.confirm("サンプルイベントをクリアしますか？")) {
            // サンプルイベントのみクリア
            console.log("サンプルイベントをクリア");
          }
          break;
        case "clear-all":
          if (
            window.confirm(
              "すべてのイベントと年表を削除しますか？\nこの操作は取り消せません。"
            )
          ) {
            setEvents([]);
            setCreatedTimelines([]);
            setCurrentFileName(null);
          }
          break;

        // ファイル操作
        case "new":
          if (
            events.length > 0 || Timelines.length > 0
              ? window.confirm(
                  "現在の年表をクリアして新規作成しますか？\n保存されていない変更は失われます。"
                )
              : true
          ) {
            setEvents([]);
            setCreatedTimelines([]);
            setCurrentFileName(null);
          }
          break;
        case "open":
          if (isAuthenticated) {
            setCurrentView("mypage");
          }
          break;
        case "save":
          if (isAuthenticated) {
            handleSaveTimeline();
          }
          break;
        case "save-as":
          if (isAuthenticated) {
            const fileName = prompt(
              "ファイル名を入力してください:",
              currentFileName || "新しい年表"
            );
            if (fileName) {
              // 名前を付けて保存の処理
              handleSaveTimelineAs(fileName);
            }
          }
          break;
        case "export-json":
          handleExportJSON();
          break;
        case "export-csv":
          handleExportCSV();
          break;
        case "export-image":
          handleExportImage();
          break;
        case "import-json":
          handleImportJSON();
          break;
        case "import-csv":
          handleImportCSV();
          break;

        // アカウント関連
        case "mypage":
          if (isAuthenticated) {
            setCurrentView("mypage");
          }
          break;
        case "profile":
          console.log("プロフィール設定（未実装）");
          break;
        case "login":
          if (!isAuthenticated) {
            signInWithGoogle();
          }
          break;
        case "logout":
          if (isAuthenticated) {
            signOut();
          }
          break;
        case "about-login":
          alert(
            "Googleアカウントでログインすると、年表の保存・読み込みができるようになります。\n\n・年表データをクラウドに保存\n・複数のデバイスで同期\n・過去の作品を管理"
          );
          break;

        // ヘルプ
        case "shortcuts":
          showKeyboardShortcuts();
          break;
        case "usage-guide":
          showUsageGuide();
          break;
        case "tips":
          showTips();
          break;
        case "feedback":
          window.open(
            "mailto:feedback@example.com?subject=年表アプリへのフィードバック",
            "_blank"
          );
          break;
        case "version":
          alert(
            "ハッシュタグ年表 v1.0.0\n\nReact製のインタラクティブな年表作成ツールです。"
          );
          break;
        case "about":
          showAboutDialog();
          break;

        default:
          console.log(`未実装のメニュー項目: ${itemId} in ${section}`);
      }
    },
    [
      isAuthenticated,
      events,
      Timelines,
      openNewEventModal,
      resetToInitialPosition,
      handleSaveTimeline,
      setEvents,
      setCreatedTimelines,
      setCurrentView,
      signInWithGoogle,
      signOut,
    ]
  );

  // 新しい保存・エクスポート関数
  const handleSaveTimelineAs = useCallback(
    async (fileName) => {
      if (!isAuthenticated || isSaving) return;

      setIsSaving(true);
      try {
        const timelineData = {
          events: events,
          timelines: Timelines,
          version: "1.0",
          savedAt: new Date().toISOString(),
        };

        const result = await saveTimelineData(timelineData, fileName);

        if (result) {
          setCurrentFileName(fileName);
          alert(`「${fileName}」として保存しました`);
        } else {
          alert("保存に失敗しました");
        }
      } finally {
        setIsSaving(false);
      }
    },
    [isAuthenticated, events, Timelines, saveTimelineData, isSaving]
  );

  const handleExportJSON = useCallback(() => {
    const timelineData = {
      events: events,
      timelines: Timelines,
      version: "1.0",
      exportedAt: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(timelineData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `timeline_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [events, Timelines]);

  const handleExportCSV = useCallback(() => {
    const csvData = events.map((event) => ({
      タイトル: event.title,
      日付: event.startDate.toISOString().split("T")[0],
      年: event.startDate.getFullYear(),
      説明: event.description || "",
      タグ: event.tags.join(", "),
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(","),
      ...csvData.map((row) =>
        Object.values(row)
          .map((val) => `"${val}"`)
          .join(",")
      ),
    ].join("\n");

    const dataBlob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `timeline_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [events]);

  const handleExportImage = useCallback(() => {
    alert(
      "画像エクスポート機能は開発中です。\n\nブラウザのスクリーンショット機能をご利用ください。"
    );
  }, []);

  const handleImportJSON = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const timelineData = JSON.parse(e.target.result);
            if (timelineData.events && Array.isArray(timelineData.events)) {
              handleLoadTimeline(timelineData);
              alert("JSONファイルを読み込みました");
            } else {
              alert("無効なファイル形式です");
            }
          } catch (error) {
            alert("ファイルの読み込みに失敗しました");
            console.error("Import error:", error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [handleLoadTimeline]);

  const handleImportCSV = useCallback(() => {
    alert(
      "CSV読み込み機能は開発中です。\n\n現在はJSONファイルの読み込みのみ対応しています。"
    );
  }, []);

  // ヘルプ関連の関数
  const showKeyboardShortcuts = useCallback(() => {
    const shortcuts = [
      "🖱️ ダブルクリック - イベント追加・編集",
      "🎯 マウスホイール - ズーム",
      "👆 ドラッグ - 横パン移動",
      "⇧ Shift + ドラッグ - 縦パン移動",
      "📱 年表カード - 縦ドラッグで移動",
      "💾 Ctrl/Cmd + S - 保存（ログイン時）",
      "📄 Ctrl/Cmd + N - 新規作成",
      "📂 Ctrl/Cmd + O - ファイルを開く",
      "⎋ Escape - モーダルを閉じる",
      "↵ Ctrl/Cmd + Enter - モーダルで保存",
    ];
    alert("⌨️ キーボードショートカット\n\n" + shortcuts.join("\n"));
  }, []);

  const showUsageGuide = useCallback(() => {
    const guide = [
      "1. ダブルクリックでイベントを追加",
      "2. タグ機能で関連イベントをグループ化",
      "3. 検索でタグを絞り込み",
      "4. 「年表を作成」で専用の年表を作成",
      "5. ドラッグ＆ドロップでイベントを移動",
      "6. ログインして保存・同期",
    ];
    alert("📖 基本的な使い方\n\n" + guide.join("\n"));
  }, []);

  const showTips = useCallback(() => {
    const tips = [
      "💡 説明文に #タグ名 を入力すると自動的にタグが追加されます",
      "🎨 年表は自動で色分けされます",
      "🔍 タグで検索してからまとめて年表化できます",
      "📱 年表カードをドラッグして見やすい位置に配置",
      "⚡ グループ化されたイベントはクリックで展開",
      "💾 こまめな保存で作業を保護",
    ];
    alert("💡 便利な使い方のコツ\n\n" + tips.join("\n"));
  }, []);

  const showAboutDialog = useCallback(() => {
    const about = [
      "📊 #ハッシュタグ年表",
      "",
      "タグベースのインタラクティブな年表作成ツール",
      "",
      "✨ 主な機能:",
      "• タグによる自動分類",
      "• ドラッグ&ドロップ操作",
      "• 複数年表の同時表示",
      "• クラウド保存（要ログイン）",
      "• データのエクスポート・インポート",
      "",
      "🛠️ 技術:",
      "React + JavaScript",
      "",
      "📝 フィードバックや要望をお気軽にお寄せください",
    ];
    alert(about.join("\n"));
  }, []);

  // HashtagTimeline.js のアカウントメニュー関連の追加部分

  // アカウントメニューが開いているかのクリックアウトハンドラー
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountMenuOpen && !event.target.closest(".account-menu")) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [accountMenuOpen]);

  // ヘッダーのスタイル更新（ホバー効果追加）
  const addHoverEffects = useCallback(() => {
    return {
      onMouseEnter: (e, bgColor = "#f3f4f6") => {
        e.currentTarget.style.backgroundColor = bgColor;
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      },
    };
  }, []);

  // アカウントボタンのホバー効果
  const accountButtonHover = {
    onMouseEnter: (e) => {
      e.currentTarget.style.backgroundColor = "#f3f4f6";
      e.currentTarget.style.borderColor = "#d1d5db";
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.backgroundColor = "#f9fafb";
      e.currentTarget.style.borderColor = "#e5e7eb";
    },
  };

  // ドロップダウンアイテムのホバー効果
  const dropdownItemHover = {
    onMouseEnter: (e) => {
      e.currentTarget.style.backgroundColor = "#f3f4f6";
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.backgroundColor = "transparent";
    },
  };

  // ドラッグ&ドロップ機能
  const {
    dragState,
    handleMouseDown: handleDragMouseDown,
    handleMouseMove: handleDragMouseMove,
    handleMouseUp: handleDragMouseUp,
    cancelDrag,
    isDragging: isDragActive,
  } = useDragDrop(
    moveEvent,
    moveTimeline,
    addEventToTimeline,
    removeEventFromTimeline
  );

  // テーブルビュー用のイベント削除ハンドラー
  const handleTableEventDelete = useCallback(
    (eventId) => {
      if (window.confirm("このイベントを削除しますか？")) {
        deleteEvent(eventId);
      }
    },
    [deleteEvent]
  );

  // 色の変換ユーティリティ関数
  const parseHslColor = (hslString) => {
    const match = hslString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (match) {
      return {
        h: parseInt(match[1]),
        s: parseInt(match[2]),
        l: parseInt(match[3]),
      };
    }
    return null;
  };

  const createEventColors = (timelineColor) => {
    const hsl = parseHslColor(timelineColor);
    if (!hsl) {
      return {
        backgroundColor: "#f3f4f6",
        textColor: "#374151",
      };
    }

    return {
      backgroundColor: `hsl(${hsl.h}, ${Math.max(20, hsl.s - 30)}%, 95%)`,
      textColor: `hsl(${hsl.h}, ${Math.min(100, hsl.s + 20)}%, 25%)`,
    };
  };

  // グループカードでのイベントダブルクリック処理
  const handleGroupEventDoubleClick = useCallback(
    (event) => {
      setEditingEvent(event);
      setNewEvent({
        title: event.title,
        description: event.description,
        date: event.startDate,
        manualTags: event.tags.filter(
          (tag) =>
            tag !== event.title &&
            !extractTagsFromDescription(event.description).includes(tag)
        ),
      });

      // モーダル位置を画面中央に設定
      setModalPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      setIsModalOpen(true);
    },
    [setEditingEvent, setNewEvent, setModalPosition, setIsModalOpen]
  );

  // 年表マーカー生成
  const generateYearMarkers = useCallback(() => {
    const markers = [];
    const adjustedScale = scale / 2.5;
    let yearInterval;

    if (adjustedScale > 12) yearInterval = 1;
    else if (adjustedScale > 6) yearInterval = 2;
    else if (adjustedScale > 2) yearInterval = 5;
    else if (adjustedScale > 0.8) yearInterval = 10;
    else if (adjustedScale > 0.4) yearInterval = 50;
    else if (adjustedScale > 0.2) yearInterval = 100;
    else if (adjustedScale > 0.1) yearInterval = 200;
    else if (adjustedScale > 0.04) yearInterval = 500;
    else yearInterval = 1000;

    for (let year = -5000; year <= 5000; year += yearInterval) {
      const x = (year - -5000) * currentPixelsPerYear + panX;
      if (x > -100 && x < window.innerWidth + 100) {
        markers.push(
          <div
            key={year}
            style={{
              position: "absolute",
              left: x,
              top: 0,
              height: "100%",
              borderLeft: "1px solid #ddd",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: "10px",
                left: "5px",
                fontSize: "12px",
                color: "#666",
                userSelect: "none",
              }}
            >
              {year}
            </span>
            <span
              style={{
                position: "absolute",
                bottom: "10px",
                left: "5px",
                fontSize: "12px",
                color: "#666",
                userSelect: "none",
              }}
            >
              {year}
            </span>
          </div>
        );
      }
    }
    return markers;
  }, [scale, currentPixelsPerYear, panX]);

  const styles = createTimelineStyles(isDragging.current, 0);
  const timelineAxes = getTimelineAxesForDisplay();
  const axesMap = new Map(timelineAxes.map((axis) => [axis.id, axis]));

  // 表示用のイベント（シンプルに全て表示）
  const visibleEvents = advancedEventPositions.allEvents.filter(
    (event) => !event.hiddenByGroup
  );

  // ドラッグ中のマウス移動処理
  useEffect(() => {
    if (isDragActive) {
      const handleGlobalMouseMove = (e) => {
        handleDragMouseMove(e);
      };

      const handleGlobalMouseUp = (e) => {
        const currentTimelineAxes = getTimelineAxesForDisplay();
        const currentEventPositions = visibleEvents.map((event) => ({
          id: event.id,
          x: event.adjustedPosition.x,
          y: event.adjustedPosition.y,
          timelineId: event.timelineId,
        }));

        handleDragMouseUp(e, currentTimelineAxes, currentEventPositions);
      };

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          cancelDrag();
        }
      };

      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("mousemove", handleGlobalMouseMove);
        document.removeEventListener("mouseup", handleGlobalMouseUp);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [
    isDragActive,
    handleDragMouseMove,
    handleDragMouseUp,
    cancelDrag,
    getTimelineAxesForDisplay,
    visibleEvents,
  ]);

  return (
    <div style={styles.app}>
      {/* サイドバー */}
      {isDesktop && (
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onMenuItemClick={handleSidebarMenuClick}
          currentUser={user}
          isSaving={isSaving}
          canSave={events.length > 0 || Timelines.length > 0}
        />
      )}
      {/* メインコンテンツラッパー */}
      <div
        style={{
          marginLeft: isDesktop ? 60 : 0,
          transition: "margin-left 0.3s ease",
          width: isDesktop ? "calc(100% - 60px)" : "100%",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ヘッダー - ファイル内操作とアカウント */}
        <div style={styles.header}>
          {/* 左側：現在のファイル情報とビュー切り替え */}
          <div style={styles.headerLeft}>
            {/* 現在のファイル名表示 */}
            <div style={styles.currentFile}>
              {currentFileName ? (
                <span style={styles.fileName}>📄 {currentFileName}</span>
              ) : (
                <span style={styles.fileName}>📄 無題の年表</span>
              )}
              {(events.length > 0 || Timelines.length > 0) &&
                !currentFileName && (
                  <span style={styles.unsavedIndicator}>*</span>
                )}
            </div>

            {/* ビュー切り替えボタン - Wiki タブを追加 */}
            <div style={styles.viewToggle}>
              <button
                onClick={() => setCurrentView("timeline")}
                style={{
                  ...styles.viewButton,
                  ...(currentView === "timeline"
                    ? styles.viewButtonActive
                    : {}),
                }}
              >
                📊 年表
              </button>
              <button
                onClick={() => setCurrentView("event")} // ← 追加
                style={{
                  ...styles.viewButton,
                  ...(currentView === "event" ? styles.viewButtonActive : {}),
                }}
              >
                🎯 イベント
              </button>
              <button
                onClick={() => setCurrentView("table")}
                style={{
                  ...styles.viewButton,
                  ...(currentView === "table" ? styles.viewButtonActive : {}),
                }}
              >
                📋 テーブル
              </button>
              <button
                onClick={() => setCurrentView("wiki")}
                style={{
                  ...styles.viewButton,
                  ...(currentView === "wiki" ? styles.viewButtonActive : {}),
                }}
              >
                📚 Wiki
              </button>
            </div>
          </div>

          {/* 中央：タイトル */}
          <div style={styles.headerCenter}>
            <h1 style={styles.title}>#ハッシュタグ年表</h1>
          </div>

          {/* 右側：ファイル内操作とアカウント */}
          <div style={styles.headerRight}>
            {/* ファイル内操作ボタン */}
            {currentView === "timeline" && (
              <>
                <button
                  style={styles.actionButton}
                  onClick={resetToInitialPosition}
                  title="初期位置に戻す"
                >
                  🎯 初期位置
                </button>
                <span style={styles.zoomInfo}>
                  🔍 {(scale / 2.5).toFixed(1)}x
                </span>
              </>
            )}

            {/* イベント追加ボタン */}
            <button
              style={styles.actionButton}
              onClick={openNewEventModal}
              title="新しいイベントを追加"
            >
              ➕ イベント追加
            </button>

            {/* 保存ボタン（ログイン時のみ） */}
            {isAuthenticated && (
              <button
                onClick={handleSaveTimeline}
                style={{
                  ...styles.actionButton,
                  backgroundColor: isSaving ? "#9ca3af" : "#10b981",
                }}
                disabled={isSaving}
                title="現在の年表を保存"
              >
                {isSaving ? "💾 保存中..." : "💾 保存"}
              </button>
            )}

            {/* アカウントメニュー */}
            <div style={styles.accountContainer}>
              {loading ? (
                <span style={styles.loadingText}>読み込み中...</span>
              ) : isAuthenticated ? (
                <div style={styles.accountMenu}>
                  <button
                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                    style={styles.accountButton}
                    title="アカウントメニュー"
                  >
                    <span style={styles.userIcon}>👤</span>
                    <span style={styles.userEmail}>
                      {user.email.split("@")[0]}
                    </span>
                    <span style={styles.dropdownIcon}>▼</span>
                  </button>

                  {/* ドロップダウンメニュー */}
                  {accountMenuOpen && (
                    <div style={styles.dropdown}>
                      <div style={styles.dropdownHeader}>
                        <div style={styles.fullEmail}>{user.email}</div>
                      </div>
                      <div style={styles.dropdownDivider}></div>
                      <button
                        onClick={() => {
                          setCurrentView("mypage");
                          setAccountMenuOpen(false);
                        }}
                        style={styles.dropdownItem}
                      >
                        📂 マイページ
                      </button>
                      <div style={styles.dropdownDivider}></div>
                      <button
                        onClick={() => {
                          signOut();
                          setAccountMenuOpen(false);
                        }}
                        style={styles.dropdownItem}
                      >
                        🚪 ログアウト
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  style={styles.loginButton}
                  title="Googleアカウントでログイン"
                >
                  🔑 ログイン
                </button>
              )}
            </div>
          </div>
        </div>

        {/* メインコンテンツ - Wiki ビューを追加 */}
        {currentView === "table" ? (
          <TableView
            events={events}
            timelines={Timelines}
            highlightedEvents={highlightedEvents}
            onEventUpdate={updateEvent}
            onEventDelete={handleTableEventDelete}
            searchTerm={searchTerm}
          />
        ) : currentView === "mypage" ? (
          <MyPage
            user={user}
            supabaseSync={{ getUserTimelines, deleteTimelineFile }}
            onLoadTimeline={handleLoadTimeline}
            onBackToTimeline={() => setCurrentView("timeline")}
          />
        ) : currentView === "wiki" ? (
          <WikiBrowser
            user={user}
            wikiData={wikiData}
            onImportEvent={handleWikiEventImport}
            onBackToTimeline={() => setCurrentView("timeline")}
          />
        ) : currentView === "event" ? ( // ← 追加
          // イベントビュー
          <div
            ref={timelineRef}
            style={styles.timeline}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
          >
            <EventView
              events={events}
              timelines={Timelines}
              currentPixelsPerYear={currentPixelsPerYear}
              panX={panX}
              panY={panY}
              scale={scale}
              highlightedEvents={highlightedEvents}
              onEventDoubleClick={handleDoubleClick}
              onEventDrag={handleDragMouseDown}
              calculateTextWidth={calculateTextWidth}
            />

            {/* 既存の共通UI要素も表示 */}
            <div className="floating-panel">
              <button style={styles.addButton} onClick={openNewEventModal}>
                + イベントを追加
              </button>
            </div>

            <SearchPanel
              searchTerm={searchTerm}
              highlightedEvents={highlightedEvents}
              onSearchChange={handleSearchChange}
              onCreateTimeline={createTimeline}
              onDeleteTimeline={deleteTimeline}
              getTopTagsFromSearch={getTopTagsFromSearch}
              styles={styles}
            />

            {/* ドラッグ中のプレビュー */}
            {isDragActive && dragState.draggedItem && (
              <div
                style={{
                  position: "fixed",
                  left: dragState.startPosition.x - 50,
                  top: dragState.startPosition.y - 15,
                  zIndex: 9999,
                  pointerEvents: "none",
                  opacity: 0.9,
                  backgroundColor: "#3b82f6",
                  color: "white",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: "500",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                }}
              >
                📱 {dragState.draggedItem.title}
              </div>
            )}
          </div>
        ) : (
          // 年表ビュー
          <div
            ref={timelineRef}
            style={styles.timeline}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
          >
            {/* 年マーカー */}
            {generateYearMarkers()}

            {/* イベントを追加ボタン */}
            <div className="floating-panel">
              <button style={styles.addButton} onClick={openNewEventModal}>
                + イベントを追加
              </button>
            </div>

            {/* 検索パネル */}
            <SearchPanel
              searchTerm={searchTerm}
              highlightedEvents={highlightedEvents}
              onSearchChange={handleSearchChange}
              onCreateTimeline={createTimeline}
              onDeleteTimeline={deleteTimeline}
              getTopTagsFromSearch={getTopTagsFromSearch}
              styles={styles}
            />

            {/* Part 1: 年号とグループアイコンを描画 */}
            {visibleEvents.map((event, index) => {
              if (event.isGroup) {
                return (
                  <EventGroupIcon
                    key={`group-${event.groupData.id}-${index}`}
                    groupData={event.groupData}
                    position={{
                      x: event.adjustedPosition.x,
                      y: event.adjustedPosition.y,
                    }}
                    panY={panY}
                    timelineColor={event.timelineColor || "#6b7280"}
                    onHover={handleGroupHover}
                    onDoubleClick={handleDoubleClick}
                  />
                );
              }

              const uniqueKey = event.timelineId
                ? `year-${event.id}-${event.timelineId}-${index}`
                : `year-${event.id}-main-${index}`;

              return (
                <div
                  key={uniqueKey}
                  style={{
                    position: "absolute",
                    left: event.adjustedPosition.x,
                    top: event.adjustedPosition.y + panY + 8 + "px",
                    transform: "translateX(-50%)",
                    zIndex: 2,
                    textAlign: "center",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#666",
                      marginBottom: "2px",
                    }}
                  >
                    {event.startDate.getFullYear()}
                  </div>
                </div>
              );
            })}

            {/* Part 2: イベントタイトルを描画 */}
            {visibleEvents.map((event, index) => {
              if (event.isGroup) return null;

              const isHighlighted = highlightedEvents.has(event.id);
              const truncatedTitle = truncateTitle(event.title);
              const eventWidth =
                event.calculatedWidth ||
                calculateTextWidth(truncatedTitle) + 16;

              let eventColors = {
                backgroundColor: "#6b7280",
                textColor: "white",
              };

              if (event.timelineColor && !event.isRemoved) {
                eventColors = createEventColors(event.timelineColor);
              } else if (isHighlighted) {
                eventColors = {
                  backgroundColor: "#10b981",
                  textColor: "white",
                };
              } else if (event.id === 1 || event.id === 2) {
                eventColors = {
                  backgroundColor: event.id === 1 ? "#3b82f6" : "#ef4444",
                  textColor: "white",
                };
              }

              const uniqueKey = event.timelineId
                ? `event-${event.id}-${event.timelineId}-${index}`
                : `event-${event.id}-main-${index}`;

              return (
                <div
                  key={uniqueKey}
                  data-event-id={event.id}
                  style={{
                    position: "absolute",
                    left: event.adjustedPosition.x,
                    top: event.adjustedPosition.y + panY + 15 + "px",
                    transform: "translateX(-50%)",
                    cursor: "ns-resize",
                    zIndex: isHighlighted ? 5 : 4,
                    textAlign: "center",
                    userSelect: "none",
                    opacity:
                      isDragActive && dragState.draggedItem?.id === event.id
                        ? 0.7
                        : 1,
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if (e.detail === 1) {
                      const dragItem = {
                        ...event,
                        timelineId: event.timelineId || null,
                        timelineName: event.timelineName || null,
                        isTemporary: event.isTemporary || false,
                      };
                      handleDragMouseDown(e, "event", dragItem);
                    }
                  }}
                >
                  <div
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      color: eventColors.textColor,
                      fontWeight: "500",
                      fontSize: "11px",
                      width: `${Math.max(60, eventWidth)}px`,
                      backgroundColor: eventColors.backgroundColor,
                      border: isHighlighted
                        ? "2px solid #059669"
                        : event.isTemporary
                        ? `2px dashed ${event.timelineColor}`
                        : event.timelineColor && !event.isRemoved
                        ? `1px solid ${event.timelineColor}`
                        : "none",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                      lineHeight: "1.1",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {truncatedTitle}
                  </div>
                </div>
              );
            })}

            {/* グループツールチップ */}
            {hoveredGroup && (
              <GroupTooltip
                groupData={hoveredGroup.data}
                position={{
                  x: hoveredGroup.data.position.x,
                  y: hoveredGroup.data.position.y,
                }}
                panY={panY}
              />
            )}

            {/* 展開されたグループカード */}
            {Array.from(expandedGroups).map((groupId) => {
              const groupCard = groupManager.getGroupCard(groupId);
              const groupData = advancedEventPositions.eventGroups.find(
                (g) => g.id === groupId
              );

              if (!groupCard || !groupData) return null;

              return (
                <GroupCard
                  key={`card-${groupId}`}
                  groupData={groupData}
                  position={groupCard.position}
                  panY={panY}
                  panX={panX}
                  timelineColor={
                    groupData.events[0]?.timelineColor || "#6b7280"
                  }
                  onEventDoubleClick={handleGroupEventDoubleClick}
                  onClose={() => toggleEventGroup(groupId, groupCard.position)}
                />
              );
            })}

            {/* 年表カード */}
            {Timelines.map((timeline, index) => {
              const axis = axesMap.get(timeline.id);
              const xPosition = axis ? axis.startX : 20;
              const baseCardY =
                cardPositions[timeline.id]?.y ||
                TIMELINE_CONFIG.FIRST_ROW_Y +
                  index * TIMELINE_CONFIG.ROW_HEIGHT;
              const centeredCardY = baseCardY + TIMELINE_CONFIG.ROW_HEIGHT / 2;

              const customTimelinePosition = timelinePositions.get(timeline.id);
              const finalCardY = customTimelinePosition
                ? customTimelinePosition.y
                : centeredCardY;

              return (
                <TimelineCard
                  key={timeline.id}
                  timeline={timeline}
                  position={{ x: xPosition, y: finalCardY }}
                  panY={panY}
                  onDeleteTimeline={deleteTimeline}
                  onDoubleClick={() => openTimelineModal(timeline)}
                  onMouseDown={(e) =>
                    handleDragMouseDown(e, "timeline", {
                      ...timeline,
                      yPosition: finalCardY,
                    })
                  }
                  isDragging={
                    isDragActive && dragState.draggedItem?.id === timeline.id
                  }
                />
              );
            })}

            {/* 年表軸線の描画 */}
            {timelineAxes.map((axis) => (
              <div key={`axis-${axis.id}`}>
                <div
                  style={{
                    position: "absolute",
                    left: axis.startX - 100,
                    top: axis.yPosition,
                    width: Math.max(0, axis.endX - axis.startX) + 100,
                    height: "3px",
                    backgroundColor: axis.color,
                    opacity: 0.8,
                    zIndex: 0,
                    borderRadius: "1px",
                  }}
                />

                {isDragActive && dragState.dragType === "event" && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: axis.yPosition - 60,
                      width: "100%",
                      height: "120px",
                      backgroundColor: `${axis.color}15`,
                      border: `2px dashed ${axis.color}`,
                      borderRadius: "8px",
                      zIndex: 1,
                      pointerEvents: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                      color: axis.color,
                      fontWeight: "500",
                      opacity: 0.8,
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: "white",
                        padding: "6px 12px",
                        borderRadius: "16px",
                        border: `1px solid ${axis.color}`,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {axis.name} に仮登録
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* 現在ライン */}
            <div
              style={{
                position: "absolute",
                left: (2025.6 - -5000) * currentPixelsPerYear + panX,
                top: 0,
                height: "100%",
                borderLeft: "2px solid #f59e0b",
                pointerEvents: "none",
                opacity: 0.8,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "5px",
                  top: "20px",
                  fontSize: "12px",
                  color: "#f59e0b",
                  backgroundColor: "rgba(255,255,255,0.9)",
                  padding: "2px 6px",
                  borderRadius: "3px",
                  fontWeight: "600",
                }}
              >
                現在 (2025)
              </div>
            </div>
          </div>
        )}

        {/* 年表詳細モーダル */}
        <TimelineModal
          isOpen={timelineModalOpen}
          timeline={selectedTimelineForModal}
          onClose={closeTimelineModal}
          onEventRemove={removeEventFromTimeline}
          onEventAdd={addEventToTimeline}
          allEvents={events}
        />

        {/* ドラッグ中のプレビュー */}
        {isDragActive && dragState.draggedItem && (
          <>
            <div
              style={{
                position: "fixed",
                left: dragState.startPosition.x - 1,
                top: 0,
                width: "2px",
                height: "100vh",
                backgroundColor: "#3b82f6",
                opacity: 0.3,
                zIndex: 9998,
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                position: "fixed",
                left: dragState.startPosition.x - 40,
                top: dragState.currentPosition.y - 15,
                zIndex: 9999,
                pointerEvents: "none",
                opacity: 0.9,
                backgroundColor: (() => {
                  const headerHeight = 64;
                  const nearTimeline = timelineAxes.find((axis) => {
                    const adjustedAxisY = axis.yPosition + headerHeight;
                    const distance = Math.abs(
                      dragState.currentPosition.y - adjustedAxisY
                    );
                    return distance < 60;
                  });

                  if (dragState.draggedItem.timelineId && !nearTimeline) {
                    return "#ef4444";
                  }

                  return nearTimeline ? nearTimeline.color : "#3b82f6";
                })(),
                color: "white",
                padding: "6px 12px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: "500",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                border: "1px solid white",
                transition: "background-color 0.2s ease",
              }}
            >
              {(() => {
                const headerHeight = 64;
                const nearTimeline = timelineAxes.find((axis) => {
                  const adjustedAxisY = axis.yPosition + headerHeight;
                  const distance = Math.abs(
                    dragState.currentPosition.y - adjustedAxisY
                  );
                  return distance < 60;
                });

                if (dragState.draggedItem.timelineId && !nearTimeline) {
                  return `✕ ${dragState.draggedItem.timelineName}から削除`;
                }

                return nearTimeline
                  ? `→ ${nearTimeline.name}`
                  : dragState.draggedItem.title;
              })()}
            </div>
          </>
        )}

        {/* モーダル */}
        <EventModal
          isOpen={isModalOpen}
          editingEvent={editingEvent}
          newEvent={newEvent}
          modalPosition={modalPosition}
          onSave={saveEvent}
          onClose={closeModal}
          onAddManualTag={addManualTag}
          onRemoveManualTag={removeManualTag}
          getAllCurrentTags={getAllCurrentTags}
          onEventChange={handleEventChange}
        />
      </div>

      {/* アカウントメニューが開いている時のオーバーレイ */}
      {accountMenuOpen && (
        <div
          style={styles.menuOverlay}
          onClick={() => setAccountMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default HashtagTimeline;
