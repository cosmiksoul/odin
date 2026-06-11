import { describe, expect, it } from 'vitest';
import {
  buildContextMd,
  inferUnit,
  mapFrequency,
  parseThreshold,
  splitDeps,
  type SeedRow,
} from '../src/seed-mapping.js';

const row: SeedRow = {
  _id: '324f6c47-c88a-814b-bccd-f0b8e6ca4065',
  'Метрика': 'Odds Movement Impact',
  'Категория': 'Sportsbook',
  Owner: 'Trading',
  'Приоритет': 'Should',
  'Частота': 'Weekly',
  'Уровень (L1/L2/L3)': 'L2',
  'Источник данных': 'Betting Engine',
  'Важность': 'Показывает, сколько маржи добавляет трейдинг',
  'Формула / Определение': 'GGR(actual odds) − GGR(opening odds)',
  'Числитель': 'GGR at closing odds − GGR at opening odds',
  'Знаменатель': 'Total settled handle',
  'Bench: Tier-1 (EU/AU)': '~0.5–1.5pp к hold%',
  'Bench: LatAm/CIS': '~0.3–1.0pp',
  'Bench: India/SEA': '~0.2–0.8pp',
  'Alert (Red)': 'Negative impact >1pp на hold% за неделю',
  'Alert (Yellow)': 'Negative impact >0.5pp',
  'Ловушки': '1) Положительный impact может быть иллюзорным',
  'Как улучшать': '1) Автоматизация odds feed',
  'Зависимости': 'Actual Hold %, Theoretical Margin, GGR',
  'Разрезы (теги)': ['Спорт'],
  'Разрезы (нормализованные)': ['вид спорта', 'рынок (ставки)'],
};

describe('mapFrequency', () => {
  it('maps the six seed values', () => {
    expect(mapFrequency('Daily')).toEqual({ frequency: 'daily', remapped: false });
    expect(mapFrequency('Weekly')).toEqual({ frequency: 'weekly', remapped: false });
    expect(mapFrequency('Monthly')).toEqual({ frequency: 'monthly', remapped: false });
    expect(mapFrequency('Real-time')).toEqual({ frequency: 'daily', remapped: true });
    expect(mapFrequency('Per event')).toEqual({ frequency: 'daily', remapped: true });
    expect(mapFrequency('Quarterly')).toEqual({ frequency: 'monthly', remapped: true });
  });

  it('throws on unknown value', () => {
    expect(() => mapFrequency('Hourly')).toThrow();
  });
});

describe('parseThreshold', () => {
  it('parses simple comparisons', () => {
    expect(parseThreshold('<2%')).toEqual({ op: 'lt', value: 2, basis: 'value' });
    expect(parseThreshold('> 5')).toEqual({ op: 'gt', value: 5, basis: 'value' });
    expect(parseThreshold('<0,5pp')).toEqual({ op: 'lt', value: 0.5, basis: 'value' });
  });

  it('returns null for prose alerts', () => {
    expect(parseThreshold('Negative impact >1pp на hold% за неделю')).toBeNull();
    expect(parseThreshold('')).toBeNull();
    expect(parseThreshold(undefined)).toBeNull();
  });
});

describe('splitDeps', () => {
  it('splits by comma and trims', () => {
    expect(splitDeps('Actual Hold %, Theoretical Margin, GGR')).toEqual([
      'Actual Hold %',
      'Theoretical Margin',
      'GGR',
    ]);
    expect(splitDeps('')).toEqual([]);
    expect(splitDeps(undefined)).toEqual([]);
  });
});

describe('inferUnit', () => {
  it('guesses percent when % appears in name or formula', () => {
    expect(inferUnit('Hold %', 'x')).toBe('percent');
    expect(inferUnit('GGR', 'GGR(actual) − GGR(opening)')).toBe('number');
  });
});

describe('buildContextMd', () => {
  it('renders sections that are present and skips empty ones', () => {
    const md = buildContextMd(row, { unparsedAlerts: true });
    expect(md).toContain('# Odds Movement Impact');
    expect(md).toContain('**Owner:** Trading');
    expect(md).toContain('## Ловушки');
    expect(md).toContain('## Алерты (исходный текст)');
    expect(md).toContain('Red: Negative impact >1pp');
  });

  it('omits alert section when thresholds were parsed', () => {
    const md = buildContextMd(row, { unparsedAlerts: false });
    expect(md).not.toContain('## Алерты (исходный текст)');
  });
});
