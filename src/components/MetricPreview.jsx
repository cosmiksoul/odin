// MetricPreview — full metric spec view, used by:
//   - Catalog Drawer (right-side overlay on card click)
//   - Graph pinned panel (right-side panel on node click)
// Visual + content identical in both contexts. Container differs.

import { useEffect, useMemo, useRef, useState } from 'react';
import { cx, sparkPath, fakeValue, fakeDelta, sevBadge, levelColor, prioColor } from '../lib/util.js';

function buildMetricMarkdown(m) {
  const L = [];
  L.push(`# ${m.name}`);
  L.push("");
  L.push(`**Level:** ${m.level}  \`\`  **Priority:** ${m.prio}  \`\`  **Category:** ${m.cat}`);
  L.push(`**Owner:** ${m.owner}  \`\`  **Frequency:** ${m.freq}  \`\`  **Source:** ${m.source}`);
  L.push("");
  L.push("## What it is");
  L.push(m.imp || "—");
  L.push("");
  L.push("## Formula");
  L.push("```");
  L.push(m.formula || "—");
  L.push("```");
  if (m.num || m.den) {
    L.push("");
    L.push(`- **Numerator:** ${m.num || "—"}`);
    L.push(`- **Denominator:** ${m.den || "—"}`);
  }
  if (m.ntags && m.ntags.length) {
    L.push("");
    L.push(`**Cuts:** ${m.ntags.join(", ")}`);
  }
  L.push("");
  L.push("## Benchmarks");
  L.push("| Tier | Value |");
  L.push("|---|---|");
  L.push(`| T1 | ${m.b1 || "—"} |`);
  L.push(`| T2 | ${m.b2 || "—"} |`);
  L.push(`| T3 | ${m.b3 || "—"} |`);
  L.push("");
  L.push("## Alert thresholds");
  L.push(`- 🔴 **Red:** ${m.red || "—"}`);
  L.push(`- 🟡 **Yellow:** ${m.yellow || "—"}`);
  if (m.traps && m.traps.length) {
    L.push("");
    L.push("## Common traps");
    m.traps.forEach((t) => L.push(`- ${t}`));
  }
  if (m.fix && m.fix.length) {
    L.push("");
    L.push("## How to fix / improve");
    m.fix.forEach((t) => L.push(`- ${t}`));
  }
  if (m.deps && m.deps.length) {
    L.push("");
    L.push("## Dependencies");
    m.deps.forEach((d) => L.push(`- \`${d}\``));
  }
  L.push("");
  L.push(`> Generated from Odin Metrics Catalog · ${new Date().toISOString().slice(0, 10)}`);
  return L.join("\n");
}

function Section({ n, title, children }) {
  return (
    <section className="sec">
      <div className="sec__hdr">
        <span className="sec__n mono">{n}</span>
        <h2 className="sec__t">{title}</h2>
        <div className="sec__rule" />
      </div>
      <div className="sec__body">{children}</div>
    </section>);
}

function Node({ x, y, label, lvl, onClick }) {
  const w = 150, h = 32;
  const rx = x - w / 2, ry = y - h / 2;
  return (
    <g className="graph__node" onClick={onClick} style={{ cursor: "pointer" }}>
      <rect x={rx} y={ry} width={w} height={h} rx={3} />
      <text x={rx + 10} y={y + 4} className={"graph__lvl graph__lvl--" + levelColor[lvl]}>{lvl}</text>
      <text x={rx + 34} y={y + 4}>{label.length > 22 ? label.slice(0, 22) + "…" : label}</text>
    </g>);
}

