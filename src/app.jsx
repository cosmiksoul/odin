import { useState, useMemo, useEffect, useRef } from 'react';
import { METRICS_SEED } from './data.js';
import { GraphView } from './graph-view.jsx';
import { cx, sparkPath, fakeValue, fakeDelta, sevBadge, prioColor, levelColor } from './lib/util.js';
import { MetricPreview, buildMetricMarkdown } from './components/MetricPreview.jsx';
import { FiltersDrawer } from './components/FiltersDrawer.jsx';
import { ControlBar } from './components/ControlBar.jsx';

const PRESETS = {
  "dark-lime": { theme: "dark", accent: "lime" },
  "light-magenta": { theme: "light", accent: "magenta" }
};

// ============ CARD ============
function MetricCard({ m, onOpen, showCta, view, freqIdx, saved, onToggleSave, onOpenSource, selected, onToggleSelect }) {
  const spark = useMemo(() => sparkPath(m.name, 40, 18), [m.name]);
  const delta = useMemo(() => {
    const h = m.name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return (h % 190 - 95) / 10;
  }, [m.name]);
  const val = useMemo(() => fakeValue(m), [m.name]);
  const sev = useMemo(() => sevBadge(m.name), [m.name]);

  if (view === "list") {
    return (
      <div className={cx("row", selected && "row--sel")} onClick={onOpen}>
        <span className={cx("tag tag--lvl", `tag--${levelColor[m.level]}`)}>{m.level}</span>
        <span className="row__name">{m.name}</span>
        <span className="row__cat">{m.cat}</span>
        <span className={cx("row__prio", `txt--${prioColor[m.prio]}`)}>{m.prio}</span>
        <span className="row__freq">{m.freq}</span>
        <span className="row__owner">{m.owner}</span>
        <span className="row__val mono">{val}</span>
        <span className={cx("row__delta mono", delta >= 0 ? "up" : "down")}>{delta >= 0 ? "▲" : "▼"}{Math.abs(delta).toFixed(1)}%</span>
        <svg className="row__spark" viewBox="0 0 40 18"><path d={spark} /></svg>
        <span className="row__sev">
          {sev && <span className={cx("dot", `dot--${sev}`)} title={sev} />}
        </span>
        <button
          className={cx("row__iconbtn", saved && "row__iconbtn--star")}
          onClick={(e) => {e.stopPropagation();onToggleSave?.(m.name);}}
          title={saved ? "Saved ✓" : "Save"}
          aria-label={saved ? "Remove from saved" : "Save"}>
          {saved ? "★" : "☆"}</button>
        <button
          className={cx("row__iconbtn", selected && "row__iconbtn--on")}
          onClick={(e) => {e.stopPropagation();onToggleSelect?.(m.name);}}
          title={selected ? "Remove from compare" : "Add to compare"}
          aria-label="Compare">
          {selected ? "✓" : "+"}</button>
      </div>);

  }

  return (
    <div className={cx("card", selected && "card--sel")} onClick={onOpen}>
      <div className="card__top">
        <div className="card__lvlrow">
          <span className={cx("tag tag--lvl", `tag--${levelColor[m.level]}`)}>{m.level}</span>
          <span className={cx("tag", `tag--${prioColor[m.prio]}`)}>{m.prio}</span>
          {sev && <span className={cx("dot", `dot--${sev}`)} />}
        </div>
        <div className="card__topr">
          <span className="card__freq mono">{m.freq.toUpperCase()}</span>
          <button
            className={cx("card__iconbtn", saved && "card__iconbtn--star")}
            onClick={(e) => {e.stopPropagation();onToggleSave?.(m.name);}}
            title={saved ? "Saved ✓" : "Save"}
            aria-label={saved ? "Remove from saved" : "Save"}>
            {saved ? "★" : "☆"}</button>
          <button
            className={cx("card__iconbtn", selected && "card__iconbtn--on")}
            onClick={(e) => {e.stopPropagation();onToggleSelect?.(m.name);}}
            title={selected ? "Remove from compare" : "Add to compare"}
            aria-label="Compare">
            {selected ? "✓" : "+"}</button>
        </div>
      </div>

      <div className="card__name">{m.name}</div>
      <div className="card__cat">{m.cat} · {m.owner}</div>

      <div className="card__numrow">
        <div className="card__val mono">{val}</div>
        <div className={cx("card__delta mono", delta >= 0 ? "up" : "down")}>
          {delta >= 0 ? "▲" : "▼"}{Math.abs(delta).toFixed(2)}%
        </div>
      </div>

      <svg className="card__spark" viewBox="0 0 120 32" preserveAspectRatio="none">
        <path d={sparkPath(m.name, 120, 32)} />
      </svg>

      <div className={cx("card__thresh mono", sev && `card__thresh--${sev}`)} title={
      sev === "red" ? `Red threshold tripped: ${m.red || "—"}` :
      sev === "yel" ? `Yellow threshold tripped: ${m.yellow || "—"}` :
      `Target (Tier 1): ${m.b1 || "—"}`
      }>
        {sev === "red" && <>
          <span className="card__thresh__dot" />
          <span className="card__thresh__lbl">RED</span>
          <span className="card__thresh__val">{m.red || "threshold tripped"}</span>
        </>}
        {sev === "yel" && <>
          <span className="card__thresh__dot" />
          <span className="card__thresh__lbl">YELLOW</span>
          <span className="card__thresh__val">{m.yellow || "threshold tripped"}</span>
        </>}
        {!sev && <>
          <span className="card__thresh__lbl">TARGET</span>
          <span className="card__thresh__val">{m.b1 || "—"}</span>
        </>}
      </div>

      {showCta &&
      <div className="card__cta">
          <button onClick={(e) => {e.stopPropagation();onOpen();}}>Open spec →</button>
          <button onClick={(e) => {e.stopPropagation();onOpenSource?.(m);}}>Source</button>
        </div>
      }
    </div>);

}

// ============ DRAWER ============
// Thin wrapper around MetricPreview: scrim + ESC handler + click-outside close.
function Drawer(props) {
  const { onClose, metric } = props;
  useEffect(() => {
    if (!metric) return;
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, metric]);
  if (!metric) return null;
  return (
    <div className="drawer-wrap" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <MetricPreview {...props} />
      </aside>
    </div>);
}

