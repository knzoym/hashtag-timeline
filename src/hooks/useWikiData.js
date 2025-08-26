import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export const useWikiData = (user) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 共用イベント取得（public.eventsテーブルから）
  const getSharedEvents = useCallback(async (searchTerm = "", limit = 50) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("events") // テーブル名をeventsに変更
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (searchTerm.trim()) {
        // タイトルまたはタグで検索（PostgreSQLの配列検索を使用）
        query = query.or(`title.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // データ形式を統一（startDateに変換）
      const formattedData = (data || []).map((event) => ({
        ...event,
        start_date: event.date_start || event.start_date, // date_startをstart_dateに統一
        tags: Array.isArray(event.tags) ? event.tags : [], // tagsが配列でない場合は空配列
        created_by: event.created_at, // 作成者情報がない場合の代替
        profiles: null, // プロファイル情報は別途取得
      }));

      return formattedData;
    } catch (err) {
      console.error("共用イベント取得エラー:", err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 新しい共用イベント作成
  const createSharedEvent = useCallback(
    async (eventData) => {
      if (!user) return null;

      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("events")
          .insert({
            title: eventData.title,
            date_start: eventData.startDate.toISOString().split("T")[0], // date_startカラムに保存
            date_end: eventData.startDate.toISOString().split("T")[0], // 同じ日付で設定
            description: eventData.description || "",
            tags: eventData.tags || [],
            position: { x: 0, y: 0 }, // デフォルト位置
          })
          .select();

        if (error) throw error;

        return data[0];
      } catch (err) {
        console.error("共用イベント作成エラー:", err);
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // 共用イベント更新
  const updateSharedEvent = useCallback(
    async (eventId, updates) => {
      if (!user) return null;

      try {
        setLoading(true);
        setError(null);

        // 更新データの準備
        const updateData = {
          ...updates,
          updated_at: new Date().toISOString(),
        };

        // startDateがある場合はdate_startに変換
        if (updates.startDate) {
          updateData.date_start = updates.startDate.toISOString().split("T")[0];
          updateData.date_end = updates.startDate.toISOString().split("T")[0];
          delete updateData.startDate; // 不要なフィールドを削除
        }

        const { data, error } = await supabase
          .from("events")
          .update(updateData)
          .eq("id", eventId)
          .select();

        if (error) throw error;

        return data[0];
      } catch (err) {
        console.error("共用イベント更新エラー:", err);
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // 個人ファイルにインポート
  const importEventToPersonal = useCallback((sharedEvent) => {
    // 共用イベントを個人用の形式に変換
    return {
      id: Date.now(), // 新しいIDを生成
      title: sharedEvent.title,
      startDate: new Date(sharedEvent.date_start || sharedEvent.start_date),
      endDate: new Date(
        sharedEvent.date_end || sharedEvent.date_start || sharedEvent.start_date
      ),
      description: sharedEvent.description || "",
      tags: Array.isArray(sharedEvent.tags) ? sharedEvent.tags : [],
      // 出典情報を残す
      source: {
        type: "wiki",
        originalId: sharedEvent.id,
        importedAt: new Date(),
      },
    };
  }, []);

  // 人気のタグ取得
  const getPopularTags = useCallback(async (limit = 10) => {
    try {
      // PostgreSQLでタグの使用頻度を集計
      const { data, error } = await supabase.rpc("get_popular_event_tags", {
        tag_limit: limit,
      });

      if (error) {
        // RPC関数が存在しない場合は、JavaScriptで処理
        console.warn("RPC関数が見つかりません。代替処理を実行します。");

        const { data: events, error: eventsError } = await supabase
          .from("events")
          .select("tags");

        if (eventsError) throw eventsError;

        // タグの使用頻度を計算
        const tagCounts = {};
        events.forEach((event) => {
          if (Array.isArray(event.tags)) {
            event.tags.forEach((tag) => {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
          }
        });

        // 上位のタグを返す
        return Object.entries(tagCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, limit)
          .map(([tag, count]) => ({ tag, count }));
      }

      return data || [];
    } catch (err) {
      console.error("人気タグ取得エラー:", err);
      return [];
    }
  }, []);

  // src/hooks/useWikiData.js に追加する投票関連の関数

  // 既存のuseWikiData.jsに以下の関数を追加してください：

  // リビジョンに投票
  const voteOnRevision = useCallback(
    async (revisionId, kind) => {
      if (!user) return null;

      try {
        setLoading(true);
        setError(null);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) throw new Error("認証が必要です");

        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/rev-vote`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              revision_id: revisionId,
              kind: kind, // 'upvote' | 'report'
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "投票に失敗しました");
        }

        const result = await response.json();
        return result;
      } catch (err) {
        console.error("投票エラー:", err);
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user, supabase]
  );

  // イベントのリビジョン作成
  const createRevision = useCallback(
    async (eventData, eventId = null) => {
      if (!user) return null;

      try {
        setLoading(true);
        setError(null);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) throw new Error("認証が必要です");

        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/rev-create`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              eventId,
              payload: {
                title: eventData.title,
                description: eventData.description,
                date_start: eventData.startDate.toISOString().split("T")[0],
                date_end: eventData.endDate
                  ? eventData.endDate.toISOString().split("T")[0]
                  : null,
                tags: eventData.tags || [],
                sources: eventData.sources || [],
                license: eventData.license || "CC0",
              },
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "リビジョンの作成に失敗しました");
        }

        const result = await response.json();
        return result;
      } catch (err) {
        console.error("リビジョン作成エラー:", err);
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user, supabase]
  );

  // リビジョンをリバート
  const revertRevision = useCallback(
    async (revisionId) => {
      if (!user) return null;

      try {
        setLoading(true);
        setError(null);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) throw new Error("認証が必要です");

        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/rev-revert`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              revision_id: revisionId,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "リバートに失敗しました");
        }

        const result = await response.json();
        return result;
      } catch (err) {
        console.error("リバートエラー:", err);
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user, supabase]
  );

  // スコア付きのイベント一覧取得（安定版）
  const getEventsWithScores = useCallback(
    async (searchTerm = "", limit = 50) => {
      try {
        setLoading(true);
        setError(null);

        // 安定版のイベント一覧を取得
        let query = supabase
          .from("event_stable")
          .select(
            `
        event_id,
        stable_revision_id,
        stable_data,
        stable_score,
        upvotes,
        reports,
        stable_editor,
        stable_created_at,
        events!inner(
          id,
          slug,
          title,
          date_start,
          date_end,
          description,
          tags,
          sources,
          license,
          created_by,
          created_at,
          updated_at
        )
      `
          )
          .order("stable_score", { ascending: false })
          .limit(limit);

        if (searchTerm.trim()) {
          query = query.or(
            `events.title.ilike.%${searchTerm}%,events.description.ilike.%${searchTerm}%`
          );
        }

        const { data, error } = await query;
        if (error) throw error;

        return data || [];
      } catch (err) {
        console.error("スコア付きイベント取得エラー:", err);
        setError(err.message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // リビジョン履歴取得
  const getEventRevisions = useCallback(
    async (eventId) => {
      try {
        const { data, error } = await supabase
          .from("revision_scores")
          .select(
            `
        rev_id,
        event_id,
        data,
        edited_by,
        created_at,
        upvotes,
        reports,
        stable_score,
        profiles:edited_by(display_name, username)
      `
          )
          .eq("event_id", eventId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error("リビジョン履歴取得エラー:", err);
        return [];
      }
    },
    [supabase]
  );

  // returnオブジェクトに追加
  return {
    loading,
    error,
    getSharedEvents,
    createSharedEvent,
    updateSharedEvent,
    importEventToPersonal,
    getPopularTags,
    // 新しく追加
    voteOnRevision,
    createRevision,
    revertRevision,
    getEventsWithScores,
    getEventRevisions,
  };
};
