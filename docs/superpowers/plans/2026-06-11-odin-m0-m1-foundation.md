# ODIN 2.0 — M0+M1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Чистый репозиторий + монорепо-каркас + пакет `@odin/core` (типы, zod-схемы, валидатор) + миграция сида 236 метрик в `vault-demo/` (catalog.json + context/*.md).

**Architecture:** Монорепо npm workspaces, TypeScript везде. `packages/core` — чистая доменная логика без платформенных зависимостей; `packages/tools` — миграция и CLI-валидатор. Legacy-прототип (src/ в корне) остаётся рабочим до M7 — GitHub Pages деплоится из него. Спека: `docs/superpowers/specs/2026-06-11-odin-2.0-design.md`.

**Tech Stack:** Node 22+, npm workspaces, TypeScript (strict), zod v4 (схемы + `z.toJSONSchema`), Vitest, tsx.

**Конвенции для исполнителя:**
- Рабочая директория всех команд: `C:\Users\cosmi\Projects\odin`.
- Все коммиты заканчиваются трейлером `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- M2-M7 — в последующих планах; этот план заканчивается рабочим `vault-demo`, прошедшим валидатор.

---

## M0 — Гигиена и каркас

### Task 1: Закрыть хвост Sprint 2 и оттрекать .obsidian

Полтора месяца в рабочей копии висят незакоммиченные правки доков (ADR-014/015/016 и др.). `.obsidian/` трекается git'ом вопреки `.gitignore:26`.

**Files:**
- Modify (уже изменены, только закоммитить): `docs/context/decisions-log.md`, `docs/context/roadmap.md`, `docs/project/CONTEXT.md`, `docs/project/JTBD-full-scope.md`
- Untrack: `.obsidian/`

- [ ] **Step 1: Проверить состояние**

Run: `git status --short`
Expected: ` M .obsidian/workspace.json`, ` M docs/context/decisions-log.md`, ` M docs/context/roadmap.md`, ` M docs/project/CONTEXT.md`, ` M docs/project/JTBD-full-scope.md`, `?? docs/marketing/` (docs/superpowers/ уже закоммичен ранее — если виден, закоммитить отдельно как docs).

- [ ] **Step 2: Закоммитить доки Sprint 2**

```bash
git add docs/context/decisions-log.md docs/context/roadmap.md docs/project/CONTEXT.md docs/project/JTBD-full-scope.md
git commit -m "docs: close Sprint 2 tail (ADR-014/015/016, context updates)"
```

- [ ] **Step 3: Убрать .obsidian из индекса**

```bash
git rm -r --cached .obsidian
git commit -m "chore: untrack .obsidian (already in .gitignore)"
```

Run: `git status --short` → `.obsidian` больше не появляется.

### Task 2: Архивировать маркетинг и design-uploads

**Files:**
- Move: `docs/marketing/` → `docs/archive/marketing/`
- Move: `src/uploads/` → `docs/archive/design-uploads/`

- [ ] **Step 1: Убедиться, что код не ссылается на uploads**

Run: `git grep -n "uploads" -- src` (после Task 1 файлы src ещё на месте)
Expected: пусто (проверено при подготовке плана).

- [ ] **Step 2: Переместить и закоммитить**

```powershell
New-Item -ItemType Directory -Force docs/archive | Out-Null
Move-Item docs/marketing docs/archive/marketing
git mv src/uploads docs/archive/design-uploads
git add docs/archive
git commit -m "chore: archive marketing deck and design-phase uploads"
```

Примечание: `docs/marketing` untracked — обычный `Move-Item` + `git add`; `src/uploads` трекается — `git mv`.

### Task 3: Снять ветку legacy

- [ ] **Step 1: Создать ветку-снапшот (не переключаясь)**

```bash
git branch legacy
git log --oneline -1 legacy
```

Expected: ветка `legacy` указывает на текущий HEAD. Старый прототип всегда доступен: `git switch legacy`.

### Task 4: Вычистить source_url из сида

В `default-vault/_seed/igaming_metrics.json` верхнеуровневое поле `source_url` ссылается на чужую Notion-коллекцию и попадает в публичный JS-бандл на Pages.

**Files:**
- Modify: `default-vault/_seed/igaming_metrics.json` (удалить один ключ)

- [ ] **Step 1: Удалить поле скриптом (сохраняя остальное байт-в-байт по структуре)**

```bash
node -e "const fs=require('fs');const p='default-vault/_seed/igaming_metrics.json';const j=JSON.parse(fs.readFileSync(p,'utf8'));delete j.source_url;fs.writeFileSync(p,JSON.stringify(j,null,1)+'\n')"
```

- [ ] **Step 2: Проверить**

Run: `git grep -n "notion.so" -- default-vault src`
Expected: пусто.
Run: `node -e "const j=require('./default-vault/_seed/igaming_metrics.json');console.log(j.row_count, j.rows.length)"`
Expected: `236 236`.

- [ ] **Step 3: Commit**

```bash
git add default-vault/_seed/igaming_metrics.json
git commit -m "chore: remove external source_url from seed (public bundle hygiene)"
```

### Task 5: Архивировать старые доки, написать новые

Старые доки описывают несуществующий код (см. спеку §7, §10). Архивируем целиком, взамен — три коротких документа.

**Files:**
- Move: `docs/context/` → `docs/archive/context/`, `docs/project/` → `docs/archive/project/`, `docs/user/` → `docs/archive/user/`
- Create: `docs/adr-017-pivot.md`, `docs/architecture.md`
- Rewrite: `CLAUDE.md`, `README.md`

- [ ] **Step 1: Переместить старые доки**

```bash
git mv docs/context docs/archive/context
git mv docs/project docs/archive/project
git mv docs/user docs/archive/user
```

- [ ] **Step 2: Создать `docs/adr-017-pivot.md`**

```markdown
# ADR-017: Пивот — универсальный локальный каталог метрик