// ============ HOME v2 — WATCHLIST + HEALTH ============
function Home({ variant, metrics, onOpen, onGoCatalog }) {
  // Watchlist: all red + yellow, sorted red-first, L1-first
  const watchlist = useMemo(() => {
    return metrics.
    map((m) => ({ m, sev: sevBadge(m.name) })).
    filter((x) => x.sev).
    sort((a, b) => {
      if (a.sev !== b.sev) return a.sev === "red" ? -1 : 1;
      const lvlRank = { L1: 0, L2: 1, L3: 2 };
      return lvlRank[a.m.level] - lvlRank[b.m.level];
    });
  }, [metrics]);

  const redCount = watchlist.filter((x) => x.sev === "red").length;
  const yelCount = watchlist.filter((x) => x.sev === "yel").length;
  const grnCount = metrics.length - redCount - yelCount;

  // Catalog health metrics
  const specFields = ["imp", "formula", "b1", "red", "yellow", "traps", "fix"];
  const completeness = useMemo(() => {
    let total = 0,filled = 0;
    metrics.forEach((m) => {
      specFields.forEach((f) => {
        total++;
        const v = m[f];
        if (v && (Array.isArray(v) ? v.length > 0 : String(v).trim().length > 0 && v !== "—")) filled++;
      });
    });
    return Math.round(filled / total * 100);
  }, [metrics]);

  const byOwner = useMemo(() => {
    const g = {};
    metrics.forEach((m) => {g[m.owner] = (g[m.owner] || 0) + 1;});
    return Object.entries(g).sort((a, b) => b[1] - a[1]);
  }, [metrics]);

  const byCat = useMemo(() => {
    const g = {};
    metrics.forEach((m) => {
      const key = m.cat;
      if (!g[key]) g[key] = { total: 0, red: 0, yel: 0, l1: 0 };
      g[key].total++;
      if (m.level === "L1") g[key].l1++;
      const s = sevBadge(m.name);
      if (s === "red") g[key].red++;
      if (s === "yel") g[key].yel++;
    });
    return Object.entries(g).sort((a, b) => b[1].red * 10 + b[1].yel - (a[1].red * 10 + a[1].yel));
  }, [metrics]);

  const mustCount = metrics.filter((m) => m.prio === "Must").length;
  const shouldCount = metrics.filter((m) => m.prio === "Should").length;
  const niceCount = metrics.filter((m) => m.prio === "Nice").length;

  return (
    <div className="home2">
      {/* Thin header strip */}
      <div className="home2__strip">
        <div className="home2__strip-l">
          <span className="home2__kicker mono">ODIN · OPERATOR METRICS · v0.1</span>
          <span className="home2__now mono">{new Date().toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase()} · 09:14 UTC</span>
        </div>
        <div className="home2__strip-r">
          <button className="btn btn--ghost btn--sm" onClick={onGoCatalog}>Open catalog →</button>
        </div>
      </div>

      {/* Two-column main */}
      <div className="home2__grid">
        {/* LEFT — WATCHLIST */}
        <section className="home2__col home2__col--watch">
          <header className="home2__colhdr">
            <div>
              <div className="home2__colkicker mono">01 / WATCHLIST</div>
              <h2 className="home2__coltitle">What needs attention now</h2>
            </div>
            <div className="wlsum mono">
              <span className="wlsum__i wlsum__i--red"><span className="wlsum__dot" />{redCount} red</span>
              <span className="wlsum__i wlsum__i--yel"><span className="wlsum__dot" />{yelCount} yellow</span>
              <span className="wlsum__i wlsum__i--grn"><span className="wlsum__dot" />{grnCount} ok</span>
            </div>
          </header>

          <div className="wl">
            {watchlist.length === 0 &&
            <div className="wl__empty mono">All metrics are green.</div>}
            {watchlist.map(({ m, sev }) => <WatchRow key={m.name} m={m} sev={sev} onOpen={onOpen} />)}
          </div>
        </section>

        {/* RIGHT — HEALTH */}
        <aside className="home2__col home2__col--health">
          <header className="home2__colhdr">
            <div>
              <div className="home2__colkicker mono">02 / CATALOG HEALTH</div>
              <h2 className="home2__coltitle">Is the spec fit for use?</h2>
            </div>
          </header>

          {/* KPI tiles */}
          <div className="hlth__kpis">
            <HlthKpi label="Metrics" value={metrics.length} sub={`${mustCount} Must · ${shouldCount} Should · ${niceCount} Nice`} />
            <HlthKpi label="Spec completeness" value={completeness + "%"} sub={completeness >= 85 ? "fit for use" : completeness >= 60 ? "gaps to close" : "needs work"} tone={completeness >= 85 ? "grn" : completeness >= 60 ? "yel" : "red"} />
            <HlthKpi label="Owners" value={byOwner.length} sub={byOwner.map(([o]) => o).join(" · ")} />
            <HlthKpi label="Categories" value={byCat.length} sub={`${byCat[0]?.[0] || "—"} biggest`} />
          </div>

          {/* Priority mix bar */}
          <div className="hlth__block">
            <div className="hlth__blklbl mono">— PRIORITY MIX —</div>
            <div className="mixbar">
              <div className="mixbar__seg mixbar__seg--must" style={{ flex: mustCount }} title={`Must · ${mustCount}`}>
                <span className="mixbar__n mono">{mustCount}</span>
                <span className="mixbar__k mono">MUST</span>
              </div>
              <div className="mixbar__seg mixbar__seg--should" style={{ flex: shouldCount }} title={`Should · ${shouldCount}`}>
                <span className="mixbar__n mono">{shouldCount}</span>
                <span className="mixbar__k mono">SHOULD</span>
              </div>
              <div className="mixbar__seg mixbar__seg--nice" style={{ flex: niceCount }} title={`Nice · ${niceCount}`}>
                <span className="mixbar__n mono">{niceCount}</span>
                <span className="mixbar__k mono">NICE</span>
              </div>
            </div>
          </div>

          {/* Owner coverage */}
          <div className="hlth__block">
            <div className="hlth__blklbl mono">— OWNER COVERAGE —</div>
            <div className="owncov">
              {byOwner.map(([owner, n]) => {
                const pct = n / metrics.length * 100;
                return (
                  <div key={owner} className="owncov__row">
                    <span className="owncov__lbl">{owner}</span>
                    <span className="owncov__bar">
                      <span className="owncov__fill" style={{ width: pct + "%" }} />
                    </span>
                    <span className="owncov__n mono">{n}</span>
                  </div>);
              })}
            </div>
          </div>

          {/* Category × alerts */}
          <div className="hlth__block">
            <div className="hlth__blklbl mono">— CATEGORY · ALERTS ({redCount + yelCount}) —</div>
            <div className="catlst">
              {byCat.slice(0, 8).map(([cat, s]) =>
              <div key={cat} className="catlst__row">
                  <span className="catlst__name">{cat}</span>
                  <span className="catlst__bars">
                    {Array.from({ length: s.total }, (_, i) => {
                    const cls = i < s.red ? "red" : i < s.red + s.yel ? "yel" : i < s.red + s.yel + s.l1 ? "l1" : "ok";
                    return <span key={i} className={`catlst__cell catlst__cell--${cls}`} />;
                  })}
                  </span>
                  <span className="catlst__n mono">{s.total}</span>
                </div>)}
            </div>
            <div className="catlst__legend mono">
              <span><span className="catlst__cell catlst__cell--red" /> red alert</span>
              <span><span className="catlst__cell catlst__cell--yel" /> yellow</span>
              <span><span className="catlst__cell catlst__cell--l1" /> L1 ok</span>
              <span><span className="catlst__cell catlst__cell--ok" /> L2/L3 ok</span>
            </div>
          </div>
        </aside>
      </div>
    </div>);
}

function WatchRow({ m, sev, onOpen }) {
  const val = fakeValue(m);
  const spark = sparkPath(m.name + "_wl", 60, 20);
  const threshText = sev === "red" ? m.red : m.yellow;
  const h = m.name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const delta = (h % 200 / 10 - 10).toFixed(1);
  const isDown = parseFloat(delta) < 0;

  return (
    <button className={cx("wlrow", `wlrow--${sev}`)} onClick={() => onOpen(m)}>
      <span className={cx("wlrow__sev", `wlrow__sev--${sev}`)}>
        <span className="wlrow__dot" />
        <span className="wlrow__sevlbl mono">{sev === "red" ? "RED" : "YEL"}</span>
      </span>
      <span className="wlrow__main">
        <span className="wlrow__name">{m.name}</span>
        <span className="wlrow__meta mono">
          <span className={cx("wlrow__lvl", `wlrow__lvl--${levelColor[m.level]}`)}>{m.level}</span>
          <span>·</span>
          <span>{m.cat}</span>
          <span>·</span>
          <span>{m.owner}</span>
        </span>
      </span>
      <span className="wlrow__thresh mono">
        <span className="wlrow__threshk">breach</span>
        <span className="wlrow__threshv">{threshText || "threshold hit"}</span>
      </span>
      <span className="wlrow__val">
        <span className="wlrow__valnum mono">{val}</span>
        <span className={cx("wlrow__valdelta mono", isDown ? "down" : "up")}>{isDown ? "▼" : "▲"}{Math.abs(parseFloat(delta))}%</span>
      </span>
      <svg className={cx("wlrow__spark", `wlrow__spark--${sev}`)} viewBox="0 0 60 20" preserveAspectRatio="none">
        <path d={spark} />
      </svg>
      <span className="wlrow__arr mono">▸</span>
    </button>);
}

function HlthKpi({ label, value, sub, tone }) {
  return (
    <div className={cx("hlthkpi", tone && `hlthkpi--${tone}`)}>
      <div className="hlthkpi__lbl mono">{label}</div>
      <div className="hlthkpi__val mono">{value}</div>
      <div className="hlthkpi__sub">{sub}</div>
    </div>);
}

function Stat({ k, v }) {return <div className="stat"><div className="stat__v mono">{v}</div><div className="stat__k">{k}</div></div>;}

function HomeHeatmap({ cats, onOpen }) {
  return (
    <div className="home__vis">
      <div className="home__vishdr mono">— HEATMAP · метрики по категориям и эшелонам —</div>
      <div className="heat">
        {Object.entries(cats).map(([cat, arr]) =>
        <div key={cat} className="heat__row">
            <div className="heat__lbl mono">{cat}</div>
            <div className="heat__cells">
              {arr.map((m) => {
              const sev = sevBadge(m.name);
              return (
                <button key={m.name} className={cx("heat__cell", `heat__cell--${levelColor[m.level]}`, sev && `heat__cell--${sev}`)}
                onClick={() => onOpen(m)} title={m.name}>
                    <span className="heat__lvl mono">{m.level}</span>
                  </button>);

            })}
            </div>
            <div className="heat__n mono">{arr.length}</div>
          </div>
        )}
      </div>
    </div>);

}
function HomeEchelon({ metrics, onOpen }) {
  const byLevel = { L1: [], L2: [], L3: [] };
  metrics.forEach((m) => byLevel[m.level].push(m));
  return (
    <div className="home__vis">
      <div className="home__vishdr mono">— ESCHELON VIEW · пирамида важности —</div>
      <div className="ech">
        {["L1", "L2", "L3"].map((lv, i) =>
        <div key={lv} className={cx("ech__tier", `ech__tier--${lv.toLowerCase()}`)}>
            <div className="ech__side">
              <div className="ech__big mono">{lv}</div>
              <div className="ech__desc">
                {lv === "L1" && <>Топ-метрики операционных совещаний. <br />Без этих чисел бизнес слепой.</>}
                {lv === "L2" && <>Диагностические. Объясняют, что ломает L1.</>}
                {lv === "L3" && <>Операционные и product-specific. Контроль качества.</>}
              </div>
              <div className="ech__count mono">{byLevel[lv].length} метрик</div>
            </div>
            <div className="ech__grid">
              {byLevel[lv].map((m) =>
            <button key={m.name} className="ech__pill" onClick={() => onOpen(m)}>
                  <span className={cx("tag tag--sm", `tag--${prioColor[m.prio]}`)}>{m.prio[0]}</span>
                  <span className="ech__pillname">{m.name}</span>
                </button>
            )}
            </div>
          </div>
        )}
      </div>
    </div>);

}

