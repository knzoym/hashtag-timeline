// components/TimelineModal.js
import React from "react";

export const TimelineModal = ({ isOpen, timeline, onClose, onDelete }) => {
  if (!isOpen || !timeline) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 30,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "80%",
          maxWidth: "800px",
          maxHeight: "80%",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  margin: "0 0 4px 0",
                  color: "#374151",
                }}
              >
                {timeline.name}
              </h2>
              <div style={{ fontSize: "14px", color: "#6b7280" }}>
                {timeline.eventCount}件のイベント • 作成日:{" "}
                {timeline.createdAt.toLocaleDateString()}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => onDelete(timeline.id)}
                style={{
                  padding: "6px 12px",
                  border: "1px solid #ef4444",
                  borderRadius: "4px",
                  backgroundColor: "white",
                  color: "#ef4444",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                削除
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: "6px 12px",
                  border: "none",
                  borderRadius: "4px",
                  backgroundColor: "#6b7280",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>

        {/* コンテンツ */}
        <div
          style={{
            padding: "20px",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {/* タグ表示 */}
          {timeline.tags.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  marginBottom: "8px",
                }}
              >
                主要タグ
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {timeline.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#c8eaeeff",
                      color: "#1b5f65ff",
                      fontSize: "12px",
                      border: "1px solid #319ca5ff",
                      borderRadius: "4px",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* イベント一覧 */}
          <div>
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "12px",
              }}
            >
              イベント ({timeline.events.length}件)
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {timeline.events
                .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
                .map((event) => (
                  <div
                    key={event.id}
                    style={{
                      padding: "12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      backgroundColor: "#f9fafb",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "8px",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          margin: "0",
                          color: "#374151",
                        }}
                      >
                        {event.title}
                      </h4>
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#6b7280",
                          fontWeight: "500",
                        }}
                      >
                        {event.startDate.getFullYear()}年
                      </span>
                    </div>
                    {event.description && (
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#4b5563",
                          margin: "0 0 8px 0",
                          lineHeight: "1.4",
                        }}
                      >
                        {event.description}
                      </p>
                    )}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "4px",
                      }}
                    >
                      {event.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            padding: "2px 6px",
                            backgroundColor: "#e5e7eb",
                            color: "#374151",
                            fontSize: "11px",
                            borderRadius: "3px",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};