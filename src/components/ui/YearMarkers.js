import React from 'react';

// 年マーカーの描画に特化したコンポーネント
export const YearMarkers = ({ markers }) => {
  if (!markers || markers.length === 0) {
    return null;
  }

  return (
    <>
      {markers.map((marker) => (
        <div
          key={marker.year}
          style={{
            position: "absolute",
            left: `${marker.x}px`,
            top: "0px",
            height: "100%",
            borderLeft: "1px solid #ddd",
            pointerEvents: "none",
            zIndex: 5,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: "10px",
              left: "5px",
              fontSize: `${marker.fontSize}px`,
              color: "#666",
              fontWeight: "500",
              userSelect: "none",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              padding: "2px 6px",
              borderRadius: "3px",
            }}
          >
            {marker.year}
          </span>
        </div>
      ))}
    </>
  );
};