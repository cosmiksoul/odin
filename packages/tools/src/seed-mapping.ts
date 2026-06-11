import type { Metric, Threshold } from '@odin/core';

/** Строка сида default-vault/_seed/igaming_metrics.json (точные ключи Notion-экспорта). */
export interface SeedRow {
  _id: string;
  'Метрика': string;
  'Категория': string;
  Owner?: string;
  'Приоритет'?: string;
  'Частота': string;
  'Уровень (L1/L2/L3)': string;
  'Источник данных'?: string;
  'Важность'?: string;
  'Формула / Определение'?: string;
  'Числитель'?: string;
  'Знаменатель'?: string;
  'Bench: Tier-1 (EU/AU)'?: string;
  'Bench: LatAm/CIS'?: string;
  'Bench: India/SEA'?: string;
  'Alert (Red)'?: string;
  'Alert (Yellow)'?: string;
  'Ловушки'?: string;
  'Как улучшать'?: string;
  'Зависимости'?: string;
  'Разрезы (теги)'?: string[];
  'Разрезы (нормализованные)'?: string[];
}

const FREQUENCY_MAP: Record<string, { frequency: Metric['frequency']; remapped: boolean }> = {
  Daily: { frequency: 'daily', remapped: false },
  Weekly: { frequency: 'weekly', remapped: false },
  Monthly: { frequency: 'monthly', remapped: false },
  'Real-time': { frequency: 'daily', remapped: true },
  'Per event': { frequency: 'daily', remapped: true },
  Quarterly: { frequency: 'monthly', remapped: true },
};

export function mapFrequency(raw: string): { frequency: Metric['frequency']; remapped: boolean } {
  const mapped = FREQUENCY_MAP[raw];
  if (!mapped) throw new Error(`Unknown frequency in seed: "${raw}"`);
  return mapped;
}

/** Парсит только простые пороги вида "<2%", "> 5", "<0,5pp". Прозу не парсим — она уходит в MD. */
export function parseThreshold(raw: string | undefined): Threshold | null {
  if (!raw) return null;
  const m = raw.match(/^\s*([<>])\s*(\d+(?:[.,]\d+)?)\s*(?:%|pp)?\s*$/);
  if (!m) return null;
  return {
    op: m[1] === '<' ? 'lt' : 'gt',
    value: Number.parseFloat(m[2]!.replace(',', '.')),
    basis: 'value',
  };
}

export function splitDeps(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

/** Эвристика v1: percent если в имени или формуле есть '%', иначе number.
 *  Валюту не угадываем — ручная курация позже (см. migration-report). */
export function inferUnit(name: string, formula: string | undefined): Metric['unit'] {
  return /%/.test(name + (formula ?? '')) ? 'percent' : 'number';
}

export function buildContextMd(row: SeedRow, opts: { unparsedAlerts: boolean }): string {
  const parts: string[] = [`# ${row['Метрика']}`];

  const meta: string[] = [];
  if (row.Owner) meta.push(`**Owner:** ${row.Owner}`);
  if (row['Источник данных']) meta.push(`**Источник данных:** ${row['Источник данных']}`);
  if (meta.length) parts.push(meta.join(' · '));

  if (row['Важность']) parts.push(`## Что это и зачем\n\n${row['Важность']}`);

  const formulaBits: string[] = [];
  if (row['Числитель']) formulaBits.push(`Числитель: ${row['Числитель']}`);
  if (row['Знаменатель']) formulaBits.push(`Знаменатель: ${row['Знаменатель']}`);
  if (formulaBits.length) parts.push(`## Формула — детали\n\n${formulaBits.join('\n\n')}`);

  if (row['Ловушки']) parts.push(`## Ловушки\n\n${row['Ловушки']}`);
  if (row['Как улучшать']) parts.push(`## Как улучшать\n\n${row['Как улучшать']}`);

  if (opts.unparsedAlerts && (row['Alert (Red)'] || row['Alert (Yellow)'])) {
    const alerts: string[] = [];
    if (row['Alert (Red)']) alerts.push(`Red: ${row['Alert (Red)']}`);
    if (row['Alert (Yellow)']) alerts.push(`Yellow: ${row['Alert (Yellow)']}`);
    parts.push(`## Алерты (исходный текст)\n\n${alerts.join('\n\n')}`);
  }

  return parts.join('\n\n') + '\n';
}
