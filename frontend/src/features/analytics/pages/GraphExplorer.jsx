import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../../services/api';

// --- Constants -----------------------------------------------------------

const NODE_TYPE_CONFIG = {
  Payer:      { color: '#3b82f6', label: 'Payer' },
  Provider:   { color: '#22c55e', label: 'Provider' },
  RootCause:  { color: '#ef4444', label: 'Root Cause' },
  CARCCode:   { color: '#f97316', label: 'CARC Code' },
  Category:   { color: '#a855f7', label: 'Category' },
  Claim:      { color: '#06b6d4', label: 'Claim' },
  Diagnosis:  { color: '#ec4899', label: 'Diagnosis' },
  Procedure:  { color: '#eab308', label: 'Procedure' },
};

const CANVAS_W = 800;
const CANVAS_H = 600;
const NODE_RADIUS = 18;
const REPULSION = 3000;
const SPRING_K = 0.005;
const SPRING_LEN = 120;
const CENTER_GRAVITY = 0.01;
const DAMPING = 0.92;
const DT = 0.8;

// --- Demo dataset --------------------------------------------------------

function buildDemoGraph() {
  const nodes = [
    { id: 'payer-1',   type: 'Payer',     name: 'Aetna',               props: { region: 'Northeast', claims: 1240 } },
    { id: 'payer-2',   type: 'Payer',     name: 'Blue Cross',          props: { region: 'Midwest', claims: 980 } },
    { id: 'payer-3',   type: 'Payer',     name: 'UnitedHealth',        props: { region: 'National', claims: 2100 } },
    { id: 'prov-1',    type: 'Provider',  name: 'City General',        props: { npi: '1234567890', specialty: 'General' } },
    { id: 'prov-2',    type: 'Provider',  name: 'Metro Cardiology',    props: { npi: '0987654321', specialty: 'Cardiology' } },
    { id: 'rc-1',      type: 'RootCause', name: 'Missing Auth',        props: { group: 'PROCESS', preventable: true } },
    { id: 'rc-2',      type: 'RootCause', name: 'Invalid Modifier',    props: { group: 'PREVENTABLE', preventable: true } },
    { id: 'rc-3',      type: 'RootCause', name: 'Medical Necessity',   props: { group: 'CLINICAL', preventable: false } },
    { id: 'carc-1',    type: 'CARCCode',  name: 'CO-4',               props: { description: 'Procedure code inconsistent' } },
    { id: 'carc-2',    type: 'CARCCode',  name: 'CO-16',              props: { description: 'Missing information' } },
    { id: 'carc-3',    type: 'CARCCode',  name: 'CO-197',             props: { description: 'Precertification not obtained' } },
    { id: 'cat-1',     type: 'Category',  name: 'Authorization',       props: {} },
    { id: 'cat-2',     type: 'Category',  name: 'Coding Errors',       props: {} },
    { id: 'cat-3',     type: 'Category',  name: 'Clinical Review',     props: {} },
    { id: 'diag-1',    type: 'Diagnosis', name: 'I25.10',             props: { description: 'Atherosclerotic heart disease' } },
    { id: 'proc-1',    type: 'Procedure', name: '99213',              props: { description: 'Office visit, established' } },
  ];

  const edges = [
    { source: 'payer-1', target: 'cat-1',  label: 'HAS_CATEGORY' },
    { source: 'payer-1', target: 'cat-2',  label: 'HAS_CATEGORY' },
    { source: 'payer-2', target: 'cat-2',  label: 'HAS_CATEGORY' },
    { source: 'payer-2', target: 'cat-3',  label: 'HAS_CATEGORY' },
    { source: 'payer-3', target: 'cat-1',  label: 'HAS_CATEGORY' },
    { source: 'payer-3', target: 'cat-3',  label: 'HAS_CATEGORY' },
    { source: 'cat-1',   target: 'rc-1',   label: 'CAUSED_BY' },
    { source: 'cat-2',   target: 'rc-2',   label: 'CAUSED_BY' },
    { source: 'cat-3',   target: 'rc-3',   label: 'CAUSED_BY' },
    { source: 'rc-1',    target: 'carc-3', label: 'MAPS_TO' },
    { source: 'rc-2',    target: 'carc-1', label: 'MAPS_TO' },
    { source: 'rc-3',    target: 'carc-2', label: 'MAPS_TO' },
    { source: 'prov-1',  target: 'payer-1', label: 'CONTRACTS_WITH' },
    { source: 'prov-1',  target: 'payer-3', label: 'CONTRACTS_WITH' },
    { source: 'prov-2',  target: 'payer-2', label: 'CONTRACTS_WITH' },
    { source: 'prov-2',  target: 'payer-3', label: 'CONTRACTS_WITH' },
    { source: 'prov-1',  target: 'diag-1', label: 'DIAGNOSED' },
    { source: 'prov-2',  target: 'proc-1', label: 'PERFORMED' },
    { source: 'diag-1',  target: 'rc-3',   label: 'TRIGGERS' },
    { source: 'proc-1',  target: 'rc-2',   label: 'TRIGGERS' },
  ];

  return { nodes, edges };
}

