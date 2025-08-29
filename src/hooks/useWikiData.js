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

      // 検索時は一時的に取得件数を増やす（後でフロント側で絞り込む）
      const fetchLimit = searchTerm.trim() ? Math.max(limit, 200) : limit;

      let query = supabase
        .from("events")
        .select(
          `
          *,
          profiles:created_by(display_name, username)
        `
        )
        .order("created_at", { ascending: false })
        .limit(fetchLimit);

      if (searchTerm.trim()) {
        // サーバー側では title/description の部分一致を担当させる
        // （tags の部分一致は後段でクライアント側フィルタ）
        const s = searchTerm.trim();
        query = query.or(`title.ilike.%${s}%,description.ilike.%${s}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // データ形式を統一（startDateに変換）
      const formattedData = (data || []).map((event) => ({
        ...event,
        startDate: new Date(event.date_start || event.start_date),
        endDate: event.date_end
          ? new Date(event.date_end)
          : new Date(event.date_start || event.start_date),
        tags: Array.isArray(event.tags) ? event.tags : [],
        sources: Array.isArray(event.sources) ? event.sources : [],
      }));

      // ここで tags の部分一致フィルタを実施（大文字小文字を無視）
      if (!searchTerm.trim()) {
        return formattedData;
      }
      const q = searchTerm.trim().toLowerCase();
      const tagMatched = formattedData.filter((ev) =>
        ev.tags?.some((t) => String(t).toLowerCase().includes(q))
      );

      // title/description で拾えたものと tag 部分一致をマージして重複除去
      const merged = [];
      const seen = new Set();
      for (const ev of [...formattedData, ...tagMatched]) {
        if (!seen.has(ev.id)) {
          seen.add(ev.id);
          merged.push(ev);
        }
      }
      // 元の limit で切り戻す
      return merged.slice(0, limit);
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
            date_end: eventData.endDate
              ? eventData.endDate.toISOString().split("T")[0]
              : eventData.startDate.toISOString().split("T")[0],
            description: eventData.description || "",
            tags: eventData.tags || [],
            sources: eventData.sources || [],
            license: eventData.license || "CC0-1.0",
            created_by: user.id,
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
          updateData.date_end = updates.endDate
            ? updates.endDate.toISOString().split("T")[0]
            : updates.startDate.toISOString().split("T")[0];
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
        setError("ログインが必要です");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        // 統一された認証方式
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) throw new Error("認証セッションの取得に失敗しました");
        if (!session) throw new Error("ログインが必要です");

        console.log("投票API呼び出し開始:", { revisionId, kind });

        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/rev-vote`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
              apikey: process.env.REACT_APP_SUPABASE_ANON_KEY,
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
          throw new Error(
            `レスポンス解析エラー: ${response.status} ${response.statusText}`
          );
        }

        if (!response.ok) {
          const errorMessage =
            result.error || result.message || `HTTPエラー: ${response.status}`;
          throw new Error(errorMessage);
        }

        console.log("投票API呼び出し成功:", result);
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
        setError("ログインが必要です");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        // 統一された認証方式
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) throw new Error("認証セッションの取得に失敗しました");
        if (!session) throw new Error("ログインが必要です");

        // データ型の統一
        const payload = {
          title: eventData.title,
          description: eventData.description,
          date_start: eventData.startDate
            ? eventData.startDate.toISOString().split("T")[0]
            : eventData.date_start,
          date_end: eventData.endDate
            ? eventData.endDate.toISOString().split("T")[0]
            : eventData.date_end || eventData.date_start,
          tags: eventData.tags || [],
          sources: eventData.sources || [],
          license: eventData.license || "CC0-1.0",
        };

        const requestBody = eventId ? { eventId, payload } : { payload };

        console.log("リビジョン作成API呼び出し開始:", {
          endpoint: `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/rev-create`,
          hasEventId: !!eventId,
          payloadKeys: Object.keys(payload),
        });

        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/rev-create`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
              apikey: process.env.REACT_APP_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify(requestBody),
          }
        );

        let result;
        try {
          result = await response.json();
        } catch (parseError) {
          throw new Error(
            `レスポンス解析エラー: ${response.status} ${response.statusText}`
          );
        }

        if (!response.ok) {
          const errorMessage =
            result.error || result.message || `HTTPエラー: ${response.status}`;
          throw new Error(errorMessage);
        }

        console.log("リビジョン作成API呼び出し成功:", result);
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
        setError("ログインが必要です");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        // 統一された認証方式
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) throw new Error("認証セッションの取得に失敗しました");
        if (!session) throw new Error("ログインが必要です");

        console.log("リバートAPI呼び出し開始:", { revisionId });

        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/rev-revert`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
              apikey: process.env.REACT_APP_SUPABASE_ANON_KEY,
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
          throw new Error(
            `レスポンス解析エラー: ${response.status} ${response.statusText}`
          );
        }

        if (!response.ok) {
          const errorMessage =
            result.error || result.message || `HTTPエラー: ${response.status}`;
          throw new Error(errorMessage);
        }

        console.log("リバートAPI呼び出し成功:", result);
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
    []
  );

  // 互換ラッパー：古い呼び出し（getWikiEvents）に対応
  // 使い方互換：getWikiEvents(searchTerm, limit)
  // 拡張版：    getWikiEvents({ mode: 'latest' | 'stable', searchTerm, limit })
  const getWikiEvents = useCallback(
    async (...args) => {
      // 引数の解釈（旧: (searchTerm, limit) ／ 新: ({mode, searchTerm, limit}))
      let mode = "latest";
      let searchTerm = "";
      let limit = 50;

      if (typeof args[0] === "object" && args[0] !== null) {
        const opt = args[0];
        mode = opt.mode ?? "latest";
        searchTerm = opt.searchTerm ?? "";
        limit = opt.limit ?? 50;
      } else {
        searchTerm = args[0] ?? "";
        limit = args[1] ?? 50;
      }

      if (mode === "stable") {
        // 安定版（承認済み）タブ用：event_stable の結果を events 風に整形
        const rows = await getEventsWithScores(searchTerm, limit);
        return (rows || []).map((r) => {
          const ev = r.events || {};
          return {
            ...ev,
            startDate: new Date(ev.date_start || ev.start_date),
            endDate: ev.date_end
              ? new Date(ev.date_end)
              : new Date(ev.date_start || ev.start_date),
            tags: Array.isArray(ev.tags) ? ev.tags : [],
            sources: Array.isArray(ev.sources) ? ev.sources : [],
            // 参考情報（必要に応じてUIで使用）
            stableScore: r.stable_score ?? 0,
            stableRevisionId: r.stable_revision_id ?? null,
          };
        });
      }

      // 既定は最新（latest）
      return await getSharedEvents(searchTerm, limit);
    },
    [getSharedEvents, getEventsWithScores]
  );

  // リビジョン履歴取得
  const getEventRevisions = useCallback(async (eventId) => {
    try {
      setLoading(true);
      setError(null);

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
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 最新のリビジョン履歴取得（全体）
  const getRecentRevisions = useCallback(
    async (limit = 20, timeRange = "24h") => {
      try {
        setLoading(true);
        setError(null);

        let timeFilter = new Date();
        switch (timeRange) {
          case "1h":
            timeFilter.setHours(timeFilter.getHours() - 1);
            break;
          case "24h":
            timeFilter.setDate(timeFilter.getDate() - 1);
            break;
          case "7d":
            timeFilter.setDate(timeFilter.getDate() - 7);
            break;
          case "30d":
            timeFilter.setDate(timeFilter.getDate() - 30);
            break;
          default:
            timeFilter.setDate(timeFilter.getDate() - 1);
        }

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
            profiles:edited_by(display_name, username),
            events!inner(title)
          `
          )
          .gte("created_at", timeFilter.toISOString())
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
  const getEventDetail = useCallback(async (eventId = null) => {
    try {
      setLoading(true);
      setError(null);

      const { data: stable, error: stableError } = await supabase
        .from("event_stable")
        .select("*")
        .eq("event_id", eventId)
        .single();

      let revisionHistory = [];
      if (stable) {
        // リビジョン履歴取得
        const { data: revisions, error: revisionsError } = await supabase
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
          .eq("event_id", stable.event_id)
          .order("created_at", { ascending: false });

        if (revisionsError) {
          console.warn("リビジョン履歴取得で警告:", revisionsError);
        } else {
          revisionHistory = revisions || [];
        }
      }

      return {
        stableVersion: stable,
        revisionHistory,
        latestRevision: revisionHistory.length > 0 ? revisionHistory[0] : null,
      };
    } catch (err) {
      console.error("イベント詳細取得エラー:", err);
      setError(err.message);
      return {
        stableVersion: null,
        revisionHistory: [],
        latestRevision: null,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // 承認待ちリビジョン取得
  const getPendingRevisions = useCallback(
    async (status = "pending", limit = 50) => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
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
            approval_status,
            approved_by,
            approved_at,
            rejection_reason,
            profiles:edited_by(display_name, username),
            events!inner(title)
          `
          )
          .order("created_at", { ascending: false })
          .limit(limit);

        if (status !== "all") {
          query = query.eq("approval_status", status);
        }

        const { data, error } = await query;
        if (error) throw error;

        // 追加のイベント情報を取得
        const enrichedData = (data || []).map((revision) => ({
          ...revision,
          event_title: revision.events?.title || "無題",
        }));

        return enrichedData;
      } catch (err) {
        console.error("承認待ちリビジョン取得エラー:", err);
        setError(err.message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // リビジョン承認
  const approveRevision = useCallback(
    async (revisionId, approvalType = "manual") => {
      if (!user) {
        setError("承認にはログインが必要です");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) throw new Error("認証セッションの取得に失敗しました");
        if (!session) throw new Error("ログインが必要です");

        console.log("承認API呼び出し開始:", { revisionId, approvalType });

        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/rev-approve`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
              apikey: process.env.REACT_APP_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              revision_id: revisionId,
              approval_type: approvalType, // 'manual' | 'auto'
            }),
          }
        );

        let result;
        try {
          result = await response.json();
        } catch (parseError) {
          throw new Error(
            `レスポンス解析エラー: ${response.status} ${response.statusText}`
          );
        }

        if (!response.ok) {
          const errorMessage =
            result.error || result.message || `HTTPエラー: ${response.status}`;
          throw new Error(errorMessage);
        }

        console.log("承認API呼び出し成功:", result);
        return result;
      } catch (err) {
        console.error("承認エラー:", err);
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // リビジョン却下
  const rejectRevision = useCallback(
    async (revisionId, reason = "") => {
      if (!user) {
        setError("却下にはログインが必要です");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) throw new Error("認証セッションの取得に失敗しました");
        if (!session) throw new Error("ログインが必要です");

        console.log("却下API呼び出し開始:", { revisionId, reason });

        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/rev-reject`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
              apikey: process.env.REACT_APP_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              revision_id: revisionId,
              rejection_reason: reason,
            }),
          }
        );

        let result;
        try {
          result = await response.json();
        } catch (parseError) {
          throw new Error(
            `レスポンス解析エラー: ${response.status} ${response.statusText}`
          );
        }

        if (!response.ok) {
          const errorMessage =
            result.error || result.message || `HTTPエラー: ${response.status}`;
          throw new Error(errorMessage);
        }

        console.log("却下API呼び出し成功:", result);
        return result;
      } catch (err) {
        console.error("却下エラー:", err);
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // 自動承認の実行
  const executeAutoApproval = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw new Error("認証セッションの取得に失敗しました");
      if (!session) throw new Error("管理者権限が必要です");

      console.log("自動承認API呼び出し開始");

      const response = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/auto-approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
            apikey: process.env.REACT_APP_SUPABASE_ANON_KEY,
          },
        }
      );

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error(
          `レスポンス解析エラー: ${response.status} ${response.statusText}`
        );
      }

      if (!response.ok) {
        const errorMessage =
          result.error || result.message || `HTTPエラー: ${response.status}`;
        throw new Error(errorMessage);
      }

      console.log("自動承認API呼び出し成功:", result);
      return result;
    } catch (err) {
      console.error("自動承認エラー:", err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 追加：TLwikiの年表プリセット一覧（公開のみ）
  const getWikiTimelines = useCallback(async (limit = 50) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("timelines")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("getWikiTimelines error:", e);
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    // 基本的なCRUD操作
    getSharedEvents,
    getWikiEvents,
    getWikiTimelines,
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
    getRecentActivity: getRecentRevisions,
    getEventDetail,
    // 承認システム
    getPendingRevisions,
    approveRevision,
    rejectRevision,
    executeAutoApproval,
    // エラー管理
    clearError: () => setError(null),
  };
};