function NodeGraph({ m, inbound, outbound, onOpenDep }) {
  const W = 720, H = 220;
  const cx2 = W / 2, cy2 = H / 2;
  const place = (arr, xSide) => arr.slice(0, 5).map((d, i, a) => {
    const n = a.length;
    const y = H * 0.15 + H * 0.7 * (n === 1 ? 0.5 : i / (n - 1));
    return { d, x: xSide, y };
  });
  const ins = place(outbound, 90);
  const outs = place(inbound, W - 90);
  return (
    <svg className="graph" viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <marker id="arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" className="graph__arrow" />
        </marker>
      </defs>
      {ins.map((p, i) =>
        <g key={"in" + i}>
          <path d={`M${p.x + 70},${p.y} C${cx2 - 80},${p.y} ${cx2 - 60},${cy2} ${cx2 - 48},${cy2}`}
            className="graph__edge" markerEnd="url(#arr)" />
        </g>
      )}
      {outs.map((p, i) =>
        <g key={"out" + i}>
          <path d={`M${cx2 + 48},${cy2} C${cx2 + 60},${cy2} ${p.x - 70},${p.y} ${p.x - 16},${p.y}`}
            className="graph__edge" markerEnd="url(#arr)" />
        </g>
      )}
      {ins.map((p, i) =>
        <Node key={"n" + i} x={p.x} y={p.y} label={p.d.name} lvl={p.d.level} onClick={() => onOpenDep(p.d.name)} />
      )}
      {outs.map((p, i) =>
        <Node key={"m" + i} x={p.x} y={p.y} label={p.d.name} lvl={p.d.level} onClick={() => onOpenDep(p.d.name)} />
      )}
      <g className="graph__center">
        <rect x={cx2 - 120} y={cy2 - 24} width={240} height={48} rx={4} />
        <text x={cx2} y={cy2 + 5} textAnchor="middle">{m.name}</text>
      </g>
    </svg>);
}

function DepsBlock({ m, all, onOpenDep }) {
  const outbound = (m.deps || []).map((name) => all.find((x) => x.name === name)).filter(Boolean);
  const inbound = all.filter((x) => (x.deps || []).includes(m.name));
  return (
    <div className="deps">
      <div className="deps__chips">
        <div className="deps__col">
          <div className="deps__lbl mono">INPUTS · feeds this metric</div>
          {outbound.length === 0 ? <div className="deps__empty mono">— нет зависимостей</div> :
          <div className="chiprow">
            {outbound.map((d) =>
              <button key={d.name} className="depchip" onClick={() => onOpenDep(d.name)}>
                <span className={cx("mini", `mini--${levelColor[d.level]}`)}>{d.level}</span>
                {d.name}
              </button>
            )}
          </div>}
        </div>
        <div className="deps__col">
          <div className="deps__lbl mono">OUTPUTS · this metric feeds</div>
          {inbound.length === 0 ? <div className="deps__empty mono">— никого не кормит напрямую</div> :
          <div className="chiprow">
            {inbound.map((d) =>
              <button key={d.name} className="depchip" onClick={() => onOpenDep(d.name)}>
                <span className={cx("mini", `mini--${levelColor[d.level]}`)}>{d.level}</span>
                {d.name}
              </button>
            )}
          </div>}
        </div>
      </div>
      <div className="nodegraph">
        <div className="nodegraph__hdr mono">LOCAL DEPENDENCY GRAPH</div>
        <NodeGraph m={m} inbound={inbound} outbound={outbound} onOpenDep={onOpenDep} />
      </div>
    </div>);
}

