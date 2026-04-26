// Shared utilities. Centralized after Sprint 2 cleanup —
// previously duplicated across app.jsx (canonical) and graph-view.jsx (g* prefix).
// Picked the app.jsx versions as canonical (more value-shape branches in fakeValue,
// salt parameter in fakeDelta, denser 24-point sparkline). See sprint-report-2.md.

export const cx = (...a) => a.filter(Boolean).join(" ");

export const prioColor = { Must: "must", Should: "should", Nice: "nice" };
export const levelColor = { L1: "l1", L2: "l2", L3: "l3" };

export function sparkPath(seed, w, h) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = s * 31 + seed.charCodeAt(i) | 0;
  const n = 24;
  let d = "";
  for (let i = 0; i < n; i++) {
    s = s * 1103515245 + 12345 & 0x7fffffff;
    const y = s % 1000 / 1000;
    const x = i / (n - 1) * w;
    const yy = h * 0.15 + y * h * 0.7;
    d += (i === 0 ? "M" : "L") + x.toFixed(1) + "," + yy.toFixed(1) + " ";
  }
  return d;
}

export function fakeValue(m) {
  const h = m.name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const cat = m.name.toLowerCase();
  if (cat.includes("%") || cat.includes("rate") || cat.includes("margin") || cat.includes("share") || cat.includes("retention") || cat.includes("conversion") || cat.includes("variance") || cat.includes("uptime") || cat.includes("hold")) return (h % 900 / 10 + 5).toFixed(2) + "%";
  if (cat.includes("time") || cat.includes("latency") || cat.includes("duration") || cat.includes("freshness")) return (h % 180 / 10 + 0.5).toFixed(1) + "s";
  if (cat.includes("count") || cat.includes("registr") || cat.includes("dau") || cat.includes("mau")) return (h % 50000 + 1000).toLocaleString("en");
  if (cat.includes("deposit") || cat.includes("arpu") || cat.includes("ltv") || cat.includes("cac") || cat.includes("ggr") || cat.includes("ngr") || cat.includes("wager")) return "$" + (h % 5000 / 10 + 8).toFixed(2);
  if (cat.includes("ratio")) return (h % 400 / 100 + 1).toFixed(2) + "×";
  return (h % 999 + 10).toString();
}

export function sevBadge(name) {
  const h = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const m = h % 7;
  if (m === 0) return "red";
  if (m === 1 || m === 2) return "yel";
  return null;
}

export function fakeDelta(name, salt = "") {
  const h = (name + salt).split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 7);
  const abs = Math.abs(h) % 900 / 100 + 0.1;
  const sign = h % 2 === 0 ? 1 : -1;
  return +(sign * abs).toFixed(2);
}
