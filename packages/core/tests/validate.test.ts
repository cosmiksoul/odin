import { describe, expect, it } from 'vitest';
import type { Catalog } from '../src/catalog/schema.js';
import { validateCatalog } from '../src/catalog/validate.js';

function cat(metrics: Catalog['metrics']): Catalog {
  return { version: 1, name: 'test', metrics };
}
const base = { category: 'C', level: 'L1', unit: 'number', frequency: 'daily' } as const;

describe('validateCatalog', () => {
  it('passes a clean catalog', () => {
    const r = validateCatalog(cat([
      { id: 'a', name: 'A', ...base },
      { id: 'b', name: 'B', ...base, depends_on: ['a'] },
    ]));
    expect(r.ok).toBe(true);
    expect(r.issues).toEqual([]);
  });

  it('errors on duplicate ids', () => {
    const r = validateCatalog(cat([
      { id: 'a', name: 'A', ...base },
      { id: 'a', name: 'A2', ...base },
    ]));
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.code === 'duplicate_id' && i.metricId === 'a')).toBe(true);
  });

  it('errors on depends_on pointing to unknown id', () => {
    const r = validateCatalog(cat([{ id: 'a', name: 'A', ...base, depends_on: ['ghost'] }]));
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.code === 'unknown_dependency' && i.message.includes('ghost'))).toBe(true);
  });

  it('warns (not errors) on dependency cycles', () => {
    const r = validateCatalog(cat([
      { id: 'a', name: 'A', ...base, depends_on: ['b'] },
      { id: 'b', name: 'B', ...base, depends_on: ['a'] },
    ]));
    expect(r.ok).toBe(true);
    expect(r.issues.some((i) => i.level === 'warning' && i.code === 'dependency_cycle')).toBe(true);
  });
});
