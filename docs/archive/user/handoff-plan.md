# Handoff Plan — переезд из Obsidian в проект ODIN

> ✅ **Миграция выполнена 2026-04-25.** Документ оставлен в `docs/user/` как историческая запись. Вся документация теперь живёт **только в этом проекте** (`docs/`); зависимости от Obsidian сняты, см. обновлённый Cowork-Onboarding и Dev-Cycle. Если запускаешься в новой сессии — этот документ читать не нужно, он про прошлый процесс.

> Пошаговая инструкция как создать репозиторий проекта, перенести подготовленную документацию, скачать прототип, и запустить Cowork+Code на первом спринте.

> **Время выполнения:** ~30-60 минут

---

## Что у нас есть на старте

В Obsidian папке `Activity/Odin/` лежит вся подготовленная документация:

```
Odin/
├── README.md                       — карта папки в Obsidian
├── 00-Concept.md                   — концепция, метафора, demo-сценарий
├── 01-Architecture.md              — техническая архитектура
├── 02-Munin-Master-View.md         — схема значений (в проектировании)
├── 03-Roadmap.md                   — milestones M1-M9 + M-CRED + M-SYNC + M-EDIT
├── 04-Decisions-Log.md             — все ADR (13 решений + 1 отозванное)
├── 05-Open-Questions.md            — что ещё предстоит решить
├── 06-Attribution.md               — формулировки атрибуции
├── 07-Munin-Sync-Contract.md       — спецификация Parquet-витрины
├── CLAUDE.md                       — поведенческие правила для Claude Code
├── JBTD.md                         — backlog ~75 user stories
├── Dev-Cycle.md                    — 9-фазный цикл разработки
├── Setup/
│   ├── claude-code-settings.md     — инструкция по ~/.claude/settings.json
│   └── cowork-onboarding.md        — инструкция как Cowork стартует в сессии
└── Metric examples/
    ├── README.md                    — что в папке
    ├── igaming_metrics_normalized.json  — seed data 236 метрик
    └── _archive/
        ├── README.md
        ├── igaming_metrics.csv     — после переноса вручную
        └── igaming_metrics.md      — после переноса вручную
```

**Ещё не сделано (твои ручные действия):**
- Перенос `igaming_metrics.csv` и `igaming_metrics.md` в `_archive/` через проводник Windows
- Применение `~/.claude/settings.json` по инструкции из `Setup/claude-code-settings.md`

---

## Цель handoff'а

В конце получаем папку проекта с такой структурой:

```
C:\Users\cosmi\Projects\odin\         (или другое место по твоему выбору)
├── CLAUDE.md
├── README.md                          — entry point проекта
├── .claude/
│   └── settings.json                  — project-scope settings (опционально, можно позже)
├── docs/
│   ├── context/                       — стабильное (концепция, архитектура, ADR)
│   │   ├── concept.md
│   │   ├── architecture.md
│   │   ├── decisions-log.md
│   │   ├── munin-sync-contract.md
│   │   ├── attribution.md
│   │   └── open-questions.md
│   ├── project/                       — оперативное (планирование, спринты)
│   │   ├── JTBD-full-scope.md
│   │   ├── Dev-Cycle.md
│   │   ├── Cowork-Onboarding.md
│   │   └── CONTEXT.md                 — Timeline проекта (создаётся пустым)
│   └── user/                          — для конечных пользователей (создаётся пустой папкой)
├── src/                                — код прототипа Catalog от Claude Design
├── default-vault/
│   └── _seed/
│       └── igaming_metrics.json
├── package.json                       — будет создан в M3
├── .gitignore
└── .git/                               — git инициализирован, первый коммит
```

---

## Шаги

### Шаг 0: Предусловия (выполнить до начала)

- [x] Перенесён CSV и MD в `Odin/Metric examples/_archive/` через проводник Windows
- [x] Применён `~/.claude/settings.json` по инструкции `Setup/claude-code-settings.md`
- [x] Установлен Claude Code: `npm install -g @anthropic-ai/claude-code` (проверь через `claude --version`)
- [x] Установлен Git
- [x] Решено где живёт проект — например `C:\Users\cosmi\Projects\odin\`

### Шаг 1: Создание директории проекта

```powershell
# В PowerShell
cd C:\Users\cosmi\Projects
mkdir odin
cd odin

