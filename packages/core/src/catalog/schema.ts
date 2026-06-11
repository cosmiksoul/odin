import { z } from 'zod';

export const METRIC_ID_PATTERN = /^[a-z0-9_]+$/;

export const thresholdSchema = z.object({
  op: z.enum(['lt', 'gt']),
  value: z.number(),
  basis: z.enum(['value', 'wow_pct']),
});

export const metricSchema = z.object({
  id: z.string().regex(METRIC_ID_PATTERN),
  name: z.string().min(1),
  category: z.string().min(1),
  level: z.enum(['L1', 'L2', 'L3']),
  unit: z.enum(['number', 'percent', 'currency', 'duration']),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  priority: z.enum(['must', 'should', 'nice']).optional(),
  formula: z.string().optional(),
  depends_on: z.array(z.string()).optional(),
  dims: z.array(z.string().min(1)).optional(),
  alerts: z
    .object({
      red: thresholdSchema.optional(),
      yellow: thresholdSchema.optional(),
    })
    .optional(),
  benchmarks: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  tags: z.array(z.string()).optional(),
});

export const catalogSchema = z.object({
  $schema: z.string().optional(),
  version: z.literal(1),
  name: z.string().min(1),
  metrics: z.array(metricSchema),
});

export type Threshold = z.infer<typeof thresholdSchema>;
export type Metric = z.infer<typeof metricSchema>;
export type Catalog = z.infer<typeof catalogSchema>;
