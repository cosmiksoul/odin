import { useMemo, useState, useRef, useEffect } from 'react';
import { cx, sparkPath, fakeValue, fakeDelta, sevBadge } from './lib/util.js';

// Deterministic force-layout-ish positioning:
// - Columns by level (L1 left, L2 middle, L3 right)
// - Rows within a column: hash-based, with category cluster bias
// - Edges: deps[] pointing from source -> target (drawn as curved lines)

function GraphView({ metrics, onOpen }) {
  const [hover, setHover] = useState(null);
  const [pinned, setPinned] = useState(new Set()); // set of metric names
  const [selLevel, setSelLevel] = useState(new Set(["L1","L2","L3"]));
  const [selCat, setSelCat] = useState(null);
  const [selOwner, setSelOwner] = useState(null);
  const [selPrio, setSelPrio] = useState(new Set(["Must","Should","Nice"]));
  const [selAlert, setSelAlert] = useState("all"); // all | red | yel | alerts | ok
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => { if (e.key === "Escape") setDrawerOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);
  const dragRef = useRef(null);

  const W = 1400;
  const H = 900;

  // Index categories for cluster rows
  const cats = useMemo(() => {
    const s = new Set(metrics.map(m => m.cat));
    return Array.from(s);
  }, [metrics]);

  const owners = useMemo(() => [...new Set(metrics.map(m => m.owner))].sort(), [metrics]);

  // Nodes with positions
  const nodes = useMemo(() => {
    const byLevel = { L1: [], L2: [], L3: [] };
    metrics.forEach(m => { if (byLevel[m.level]) byLevel[m.level].push(m); });

    const cols = { L1: 220, L2: 700, L3: 1180 };
    const result = [];

    ["L1","L2","L3"].forEach(lv => {
      const arr = byLevel[lv];
      // sort by category so clusters form vertical bands
      arr.sort((a,b) => a.cat.localeCompare(b.cat) || a.name.localeCompare(b.name));
      const total = arr.length;
      arr.forEach((m, i) => {
        const t = total === 1 ? 0.5 : i / (total - 1);
        // spread vertically with slight horizontal jitter
        const hash = m.name.split("").reduce((a,c)=>a*31+c.charCodeAt(0),7);
        const jx = ((Math.abs(hash) % 60) - 30);
        const y = 80 + t * (H - 160);
        const x = cols[lv] + jx;
        result.push({ ...m, x, y });
      });
    });
    return result;
  }, [metrics]);

  // Edges from deps[]
  const edges = useMemo(() => {
    const byName = Object.fromEntries(nodes.map(n => [n.name, n]));
    const out = [];
    nodes.forEach(n => {
      (n.deps || []).forEach(dep => {
        const t = byName[dep];
        if (t) out.push({ from: n, to: t });
      });
    });
    return out;
  }, [nodes]);

  const levelColor = (lv) => lv === "L1" ? "var(--l1)" : lv === "L2" ? "var(--l2)" : "var(--l3)";

  // Filter
  const visibleNodes = nodes.filter(n => {
    if (!selLevel.has(n.level)) return false;
    if (selCat && n.cat !== selCat) return false;
    if (selOwner && n.owner !== selOwner) return false;
    if (!selPrio.has(n.prio)) return false;
    if (selAlert !== "all") {
      const s = sevBadge(n.name);
      if (selAlert === "red" && s !== "red") return false;
      if (selAlert === "yel" && s !== "yel") return false;
      if (selAlert === "alerts" && !s) return false;
      if (selAlert === "ok" && s) return false;
    }
    return true;
  });
  const visibleSet = new Set(visibleNodes.map(n => n.name));
  const visibleEdges = edges.filter(e => visibleSet.has(e.from.name) && visibleSet.has(e.to.name));

  // Pan/zoom interactions
  const onMouseDown = (e) => {
    dragRef.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
  };
  useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current) return;
      setPan({ x: dragRef.current.px + (e.clientX - dragRef.current.sx),
               y: dragRef.current.py + (e.clientY - dragRef.current.sy) });
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  const hoveredConnected = useMemo(() => {
    if (!hover) return new Set();
    const s = new Set([hover.name]);
    edges.forEach(e => {
      if (e.from.name === hover.name) s.add(e.to.name);
      if (e.to.name === hover.name) s.add(e.from.name);
    });
    return s;
  }, [hover, edges]);

  const toggleLvl = (lv) => {
    const s = new Set(selLevel);
    if (s.has(lv)) s.delete(lv); else s.add(lv);
    if (s.size === 0) s.add(lv);
    setSelLevel(s);
  };
  const togglePrio = (p) => {
    const s = new Set(selPrio);
    if (s.has(p)) s.delete(p); else s.add(p);
    if (s.size === 0) s.add(p);
    setSelPrio(s);
  };
  const resetFilters = () => {
    setSelLevel(new Set(["L1","L2","L3"]));
    setSelCat(null);
    setSelOwner(null);
    setSelPrio(new Set(["Must","Should","Nice"]));
    setSelAlert("all");
  };
  const anyFilterActive = selLevel.size !== 3 || selCat || selOwner || selPrio.size !== 3 || selAlert !== "all";

  const togglePin = (name) => {
    setPinned(prev => {
      const s = new Set(prev);
      if (s.has(name)) s.delete(name); else s.add(name);
      return s;
    });
  };
  const unpinAll = () => setPinned(new Set());

  // pinned metrics, in insertion order
  const pinnedMetrics = useMemo(() => {
    const byName = Object.fromEntries(metrics.map(m => [m.name, m]));
    return [...pinned].map(n => byName[n]).filter(Boolean);
  }, [pinned, metrics]);

  // severity counts for alert chips
  const sevCounts = useMemo(() => {
    let red = 0, yel = 0, ok = 0;
    metrics.forEach(m => {
      const s = sevBadge(m.name);
      if (s === "red") red++;
      else if (s === "yel") yel++;
      else ok++;
    });
    return { red, yel, ok };
  }, [metrics]);

  return (
    <div className="odin">
      <div
        className={cx("fdrw-scrim", drawerOpen && "fdrw-scrim--on")}
        onClick={() => setDrawerOpen(false)}
        aria-hidden={!drawerOpen}
      />
      <aside className={cx("odin__sidebar", "fdrw", drawerOpen && "fdrw--on")} aria-hidden={!drawerOpen}>
        <div className="fdrw__hdr">
          <div className="fdrw__hdr-l mono">
            <span className="fdrw__hdr-lbl">FILTERS</span>
            {anyFilterActive && <span className="fdrw__hdr-n">·</span>}
          </div>
          {anyFilterActive &&
            <button className="fdrw__reset mono" onClick={resetFilters}>reset</button>}
          <button className="fdrw__close" onClick={() => setDrawerOpen(false)} title="Close (Esc)">×</button>
        </div>
        <div className="fdrw__body">

        <div className="odin__section">
          <div className="odin__lbl mono">LEVEL</div>
          <div className="odin__chips">
            {["L1","L2","L3"].map(lv => (
              <button key={lv}
                className={cx("gchip", `gchip--${lv.toLowerCase()}`, selLevel.has(lv) && "gchip--on")}
                onClick={()=>toggleLvl(lv)}>
                <span className="gchip__dot" style={{background: levelColor(lv)}}/>
                {lv} <span className="gchip__n mono">{nodes.filter(n=>n.level===lv).length}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="odin__section">
          <div className="odin__lbl mono">ALERTS</div>
          <div className="odin__chips">
            <button className={cx("gchip", selAlert === "all" && "gchip--on")} onClick={()=>setSelAlert("all")}>
              All <span className="gchip__n mono">{nodes.length}</span>
            </button>
            <button className={cx("gchip", selAlert === "red" && "gchip--on")} onClick={()=>setSelAlert("red")}>
              <span className="gchip__dot" style={{background:"var(--red)"}}/>
              Red <span className="gchip__n mono">{sevCounts.red}</span>
            </button>
            <button className={cx("gchip", selAlert === "yel" && "gchip--on")} onClick={()=>setSelAlert("yel")}>
              <span className="gchip__dot" style={{background:"var(--yellow)"}}/>
              Yel <span className="gchip__n mono">{sevCounts.yel}</span>
            </button>
            <button className={cx("gchip", selAlert === "ok" && "gchip--on")} onClick={()=>setSelAlert("ok")}>
              <span className="gchip__dot" style={{background:"var(--up)"}}/>
              OK <span className="gchip__n mono">{sevCounts.ok}</span>
            </button>
          </div>
        </div>

        <div className="odin__section">
          <div className="odin__lbl mono">PRIORITY</div>
          <div className="odin__chips">
            {["Must","Should","Nice"].map(p =>
              <button key={p}
                className={cx("gchip", selPrio.has(p) && "gchip--on")}
                onClick={()=>togglePrio(p)}>
                {p} <span className="gchip__n mono">{nodes.filter(n=>n.prio===p).length}</span>
              </button>)}
          </div>
        </div>

        <div className="odin__section">
          <div className="odin__lbl mono">OWNER</div>
          <div className="odin__cats odin__cats--scroll">
            <button className={cx("gcat", !selOwner && "gcat--on")} onClick={()=>setSelOwner(null)}>
              All <span className="mono dim">{nodes.length}</span>
            </button>
            {owners.map(o => {
              const n = nodes.filter(x=>x.owner===o).length;
              return (
                <button key={o} className={cx("gcat", selOwner===o && "gcat--on")} onClick={()=>setSelOwner(selOwner===o ? null : o)}>
                  {o} <span className="mono dim">{n}</span>
                </button>);
            })}
          </div>
        </div>

        <div className="odin__section">
          <div className="odin__lbl mono">CATEGORY</div>
          <div className="odin__cats odin__cats--scroll">
            <button className={cx("gcat", !selCat && "gcat--on")} onClick={()=>setSelCat(null)}>
              All <span className="mono dim">{nodes.length}</span>
            </button>
            {cats.map(c => {
              const n = nodes.filter(x=>x.cat===c).length;
              return (
                <button key={c} className={cx("gcat", selCat===c && "gcat--on")} onClick={()=>setSelCat(selCat===c ? null : c)}>
                  {c} <span className="mono dim">{n}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="odin__section">
          <div className="odin__lbl mono">STATS</div>
          <div className="odin__stats mono">
            <div><span className="dim">nodes</span> {visibleNodes.length} / {nodes.length}</div>
            <div><span className="dim">edges</span> {visibleEdges.length}</div>
            <div><span className="dim">orphans</span> {visibleNodes.filter(n=>!edges.some(e=>e.from.name===n.name||e.to.name===n.name)).length}</div>
          </div>
        </div>

        <div className="odin__section odin__section--hint">
          <div className="odin__hint mono dim">drag to pan · scroll to zoom · click node to pin · click card to open</div>
        </div>
        </div>
      </aside>

      <div className="odin__canvas"
           onMouseDown={onMouseDown}
           onWheel={(e)=>{
             e.preventDefault();
             const d = e.deltaY > 0 ? 0.92 : 1.08;
             setZoom(z => Math.max(0.4, Math.min(2.2, z * d)));
           }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
            {/* column rules */}
            {[{x:220, lbl:"L1 STRATEGY"},{x:700,lbl:"L2 PRODUCT"},{x:1180,lbl:"L3 OPERATIONAL"}].map(c=>(
              <g key={c.x} opacity="0.35">
                <line x1={c.x} y1={20} x2={c.x} y2={H-20} stroke="var(--line-2)" strokeDasharray="2 4"/>
                <text x={c.x} y={16} fill="var(--fg-4)" fontSize="10" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.08em" textAnchor="middle">{c.lbl}</text>
              </g>
            ))}
            {/* edges */}
            {visibleEdges.map((e, i) => {
              const x1 = e.from.x, y1 = e.from.y, x2 = e.to.x, y2 = e.to.y;
              const mx = (x1 + x2) / 2;
              const path = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
              const isHov = hover && (e.from.name === hover.name || e.to.name === hover.name);
              return (
                <path key={i} d={path}
                      fill="none"
                      stroke={isHov ? "var(--accent)" : "var(--line-3)"}
                      strokeOpacity={hover ? (isHov ? 0.9 : 0.1) : 0.35}
                      strokeWidth={isHov ? 1.5 : 1}/>
              );
            })}
            {/* nodes */}
            {visibleNodes.map(n => {
              const s = sevBadge(n.name);
              const isHov = hover?.name === n.name;
              const isConn = hover && hoveredConnected.has(n.name);
              const dim = hover && !isHov && !isConn;
              const r = n.level === "L1" ? 14 : n.level === "L2" ? 10 : 7;
              const isPinned = pinned.has(n.name);
              return (
                <g key={n.name}
                   transform={`translate(${n.x} ${n.y})`}
                   style={{cursor: "pointer", opacity: dim ? 0.25 : 1, transition: "opacity 120ms"}}
                   onMouseEnter={()=>setHover(n)}
                   onMouseLeave={()=>setHover(null)}
                   onClick={(e)=>{ e.stopPropagation(); togglePin(n.name); }}>
                  <circle r={r+4} fill="var(--bg)" opacity="0.8"/>
                  <circle r={r} fill={levelColor(n.level)} opacity={isHov ? 1 : 0.85}/>
                  {isPinned && <circle r={r+3} fill="none" stroke="var(--accent)" strokeWidth="1.5"/>}
                  {s && <circle r={3} cx={r-2} cy={-r+2} fill={s === "red" ? "var(--danger)" : "var(--warn)"}/>}
                  {(isHov || isPinned || n.level === "L1") && (
                    <g>
                      <rect x={r+6} y={-10} width={n.name.length*6.5 + 12} height={20} fill="var(--bg-2)" stroke={isPinned ? "var(--accent)" : "var(--line-2)"} rx="2"/>
                      <text x={r+12} y={4} fill="var(--fg)" fontSize="11" fontFamily="'JetBrains Mono', monospace">{n.name}</text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Filters hamburger */}
        <button
          className="fbtn fbtn--float mono"
          onClick={() => setDrawerOpen(true)}
          title="Open filters"
        >
          <span className="fbtn__icon">☰</span>
          <span className="fbtn__lbl">FILTERS</span>
          {anyFilterActive && <span className="fbtn__n">{
            selLevel.size + (selCat?1:0) + (selOwner?1:0) + selPrio.size + (selAlert!=="all"?1:0)
          }</span>}
        </button>

        {/* Zoom controls */}
        <div className="odin__zoom mono">
          <button onClick={()=>setZoom(z => Math.min(2.2, z*1.15))}>+</button>
          <button onClick={()=>setZoom(1)}>{Math.round(zoom*100)}%</button>
          <button onClick={()=>setZoom(z => Math.max(0.4, z*0.87))}>−</button>
          <button onClick={()=>{setPan({x:0,y:0}); setZoom(1);}}>reset</button>
        </div>

        {hover && !pinned.has(hover.name) && (
          <div className="odin__tooltip mono">
            <div className="odin__tt-lvl" style={{color: levelColor(hover.level)}}>{hover.level} · {hover.cat}</div>
            <div className="odin__tt-name">{hover.name}</div>
            <div className="odin__tt-deps dim">
              {edges.filter(e=>e.from.name===hover.name).length} out ·{' '}
              {edges.filter(e=>e.to.name===hover.name).length} in
            </div>
            <div className="odin__tt-hint dim">click to pin</div>
          </div>
        )}

        {pinnedMetrics.length > 0 && (
          <div className="odin__pinned">
            <div className="odin__pinned-hdr mono">
              <span className="odin__pinned-lbl">PINNED</span>
              <span className="odin__pinned-n">{pinnedMetrics.length}</span>
              <button className="odin__pinned-clear" onClick={unpinAll} title="Unpin all">clear</button>
            </div>
            <div className="odin__pinned-list">
              {pinnedMetrics.map(m => (
                <PinnedCard
                  key={m.name}
                  m={m}
                  onOpen={onOpen}
                  onUnpin={(name) => setPinned(prev => { const s = new Set(prev); s.delete(name); return s; })}
                  onHover={(name) => {
                    const node = nodes.find(n => n.name === name);
                    if (node) setHover(node);
                  }}
                  onUnhover={() => setHover(null)}
                  isHovered={hover?.name === m.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PinnedCard({ m, onOpen, onUnpin, onHover, onUnhover, isHovered }) {
  const val = fakeValue(m);
  const delta = fakeDelta(m.name);
  const sev = sevBadge(m.name);
  const isDown = delta < 0;
  const spark = sparkPath(m.name + "_pin", 56, 18);
  const lvlCls = m.level === "L1" ? "l1" : m.level === "L2" ? "l2" : "l3";
  return (
    <div
      className={cx("pinc", isHovered && "pinc--hover", sev && `pinc--${sev}`)}
      onClick={() => onOpen(m)}
      onMouseEnter={() => onHover(m.name)}
      onMouseLeave={() => onUnhover()}
      role="button"
      tabIndex={0}
    >
      <div className="pinc__row1">
        <span className={cx("pinc__lvl mono", `pinc__lvl--${lvlCls}`)}>{m.level}</span>
        <span className="pinc__name">{m.name}</span>
        {sev && <span className={cx("pinc__sev", `pinc__sev--${sev}`)} />}
        <button
          className="pinc__close mono"
          onClick={(e) => { e.stopPropagation(); onUnpin(m.name); }}
          title="Unpin"
        >×</button>
      </div>
      <div className="pinc__row2 mono">
        <span className="pinc__meta">{m.cat}</span>
        <span className="pinc__sep">·</span>
        <span className="pinc__meta">{m.prio}</span>
        <span className="pinc__sep">·</span>
        <span className="pinc__meta">{m.freq}</span>
        <span className="pinc__sep">·</span>
        <span className="pinc__meta pinc__meta--owner">{m.owner}</span>
      </div>
      <div className="pinc__row3">
        <span className="pinc__val mono">{val}</span>
        <span className={cx("pinc__delta mono", isDown ? "down" : "up")}>
          {isDown ? "▼" : "▲"}{Math.abs(delta).toFixed(1)}%
        </span>
        <svg className="pinc__spark" viewBox="0 0 56 18" preserveAspectRatio="none">
          <path d={spark} fill="none" stroke={isDown ? "var(--down)" : "var(--up)"} strokeWidth="1.2" />
        </svg>
        <span className="pinc__open mono">open →</span>
      </div>
    </div>
  );
}
export { GraphView, PinnedCard };
