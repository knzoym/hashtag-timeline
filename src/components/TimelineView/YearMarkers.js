// src/components/TimelineView/YearMarkers.js
import React, { useMemo } from 'react';
import { useTimelineStore } from '../../store/useTimelineStore';
import { getXFromYear, getYearFromX } from '../../utils/timelineUtils'; // ★ 修正
import { TIMELINE_CONFIG } from '../../constants/timelineConfig';

const YearMarkers = () => {
  const { scale, panX } = useTimelineStore();
  const currentPixelsPerYear = TIMELINE_CONFIG.BASE_PIXELS_PER_YEAR * scale;

  const markers = useMemo(() => {
    const result = [];
    const adjustedScale = scale / 2.5;
    let yearInterval;

    if (adjustedScale > 12) yearInterval = 1;
    else if (adjustedScale > 6) yearInterval = 2;
    else if (adjustedScale > 2) yearInterval = 5;
    else if (adjustedScale > 0.8) yearInterval = 10;
    else if (adjustedScale > 0.4) yearInterval = 50;
    else if (adjustedScale > 0.2) yearInterval = 100;
    else yearInterval = 200;

    const startYear = Math.floor(getYearFromX(0, currentPixelsPerYear, panX) / yearInterval) * yearInterval;
    const endYear = Math.ceil(getYearFromX(window.innerWidth, currentPixelsPerYear, panX) / yearInterval) * yearInterval;
    
    for (let year = startYear; year <= endYear; year += yearInterval) {
      const x = getXFromYear(year, currentPixelsPerYear, panX);
      result.push({ year, x });
    }
    return result;
  }, [scale, panX, currentPixelsPerYear]);

  const styles = {
    marker: {
      position: "absolute",
      top: 0,
      height: "100%",
      borderLeft: "1px solid #e5e7eb",
      pointerEvents: "none",
    },
    label: {
      position: "absolute",
      top: "10px",
      left: "5px",
      fontSize: "12px",
      color: "#9ca3af",
      userSelect: "none",
    }
  };

  return (
    <>
      {markers.map(({ year, x }) => (
        <div key={year} style={{ ...styles.marker, left: x }}>
          <span style={styles.label}>{year}</span>
        </div>
      ))}
    </>
  );
};

export default YearMarkers;
