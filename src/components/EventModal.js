// components/EventModal.js
import React from "react";
import { TIMELINE_CONFIG } from "../constants/timelineConfig";

export const EventModal = ({
  isOpen,
  editingEvent,
  newEvent,
  modalPosition,
  onSave,
  onClose,
  onAddManualTag,
  onRemoveManualTag,
  getAllCurrentTags,
  onEventChange,
}) => {
  if (!isOpen) return null;

  const handleEventChange = (field, value) => {
    onEventChange({ ...newEvent, [field]: value });
  };

  return (
    <div
      style={{
        position: "absolute",
        left: Math.min(
          Math.max(TIMELINE_CONFIG.MODAL_MARGIN, modalPosition.x - 160),
          window.innerWidth - TIMELINE_CONFIG.MODAL_WIDTH - TIMELINE_CONFIG.MODAL_MARGIN
        ),
        top: Math.min(
          Math.max(TIMELINE_CONFIG.MODAL_MARGIN, modalPosition.y),
          window.innerHeight - 500
        ),
        width: `${TIMELINE_CONFIG.MODAL_WIDTH}px`,
        backgroundColor: "white",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        padding: "16px",
        zIndex: 20,
        maxHeight: `${TIMELINE_CONFIG.MODAL_MAX_HEIGHT}px`,
        overflowY: "auto",
      }}
    >
      <h3
        style={{
          margin: "0 0 12px 0",
          fontSize: "16px",
          fontWeight: "600",
        }}
      >
        {editingEvent ? "イベントを編集" : "新しいイベント"}
      </h3>

      {/* 日時入力 */}
      <div style={{ marginBottom: "12px" }}>
        <input
          type="date"
          value={newEvent.date.toISOString().split("T")[0]}
          onChange={(e) => handleEventChange("date", new Date(e.target.value))}
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            fontSize: "14px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* タイトル入力 */}
      <div style={{ marginBottom: "12px" }}>
        <input
          type="text"
          placeholder="イベントタイトル"
          value={newEvent.title}
          onChange={(e) => handleEventChange("title", e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            fontSize: "14px",
            boxSizing: "border-box",
          }}
          autoFocus
        />
      </div>

      {/* 説明文入力 */}
      <div style={{ marginBottom: "12px" }}>
        <textarea
          placeholder="説明文。例: #建築 #モダニズム による代表作"
          value={newEvent.description}
          onChange={(e) => handleEventChange("description", e.target.value)}
          style={{
            width: "100%",
            height: "60px",
            padding: "8px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            fontSize: "14px",
            resize: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* タグ表示・編集 */}
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            fontSize: "14px",
            marginBottom: "4px",
          }}
        >
          タグ (Enterで追加、×で削除)
        </label>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
            minHeight: "40px",
            padding: "8px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            backgroundColor: "white",
            alignItems: "flex-start",
          }}
        >
          {/* 既存タグの表示 */}
          {getAllCurrentTags().map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              style={{
                padding: "4px 8px",
                backgroundColor: "#3b82f6",
                color: "white",
                fontSize: "12px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                height: "24px",
              }}
            >
              {tag}
              {/* 手動タグのみ削除可能 */}
              {newEvent.manualTags.includes(tag) && (
                <button
                  onClick={() => onRemoveManualTag(tag)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "14px",
                    padding: "0",
                    width: "16px",
                    height: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                  }}
                  onMouseOver={(e) =>
                    (e.target.style.backgroundColor = "rgba(255,255,255,0.2)")
                  }
                  onMouseOut={(e) =>
                    (e.target.style.backgroundColor = "transparent")
                  }
                >
                  ×
                </button>
              )}
            </span>
          ))}

          {/* インライン追加フィールド */}
          <input
            type="text"
            placeholder={
              getAllCurrentTags().length === 0
                ? "タグを入力してEnterで追加"
                : "新しいタグ"
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target.value.trim()) {
                e.preventDefault();
                onAddManualTag(e.target.value.trim());
                e.target.value = "";
              }
            }}
            style={{
              border: "none",
              outline: "none",
              padding: "4px 8px",
              fontSize: "12px",
              minWidth: "100px",
              backgroundColor: "transparent",
              height: "24px",
              flex: 1,
            }}
          />
        </div>
        <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>
          💡 タイトルと説明文の #タグ名 は自動的に追加されます
          <br />
          💡 Ctrl+Enter（Mac: Cmd+Enter）で保存
        </div>
      </div>

      {/* ボタン */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={onClose}
          style={{
            padding: "6px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            backgroundColor: "white",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          キャンセル
        </button>
        {editingEvent && (
          <button
            onClick={() => {
              if (window.confirm("このイベントを削除しますか？")) {
                // 削除処理は親コンポーネントで処理
                onClose();
              }
            }}
            style={{
              padding: "6px 12px",
              border: "none",
              borderRadius: "4px",
              backgroundColor: "#ef4444",
              color: "white",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            削除
          </button>
        )}
        <button
          onClick={onSave}
          style={{
            padding: "6px 12px",
            border: "none",
            borderRadius: "4px",
            backgroundColor: "#3b82f6",
            color: "white",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          {editingEvent ? "更新" : "作成"}
        </button>
      </div>
    </div>
  );
};