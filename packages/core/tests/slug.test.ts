import { describe, expect, it } from 'vitest';
import { slugify } from '../src/catalog/slug.js';

describe('slugify', () => {
  it('lowercases and replaces separators with underscore', () => {
    expect(slugify('Odds Movement Impact')).toBe('odds_movement_impact');
    expect(slugify('DAU/WAU/MAU')).toBe('dau_wau_mau');
    expect(slugify('GGR')).toBe('ggr');
    expect(slugify('Hold %')).toBe('hold');
    expect(slugify('  NGR  (net)  ')).toBe('ngr_net');
  });

  it('throws on input that produces empty slug', () => {
    expect(() => slugify('%%%')).toThrow();
  });
});