// ============ COMMAND PALETTE ============
function CommandPalette({ metrics, open, onClose, onOpen, onRoute, onToggleSave, onToggleSelect, saved, selected }) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const actions = useMemo(() => [
  { type: "nav", id: "nav-home", label: "Go to Home", hint: "Watchlist + catalog health", icon: "⌂", route: "home" },
  { type: "nav", id: "nav-catalog", label: "Go to Catalog", hint: "Browse all metrics", icon: "▦", route: "catalog" },
  { type: "nav", id: "nav-graph", label: "Go to Graph", hint: "Dependency network", icon: "⇄", route: "graph" },
  { type: "nav", id: "nav-saved", label: "Go to Saved", hint: "Your pinned metrics + report", icon: "★", route: "saved" }],
  []);

  useEffect(() => {
    if (open) {
      setQ("");setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // fuzzy-ish match: token-based score
  const score = (text, query) => {
    if (!query) return 0;
    const t = text.toLowerCase(),q = query.toLowerCase();
    if (t === q) return 1000;
    if (t.startsWith(q)) return 500;
    if (t.includes(q)) return 300;
    // subsequence
    let ti = 0,qi = 0,gaps = 0;
    while (ti < t.length && qi < q.length) {
      if (t[ti] === q[qi]) {qi++;ti++;} else
      {ti++;gaps++;}
    }
    return qi === q.length ? 100 - Math.min(gaps, 90) : -1;
  };

  const results = useMemo(() => {
    const query = q.trim();
    const metricItems = metrics.map((m) => {
      const s1 = score(m.name, query);
      const s2 = score(m.cat, query) - 50;
      const s3 = score(m.owner, query) - 60;
      const best = Math.max(s1, s2, s3);
      return { m, score: best };
    });

    const actionItems = actions.map((a) => ({ a, score: score(a.label, query) }));

    const all = [];
    if (!query) {
      actions.forEach((a) => all.push({ type: "nav", item: a, score: 0 }));
      // top metrics: alerts first, then L1
      const sorted = [...metrics].sort((a, b) => {
        const sa = sevBadge(a.name),sb = sevBadge(b.name);
        const sev = (x) => x === "red" ? 0 : x === "yel" ? 1 : 2;
        if (sev(sa) !== sev(sb)) return sev(sa) - sev(sb);
        const lv = { L1: 0, L2: 1, L3: 2 };
        return lv[a.level] - lv[b.level];
      });
      sorted.slice(0, 20).forEach((m) => all.push({ type: "metric", item: m, score: 0 }));
    } else {
      actionItems.filter((x) => x.score > 0).forEach((x) => all.push({ type: "nav", item: x.a, score: x.score + 400 }));
      metricItems.filter((x) => x.score > 0).forEach((x) => all.push({ type: "metric", item: x.m, score: x.score }));
      all.sort((a, b) => b.score - a.score);
    }
    return all.slice(0, 40);
  }, [metrics, q, actions]);

  useEffect(() => {setIdx(0);}, [q]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-pidx="${idx}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [idx]);

  const runItem = (entry) => {
    if (!entry) return;
    if (entry.type === "nav") onRoute(entry.item.route);else
    onOpen(entry.item);
  };

  const onKey = (e) => {
    if (e.key === "Escape") {e.preventDefault();onClose();} else
    if (e.key === "ArrowDown") {e.preventDefault();setIdx((i) => Math.min(i + 1, results.length - 1));} else
    if (e.key === "ArrowUp") {e.preventDefault();setIdx((i) => Math.max(i - 1, 0));} else
    if (e.key === "Enter") {e.preventDefault();runItem(results[idx]);} else
    if (e.key === "Tab") {
      // tab saves the highlighted metric
      const cur = results[idx];
      if (cur?.type === "metric") {e.preventDefault();onToggleSave(cur.item.name);}
    }
  };

  if (!open) return null;

  return (
    <div className="cmdp-wrap" onClick={onClose}>
      <div className="cmdp" onClick={(e) => e.stopPropagation()} onKeyDown={onKey}>
        <div className="cmdp__in">
          <span className="cmdp__ic mono">⌕</span>
          <input
            ref={inputRef}
            className="cmdp__q"
            placeholder="Search metrics, pages, owners…"
            value={q}
            onChange={(e) => setQ(e.target.value)} />
          
          <span className="cmdp__kbd mono">ESC</span>
        </div>
        <div className="cmdp__list" ref={listRef}>
          {results.length === 0 &&
          <div className="cmdp__empty mono">No matches for "{q}"</div>}

          {(() => {
            // group consecutive same-type
            const groups = [];
            let cur = null;
            results.forEach((r, i) => {
              if (!cur || cur.type !== r.type) {cur = { type: r.type, items: [] };groups.push(cur);}
              cur.items.push({ r, gi: i });
            });
            return groups.map((g, gIdx) =>
            <div key={gIdx} className="cmdp__group">
                <div className="cmdp__grouplbl mono">{g.type === "nav" ? "PAGES" : "METRICS"}</div>
                {g.items.map(({ r, gi }) => {
                if (r.type === "nav") {
                  const a = r.item;
                  return (
                    <button
                      key={a.id}
                      data-pidx={gi}
                      className={cx("cmdp__row", idx === gi && "cmdp__row--on")}
                      onMouseEnter={() => setIdx(gi)}
                      onClick={() => runItem(r)}>
                      
                        <span className="cmdp__rowic mono">{a.icon}</span>
                        <span className="cmdp__rowmain">
                          <span className="cmdp__rowname">{a.label}</span>
                          <span className="cmdp__rowhint mono">{a.hint}</span>
                        </span>
                        <span className="cmdp__rowkind mono">↵</span>
                      </button>);
                }
                const m = r.item;
                const sev = sevBadge(m.name);
                const isSaved = saved?.has(m.name);
                return (
                  <button
                    key={m.name}
                    data-pidx={gi}
                    className={cx("cmdp__row", idx === gi && "cmdp__row--on")}
                    onMouseEnter={() => setIdx(gi)}
                    onClick={() => runItem(r)}>
                    
                      <span className={cx("cmdp__sev", sev && `cmdp__sev--${sev}`)}>
                        {sev ? <span className="cmdp__sevdot" /> : <span className="cmdp__sevok">•</span>}
                      </span>
                      <span className="cmdp__rowmain">
                        <span className="cmdp__rowname">{m.name}</span>
                        <span className="cmdp__rowhint mono">{m.cat} · {m.level} · {m.owner}{isSaved ? " · ★" : ""}</span>
                      </span>
                      <span className={cx("mini", `mini--${levelColor[m.level]}`)}>{m.level}</span>
                    </button>);
              })}
              </div>);
          })()}
        </div>
        <div className="cmdp__foot mono">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>Tab</kbd> save metric</span>
          <span className="cmdp__ml"><kbd>⌘K</kbd> toggle</span>
        </div>
      </div>
    </div>);
}

// ============ APP ============
function App() {
  const [preset, setPreset] = useState("dark-lime");
  const [density, setDensity] = useState("normal");
  const metrics = METRICS_SEED;

  // Route: home | catalog
  const [route, setRoute] = useState("home");

  // Filters
  const [search, setSearch] = useState("");
  const [fAlert, setFAlert] = useState(new Set());
  const [fLevel, setFLevel] = useState(new Set());
  const [fPrio, setFPrio] = useState(new Set());
  const [fFreq, setFFreq] = useState(new Set());
  const [fCat, setFCat] = useState(new Set());
  const [fOwner, setFOwner] = useState(new Set());
  const [view, setView] = useState("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Catalog L1/L2/L3 section collapse — persisted per level.
  const [catColl, setCatColl] = useState(() => {
    const out = {};
    for (const lv of ["L1", "L2", "L3"]) {
      try { out[lv] = localStorage.getItem(`odin.catalog.section.${lv.toLowerCase()}.collapsed`) === "1"; }
      catch { out[lv] = false; }
    }
    return out;
  });
  const toggleCatColl = (lv) => {
    setCatColl((prev) => {
      const next = { ...prev, [lv]: !prev[lv] };
      try { localStorage.setItem(`odin.catalog.section.${lv.toLowerCase()}.collapsed`, next[lv] ? "1" : "0"); } catch {}
      return next;
    });
  };
  const [openM, setOpenM] = useState(null);
  const [sourceM, setSourceM] = useState(null);
  const [saved, setSaved] = useState(() => {
    try {return new Set(JSON.parse(localStorage.getItem("odin.saved") || "[]"));}
    catch {return new Set();}
  });
  const toggleSave = (name) => {
    setSaved((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      try {localStorage.setItem("odin.saved", JSON.stringify([...next]));} catch {}
      return next;
    });
  };

  // Compare state
  const [selected, setSelected] = useState(new Set());
  const [comparing, setComparing] = useState(false);
  const MAX_COMPARE = 4;
  const toggleSelect = (name) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);else
      if (next.size < MAX_COMPARE) next.add(name);
      return next;
    });
  };
  const clearSelected = () => setSelected(new Set());

  // Command palette
  const [paletteOpen, setPaletteOpen] = useState(false);
  useEffect(() => {
    const h = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {e.preventDefault();setPaletteOpen((v) => !v);} else
      if (e.key === "/" && !paletteOpen && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
        e.preventDefault();setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [paletteOpen]);

  const toggle = (setter) => (v) => setter((prev) => {
    const n = new Set(prev);
    n.has(v) ? n.delete(v) : n.add(v);
    return n;
  });

  const categories = useMemo(() => [...new Set(metrics.map((m) => m.cat))], [metrics]);
  const owners = useMemo(() => [...new Set(metrics.map((m) => m.owner))], [metrics]);
  const frequencies = useMemo(() => [...new Set(metrics.map((m) => m.freq))], [metrics]);

  const filtered = useMemo(() => {
    return metrics.filter((m) => {
      if (search && !(m.name.toLowerCase().includes(search.toLowerCase()) || m.cat.toLowerCase().includes(search.toLowerCase()))) return false;
      if (fLevel.size && !fLevel.has(m.level)) return false;
      if (fPrio.size && !fPrio.has(m.prio)) return false;
      if (fFreq.size && !fFreq.has(m.freq)) return false;
      if (fCat.size && !fCat.has(m.cat)) return false;
      if (fOwner.size && !fOwner.has(m.owner)) return false;
      if (fAlert.size) {
        const status = sevBadge(m.name) || "ok";
        if (!fAlert.has(status)) return false;
      }
      return true;
    });
  }, [metrics, search, fAlert, fLevel, fPrio, fFreq, fCat, fOwner]);

  const filteredByLevel = useMemo(() => ({
    L1: filtered.filter((m) => m.level === "L1"),
    L2: filtered.filter((m) => m.level === "L2"),
    L3: filtered.filter((m) => m.level === "L3"),
  }), [filtered]);

  const activeFilterCount =
    fAlert.size + fLevel.size + fPrio.size + fOwner.size + fFreq.size + fCat.size;
  const clearAllFilters = () => {
    setFAlert(new Set()); setFLevel(new Set()); setFPrio(new Set());
    setFFreq(new Set()); setFCat(new Set()); setFOwner(new Set());
    setSearch("");
  };

  const { theme: effTheme, accent: effAccent } = PRESETS[preset] || PRESETS["dark-lime"];
  const accentMap = {
    lime: "#c7ff45",
    magenta: "#ff3fa4",
    cyan: "#40e0ff",
    emerald: "#26e39c"
  };
  const densityMap = {
    compact: { card: 172, gap: 6, pad: 10 },
    normal: { card: 220, gap: 10, pad: 14 },
    spacious: { card: 268, gap: 16, pad: 18 }
  };
  const d = densityMap[density] || densityMap.normal;

  const rootStyle = {
    "--accent": accentMap[effAccent] || accentMap.lime,
    "--card-min": d.card + "px",
    "--gap": d.gap + "px",
    "--pad": d.pad + "px"
  };
  const rootCls = cx(
    "app",
    `theme--${effTheme}`,
    `type--mono`,
    `density--${density}`
  );

  const openByName = (name) => {
    const m = metrics.find((x) => x.name === name);
    if (m) setOpenM(m);
  };

  return (
    <div className={rootCls} style={rootStyle}>
      <TopBar
        route={route}
        setRoute={setRoute}
        search={search}
        setSearch={setSearch}
        n={filtered.length}
        total={metrics.length}
        savedCount={saved.size}
        preset={preset}
        setPreset={setPreset}
        onOpenPalette={() => setPaletteOpen(true)} />
      

      {route === "home" &&
      <Home variant="health" metrics={metrics} onOpen={setOpenM} onGoCatalog={() => setRoute("catalog")} />
      }
      {route === "graph" &&
      <GraphView
        metrics={metrics}
        filtered={filtered}
        onOpen={setOpenM}
        onOpenFilters={() => setFiltersOpen(true)}
        activeFilters={activeFilterCount}
        onClear={clearAllFilters} />
      }
      {route === "catalog" &&
      <main className="main">
        <ControlBar
          filtered={filtered}
          total={metrics.length}
          activeFilters={activeFilterCount}
          onOpenFilters={() => setFiltersOpen(true)}
          onClear={clearAllFilters}>
          {view === "grid" &&
            <div className="cbar__size mono">
              <span className="cbar__size-lbl">SIZE</span>
              {[
                { key: "compact", label: "S" },
                { key: "normal", label: "M" },
                { key: "spacious", label: "L" }
              ].map((opt) => (
                <button
                  key={opt.key}
                  className={cx("cbar__sizeb", density === opt.key && "cbar__sizeb--on")}
                  onClick={() => setDensity(opt.key)}
                  title={opt.key}>{opt.label}</button>
              ))}
            </div>
          }
          <div className="seg" title="View">
            <button className={cx("seg__b", view === "grid" && "seg__b--on")} onClick={() => setView("grid")} title="Grid"><GridIcon /></button>
            <button className={cx("seg__b", view === "list" && "seg__b--on")} onClick={() => setView("list")} title="List"><ListIcon /></button>
          </div>
        </ControlBar>

        {filtered.length === 0 ?
          <div className="empty">
            <div className="mono">0 matches</div>
            <button className="btn btn--ghost" onClick={clearAllFilters}>Reset filters</button>
          </div> :
          ["L1", "L2", "L3"].map((lv) => {
            const items = filteredByLevel[lv];
            if (!items.length) return null;
            const collapsed = catColl[lv];
            const title = lv === "L1" ? "Стратегические" : lv === "L2" ? "Операционные" : "Диагностические";
            return (
              <section key={lv} className={cx("catsec", collapsed && "catsec--coll")}>
                <button className="catsec__hdr" onClick={() => toggleCatColl(lv)}>
                  <span className="catsec__chev mono">{collapsed ? "▸" : "▾"}</span>
                  <span className={cx("catsec__lvl mono", `catsec__lvl--${lv.toLowerCase()}`)}>{lv}</span>
                  <span className="catsec__title">{title}</span>
                  <span className="catsec__n mono">{items.length}</span>
                </button>
                {!collapsed &&
                  <div className={cx("results", `results--${view}`)}>
                    {view === "list" && <ListHeader />}
                    {items.map((m) =>
                      <MetricCard
                        key={m.name}
                        m={m}
                        onOpen={() => setOpenM(m)}
                        showCta={true}
                        view={view}
                        saved={saved.has(m.name)}
                        onToggleSave={toggleSave}
                        onOpenSource={setSourceM}
                        selected={selected.has(m.name)}
                        onToggleSelect={toggleSelect} />
                    )}
                  </div>}
              </section>);
          })
        }
        <Footer metrics={metrics} filtered={filtered} />
      </main>
      }

      {route === "saved" &&
      <main className="main">
          <SavedView
          metrics={metrics.filter((m) => saved.has(m.name))}
          onOpen={setOpenM}
          onToggleSave={toggleSave}
          onOpenSource={setSourceM}
          saved={saved}
          selected={selected}
          onToggleSelect={toggleSelect}
          onGoCatalog={() => setRoute("catalog")} />
        
        </main>
      }

      {selected.size > 0 &&
      <CompareBar
        selectedNames={[...selected]}
        metrics={metrics}
        onClear={clearSelected}
        onRemove={toggleSelect}
        onCompare={() => setComparing(true)}
        max={MAX_COMPARE} />

      }

      {comparing && <CompareModal
        metrics={metrics.filter((m) => selected.has(m.name))}
        onClose={() => setComparing(false)}
        onRemove={toggleSelect} />
      }

      {(route === "catalog" || route === "graph") &&
        <FiltersDrawer
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          metrics={metrics}
          categories={categories}
          owners={owners}
          frequencies={frequencies}
          fAlert={fAlert} tAlert={toggle(setFAlert)}
          fLevel={fLevel} tLevel={toggle(setFLevel)}
          fPrio={fPrio} tPrio={toggle(setFPrio)}
          fOwner={fOwner} tOwner={toggle(setFOwner)}
          fFreq={fFreq} tFreq={toggle(setFFreq)}
          fCat={fCat} tCat={toggle(setFCat)}
          onClear={clearAllFilters} />
      }

      {openM && <Drawer metric={openM} onClose={() => setOpenM(null)} all={metrics} onOpenDep={openByName} saved={saved} onToggleSave={toggleSave} selected={selected} onToggleSelect={toggleSelect} />}
      {sourceM && <SourceModal metric={sourceM} onClose={() => setSourceM(null)} />}

      <CommandPalette
        metrics={metrics}
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onOpen={(m) => {setOpenM(m);setPaletteOpen(false);}}
        onRoute={(r) => {setRoute(r);setPaletteOpen(false);}}
        onToggleSave={toggleSave}
        onToggleSelect={toggleSelect}
        saved={saved}
        selected={selected} />

    </div>);

}

function TopBar({ route, setRoute, search, setSearch, n, total, savedCount, preset, setPreset, onOpenPalette }) {
  return (
    <header className="topbar">
      <div className="topbar__l">
        <div className="logo mono">
          <span className="logo__mark">◆</span>
          <span className="logo__name">ODIN</span>
          <span className="logo__sub">/ iGaming BI</span>
        </div>
        <nav className="nav mono">
          <button className={cx("navbtn", route === "home" && "navbtn--on")} onClick={() => setRoute("home")}>Home</button>
          <button className={cx("navbtn", route === "catalog" && "navbtn--on")} onClick={() => setRoute("catalog")}>Catalog</button>
          <button className={cx("navbtn", route === "graph" && "navbtn--on")} onClick={() => setRoute("graph")}>Graph</button>
          <button className={cx("navbtn", route === "saved" && "navbtn--on")} onClick={() => setRoute("saved")}>
            Saved{savedCount > 0 && <span className="navbtn__n mono"> {savedCount}</span>}
          </button>
        </nav>
      </div>
      <div className="topbar__c">
        <button className="search search--btn" onClick={onOpenPalette} title="Open command palette (⌘K)">
          <span className="search__icon mono">⌕</span>
          <span className="search__ph">Search metrics, pages…</span>
          <span className="search__k mono">⌘K</span>
        </button>
      </div>
      <div className="topbar__r mono">
        <div style={{
          display: "inline-flex",
          border: "1px solid var(--line-2)",
          borderRadius: 999,
          overflow: "hidden",
          height: 26,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: "0.08em",
          fontWeight: 600
        }}>
          {[
          { key: "dark-lime", label: "DARK", icon: "☽" },
          { key: "light-magenta", label: "LIGHT", icon: "☀" }].
          map((opt) => {
            const on = preset === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setPreset(opt.key)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "0 12px",
                  background: on ? "var(--accent)" : "transparent",
                  color: on ? "#000" : "var(--fg-3)",
                  border: 0,
                  borderRight: opt.key === "dark-lime" ? "1px solid var(--line-2)" : "0",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "inherit",
                  letterSpacing: "inherit",
                  fontWeight: "inherit",
                  height: "100%",
                  transition: "background 140ms, color 140ms"
                }}>
                
                <span style={{ fontSize: 12, lineHeight: 1 }}>{opt.icon}</span>
                {opt.label}
              </button>);

          })}
        </div>
        <span>{n}<span className="dim"> / {total}</span></span>
        <span className="dim">UPD 09:42</span>
        <span className="tick tick--on">● LIVE</span>
      </div>
    </header>);

}