**Дата:** 2026-06-11 · **Статус:** принято

## Решение

ODIN перестаёт быть iGaming-продуктом и становится универсальным локальным каталогом метрик:
пользователь приносит Parquet-витрину в строгом long-format контракте + `catalog.json` со схемой —
и получает каталог, граф зависимостей, динамику, разрезы, алерты и MD-контекст. Цель —
портфолио-демка с работающим универсальным движком. iGaming-сид (236 метрик) — демо-датасет.

Полный дизайн: `docs/superpowers/specs/2026-06-11-odin-2.0-design.md`.

## Ключевые следствия

- Чистый TypeScript-кор, монорепо npm workspaces; фронт переписывается с нуля.
- Electron — десктоп-таргет; web-демо — второй таргет того же UI.
- `catalog.json` — машинная истина схемы; MD-файлы — человеческий контекст.
- MCP-сервер — отдельный процесс, запускается Claude Desktop (не child Electron).
- Отменены: ADR-011 (WYSIWYG), ADR-012 (keytar), ADR-013 (git-sync в приложении).
- Сохраняются: ADR-008 (local-first), ADR-010 (push-based Parquet, контракт упрощён), ADR-015 (filter-driven graph).

## Контекст

Аудит 2026-06-11 показал: документация апреля-2026 описывала продукт на два порядка больше
написанного кода (из стека architecture.md в package.json не было ни одной зависимости),
проект остановился на фазе CLOSE Sprint 2. Старые доки — в `docs/archive/`, им не верить:
они описывают целевое состояние, которого не было.
```

- [ ] **Step 3: Создать `docs/architecture.md`**

```markdown
# ODIN 2.0 — архитектура (по факту)

Монорепо npm workspaces, TypeScript везде. Дизайн и решения: `docs/superpowers/specs/2026-06-11-odin-2.0-design.md`.

## Пакеты

| Пакет | Что | Зависимости |
|---|---|---|
| `packages/core` | Типы, zod-схемы catalog.json и контракта, валидатор, граф зависимостей, интерфейс DataProvider | zod; ноль React/Node-специфики |
| `packages/tools` | Миграция сида, CLI-валидатор vault | @odin/core, tsx |
| `packages/engine` (M2) | DuckDB, чтение parquet по контракту, алерты | @odin/core, @duckdb/node-api |
| `packages/ui` (M3) | React-приложение, все вьюхи | @odin/core, react |
| `packages/desktop` (M3) | Electron main/preload, IPC ui↔engine | @odin/engine, @odin/ui |
| `packages/demo` (M7) | Web-таргет для Pages, StaticProvider | @odin/ui |
| `packages/mcp` (M6) | MCP-сервер (отдельный процесс) | @odin/engine |

