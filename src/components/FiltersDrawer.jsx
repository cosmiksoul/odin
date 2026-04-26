// FiltersDrawer — single drawer used by both Catalog and Graph.
// Section order is fixed: Alerts → Level → Priority → Owner → Freq → Category.
// All filters are Set-based; an empty Set means "no filter applied".

import { useEffect, useMemo, useState } from 'react';
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

// Cascading counts pattern: each filter group's counts are computed against
// metrics filtered by all OTHER active filters — so picking L1 narrows the
// counts shown in PRIORITY/OWNER/CATEGORY/FREQ/ALERTS, but LEVEL itself still
// shows the full L1/L2/L3 distribution (otherwise the unselected levels would
// always read 0 and the user couldn't pivot).
function passesExcept(m, except, f) {
  if (except !== "alert" && f.fAlert.size && !f.fAlert.has(sevBadge(m.name) || "ok")) return false;
  if (except !== "level" && f.fLevel.size && !f.fLevel.has(m.level)) return false;
  if (except !== "prio" && f.fPrio.size && !f.fPrio.has(m.prio)) return false;
  if (except !== "owner" && f.fOwner.size && !f.fOwner.has(m.owner)) return false;
  if (except !== "freq" && f.fFreq.size && !f.fFreq.has(m.freq)) return false;
  if (except !== "cat" && f.fCat.size && !f.fCat.has(m.cat)) return false;
  return true;
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

  const filterState = { fAlert, fLevel, fPrio, fOwner, fFreq, fCat };
  // One pre-filtered subset per section, excluding that section's own filter.
  const sets = useMemo(() => ({
    alert: metrics.filter((m) => passesExcept(m, "alert", filterState)),
    level: metrics.filter((m) => passesExcept(m, "level", filterState)),
    prio:  metrics.filter((m) => passesExcept(m, "prio",  filterState)),
    owner: metrics.filter((m) => passesExcept(m, "owner", filterState)),
    freq:  metrics.filter((m) => passesExcept(m, "freq",  filterState)),
    cat:   metrics.filter((m) => passesExcept(m, "cat",   filterState)),
  }), [metrics, fAlert, fLevel, fPrio, fOwner, fFreq, fCat]);

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
            counts={(a) => sets.alert.filter((m) => (sevBadge(m.name) || "ok") === a).length}
            defaultOpen={true} />
          <FilterGroup
            id="level" label="LEVEL" options={["L1", "L2", "L3"]} active={fLevel} toggle={tLevel}
            counts={(l) => sets.level.filter((m) => m.level === l).length}
            defaultOpen={true} />
          <FilterGroup
            id="prio" label="PRIORITY" options={["Must", "Should", "Nice"]} active={fPrio} toggle={tPrio}
            counts={(p) => sets.prio.filter((m) => m.prio === p).length}
            defaultOpen={true} />
          <FilterGroup
            id="owner" label="OWNER" options={owners} active={fOwner} toggle={tOwner}
            counts={(o) => sets.owner.filter((m) => m.owner === o).length}
            defaultOpen={false} dim />
          <FilterGroup
            id="freq" label="FREQ" options={frequencies} active={fFreq} toggle={tFreq}
            counts={(f) => sets.freq.filter((m) => m.freq === f).length}
            defaultOpen={true} />
          <FilterGroup
            id="cat" label="CATEGORY" options={categories} active={fCat} toggle={tCat}
            counts={(c) => sets.cat.filter((m) => m.cat === c).length}
            defaultOpen={false} />
        </div>
      </aside>
    </>);
}

export { FiltersDrawer, FilterGroup, Chip };