function HistoricalChartSection({ metric }) {
  const [range, setRange] = useState("90d");
  const [cut, setCut] = useState("__all__");
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);

  const ranges = { "7d": 7, "14d": 14, "30d": 30, "90d": 90, "180d": 180, "365d": 365 };
  const days = ranges[range];
  const cuts = metric.ntags || [];

  const series = useMemo(() => {
    const mk = (key, offset) => {
      let seed = 0;
      for (let i = 0; i < key.length; i++) seed = seed * 31 + key.charCodeAt(i) | 0;
      let v = 50 + Math.abs(seed) % 40;
      const pts = [];
      const today = new Date();
      for (let i = days - 1; i >= 0; i--) {
        seed = seed * 1103515245 + 12345 & 0x7fffffff;
        const noise = (seed % 1000 / 1000 - 0.5) * 8;
        const trend = Math.sin(i / days * Math.PI * 2) * 3;
        v = Math.max(1, v + noise + trend + offset);
        const d = new Date(today); d.setDate(today.getDate() - i);
        pts.push({ d, v: +v.toFixed(2) });
      }
      return pts;
    };
    if (cut === "__all__") {
      return [{ label: "Total", pts: mk(metric.name, 0), color: "var(--accent)" }];
    }
    const vals = cut === "geo" ? ["UK", "DE", "BR", "ZA"] :
      cut === "продукт" ? ["casino", "sports", "live"] :
      cut === "канал" ? ["paid", "organic", "affiliate"] :
      ["seg-A", "seg-B", "seg-C"];
    const palette = ["var(--accent)", "#ff9550", "#6fb4ff", "#b980ff", "#ffd24a"];
    return vals.map((v, i) => ({
      label: v,
      pts: mk(metric.name + "_" + v, (i - vals.length / 2) * 5),
      color: palette[i % palette.length]
    }));
  }, [metric, days, cut]);

  const allVals = series.flatMap((s) => s.pts.map((p) => p.v));
  const min = Math.min(...allVals);
  const max = Math.max(...allVals);
  const pad = (max - min) * 0.1 || 5;
  const yMin = Math.max(0, min - pad);
  const yMax = max + pad;
  const W = 860, H = 240, PL = 48, PR = 16, PT = 16, PB = 32;
  const IW = W - PL - PR, IH = H - PT - PB;
  const x = (i) => PL + i / (days - 1) * IW;
  const y = (v) => PT + (1 - (v - yMin) / (yMax - yMin)) * IH;
  const pathFor = (pts) => pts.map((p, i) => (i === 0 ? "M" : "L") + x(i) + " " + y(p.v)).join(" ");
  const areaFor = (pts) => pathFor(pts) + " L" + x(pts.length - 1) + " " + (PT + IH) + " L" + x(0) + " " + (PT + IH) + " Z";
  const redThresh = parseFloat((metric.red || "").match(/[\d.]+/)?.[0]);
  const yelThresh = parseFloat((metric.yellow || "").match(/[\d.]+/)?.[0]);
  const yTicks = 4;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => yMin + (yMax - yMin) * i / yTicks);
  const labelCount = Math.min(6, days);
  const xLabels = Array.from({ length: labelCount }, (_, i) => {
    const idx = Math.round(i / (labelCount - 1) * (days - 1));
    const p = series[0].pts[idx];
    return { idx, label: p.d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) };
  });
  const onMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width * W;
    if (mx < PL || mx > W - PR) { setHover(null); return; }
    const idx = Math.round((mx - PL) / IW * (days - 1));
    if (idx >= 0 && idx < days) setHover(idx);
  };
  const current = hover != null ? series.map((s) => ({ label: s.label, color: s.color, v: s.pts[hover].v, d: s.pts[hover].d })) : null;

  return (
    <section className="sec histsec">
      <div className="sec__hdr">
        <div className="sec__n mono">00</div>
        <div className="sec__t">Исторический график</div>
        <div className="histsec__ctrls mono">
          <div className="histsec__seg">
            {Object.keys(ranges).map((r) =>
              <button key={r} className={cx("histsec__segb", range === r && "histsec__segb--on")} onClick={() => setRange(r)}>{r.toUpperCase()}</button>)}
          </div>
          {cuts.length > 0 &&
            <div className="histsec__seg">
              <button className={cx("histsec__segb", cut === "__all__" && "histsec__segb--on")} onClick={() => setCut("__all__")}>TOTAL</button>
              {cuts.map((c) =>
                <button key={c} className={cx("histsec__segb", cut === c && "histsec__segb--on")} onClick={() => setCut(c)}>{c.toUpperCase()}</button>)}
            </div>}
        </div>
      </div>
      <div className="histsec__chartwrap">
        <svg
          ref={svgRef}
          className="histsec__chart"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}>
          {ticks.map((t, i) =>
            <g key={i}>
              <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} className="histsec__grid" />
              <text x={PL - 6} y={y(t) + 3} className="histsec__axlbl" textAnchor="end">{t.toFixed(t < 10 ? 1 : 0)}</text>
            </g>)}
          {!isNaN(redThresh) && redThresh >= yMin && redThresh <= yMax &&
            <g>
              <line x1={PL} x2={W - PR} y1={y(redThresh)} y2={y(redThresh)} className="histsec__thresh histsec__thresh--red" />
              <text x={W - PR - 4} y={y(redThresh) - 4} className="histsec__threshlbl histsec__threshlbl--red" textAnchor="end">RED · {redThresh}</text>
            </g>}
          {!isNaN(yelThresh) && yelThresh >= yMin && yelThresh <= yMax &&
            <g>
              <line x1={PL} x2={W - PR} y1={y(yelThresh)} y2={y(yelThresh)} className="histsec__thresh histsec__thresh--yel" />
              <text x={W - PR - 4} y={y(yelThresh) - 4} className="histsec__threshlbl histsec__threshlbl--yel" textAnchor="end">YEL · {yelThresh}</text>
            </g>}
          {series.length === 1 &&
            <path d={areaFor(series[0].pts)} fill="url(#histgrad)" opacity="0.25" />}
          <defs>
            <linearGradient id="histgrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {series.map((s, i) =>
            <path key={i} d={pathFor(s.pts)} fill="none" stroke={s.color} strokeWidth="1.6" />)}
          {hover != null &&
            <line x1={x(hover)} x2={x(hover)} y1={PT} y2={PT + IH} className="histsec__hov" />}
          {hover != null && series.map((s, i) =>
            <circle key={i} cx={x(hover)} cy={y(s.pts[hover].v)} r="3.5" fill={s.color} stroke="var(--bg-2)" strokeWidth="1.5" />)}
          {xLabels.map((l, i) =>
            <text key={i} x={x(l.idx)} y={H - 10} className="histsec__axlbl" textAnchor="middle">{l.label}</text>)}
        </svg>
        {current &&
          <div className="histsec__tip" style={{ left: `${x(hover) / W * 100}%` }}>
            <div className="histsec__tipdate mono">{current[0].d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })}</div>
            {current.map((c, i) =>
              <div key={i} className="histsec__tiprow">
                <span className="histsec__tipdot" style={{ background: c.color }} />
                <span className="histsec__tiplbl">{c.label}</span>
                <span className="histsec__tipv mono">{c.v.toFixed(2)}</span>
              </div>)}
          </div>}
        {series.length > 1 &&
          <div className="histsec__legend mono">
            {series.map((s, i) =>
              <span key={i} className="histsec__legitem">
                <span className="histsec__legdot" style={{ background: s.color }} />
                {s.label}
              </span>)}
          </div>}
      </div>
    </section>);
}

