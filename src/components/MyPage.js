// src/components/MyPage.js
import React, { useState, useEffect } from "react";

const MyPage = ({ user, supabaseSync, onLoadTimeline, onBackToTimeline }) => {
  const [timelines, setTimelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null); // ★ 追加: 削除中のIDを管理

  const { getUserTimelines, deleteTimeline } = supabaseSync;

  // 年表一覧取得
  useEffect(() => {
    const loadTimelines = async () => {
      setLoading(true);
      try {
        const data = await getUserTimelines();
        setTimelines(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error("ファイル取得エラー:", err);
        setError(err?.message || "ファイルの取得に失敗しました");
        setTimelines([]); // エラー時は空配列
      } finally {
        setLoading(false);
      }
    };

    if (user) loadTimelines();
  }, [user, getUserTimelines]);

  // 年表削除
  const handleDelete = async (timelineId, titleForConfirm) => {
    if (deletingId) return; // ★ 連打防止（すでに削除中なら無視）

    const ok = window.confirm(
      titleForConfirm
        ? `「${titleForConfirm}」を削除しますか？\nこの操作は取り消せません。`
        : "このファイルを削除しますか？\nこの操作は取り消せません。"
    );
    if (!ok) return;

    setDeletingId(timelineId);
    setError(null);

    try {
      const success = await deleteTimeline(timelineId);

      if (success) {
        // 楽観的更新
        setTimelines((prev) => prev.filter((t) => t.id !== timelineId));
      } else {
        setError("削除に失敗しました（詳細はコンソールをご確認ください）");
        alert("削除に失敗しました");
      }
    } catch (err) {
      console.error("削除エラー:", err);
      setError(err?.message || "削除に失敗しました");
      alert("削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  };

  // 年表読み込み
  const handleLoad = (timeline) => {
    // もし timeline.timeline_data が文字列ならパース
    const raw = timeline.timeline_data;
    const timelineData =
      typeof raw === "string"
        ? (() => {
            try {
              return JSON.parse(raw);
            } catch {
              return null;
            }
          })()
        : raw;

    if (timelineData) {
      onLoadTimeline(timelineData);
      onBackToTimeline();
    } else {
      setError("保存データの形式が不正です（JSONの読み込みに失敗）");
    }
  };

  if (loading) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          height: "calc(100vh - 64px)",
          backgroundColor: "white",
        }}
      >
        読み込み中...
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "white",
        height: "calc(100vh - 64px)",
        overflow: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "24px", color: "#374151" }}>
          マイページ
        </h2>
        <button
          onClick={onBackToTimeline}
          style={{
            padding: "8px 16px",
            backgroundColor: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          年表に戻る
        </button>
      </div>

      <div
        style={{
          backgroundColor: "#f9fafb",
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "24px",
        }}
      >
        <h3 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>ユーザー情報</h3>
        <p style={{ margin: 0, color: "#6b7280" }}>{user.email}</p>
      </div>

      <div>
        <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>
          保存済みファイル ({timelines.length}件)
        </h3>

        {error && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              color: "#dc2626",
              padding: "12px",
              borderRadius: "4px",
              marginBottom: "16px",
              whiteSpace: "pre-wrap",
            }}
          >
            エラー: {error}
          </div>
        )}

        {timelines.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#6b7280",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            まだファイルが保存されていません
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "16px",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            }}
          >
            {timelines.map((timeline) => {
              const isDeleting = deletingId === timeline.id;
              return (
                <div
                  key={timeline.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "16px",
                    backgroundColor: "white",
                    opacity: isDeleting ? 0.6 : 1,
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "16px",
                      color: "#374151",
                    }}
                  >
                    {timeline.title}
                  </h4>

                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      作成:{" "}
                      {timeline.created_at
                        ? new Date(timeline.created_at).toLocaleDateString(
                            "ja-JP"
                          )
                        : "-"}
                    </div>
                    <div>
                      更新:{" "}
                      {timeline.updated_at
                        ? new Date(timeline.updated_at).toLocaleDateString(
                            "ja-JP"
                          )
                        : "-"}
                    </div>
                    {timeline.timeline_data && (
                      <div>
                        イベント数:{" "}
                        {Array.isArray(
                          (typeof timeline.timeline_data === "string"
                            ? (() => {
                                try {
                                  return JSON.parse(timeline.timeline_data);
                                } catch {
                                  return {};
                                }
                              })()
                            : timeline.timeline_data
                          )?.events
                        )
                          ? (typeof timeline.timeline_data === "string"
                              ? (() => {
                                  try {
                                    return JSON.parse(timeline.timeline_data);
                                  } catch {
                                    return { events: [] };
                                  }
                                })()
                              : timeline.timeline_data
                            ).events.length
                          : 0}
                        件
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      onClick={() => handleLoad(timeline)}
                      disabled={isDeleting}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: isDeleting ? "not-allowed" : "pointer",
                        fontSize: "12px",
                      }}
                    >
                      読み込み
                    </button>
                    <button
                      onClick={() =>
                        handleDelete(timeline.id, timeline.title)
                      }
                      disabled={isDeleting}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: isDeleting ? "not-allowed" : "pointer",
                        fontSize: "12px",
                      }}
                    >
                      {isDeleting ? "削除中…" : "削除"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPage;
