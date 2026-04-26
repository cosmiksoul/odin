import { useMemo, useState, useRef, useEffect } from 'react';
import { cx, fakeValue, fakeDelta, sevBadge } from './lib/util.js';
import { ControlBar } from './components/ControlBar.jsx';
import { PinnedMetricCard } from './components/PinnedMetricCard.jsx';

// Default first-run state: L1 expanded, L2/L3 collapsed.
// Existing localStorage values are honored — only fallback when missing.
const DEFAULT_COLL = { L1: false, L2: true, L3: true };
const NODE_GAP = 18;        // viewBox-units between vertically stacked nodes
const PAD_TOP = 96;         // viewBox-units from top to first node
const PAD_BOTTOM = 60;      // viewBox-units below last node
const W = 1400;
const LABEL_HIDE_ZOOM = 0.7; // below this, node labels auto-hide (FIX-3)

const COLS = [
  { lv: "L1", x: 220, title: "СТРАТЕГИЧЕСКИЕ" },
  { lv: "L2", x: 700, title: "ОПЕРАЦИОННЫЕ" },
  { lv: "L3", x: 1180, title: "ДИАГНОСТИЧЕСКИЕ" },
];

function GraphView({ metrics, filtered, onOpen, onOpenFilters, activeFilters, onClear }) {
  const [hover, setHover] = useState(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pinned, setPinned] = useState(new Set());
  const [coll, setColl] = useState(() => {
    const out = {};
    for (const lv of ["L1", "L2", "L3"]) {
      try {
        const raw = localStorage.getItem(`odin.graph.section.${lv.toLowerCase()}.collapsed`);
        out[lv] = raw === null ? DEFAULT_COLL[lv] : raw === "1";
      } catch { out[lv] = DEFAULT_COLL[lv]; }
    }
    return out;
  });
  const toggleColl = (lv) => {
    setColl((prev) => {
      const next = { ...prev, [lv]: !prev[lv] };
      try { localStorage.setItem(`odin.graph.section.${lv.toLowerCase()}.collapsed`, next[lv] ? "1" : "0"); } catch {}
      return next;
    });
  };
  const togglePin = (m) => {
    setPinned((prev) => {
      const next = new Set(prev);
      next.has(m.name) ? next.delete(m.name) : next.add(m.name);
      return next;
    });
  };
  const unpinAll = () => setPinned(new Set());
  const dragRef = useRef(null);
  const canvasRef = useRef(null);
  const transformGroupRef = useRef(null);

  // Total per-level counts (always over `filtered`, even if level is collapsed).
  const counts = useMemo(() => {
    const out = { L1: 0, L2: 0, L3: 0 };
    filtered.forEach((m) => { if (out[m.level] != null) out[m.level]++; });
    return out;
  }, [filtered]);

  // Dynamic graph height — scales so vertical density of densest column stays
  // readable instead of crushing 126 L2 nodes into 740 viewBox-units.
  const H = useMemo(() => {
    const maxCount = Math.max(counts.L1, counts.L2, counts.L3, 1);
    return Math.max(900, PAD_TOP + PAD_BOTTOM + (maxCount - 1) * NODE_GAP);
  }, [counts]);

  // Nodes from already-filtered metrics, positioned by level.
  const nodes = useMemo(() => {
    const byLevel = { L1: [], L2: [], L3: [] };
    filtered.forEach((m) => { if (byLevel[m.level]) byLevel[m.level].push(m); });
    const colsByLv = Object.fromEntries(COLS.map((c) => [c.lv, c.x]));
    const result = [];
    ["L1", "L2", "L3"].forEach((lv) => {
      const arr = byLevel[lv];
      arr.sort((a, b) => a.cat.localeCompare(b.cat) || a.name.localeCompare(b.name));
      const n = arr.length;
      arr.forEach((m, i) => {
        const t = n <= 1 ? 0.5 : i / (n - 1);
        const hash = m.name.split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 7);
        const jx = ((Math.abs(hash) % 60) - 30);
        const y = PAD_TOP + t * (H - PAD_TOP - PAD_BOTTOM);
        const x = colsByLv[lv] + jx;
        result.push({ ...m, x, y });
      });
    });
    return result;
  }, [filtered, H]);

  const visibleNodes = useMemo(() => nodes.filter((n) => !coll[n.level]), [nodes, coll]);

  const edges = useMemo(() => {
    const byName = Object.fromEntries(visibleNodes.map((n) => [n.name, n]));
    const out = [];
    visibleNodes.forEach((n) => {
      (n.deps || []).forEach((dep) => {
        const t = byName[dep];
        if (t) out.push({ from: n, to: t });
      });
    });
    return out;
  }, [visibleNodes]);

  const levelStroke = (lv) => `var(--${lv === "L1" ? "l1" : lv === "L2" ? "l2" : "l3"})`;

  const onMouseDown = (e) => {
    dragRef.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
  };
  useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current) return;
      setPan({
        x: dragRef.current.px + (e.clientX - dragRef.current.sx),
        y: dragRef.current.py + (e.clientY - dragRef.current.sy),
      });
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const hoveredConnected = useMemo(() => {
    if (!hover) return new Set();
    const s = new Set([hover.name]);
    edges.forEach((e) => {
      if (e.from.name === hover.name) s.add(e.to.name);
      if (e.to.name === hover.name) s.add(e.from.name);
    });
    return s;
  }, [hover, edges]);

  // FIX-A: pinned highlights persist after the cursor leaves. Built the same
  // way as hoveredConnected — pinned nodes themselves + everything one edge away.
  // Visual style mirrors hover (same accent color); union of both sets defines
  // "in focus" for dim/non-dim and edge highlighting.
  const pinnedConnected = useMemo(() => {
    if (pinned.size === 0) return new Set();
    const s = new Set(pinned);
    edges.forEach((e) => {
      if (pinned.has(e.from.name)) s.add(e.to.name);
      if (pinned.has(e.to.name)) s.add(e.from.name);
    });
    return s;
  }, [pinned, edges]);

  const anyFocus = hover != null || pinned.size > 0;

  const pinnedMetrics = useMemo(() => {
    const byName = Object.fromEntries(metrics.map((m) => [m.name, m]));
    return [...pinned].map((n) => byName[n]).filter(Boolean);
  }, [pinned, metrics]);

  const labelsVisible = zoom >= LABEL_HIDE_ZOOM; // FIX-3

  return (
    <div className="odin">
      <ControlBar
        filtered={filtered}
        total={metrics.length}
        activeFilters={activeFilters}
        onOpenFilters={onOpenFilters}
        onClear={onClear}>
        <div className="cbar__zoom mono">
          <button onClick={() => setZoom((z) => Math.max(0.4, z * 0.87))} title="Zoom out">−</button>
          <button onClick={() => setZoom(1)} title="Reset zoom">{Math.round(zoom * 100)}%</button>
          <button onClick={() => setZoom((z) => Math.min(2.2, z * 1.15))} title="Zoom in">+</button>
          <button onClick={() => { setPan({ x: 0, y: 0 }); setZoom(1); }} title="Fit to screen">fit</button>
        </div>
      </ControlBar>

      <div className="odin__main">
        <div
          ref={canvasRef}
          className="odin__canvas"
          onMouseDown={onMouseDown}
          onWheel={(e) => {
            e.preventDefault();
            const d = e.deltaY > 0 ? 0.92 : 1.08;
            setZoom((z) => Math.max(0.4, Math.min(2.2, z * d)));
          }}>
          {/* Column headers — fixed HTML overlay, NOT inside SVG transform.
              Per FIX-2: zoom must not scale UI; per FIX-6: subtitles removed. */}
          <div className="odin__col-headers">
            {COLS.map((c) => {
              const collapsed = coll[c.lv];
              return (
                <button
                  key={c.lv}
                  className={cx("odin__col-header mono", collapsed && "odin__col-header--coll")}
                  onClick={() => toggleColl(c.lv)}>
                  <span className="odin__col-header__chev">{collapsed ? "▸" : "▾"}</span>
                  <span className="odin__col-header__lbl">{c.lv}: {c.title}</span>
                  <span className="odin__col-header__n">{counts[c.lv]}</span>
                </button>
              );
            })}
          </div>

          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
            <g ref={transformGroupRef} transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
              {/* column rules — these scale with content, since they belong to the canvas drawing */}
              {COLS.map((c) => (
                <line
                  key={c.lv}
                  x1={c.x} y1={PAD_TOP - 16} x2={c.x} y2={H - 20}
                  stroke="var(--line-2)" strokeDasharray="2 4"
                  opacity={coll[c.lv] ? 0.12 : 0.4} />
              ))}

              {edges.map((e, i) => {
                const x1 = e.from.x, y1 = e.from.y, x2 = e.to.x, y2 = e.to.y;
                const mx = (x1 + x2) / 2;
                const path = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
                const touchesHover = hover && (e.from.name === hover.name || e.to.name === hover.name);
                const touchesPinned = pinned.has(e.from.name) || pinned.has(e.to.name);
                const isFocused = touchesHover || touchesPinned;
                return (
                  <path key={i} d={path}
                    fill="none"
                    stroke={isFocused ? "var(--accent)" : "var(--line-3)"}
                    strokeOpacity={anyFocus ? (isFocused ? 0.9 : 0.1) : 0.35}
                    strokeWidth={isFocused ? 1.5 : 1} />
                );
              })}

              {visibleNodes.map((n) => {
                const s = sevBadge(n.name);
                const isHov = hover?.name === n.name;
                const isPinned = pinned.has(n.name);
                const isConn = hoveredConnected.has(n.name) || pinnedConnected.has(n.name);
                const isFocused = isHov || isPinned || isConn;
                const dim = anyFocus && !isFocused;
                const r = n.level === "L1" ? 14 : n.level === "L2" ? 10 : 7;
                const labelFontSize = n.level === "L1" ? 11 : n.level === "L2" ? 10 : 9;
                const labelW = n.name.length * (labelFontSize * 0.58) + 12;
                return (
                  <g
                    key={n.name}
                    transform={`translate(${n.x} ${n.y})`}
                    style={{ cursor: "pointer", opacity: dim ? 0.25 : 1, transition: "opacity 120ms" }}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(null)}
                    onClick={(e) => { e.stopPropagation(); togglePin(n); }}
                    onDoubleClick={(e) => { e.stopPropagation(); onOpen(n); }}>
                    <circle r={r + 4} fill="var(--bg)" opacity="0.8" />
                    <circle r={r} fill={levelStroke(n.level)} opacity={isHov ? 1 : 0.85} />
                    {isPinned && <circle r={r + 3} fill="none" stroke="var(--accent)" strokeWidth="1.5" />}
                    {s && <circle r={3} cx={r - 2} cy={-r + 2} fill={s === "red" ? "var(--danger)" : "var(--warn)"} />}
                    {labelsVisible && (
                      <g>
                        <rect x={r + 6} y={-(labelFontSize / 2 + 4)} width={labelW} height={labelFontSize + 8} fill="var(--bg-2)" stroke={isHov ? "var(--accent)" : isPinned ? "var(--accent)" : "var(--line-2)"} rx="2" />
                        <text x={r + 12} y={labelFontSize / 3} fill="var(--fg)" fontSize={labelFontSize} fontFamily="'JetBrains Mono', monospace">{n.name}</text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {hover && (() => {
            const s = sevBadge(hover.name);
            const statusLabel = s === "red" ? "RED" : s === "yel" ? "YEL" : "OK";
            const statusColor = s === "red" ? "var(--red)" : s === "yel" ? "var(--yellow)" : "var(--up)";
            const val = fakeValue(hover);
            const wow = fakeDelta(hover.name, "wow");
            // FIX-B: anchor tooltip near hovered node. Project SVG-coord (n.x,n.y)
            // to screen via getScreenCTM(), then subtract canvas rect for canvas-
            // relative coords. Auto-flip when overflowing right/bottom edges.
            // Approximate tooltip box ~260x110 — empirically sufficient for the
            // 4-row layout; if it grows, tweak constants here.
            const ctm = transformGroupRef.current?.getScreenCTM();
            const canvasRect = canvasRef.current?.getBoundingClientRect();
            let posStyle = { left: 16, top: 16 };
            if (ctm && canvasRect) {
              const pt = new DOMPoint(hover.x, hover.y).matrixTransform(ctm);
              const px = pt.x - canvasRect.left;
              const py = pt.y - canvasRect.top;
              const TT_W = 260, TT_H = 110, OFF = 18;
              let left = px + OFF;
              let top = py + OFF;
              if (left + TT_W > canvasRect.width - 8) left = px - TT_W - OFF;
              if (top + TT_H > canvasRect.height - 8) top = py - TT_H - OFF;
              if (left < 8) left = 8;
              if (top < 8) top = 8;
              posStyle = { left, top };
            }
            return (
              <div className="odin__tooltip mono" style={posStyle}>
                <div className="odin__tt-row">
                  <span className="odin__tt-status" style={{ background: statusColor, color: "#000" }}>{statusLabel}</span>
                  <span className="odin__tt-val">{val}</span>
                  <span className={cx("odin__tt-delta", wow >= 0 ? "up" : "down")}>
                    {wow >= 0 ? "▲" : "▼"} {Math.abs(wow).toFixed(2)}%
                  </span>
                </div>
                <div className="odin__tt-name">{hover.name}</div>
                <div className="odin__tt-meta dim">{hover.level} · {hover.cat}</div>
                <div className="odin__tt-hint dim">click to pin · double-click to open</div>
              </div>);
          })()}
        </div>

        {pinnedMetrics.length > 0 &&
          <aside className="odin__sidepanel">
            <div className="odin__sidepanel-hdr mono">
              <span className="odin__sidepanel-lbl">PINNED</span>
              <span className="odin__sidepanel-n">{pinnedMetrics.length}</span>
              <button className="odin__sidepanel-clear" onClick={unpinAll} title="Unpin all">clear</button>
            </div>
            <div className="odin__sidepanel-list">
              {pinnedMetrics.map((m) => (
                <PinnedMetricCard
                  key={m.name}
                  m={m}
                  onOpen={onOpen}
                  onUnpin={(name) => setPinned((prev) => { const s = new Set(prev); s.delete(name); return s; })}
                  onHover={(name) => {
                    const node = nodes.find((n) => n.name === name);
                    if (node) setHover(node);
                  }}
                  onUnhover={() => setHover(null)}
                  isHovered={hover?.name === m.name} />
              ))}
            </div>
          </aside>
        }
      </div>
    </div>);
}

export { GraphView };
