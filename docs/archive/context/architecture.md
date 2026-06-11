---
created: '2026-04-24'
part-of: Odin/README
tags:
  - odin
  - architecture
  - tech
---
# 01 · Архитектура ODIN

> ⚠ **Важно:** архитектура серьёзно пересобрана после ADR-008 (local-first), ADR-010 (push-based интеграция), ADR-011 (in-app WYSIWYG-редактор и history UI). Ранее обсуждавшаяся zero-backend / GitHub Pages модель **больше не основная** — она остаётся как опция для отдельной публичной демки, если когда-то будет.

## Обзор

ODIN — **локальная desktop-app**. Electron-обёртка над React-приложением, всё работает на машине пользователя. Никакого cloud в основном пути.

Структурно:
- **Frontend** — React в Electron-контейнере (как Obsidian, как VS Code)
- **Storage values** — DuckDB-файл на диске
- **Storage semantics** — MD-файлы на диске + локальный git
- **MCP-сервер (Хугин)** — child process самого Electron-приложения
- **LLM** — bring-your-own: Ollama / Claude Desktop / OpenAI-compatible endpoint
- **Sync с ДВХ** — push-based через Parquet-витрину, см. munin-sync-contract.md

## Слои системы (концептуально)

| # | Слой | Что | Реализация |
|---|------|-----|-----------|
| 1 | Хранилище значений | временные ряды метрик | DuckDB локально |
| 2 | Хранилище смысла | спеки, описания, аномалии | MD-файлы + локальный git |
| 3 | Редактор смысла | встроенный WYSIWYG в ODIN | TipTap/Lexical/ProseMirror + сохранение в MD + локальный git commit. **В MVP, см. ADR-011** |
| 4 | Фронт-визуализация | UI | React + Electron |
| 5 | LLM-интерфейс | MCP-сервер | Хугин — child process Electron |
| 6 | LLM | модель | bring-your-own (Ollama / Claude Desktop / etc) |

Слой 6 — **не наш**. Пользователь выбирает свою LLM (Ollama / Claude Desktop / OpenAI-compatible).

## Стек по компонентам

### ODIN (Electron-app)

- **Framework:** Electron + React + Vite + TypeScript
- **Альтернатива:** Tauri (легче, на Rust). Решение между Electron и Tauri отложено до старта реализации.
- **Styling:** Tailwind CSS (как уже сделано в прототипе)
- **State:** Zustand
- **Search:** Fuse.js (fuzzy поиск)
- **Charts:** Recharts (treemap, bars, sparklines)
- **MD-rendering:** unified/remark + frontmatter parser
- **MD-editing (WYSIWYG):** TipTap или Lexical или ProseMirror — выбор отложен до старта M-EDIT, см. open-questions.md
- **Git operations:** simple-git (Node.js bindings) — для commit/log/diff/revert через embedded git
- **Distribution:** electron-builder → .dmg / .exe / .AppImage в GitHub Releases

**Почему Electron:**
- Доступ к файловой системе через Node API (читать/писать MD напрямую)
- Запуск дочерних процессов (MCP-сервер как child process)
- Системные нотификации, menu bar
- Оффлайн работа из коробки
- Obsidian — Electron, паттерн проверен

### Мунин — semantic layer (MD)

- **Storage:** локальная папка `<vault>/metrics/` со структурой:
  ```
  metrics/
    ggr_margin/
      spec.md
      anomaly-2026-03-15.md
      anomaly-2026-04-20.md
    ftd_count/
      spec.md
    ...
  ```
- **Format:** MD с YAML-frontmatter (см. open-questions.md Q2.7 для черновика схемы)
- **Versioning:** локальный git. `git init` в папке vault, коммиты на каждое изменение. Без push (если пользователь не настроит).
- **Edit:** через встроенный WYSIWYG-редактор в карточке метрики (см. ADR-011). Frontmatter поля → формочки, body → rich-text. Сохранение в MD-файл + локальный git commit с автогенерируемым сообщением. Пользователь не работает с git напрямую.

### Мунин — values layer (DuckDB)

