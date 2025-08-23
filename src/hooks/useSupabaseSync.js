// src/hooks/useSupabaseSync.js
import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export const useSupabaseSync = (user) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Wiki関連の関数を追加
  const getWikiEvents = useCallback(async (searchTerm = '', limit = 50) => {
    try {
      let query = supabase
        .from('shared_events')
        .select(`
          *,
          profiles:created_by(display_name, username)
        `)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (searchTerm.trim()) {
        query = query.or(`title.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Wiki イベント取得エラー:', err);
      return [];
    }
  }, []);

  // プロファイル作成・更新
  const upsertProfile = useCallback(
    async (profileData) => {
      if (!user) return null;

      try {
        setError(null);

        const { data, error } = await supabase
          .from("profiles")
          .upsert({
            id: user.id,
            username: profileData.username || user.email.split("@")[0],
            display_name:
              profileData.display_name ||
              user.user_metadata?.full_name ||
              user.email.split("@")[0], // 修正
            ...profileData,
          })
          .select();

        if (error) throw error;
        return data[0];
      } catch (error) {
        console.error("プロファイル保存エラー:", error);
        setError(error.message);
        return null;
      }
    },
    [user]
  );

  // 年表データ保存
  const saveTimelineData = useCallback(
    async (timelineData, title) => {
      if (!user) return null;

      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("user_timelines")
          .insert({
            user_id: user.id,
            timeline_data: timelineData,
            title: title || `年表 ${new Date().toLocaleDateString("ja-JP")}`,
          })
          .select();

        if (error) throw error;
        return data[0];
      } catch (error) {
        console.error("年表保存エラー:", error);
        setError(error.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // 年表データ更新
  const updateTimelineData = useCallback(
    async (timelineId, timelineData, title) => {
      if (!user) return null;

      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("user_timelines")
          .update({
            timeline_data: timelineData,
            title: title,
            updated_at: new Date().toISOString(),
          })
          .eq("id", timelineId)
          .eq("user_id", user.id)
          .select();

        if (error) throw error;
        return data[0];
      } catch (error) {
        console.error("年表更新エラー:", error);
        setError(error.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // ユーザーの年表一覧取得
  const getUserTimelines = useCallback(async () => {
    if (!user) return [];

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("user_timelines")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("年表取得エラー:", error);
      setError(error.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 返り値を { ok: boolean, message?: string } にしたい場合（任意）
  const deleteTimeline = useCallback(
    async (timelineId) => {
      if (!user) return { ok: false, message: "未認証です" };

      try {
        setLoading(true);
        setError(null);

        const { error } = await supabase
          .from("user_timelines")
          .delete()
          .eq("id", timelineId)
          .eq("user_id", user.id);

        if (error) {
          setError(error.message);
          return { ok: false, message: error.message };
        }
        return { ok: true };
      } catch (err) {
        const msg = err?.message || "削除に失敗しました";
        setError(msg);
        return { ok: false, message: msg };
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  return {
    loading,
    error,
    upsertProfile,
    saveTimelineData,
    updateTimelineData,
    getUserTimelines,
    deleteTimeline,
    getWikiEvents,
  };
};
