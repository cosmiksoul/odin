import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { catalogSchema, slugify, validateCatalog, type Catalog, type Metric } from '@odin/core';
import {
  buildContextMd,
  inferUnit,
  mapFrequency,
  parseThreshold,
  splitDeps,
  type SeedRow,
} from './seed-mapping.js';
import { writeCatalogJsonSchema } from './gen-schema.js';

const ROOT = join(import.meta.dirname, '../../..');
const SEED_PATH = join(ROOT, 'default-vault/_seed/igaming_metrics.json');
const VAULT_DIR = join(ROOT, 'vault-demo');
const REPORT_PATH = join(ROOT, 'docs/migration-report.md');

interface Seed {
  collection_title?: string;
  row_count: number;
  rows: SeedRow[];
}

function priorityOf(raw: string | undefined): Metric['priority'] {
  const map: Record<string, NonNullable<Metric['priority']>> = {
    Must: 'must',
    Should: 'should',
    Nice: 'nice',
  };
  return raw ? map[raw] : undefined;
}

function main(): void {
  const seed: Seed = JSON.parse(readFileSync(SEED_PATH, 'utf8'));
  if (seed.rows.length !== seed.row_count) {
    throw new Error(`row_count=${seed.row_count} but rows.length=${seed.rows.length}`);
  }

  // 1. name -> id, с проверкой уникальности
  const nameToId = new Map<string, string>();
  for (const row of seed.rows) {
    const id = slugify(row['Метрика']);
    if ([...nameToId.values()].includes(id)) {
      throw new Error(`Slug collision: "${row['Метрика']}" -> "${id}"`);
    }
    nameToId.set(row['Метрика'], id);
  }

  // 2. rows -> metrics + context
  const report = {
    frequencyRemapped: [] as string[],
    unresolvedDeps: [] as string[],
    unparsedAlerts: [] as string[],
    percentGuessed: [] as string[],
  };
  const metrics: Metric[] = [];
  const contexts = new Map<string, string>();

  for (const row of seed.rows) {
    const id = nameToId.get(row['Метрика'])!;
    const freq = mapFrequency(row['Частота']);
    if (freq.remapped) report.frequencyRemapped.push(`${id}: ${row['Частота']} -> ${freq.frequency}`);

    const depNames = splitDeps(row['Зависимости']);
    const depends_on: string[] = [];
    for (const dep of depNames) {
      const depId = nameToId.get(dep);
      if (depId) depends_on.push(depId);
      else report.unresolvedDeps.push(`${id}: "${dep}"`);
    }

    const red = parseThreshold(row['Alert (Red)']);
    const yellow = parseThreshold(row['Alert (Yellow)']);
    const hasAlertText = Boolean(row['Alert (Red)'] || row['Alert (Yellow)']);
    const unparsedAlerts = hasAlertText && !red && !yellow;
    if (unparsedAlerts) report.unparsedAlerts.push(id);

    const unit = inferUnit(row['Метрика'], row['Формула / Определение']);
    if (unit === 'percent') report.percentGuessed.push(id);

    const benchmarks = (
      [
        ['Tier-1 (EU/AU)', row['Bench: Tier-1 (EU/AU)']],
        ['LatAm/CIS', row['Bench: LatAm/CIS']],
        ['India/SEA', row['Bench: India/SEA']],
      ] as const
    )
      .filter(([, v]) => Boolean(v))
      .map(([label, value]) => ({ label, value: value! }));

    const priority = priorityOf(row['Приоритет']);
    const metric: Metric = {
      id,
      name: row['Метрика'],
      category: row['Категория'],
      level: row['Уровень (L1/L2/L3)'] as Metric['level'],
      unit,
      frequency: freq.frequency,
      ...(priority ? { priority } : {}),
      ...(row['Формула / Определение'] ? { formula: row['Формула / Определение'] } : {}),
      ...(depends_on.length ? { depends_on } : {}),
      ...((row['Разрезы (нормализованные)'] ?? []).length
        ? { dims: row['Разрезы (нормализованные)'] }
        : {}),
      ...(red || yellow
        ? { alerts: { ...(red ? { red } : {}), ...(yellow ? { yellow } : {}) } }
        : {}),
      ...(benchmarks.length ? { benchmarks } : {}),
    };
    metrics.push(metric);

    const md = buildContextMd(row, { unparsedAlerts });
    if (md.trim().split('\n').length > 1) contexts.set(id, md);
  }

  // 3. Собрать catalog, провалидировать обеими ступенями
  const catalog: Catalog = {
    $schema: './catalog.schema.json',
    version: 1,
    name: 'iGaming Metrics (demo)',
    metrics,
  };
  catalogSchema.parse(catalog); // бросит при несоответствии zod-схеме
  const validation = validateCatalog(catalog);
  if (!validation.ok) {
    throw new Error('validateCatalog errors:\n' + JSON.stringify(validation.issues, null, 2));
  }

  // 4. Записать vault-demo
  mkdirSync(join(VAULT_DIR, 'context'), { recursive: true });
  mkdirSync(join(VAULT_DIR, 'data'), { recursive: true });
  writeFileSync(join(VAULT_DIR, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
  writeCatalogJsonSchema(join(VAULT_DIR, 'catalog.schema.json'));
  for (const [id, md] of contexts) writeFileSync(join(VAULT_DIR, 'context', `${id}.md`), md);

  // 5. Отчёт миграции
  const lines = [
    '# Migration report: seed -> vault-demo',
    '',
    `Метрик: ${metrics.length}; context-файлов: ${contexts.size}.`,
    '',
    `## Частота переназначена (${report.frequencyRemapped.length})`,
    ...report.frequencyRemapped.map((s) => `- ${s}`),
    '',
    `## Неразрешённые зависимости (${report.unresolvedDeps.length}) — остались только в MD`,
    ...report.unresolvedDeps.map((s) => `- ${s}`),
    '',
    `## Алерты не распарсились (${report.unparsedAlerts.length}) — текст в MD-контексте`,
    ...report.unparsedAlerts.map((s) => `- ${s}`),
    '',
    `## unit=percent угадан эвристикой (${report.percentGuessed.length}) — проверить при курации`,
    ...report.percentGuessed.map((s) => `- ${s}`),
    '',
    `## Предупреждения валидатора (${validation.issues.length})`,
    ...validation.issues.map((i) => `- [${i.level}] ${i.message}`),
    '',
  ];
  writeFileSync(REPORT_PATH, lines.join('\n'));

  console.log(`OK: ${metrics.length} metrics -> vault-demo/, report -> docs/migration-report.md`);
}

main();
