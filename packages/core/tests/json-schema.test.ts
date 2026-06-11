import { describe, expect, it } from 'vitest';
import { catalogJsonSchema } from '../src/catalog/json-schema.js';

describe('catalogJsonSchema', () => {
  it('is a JSON Schema object with metrics definition', () => {
    const s = catalogJsonSchema();
    expect(s.$schema).toContain('json-schema.org');
    expect(JSON.stringify(s)).toContain('metrics');
  });
});
