// src/components/MyPage.js
import React, { useState, useEffect } from "react";

const MyPage = ({ user, supabaseSync, onLoadTimeline, onBackToTimeline }) => {
  const [timelines, setTimelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { getUserTimelines, deleteTimeline } = supabaseSync;

  // 年表一覧取得
  useEffect(() => {
    const loadTimelines = async () => {
      setLoading(true);
      try {
        const data = await getUserTimelines();
        setTimelines(data);
        setError(null);
      } catch (err) {
        console.error("ファイル取得エラー:", err);
        setError(err.message);
        setTimelines([]); // エラー時は空配列
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadTimelines();
    }
  }, [user, getUserTimelines]);

  // 年表削除
  const handleDelete = async (timelineId) => {
  console.log('削除開始:', timelineId);
  
  if (window.confirm('このファイルを削除しますか？')) {
    console.log('削除確認OK');
    
    try {
      const success = await deleteTimeline(timelineId);
      console.log('削除結果:', success);
      
      if (success) {
        setTimelines(prev => prev.filter(t => t.id !== timelineId));
        console.log('削除成功、UI更新');
      } else {
        alert('削除に失敗しました');
      }
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  } else {
    console.log('削除キャンセル');
  }
};

  // 年表読み込み
  const handleLoad = (timeline) => {
    const timelineData = timeline.timeline_data;
    onLoadTimeline(timelineData);
    onBackToTimeline();
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
            {timelines.map((timeline) => (
              <div
                key={timeline.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "16px",
                  backgroundColor: "white",
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
                    {new Date(timeline.created_at).toLocaleDateString("ja-JP")}
                  </div>
                  <div>
                    更新:{" "}
                    {new Date(timeline.updated_at).toLocaleDateString("ja-JP")}
                  </div>
                  {timeline.timeline_data && (
                    <div>
                      イベント数: {timeline.timeline_data.events?.length || 0}件
                      <br />
                      年表数: {timeline.timeline_data.timelines?.length || 0}件
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
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    読み込み
                  </button>
                  <button
                    onClick={() => {
                      alert("削除ボタンがクリックされました"); // 確認用
                      handleDelete(timeline.id);
                    }}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPage;