# Создаём структуру папок
mkdir docs
mkdir docs\context
mkdir docs\project
mkdir docs\user
mkdir default-vault
mkdir default-vault\_seed
mkdir src
```

### Шаг 2: Копирование документации из Obsidian

Открой проводник Windows. Источник: `C:\Users\cosmi\OneDrive\Documents\Obsidian Vault\Activity\Odin\`. Назначение: `C:\Users\cosmi\Projects\odin\`.

**Копируй (не перемещай!) — файлы должны остаться в Obsidian для будущих правок:**

#### 1. В корень проекта `C:\Users\cosmi\Projects\odin\`

| Из Obsidian | В проект | Переименовать |
|---|---|---|
| `Odin/CLAUDE.md` | `CLAUDE.md` | — |

#### 2. В `docs/context/`

| Из Obsidian                      | В проект                              | Переименовать    |
| -------------------------------- | ------------------------------------- | ---------------- |
| `Odin/00-Concept.md`             | `docs/context/concept.md`             | да, убрать `00-` |
| `Odin/01-Architecture.md`        | `docs/context/architecture.md`        | да               |
| `Odin/04-Decisions-Log.md`       | `docs/context/decisions-log.md`       | да               |
| `Odin/05-Open-Questions.md`      | `docs/context/open-questions.md`      | да               |
| `Odin/06-Attribution.md`         | `docs/context/attribution.md`         | да               |
| `Odin/07-Munin-Sync-Contract.md` | `docs/context/munin-sync-contract.md` | да               |

**НЕ копируем:**
- `Odin/README.md` — это Obsidian-карта, не нужна в проекте
- `Odin/02-Munin-Master-View.md` — wip, сольётся в architecture или останется в Obsidian
- `Odin/03-Roadmap.md` — roadmap живёт в Obsidian как стратегический документ. В проекте его роль выполняет JTBD.

#### 3. В `docs/project/`

| Из Obsidian                       | В проект                            | Переименовать |
| --------------------------------- | ----------------------------------- | ------------- |
| `Odin/JBTD.md`                    | `docs/project/JTBD-full-scope.md`   | да            |
| `Odin/Dev-Cycle.md`               | `docs/project/Dev-Cycle.md`         | —             |
| `Odin/Setup/cowork-onboarding.md` | `docs/project/Cowork-Onboarding.md` | да            |

#### 4. В `default-vault/_seed/`

| Из Obsidian | В проект |
|---|---|
| `Odin/Metric examples/igaming_metrics_normalized.json` | `default-vault/_seed/igaming_metrics.json` |

### Шаг 3: Создать недостающие файлы

#### `README.md` в корне проекта

Создай файл `C:\Users\cosmi\Projects\odin\README.md` с содержимым:

```markdown
# ODIN

Privacy-first BI tool with local LLM for analysts in regulated industries (iGaming, fintech, healthcare).

## Status

Pre-MVP. Documentation finalized, code prototype incoming.

## Quick start

[Будет добавлено когда будет M3 (Electron setup)]

## Documentation

- **For developers using Claude Code:** see `CLAUDE.md`
- **Concept and architecture:** `docs/context/`
- **Backlog and sprints:** `docs/project/`
- **User documentation:** `docs/user/`

## Attribution

Metrics list started from Andrey Sviridkov's open reference (https://t.me/sviridkovproigaming).
See `docs/context/attribution.md` for full details.
```

#### `docs/project/CONTEXT.md`

Создай пустой файл `docs/project/CONTEXT.md` с заголовком — будет заполняться по мере спринтов:

```markdown
# CONTEXT.md — История проекта ODIN

## Development Timeline

> Каждый закрытый спринт — новая запись в этом разделе. Заполняется на phase CLOSE.

### Pre-MVP (2026-04-25)

- Documentation finalized: 13 ADRs, JTBD with ~75 user stories, Dev-Cycle adapted from Ratanote
- Seed data prepared: 236 iGaming metrics, normalized tags 103→39 canonical
- Catalog prototype from Claude Design ready as starting point for src/

