// src/components/EventGraphView/EventGraphView.js
import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useTimelineStore } from '../../store/useTimelineStore';

const EventGraphView = () => {
  const { events, timelines, highlightedEvents, searchTerm, setSearchTerm } = useTimelineStore();

  const svgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width - 300, // panelWidth
          height: rect.height,
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);


  useEffect(() => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      if(events.length === 0) {
        svg.append("text")
          .attr("x", dimensions.width / 2)
          .attr("y", dimensions.height / 2)
          .attr("text-anchor", "middle")
          .text("イベントがありません");
        return;
      }
      
      // NOTE: Full D3 graph implementation would go here.
      // This is a placeholder to show the component is rendering correctly.
      svg.append("text")
        .attr("x", dimensions.width / 2)
        .attr("y", dimensions.height / 2)
        .attr("text-anchor", "middle")
        .text(`グラフビュー: ${events.length} イベント`);
    }
  }, [events, timelines, highlightedEvents, dimensions]);

  const styles = {
    container: { display: 'flex', height: '100%', backgroundColor: '#f8fafc' },
    graphArea: { flex: 1, position: 'relative', overflow: 'hidden' },
    svg: { width: '100%', height: '100%' },
    controlPanel: { width: 300, backgroundColor: 'white', borderLeft: '1px solid #e2e8f0', padding: '20px', overflowY: 'auto' },
    searchInput: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box' },
  };

  return (
    <div style={styles.container} ref={containerRef}>
      <div style={styles.graphArea}>
        <svg ref={svgRef} style={styles.svg} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} />
      </div>
      <div style={styles.controlPanel}>
        <input
          type="text"
          placeholder="イベント、タグで検索..."
          style={styles.searchInput}
          onChange={(e) => setSearchTerm(e.target.value)}
          value={searchTerm}
        />
        <div>
            <p>コントロールパネル</p>
        </div>
      </div>
    </div>
  );
};

export default EventGraphView;
