// PinnedMetricCard — compact metric card for the Graph pinned side-panel.
// Single-click anywhere on the card just hovers (sync with graph). Use the
// "open →" button or double-click to open the full Drawer (MetricPreview).
// Cross "×" button unpins.
//
// Why a separate component (B) and not a `variant="compact"` on MetricPreview:
// MetricPreview carries history charts, dependency graph, traps/fix lists,
// markdown export — context-heavy machinery that compact cards don't need.
// A flag-driven branchy MetricPreview would be harder to reason about than two
// small components that share only the visual idiom.

import { cx, sparkPath, fakeValue, fakeDelta, sevBadge } from '../lib/util.js';

function PinnedMetricCard({ m, onOpen, onUnpin, onHover, onUnhover, isHovered }) {
  const val = fakeValue(m);
  const delta = fakeDelta(m.name);
  const sev = sevBadge(m.name);
  const isDown = delta < 0;
  const spark = sparkPath(m.name + "_pin", 56, 18);
  const lvlCls = m.level === "L1" ? "l1" : m.level === "L2" ? "l2" : "l3";
  return (
    <div
      className={cx("pinc", isHovered && "pinc--hover", sev && `pinc--${sev}`)}
      onDoubleClick={() => onOpen(m)}
      onMouseEnter={() => onHover(m.name)}
      onMouseLeave={() => onUnhover()}
      role="button"
      tabIndex={0}>
      <div className="pinc__row1">
        <span className={cx("pinc__lvl mono", `pinc__lvl--${lvlCls}`)}>{m.level}</span>
        <span className="pinc__name">{m.name}</span>
        {sev && <span className={cx("pinc__sev", `pinc__sev--${sev}`)} />}
        <button
          className="pinc__close mono"
          onClick={(e) => { e.stopPropagation(); onUnpin(m.name); }}
          title="Unpin">×</button>
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
        <button
          className="pinc__open mono"
          onClick={(e) => { e.stopPropagation(); onOpen(m); }}
          title="Open spec (double-click anywhere)">open →</button>
      </div>
    </div>);
}

export { PinnedMetricCard };
