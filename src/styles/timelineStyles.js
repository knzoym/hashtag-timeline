// styles/timelineStyles.js
export const createTimelineStyles = (isDragging, timelineCardY) => ({
  app: {
    width: "100vw",
    height: "100vh",
    backgroundColor: "white",
    overflow: "hidden",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  
  header: {
    position: "relative",
    backgroundColor: "#f5f3ed",
    borderBottom: "1px solid #e5e7eb",
    height: "64px",
    display: "flex",
    alignItems: "center",
    padding: "0 16px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    zIndex: 15,
  },
  
  title: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#374151",
  },
  
  headerRight: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  
  addButton: {
    backgroundColor: "#e29548ff",
    color: "white",
    padding: "8px 16px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
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
  
  zoomInfo: {
    fontSize: "14px",
    color: "#6b7280",
  },
  
  timeline: {
    width: "100vw",
    height: "calc(100vh - 64px)",
    position: "relative",
    backgroundColor: "white",
    cursor: isDragging ? "grabbing" : "grab",
  },
  
  // 浮遊する検索パネル
  floatingPanel: {
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
  
  // 年表一覧のスタイル
  timelineSection: {
    marginTop: "16px",
  },
  
  timelineList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  
  timelineItem: {
    padding: "8px",
    backgroundColor: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  
  timelineItemTitle: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "2px",
  },
  
  timelineItemInfo: {
    fontSize: "10px",
    color: "#6b7280",
  },
  
  timelineItemMore: {
    padding: "6px 8px",
    fontSize: "11px",
    color: "#6b7280",
    textAlign: "center",
    fontStyle: "italic",
  },
  
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
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
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
});