- **Storage:** локальный файл `<vault>/data/odin.duckdb`
- **Sync source:** Parquet-витрина по контракту munin-sync-contract.md
- **Sync mechanisms (MVP):** manual import через UI + watch local folder
- **Sync mechanisms (post-MVP):** HTTP endpoint, S3-compatible, SFTP
- **Query engine:** DuckDB embedded (через `@duckdb/node-api` для Node.js / Electron)

**Почему DuckDB:**
- Один файл, нативная аналитическая БД, быстрые агрегации
- Читает Parquet напрямую без импорта (можно даже не превращать в нативную БД, читать витрину как есть)
- Embedded (нет сервера)
- Поддерживает стандартный SQL — миграция на ClickHouse/BigQuery в будущем тривиальна

**Альтернативы рассмотренные и отклонённые:** SQLite (хуже для аналитики), PostgreSQL в Docker (overhead запуска), Supabase/BigQuery (cloud — против ADR-008).

### Хугин (MCP-сервер)

- **Protocol:** MCP (Model Context Protocol) от Anthropic
- **Runtime:** Node.js или Python (выбор отложен до старта v0.3, см. open-questions.md Q3.1)
- **Deployment:** child process самого Electron-приложения. Запустил ODIN → MCP автоматически слушает. Claude Desktop подключается к нему через локальный transport.
- **Data access:**
  - DuckDB embedded → значения
  - File system → MD-файлы (спеки, аномалии)
  - Опционально: local git log для changelog

**Tools (черновой список):**
- `get_metric_spec(metric_id)` — спека из MD-файла (frontmatter + body)
- `get_metric_value(metric_id, date?, dimensions?)` — значения из DuckDB
- `get_metric_trend(metric_id, period, dimensions?)` — временной ряд
- `find_anomalies(metric_id, period)` — где отклонения от baseline/бенчмарков **по данным** + все уже залогированные anomaly-заметки
- `get_metric_history(metric_id)` — список прошлых anomaly-заметок (опционально + git log)
- `list_related_metrics(metric_id)` — зависимости из spec
- `compare_dimensions(metric_id, dimension, date)` — срез по разрезам
- `explain_metric(metric_id, question)` — семантическая справка: spec + ловушки + прошлые аномалии

### LLM (bring-your-own)

ODIN поддерживает несколько режимов в порядке предпочтения для privacy-чувствительных пользователей:

1. **Ollama (default для MVP)** — локальная модель, ничего не уходит. Рекомендованные: Qwen 14B, Llama 3.1 8B, DeepSeek R1.
2. **LM Studio / vLLM / любой OpenAI-compatible local endpoint** — то же самое, через universal API.
3. **Claude Desktop через MCP** — для пользователей, чья security-policy позволяет cloud LLM. Лучшее качество.
4. **Anthropic / OpenAI API напрямую с пользовательским ключом** — настройка в UI.

В UI — **dual mode**: пользователь выбирает model provider, может переключаться между local и cloud. По умолчанию — local.

**Honest disclaimer:** локальные модели (даже Qwen 14B) уступают Claude в многошаговых рассуждениях. Для MVP demo используем самую сильную доступную локальную модель + опционально показываем сравнение с Claude через MCP.

## Схема потоков данных

### Данные (sync с компании)

```
ДВХ компании (Snowflake/BigQuery/etc)
       │
       │ data-team готовит dbt-модель,
       │ экспорт в Parquet
       ▼
master_view.parquet
       │
       │ кладётся в shared folder / S3 / HTTP endpoint
       ▼
[Мунин: sync mechanism]
       │
       │ ODIN периодически проверяет источник, при изменении —
       │ загружает в локальный DuckDB
       ▼
~/odin-vault/data/odin.duckdb (локально на машине пользователя)
       │
       │ читается на каждый запрос UI или MCP
       ▼
UI / Хугин
```

### Read path (UI → данные)

```
Electron-app (single process):
   │
   ├─► main process (Node.js):
   │     - доступ к файловой системе (читать MD)
   │     - DuckDB embedded (читать значения)
   │     - запуск MCP-сервера как child process
   │
   ├─► renderer process (React):
   │     - UI рендерится
   │     - запрашивает данные через IPC у main process
   │
   └─► child process (Хугин MCP):
         - слушает stdio для Claude Desktop
         - читает те же файлы и DuckDB
```

### LLM path