## Инварианты

- `ui` знает только интерфейс `DataProvider` из `core`. Один UI — два таргета (Electron, web).
- `core` не импортирует ничего платформенного. `engine` — единственное место с DuckDB и fs.
- `metric_id` — единственный идентификатор метрики везде.
- Любая проблема vault — человекочитаемый отчёт валидатора, не крэш.

## Vault (формат пользовательских данных)

```
my-vault/
  catalog.json        # схема каталога (валидируется zod + JSON Schema)
  context/<id>.md     # опциональный MD-контекст метрики
  data/*.parquet      # значения: metric_id|date|dim_key|dim_value|value
```

## Legacy

Старый прототип (src/ в корне, ветка `legacy`) собирается `npm run build` и деплоится на
GitHub Pages при push в main — остаётся витриной до M7, потом заменяется `packages/demo`.
```

- [ ] **Step 4: Переписать `CLAUDE.md`** (полная замена содержимого)

```markdown
# CLAUDE.md

ODIN 2.0 — универсальный локальный каталог метрик («принёс parquet + catalog.json → получил каталог»).

## Источники истины (в порядке приоритета)

1. `docs/superpowers/specs/2026-06-11-odin-2.0-design.md` — утверждённый дизайн
2. `docs/adr-017-pivot.md` — решение о пивоте
3. `docs/architecture.md` — пакеты и инварианты
4. Текущий план в `docs/superpowers/plans/`

**`docs/archive/` — историческая документация апреля-2026. Она описывает код, которого не было.
Не использовать как руководство.**

## Инварианты (нарушение = стоп и вопрос)

- `core` не импортирует React/Electron/Node-API; `engine` — единственное место с DuckDB и fs
- `ui` ходит к данным только через интерфейс `DataProvider` из `core`
- `metric_id` (slug `^[a-z0-9_]+$`) — единственный идентификатор метрики
- Контракт данных строгий: `metric_id|date|dim_key|dim_value|value`, тоталы `_total`/`_total`,
  без NULL, дубликаты ключа — ошибка валидации
- Ошибки vault → отчёт валидатора, не крэш
- MCP — отдельный процесс, не child Electron
- Никакого cloud-backend, секретов в файлах, коннекторов к DWH

## Команды

- `npm test` — тесты всех workspace-пакетов (Vitest)
- `npm run typecheck` — tsc по всем пакетам
- `npm run build` — сборка legacy-прототипа (Pages, до M7)
- `npm run migrate-seed` / `npm run validate-vault -- vault-demo` — инструменты vault

## Правила работы

- TDD: тест → красный → минимальная реализация → зелёный → коммит
- Хирургические изменения: каждая строка диффа трассируется к задаче
- Простота: никаких спекулятивных абстракций и фич сверх плана
- Legacy-код (src/ в корне) не трогать до M7 — он обслуживает Pages
```

- [ ] **Step 5: Переписать `README.md`** (полная замена)

```markdown
# ODIN

Local-first каталог метрик: приносишь Parquet-витрину с агрегатами + `catalog.json` со схемой —
получаешь каталог метрик с графом зависимостей, динамикой, разрезами, алертами и MD-контекстом.
Данные не покидают твою машину.