// --- Helpers -------------------------------------------------------------

function truncate(str, max = 12) {
  return str.length > max ? str.slice(0, max - 1) + '\u2026' : str;
}

function connectedNodes(nodeId, edges, nodes) {
  const ids = new Set();
  edges.forEach(e => {
    if (e.source === nodeId) ids.add(e.target);
    if (e.target === nodeId) ids.add(e.source);
  });
  return nodes.filter(n => ids.has(n.id));
}

// --- Force simulation helpers --------------------------------------------

function initPositions(nodes) {
  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;
  return nodes.map((n, i) => ({
    ...n,
    x: cx + (Math.cos(i * 2.399) * 150) + (Math.random() - 0.5) * 60,
    y: cy + (Math.sin(i * 2.399) * 150) + (Math.random() - 0.5) * 60,
    vx: 0,
    vy: 0,
  }));
}

function stepSimulation(simNodes, edges) {
  const n = simNodes.length;
  // Reset forces
  for (let i = 0; i < n; i++) {
    simNodes[i].fx = 0;
    simNodes[i].fy = 0;
  }

  // Repulsion (Coulomb)
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      let dx = simNodes[i].x - simNodes[j].x;
      let dy = simNodes[i].y - simNodes[j].y;
      let distSq = dx * dx + dy * dy;
      if (distSq < 1) distSq = 1;
      const dist = Math.sqrt(distSq);
      const force = REPULSION / distSq;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      simNodes[i].fx += fx;
      simNodes[i].fy += fy;
      simNodes[j].fx -= fx;
      simNodes[j].fy -= fy;
    }
  }

  // Build id-to-index map
  const idxMap = {};
  for (let i = 0; i < n; i++) idxMap[simNodes[i].id] = i;

  // Spring attraction along edges
  for (const e of edges) {
    const si = idxMap[e.source];
    const ti = idxMap[e.target];
    if (si === undefined || ti === undefined) continue;
    const dx = simNodes[ti].x - simNodes[si].x;
    const dy = simNodes[ti].y - simNodes[si].y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const displacement = dist - SPRING_LEN;
    const force = SPRING_K * displacement;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;
    simNodes[si].fx += fx;
    simNodes[si].fy += fy;
    simNodes[ti].fx -= fx;
    simNodes[ti].fy -= fy;
  }

  // Center gravity
  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;
  for (let i = 0; i < n; i++) {
    simNodes[i].fx += (cx - simNodes[i].x) * CENTER_GRAVITY;
    simNodes[i].fy += (cy - simNodes[i].y) * CENTER_GRAVITY;
  }

  // Integrate
  for (let i = 0; i < n; i++) {
    simNodes[i].vx = (simNodes[i].vx + simNodes[i].fx * DT) * DAMPING;
    simNodes[i].vy = (simNodes[i].vy + simNodes[i].fy * DT) * DAMPING;
    simNodes[i].x += simNodes[i].vx * DT;
    simNodes[i].y += simNodes[i].vy * DT;
    // Clamp to canvas
    simNodes[i].x = Math.max(NODE_RADIUS, Math.min(CANVAS_W - NODE_RADIUS, simNodes[i].x));
    simNodes[i].y = Math.max(NODE_RADIUS, Math.min(CANVAS_H - NODE_RADIUS, simNodes[i].y));
  }
}

// --- Component -----------------------------------------------------------