```
Пользователь печатает в чате ODIN
   │
   ▼
ODIN отправляет запрос к выбранному LLM:
   │
   ├─► Ollama (localhost:11434) ──► local model ──► response
   │
   ├─► Claude Desktop через MCP ──► Anthropic API ──► response
   │
   └─► Anthropic API direct (с ключом пользователя) ──► response
```

## Структура vault'а пользователя

ODIN работает с папкой ("vault") на диске пользователя. Структура:

```
~/odin-vault/                            # выбирается при первом запуске
├── metrics/                             # семантический слой
│   ├── ggr_margin/
│   │   ├── spec.md
│   │   ├── anomaly-2026-03-15.md
│   │   └── anomaly-2026-04-20.md
│   ├── ftd_count/
│   │   └── spec.md
│   └── ... (236 метрик)
├── data/                                # значения
│   ├── odin.duckdb                      # локальная БД
│   └── master_view.parquet              # последняя загруженная витрина (опционально)
├── config.json                          # настройки vault
└── .git/                                # локальный git для версионности metrics/
```

`vault` — **полностью на машине пользователя**. ODIN не отправляет ничего из этой папки наружу.

## Структура репозитория ODIN (исходники приложения)

```
odin/
├── electron/
│   └── main.js                          # main process (~50 строк)
├── src/                                 # React UI (renderer)
│   ├── pages/
│   ├── components/
│   ├── hooks/
│   └── lib/
│       ├── duckdb/                      # обёртка @duckdb/node-api
│       ├── md-parser/                   # frontmatter + body
│       ├── sync/                        # sync mechanisms (file/http/s3)
│       ├── git/                         # обёртка над simple-git (commit/log/diff/push/pull)
│       ├── credentials/                 # обёртка над keytar (ADR-012)
│       └── llm/                         # ollama/anthropic/openai clients
├── mcp-server/                          # Хугин — child process
│   ├── src/
│   └── package.json
├── default-vault/                       # дефолтный vault для нового пользователя
│   ├── _seed/
│   │   └── igaming_metrics.json         # seed data — 236 метрик iGaming (см. секцию "Seed data")
│   └── metrics/                         # 236 MD-файлов, сгенерированные скриптом миграции из _seed/
├── data-generation/                     # генерация синтетики (Python)
│   ├── generate_master_view.py
│   └── scenarios/                       # 3-5 сценарных датасетов
├── scripts/
│   └── migrate_seed_to_md.py            # one-shot скрипт: _seed/igaming_metrics.json → 236 spec.md
├── docs/
│   ├── context/                         # концепция, архитектура, ADR (стабильное)
│   │   ├── concept.md
│   │   ├── architecture.md
│   │   ├── decisions-log.md
│   │   └── munin-sync-contract.md
│   ├── project/                         # JTBD, sprints (управляет Cowork)
│   │   ├── JTBD-full-scope.md
│   │   ├── sprint-N-prompt.md
│   │   └── sprint-report-N.md
│   └── user/                            # документация для конечных пользователей
│       ├── installation.md
│       ├── git-remote-setup.md          # как подключить shared vault
│       └── munin-sync-contract.md       # копия из context/, для data-инженеров
├── package.json
├── electron-builder.yml                 # config для .dmg/.exe
├── CLAUDE.md                            # entry point для Claude Code
└── README.md
```

## Seed data — дефолтный каталог метрик

ODIN поставляется с **готовым набором из 236 iGaming-метрик** в качестве дефолтного контента. Это позволяет пользователю запустить приложение и сразу иметь работающий каталог для исследования, без необходимости импортировать или создавать метрики с нуля.

**Содержание seed data:** 236 метрик iGaming с нормализованными тегами (103 → 39 канонических), Data Governance слоем (ownership, sources, maturity, DQ framework) и приведением к единой схеме `metric_id × frontmatter × body`.

**Что входит в seed data:**
- 236 метрик iGaming с категориями: Acquisition, Activation, Monetization, Retention, Tech, Sportsbook, Casino, Risk & Fraud, Compliance, Operations
- Для каждой метрики: формула, числитель/знаменатель, важность, ловушки, рецепты улучшения, зависимости, разрезы, бенчмарки по регионам (Tier-1 / LatAm-CIS / India-SEA), пороги алертов (red/yellow), уровень (L1/L2/L3), приоритет (Must/Should/Nice)
- Категории канонических тегов: 39 значений по разрезам (geo, product, segment, channel, tier, device, provider, payment_method, bonus_type, game)

