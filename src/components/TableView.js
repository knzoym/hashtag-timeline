// src/components/TableView.js
import React, { useState, useMemo, useCallback } from "react";
import { extractTagsFromDescription } from "../utils/timelineUtils";

const TableView = ({
  events,
  timelines,
  highlightedEvents,
  onEventUpdate,
  onEventDelete,
  searchTerm,
}) => {
  const [sortField, setSortField] = useState("startDate");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedTimeline, setSelectedTimeline] = useState("all");
  const [showTimelineEvents, setShowTimelineEvents] = useState(true);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");

  // ソート処理
  const sortedEvents = useMemo(() => {
    let eventsToShow = [];

    if (selectedTimeline === "all") {
      eventsToShow = [...events];

      // 年表のイベントも含める場合
      if (showTimelineEvents) {
        timelines.forEach((timeline) => {
          // 元々のイベント
          timeline.events.forEach((tlEvent) => {
            if (!eventsToShow.find((e) => e.id === tlEvent.id)) {
              eventsToShow.push({
                ...tlEvent,
                timelineInfo: [
                  {
                    name: timeline.name,
                    color: timeline.color,
                    isTemporary: false,
                  },
                ],
              });
            } else {
              const existingEvent = eventsToShow.find(
                (e) => e.id === tlEvent.id
              );
              if (!existingEvent.timelineInfo) {
                existingEvent.timelineInfo = [];
              }

              const alreadyHasTimeline = existingEvent.timelineInfo.some(
                (info) => info.name === timeline.name
              );

              if (!alreadyHasTimeline) {
                existingEvent.timelineInfo.push({
                  name: timeline.name,
                  color: timeline.color,
                  isTemporary: false,
                });
              }
            }
          });

          // 仮登録されたイベント
          const temporaryEvents = timeline.temporaryEvents || [];
          temporaryEvents.forEach((tlEvent) => {
            if (!eventsToShow.find((e) => e.id === tlEvent.id)) {
              eventsToShow.push({
                ...tlEvent,
                timelineInfo: [
                  {
                    name: timeline.name,
                    color: timeline.color,
                    isTemporary: true,
                  },
                ],
              });
            } else {
              const existingEvent = eventsToShow.find(
                (e) => e.id === tlEvent.id
              );
              if (!existingEvent.timelineInfo) {
                existingEvent.timelineInfo = [];
              }

              const alreadyHasTimeline = existingEvent.timelineInfo.some(
                (info) => info.name === timeline.name
              );

              if (!alreadyHasTimeline) {
                existingEvent.timelineInfo.push({
                  name: timeline.name,
                  color: timeline.color,
                  isTemporary: true,
                });
              }
            }
          });

          // 仮削除されたイベント
          const removedEvents = timeline.removedEvents || [];
          removedEvents.forEach((tlEvent) => {
            if (!eventsToShow.find((e) => e.id === tlEvent.id)) {
              eventsToShow.push({
                ...tlEvent,
                timelineInfo: [],
              });
            } else {
              const existingEvent = eventsToShow.find(
                (e) => e.id === tlEvent.id
              );
              if (existingEvent && existingEvent.timelineInfo) {
                // この年表の情報を削除
                existingEvent.timelineInfo = existingEvent.timelineInfo.filter(
                  (info) => info.name !== timeline.name
                );
              }
            }
          });
        });
      }
    } else if (selectedTimeline === "main") {
      // メインタイムラインのイベントのみ
      const timelineEventIds = new Set();
      timelines.forEach((timeline) => {
        timeline.events.forEach((event) => timelineEventIds.add(event.id));
      });
      eventsToShow = events.filter((event) => !timelineEventIds.has(event.id));
    } else {
      // 特定の年表のイベント
      const timeline = timelines.find(
        (t) => t.id.toString() === selectedTimeline
      );
      if (timeline) {
        const originalEvents = timeline.events.map((event) => ({
          ...event,
          timelineInfo: [
            {
              name: timeline.name,
              color: timeline.color,
              isTemporary: false,
            },
          ],
        }));

        const temporaryEvents = (timeline.temporaryEvents || []).map(
          (event) => ({
            ...event,
            timelineInfo: [
              {
                name: timeline.name,
                color: timeline.color,
                isTemporary: true,
              },
            ],
          })
        );

        const removedEvents = (timeline.removedEvents || []).map((event) => ({
          ...event,
          timelineInfo: [
            {
              name: timeline.name,
              color: timeline.color,
              isRemoved: true,
            },
          ],
        }));

        eventsToShow = [
          ...originalEvents,
          ...temporaryEvents,
          ...removedEvents,
        ];
      } else {
        eventsToShow = [];
      }
    }

    // ソート処理
    return eventsToShow.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case "startDate":
          aValue = a.startDate.getTime();
          bValue = b.startDate.getTime();
          break;
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "tags":
          aValue = a.tags.length;
          bValue = b.tags.length;
          break;
        default:
          aValue = a[sortField];
          bValue = b[sortField];
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [
    events,
    timelines,
    sortField,
    sortOrder,
    selectedTimeline,
    showTimelineEvents,
  ]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return "↕️";
    return sortOrder === "asc" ? "↑" : "↓";
  };

  // インライン編集の開始
  const startEdit = (eventId, field, currentValue) => {
    setEditingCell({ eventId, field });
    if (field === "startDate") {
      setEditValue(currentValue.toISOString().split("T")[0]);
    } else {
      setEditValue(currentValue);
    }
  };

  // インライン編集の保存
  const saveEdit = useCallback(
    (eventId, field, newValue) => {
      const event = sortedEvents.find((e) => e.id === eventId);
      if (!event) return;

      let processedValue = newValue;
      if (field === "startDate") {
        processedValue = new Date(newValue);
      }

      const updatedEvent = {
        ...event,
        [field]: processedValue,
      };

      // タイトルや説明が変更された場合、タグを再計算
      if (field === "title" || field === "description") {
        const extractedTags = extractTagsFromDescription(
          updatedEvent.description || ""
        );
        const titleTag = updatedEvent.title.trim()
          ? [updatedEvent.title.trim()]
          : [];
        const manualTags = updatedEvent.tags.filter(
          (tag) =>
            tag !== event.title &&
            !extractTagsFromDescription(event.description || "").includes(tag)
        );

        updatedEvent.tags = [
          ...new Set([...titleTag, ...extractedTags, ...manualTags]),
        ];
      }

      onEventUpdate(updatedEvent);
      setEditingCell(null);
      setEditValue("");
    },
    [sortedEvents, onEventUpdate]
  );

  // インライン編集のキャンセル
  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  // タグの削除
  const removeTag = useCallback(
    (eventId, tagToRemove) => {
      const event = sortedEvents.find((e) => e.id === eventId);
      if (!event) return;

      const updatedEvent = {
        ...event,
        tags: event.tags.filter((tag) => tag !== tagToRemove),
      };

      onEventUpdate(updatedEvent);
    },
    [sortedEvents, onEventUpdate]
  );

  // タグの追加
  const addTag = useCallback(
    (eventId, newTag) => {
      const event = sortedEvents.find((e) => e.id === eventId);
      if (!event || !newTag.trim() || event.tags.includes(newTag.trim()))
        return;

      const updatedEvent = {
        ...event,
        tags: [...event.tags, newTag.trim()],
      };

      onEventUpdate(updatedEvent);
    },
    [sortedEvents, onEventUpdate]
  );

  // 年表情報の表示（重複を除去）
  const renderTimelineInfo = (timelineInfo) => {
    if (!timelineInfo || timelineInfo.length === 0) return null;

    // 仮削除されたイベントは年表チップを表示しない
    const visibleInfos = timelineInfo.filter((info) => !info.isRemoved);
    if (visibleInfos.length === 0) return null;

    const uniqueInfos = visibleInfos.filter(
      (info, index, array) =>
        array.findIndex((i) => i.name === info.name) === index
    );

    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
        {uniqueInfos.map((info, index) => (
          <span
            key={index}
            style={{
              fontSize: "10px",
              padding: "2px 6px",
              borderRadius: "10px",
              backgroundColor: info.isTemporary ? "transparent" : info.color,
              color: info.isTemporary ? info.color : "white",
              border: info.isTemporary ? `1px dashed ${info.color}` : "none",
              whiteSpace: "nowrap",
            }}
          >
            {info.isTemporary ? `+ ${info.name}` : info.name}
          </span>
        ))}
      </div>
    );
  };

  // タグセルの編集コンポーネント
  const TagCell = ({ event }) => {
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [newTagValue, setNewTagValue] = useState("");

    const handleAddTag = () => {
      if (newTagValue.trim()) {
        addTag(event.id, newTagValue.trim());
        setNewTagValue("");
        setIsAddingTag(false);
      }
    };

    return (
      <div style={{ padding: "12px" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
            alignItems: "center",
          }}
        >
          {/* 既存タグ */}
          {event.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: "11px",
                padding: "4px 8px",
                backgroundColor: "#f3f4f6",
                color: "#374151",
                borderRadius: "4px",
                border: "1px solid #d1d5db",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {tag}
              <button
                onClick={() => removeTag(event.id, tag)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  cursor: "pointer",
                  fontSize: "12px",
                  padding: "0",
                  width: "16px",
                  height: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                }}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "rgba(239, 68, 68, 0.1)")
                }
                onMouseOut={(e) =>
                  (e.target.style.backgroundColor = "transparent")
                }
              >
                ×
              </button>
            </span>
          ))}

          {/* 新しいタグ追加 */}
          {isAddingTag ? (
            <input
              type="text"
              value={newTagValue}
              onChange={(e) => setNewTagValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                } else if (e.key === "Escape") {
                  setIsAddingTag(false);
                  setNewTagValue("");
                }
              }}
              onBlur={handleAddTag}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                padding: "4px 8px",
                fontSize: "11px",
                minWidth: "80px",
              }}
              autoFocus
              placeholder="新しいタグ"
            />
          ) : (
            <button
              onClick={() => setIsAddingTag(true)}
              style={{
                fontSize: "11px",
                padding: "4px 8px",
                backgroundColor: "#e5e7eb",
                color: "#6b7280",
                border: "1px dashed #9ca3af",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              + タグ追加
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "white",
        height: "calc(100vh - 64px)",
        overflow: "auto",
      }}
    >
      {/* コントロールパネル */}
      <div
        style={{
          marginBottom: "20px",
          padding: "16px",
          backgroundColor: "#f9fafb",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "16px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* 年表選択 */}
          <div>
            <label
              style={{
                fontSize: "14px",
                fontWeight: "500",
                marginRight: "8px",
              }}
            >
              表示範囲:
            </label>
            <select
              value={selectedTimeline}
              onChange={(e) => setSelectedTimeline(e.target.value)}
              style={{
                padding: "6px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            >
              <option value="all">全てのイベント</option>
              <option value="main">メインタイムラインのみ</option>
              {timelines.map((timeline) => (
                <option key={timeline.id} value={timeline.id.toString()}>
                  {timeline.name}
                </option>
              ))}
            </select>
          </div>

          {/* 年表イベント表示切り替え */}
          {selectedTimeline === "all" && (
            <label
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <input
                type="checkbox"
                checked={showTimelineEvents}
                onChange={(e) => setShowTimelineEvents(e.target.checked)}
              />
              <span style={{ fontSize: "14px" }}>年表のイベントを含める</span>
            </label>
          )}

          {/* 検索結果表示 */}
          {searchTerm && highlightedEvents.size > 0 && (
            <div
              style={{
                fontSize: "12px",
                color: "#059669",
                backgroundColor: "#d1fae5",
                padding: "4px 8px",
                borderRadius: "4px",
              }}
            >
              「{searchTerm}」で{highlightedEvents.size}件ヒット
            </div>
          )}
        </div>
      </div>

      {/* テーブル */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          overflow: "hidden",
          backgroundColor: "white",
        }}
      >
        {/* ヘッダー */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 100px 200px 2fr 2fr 100px",
            backgroundColor: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          <div
            style={{ padding: "12px", cursor: "pointer", userSelect: "none" }}
            onClick={() => handleSort("title")}
          >
            タイトル {getSortIcon("title")}
          </div>
          <div
            style={{ padding: "12px", cursor: "pointer", userSelect: "none" }}
            onClick={() => handleSort("startDate")}
          >
            年 {getSortIcon("startDate")}
          </div>
          <div style={{ padding: "12px" }}>日付</div>
          <div style={{ padding: "12px" }}>説明</div>
          <div
            style={{ padding: "12px", cursor: "pointer", userSelect: "none" }}
            onClick={() => handleSort("tags")}
          >
            タグ {getSortIcon("tags")}
          </div>
          <div style={{ padding: "12px" }}>操作</div>
        </div>

        {/* データ行 */}
        {sortedEvents.map((event, index) => {
          const isHighlighted = highlightedEvents.has(event.id);

          return (
            <div
              key={`${event.id}-${index}`}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 100px 200px 2fr 2fr 100px",
                borderBottom:
                  index < sortedEvents.length - 1
                    ? "1px solid #f3f4f6"
                    : "none",
                backgroundColor: isHighlighted ? "#f0fdf4" : "white",
                fontSize: "13px",
              }}
            >
              {/* タイトル */}
              <div style={{ padding: "12px" }}>
                {editingCell?.eventId === event.id &&
                editingCell?.field === "title" ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        saveEdit(event.id, "title", editValue);
                      } else if (e.key === "Escape") {
                        cancelEdit();
                      }
                    }}
                    onBlur={() => saveEdit(event.id, "title", editValue)}
                    style={{
                      width: "100%",
                      border: "1px solid #3b82f6",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      fontSize: "13px",
                    }}
                    autoFocus
                  />
                ) : (
                  <div
                    onClick={() => startEdit(event.id, "title", event.title)}
                    style={{
                      cursor: "pointer",
                      fontWeight: isHighlighted ? "600" : "400",
                      color: isHighlighted ? "#059669" : "#374151",
                      padding: "4px",
                      borderRadius: "4px",
                      border: "1px solid transparent",
                    }}
                    onMouseOver={(e) =>
                      (e.target.style.backgroundColor = "#f3f4f6")
                    }
                    onMouseOut={(e) =>
                      (e.target.style.backgroundColor = "transparent")
                    }
                  >
                    {event.title}
                  </div>
                )}
                {event.timelineInfo && (
                  <div style={{ marginTop: "4px" }}>
                    {renderTimelineInfo(event.timelineInfo)}
                  </div>
                )}
              </div>

              {/* 年 */}
              <div style={{ padding: "12px", color: "#6b7280" }}>
                {editingCell?.eventId === event.id &&
                editingCell?.field === "startDate" ? (
                  <input
                    type="date"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        saveEdit(event.id, "startDate", editValue);
                      } else if (e.key === "Escape") {
                        cancelEdit();
                      }
                    }}
                    onBlur={() => saveEdit(event.id, "startDate", editValue)}
                    style={{
                      width: "100%",
                      border: "1px solid #3b82f6",
                      borderRadius: "4px",
                      padding: "4px",
                      fontSize: "12px",
                    }}
                    autoFocus
                  />
                ) : (
                  <div
                    onClick={() =>
                      startEdit(event.id, "startDate", event.startDate)
                    }
                    style={{
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "4px",
                      border: "1px solid transparent",
                    }}
                    onMouseOver={(e) =>
                      (e.target.style.backgroundColor = "#f3f4f6")
                    }
                    onMouseOut={(e) =>
                      (e.target.style.backgroundColor = "transparent")
                    }
                  >
                    {event.startDate.getFullYear()}
                  </div>
                )}
              </div>

              {/* 日付 */}
              <div
                style={{ padding: "12px", color: "#6b7280", fontSize: "12px" }}
              >
                {event.startDate.toLocaleDateString("ja-JP")}
              </div>

              {/* 説明 */}
              <div style={{ padding: "12px" }}>
                {editingCell?.eventId === event.id &&
                editingCell?.field === "description" ? (
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.ctrlKey) {
                        saveEdit(event.id, "description", editValue);
                      } else if (e.key === "Escape") {
                        cancelEdit();
                      }
                    }}
                    onBlur={() => saveEdit(event.id, "description", editValue)}
                    style={{
                      width: "100%",
                      border: "1px solid #3b82f6",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      fontSize: "13px",
                      minHeight: "60px",
                      resize: "vertical",
                    }}
                    autoFocus
                  />
                ) : (
                  <div
                    onClick={() =>
                      startEdit(
                        event.id,
                        "description",
                        event.description || ""
                      )
                    }
                    style={{
                      cursor: "pointer",
                      lineHeight: "1.4",
                      wordBreak: "break-word",
                      padding: "4px",
                      borderRadius: "4px",
                      border: "1px solid transparent",
                      minHeight: "20px",
                    }}
                    onMouseOver={(e) =>
                      (e.target.style.backgroundColor = "#f3f4f6")
                    }
                    onMouseOut={(e) =>
                      (e.target.style.backgroundColor = "transparent")
                    }
                  >
                    {event.description || "説明を追加..."}
                  </div>
                )}
              </div>

              {/* タグ */}
              <TagCell event={event} />

              {/* 操作 */}
              <div
                style={{
                  padding: "12px",
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                <button
                  onClick={() => onEventDelete(event.id)}
                  style={{
                    fontSize: "12px",
                    padding: "4px 8px",
                    backgroundColor: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  削除
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 統計情報 */}
      <div
        style={{
          marginTop: "16px",
          fontSize: "12px",
          color: "#6b7280",
          textAlign: "center",
        }}
      >
        {sortedEvents.length}件のイベントを表示中
        {selectedTimeline !== "all" && (
          <span>
            {" "}
            • フィルター:{" "}
            {selectedTimeline === "main"
              ? "メインタイムライン"
              : timelines.find((t) => t.id.toString() === selectedTimeline)
                  ?.name}
          </span>
        )}
        {sortField && (
          <span>
            {" "}
            • ソート:{" "}
            {sortField === "startDate"
              ? "日付"
              : sortField === "title"
              ? "タイトル"
              : sortField === "tags"
              ? "タグ数"
              : sortField}
            順{sortOrder === "asc" ? "（昇順）" : "（降順）"}
          </span>
        )}
      </div>
    </div>
  );
};

export default TableView;
