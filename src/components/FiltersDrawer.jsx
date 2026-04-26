// FiltersDrawer — single drawer used by both Catalog and Graph.
// Section order is fixed: Alerts → Level → Priority → Owner → Freq → Category.
// All filters are Set-based; an empty Set means "no filter applied".

import { useEffect, useState } from 'react';
import { cx, sevBadge } from '../lib/util.js';

function Chip({ active, children, onClick, count, dim }) {
  return (
    <button className={cx("chip", active && "chip--on", dim && "chip--dim")} onClick={onClick}>
      <span>{children}</span>
      {count != null && <span className="chip__n">{count}</span>}
    </button>);
}

function FilterGroup({ id, label, options, active, toggle, counts, defaultOpen = true, dim }) {
  const storageKey = `odin.fbar.${id}`;
  const [open, setOpen] = useState(() => {
    try { const v = localStorage.getItem(storageKey); return v === null ? defaultOpen : v !== "0"; }
    catch { return defaultOpen; }
  });
  const onToggle = () => {
    setOpen((v) => {
      try { localStorage.setItem(storageKey, v ? "0" : "1"); } catch {}
      return !v;
    });
  };
  const activeOpts = options.filter((o) => active.has(o));
  const visible = open ? options : activeOpts;
  return (
    <div className="fbar__group fbar__group--coll">
      <button
        className={cx("fbar__toggle mono", open && "fbar__toggle--on", activeOpts.length && "fbar__toggle--active")}
        onClick={onToggle}
        title={open ? `Collapse ${label}` : `Expand ${label}`}>
        <span className="fbar__tchev">{open ? "▾" : "▸"}</span>
        {label}
        {!open && <span className="fbar__tcount">{activeOpts.length ? `${activeOpts.length}/${options.length}` : options.length}</span>}
      </button>
      {visible.map((opt) => {
        const n = counts ? counts(opt) : undefined;
        return <Chip key={opt} active={active.has(opt)} onClick={() => toggle(opt)} count={n} dim={dim}>{opt}</Chip>;
      })}
    </div>);
}

function FiltersDrawer({
  open, onClose,
  metrics,
  categories, owners, frequencies,
  fAlert, tAlert,
  fLevel, tLevel,
  fPrio, tPrio,
  fOwner, tOwner,
  fFreq, tFreq,
  fCat, tCat,
  onClear,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const alertOpts = ["red", "yel", "ok"];
  const alertLabels = { red: "Red", yel: "Yel", ok: "OK" };
  const alertCounts = (a) => metrics.filter((m) => (sevBadge(m.name) || "ok") === a).length;

  const activeCount =
    fAlert.size + fLevel.size + fPrio.size + fOwner.size + fFreq.size + fCat.size;
  const fullCount =
    alertOpts.length + 3 + 3 + owners.length + frequencies.length + categories.length;
  const hasActive = activeCount > 0 && activeCount < fullCount;

  return (
    <>
      <div
        className={cx("fdrw-scrim", open && "fdrw-scrim--on")}
        onClick={onClose}
        aria-hidden={!open} />
      <aside className={cx("fdrw", open && "fdrw--on")} aria-hidden={!open}>
        <div className="fdrw__hdr">
          <div className="fdrw__hdr-l mono">
            <span className="fdrw__hdr-lbl">FILTERS</span>
            {hasActive && <span className="fdrw__hdr-n">{activeCount}</span>}
          </div>
          {hasActive &&
            <button className="fdrw__reset mono" onClick={onClear}>reset</button>}
          <button className="fdrw__close" onClick={onClose} title="Close (Esc)">×</button>
        </div>
        <div className="fdrw__body">
          <FilterGroup
            id="alert" label="ALERTS" options={alertOpts} active={fAlert} toggle={tAlert}
            counts={alertCounts} defaultOpen={true} />
          <FilterGroup
            id="level" label="LEVEL" options={["L1", "L2", "L3"]} active={fLevel} toggle={tLevel}
            counts={(l) => metrics.filter((m) => m.level === l).length} defaultOpen={true} />
          <FilterGroup
            id="prio" label="PRIORITY" options={["Must", "Should", "Nice"]} active={fPrio} toggle={tPrio}
            counts={(p) => metrics.filter((m) => m.prio === p).length} defaultOpen={true} />
          <FilterGroup
            id="owner" label="OWNER" options={owners} active={fOwner} toggle={tOwner}
            counts={(o) => metrics.filter((m) => m.owner === o).length} defaultOpen={false} dim />
          <FilterGroup
            id="freq" label="FREQ" options={frequencies} active={fFreq} toggle={tFreq}
            counts={(f) => metrics.filter((m) => m.freq === f).length} defaultOpen={true} />
          <FilterGroup
            id="cat" label="CATEGORY" options={categories} active={fCat} toggle={tCat}
            counts={(c) => metrics.filter((m) => m.cat === c).length} defaultOpen={false} />
        </div>
      </aside>
    </>);
}

export { FiltersDrawer, FilterGroup, Chip };
