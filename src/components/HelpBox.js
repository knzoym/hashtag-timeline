// components/HelpBox.js
import React from "react";

export const HelpBox = ({ isHelpOpen, setIsHelpOpen, highlightedEvents, styles }) => {
  return (
    <div style={styles.helpBox}>
      {/* ヘッダー */}
      <div
        style={{
          padding: "8px 12px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: isHelpOpen ? "1px solid rgba(255,255,255,0.2)" : "none",
        }}
        onClick={() => setIsHelpOpen(!isHelpOpen)}
      >
        <span style={{ fontWeight: "500" }}>操作ガイド</span>
        <span
          style={{
            fontSize: "14px",
            transition: "transform 0.2s",
            transform: isHelpOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▼
        </span>
      </div>

      {/* コンテンツ */}
      {isHelpOpen && (
        <div style={{ padding: "8px 12px" }}>
          <div>マウスホイール: ズーム</div>
          <div>ドラッグ: 横パン移動</div>
          <div>Shift+ドラッグ: 縦パン移動</div>
          <div>年表カード: 縦ドラッグで移動</div>
          <div>ダブルクリック: イベント追加・編集</div>
          <div
            style={{
              marginTop: "8px",
              paddingTop: "8px",
              borderTop: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <div>タグの作り方:</div>
            <div style={{ marginLeft: "12px", fontSize: "11px", opacity: 0.9 }}>
              説明文で{" "}
              <code
                style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  padding: "1px 3px",
                  borderRadius: "2px",
                }}
              >
                #タグ名
              </code>{" "}
              を使用
            </div>
          </div>
          {highlightedEvents.size > 0 && (
            <div
              style={{
                marginTop: "8px",
                color: "#10b981",
                paddingTop: "8px",
                borderTop: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              {highlightedEvents.size}件ヒット中
            </div>
          )}
        </div>
      )}
    </div>
  );
};