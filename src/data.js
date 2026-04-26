// Loads 236 normalized iGaming metrics from the seed JSON and adapts each row
// to the shape consumed by the prototype catalog UI.
// Seed file is read-only; the adapter is the boundary.

import raw from '../default-vault/_seed/igaming_metrics.json';

function splitNumbered(text) {
  if (!text) return [];
  return String(text)
    .split(/\n+/)
    .map((s) => s.trim().replace(/^\d+\s*[).]\s*/, '').trim())
    .filter(Boolean);
}

function splitDeps(text) {
  if (!text) return [];
  return String(text)
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function adaptMetric(row) {
  return {
    name: row['Метрика'] || '(no name)',
    cat: row['Категория'] || '—',
    level: row['Уровень (L1/L2/L3)'] || 'L3',
    prio: row['Приоритет'] || 'Nice',
    freq: row['Частота'] || '—',
    owner: row['Owner'] || '—',
    source: row['Источник данных'] || '—',
    imp: row['Важность'] || '',
    formula: row['Формула / Определение'] || '',
    num: row['Числитель'] || '—',
    den: row['Знаменатель'] || '—',
    b1: row['Bench: Tier-1 (EU/AU)'] || '',
    b2: row['Bench: LatAm/CIS'] || '',
    b3: row['Bench: India/SEA'] || '',
    red: row['Alert (Red)'] || '',
    yellow: row['Alert (Yellow)'] || '',
    traps: splitNumbered(row['Ловушки']),
    fix: splitNumbered(row['Как улучшать']),
    deps: splitDeps(row['Зависимости']),
    tags: row['Разрезы (теги)'] || [],
    ntags: row['Разрезы (нормализованные)'] || [],
  };
}

export const METRICS_SEED = raw.rows.map(adaptMetric);
