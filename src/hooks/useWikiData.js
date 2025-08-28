// src/hooks/useWikiData.js
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
        .from("events")
        .select(`
          *,
          profiles:created_by(display_name, username)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (searchTerm.trim()) {
        query = query.or(`title.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // データ形式を統一（startDateに変換）
      const formattedData = (data || []).map((event) => ({
        ...event,
        startDate: new Date(event.date_start || event.start_date),
        endDate: event.date_end ? new Date(event.date_end) : new Date(event.date_start || event.start_date),
        tags: Array.isArray(event.tags) ? event.tags : [],
        sources: Array.isArray(event.sources) ? event.sources : [],
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
            date_start: eventData.startDate.toISOString().split("T")[0],
            date_end: eventData.endDate ? eventData.endDate.toISOString().split("T")[0] : eventData.startDate.toISOString().split("T")[0],
            description: eventData.description || "",
            tags: eventData.tags || [],
            sources: eventData.sources || [],
            license: eventData.license || "CC0-1.0",
            created_by: user.id
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

        const updateData = { ...updates, updated_at: new Date().toISOString() };

        if (updates.startDate) {
          updateData.date_start = updates.startDate.toISOString().split("T")[0];
          updateData.date_end = updates.endDate ? updates.endDate.toISOString().split("T")[0] : updates.startDate.toISOString().split("T")[0];
          delete updateData.startDate;
          delete updateData.endDate;
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
    return {
      id: Date.now() + Math.random(), // 新しいIDを生成
      title: sharedEvent.title,
      startDate: new Date(sharedEvent.date_start || sharedEvent.start_date),
      endDate: new Date(
        sharedEvent.date_end || sharedEvent.date_start || sharedEvent.start_date
      ),
      description: sharedEvent.description || "",
      tags: Array.isArray(sharedEvent.tags) ? sharedEvent.tags : [],
      timelineInfos: [], // 個人ファイル用の構造
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
      const { data: events, error } = await supabase
        .from("events")
        .select("tags");

      if (error) throw error;

      // タグの使用頻度を計算
      const tagCounts = {};
      events.forEach((event) => {
        if (Array.isArray(event.tags)) {
          event.tags.forEach((tag) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      return Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([tag, count]) => ({ tag, count }));
    } catch (err) {
      console.error("人気タグ取得エラー:", err);
      return [];
    }
  }, []);

  // リビジョンに投票 - 認証方式統一
  const voteOnRevision = useCallback(
    async (revisionId, kind) => {
      if (!user) {
        setError('ログインが必要です');
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        // 統一された認証方式
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw new Error('認証セッションの取得に失敗しました');
        if (!session) throw new Error('ログインが必要です');

        console.log('投票API呼び出し開始:', { revisionId, kind });

        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/rev-vote`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
              "apikey": process.env.REACT_APP_SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
              revision_id: revisionId,
              kind: kind, // 'upvote' | 'report'
            }),
          }
        );

        let result;
        try {
          result = await response.json();
        } catch (parseError) {
          throw new Error(`レスポンス解析エラー: ${response.status} ${response.statusText}`);
        }

        if (!response.ok) {
          const errorMessage = result.error || result.message || `HTTPエラー: ${response.status}`;
          throw new Error(errorMessage);
        }

        console.log('投票API呼び出し成功:', result);
        return result;
      } catch (err) {
        console.error("投票エラー:", err);
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // イベントのリビジョン作成 - 認証方式統一
  const createRevision = useCallback(
    async (eventData, eventId = null) => {
      if (!user) {
        setError('ログインが必要です');
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        // 統一された認証方式
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw new Error('認証セッションの取得に失敗しました');
        if (!session) throw new Error('ログインが必要です');

        // データ型の統一
        const payload = {
          title: eventData.title,
          description: eventData.description,
          date_start: eventData.startDate ? eventData.startDate.toISOString().split("T")[0] : eventData.date_start,
          date_end: eventData.endDate ? eventData.endDate.toISOString().split("T")[0] : eventData.date_end || eventData.date_start,
          tags: eventData.tags || [],
          sources: eventData.sources || [],
          license: eventData.license || "CC0-1.0",
        };

        const requestBody = eventId ? { eventId, payload } : { payload };

        console.log('リビジョン作成API呼び出し開始:', {
          endpoint: `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/rev-create`,
          hasEventId: !!eventId,
          payloadKeys: Object.keys(payload)
        });

        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/rev-create`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
              "apikey": process.env.REACT_APP_SUPABASE_ANON_KEY
            },
            body: JSON.stringify(requestBody),
          }
        );

        let result;
        try {
          result = await response.json();
        } catch (parseError) {
          throw new Error(`レスポンス解析エラー: ${response.status} ${response.statusText}`);
        }

        if (!response.ok) {
          const errorMessage = result.error || result.message || `HTTPエラー: ${response.status}`;
          throw new Error(errorMessage);
        }

        console.log('リビジョン作成API呼び出し成功:', result);
        return result;
      } catch (err) {
        console.error("リビジョン作成エラー:", err);
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // リビジョンをリバート - 認証方式統一
  const revertRevision = useCallback(
    async (revisionId) => {
      if (!user) {
        setError('ログインが必要です');
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        // 統一された認証方式
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw new Error('認証セッションの取得に失敗しました');
        if (!session) throw new Error('ログインが必要です');

        console.log('リバートAPI呼び出し開始:', { revisionId });

        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/rev-revert`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
              "apikey": process.env.REACT_APP_SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
              revision_id: revisionId,
            }),
          }
        );

        let result;
        try {
          result = await response.json();
        } catch (parseError) {
          throw new Error(`レスポンス解析エラー: ${response.status} ${response.statusText}`);
        }

        if (!response.ok) {
          const errorMessage = result.error || result.message || `HTTPエラー: ${response.status}`;
          throw new Error(errorMessage);
        }

        console.log('リバートAPI呼び出し成功:', result);
        return result;
      } catch (err) {
        console.error("リバートエラー:", err);
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
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
          .select(`
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
              updated_at,
              profiles:created_by(display_name, username)
            )
          `)
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
    []
  );

  // リビジョン履歴取得
  const getEventRevisions = useCallback(
    async (eventId) => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("revision_scores")
          .select(`
            rev_id,
            event_id,
            data,
            edited_by,
            created_at,
            upvotes,
            reports,
            stable_score,
            profiles:edited_by(display_name, username)
          `)
          .eq("event_id", eventId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error("リビジョン履歴取得エラー:", err);
        setError(err.message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // 最新のリビジョン履歴取得（全体）
  const getRecentRevisions = useCallback(
    async (limit = 20, timeRange = '24h') => {
      try {
        setLoading(true);
        setError(null);

        let timeFilter = new Date();
        switch (timeRange) {
          case '1h':
            timeFilter.setHours(timeFilter.getHours() - 1);
            break;
          case '24h':
            timeFilter.setDate(timeFilter.getDate() - 1);
            break;
          case '7d':
            timeFilter.setDate(timeFilter.getDate() - 7);
            break;
          case '30d':
            timeFilter.setDate(timeFilter.getDate() - 30);
            break;
          default:
            timeFilter.setDate(timeFilter.getDate() - 1);
        }

        const { data, error } = await supabase
          .from("revision_scores")
          .select(`
            rev_id,
            event_id,
            data,
            edited_by,
            created_at,
            upvotes,
            reports,
            stable_score,
            profiles:edited_by(display_name, username),
            events!inner(title, slug)
          `)
          .gte('created_at', timeFilter.toISOString())
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error("最新リビジョン取得エラー:", err);
        setError(err.message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // イベント詳細取得（安定版 + 最新リビジョン）
  const getEventDetail = useCallback(
    async (eventId, slug = null) => {
      try {
        setLoading(true);
        setError(null);

        // 安定版データ取得
        let stableQuery = supabase.from('event_stable').select('*');
        if (eventId) {
          stableQuery = stableQuery.eq('event_id', eventId);
        } else if (slug) {
          stableQuery = stableQuery.eq('slug', slug);
        } else {
          throw new Error('eventIdまたはslugが必要です');
        }

        const { data: stable, error: stableError } = await stableQuery.single();
        if (stableError && stableError.code !== 'PGRST116') {
          throw stableError;
        }

        let revisionHistory = [];
        if (stable) {
          // リビジョン履歴取得
          const { data: revisions, error: revisionsError } = await supabase
            .from('revision_scores')
            .select(`
              rev_id,
              event_id,
              data,
              edited_by,
              created_at,
              upvotes,
              reports,
              stable_score,
              profiles:edited_by(display_name, username)
            `)
            .eq('event_id', stable.event_id)
            .order('created_at', { ascending: false });

          if (revisionsError) {
            console.warn('リビジョン履歴取得で警告:', revisionsError);
          } else {
            revisionHistory = revisions || [];
          }
        }

        return {
          stableVersion: stable,
          revisionHistory,
          latestRevision: revisionHistory.length > 0 ? revisionHistory[0] : null
        };
      } catch (err) {
        console.error("イベント詳細取得エラー:", err);
        setError(err.message);
        return {
          stableVersion: null,
          revisionHistory: [],
          latestRevision: null
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    // 基本的なCRUD操作
    getSharedEvents,
    createSharedEvent,
    updateSharedEvent,
    importEventToPersonal,
    getPopularTags,
    // リビジョン管理
    voteOnRevision,
    createRevision,
    revertRevision,
    getEventsWithScores,
    getEventRevisions,
    getRecentRevisions,
    getEventDetail,
    // エラー管理
    clearError: () => setError(null)
  };
};