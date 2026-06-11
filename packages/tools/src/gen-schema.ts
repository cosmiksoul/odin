import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { catalogJsonSchema } from '@odin/core';

export function writeCatalogJsonSchema(outPath: string): void {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(catalogJsonSchema(), null, 2) + '\n');
}
