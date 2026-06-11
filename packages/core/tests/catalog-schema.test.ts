import { describe, expect, it } from 'vitest';
import { catalogSchema, metricSchema } from '../src/catalog/schema.js';

const validMetric = {
  id: 'ggr',
  name: 'GGR',
  category: 'Revenue',
  level: 'L1',
  unit: 'currency',
  frequency: 'daily',
};

describe('metricSchema', () => {
  it('accepts a minimal valid metric', () => {
    expect(metricSchema.safeParse(validMetric).success).toBe(true);
  });

  it('accepts full optional fields', () => {
    const full = {
      ...validMetric,
      priority: 'must',
      formula: 'sum(bets) - sum(wins)',
      depends_on: ['bets', 'wins'],
      dims: ['geo', 'product'],
      alerts: {
        red: { op: 'lt', value: 0, basis: 'value' },
        yellow: { op: 'lt', value: 5, basis: 'wow_pct' },
      },
      benchmarks: [{ label: 'Tier-1 (EU/AU)', value: '2-4%' }],
      tags: ['core'],
    };
    expect(metricSchema.safeParse(full).success).toBe(true);
  });

  it('rejects id with uppercase/spaces/dashes', () => {
    for (const id of ['GGR', 'g gr', 'g-gr', '']) {
      expect(metricSchema.safeParse({ ...validMetric, id }).success).toBe(false);
    }
  });

  it('rejects unknown frequency and level', () => {
    expect(metricSchema.safeParse({ ...validMetric, frequency: 'hourly' }).success).toBe(false);
    expect(metricSchema.safeParse({ ...validMetric, level: 'L4' }).success).toBe(false);
  });

  it('rejects threshold with unknown basis', () => {
    const m = { ...validMetric, alerts: { red: { op: 'lt', value: 1, basis: 'mom' } } };
    expect(metricSchema.safeParse(m).success).toBe(false);
  });
});

describe('catalogSchema', () => {
  it('accepts a catalog with one metric', () => {
    const cat = { version: 1, name: 'Demo', metrics: [validMetric] };
    expect(catalogSchema.safeParse(cat).success).toBe(true);
  });

  it('rejects version !== 1 and missing metrics', () => {
    expect(catalogSchema.safeParse({ version: 2, name: 'x', metrics: [] }).success).toBe(false);
    expect(catalogSchema.safeParse({ version: 1, name: 'x' }).success).toBe(false);
  });
});