**Статус:** реанимация (2026-06). Идёт переписывание на TypeScript-монорепо по
[дизайну ODIN 2.0](docs/superpowers/specs/2026-06-11-odin-2.0-design.md).
Старый read-only прототип: [демо на GitHub Pages](https://cosmiksoul.github.io/odin/), ветка `legacy`.

## Структура

- `packages/core` — типы, схемы, валидатор
- `packages/tools` — миграция сида, CLI-валидатор vault
- `vault-demo/` — демо-vault (236 iGaming-метрик)
- `docs/architecture.md` — архитектура; `docs/archive/` — историческая документация
```

- [ ] **Step 6: Commit**

```bash
git add -A docs CLAUDE.md README.md
git commit -m "docs: archive April-2026 docs, add ADR-017 pivot + new architecture/CLAUDE/README"
```

### Task 6: Каркас монорепо + packages/core

**Files:**
- Modify: `package.json` (корень)
- Create: `tsconfig.base.json`, `packages/core/package.json`, `packages/core/tsconfig.json`, `packages/core/vitest.config.ts`, `packages/core/src/index.ts`, `packages/core/tests/smoke.test.ts`

- [ ] **Step 1: Обновить корневой `package.json`** (полная замена)

```json
{
  "name": "odin",
  "version": "0.2.0",
  "private": true,
  "type": "module",
  "workspaces": ["packages/*"],
  "engines": { "node": ">=20" },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "npm run test --workspaces --if-present",
    "typecheck": "npm run typecheck --workspaces --if-present",
    "migrate-seed": "npm run migrate-seed -w @odin/tools",
    "validate-vault": "npm run validate-vault -w @odin/tools"
  },
  "dependencies": {
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "vite": "^5.4.10",
    "@vitejs/plugin-react": "^4.3.3"
  }
}
```

(`dev`/`build`/`preview` и react-зависимости — legacy-прототип, не трогаем до M7.)

- [ ] **Step 2: Создать `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  }
}
```

- [ ] **Step 3: Создать `packages/core/package.json`**

```json
{
  "name": "@odin/core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  }
}
```

(Экспорт исходников без build-шага: все потребители — vitest/tsx/vite — понимают TS. Пересмотрим при упаковке desktop в M3.)

- [ ] **Step 4: Создать `packages/core/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*.ts", "tests/**/*.ts", "vitest.config.ts"]
}
```

- [ ] **Step 5: Создать `packages/core/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['tests/**/*.test.ts'] },
});
```

- [ ] **Step 6: Создать `packages/core/src/index.ts`**

```ts
export const CORE_VERSION = '0.1.0';
```

- [ ] **Step 7: Создать `packages/core/tests/smoke.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { CORE_VERSION } from '../src/index.js';

describe('core package', () => {
  it('exports version', () => {
    expect(CORE_VERSION).toBe('0.1.0');
  });
});
```

- [ ] **Step 8: Установить dev-зависимости и zod**

```bash
npm install -D typescript vitest tsx @types/node
npm install zod -w @odin/core
```

Expected: `package-lock.json` обновлён, без ошибок peer-deps.

- [ ] **Step 9: Прогнать тесты и typecheck**

Run: `npm test`
Expected: `@odin/core` — 1 passed.
Run: `npm run typecheck`
Expected: без ошибок.
Run: `npm run build`
Expected: legacy-прототип всё ещё собирается (vite build green).

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json tsconfig.base.json packages
git commit -m "feat: monorepo scaffold with @odin/core package"
```

### Task 7: CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Создать workflow**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add typecheck + test + build workflow"
```

### Task 8: Push (⚠️ требует подтверждения владельца)

Push в main автодеплоит GitHub Pages — публичное действие. Бонус: бандл пересоберётся уже без `source_url`.

- [ ] **Step 1: Спросить владельца, пушим ли** (если выполняет агент — остановиться и спросить)

- [ ] **Step 2: Push**

```bash
git push origin main
git push origin legacy
```

- [ ] **Step 3: Проверить деплой**

После завершения Actions (~2 мин): скачать `https://cosmiksoul.github.io/odin/` , найти имя JS-бандла в HTML, проверить что в нём нет `notion.so`.

Run: `curl.exe -s https://cosmiksoul.github.io/odin/ | Select-String "assets/index"` → взять путь, затем `curl.exe -s https://cosmiksoul.github.io/odin/assets/index-XXXX.js | Select-String "notion.so"` (именно `curl.exe` — голый `curl` в PowerShell это алиас Invoke-WebRequest)
Expected: пусто.

---

## M1 — Кор: схемы, валидатор, миграция сида

### Task 9: Типы и zod-схема catalog.json

**Files:**
- Create: `packages/core/src/catalog/schema.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/tests/catalog-schema.test.ts`

- [ ] **Step 1: Написать падающий тест**

```ts
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
```

- [ ] **Step 2: Запустить — убедиться, что падает**

Run: `npm test -w @odin/core`
Expected: FAIL — `Cannot find module '../src/catalog/schema.js'`.

- [ ] **Step 3: Реализовать `packages/core/src/catalog/schema.ts`**

```ts
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
```

- [ ] **Step 4: Реэкспортировать из `packages/core/src/index.ts`**

