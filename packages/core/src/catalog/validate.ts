import type { Catalog } from './schema.js';

export interface ValidationIssue {
  level: 'error' | 'warning';
  code: 'duplicate_id' | 'unknown_dependency' | 'dependency_cycle';
  message: string;
  metricId?: string;
}

export interface ValidationReport {
  ok: boolean; // нет ошибок (warnings допустимы)
  issues: ValidationIssue[];
}

export function validateCatalog(catalog: Catalog): ValidationReport {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();

  for (const m of catalog.metrics) {
    if (ids.has(m.id)) {
      issues.push({
        level: 'error',
        code: 'duplicate_id',
        metricId: m.id,
        message: `Метрика с id "${m.id}" встречается больше одного раза`,
      });
    }
    ids.add(m.id);
  }

  for (const m of catalog.metrics) {
    for (const dep of m.depends_on ?? []) {
      if (!ids.has(dep)) {
        issues.push({
          level: 'error',
          code: 'unknown_dependency',
          metricId: m.id,
          message: `"${m.id}" зависит от несуществующей метрики "${dep}"`,
        });
      }
    }
  }

  for (const cycle of findCycles(catalog)) {
    issues.push({
      level: 'warning',
      code: 'dependency_cycle',
      message: `Цикл зависимостей: ${cycle.join(' -> ')}`,
    });
  }

  return { ok: !issues.some((i) => i.level === 'error'), issues };
}

/** Поиск циклов DFS-ом; каждый цикл репортится один раз. */
function findCycles(catalog: Catalog): string[][] {
  const adj = new Map<string, string[]>(
    catalog.metrics.map((m) => [m.id, (m.depends_on ?? []).filter((d) => d !== m.id)]),
  );
  const color = new Map<string, 'gray' | 'black'>();
  const stack: string[] = [];
  const cycles: string[][] = [];
  const seen = new Set<string>();

  function dfs(node: string): void {
    color.set(node, 'gray');
    stack.push(node);
    for (const next of adj.get(node) ?? []) {
      const c = color.get(next);
      if (c === 'gray') {
        const cycle = [...stack.slice(stack.indexOf(next)), next];
        const key = [...cycle].sort().join('|');
        if (!seen.has(key)) {
          seen.add(key);
          cycles.push(cycle);
        }
      } else if (c === undefined) {
        dfs(next);
      }
    }
    stack.pop();
    color.set(node, 'black');
  }

  for (const id of adj.keys()) if (!color.has(id)) dfs(id);
  return cycles;
}
