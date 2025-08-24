import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

const EventGraphView = ({
  events = [],
  timelines = [],
  highlightedEvents = new Set(),
  searchTerm = '',
  onEventClick,
  onEventDoubleClick,
  onTagFilter,
  panelWidth = 300
}) => {
  const svgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const simulationRef = useRef(null);

  // ウィンドウサイズに応じて描画エリアのサイズを更新
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ 
          width: rect.width - panelWidth - 40, 
          height: rect.height - 40 
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [panelWidth]);

  // イベント同士の関連度を計算（共通タグ数ベース）
  const calculateEventSimilarity = useCallback((event1, event2) => {
    const tags1 = new Set(event1.tags || []);
    const tags2 = new Set(event2.tags || []);
    const intersection = new Set([...tags1].filter(x => tags2.has(x)));
    const union = new Set([...tags1, ...tags2]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }, []);

  // ノードとリンクを生成
  const generateGraphData = useCallback(() => {
    const nodes = events.map(event => ({
      id: event.id,
      title: event.title,
      year: event.startDate.getFullYear(),
      tags: event.tags || [],
      description: event.description || '',
      isHighlighted: highlightedEvents.has(event.id),
      timelineColors: timelines
        .filter(timeline => 
          timeline.events.some(tlEvent => tlEvent.id === event.id) ||
          (timeline.temporaryEvents || []).some(tlEvent => tlEvent.id === event.id)
        )
        .map(timeline => timeline.color),
      // ノードサイズ（年表に含まれる数 + ハイライト状態で調整）
      size: Math.max(8, 
        6 + 
        timelines.filter(tl => 
          tl.events.some(e => e.id === event.id) || 
          (tl.temporaryEvents || []).some(e => e.id === event.id)
        ).length * 2 +
        (highlightedEvents.has(event.id) ? 4 : 0)
      )
    }));

    const links = [];
    
    // イベント間のリンクを生成（類似度が閾値以上の場合）
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const event1 = events[i];
        const event2 = events[j];
        const similarity = calculateEventSimilarity(event1, event2);
        
        if (similarity > 0.2) { // 閾値は調整可能
          links.push({
            source: nodes[i].id,
            target: nodes[j].id,
            strength: similarity,
            type: 'similarity'
          });
        }
      }
    }

    // 年表による明示的なリンクを追加
    timelines.forEach(timeline => {
      const timelineEvents = [
        ...timeline.events,
        ...(timeline.temporaryEvents || [])
      ];
      
      // 年表内のイベントを時系列順にソート
      const sortedEvents = timelineEvents
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

      // 隣接するイベント同士をリンク
      for (let i = 0; i < sortedEvents.length - 1; i++) {
        const currentEvent = sortedEvents[i];
        const nextEvent = sortedEvents[i + 1];
        
        // 既存のリンクがなければ追加
        const existingLink = links.find(link => 
          (link.source === currentEvent.id && link.target === nextEvent.id) ||
          (link.source === nextEvent.id && link.target === currentEvent.id)
        );
        
        if (!existingLink) {
          links.push({
            source: currentEvent.id,
            target: nextEvent.id,
            strength: 0.8,
            type: 'timeline',
            timelineId: timeline.id,
            timelineColor: timeline.color
          });
        }
      }
    });

    return { nodes, links };
  }, [events, timelines, highlightedEvents, calculateEventSimilarity]);

  // D3力学シミュレーションを設定
  useEffect(() => {
    if (!svgRef.current || events.length === 0) return;

    const { nodes, links } = generateGraphData();
    const svg = d3.select(svgRef.current);
    
    svg.selectAll("*").remove();
    
    const g = svg.append("g");
    
    // ズームとパン
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom);

    // 力学シミュレーション
    const sim = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links)
        .id(d => d.id)
        .distance(d => {
          // 年表リンクは短く、類似度リンクは強さに応じて距離調整
          if (d.type === 'timeline') return 80;
          return 120 - (d.strength * 60);
        })
        .strength(d => d.type === 'timeline' ? 0.8 : d.strength * 0.5)
      )
      .force("charge", d3.forceManyBody()
        .strength(-300)
        .distanceMax(200)
      )
      .force("center", d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force("collision", d3.forceCollide().radius(d => d.size + 5));

    simulationRef.current = sim;

    // リンクの描画
    const linkGroup = g.append("g")
      .attr("class", "links");

    const link = linkGroup.selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", d => {
        if (d.type === 'timeline' && d.timelineColor) {
          return d.timelineColor;
        }
        return d.strength > 0.5 ? "#8b5cf6" : "#cbd5e1";
      })
      .attr("stroke-width", d => {
        if (d.type === 'timeline') return 3;
        return Math.max(1, d.strength * 4);
      })
      .attr("stroke-opacity", d => d.type === 'timeline' ? 0.8 : 0.4)
      .attr("stroke-dasharray", d => d.type === 'timeline' ? "0" : "5,5");

    // ノードの描画
    const nodeGroup = g.append("g")
      .attr("class", "nodes");

    const node = nodeGroup.selectAll("g")
      .data(nodes)
      .enter().append("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .call(d3.drag()
        .on("start", (event, d) => {
          if (!event.active) sim.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) sim.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // ノードの円
    node.append("circle")
      .attr("r", d => d.size)
      .attr("fill", d => {
        if (d.isHighlighted) return "#10b981";
        if (d.timelineColors.length > 0) return d.timelineColors[0];
        return "#6b7280";
      })
      .attr("stroke", d => d.isHighlighted ? "#059669" : "white")
      .attr("stroke-width", d => d.isHighlighted ? 3 : 2);

    // 複数年表に属する場合の追加リング
    node.each(function(d) {
      if (d.timelineColors.length > 1) {
        d3.select(this).selectAll(".additional-ring")
          .data(d.timelineColors.slice(1, 4)) // 最大3つの追加色
          .enter()
          .append("circle")
          .attr("class", "additional-ring")
          .attr("r", (_, i) => d.size + 3 + (i * 2))
          .attr("fill", "none")
          .attr("stroke", color => color)
          .attr("stroke-width", 2)
          .attr("opacity", 0.6);
      }
    });

    // ノードのラベル
    node.append("text")
      .text(d => d.title.length > 12 ? d.title.substring(0, 12) + "..." : d.title)
      .attr("font-size", "11px")
      .attr("font-weight", d => d.isHighlighted ? "600" : "500")
      .attr("fill", "#374151")
      .attr("text-anchor", "middle")
      .attr("dy", d => d.size + 16)
      .attr("pointer-events", "none");

    // 年代表示
    node.append("text")
      .text(d => d.year)
      .attr("font-size", "9px")
      .attr("fill", "#6b7280")
      .attr("text-anchor", "middle")
      .attr("dy", d => d.size + 28)
      .attr("pointer-events", "none");

    // イベントハンドラー
    node
      .on("click", (event, d) => {
        setSelectedEvent(d);
        onEventClick && onEventClick(events.find(e => e.id === d.id));
      })
      .on("dblclick", (event, d) => {
        onEventDoubleClick && onEventDoubleClick(events.find(e => e.id === d.id));
      })
      .on("mouseover", (event, d) => {
        setHoveredEvent(d);
        
        // 関連ノードとリンクをハイライト
        const relatedNodes = new Set([d.id]);
        const relatedLinks = links.filter(l => 
          l.source.id === d.id || l.target.id === d.id
        );
        
        relatedLinks.forEach(l => {
          relatedNodes.add(l.source.id);
          relatedNodes.add(l.target.id);
        });

        node.style("opacity", n => relatedNodes.has(n.id) ? 1 : 0.3);
        link.style("opacity", l => 
          l.source.id === d.id || l.target.id === d.id ? 1 : 0.1
        );
      })
      .on("mouseout", () => {
        setHoveredEvent(null);
        node.style("opacity", 1);
        link.style("opacity", d => d.type === 'timeline' ? 0.8 : 0.4);
      });

    // シミュレーション更新時の描画更新
    sim.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    return () => {
      sim.stop();
    };
  }, [events, timelines, dimensions, generateGraphData, highlightedEvents, onEventClick, onEventDoubleClick]);

  // 検索フィルタリング
  const filteredEvents = events.filter(event => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      event.title.toLowerCase().includes(searchLower) ||
      (event.tags || []).some(tag => tag.toLowerCase().includes(searchLower)) ||
      (event.description || '').toLowerCase().includes(searchLower)
    );
  });

  const styles = {
    container: {
      display: 'flex',
      height: 'calc(100vh - 64px)',
      backgroundColor: '#f8fafc'
    },
    graphArea: {
      flex: 1,
      position: 'relative',
      overflow: 'hidden',
      background: 'radial-gradient(circle at 50% 50%, #ffffff 0%, #f1f5f9 100%)'
    },
    svg: {
      width: '100%',
      height: '100%',
      cursor: 'grab'
    },
    controlPanel: {
      width: panelWidth,
      backgroundColor: 'white',
      borderLeft: '1px solid #e2e8f0',
      padding: '20px',
      overflow: 'auto'
    },
    searchInput: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      marginBottom: '16px'
    },
    eventCard: {
      backgroundColor: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    },
    eventTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '4px'
    },
    eventYear: {
      fontSize: '12px',
      color: '#6b7280',
      marginBottom: '8px'
    },
    tagContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px',
      marginTop: '8px'
    },
    tag: {
      fontSize: '10px',
      backgroundColor: '#dbeafe',
      color: '#1e40af',
      padding: '2px 6px',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    legend: {
      marginTop: '20px',
      padding: '16px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px'
    },
    legendTitle: {
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '8px',
      color: '#374151'
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '6px',
      fontSize: '12px',
      color: '#6b7280'
    },
    legendColor: {
      width: '12px',
      height: '12px',
      marginRight: '8px',
      borderRadius: '2px'
    },
    statsPanel: {
      marginTop: '16px',
      padding: '12px',
      backgroundColor: '#f1f5f9',
      borderRadius: '6px'
    },
    statItem: {
      fontSize: '12px',
      color: '#4b5563',
      marginBottom: '4px'
    }
  };

  // 統計情報を計算
  const stats = {
    totalEvents: events.length,
    visibleEvents: filteredEvents.length,
    totalTimelines: timelines.length,
    highlightedCount: highlightedEvents.size
  };

  return (
    <div style={styles.container} ref={containerRef}>
      <div style={styles.graphArea}>
        <svg
          ref={svgRef}
          style={styles.svg}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        />
        
        {/* ツールチップ */}
        {hoveredEvent && (
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              color: 'white',
              padding: '12px',
              borderRadius: '6px',
              fontSize: '12px',
              maxWidth: '250px',
              pointerEvents: 'none',
              zIndex: 1000
            }}
          >
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
              {hoveredEvent.title} ({hoveredEvent.year})
            </div>
            {hoveredEvent.description && (
              <div style={{ marginBottom: '6px', opacity: 0.9 }}>
                {hoveredEvent.description}
              </div>
            )}
            <div style={{ fontSize: '10px', opacity: 0.8 }}>
              {hoveredEvent.tags.slice(0, 3).map(tag => `#${tag}`).join(' ')}
            </div>
          </div>
        )}
      </div>

      {/* コントロールパネル */}
      <div style={styles.controlPanel}>
        {/* 検索 */}
        <input
          type="text"
          placeholder="イベント、タグで検索..."
          style={styles.searchInput}
          // value={searchTerm}
          // onChange={(e) => onSearchChange && onSearchChange(e)}
        />

        {/* 選択されたイベントの詳細 */}
        {selectedEvent && (
          <div style={styles.eventCard}>
            <div style={styles.eventTitle}>{selectedEvent.title}</div>
            <div style={styles.eventYear}>{selectedEvent.year}年</div>
            {selectedEvent.description && (
              <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.4' }}>
                {selectedEvent.description}
              </div>
            )}
            <div style={styles.tagContainer}>
              {selectedEvent.tags.map(tag => (
                <span
                  key={tag}
                  style={styles.tag}
                  onClick={() => onTagFilter && onTagFilter(tag)}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 凡例 */}
        <div style={styles.legend}>
          <div style={styles.legendTitle}>凡例</div>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendColor, backgroundColor: '#6b7280' }} />
            一般イベント
          </div>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendColor, backgroundColor: '#10b981' }} />
            検索結果
          </div>
          <div style={styles.legendItem}>
            <div style={{ 
              ...styles.legendColor, 
              backgroundColor: 'transparent',
              border: '2px solid #8b5cf6'
            }} />
            年表リンク
          </div>
          <div style={styles.legendItem}>
            <div style={{ 
              ...styles.legendColor, 
              backgroundColor: 'transparent',
              border: '1px dashed #cbd5e1'
            }} />
            類似リンク
          </div>
        </div>

        {/* 統計 */}
        <div style={styles.statsPanel}>
          <div style={styles.statItem}>
            📊 全イベント: {stats.totalEvents}
          </div>
          <div style={styles.statItem}>
            👁️ 表示中: {stats.visibleEvents}
          </div>
          <div style={styles.statItem}>
            📈 年表数: {stats.totalTimelines}
          </div>
          {stats.highlightedCount > 0 && (
            <div style={styles.statItem}>
              🔍 検索ヒット: {stats.highlightedCount}
            </div>
          )}
        </div>

        {/* 操作説明 */}
        <div style={{ marginTop: '20px', fontSize: '11px', color: '#6b7280' }}>
          <div style={{ fontWeight: '500', marginBottom: '6px' }}>操作方法:</div>
          <div>• ドラッグ: ノード移動</div>
          <div>• ホイール: ズーム</div>
          <div>• クリック: 詳細表示</div>
          <div>• ダブルクリック: 編集</div>
        </div>
      </div>
    </div>
  );
};

export default EventGraphView;