**Где живёт исходник:** `default-vault/_seed/igaming_metrics.json` — JSON после нормализации.

**Как попадает в vault пользователя:**
1. При первой установке ODIN копирует `default-vault/` в выбранный пользователем путь vault'а
2. **One-shot скрипт миграции** `scripts/migrate_seed_to_md.py` превращает JSON в 236 MD-файлов с YAML-frontmatter в `<vault>/metrics/<metric_id>/spec.md`
3. Скрипт запускается автоматически при первом старте, либо вручную через Settings → "Reset to default catalog"

**Setup wizard варианты** (см. JTBD-full-scope.md секция 1):
- **Дефолтный каталог** — копируем `_seed` → `metrics`, готово к работе
- **Дефолтный каталог + редактирование** — то же, но пользователь сразу планирует править метрики под свою компанию
- **Подключиться к existing remote** — клонировать vault коллеги, наш _seed игнорируется
- **Импорт своей схемы** — post-MVP, заглушка в setup wizard

**Цикл жизни seed data:**
- В **репозитории ODIN** _seed это immutable артефакт — обновляется только при релизах
- В **vault'е пользователя** после миграции это уже его собственные MD-файлы — может редактировать, добавлять, удалять
- При **обновлении ODIN** _seed обновляется (если в новой версии есть изменения), но vault пользователя **не трогается** автоматически — мы не перезаписываем его правки

**Принцип:** папка `metrics/` в vault'е пользователя — первоклассный источник истины с момента установки. _seed — стартовая точка, не runtime-зависимость.

**Миграционный шаг (M2):**
Скрипт `migrate_seed_to_md.py` — простой one-shot:
- Читает `_seed/igaming_metrics.json`
- Для каждой метрики:
  - Создаёт папку `metrics/<metric_id>/`
  - Генерирует `spec.md` с YAML-frontmatter (структурированные поля) + body (важность, ловушки, как улучшать)
  - Wiki-links на зависимости (`[[GGR]]`)
- Делает первый коммит "Initial seed: 236 iGaming metrics"

## Ключевые архитектурные решения (обновлено)

1. **Local-first.** Никакого cloud в основном пути. Данные на машине пользователя. См. decisions-log.md ADR-008.
2. **Single-process Electron.** UI, файловый доступ, БД, MCP-сервер — всё в одном приложении. Запуск = одна иконка.
3. **MD-файлы + локальный git** для семантики. **DuckDB-файл** для значений. Двойственная природа Мунина.
4. **Bring-your-own-model.** ODIN не идёт с встроенной LLM — это сознательный выбор. Пользователь подключает по своим compliance-требованиям.
5. **Push-based DWH-интеграция через Parquet-контракт.** ODIN не подключается к продакшен-системам, компания сама готовит витрину. См. decisions-log.md ADR-010, munin-sync-contract.md.
6. **In-app WYSIWYG-редактор + history UI.** Пользователь правит метрики прямо в ODIN, не зная git/MD/CLI. Под капотом — MD-файлы и локальный git, но в UX этого нет. См. decisions-log.md ADR-011.

## Открытые технические вопросы

См. open-questions.md.

## Что выпало из архитектуры (после переосмысления)

Эти решения **больше не актуальны** после ADR-008/010/011:

- ❌ ~~GitHub Pages как hosting~~ — ODIN устанавливается локально
- ❌ ~~DuckDB-WASM в браузере~~ — теперь embedded DuckDB в Electron
- ❌ ~~GitHub API для git history~~ — git локальный, читается через simple-git
- ❌ ~~OAuth / PAT~~ — нет cloud auth
- ❌ ~~Hosted MCP-сервер на Fly.io~~ — MCP — child process Electron
- ❌ ~~Внешний редактор (VS Code / Obsidian) как способ редактирования~~ — встроенный WYSIWYG в ODIN, см. ADR-011
- ❌ ~~Multi-user / конфликты редактирования~~ — single-user

Если в будущем появится отдельная публичная read-only демка (для рекрутёрского "посмотреть в браузере"), часть из этого вернётся — но это не основной путь.