// onClose is the universal close hook — Drawer wraps this with scrim, Graph
// hides the right panel.
function MetricPreview({ metric, onClose, all, onOpenDep, saved, onToggleSave, selected, onToggleSelect }) {
  const [copied, setCopied] = useState(false);
  const [cut, setCut] = useState("__all__");
  const [exportOpen, setExportOpen] = useState(false);
  const [exportRange, setExportRange] = useState("30d");
  const [exportFormat, setExportFormat] = useState("csv");
  const [exportedFlash, setExportedFlash] = useState(false);

  if (!metric) return null;
  const m = metric;
  const sev = sevBadge(m.name);
  const val = fakeValue(m);
  const wow = fakeDelta(m.name, "wow");
  const mom = fakeDelta(m.name, "mom");
  const valCls = sev === "red" ? "snap__val--red" : sev === "yel" ? "snap__val--yel" : "snap__val--grn";
  const cuts = m.ntags || [];
  const isFav = saved?.has?.(m.name);
  const isCompare = selected?.has?.(m.name);

  const copyMarkdown = async () => {
    const md = buildMetricMarkdown(m);
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = md; document.body.appendChild(ta);
      ta.select(); try { document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
      document.body.removeChild(ta);
    }
  };

  const exportHistorical = () => {
    const ranges = { "7d": 7, "14d": 14, "30d": 30, "90d": 90, "180d": 180, "365d": 365 };
    const days = ranges[exportRange] || 30;
    let seed = 0;
    for (let i = 0; i < m.name.length; i++) seed = seed * 31 + m.name.charCodeAt(i) | 0;
    const rows = [];
    const header = ["date", "value"];
    if (cut !== "__all__") header.push("cut_dimension", "cut_value");
    rows.push(header.join(","));
    const cutValues = cut === "__all__" ? [null] :
      cut === "geo" ? ["UK", "DE", "BR", "ZA"] :
      cut === "продукт" ? ["casino", "sports", "live"] :
      cut === "канал" ? ["paid", "organic", "affiliate"] :
      ["seg-A", "seg-B", "seg-C"];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      cutValues.forEach((cv) => {
        seed = seed * 1103515245 + 12345 & 0x7fffffff;
        const base = seed % 1000 / 10;
        const value = (base + (cv ? cv.length * 3 : 0)).toFixed(2);
        const row = [ds, value];
        if (cv !== null) row.push(cut, cv);
        rows.push(row.join(","));
      });
    }
    const content = exportFormat === "csv" ? rows.join("\n") :
      JSON.stringify(rows.slice(1).map((r) => {
        const cells = r.split(",");
        const obj = { date: cells[0], value: parseFloat(cells[1]) };
        if (cells.length > 2) { obj[cells[2]] = cells[3]; }
        return obj;
      }), null, 2);
    const filename = `${m.name.replace(/\W+/g, "_").toLowerCase()}_${exportRange}${cut !== "__all__" ? "_by_" + cut : ""}.${exportFormat}`;
    const blob = new Blob([content], { type: exportFormat === "csv" ? "text/csv" : "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportedFlash(true);
    setTimeout(() => { setExportedFlash(false); setExportOpen(false); }, 1200);
  };

  return (
    <>
      <div className="drawer__close">
        <button onClick={onClose} title="Esc">← Close</button>
        <div className="drawer__breadcrumb mono">{m.cat} / <b>{m.name}</b></div>
        <div className="drawer__actions">
          <button
            className={cx("drawer__abtn", isFav && "drawer__abtn--on")}
            onClick={() => onToggleSave?.(m.name)}
            title={isFav ? "Remove from favorites" : "Add to favorites"}>
            <span className="drawer__abtn-ic">{isFav ? "★" : "☆"}</span>
            <span>{isFav ? "Saved" : "Save"}</span>
          </button>
          <button
            className={cx("drawer__abtn", isCompare && "drawer__abtn--on")}
            onClick={() => onToggleSelect?.(m.name)}
            title={isCompare ? "Remove from comparison" : "Add to comparison"}>
            <span className="drawer__abtn-ic">⇌</span>
            <span>{isCompare ? "In compare" : "Compare"}</span>
          </button>
          <div className={cx("drawer__export", exportOpen && "drawer__export--open")}>
            <button
              className="drawer__abtn"
              onClick={() => setExportOpen((v) => !v)}
              title="Export historical data">
              <span className="drawer__abtn-ic">↓</span>
              <span>Export</span>
            </button>
            {exportOpen &&
              <div className="xpop" onClick={(e) => e.stopPropagation()}>
                <div className="xpop__hdr mono">EXPORT HISTORICAL</div>
                <div className="xpop__row">
                  <label className="xpop__lbl mono">Range</label>
                  <div className="xpop__seg">
                    {["7d", "14d", "30d", "90d", "180d", "365d"].map((r) =>
                      <button key={r} className={cx("xpop__segb mono", exportRange === r && "xpop__segb--on")} onClick={() => setExportRange(r)}>{r.toUpperCase()}</button>)}
                  </div>
                </div>
                <div className="xpop__row">
                  <label className="xpop__lbl mono">Cut</label>
                  <div className="xpop__cutval mono">{cut === "__all__" ? "Total (no cut)" : cut}</div>
                </div>
                <div className="xpop__row">
                  <label className="xpop__lbl mono">Format</label>
                  <div className="xpop__seg">
                    {["csv", "json"].map((f) =>
                      <button key={f} className={cx("xpop__segb mono", exportFormat === f && "xpop__segb--on")} onClick={() => setExportFormat(f)}>{f.toUpperCase()}</button>)}
                  </div>
                </div>
                <button className="btn btn--primary xpop__go" onClick={exportHistorical}>
                  {exportedFlash ? "✓ Downloaded" : `Download · ${exportFormat.toUpperCase()}`}
                </button>
                <div className="xpop__hint mono">
                  Mock data for prototype. Real source: {m.source}
                </div>
              </div>}
          </div>
          <button
            className={cx("drawer__abtn", copied && "drawer__abtn--ok")}
            onClick={copyMarkdown}
            title="Copy full spec as Markdown">
            <span className="drawer__abtn-ic">⎘</span>
            <span>{copied ? "Copied" : "Copy spec"}</span>
          </button>
        </div>
        <button className="drawer__x" onClick={onClose}>✕</button>
      </div>

      <header className="drawer__hdr">
        <div className="drawer__tags">
          <span className={cx("tag tag--lvl tag--lg", `tag--${levelColor[m.level]}`)}>{m.level}</span>
          <span className={cx("tag tag--lg", `tag--${prioColor[m.prio]}`)}>{m.prio}</span>
          <span className="tag tag--lg tag--ghost">{m.freq}</span>
          <span className="tag tag--lg tag--ghost">{m.owner}</span>
          <span className="tag tag--lg tag--ghost">Source: {m.source}</span>
          {sev && <span className={cx("tag tag--lg", `tag--sev-${sev}`)}>{sev === "red" ? "RED ALERT" : "WARNING"}</span>}
        </div>
        <h1 className="drawer__title">{m.name}</h1>
        <div className="drawer__subtitle">{m.cat}</div>
        {cuts.length > 0 &&
          <div className="cutbar">
            <span className="cutbar__lbl mono">CUT BY</span>
            <button
              className={cx("cutbar__chip mono", cut === "__all__" && "cutbar__chip--on")}
              onClick={() => setCut("__all__")}>
              Total</button>
            {cuts.map((c) =>
              <button
                key={c}
                className={cx("cutbar__chip mono", cut === c && "cutbar__chip--on")}
                onClick={() => setCut(c)}>
                {c}</button>)}
            {cut !== "__all__" &&
              <span className="cutbar__hint mono">showing values cut by <b>{cut}</b></span>}
          </div>}
        <div className="drawer__snap">
          <div className="snap">
            <div className="snap__lbl mono">CURRENT</div>
            <div className={cx("snap__val mono", valCls)}>{val}</div>
          </div>
          <div className="snap">
            <div className="snap__lbl mono">WoW</div>
            <div className={cx("snap__val mono", wow >= 0 ? "up" : "down")}>
              {wow >= 0 ? "▲" : "▼"} {Math.abs(wow).toFixed(2)}%
            </div>
          </div>
          <div className="snap">
            <div className="snap__lbl mono">MoM</div>
            <div className={cx("snap__val mono", mom >= 0 ? "up" : "down")}>
              {mom >= 0 ? "▲" : "▼"} {Math.abs(mom).toFixed(2)}%
            </div>
          </div>
          <div className="snap snap--chart">
            <svg viewBox="0 0 220 46" preserveAspectRatio="none">
              <path d={sparkPath(m.name + "_14", 220, 46)} />
            </svg>
            <div className="snap__lbl mono">14D TREND</div>
          </div>
        </div>
      </header>

      <HistoricalChartSection metric={m} />

      <Section n="01" title="Что это и зачем">
        <p className="prose">{m.imp}</p>
      </Section>

      <Section n="02" title="Как считается">
        <div className="formula mono">
          <div className="formula__row">
            <span className="formula__lbl">Формула</span>
            <span className="formula__body">{m.formula}</span>
          </div>
          <div className="formula__frac">
            <div className="formula__num">{m.num}</div>
            <div className="formula__line" />
            <div className="formula__den">{m.den}</div>
          </div>
          {m.ntags && m.ntags.length > 0 &&
            <div className="formula__cuts">
              <span className="formula__lbl">Разрезы</span>
              <div className="cuts">
                {m.ntags.map((t) => <span key={t} className="cut mono">{t}</span>)}
              </div>
            </div>}
        </div>
      </Section>

      <Section n="03" title="Бенчмарки по эшелонам">
        <div className="bench">
          <div className="bench__col">
            <div className="bench__hdr mono">TIER-1 · UK/Nordics/DACH</div>
            <div className="bench__val mono">{m.b1}</div>
            <div className="bench__bar"><div className="bench__fill" style={{ width: "82%" }} /></div>
          </div>
          <div className="bench__col">
            <div className="bench__hdr mono">TIER-2 · CIS/LatAm/SEA</div>
            <div className="bench__val mono">{m.b2}</div>
            <div className="bench__bar"><div className="bench__fill" style={{ width: "62%" }} /></div>
          </div>
          <div className="bench__col">
            <div className="bench__hdr mono">TIER-3 · Africa/MENA</div>
            <div className="bench__val mono">{m.b3}</div>
            <div className="bench__bar"><div className="bench__fill" style={{ width: "45%" }} /></div>
          </div>
        </div>
      </Section>

      <Section n="04" title="Пороги срабатывания">
        <div className="thresh">
          <div className="thresh__line thresh__line--red">
            <div className="thresh__lbl mono">RED</div>
            <div className="thresh__val mono">{m.red}</div>
            <div className="thresh__action">Немедленный инцидент, on-call продукта</div>
          </div>
          <div className="thresh__line thresh__line--yel">
            <div className="thresh__lbl mono">YELLOW</div>
            <div className="thresh__val mono">{m.yellow}</div>
            <div className="thresh__action">Ревью на daily stand-up, назначение owner'а</div>
          </div>
          <div className="thresh__line thresh__line--grn">
            <div className="thresh__lbl mono">GREEN</div>
            <div className="thresh__val mono">в пределах benchmark</div>
            <div className="thresh__action">В рамках нормы</div>
          </div>
        </div>
      </Section>

      <Section n="05" title="Ловушки интерпретации">
        <ol className="traps">
          {m.traps.map((t, i) =>
            <li key={i}>
              <span className="traps__n mono">{String(i + 1).padStart(2, "0")}</span>
              <span className="traps__t">{t}</span>
            </li>
          )}
        </ol>
      </Section>

      <Section n="06" title="Как чинить">
        <ul className="fix">
          {m.fix.map((f, i) =>
            <li key={i}>
              <span className="fix__arrow">→</span>
              <span>{f}</span>
            </li>
          )}
        </ul>
      </Section>

      <Section n="07" title="Связи">
        <DepsBlock m={m} all={all} onOpenDep={onOpenDep} />
      </Section>

      <footer className="drawer__foot mono">
        <span>owner · {m.owner}</span>
        <span>source · {m.source}</span>
        <span>updated · 2025-11-14 09:42</span>
        <span>id · {m.name.replace(/\W+/g, "_").toLowerCase()}</span>
      </footer>
    </>
  );
}

export { MetricPreview, buildMetricMarkdown };
