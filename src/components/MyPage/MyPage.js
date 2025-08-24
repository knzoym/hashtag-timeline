// src/components/MyPage/MyPage.js
import React, { useState, useEffect } from "react";
import { useFileOperations } from "../../hooks/useFileOperations";
import { useTimelineStore } from "../../store/useTimelineStore";

const MyPage = ({ user, onLoadTimeline }) => {
  const { getUserTimelines, deleteTimelineFile } = useFileOperations();
  const setView = useTimelineStore(state => state.setView);
  
  const [timelines, setTimelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTimelines = async () => {
      setLoading(true);
      try {
        const data = await getUserTimelines();
        setTimelines(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("ファイルの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    if (user) loadTimelines();
  }, [user, getUserTimelines]);

  const handleDelete = async (timelineId) => {
    if (!window.confirm("このファイルを削除しますか？")) return;
    const result = await deleteTimelineFile(timelineId);
    if (result.ok) {
      setTimelines(prev => prev.filter(t => t.id !== timelineId));
    } else {
      alert(`削除に失敗しました: ${result.message}`);
    }
  };

  const handleLoad = (timeline) => {
    const data = typeof timeline.timeline_data === 'string' 
      ? JSON.parse(timeline.timeline_data) 
      : timeline.timeline_data;
    onLoadTimeline(data);
    setView('timeline');
  };

  const styles = {
      container: { padding: "20px", backgroundColor: "white", height: "100%", overflow: "auto" },
      header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
      title: { margin: 0, fontSize: "24px" },
      backButton: { padding: "8px 16px", backgroundColor: "#6b7280", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" },
      cardGrid: { display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" },
      card: { border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px", backgroundColor: "white" },
      cardTitle: { margin: "0 0 8px 0", fontSize: "16px" },
      cardMeta: { fontSize: "12px", color: "#6b7280", marginBottom: "12px" },
      cardActions: { display: "flex", gap: "8px", justifyContent: "flex-end" }
  };

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>マイページ</h2>
        <button onClick={() => setView('timeline')} style={styles.backButton}>年表に戻る</button>
      </div>

      <div style={styles.cardGrid}>
        {timelines.length === 0 ? (
          <p>保存されたファイルはありません。</p>
        ) : (
          timelines.map(timeline => (
            <div key={timeline.id} style={styles.card}>
              <h4 style={styles.cardTitle}>{timeline.title}</h4>
              <div style={styles.cardMeta}>
                更新日: {new Date(timeline.updated_at).toLocaleDateString("ja-JP")}
              </div>
              <div style={styles.cardActions}>
                <button onClick={() => handleLoad(timeline)}>読み込み</button>
                <button onClick={() => handleDelete(timeline.id)}>削除</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyPage;