function ThemeToggle({ tw, setTweak }) {
  const isLight = tw.preset === "light-magenta";
  return (
    <button
      className={cx("ttog", isLight && "ttog--light")}
      onClick={() => setTweak("preset", isLight ? "dark-lime" : "light-magenta")}
      title={isLight ? "Switch to dark" : "Switch to light"}
      aria-label="Toggle theme">

      <span className="ttog__icon ttog__icon--sun" aria-hidden>
        <svg viewBox="0 0 14 14" width="12" height="12"><circle cx="7" cy="7" r="2.5" fill="currentColor" /><g stroke="currentColor" strokeWidth="1" strokeLinecap="round"><path d="M7 1.5v1.5" /><path d="M7 11v1.5" /><path d="M1.5 7h1.5" /><path d="M11 7h1.5" /><path d="M3 3l1 1" /><path d="M10 10l1 1" /><path d="M11 3l-1 1" /><path d="M4 10l-1 1" /></g></svg>
      </span>
      <span className="ttog__knob">
        <span className="ttog__dot" />
      </span>
      <span className="ttog__icon ttog__icon--moon" aria-hidden>
        <svg viewBox="0 0 14 14" width="11" height="11"><path d="M11 8.5A4.5 4.5 0 0 1 5.5 3a4.5 4.5 0 1 0 5.5 5.5z" fill="currentColor" /></svg>
      </span>
    </button>);

}

