import { z } from 'zod';
import { catalogSchema } from './schema.js';

/** JSON Schema для catalog.json — кладётся рядом с файлом для автокомплита в редакторах. */
export function catalogJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(catalogSchema) as Record<string, unknown>;
}
