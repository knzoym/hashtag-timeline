// styles/timelineStyles.js
export const createTimelineStyles = (isDragging, timelineCardY) => ({
  app: {
    width: "100vw",
    height: "100vh",
    backgroundColor: "white",
    overflow: "hidden",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  header: {
    position: "relative",
    backgroundColor: "#f5f3ed",
    borderBottom: "1px solid #e5e7eb",
    height: "64px",
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    zIndex: 15,
    justifyContent: "space-between", // 3分割レイアウト
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    flex: "1",
  },

  headerCenter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "0 0 auto",
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flex: "1",
    justifyContent: "flex-end",
    minWidth: 0, // flexの縮小を許可
  },

  // 現在のファイル表示
  currentFile: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },

  fileName: {
    fontSize: "14px",
    color: "#374151",
    fontWeight: "500",
  },

  unsavedIndicator: {
    color: "#f59e0b",
    fontWeight: "bold",
    fontSize: "16px",
  },

  // ビュー切り替えボタン
  viewToggle: {
    display: "flex",
    backgroundColor: "#e5e7eb",
    borderRadius: "6px",
    padding: "2px",
  },

  viewButton: {
    padding: "6px 12px",
    border: "none",
    backgroundColor: "transparent",
    color: "#6b7280",
    fontSize: "13px",
    fontWeight: "500",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  viewButtonActive: {
    backgroundColor: "#3b82f6",
    color: "white",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
  },

  title: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#374151",
    margin: 0,
  },

  // FABイベントを追加ボタン
  addButton: {
    position: "absolute",
    top: "40px",
    right: "70px",
    backgroundColor: "#e29548ff",
    color: "white",
    padding: "8px 16px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    zIndex: 10,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  timeline: {
    width: "calc(100% - 20px)", // 右側に余裕を持たせる
    height: "calc(100vh - 64px)",
    position: "relative",
    backgroundColor: "white",
    cursor: "grabbing", // isDraggingは削除
    marginRight: "20px", // 右マージンを追加
    overflow: "hidden", // はみ出し防止
  },

  // アクションボタン
  actionButton: {
    padding: "6px 12px",
    backgroundColor: "#6b7280",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    transition: "background-color 0.2s",
    whiteSpace: "nowrap", // テキストの折り返し防止
  },

  // アカウント関連
  accountContainer: {
    position: "relative",
  },

  loadingText: {
    fontSize: "13px",
    color: "#6b7280",
  },

  loginButton: {
    padding: "8px 16px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "background-color 0.2s",
  },

  accountMenu: {
    position: "relative",
  },

  accountButton: {
    padding: "8px 12px",
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#374151",
    transition: "all 0.2s",
  },

  userIcon: {
    fontSize: "16px",
  },

  userEmail: {
    maxWidth: "80px", // さらに短く
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  dropdownIcon: {
    fontSize: "10px",
    color: "#9ca3af",
    transition: "transform 0.2s",
  },

  // ドロップダウンメニュー
  dropdown: {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: "4px",
    width: "200px",
    backgroundColor: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
    zIndex: 50,
    overflow: "hidden",
  },

  dropdownHeader: {
    padding: "12px 16px",
    backgroundColor: "#f9fafb",
    borderBottom: "1px solid #f3f4f6",
  },

  fullEmail: {
    fontSize: "12px",
    color: "#6b7280",
    wordBreak: "break-all",
  },

  dropdownDivider: {
    height: "1px",
    backgroundColor: "#f3f4f6",
  },

  dropdownItem: {
    width: "100%",
    padding: "10px 16px",
    border: "none",
    backgroundColor: "transparent",
    textAlign: "left",
    fontSize: "13px",
    color: "#374151",
    cursor: "pointer",
    transition: "background-color 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  // オーバーレイ
  menuOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
    backgroundColor: "transparent",
  },

  resetButton: {
    backgroundColor: "#6b7280",
    color: "white",
    padding: "6px 12px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },

  timeline: {
    width: "100vw",
    height: "calc(100vh - 64px)",
    position: "relative",
    backgroundColor: "white",
    cursor: isDragging ? "grabbing" : "grab",
  },

  // FAB検索パネル
  searchPanel: {
    position: "absolute",
    top: "20px",
    left: "20px",
    width: "200px",
    backgroundColor: "#f5f5f3",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    zIndex: 10,
    padding: "16px",
  },

  searchInput: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    marginBottom: "16px",
    fontSize: "14px",
    boxSizing: "border-box",
  },

  tagSection: {
    marginBottom: "16px",
  },

  sectionTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "8px",
  },

  tagContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
  },

  tag: {
    padding: "4px 8px",
    backgroundColor: "#c8eaeeff",
    color: "#1b5f65ff",
    fontSize: "12px",
    border: "1px solid #319ca5ff",
    borderRadius: "4px",
  },

  createButton: {
    width: "100%",
    backgroundColor: "#319ca5ff",
    color: "white",
    padding: "8px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
  },

  //   // 年表一覧のスタイル
  //   timelineSection: {
  //     marginTop: "16px",
  //   },

  //   timelineList: {
  //     display: "flex",
  //     flexDirection: "column",
  //     gap: "6px",
  //   },

  //   timelineItem: {
  //     padding: "8px",
  //     backgroundColor: "#f3f4f6",
  //     border: "1px solid #d1d5db",
  //     borderRadius: "4px",
  //     cursor: "pointer",
  //     transition: "background-color 0.2s",
  //   },

  //   timelineItemTitle: {
  //     fontSize: "12px",
  //     fontWeight: "600",
  //     color: "#374151",
  //     marginBottom: "2px",
  //   },

  //   timelineItemInfo: {
  //     fontSize: "10px",
  //     color: "#6b7280",
  //   },

  //   timelineItemMore: {
  //     padding: "6px 8px",
  //     fontSize: "11px",
  //     color: "#6b7280",
  //     textAlign: "center",
  //     fontStyle: "italic",
  //   },

  // ドラッグ可能な年表カード
  timelineCard: {
    position: "absolute",
    left: "20px",
    top: timelineCardY + "px",
    width: "200px",
    padding: "12px",
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    cursor: "move",
    zIndex: 9,
  },

  timelineTitle: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "8px",
    marginTop: "0px",
    userSelect: "none",
  },

  helpBox: {
    position: "absolute",
    bottom: "16px",
    right: "16px",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    color: "white",
    borderRadius: "6px",
    fontSize: "12px",
    lineHeight: "1.4",
    maxWidth: "250px",
    zIndex: 10,
  },

  cardContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  timelineCard: {
    padding: "8px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s",
    position: "relative",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "4px",
  },

  cardTitle: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#374151",
    flex: 1,
  },

  deleteButton: {
    background: "none",
    border: "none",
    color: "#ef4444",
    cursor: "pointer",
    fontSize: "14px",
    padding: "0",
    width: "16px",
    height: "16px",
    marginLeft: "8px",
  },

  cardInfo: {
    fontSize: "10px",
    color: "#6b7280",
    marginBottom: "6px",
  },

  cardTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "2px",
    marginBottom: "4px",
  },

  cardTag: {
    padding: "1px 4px",
    backgroundColor: "#f3f4f6",
    color: "#374151",
    fontSize: "9px",
    borderRadius: "2px",
  },

  visibilityIndicator: {
    fontSize: "9px",
    color: "#059669",
    fontWeight: "500",
    textAlign: "right",
  },
});