```ts
export const CORE_VERSION = '0.1.0';
export * from './catalog/schema.js';
```

- [ ] **Step 5: Тесты зелёные**

Run: `npm test -w @odin/core` → PASS. `npm run typecheck` → чисто.

- [ ] **Step 6: Commit**

```bash
git add packages/core
git commit -m "feat(core): catalog.json zod schema and types"
```

### Task 10: Экспорт JSON Schema

**Files:**
- Create: `packages/core/src/catalog/json-schema.ts`, `packages/tools/` пока не нужен — генератор живёт в core-скрипте
- Test: `packages/core/tests/json-schema.test.ts`

- [ ] **Step 1: Падающий тест**

```ts
import { describe, expect, it } from 'vitest';
import { catalogJsonSchema } from '../src/catalog/json-schema.js';

describe('catalogJsonSchema', () => {
  it('is a JSON Schema object with metrics definition', () => {
    const s = catalogJsonSchema();
    expect(s.$schema).toContain('json-schema.org');
    expect(JSON.stringify(s)).toContain('metrics');
  });
});
```

Run: `npm test -w @odin/core` → FAIL (module not found).

- [ ] **Step 2: Реализовать `packages/core/src/catalog/json-schema.ts`**

```ts
import { z } from 'zod';
import { catalogSchema } from './schema.js';

/** JSON Schema для catalog.json — кладётся рядом с файлом для автокомплита в редакторах. */
export function catalogJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(catalogSchema) as Record<string, unknown>;
}
```

Если `z.toJSONSchema` отсутствует (zod < 4) — обновить zod: `npm install zod@latest -w @odin/core`.

- [ ] **Step 3: Тест зелёный, реэкспорт, коммит**

В `packages/core/src/index.ts` добавить: `export * from './catalog/json-schema.js';`

Run: `npm test -w @odin/core` → PASS.

```bash
git add packages/core
git commit -m "feat(core): JSON Schema export for catalog.json"
```

### Task 11: slugify

**Files:**
- Create: `packages/core/src/catalog/slug.ts`
- Test: `packages/core/tests/slug.test.ts`

- [ ] **Step 1: Падающий тест**

```ts
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
```

Run: `npm test -w @odin/core` → FAIL.

- [ ] **Step 2: Реализовать `packages/core/src/catalog/slug.ts`**

```ts
/** Имя метрики -> metric_id. Сид содержит только ASCII-имена (проверено при миграции). */
export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!slug) throw new Error(`slugify: empty slug for name "${name}"`);
  return slug;
}
```

- [ ] **Step 3: Зелёный, реэкспорт (`export * from './catalog/slug.js';`), коммит**

```bash
git add packages/core
git commit -m "feat(core): slugify for metric ids"
```

### Task 12: Валидатор каталога (кросс-проверки поверх zod)

**Files:**
- Create: `packages/core/src/catalog/validate.ts`
- Test: `packages/core/tests/validate.test.ts`

- [ ] **Step 1: Падающий тест**

```ts
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
```

Run: `npm test -w @odin/core` → FAIL.

- [ ] **Step 2: Реализовать `packages/core/src/catalog/validate.ts`**

