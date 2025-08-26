// src/components/WikiBrowser.js の修正版
import React, { useState, useEffect, useCallback } from "react";
import WikiEventCard from "./WikiEventCard";
import WikiEventForm from "./WikiEventForm";
import WikiEventDetail from "./WikiEventDetail";

const WikiBrowser = ({ user, wikiData, onImportEvent, onBackToTimeline }) => {
  const [currentTab, setCurrentTab] = useState("browse"); // 'browse', 'contribute', 'history'
  const [searchTerm, setSearchTerm] = useState("");
  const [sharedEvents, setSharedEvents] = useState([]);
  const [popularTags, setPopularTags] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState("browse"); // 'browse' | 'event-detail'
  const [selectedEvent, setSelectedEvent] = useState(null);

  const {
    getSharedEvents,
    createSharedEvent,
    updateSharedEvent,
    importEventToPersonal,
    getPopularTags,
    loading: apiLoading,
  } = wikiData;

  // 共用イベント読み込み
  const loadSharedEvents = useCallback(async () => {
    setLoading(true);
    const events = await getSharedEvents(searchTerm);
    setSharedEvents(events);
    setLoading(false);
  }, [getSharedEvents, searchTerm]);

  // 人気タグ読み込み
  const loadPopularTags = useCallback(async () => {
    const tags = await getPopularTags(10);
    setPopularTags(tags);
  }, [getPopularTags]);

  // 初回読み込み
  useEffect(() => {
    loadSharedEvents();
    loadPopularTags();
  }, [loadSharedEvents, loadPopularTags]);

  // 検索実行（500ms のデバウンス）
  useEffect(() => {
    const timer = setTimeout(() => {
      loadSharedEvents();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // イベント保存
  const handleSaveEvent = async (eventData) => {
    let result;

    if (editingEvent) {
      result = await updateSharedEvent(editingEvent.id, {
        title: eventData.title,
        description: eventData.description,
        tags: eventData.tags,
        startDate: eventData.startDate,
      });
    } else {
      result = await createSharedEvent(eventData);
    }

    if (result) {
      setShowEventForm(false);
      setEditingEvent(null);
      await loadSharedEvents();
      alert(editingEvent ? "イベントを更新しました" : "イベントを作成しました");
    }
  };

  // インポート処理
  const handleImportEvent = async (sharedEvent) => {
    const personalEvent = importEventToPersonal(sharedEvent);
    onImportEvent(personalEvent);

    // インポート成功通知
    alert(`「${sharedEvent.title}」を個人年表にインポートしました`);
  };

  // タグクリックで検索
  const handleTagClick = (tag) => {
    setSearchTerm(tag);
  };

  const styles = {
    container: {
      padding: "20px",
      backgroundColor: "white",
      height: "calc(100vh - 64px)",
      overflow: "auto",
    },
    header: {
      backgroundColor: "#f8fafc",
      padding: "20px",
      borderRadius: "12px",
      marginBottom: "24px",
      textAlign: "center",
    },
    title: {
      margin: "0 0 8px 0",
      fontSize: "28px",
      color: "#1f2937",
    },
    subtitle: {
      margin: "0",
      fontSize: "16px",
      color: "#6b7280",
    },
    tabContainer: {
      display: "flex",
      borderBottom: "2px solid #e5e7eb",
      marginBottom: "20px",
    },
    tab: {
      padding: "12px 16px",
      border: "none",
      backgroundColor: "transparent",
      color: "#6b7280",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "4px",
      borderBottom: "2px solid transparent",
    },
    tabActive: {
      borderBottom: "2px solid #3b82f6",
      color: "#3b82f6",
    },
    searchBar: {
      backgroundColor: "#f9fafb",
      padding: "16px",
      borderRadius: "8px",
      marginBottom: "20px",
    },
    searchInput: {
      width: "100%",
      padding: "10px 14px",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      fontSize: "14px",
      marginBottom: "12px",
    },
    filterContainer: {
      display: "flex",
      gap: "12px",
      fontSize: "12px",
      alignItems: "center",
      flexWrap: "wrap",
    },
    createButton: {
      padding: "8px 16px",
      backgroundColor: "#10b981",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "14px",
      cursor: "pointer",
      fontWeight: "500",
    },
    backButton: {
      padding: "8px 16px",
      backgroundColor: "#6b7280",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "14px",
      cursor: "pointer",
      marginRight: "12px",
    },
    loadingMessage: {
      textAlign: "center",
      padding: "40px",
      color: "#6b7280",
    },
    contributeSection: {
      textAlign: "center",
      padding: "60px 20px",
      backgroundColor: "#f9fafb",
      borderRadius: "12px",
    },
    popularTagsSection: {
      marginBottom: "16px",
    },
    tagsContainer: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
      alignItems: "center",
    },
    tagButton: {
      padding: "4px 8px",
      backgroundColor: "#e0e7ff",
      color: "#3730a3",
      border: "none",
      borderRadius: "12px",
      fontSize: "12px",
      cursor: "pointer",
      fontWeight: "500",
      transition: "background-color 0.2s",
    },
    statsContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
      gap: "16px",
      marginBottom: "20px",
      backgroundColor: "#f8fafc",
      padding: "16px",
      borderRadius: "8px",
    },
    statItem: {
      textAlign: "center",
    },
    statValue: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#1f2937",
    },
    statLabel: {
      fontSize: "12px",
      color: "#6b7280",
    },
  };

  // イベント詳細を表示する関数を追加
  const handleEventDetail = (event) => {
    setSelectedEvent(event);
    setCurrentView("event-detail");
  };

  // 🆕 ブラウザに戻る関数
  const handleBackToBrowser = () => {
    setCurrentView("browse");
    setSelectedEvent(null);
  };

  return (
    <div style={styles.container}>
      {/* ヘッダー */}
      <div style={styles.header}>
        <h1 style={styles.title}>📚 TLwiki (Timeline Wiki)</h1>
        <p style={styles.subtitle}>
          みんなでイベント情報を蓄積・共有し、個人の年表作成を支援
        </p>
        <div style={{ marginTop: "16px" }}>
          <button style={styles.backButton} onClick={onBackToTimeline}>
            ← 年表に戻る
          </button>
        </div>
      </div>

      {/* 🆕 条件分岐を追加 */}
      {currentView === "browse" ? (
        <>
          {/* 統計情報 */}
          <div style={styles.statsContainer}>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{sharedEvents.length}</div>
              <div style={styles.statLabel}>総イベント数</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{popularTags.length}</div>
              <div style={styles.statLabel}>アクティブタグ</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{user ? "✓" : "-"}</div>
              <div style={styles.statLabel}>ログイン状態</div>
            </div>
          </div>

          {/* タブナビゲーション */}
          <div style={styles.tabContainer}>
            {[
              {
                id: "browse",
                label: "📖 イベントを探す",
                desc: "Wikiから個人ファイルに追加",
              },
              {
                id: "contribute",
                label: "✏️ 編集に参加",
                desc: "共用データベースを充実させる",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                style={{
                  ...styles.tab,
                  ...(currentTab === tab.id ? styles.tabActive : {}),
                }}
              >
                <span>{tab.label}</span>
                <span style={{ fontSize: "10px", opacity: 0.8 }}>
                  {tab.desc}
                </span>
              </button>
            ))}
          </div>

          {/* メインコンテンツ */}
          {currentTab === "browse" && (
            <div>
              {/* 検索・フィルター */}
              <div style={styles.searchBar}>
                <input
                  type="text"
                  placeholder="イベント名、タグで検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                />

                {/* 人気タグ */}
                {popularTags.length > 0 && (
                  <div style={styles.popularTagsSection}>
                    <div
                      style={{
                        fontSize: "12px",
                        marginBottom: "8px",
                        color: "#6b7280",
                      }}
                    >
                      人気のタグ:
                    </div>
                    <div style={styles.tagsContainer}>
                      {popularTags.slice(0, 8).map((tagData, index) => (
                        <button
                          key={index}
                          onClick={() => handleTagClick(tagData.tag || tagData)}
                          style={styles.tagButton}
                          onMouseEnter={(e) =>
                            (e.target.style.backgroundColor = "#c7d2fe")
                          }
                          onMouseLeave={(e) =>
                            (e.target.style.backgroundColor = "#e0e7ff")
                          }
                        >
                          #{tagData.tag || tagData}{" "}
                          {tagData.count && `(${tagData.count})`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div style={styles.filterContainer}>
                  <span>🔍 検索結果: {sharedEvents.length}件</span>
                  {user && (
                    <button
                      style={styles.createButton}
                      onClick={() => setShowEventForm(true)}
                    >
                      ✨ 新しいイベントを提案
                    </button>
                  )}
                </div>
              </div>

              {/* イベント一覧 */}
              <div>
                {loading || apiLoading ? (
                  <div style={styles.loadingMessage}>読み込み中...</div>
                ) : sharedEvents.length === 0 ? (
                  <div style={styles.loadingMessage}>
                    {searchTerm
                      ? "検索結果が見つかりませんでした"
                      : "イベントがまだありません"}
                  </div>
                ) : (
                  sharedEvents.map((event) => (
                    <WikiEventCard
                      key={event.id}
                      event={event}
                      onImport={() => handleImportEvent(event)}
                      onEdit={
                        user
                          ? () => {
                              setEditingEvent(event);
                              setShowEventForm(true);
                            }
                          : null
                      }
                      canEdit={user !== null}
                      // 🆕 詳細表示のクリックハンドラーを追加
                      onClick={() => handleEventDetail(event)}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {currentTab === "contribute" && (
            <div style={styles.contributeSection}>
              <h2 style={{ marginBottom: "16px", color: "#374151" }}>
                🤝 コミュニティに貢献しよう
              </h2>
              <p
                style={{
                  marginBottom: "24px",
                  color: "#6b7280",
                  lineHeight: "1.6",
                }}
              >
                あなたの知識でTLwikiをより豊かに。
                <br />
                イベントの追加、既存情報の改善など、様々な形で参加できます。
              </p>
              {user ? (
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    justifyContent: "center",
                  }}
                >
                  <button
                    style={styles.createButton}
                    onClick={() => {
                      setEditingEvent(null);
                      setShowEventForm(true);
                    }}
                  >
                    📝 新しいイベントを追加
                  </button>
                </div>
              ) : (
                <p style={{ color: "#ef4444", fontWeight: "500" }}>
                  編集に参加するにはログインが必要です
                </p>
              )}
            </div>
          )}

          {/* イベント作成・編集フォーム */}
          {showEventForm && user && (
            <WikiEventForm
              event={editingEvent}
              onSave={handleSaveEvent}
              onCancel={() => {
                setShowEventForm(false);
                setEditingEvent(null);
              }}
              loading={apiLoading}
            />
          )}
        </>
      ) : (
        // 🆕 イベント詳細表示
        <WikiEventDetail
          eventId={selectedEvent?.id}
          slug={selectedEvent?.slug}
          user={user}
          supabaseClient={wikiData.supabaseClient} // supabaseClientを渡す
          onBack={handleBackToBrowser}
        />
      )}
    </div>
  );
};

export default WikiBrowser;