function GraphExplorer() {
  const [allNodes, setAllNodes] = useState([]);
  const [allEdges, setAllEdges] = useState([]);
  const [simNodes, setSimNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [filters, setFilters] = useState(() =>
    Object.fromEntries(Object.keys(NODE_TYPE_CONFIG).map(k => [k, true]))
  );
  const [loading, setLoading] = useState(true);

  const svgRef = useRef(null);
  const rafRef = useRef(null);
  const simRef = useRef([]);
  const edgesRef = useRef([]);
  const tickRef = useRef(0);

  // Fetch data
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.graph.explore({ level: 'overview' });
        if (!cancelled && data && data.nodes && data.nodes.length > 0) {
          setAllNodes(data.nodes);
          setAllEdges(data.edges || []);
          setLoading(false);
          return;
        }
      } catch { /* fall through to demo */ }

      if (!cancelled) {
        const demo = buildDemoGraph();
        setAllNodes(demo.nodes);
        setAllEdges(demo.edges);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Filter and init simulation whenever data or filters change
  useEffect(() => {
    const visibleTypes = new Set(Object.entries(filters).filter(([, v]) => v).map(([k]) => k));
    const visible = allNodes.filter(n => visibleTypes.has(n.type));
    const visibleIds = new Set(visible.map(n => n.id));
    const visEdges = allEdges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target));

    const positioned = initPositions(visible);
    simRef.current = positioned;
    edgesRef.current = visEdges;
    tickRef.current = 0;
    setSimNodes([...positioned]);
    setSelectedNode(prev => prev && visibleIds.has(prev.id) ? prev : null);
  }, [allNodes, allEdges, filters]);

  // Animation loop
  useEffect(() => {
    let running = true;
    function tick() {
      if (!running) return;
      if (simRef.current.length > 0 && tickRef.current < 300) {
        stepSimulation(simRef.current, edgesRef.current);
        tickRef.current++;
        setSimNodes([...simRef.current]);
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [simNodes.length]); // restart animation when node set changes

  const handleNodeClick = useCallback(async (node) => {
    setSelectedNode(node);

    // Drill-down: fetch deeper data and merge into existing graph
    let drillData = null;
    try {
      if (node.type === 'Payer') {
        drillData = await api.graph.explore({ level: 'payer', payer_id: node.id });
      } else if (node.type === 'Category') {
        // Find the payer this category connects to
        const parentEdge = allEdges.find(e => e.target === node.id);
        const payerId = parentEdge ? parentEdge.source : null;
        if (payerId) {
          drillData = await api.graph.explore({ level: 'category', payer_id: payerId, category: node.name });
        }
      } else if (node.type === 'RootCause') {
        // Find payer via edges: Category -> RootCause, Payer -> Category
        const catEdge = allEdges.find(e => e.target === node.id && e.label === 'CAUSED_BY');
        const catId = catEdge ? catEdge.source : null;
        const payerEdge = catId ? allEdges.find(e => e.target === catId) : null;
        const payerId = payerEdge ? payerEdge.source : null;
        if (payerId) {
          drillData = await api.graph.explore({ level: 'claims', payer_id: payerId, root_cause: node.name });
        }
      }
    } catch { /* ignore drill errors */ }

    if (drillData && drillData.nodes && drillData.nodes.length > 0) {
      setAllNodes(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const newNodes = drillData.nodes.filter(n => !existingIds.has(n.id));
        return newNodes.length > 0 ? [...prev, ...newNodes] : prev;
      });
      setAllEdges(prev => {
        const existingKeys = new Set(prev.map(e => `${e.source}|${e.target}|${e.label}`));
        const newEdges = (drillData.edges || []).filter(e => !existingKeys.has(`${e.source}|${e.target}|${e.label}`));
        return newEdges.length > 0 ? [...prev, ...newEdges] : prev;
      });
    }
  }, [allEdges]);

  const toggleFilter = useCallback((type) => {
    setFilters(prev => ({ ...prev, [type]: !prev[type] }));
  }, []);

  // Count by type
  const typeCounts = {};
  allNodes.forEach(n => { typeCounts[n.type] = (typeCounts[n.type] || 0) + 1; });

  const visibleNodeCount = simNodes.length;
  const visibleEdgeCount = edgesRef.current.length;
  const connected = selectedNode ? connectedNodes(selectedNode.id, allEdges, allNodes) : [];

  // Build id-to-position map for edges
  const posMap = {};
  simNodes.forEach(n => { posMap[n.id] = { x: n.x, y: n.y }; });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full text-th-muted">
        <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto font-sans h-full">
      <div className="p-6 max-w-[1600px] mx-auto w-full">

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-th-heading tracking-tight">Neo4j Graph Explorer</h1>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
            </span>
            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Interactive
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-th-muted">
            <span className="tabular-nums font-bold">{visibleNodeCount} nodes</span>
            <span className="text-th-border">|</span>
            <span className="tabular-nums font-bold">{visibleEdgeCount} edges</span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-th-surface-raised border border-th-border rounded-xl p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-th-muted">Filter by Type:</span>
            {Object.entries(NODE_TYPE_CONFIG).map(([type, cfg]) => {
              const count = typeCounts[type] || 0;
              const active = filters[type];
              return (
                <label
                  key={type}
                  className={`flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-lg border transition-all duration-150 text-xs font-semibold ${
                    active
                      ? 'border-white/20 bg-white/5 text-th-heading'
                      : 'border-th-border bg-transparent text-th-muted opacity-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleFilter(type)}
                    className="sr-only"
                  />
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: cfg.color }}
                  />
                  {cfg.label}
                  <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10 tabular-nums">{count}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Main area: Graph + Detail panel */}
        <div className="flex gap-6">

          {/* SVG Graph Canvas */}
          <div className="flex-1 bg-th-surface border border-th-border rounded-xl overflow-hidden">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
              className="w-full h-auto"
              style={{ minHeight: 500 }}
            >
              {/* Edges */}
              {edgesRef.current.map((e, i) => {
                const s = posMap[e.source];
                const t = posMap[e.target];
                if (!s || !t) return null;
                return (
                  <line
                    key={`e-${i}`}
                    x1={s.x} y1={s.y}
                    x2={t.x} y2={t.y}
                    stroke="#475569"
                    strokeWidth={1.5}
                    strokeOpacity={0.6}
                  />
                );
              })}

              {/* Edge labels */}
              {edgesRef.current.map((e, i) => {
                const s = posMap[e.source];
                const t = posMap[e.target];
                if (!s || !t) return null;
                const mx = (s.x + t.x) / 2;
                const my = (s.y + t.y) / 2;
                return (
                  <text
                    key={`el-${i}`}
                    x={mx} y={my - 4}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize={7}
                    fontWeight={600}
                  >
                    {e.label}
                  </text>
                );
              })}

              {/* Nodes */}
              {simNodes.map(node => {
                const cfg = NODE_TYPE_CONFIG[node.type] || { color: '#6b7280' };
                const isSelected = selectedNode?.id === node.id;
                return (
                  <g
                    key={node.id}
                    onClick={() => handleNodeClick(node)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Glow for selected */}
                    {isSelected && (
                      <circle
                        cx={node.x} cy={node.y}
                        r={NODE_RADIUS + 6}
                        fill="none"
                        stroke={cfg.color}
                        strokeWidth={2}
                        strokeOpacity={0.5}
                      />
                    )}
                    <circle
                      cx={node.x} cy={node.y}
                      r={NODE_RADIUS}
                      fill={cfg.color}
                      fillOpacity={isSelected ? 1 : 0.85}
                      stroke={isSelected ? '#fff' : cfg.color}
                      strokeWidth={isSelected ? 2.5 : 1}
                    />
                    <text
                      x={node.x} y={node.y + NODE_RADIUS + 12}
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize={9}
                      fontWeight={600}
                    >
                      {truncate(node.name)}
                    </text>
                    {/* Type initial inside circle */}
                    <text
                      x={node.x} y={node.y + 4}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize={11}
                      fontWeight={800}
                    >
                      {node.type[0]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Detail Panel */}
          <div className="w-[300px] shrink-0 bg-th-surface border border-th-border rounded-xl p-5 self-start">
            {selectedNode ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: (NODE_TYPE_CONFIG[selectedNode.type] || {}).color || '#6b7280' }}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                    style={{
                      borderColor: (NODE_TYPE_CONFIG[selectedNode.type] || {}).color || '#6b7280',
                      color: (NODE_TYPE_CONFIG[selectedNode.type] || {}).color || '#6b7280',
                    }}
                  >
                    {selectedNode.type}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-th-heading mb-1">{selectedNode.name}</h3>
                <p className="text-xs text-th-muted mb-4 font-mono">ID: {selectedNode.id}</p>

                {/* Properties */}
                {selectedNode.props && Object.keys(selectedNode.props).length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-th-muted mb-2">Properties</h4>
                    <div className="space-y-1.5">
                      {Object.entries(selectedNode.props).map(([key, val]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-th-secondary">{key}</span>
                          <span className="text-th-heading font-semibold">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Connected nodes */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-th-muted mb-2">
                    Connected Nodes ({connected.length})
                  </h4>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {connected.map(cn => {
                      const cnCfg = NODE_TYPE_CONFIG[cn.type] || { color: '#6b7280' };
                      return (
                        <div
                          key={cn.id}
                          className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                          onClick={() => handleNodeClick(cn)}
                        >
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cnCfg.color }} />
                          <span className="text-xs text-th-heading font-medium truncate">{cn.name}</span>
                          <span className="text-[10px] text-th-muted ml-auto">{cn.type}</span>
                        </div>
                      );
                    })}
                    {connected.length === 0 && (
                      <p className="text-xs text-th-muted italic">No connections</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-th-muted text-center gap-2">
                <span className="material-symbols-outlined text-3xl">touch_app</span>
                <p className="text-sm font-medium">Click a node to inspect</p>
                <p className="text-xs">View type, properties, and connections</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default GraphExplorer;