function ListHeader() {
  return (
    <div className="row row--hdr mono">
      <span>LVL</span>
      <span>NAME</span>
      <span>CATEGORY</span>
      <span>PRIO</span>
      <span>FREQ</span>
      <span>OWNER</span>
      <span style={{ textAlign: "right" }}>VALUE</span>
      <span style={{ textAlign: "right" }}>Δ</span>
      <span>TREND</span>
      <span>!</span>
      <span style={{ textAlign: "center" }}>SAVE</span>
      <span style={{ textAlign: "center" }}>CMP</span>
    </div>);

}

function Footer({ metrics, filtered }) {
  return (
    <footer className="footer mono">
      <div>© Odin Catalog </div>
      <div>showing {filtered.length} / {metrics.length}</div>
      <div>benchmarks sourced from industry studies + internal data · values in cards are simulated for design preview</div>
    </footer>);

}

function GridIcon() {return <svg viewBox="0 0 12 12" width="12" height="12"><rect x="1" y="1" width="4" height="4" /><rect x="7" y="1" width="4" height="4" /><rect x="1" y="7" width="4" height="4" /><rect x="7" y="7" width="4" height="4" /></svg>;}
function ListIcon() {return <svg viewBox="0 0 12 12" width="12" height="12"><rect x="1" y="2" width="10" height="1.5" /><rect x="1" y="5.25" width="10" height="1.5" /><rect x="1" y="8.5" width="10" height="1.5" /></svg>;}

// ============ SAVED VIEW ============
function SavedView({ metrics, onOpen, onToggleSave, onOpenSource, saved, selected, onToggleSelect, onGoCatalog }) {
  const [mode, setMode] = useState("cards"); // cards | report
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkRange, setBulkRange] = useState("30d");
  const [bulkFormat, setBulkFormat] = useState("csv");
  const [bulkCut, setBulkCut] = useState("__all__");
  const [bulkFlash, setBulkFlash] = useState(false);

  // gather union of cut dimensions across saved metrics
  const allCuts = useMemo(() => {
    const s = new Set();
    metrics.forEach((m) => (m.ntags || []).forEach((t) => s.add(t)));
    return [...s];
  }, [metrics]);

  const bulkDownload = () => {
    const ranges = { "7d": 7, "14d": 14, "30d": 30, "90d": 90, "180d": 180, "365d": 365 };
    const days = ranges[bulkRange] || 30;
    const today = new Date();
    const todayMono = today.toISOString().slice(0, 10);

    const cutVals = (m) => {
      if (bulkCut === "__all__") return [null];
      if (!(m.ntags || []).includes(bulkCut)) return [null];
      if (bulkCut === "geo") return ["UK", "DE", "BR", "ZA"];
      if (bulkCut === "продукт") return ["casino", "sports", "live"];
      if (bulkCut === "канал") return ["paid", "organic", "affiliate"];
      return ["seg-A", "seg-B", "seg-C"];
    };

    if (bulkFormat === "csv") {
      const header = ["date", "metric", "value", "level", "category", "owner", "status"];
      if (bulkCut !== "__all__") header.push("cut_dimension", "cut_value");
      const rows = [header.join(",")];
      metrics.forEach((m) => {
        let seed = 0;
        for (let i = 0; i < m.name.length; i++) seed = seed * 31 + m.name.charCodeAt(i) | 0;
        const sev = sevBadge(m.name) || "ok";
        const cuts = cutVals(m);
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(today);d.setDate(today.getDate() - i);
          const ds = d.toISOString().slice(0, 10);
          cuts.forEach((cv) => {
            seed = seed * 1103515245 + 12345 & 0x7fffffff;
            const base = seed % 1000 / 10;
            const val = (base + (cv ? cv.length * 3 : 0)).toFixed(2);
            const row = [ds, `"${m.name}"`, val, m.level, `"${m.cat}"`, m.owner, sev];
            if (cv !== null) row.push(bulkCut, cv);else
            if (bulkCut !== "__all__") row.push(bulkCut, "");
            rows.push(row.join(","));
          });
        }
      });
      const blob = new Blob([rows.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `saved_metrics_${bulkRange}${bulkCut !== "__all__" ? "_by_" + bulkCut : ""}_${todayMono}.csv`;
      document.body.appendChild(a);a.click();document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const out = metrics.map((m) => {
        let seed = 0;
        for (let i = 0; i < m.name.length; i++) seed = seed * 31 + m.name.charCodeAt(i) | 0;
        const series = [];
        const cuts = cutVals(m);
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(today);d.setDate(today.getDate() - i);
          const ds = d.toISOString().slice(0, 10);
          cuts.forEach((cv) => {
            seed = seed * 1103515245 + 12345 & 0x7fffffff;
            const base = seed % 1000 / 10;
            const val = +(base + (cv ? cv.length * 3 : 0)).toFixed(2);
            const point = { date: ds, value: val };
            if (cv !== null) point[bulkCut] = cv;
            series.push(point);
          });
        }
        return { metric: m.name, level: m.level, category: m.cat, owner: m.owner, status: sevBadge(m.name) || "ok", series };
      });
      const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `saved_metrics_${bulkRange}${bulkCut !== "__all__" ? "_by_" + bulkCut : ""}_${todayMono}.json`;
      document.body.appendChild(a);a.click();document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    setBulkFlash(true);
    setTimeout(() => {setBulkFlash(false);setBulkOpen(false);}, 1200);
  };

  if (metrics.length === 0) {
    return (
      <div className="saved-empty">
        <div className="saved-empty__mark mono">★</div>
        <div className="saved-empty__t">No saved metrics yet</div>
        <div className="saved-empty__s mono">Hit the <span className="saved-empty__plus">+</span> on any metric card to pin it here.</div>
        <button className="btn btn--ghost" onClick={onGoCatalog}>Browse catalog →</button>
      </div>);

  }
  return (
    <>
      <div className="saved-hdr">
        <div>
          <div className="saved-hdr__k mono">SAVED METRICS</div>
          <div className="saved-hdr__t">{metrics.length} pinned</div>
        </div>
        <div className="saved-hdr__r mono">
          <div className={cx("bulkx", bulkOpen && "bulkx--open")}>
            <button
              className="btn btn--ghost bulkx__btn"
              onClick={() => setBulkOpen((v) => !v)}
              title="Bulk export historical data">
              ↓ Bulk export</button>
            {bulkOpen &&
            <div className="xpop xpop--bulk" onClick={(e) => e.stopPropagation()}>
                <div className="xpop__hdr mono">EXPORT HISTORICAL · {metrics.length} METRICS</div>
                <div className="xpop__row">
                  <label className="xpop__lbl mono">Range</label>
                  <div className="xpop__seg">
                    {["7d", "14d", "30d", "90d", "180d", "365d"].map((r) =>
                  <button key={r} className={cx("xpop__segb mono", bulkRange === r && "xpop__segb--on")} onClick={() => setBulkRange(r)}>{r.toUpperCase()}</button>)}
                  </div>
                </div>
                <div className="xpop__row">
                  <label className="xpop__lbl mono">Cut</label>
                  <div className="xpop__seg xpop__seg--wrap">
                    <button className={cx("xpop__segb mono", bulkCut === "__all__" && "xpop__segb--on")} onClick={() => setBulkCut("__all__")}>TOTAL</button>
                    {allCuts.map((c) =>
                  <button key={c} className={cx("xpop__segb mono", bulkCut === c && "xpop__segb--on")} onClick={() => setBulkCut(c)}>{c.toUpperCase()}</button>)}
                  </div>
                </div>
                <div className="xpop__row">
                  <label className="xpop__lbl mono">Format</label>
                  <div className="xpop__seg">
                    {["csv", "json"].map((f) =>
                  <button key={f} className={cx("xpop__segb mono", bulkFormat === f && "xpop__segb--on")} onClick={() => setBulkFormat(f)}>{f.toUpperCase()}</button>)}
                  </div>
                </div>
                <button className="btn btn--primary xpop__go" onClick={bulkDownload}>
                  {bulkFlash ? "✓ Downloaded" : `Download · ${bulkFormat.toUpperCase()}`}
                </button>
                <div className="xpop__hint mono">
                  Mock data for prototype. {bulkCut !== "__all__" ? `Metrics without cut "${bulkCut}" will export as total.` : "Use Cut to split by dimension."}
                </div>
              </div>}
          </div>
          <div className="segtoggle">
            <button className={cx("segtoggle__b", mode === "cards" && "segtoggle__b--on")} onClick={() => setMode("cards")}>Cards</button>
            <button className={cx("segtoggle__b", mode === "report" && "segtoggle__b--on")} onClick={() => setMode("report")}>Report ✦</button>
          </div>
        </div>
      </div>
      {mode === "cards" ?
      <div className="results results--grid">
          {metrics.map((m) =>
        <MetricCard
          key={m.name}
          m={m}
          onOpen={() => onOpen(m)}
          showCta={true}
          view="grid"
          saved={true}
          onToggleSave={onToggleSave}
          onOpenSource={onOpenSource}
          selected={selected?.has(m.name)}
          onToggleSelect={onToggleSelect} />

        )}
        </div> :
      <SavedReport metrics={metrics} onOpen={onOpen} />}
    </>);

}