```ts
import type { Catalog } from './schema.js';

export interface ValidationIssue {
  level: 'error' | 'warning';
  code: 'duplicate_id' | 'unknown_dependency' | 'dependency_cycle';
  message: string;
  metricId?: string;
}

export interface ValidationReport {
  ok: boolean; // нет ошибок (warnings допустимы)
  issues: ValidationIssue[];
}

export function validateCatalog(catalog: Catalog): ValidationReport {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();

  for (const m of catalog.metrics) {
    if (ids.has(m.id)) {
      issues.push({
        level: 'error',
        code: 'duplicate_id',
        metricId: m.id,
        message: `Метрика с id "${m.id}" встречается больше одного раза`,
      });
    }
    ids.add(m.id);
  }

  for (const m of catalog.metrics) {
    for (const dep of m.depends_on ?? []) {
      if (!ids.has(dep)) {
        issues.push({
          level: 'error',
          code: 'unknown_dependency',
          metricId: m.id,
          message: `"${m.id}" зависит от несуществующей метрики "${dep}"`,
        });
      }
    }
  }

  for (const cycle of findCycles(catalog)) {
    issues.push({
      level: 'warning',
      code: 'dependency_cycle',
      message: `Цикл зависимостей: ${cycle.join(' -> ')}`,
    });
  }

  return { ok: !issues.some((i) => i.level === 'error'), issues };
}

/** Поиск циклов DFS-ом; каждый цикл репортится один раз. */
function findCycles(catalog: Catalog): string[][] {
  const adj = new Map<string, string[]>(
    catalog.metrics.map((m) => [m.id, (m.depends_on ?? []).filter((d) => d !== m.id)]),
  );
  const color = new Map<string, 'gray' | 'black'>();
  const stack: string[] = [];
  const cycles: string[][] = [];
  const seen = new Set<string>();

  function dfs(node: string): void {
    color.set(node, 'gray');
    stack.push(node);
    for (const next of adj.get(node) ?? []) {
      const c = color.get(next);
      if (c === 'gray') {
        const cycle = [...stack.slice(stack.indexOf(next)), next];
        const key = [...cycle].sort().join('|');
        if (!seen.has(key)) {
          seen.add(key);
          cycles.push(cycle);
        }
      } else if (c === undefined) {
        dfs(next);
      }
    }
    stack.pop();
    color.set(node, 'black');
  }

  for (const id of adj.keys()) if (!color.has(id)) dfs(id);
  return cycles;
}
```

- [ ] **Step 3: Зелёный, реэкспорт (`export * from './catalog/validate.js';`), коммит**

Run: `npm test -w @odin/core` → PASS, `npm run typecheck` → чисто.

```bash
git add packages/core
git commit -m "feat(core): catalog validator (duplicate ids, unknown deps, cycle warnings)"
```

### Task 13: Пакет tools + чистые функции маппинга сида

**Files:**
- Create: `packages/tools/package.json`, `packages/tools/tsconfig.json`, `packages/tools/vitest.config.ts`, `packages/tools/src/seed-mapping.ts`
- Test: `packages/tools/tests/seed-mapping.test.ts`

- [ ] **Step 1: Scaffold пакета**

`packages/tools/package.json`:

```json
{
  "name": "@odin/tools",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "migrate-seed": "tsx src/migrate-seed.ts",
    "validate-vault": "tsx src/validate-vault.ts"
  },
  "dependencies": {
    "@odin/core": "*"
  }
}
```

`packages/tools/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*.ts", "tests/**/*.ts", "vitest.config.ts"]
}
```

`packages/tools/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['tests/**/*.test.ts'] },
});
```

Run: `npm install` (линкует workspace) — без ошибок.

- [ ] **Step 2: Падающий тест маппинга**

`packages/tools/tests/seed-mapping.test.ts`:

```ts
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
```

Run: `npm test -w @odin/tools` → FAIL (module not found).

- [ ] **Step 3: Реализовать `packages/tools/src/seed-mapping.ts`**

```ts
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
```

- [ ] **Step 4: Зелёный + typecheck + commit**

Run: `npm test -w @odin/tools` → PASS, `npm run typecheck` → чисто.

```bash
git add packages/tools package-lock.json
git commit -m "feat(tools): seed mapping functions (frequency, thresholds, deps, unit, context md)"
```

### Task 14: Скрипт миграции сида

**Files:**
- Create: `packages/tools/src/migrate-seed.ts`, `packages/tools/src/gen-schema.ts`

- [ ] **Step 1: Создать `packages/tools/src/gen-schema.ts`** (генерация JSON Schema файла)

```ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { catalogJsonSchema } from '@odin/core';

export function writeCatalogJsonSchema(outPath: string): void {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(catalogJsonSchema(), null, 2) + '\n');
}
```

- [ ] **Step 2: Создать `packages/tools/src/migrate-seed.ts`**

```ts
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

    const metric: Metric = {
      id,
      name: row['Метрика'],
      category: row['Категория'],
      level: row['Уровень (L1/L2/L3)'] as Metric['level'],
      unit,
      frequency: freq.frequency,
      ...(priorityOf(row['Приоритет']) ? { priority: priorityOf(row['Приоритет']) } : {}),
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
```

