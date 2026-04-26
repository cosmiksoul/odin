import { useMemo, useState, useRef, useEffect } from 'react';
import { cx, fakeValue, fakeDelta, sevBadge } from './lib/util.js';
import { ControlBar } from './components/ControlBar.jsx';

// Deterministic dependency graph view.
// - Filter state lives in App; we receive `filtered` (already-filtered metrics).
// - L1/L2/L3 columns are collapsible per-level (state persisted in localStorage).
// - Nodes always render their own label (size scales with level).
// - Tooltip shows status badge + current value + WoW delta.
// - Click a node → onOpen(metric) (App opens the universal Drawer / MetricPreview).
function GraphView({ metrics, filtered, onOpen, onOpenFilters, activeFilters, onClear }) {
  const [hover, setHover] = useState(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [coll, setColl] = useState(() => {
    const out = { L1: false, L2: false, L3: false };
    for (const lv of ["L1", "L2", "L3"]) {
      try { out[lv] = localStorage.getItem(`odin.graph.section.${lv.toLowerCase()}.collapsed`) === "1"; }
      catch {}
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
  const dragRef = useRef(null);

  const W = 1400;
  const H = 900;

  // Nodes from the (already filtered) metrics, positioned by level.
  const nodes = useMemo(() => {
    const byLevel = { L1: [], L2: [], L3: [] };
    filtered.forEach((m) => { if (byLevel[m.level]) byLevel[m.level].push(m); });
    const cols = { L1: 220, L2: 700, L3: 1180 };
    const result = [];
    ["L1", "L2", "L3"].forEach((lv) => {
      const arr = byLevel[lv];
      arr.sort((a, b) => a.cat.localeCompare(b.cat) || a.name.localeCompare(b.name));
      const total = arr.length;
      arr.forEach((m, i) => {
        const t = total <= 1 ? 0.5 : i / (total - 1);
        const hash = m.name.split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 7);
        const jx = ((Math.abs(hash) % 60) - 30);
        const y = 80 + t * (H - 160);
        const x = cols[lv] + jx;
        result.push({ ...m, x, y });
      });
    });
    return result;
  }, [filtered]);

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

  const colInfo = [
    { lv: "L1", x: 220, title: "СТРАТЕГИЧЕСКИЕ", subtitle: "C-level · daily review · падение = проблема бизнеса" },
    { lv: "L2", x: 700, title: "ОПЕРАЦИОННЫЕ", subtitle: "Product · CRM · Marketing · ищут причину изменений в L1" },
    { lv: "L3", x: 1180, title: "ДИАГНОСТИЧЕСКИЕ", subtitle: "Deep-dive под аномалию из L2" },
  ];

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

      <div
        className="odin__canvas"
        onMouseDown={onMouseDown}
        onWheel={(e) => {
          e.preventDefault();
          const d = e.deltaY > 0 ? 0.92 : 1.08;
          setZoom((z) => Math.max(0.4, Math.min(2.2, z * d)));
        }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
            {colInfo.map((c) => {
              const collapsed = coll[c.lv];
              const count = nodes.filter((n) => n.level === c.lv).length;
              return (
                <g key={c.lv} onClick={() => toggleColl(c.lv)} style={{ cursor: "pointer" }}>
                  <line x1={c.x} y1={64} x2={c.x} y2={H - 20} stroke="var(--line-2)" strokeDasharray="2 4" opacity={collapsed ? 0.12 : 0.4} />
                  <rect x={c.x - 180} y={4} width={360} height={42} rx={3} fill="var(--bg-2)" stroke="var(--line-2)" opacity={collapsed ? 0.6 : 0.85} />
                  <text x={c.x} y={22} fill="var(--fg)" fontSize="11" fontWeight="700" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.08em" textAnchor="middle">
                    {collapsed ? "▸" : "▾"}  {c.lv}: {c.title}  ({count})
                  </text>
                  <text x={c.x} y={38} fill="var(--fg-3)" fontSize="9" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.02em" textAnchor="middle">
                    {c.subtitle}
                  </text>
                </g>
              );
            })}

            {edges.map((e, i) => {
              const x1 = e.from.x, y1 = e.from.y, x2 = e.to.x, y2 = e.to.y;
              const mx = (x1 + x2) / 2;
              const path = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
              const isHov = hover && (e.from.name === hover.name || e.to.name === hover.name);
              return (
                <path key={i} d={path}
                  fill="none"
                  stroke={isHov ? "var(--accent)" : "var(--line-3)"}
                  strokeOpacity={hover ? (isHov ? 0.9 : 0.1) : 0.35}
                  strokeWidth={isHov ? 1.5 : 1} />
              );
            })}

            {visibleNodes.map((n) => {
              const s = sevBadge(n.name);
              const isHov = hover?.name === n.name;
              const isConn = hover && hoveredConnected.has(n.name);
              const dim = hover && !isHov && !isConn;
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
                  onClick={(e) => { e.stopPropagation(); onOpen(n); }}>
                  <circle r={r + 4} fill="var(--bg)" opacity="0.8" />
                  <circle r={r} fill={levelStroke(n.level)} opacity={isHov ? 1 : 0.85} />
                  {s && <circle r={3} cx={r - 2} cy={-r + 2} fill={s === "red" ? "var(--danger)" : "var(--warn)"} />}
                  <g>
                    <rect x={r + 6} y={-(labelFontSize / 2 + 4)} width={labelW} height={labelFontSize + 8} fill="var(--bg-2)" stroke={isHov ? "var(--accent)" : "var(--line-2)"} rx="2" />
                    <text x={r + 12} y={labelFontSize / 3} fill="var(--fg)" fontSize={labelFontSize} fontFamily="'JetBrains Mono', monospace">{n.name}</text>
                  </g>
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
          return (
            <div className="odin__tooltip mono">
              <div className="odin__tt-row">
                <span className="odin__tt-status" style={{ background: statusColor, color: "#000" }}>{statusLabel}</span>
                <span className="odin__tt-val">{val}</span>
                <span className={cx("odin__tt-delta", wow >= 0 ? "up" : "down")}>
                  {wow >= 0 ? "▲" : "▼"} {Math.abs(wow).toFixed(2)}%
                </span>
              </div>
              <div className="odin__tt-name">{hover.name}</div>
              <div className="odin__tt-meta dim">{hover.level} · {hover.cat}</div>
              <div className="odin__tt-hint dim">click to open</div>
            </div>);
        })()}
      </div>
    </div>);
}

export { GraphView };
