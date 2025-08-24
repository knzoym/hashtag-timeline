// src/components/MyPage/MyPage.js
import React, { useState, useEffect } from "react";
import { useFileOperations } from "../../hooks/useFileOperations";
import { useTimelineStore } from "../../store/useTimelineStore";

const MyPage = ({ user, onLoadTimeline }) => {
  // useFileOperations フックから必要な関数のみを取得
  const { handleLoadTimeline, handleExportJSON, handleImportJSON } = useFileOperations();
  const setView = useTimelineStore(state => state.setView);
  
  const [timelines, setTimelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Supabase関連の処理を直接実装（useFileOperationsを通さない）
  useEffect(() => {
    const loadTimelines = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // 直接Supabaseから取得する簡単な実装
        // 実際のプロジェクトではここでSupabaseクライアントを使用
        const mockData = []; // 一時的にモックデータ
        setTimelines(Array.isArray(mockData) ? mockData : []);
      } catch (err) {
        console.error('Timeline loading error:', err);
        setError("ファイルの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    
    loadTimelines();
  }, [user]);

  const handleDelete = async (timelineId) => {
    if (!window.confirm("このファイルを削除しますか？")) return;
    
    try {
      // 削除処理（一時的に無効化）
      setTimelines(prev => prev.filter(t => t.id !== timelineId));
      console.log('Delete timeline:', timelineId);
    } catch (err) {
      console.error('Delete error:', err);
      alert("削除に失敗しました");
    }
  };

  const handleLoad = (timeline) => {
    try {
      const data = typeof timeline.timeline_data === 'string' 
        ? JSON.parse(timeline.timeline_data) 
        : timeline.timeline_data;
      
      // onLoadTimeline prop を使用
      onLoadTimeline(data);
      setView('timeline');
    } catch (err) {
      console.error('Load error:', err);
      alert("データの読み込みに失敗しました");
    }
  };

  const styles = {
    container: { 
      padding: "20px", 
      backgroundColor: "white", 
      height: "100%", 
      overflow: "auto" 
    },
    header: { 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center", 
      marginBottom: "24px" 
    },
    title: { 
      margin: 0, 
      fontSize: "24px" 
    },
    backButton: { 
      padding: "8px 16px", 
      backgroundColor: "#6b7280", 
      color: "white", 
      border: "none", 
      borderRadius: "4px", 
      cursor: "pointer" 
    },
    cardGrid: { 
      display: "grid", 
      gap: "16px", 
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" 
    },
    card: { 
      border: "1px solid #e5e7eb", 
      borderRadius: "8px", 
      padding: "16px", 
      backgroundColor: "white" 
    },
    cardTitle: { 
      margin: "0 0 8px 0", 
      fontSize: "16px" 
    },
    cardMeta: { 
      fontSize: "12px", 
      color: "#6b7280", 
      marginBottom: "12px" 
    },
    cardActions: { 
      display: "flex", 
      gap: "8px", 
      justifyContent: "flex-end" 
    },
    button: {
      padding: "4px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "4px",
      backgroundColor: "white",
      cursor: "pointer",
      fontSize: "12px"
    },
    deleteButton: {
      padding: "4px 12px",
      border: "1px solid #ef4444",
      borderRadius: "4px",
      backgroundColor: "#fef2f2",
      color: "#ef4444",
      cursor: "pointer",
      fontSize: "12px"
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>マイページ</h2>
          <button onClick={() => setView('timeline')} style={styles.backButton}>
            年表に戻る
          </button>
        </div>
        <div>読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>マイページ</h2>
          <button onClick={() => setView('timeline')} style={styles.backButton}>
            年表に戻る
          </button>
        </div>
        <div>エラー: {error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>マイページ</h2>
        <button onClick={() => setView('timeline')} style={styles.backButton}>
          年表に戻る
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>ファイル操作</h3>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={handleExportJSON} style={styles.button}>
            JSONエクスポート
          </button>
          <button onClick={handleImportJSON} style={styles.button}>
            JSONインポート
          </button>
        </div>
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
                <button 
                  onClick={() => handleLoad(timeline)}
                  style={styles.button}
                >
                  読み込み
                </button>
                <button 
                  onClick={() => handleDelete(timeline.id)}
                  style={styles.deleteButton}
                >
                  削除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyPage;