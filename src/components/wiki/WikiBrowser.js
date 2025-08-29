// src/components/WikiBrowser.js
// TLwiki 一覧ビュー（latest / stable 切替、検索、年表プリセット対応）
// - VersionToggle の props は currentMode / onModeChange に統一
// - slug は使わず eventId 基準
// - useWikiData 側に getWikiEvents / getWikiTimelines が無い場合はフォールバック

import React, { useState, useEffect, useMemo, useCallback } from "react";
import WikiEventCard from "./WikiEventCard";
import WikiEventForm from "../WikiEventForm";
import { VersionToggle } from "../VotingComponents";

const DEBOUNCE_MS = 500;
const PAGE_LIMIT = 100;

const WikiBrowser = ({ user, wikiData, onImportEvent, onBackToTimeline }) => {
  // タブ: 一覧 or 履歴（必要なら拡張）
  const [currentTab, setCurrentTab] = useState("browse");

  // 初期表示は latest 推奨（stable は承認済みが無いと空になりがち）
  const [viewMode, setViewMode] = useState("latest"); // 'latest' | 'stable'

  // 検索
  const [searchTerm, setSearchTerm] = useState("");
  const [debounced, setDebounced] = useState("");

  // 読み込み中でも前回結果を保持して「空」に戻さないための管理
  const [latestEvents, setLatestEvents] = useState([]); // 既存があれば流用OK
  const [stableEvents, setStableEvents] = useState([]); // 既存があれば流用OK
  const [loadingFor, setLoadingFor] = useState(null); // 'latest' | 'stable' | null
  const [didLoadLatest, setDidLoadLatest] = useState(false);
  const [didLoadStable, setDidLoadStable] = useState(false);

  // レース対策：最後に発行したリクエスト番号を保持
  const reqSeqRef = useRef(0);

  // 年表プリセット
  const [timelines, setTimelines] = useState([]);
  const [selectedTimelineId, setSelectedTimelineId] = useState(null);

  // UI
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // 進捗・エラー（useWikiData のものをそのまま併用）
  const [busy, setBusy] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);

  // useWikiData から使う関数を安全に参照（存在しないときは undefined）
  const {
    getWikiEvents,
    getSharedEvents,
    getEventsWithScores,
    getWikiTimelines,
    getRecentActivity,
    createSharedEvent,
    updateSharedEvent,
    importEventToPersonal,
    loading: apiLoading,
    error: apiError,
  } = wikiData || {};

  // 検索語のデバウンス
  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchTerm.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // 年表プリセットの取得（関数が無ければ何もしない）
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!getWikiTimelines) return;
      try {
        const rows = await getWikiTimelines(100);
        if (alive) setTimelines(rows || []);
      } catch (_) {
        // 失敗しても一覧機能自体は継続
      }
    })();
    return () => {
      alive = false;
    };
  }, [getWikiTimelines]);

  // プリセットでのフィルタ（latest にだけ適用）
  const filterByPreset = useCallback((events, preset) => {
    if (!preset || !preset.tags?.length) return events;
    const tags = preset.tags;
    const mode = preset.tag_mode || "AND";
    return (events || []).filter((ev) => {
      const evTags = Array.isArray(ev?.tags) ? ev.tags : [];
      return mode === "AND"
        ? tags.every((t) => evTags.includes(t))
        : tags.some((t) => evTags.includes(t));
    });
  }, []);

  // latest 取得（前の表示を維持して、古いレスポンスは破棄）
  async function fetchLatest(search = "") {
    const seq = ++reqSeqRef.current;
    setLoadingFor("latest");
    try {
      // wikiData.getWikiEvents({mode:'latest'}) があれば優先、なければ getSharedEvents
      const rows = await (wikiData?.getWikiEvents
        ? wikiData.getWikiEvents({
            mode: "latest",
            searchTerm: search,
            limit: 100,
          })
        : wikiData?.getSharedEvents?.(search, 100));
      // 途中で別リクエストが走っていたら、この結果は破棄
      if (reqSeqRef.current !== seq) return;
      setLatestEvents(Array.isArray(rows) ? rows : []);
      setDidLoadLatest(true);
    } catch (e) {
      console.error("fetchLatest error:", e);
    } finally {
      // 自分が最後のリクエストのままなら loading 表示を消す
      if (reqSeqRef.current === seq) setLoadingFor(null);
    }
  }

  // stable 取得（events 風に整形）
  async function fetchStable(search = "") {
    const seq = ++reqSeqRef.current;
    setLoadingFor("stable");
    try {
      let rows = [];
      if (wikiData?.getWikiEvents) {
        rows = await wikiData.getWikiEvents({
          mode: "stable",
          searchTerm: search,
          limit: 100,
        });
      } else if (wikiData?.getEventsWithScores) {
        const scored = await wikiData.getEventsWithScores(search, 100);
        rows = (scored || []).map((r) => {
          const ev = r.events || r.event || {};
          return {
            ...ev,
            startDate: new Date(ev.date_start || ev.start_date),
            endDate: ev.date_end
              ? new Date(ev.date_end)
              : new Date(ev.date_start || ev.start_date),
            tags: Array.isArray(ev.tags) ? ev.tags : [],
            sources: Array.isArray(ev.sources) ? ev.sources : [],
            stableScore: r.stable_score ?? 0,
            stableRevisionId: r.stable_revision_id ?? null,
          };
        });
      }
      if (reqSeqRef.current !== seq) return;
      setStableEvents(Array.isArray(rows) ? rows : []);
      setDidLoadStable(true);
    } catch (e) {
      console.error("fetchStable error:", e);
    } finally {
      if (reqSeqRef.current === seq) setLoadingFor(null);
    }
  }

  // 一覧読み込み（タブ= browse のときだけ）
  useEffect(() => {
    if (currentTab !== "browse") return;
    if (viewMode === "latest") {
      loadLatest(debounced);
    } else {
      loadStable(debounced);
    }
  }, [currentTab, viewMode, debounced]);

  // 履歴タブ
  const loadHistory = useCallback(async () => {
    if (!getRecentActivity) return setRecentActivity([]);
    try {
      setBusy(true);
      const rows = await getRecentActivity(20);
      setRecentActivity(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.error("getRecentActivity error:", e);
      setRecentActivity([]);
    } finally {
      setBusy(false);
    }
  }, [getRecentActivity]);

  useEffect(() => {
    if (currentTab === "history") loadHistory();
  }, [currentTab, loadHistory]);

  // 編集保存（新規/更新を一括で扱う）
  const handleSaveEvent = useCallback(
    async (payload) => {
      if (!wikiData) return;
      try {
        setBusy(true);
        if (editingEvent?.id) {
          await updateSharedEvent?.(editingEvent.id, payload);
        } else {
          await createSharedEvent?.(payload);
        }
        setShowEventForm(false);
        setEditingEvent(null);
        // 再読込
        if (viewMode === "latest") {
          await loadLatest(debounced);
        } else {
          await loadStable(debounced);
        }
      } catch (e) {
        console.error("save event error:", e);
        alert("保存に失敗しました。コンソールのエラーをご確認ください。");
      } finally {
        setBusy(false);
      }
    },
    [
      wikiData,
      editingEvent,
      viewMode,
      debounced,
      loadLatest,
      loadStable,
      createSharedEvent,
      updateSharedEvent,
    ]
  );

  // インポート（親から渡されていれば優先し、無ければ useWikiData の関数を利用）
  const makeImportHandler = useCallback(
    (ev) => async () => {
      try {
        if (onImportEvent) return await onImportEvent(ev);
        if (importEventToPersonal) {
          await importEventToPersonal(ev);
          alert("タイムラインにインポートしました。");
        }
      } catch (e) {
        console.error("import error:", e);
        alert("インポートに失敗しました。");
      }
    },
    [onImportEvent, importEventToPersonal]
  );

  // 表示対象（latest に限って年表プリセットを適用）
  const activePreset = useMemo(
    () => timelines.find((t) => t.id === selectedTimelineId),
    [timelines, selectedTimelineId]
  );

  const eventsToRender = viewMode === "latest" ? latestEvents : stableEvents;

  const stableCount = stableEvents.length;
  const latestCount = latestEvents.length;

  // UI: 基本スタイル（素朴に）
  const styles = {
    container: { padding: 12 },
    header: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
      flexWrap: "wrap",
    },
    grow: { flex: 1, minWidth: 240 },
    search: {
      width: "100%",
      padding: "8px 10px",
      border: "1px solid #e5e7eb",
      borderRadius: 8,
      outline: "none",
    },
    toolbar: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap",
    },
    list: {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: 12,
      marginTop: 8,
    },
    tabs: { display: "flex", gap: 8, marginBottom: 8 },
    tabBtn: (active) => ({
      padding: "6px 10px",
      borderRadius: 8,
      border: "1px solid " + (active ? "#3b82f6" : "#e5e7eb"),
      background: active ? "#3b82f6" : "#fff",
      color: active ? "#fff" : "#374151",
      cursor: "pointer",
    }),
    smallBtn: {
      padding: "6px 10px",
      borderRadius: 8,
      border: "1px solid #e5e7eb",
      background: "#fff",
      cursor: "pointer",
    },
    hint: { color: "#6b7280", fontSize: 12 },
  };

  const didLoad = viewMode === "latest" ? didLoadLatest : didLoadStable;

  const isLoading = loadingFor === viewMode;

  return (
    <div style={styles.container}>
      {/* タブ切替 */}
      <div style={styles.tabs}>
        <button
          style={styles.tabBtn(currentTab === "browse")}
          onClick={() => setCurrentTab("browse")}
        >
          一覧
        </button>
        <button
          style={styles.tabBtn(currentTab === "history")}
          onClick={() => setCurrentTab("history")}
        >
          履歴
        </button>
        {onBackToTimeline && (
          <button style={styles.smallBtn} onClick={onBackToTimeline}>
            ← タイムラインへ
          </button>
        )}
      </div>

      {currentTab === "browse" && (
        <>
          {/* ツールバー */}
          <div style={styles.header}>
            <VersionToggle
              currentMode={viewMode}
              onModeChange={setViewMode}
              stableCount={stableCount}
              latestCount={latestCount}
            />
            <div style={{ ...styles.grow }}>
              <input
                placeholder="タイトル / 説明 / タグ（部分一致）で検索"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.search}
              />
              <div style={styles.hint}>
                {busy || apiLoading
                  ? "読み込み中…"
                  : apiError
                  ? `エラー: ${apiError}`
                  : "\u00A0"}
              </div>
            </div>
            <button
              style={styles.smallBtn}
              onClick={() => {
                setEditingEvent(null);
                setShowEventForm(true);
              }}
            >
              ＋ 新規
            </button>
          </div>

          {/* 年表プリセット（getWikiTimelines がある時だけ表示） */}
          {getWikiTimelines && (
            <div style={{ ...styles.header, marginTop: 0 }}>
              <label style={{ fontSize: 14 }}>TLwiki 年表:</label>
              <select
                value={selectedTimelineId || ""}
                onChange={(e) => setSelectedTimelineId(e.target.value || null)}
                style={{ ...styles.smallBtn, padding: "6px 8px" }}
              >
                <option value="">（すべて）</option>
                {timelines.map((tl) => (
                  <option key={tl.id} value={tl.id}>
                    {tl.name}
                  </option>
                ))}
              </select>
              {activePreset && (
                <span style={styles.hint}>
                  条件: {activePreset.tag_mode} /{" "}
                  {activePreset.tags?.join(", ")}
                </span>
              )}
            </div>
          )}

          {/* 一覧 */}
          <div style={styles.list}>
            {eventsToRender.length === 0 && (
              <div
                style={{ color: "#6b7280", padding: 24, textAlign: "center" }}
              >
                {busy || apiLoading
                  ? "読み込み中…"
                  : "イベントが見つかりません"}
              </div>
            )}

            {eventsToRender.map((ev) => {
              const canEdit = !!user && ev.created_by === user.id;
              return (
                <WikiEventCard
                  key={ev.id}
                  event={ev}
                  user={user}
                  wikiData={wikiData}
                  canEdit={canEdit}
                  onEdit={() => {
                    setEditingEvent(ev);
                    setShowEventForm(true);
                  }}
                  onImport={makeImportHandler(ev)}
                  showRevisions={viewMode === "stable"} // stable 表示時にリビジョン面も見たい場合
                />
              );
            })}
          </div>
        </>
      )}

      {currentTab === "history" && (
        <div style={styles.list}>
          {recentActivity.length === 0 ? (
            <div style={{ color: "#6b7280", padding: 24, textAlign: "center" }}>
              {busy || apiLoading ? "読み込み中…" : "履歴がありません"}
            </div>
          ) : (
            recentActivity.map((row) => (
              <div
                key={
                  row.id || `${row.rev_id}-${row.event_id}-${row.created_at}`
                }
                style={{
                  padding: 12,
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  background: "#fff",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {row.title || row.event_title || "（無題）"}
                </div>
                <div style={{ color: "#6b7280", fontSize: 12 }}>
                  rev: {row.rev_id || "-"} /{" "}
                  {new Date(
                    row.created_at || row.createdAt || Date.now()
                  ).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 追加・編集フォーム */}
      {showEventForm && (
        <WikiEventForm
          event={editingEvent}
          onSave={handleSaveEvent}
          onCancel={() => {
            setShowEventForm(false);
            setEditingEvent(null);
          }}
          loading={busy || apiLoading}
        />
      )}
    </div>
  );
};

export default WikiBrowser;