// ============ SAVED REPORT ============
function SavedReport({ metrics, onOpen }) {
  const [range, setRange] = useState("30d");
  const [sections, setSections] = useState({
    cover: true,
    snapshot: true,
    watchlist: true,
    what: true,
    formula: true,
    bench: true,
    thresh: true,
    traps: false,
    fix: false
  });
  const [flash, setFlash] = useState("");

  const toggleSec = (k) => setSections((s) => ({ ...s, [k]: !s[k] }));

  const stats = useMemo(() => {
    const byLvl = { L1: 0, L2: 0, L3: 0 };
    const byPrio = { Must: 0, Should: 0, Nice: 0 };
    const owners = new Set();
    const cats = new Set();
    let red = 0,yel = 0;
    metrics.forEach((m) => {
      byLvl[m.level]++;
      byPrio[m.prio]++;
      owners.add(m.owner);
      cats.add(m.cat);
      const s = sevBadge(m.name);
      if (s === "red") red++;else
      if (s === "yel") yel++;
    });
    return { byLvl, byPrio, owners: [...owners], cats: [...cats], red, yel, green: metrics.length - red - yel };
  }, [metrics]);

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const todayMono = new Date().toISOString().slice(0, 10);

  // Build combined markdown
  const buildCombinedMarkdown = () => {
    const L = [];
    L.push(`# Metrics Report · ${todayMono}`);
    L.push("");
    L.push(`*Horizon: ${range.toUpperCase()} · ${metrics.length} metrics · ${stats.red} red · ${stats.yel} yellow · ${stats.green} ok*`);
    L.push("");
    L.push(`Generated from Odin Catalog. Scope: **${stats.cats.join(", ")}**. Owners: ${stats.owners.join(", ")}.`);
    L.push("");
    if (sections.snapshot) {
      L.push("## Snapshot");
      L.push("| Metric | Lvl | Prio | Current | WoW | Status |");
      L.push("|---|---|---|---|---|---|");
      metrics.forEach((m) => {
        const s = sevBadge(m.name);
        const status = s === "red" ? "🔴 RED" : s === "yel" ? "🟡 YEL" : "🟢 OK";
        const wow = fakeDelta(m.name, "wow");
        L.push(`| ${m.name} | ${m.level} | ${m.prio} | ${fakeValue(m)} | ${wow >= 0 ? "▲" : "▼"}${Math.abs(wow).toFixed(1)}% | ${status} |`);
      });
      L.push("");
    }
    if (sections.watchlist) {
      const alerts = metrics.filter((m) => sevBadge(m.name));
      if (alerts.length) {
        L.push("## Watchlist");
        alerts.forEach((m) => {
          const s = sevBadge(m.name);
          L.push(`- **${m.name}** (${m.level}, ${m.owner}) — ${s === "red" ? "🔴 " + (m.red || "threshold breach") : "🟡 " + (m.yellow || "warning")}`);
        });
        L.push("");
      }
    }
    metrics.forEach((m) => {
      L.push(`---`);
      L.push("");
      L.push(`## ${m.name}`);
      L.push(`*${m.cat} · ${m.level} · ${m.prio} · ${m.freq} · owner: ${m.owner}*`);
      L.push("");
      if (sections.what && m.imp) {L.push(`### What & why`);L.push(m.imp);L.push("");}
      if (sections.formula && m.formula) {L.push(`### Formula`);L.push("```");L.push(m.formula);L.push("```");L.push("");}
      if (sections.bench) {L.push(`### Benchmarks`);L.push(`- T1: ${m.b1 || "—"}`);L.push(`- T2: ${m.b2 || "—"}`);L.push(`- T3: ${m.b3 || "—"}`);L.push("");}
      if (sections.thresh) {L.push(`### Thresholds`);L.push(`- 🔴 ${m.red || "—"}`);L.push(`- 🟡 ${m.yellow || "—"}`);L.push("");}
      if (sections.traps && m.traps?.length) {L.push(`### Traps`);m.traps.forEach((t) => L.push(`- ${t}`));L.push("");}
      if (sections.fix && m.fix?.length) {L.push(`### How to fix`);m.fix.forEach((t) => L.push(`- ${t}`));L.push("");}
    });
    return L.join("\n");
  };

  const copyReport = async () => {
    const md = buildCombinedMarkdown();
    try {await navigator.clipboard.writeText(md);}
    catch {/* ignore */}
    setFlash("copied");
    setTimeout(() => setFlash(""), 1500);
  };

  const downloadReport = (fmt) => {
    const md = buildCombinedMarkdown();
    const content = fmt === "md" ? md : fmt === "json" ? JSON.stringify(metrics, null, 2) : "";
    const blob = new Blob([content], { type: fmt === "md" ? "text/markdown" : "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;a.download = `metrics_report_${todayMono}.${fmt}`;
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setFlash(fmt);
    setTimeout(() => setFlash(""), 1500);
  };

  const downloadAllCsv = () => {
    const ranges = { "7d": 7, "14d": 14, "30d": 30, "90d": 90, "180d": 180, "365d": 365 };
    const days = ranges[range] || 30;
    const rows = [["date", "metric", "value", "level", "category", "owner", "status"].join(",")];
    const today = new Date();
    metrics.forEach((m) => {
      let seed = 0;
      for (let i = 0; i < m.name.length; i++) seed = seed * 31 + m.name.charCodeAt(i) | 0;
      const sev = sevBadge(m.name) || "ok";
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);d.setDate(today.getDate() - i);
        seed = seed * 1103515245 + 12345 & 0x7fffffff;
        const value = (seed % 1000 / 10).toFixed(2);
        rows.push([d.toISOString().slice(0, 10), m.name, value, m.level, m.cat, m.owner, sev].join(","));
      }
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;a.download = `metrics_historical_${range}_${todayMono}.csv`;
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setFlash("csv");
    setTimeout(() => setFlash(""), 1500);
  };

  const printReport = () => window.print();

  const alerts = metrics.filter((m) => sevBadge(m.name));

  return (
    <div className="rpt">
      {/* Control panel */}
      <aside className="rpt__ctrl no-print">
        <div className="rpt__ctrlblk">
          <div className="rpt__ctrllbl mono">HORIZON</div>
          <div className="rpt__seg">
            {["7d", "14d", "30d", "90d", "180d", "365d"].map((r) =>
            <button key={r} className={cx("rpt__segb mono", range === r && "rpt__segb--on")} onClick={() => setRange(r)}>{r.toUpperCase()}</button>)}
          </div>
        </div>
        <div className="rpt__ctrlblk">
          <div className="rpt__ctrllbl mono">SECTIONS</div>
          <div className="rpt__toggles">
            {[
            ["cover", "Cover"],
            ["snapshot", "Snapshot table"],
            ["watchlist", "Watchlist"],
            ["what", "What & why"],
            ["formula", "Formula"],
            ["bench", "Benchmarks"],
            ["thresh", "Thresholds"],
            ["traps", "Traps"],
            ["fix", "How to fix"]].
            map(([k, label]) =>
            <label key={k} className={cx("rpt__tog", sections[k] && "rpt__tog--on")}>
                <input type="checkbox" checked={sections[k]} onChange={() => toggleSec(k)} />
                <span className="rpt__togbox" />
                <span className="rpt__toglbl">{label}</span>
              </label>)}
          </div>
        </div>
        <div className="rpt__ctrlblk">
          <div className="rpt__ctrllbl mono">EXPORT</div>
          <div className="rpt__expgrid">
            <button className={cx("btn btn--primary rpt__expb", flash === "copied" && "rpt__expb--ok")} onClick={copyReport}>
              {flash === "copied" ? "✓ Copied" : "⎘ Copy Markdown"}
            </button>
            <button className={cx("btn btn--ghost rpt__expb", flash === "md" && "rpt__expb--ok")} onClick={() => downloadReport("md")}>
              {flash === "md" ? "✓ Downloaded" : "↓ Report .md"}
            </button>
            <button className={cx("btn btn--ghost rpt__expb", flash === "csv" && "rpt__expb--ok")} onClick={downloadAllCsv}>
              {flash === "csv" ? "✓ Downloaded" : "↓ Historical .csv"}
            </button>
            <button className={cx("btn btn--ghost rpt__expb", flash === "json" && "rpt__expb--ok")} onClick={() => downloadReport("json")}>
              {flash === "json" ? "✓ Downloaded" : "↓ Spec .json"}
            </button>
            <button className="btn btn--ghost rpt__expb" onClick={printReport}>🖨 Print / PDF</button>
          </div>
        </div>
      </aside>

      {/* Report document */}
      <article className="rpt__doc">
        {sections.cover &&
        <header className="rpt__cover">
            <div className="rpt__kicker mono">ODIN · METRICS REPORT</div>
            <h1 className="rpt__title">Saved metrics digest</h1>
            <div className="rpt__dateline mono">{today.toUpperCase()} · horizon {range.toUpperCase()}</div>
            <div className="rpt__coverstats">
              <div className="rptstat"><div className="rptstat__v mono">{metrics.length}</div><div className="rptstat__k mono">METRICS</div></div>
              <div className="rptstat"><div className="rptstat__v mono">{stats.byLvl.L1}/{stats.byLvl.L2}/{stats.byLvl.L3}</div><div className="rptstat__k mono">L1 / L2 / L3</div></div>
              <div className="rptstat"><div className="rptstat__v mono">{stats.byPrio.Must}/{stats.byPrio.Should}/{stats.byPrio.Nice}</div><div className="rptstat__k mono">MUST / SHOULD / NICE</div></div>
              <div className="rptstat"><div className={cx("rptstat__v mono", stats.red > 0 && "rptstat__v--red")}>{stats.red}</div><div className="rptstat__k mono">RED</div></div>
              <div className="rptstat"><div className={cx("rptstat__v mono", stats.yel > 0 && "rptstat__v--yel")}>{stats.yel}</div><div className="rptstat__k mono">YEL</div></div>
              <div className="rptstat"><div className="rptstat__v mono rptstat__v--grn">{stats.green}</div><div className="rptstat__k mono">OK</div></div>
            </div>
            <div className="rpt__coverscope">
              <div><span className="rpt__scopek mono">CATEGORIES</span><span className="rpt__scopev">{stats.cats.join(" · ")}</span></div>
              <div><span className="rpt__scopek mono">OWNERS</span><span className="rpt__scopev">{stats.owners.join(" · ")}</span></div>
            </div>
          </header>}

        {sections.snapshot &&
        <section className="rpt__sec">
            <div className="rpt__secnum mono">01</div>
            <h2 className="rpt__sech">Snapshot</h2>
            <div className="rpttbl-wrap">
              <table className="rpttbl">
                <thead>
                  <tr><th>Metric</th><th>Lvl</th><th>Prio</th><th className="r">Current</th><th className="r">WoW</th><th className="r">MoM</th><th>Spark</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {metrics.map((m) => {
                  const s = sevBadge(m.name);
                  const wow = fakeDelta(m.name, "wow");
                  const mom = fakeDelta(m.name, "mom");
                  return (
                    <tr key={m.name} onClick={() => onOpen(m)} className="rpttbl__row">
                        <td><span className="rpttbl__name">{m.name}</span><div className="rpttbl__cat mono">{m.cat}</div></td>
                        <td><span className={cx("mini", `mini--${levelColor[m.level]}`)}>{m.level}</span></td>
                        <td><span className={cx("tag tag--sm", `tag--${prioColor[m.prio]}`)}>{m.prio}</span></td>
                        <td className={cx("r mono", s && `rpttbl__val--${s}`)}>{fakeValue(m)}</td>
                        <td className={cx("r mono", wow >= 0 ? "up" : "down")}>{wow >= 0 ? "▲" : "▼"}{Math.abs(wow).toFixed(1)}%</td>
                        <td className={cx("r mono", mom >= 0 ? "up" : "down")}>{mom >= 0 ? "▲" : "▼"}{Math.abs(mom).toFixed(1)}%</td>
                        <td><svg className="rpttbl__spark" viewBox="0 0 60 16" preserveAspectRatio="none"><path d={sparkPath(m.name + "_rpt", 60, 16)} /></svg></td>
                        <td>{s ? <span className={cx("tag tag--sm", `tag--sev-${s}`)}>{s === "red" ? "RED" : "YEL"}</span> : <span className="rpttbl__ok mono">ok</span>}</td>
                      </tr>);
                })}
                </tbody>
              </table>
            </div>
          </section>}

        {sections.watchlist && alerts.length > 0 &&
        <section className="rpt__sec">
            <div className="rpt__secnum mono">02</div>
            <h2 className="rpt__sech">Watchlist · {alerts.length} alert{alerts.length === 1 ? "" : "s"}</h2>
            <div className="rpt__wlist">
              {alerts.map((m) => {
              const s = sevBadge(m.name);
              return (
                <div key={m.name} className={cx("rpt__wl", `rpt__wl--${s}`)}>
                    <span className={cx("rpt__wlsev mono", `rpt__wlsev--${s}`)}>{s === "red" ? "RED" : "YEL"}</span>
                    <div className="rpt__wlbody">
                      <div className="rpt__wlname">{m.name}</div>
                      <div className="rpt__wlmeta mono">{m.level} · {m.cat} · owner {m.owner}</div>
                      <div className="rpt__wlreason">{s === "red" ? m.red : m.yellow}</div>
                    </div>
                  </div>);
            })}
            </div>
          </section>}

        {metrics.map((m, idx) =>
        <section key={m.name} className="rpt__sec rpt__sec--metric">
            <div className="rpt__secnum mono">{String(idx + 1).padStart(2, "0")}</div>
            <h2 className="rpt__sech rpt__sech--metric">
              {m.name}
              <button className="rpt__open mono no-print" onClick={() => onOpen(m)} title="Open full drawer">↗ open</button>
            </h2>
            <div className="rpt__metricmeta mono">
              <span className={cx("mini", `mini--${levelColor[m.level]}`)}>{m.level}</span>
              <span className={cx("tag tag--sm", `tag--${prioColor[m.prio]}`)}>{m.prio}</span>
              <span>{m.freq}</span>
              <span>·</span>
              <span>{m.cat}</span>
              <span>·</span>
              <span>owner · {m.owner}</span>
            </div>

            {sections.what && m.imp &&
          <div className="rpt__subsec"><div className="rpt__subk mono">WHAT & WHY</div><p className="rpt__prose">{m.imp}</p></div>}
            {sections.formula && m.formula &&
          <div className="rpt__subsec"><div className="rpt__subk mono">FORMULA</div><div className="rpt__formula mono">{m.formula}</div></div>}
            {sections.bench &&
          <div className="rpt__subsec"><div className="rpt__subk mono">BENCHMARKS</div>
                <div className="rpt__bench">
                  <div className="rpt__benchrow"><span className="rpt__bencht mono">T1</span><span className="rpt__benchv mono">{m.b1 || "—"}</span></div>
                  <div className="rpt__benchrow"><span className="rpt__bencht mono">T2</span><span className="rpt__benchv mono">{m.b2 || "—"}</span></div>
                  <div className="rpt__benchrow"><span className="rpt__bencht mono">T3</span><span className="rpt__benchv mono">{m.b3 || "—"}</span></div>
                </div>
              </div>}
            {sections.thresh &&
          <div className="rpt__subsec"><div className="rpt__subk mono">THRESHOLDS</div>
                <div className="rpt__thresh">
                  <div className="rpt__thline rpt__thline--red"><span className="rpt__thl mono">RED</span><span className="rpt__thv mono">{m.red || "—"}</span></div>
                  <div className="rpt__thline rpt__thline--yel"><span className="rpt__thl mono">YEL</span><span className="rpt__thv mono">{m.yellow || "—"}</span></div>
                </div>
              </div>}
            {sections.traps && m.traps?.length > 0 &&
          <div className="rpt__subsec"><div className="rpt__subk mono">TRAPS</div>
                <ul className="rpt__list">{m.traps.map((t, i) => <li key={i}>{t}</li>)}</ul>
              </div>}
            {sections.fix && m.fix?.length > 0 &&
          <div className="rpt__subsec"><div className="rpt__subk mono">HOW TO FIX</div>
                <ul className="rpt__list">{m.fix.map((t, i) => <li key={i}>→ {t}</li>)}</ul>
              </div>}
          </section>)}

        <footer className="rpt__foot mono">
          End of report · generated {todayMono} · Odin Catalog
        </footer>
      </article>
    </div>);
}

// ============ SOURCE MODAL ============
function SourceModal({ metric, onClose }) {
  useEffect(() => {
    const h = (e) => {if (e.key === "Escape") onClose();};
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  // Deterministic pseudo-source based on metric name/category
  const slug = metric.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const catSlug = (metric.cat || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const urls = [
  { tool: "Looker", url: `https://looker.odin-gaming.internal/dashboards/metrics/${slug}`, primary: true },
  { tool: "Metabase", url: `https://bi.odin-gaming.internal/question/${slug}?freq=${encodeURIComponent(metric.freq || "Daily")}` },
  { tool: "Notion spec", url: `https://notion.so/odin/metrics/${catSlug}/${slug}` }];


  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__hdr">
          <div className="modal__k mono">SOURCE / DASHBOARD</div>
          <button className="modal__x mono" onClick={onClose}>ESC</button>
        </div>
        <div className="modal__body">
          <div className="modal__metric">
            <div className="modal__name">{metric.name}</div>
            <div className="modal__meta mono">
              <span>{metric.level}</span>
              <span className="dim">·</span>
              <span>{metric.cat}</span>
              <span className="dim">·</span>
              <span>{metric.freq}</span>
            </div>
          </div>
          <div className="modal__links">
            {urls.map((u) =>
            <a key={u.tool} href={u.url} target="_blank" rel="noopener noreferrer" className={cx("srcLink", u.primary && "srcLink--primary")}>
                <div className="srcLink__tool mono">{u.tool}</div>
                <div className="srcLink__url mono">{u.url}</div>
                <div className="srcLink__arr">↗</div>
              </a>
            )}
          </div>
          <div className="modal__hint mono dim">
            Ссылки — демонстрационные. В проде сюда подтянутся реальные URL из <code>metric.sources[]</code>.
          </div>
        </div>
      </div>
    </div>);

}

// ============ COMPARE BAR ============
function CompareBar({ selectedNames, metrics, onClear, onRemove, onCompare, max }) {
  const items = selectedNames.
  map((n) => metrics.find((m) => m.name === n)).
  filter(Boolean);
  return (
    <div className="cmpbar">
      <div className="cmpbar__l">
        <div className="cmpbar__k mono">COMPARE</div>
        <div className="cmpbar__n mono">{items.length}/{max}</div>
        <div className="cmpbar__chips">
          {items.map((m) =>
          <span key={m.name} className="cmpbar__chip">
              <span className={cx("cmpbar__lvl", `tag--${{ L1: "l1", L2: "l2", L3: "l3" }[m.level] || "l3"}`)}>{m.level}</span>
              <span className="cmpbar__cname">{m.name}</span>
              <button className="cmpbar__x" onClick={() => onRemove(m.name)} aria-label="Remove">×</button>
            </span>
          )}
        </div>
      </div>
      <div className="cmpbar__r">
        <button className="btn btn--ghost btn--sm" onClick={onClear}>clear</button>
        <button className="btn btn--solid btn--sm" onClick={onCompare} disabled={items.length < 2}>
          Compare →
        </button>
      </div>
    </div>);

}

// ============ COMPARE MODAL ============
function CompareModal({ metrics, onClose, onRemove }) {
  useEffect(() => {
    const h = (e) => {if (e.key === "Escape") onClose();};
    document.addEventListener("keydown", h);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {document.removeEventListener("keydown", h);document.body.style.overflow = prev;};
  }, [onClose]);

  const [copied, setCopied] = useState(false);
  const exportMD = async () => {
    const parts = metrics.map((m) => buildMetricMarkdown(m));
    const full = `# Compare — ${metrics.length} metrics\n\n` +
    `> ${metrics.map((m) => m.name).join(" · ")}\n\n` +
    `---\n\n` + parts.join("\n\n---\n\n");
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = full;document.body.appendChild(ta);
      ta.select();try {document.execCommand("copy");setCopied(true);setTimeout(() => setCopied(false), 1800);} catch {}
      document.body.removeChild(ta);
    }
  };

  const rows = [
  { k: "level", label: "Level", render: (m) => <span className={cx("tag tag--lvl", `tag--${{ L1: "l1", L2: "l2", L3: "l3" }[m.level]}`)}>{m.level}</span> },
  { k: "prio", label: "Priority", render: (m) => <span className={cx("mono", `txt--${{ Must: "red", Should: "yellow", Nice: "dim" }[m.prio]}`)}>{m.prio}</span> },
  { k: "cat", label: "Category", render: (m) => <span>{m.cat}</span> },
  { k: "owner", label: "Owner", render: (m) => <span>{m.owner}</span> },
  { k: "freq", label: "Frequency", render: (m) => <span className="mono">{m.freq}</span> },
  { k: "source", label: "Source", render: (m) => <span className="mono dim">{m.source || "—"}</span> },
  { k: "imp", label: "Why it matters", render: (m) => <span className="dim">{m.imp}</span>, wrap: true },
  { k: "formula", label: "Formula", render: (m) => <code className="code-inl">{m.formula}</code>, wrap: true },
  { k: "numden", label: "Numerator / Denominator", render: (m) => <span className="mono dim">{m.num} / {m.den}</span> },
  { k: "b1", label: "Benchmark T1", render: (m) => <span className="mono">{m.b1}</span> },
  { k: "b2", label: "Benchmark T2", render: (m) => <span className="mono">{m.b2}</span> },
  { k: "b3", label: "Benchmark T3", render: (m) => <span className="mono">{m.b3}</span> },
  { k: "red", label: "Red threshold", render: (m) => <span className="mono txt--red">{m.red}</span> },
  { k: "yellow", label: "Yellow threshold", render: (m) => <span className="mono txt--yellow">{m.yellow}</span> },
  { k: "traps", label: "Common traps", render: (m) => <ul className="cmp-ul">{(m.traps || []).map((t, i) => <li key={i}>{t}</li>)}</ul>, wrap: true },
  { k: "fix", label: "How to fix", render: (m) => <ul className="cmp-ul">{(m.fix || []).map((t, i) => <li key={i}>{t}</li>)}</ul>, wrap: true },
  { k: "deps", label: "Dependencies", render: (m) => <div className="cmp-deps">{(m.deps || []).map((d, i) => <span key={i} className="cmp-dep mono">{d}</span>)}</div>, wrap: true },
  { k: "tags", label: "Tags", render: (m) => <div className="cmp-deps">{(m.tags || []).map((t, i) => <span key={i} className="cmp-dep mono">{t}</span>)}</div> }];


  return (
    <div className="modal-backdrop modal-backdrop--full" onClick={onClose}>
      <div className="cmp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cmp-modal__hdr">
          <div>
            <div className="cmp-modal__k mono">COMPARE METRICS</div>
            <div className="cmp-modal__t">{metrics.length} metrics side-by-side</div>
          </div>
          <div className="cmp-modal__hdra">
            <button
              className={cx("drawer__copy", copied && "drawer__copy--ok")}
              onClick={exportMD}
              title="Copy all specs as Markdown">
              {copied ? "✓ Copied" : "⎘ Export MD"}</button>
            <button className="modal__x mono" onClick={onClose}>ESC</button>
          </div>
        </div>
        <div className="cmp-modal__body">
          <div className="cmp-table" style={{ "--cmp-cols": metrics.length }}>
            <div className="cmp-row cmp-row--hdr">
              <div className="cmp-cell cmp-cell--label"></div>
              {metrics.map((m) =>
              <div key={m.name} className="cmp-cell cmp-cell--mhdr">
                  <div className="cmp-cell__name">{m.name}</div>
                  <button className="cmp-cell__x mono" onClick={() => onRemove(m.name)} title="Remove">×</button>
                </div>
              )}
            </div>
            {rows.map((r) =>
            <div key={r.k} className={cx("cmp-row", r.wrap && "cmp-row--wrap")}>
                <div className="cmp-cell cmp-cell--label mono">{r.label}</div>
                {metrics.map((m) =>
              <div key={m.name} className="cmp-cell">
                    {r.render(m)}
                  </div>
              )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>);

}

export default App;