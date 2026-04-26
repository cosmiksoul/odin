// ControlBar — universal control bar for Catalog and Graph routes.
// Layout: [Filters btn] [X/Y counter] [R/Y/OK alerts] ... [view-specific controls]
// `children` is the view-specific slot (catalog: size+layout; graph: zoom).

import { cx, sevBadge } from '../lib/util.js';

function ControlBar({ filtered, total, activeFilters, onOpenFilters, onClear, children }) {
  let red = 0, yel = 0, ok = 0;
  for (const m of filtered) {
    const s = sevBadge(m.name);
    if (s === "red") red++;
    else if (s === "yel") yel++;
    else ok++;
  }
  return (
    <div className="cbar">
      <button className="fbtn mono" onClick={onOpenFilters} title="Open filters">
        <span className="fbtn__icon">☰</span>
        <span className="fbtn__lbl">FILTERS</span>
        {activeFilters > 0 && <span className="fbtn__n">{activeFilters}</span>}
      </button>
      <div className="cbar__counter mono">
        <span className="cbar__count-n">{filtered.length}</span>
        <span className="cbar__count-sep">/</span>
        <span className="cbar__count-tot">{total}</span>
        <span className="cbar__count-lbl">metrics</span>
      </div>
      <div className="cbar__alert mono" title="Alert distribution of filtered metrics">
        <span className="cbar__dot" style={{ background: "var(--red)" }} />
        <span>{red}</span>
        <span className="cbar__alert-sep">·</span>
        <span className="cbar__dot" style={{ background: "var(--yellow)" }} />
        <span>{yel}</span>
        <span className="cbar__alert-sep">·</span>
        <span className="cbar__dot" style={{ background: "var(--up)" }} />
        <span>{ok}</span>
      </div>
      <div className="cbar__spacer" />
      <div className="cbar__view">{children}</div>
      {activeFilters > 0 &&
        <button className="btn btn--ghost btn--sm" onClick={onClear}>clear all</button>}
    </div>);
}

export { ControlBar };