## Open Questions

См. `docs/context/open-questions.md`.
```

#### `.gitignore` в корне проекта

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Build
build/
dist/
out/

# Misc
.DS_Store
*.log
.env
.env.local
.env.*.local

# Editor
.vscode/
.idea/
*.swp
*.swo

# OS
Thumbs.db

# Claude Code (local cache)
.claude/projects/
.claude/cache/

# Vault user data (default-vault is in repo, but actual user vaults are not)
user-vault/
```

### Шаг 4: Скачать прототип Catalog

Прототип сейчас в Claude Design (https://claude.ai/design — раздел в Claude). Ты упоминал что упёрся в rate-limit.

**Когда rate-limit пройдёт (после 29 апреля судя по предыдущим обсуждениям):**

1. Открыть проект ODIN в Claude Design
2. Скачать ZIP с кодом
3. Распаковать содержимое в `C:\Users\cosmi\Projects\odin\src\`
4. **Важно:** содержимое архива (файлы и папки), не сам архив. Проверить что в `src/` появились `App.tsx`, `components/`, `pages/` или подобное.

### Шаг 5: Чистка ссылок на Obsidian в скопированных документах

В скопированных файлах (`docs/context/*.md` и `docs/project/*.md`) есть ссылки в формате `[[02-Munin-Master-View]]` и подобные — это **Obsidian wiki-links**, которые в проекте не работают.

**Что делать:** прогони все .md файлы в `docs/` через find-and-replace в любом редакторе:

| Найти | Заменить на |
|-------|-------------|
| `[[00-Concept]]` | `concept.md` |
| `[[01-Architecture]]` | `architecture.md` |
| `[[02-Munin-Master-View]]` | `(см. architecture.md, секция Munin)` |
| `[[03-Roadmap]]` | `(roadmap живёт в Obsidian, в проекте — JTBD-full-scope.md)` |
| `[[04-Decisions-Log]]` | `decisions-log.md` |
| `[[05-Open-Questions]]` | `open-questions.md` |
| `[[06-Attribution]]` | `attribution.md` |
| `[[07-Munin-Sync-Contract]]` | `munin-sync-contract.md` |
| `[[JBTD]]` | `JTBD-full-scope.md` |
| `[[Dev-Cycle]]` | `Dev-Cycle.md` |

Также есть ссылки вида `[[../Activity/Ratanote/]]` или `[[../00-Ideas/iGaming-Intelligence-MCP]]` — эти **удалить** (они на материалы вне проекта, в проекте их нет).

**Проще всего** через VS Code: открыть папку `docs/`, нажать Ctrl+Shift+H (find-and-replace across files), пройти по таблице выше.

### Шаг 6: Git инициализация

```powershell
cd C:\Users\cosmi\Projects\odin
git init
git add .
git commit -m "Initial commit: documentation and seed data

- Documentation: 13 ADRs, concept, architecture, JTBD, Dev-Cycle
- Seed data: 236 iGaming metrics (normalized from Sviridkov reference)
- Prototype Catalog from Claude Design in src/

Pre-MVP state. Ready for first sprint M1 (Catalog UX debts)."
```

### Шаг 7: Создание GitHub-репозитория (опционально для MVP)

Можно отложить пока — проект локальный. Но если хочется бэкап / shared vault setup попробовать:

```powershell
# Создать пустой репозиторий на github.com (через UI)
# Затем привязать локальный:
git remote add origin git@github.com:N13Z/odin.git
git push -u origin main
```

### Шаг 8: Запуск Cowork в проекте

Открой Claude Desktop. **Создай новый чат** под названием "Cowork — ODIN MVP development".

В первое сообщение кинь:

> Привет. Я работаю над ODIN — privacy-first BI с локальной LLM. Ты — Cowork-инстанс. Прочитай `docs/project/Cowork-Onboarding.md` в проекте, потом ответь готов ли к работе.

Cowork прочитает onboarding, поймёт что он Cowork, прочитает в правильном порядке остальные документы, отчитается. Дальше можно идти в PLAN phase первого спринта.

### Шаг 9: Запуск Claude Code в проекте

Открой PowerShell:

```powershell
cd C:\Users\cosmi\Projects\odin
claude
```

Claude Code стартанёт в папке проекта. Он сам прочитает `CLAUDE.md` (это его entry point). Затем ты передаёшь sprint-prompt от Cowork — и работа начинается.

---

## После handoff'а — первый спринт

**Sprint 1: M1 — UX-долги Catalog.** Цель — закрыть Q-UX.1 / Q-UX.2 / Q-UX.4 из `docs/context/open-questions.md`.

Процесс:

1. Открываешь Cowork в Claude Desktop
2. Cowork читает onboarding + decisions-log + JTBD + sprint plan
3. **PLAN phase:** обсуждаешь с Cowork что именно закрываем в первом спринте
4. **PROMPT phase:** Cowork пишет `docs/project/sprint-1-prompt.md`
5. Ты копируешь содержимое prompt'а
6. Открываешь Claude Code в PowerShell, вставляешь prompt
7. **DEV phase:** Claude Code пишет код, итерируется по задаче
8. **Code Code → отчёт:** Claude Code пишет `docs/project/sprint-report-1.md`
9. **CODE REVIEW phase:** Cowork в Claude Desktop читает отчёт + diff, формирует `docs/project/code-review-sprint-1.md`
10. Обсуждаешь concerns с Cowork → принимаешь решения
11. Если Blockers — fix через Code (FIX phase)
12. **TEST PREP:** Cowork готовит `docs/project/test-cases-sprint-1.md`
13. **QA:** ты запускаешь `npm run dev` в проекте, тестируешь
14. **FIX → RETEST** при необходимости
15. **CLOSE:** Cowork обновляет JTBD + CONTEXT, фиксирует урок

---

## Чеклист завершения handoff'а

- [ ] CSV и MD перенесены в `_archive/` через проводник
- [ ] `~/.claude/settings.json` обновлён по инструкции
- [ ] Claude Code установлен и работает
- [ ] Создана папка проекта с правильной структурой
- [ ] Скопированы 6 файлов в `docs/context/`
- [ ] Скопированы 3 файла в `docs/project/`
- [ ] Скопирован seed JSON в `default-vault/_seed/`
- [ ] Скопирован `CLAUDE.md` в корень
- [ ] Создан `README.md` в корне
- [ ] Создан `docs/project/CONTEXT.md`
- [ ] Создан `.gitignore`
- [ ] Прогнан find-and-replace для wiki-links
- [ ] Прототип Catalog скачан и распакован в `src/` (после rate-limit)
- [ ] `git init` + первый коммит сделан
- [ ] Cowork запущен в Claude Desktop, прочитал onboarding
- [ ] Claude Code запущен в PowerShell, прочитал CLAUDE.md

После всех галочек — готов к старту Sprint 1.

---

## Что я (стратегический Claude в этом чате) сделать НЕ могу

- ❌ Создать физические папки на твоём диске
- ❌ Запустить PowerShell-команды
- ❌ Скачать прототип из Claude Design
- ❌ Запустить Cowork-инстанс или Claude Code
- ❌ Обновить `~/.claude/settings.json`

Все шаги — твои руками. Я могу:
- ✅ Готовить документацию (что и сделано)
- ✅ Объяснять как работает каждый шаг
- ✅ Помогать с troubleshooting если что-то сломается
- ✅ Обновлять Obsidian-документы при необходимости

---

## Что делать если что-то пошло не так

| Проблема | Решение |
|----------|---------|
| Find-and-replace ломает wiki-link, потому что они в коде/тексте | Делай по одному, не сразу всё |
| `git init` ругается на line endings | `git config --global core.autocrlf true` (Windows) |
| Claude Code не видит `CLAUDE.md` | Проверь что запускаешь `claude` из папки проекта (не из родительской) |
| Cowork не понимает что он Cowork | В первом сообщении явно скажи: "Прочитай `docs/project/Cowork-Onboarding.md`. Ты — Cowork-инстанс." |
| Прототип в `src/` не запускается | M3 milestone — Electron setup. Это первый Code sprint после UX-долгов M1 |