Замечание: `import.meta.dirname` требует Node >= 20.11 (стоит 24.x — ок). Импорты `.ts` внутри tools исполняются через tsx.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck` → чисто. (Скрипт без юнит-тестов: вся логика уже покрыта в Task 13; сам скрипт проверяется прогоном в Task 15.)

- [ ] **Step 4: Commit**

```bash
git add packages/tools
git commit -m "feat(tools): seed migration script and JSON Schema generator"
```

### Task 15: CLI-валидатор vault + прогон миграции

**Files:**
- Create: `packages/tools/src/validate-vault.ts`
- Create (генерируются): `vault-demo/catalog.json`, `vault-demo/catalog.schema.json`, `vault-demo/context/*.md`, `docs/migration-report.md`

- [ ] **Step 1: Создать `packages/tools/src/validate-vault.ts`**

```ts
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { catalogSchema, validateCatalog } from '@odin/core';

// npm -w запускает скрипты с cwd = packages/tools, поэтому относительные пути — от корня репо
const ROOT = join(import.meta.dirname, '../../..');
const vaultDir = resolve(ROOT, process.argv[2] ?? 'vault-demo');
const catalogPath = join(vaultDir, 'catalog.json');

if (!existsSync(catalogPath)) {
  console.error(`Не найден ${catalogPath}. Vault должен содержать catalog.json.`);
  process.exit(1);
}

let raw: unknown;
try {
  raw = JSON.parse(readFileSync(catalogPath, 'utf8'));
} catch (e) {
  console.error(`catalog.json — невалидный JSON: ${(e as Error).message}`);
  process.exit(1);
}

const parsed = catalogSchema.safeParse(raw);
if (!parsed.success) {
  console.error('catalog.json не соответствует схеме:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const report = validateCatalog(parsed.data);
for (const issue of report.issues) {
  console.log(`[${issue.level}] ${issue.code}: ${issue.message}`);
}
console.log(
  `${parsed.data.metrics.length} метрик; ошибок: ${report.issues.filter((i) => i.level === 'error').length}, предупреждений: ${report.issues.filter((i) => i.level === 'warning').length}`,
);
process.exit(report.ok ? 0 : 1);
```

- [ ] **Step 2: Прогнать миграцию**

Run: `npm run migrate-seed`
Expected: `OK: 236 metrics -> vault-demo/, report -> docs/migration-report.md`.

- [ ] **Step 3: Прогнать валидатор**

Run: `npm run validate-vault -- vault-demo`
Expected: exit 0, `236 метрик; ошибок: 0`, возможны warnings о циклах.

- [ ] **Step 4: Просмотреть отчёт миграции**

Открыть `docs/migration-report.md`: счётчики секций должны быть осмысленными (ожидание по профилированию: frequencyRemapped = 7, unresolvedDeps — десятки (зависимости в сиде — свободный текст), unparsedAlerts — большинство из 236). Если unresolvedDeps подозрительно близко к 100% — проверить точность совпадения имён (это сигнал бага, не данных).

- [ ] **Step 5: Выборочная проверка глазами**

Run: `node -e "const c=require('./vault-demo/catalog.json'); const m=c.metrics.find(x=>x.id==='odds_movement_impact'); console.log(JSON.stringify(m,null,1))"`
Expected: category Sportsbook, level L2, frequency weekly, depends_on содержит `ggr` (резолв "GGR").
Прочитать `vault-demo/context/odds_movement_impact.md` — секции Ловушки/Как улучшать на месте.

- [ ] **Step 6: Commit**

```bash
git add vault-demo docs/migration-report.md packages/tools
git commit -m "feat: migrate seed to vault-demo (catalog.json + context md + migration report)"
```

### Task 16: Финальная проверка M0+M1

- [ ] **Step 1: Полный прогон**

Run: `npm run typecheck` → чисто; `npm test` → все пакеты PASS; `npm run build` → legacy собирается; `npm run validate-vault -- vault-demo` → exit 0.

- [ ] **Step 2: Идемпотентность миграции**

Run: `npm run migrate-seed`, затем `git status --short`
Expected: рабочая копия чистая (повторный прогон даёт байт-в-байт тот же результат).

- [ ] **Step 3: Push (⚠️ подтверждение владельца, как в Task 8)**

```bash
git push origin main
```

Expected: CI зелёный (typecheck + test + build), Pages передеплоен.
