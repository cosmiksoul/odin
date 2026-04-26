# CONTEXT.md — История проекта ODIN

## Development Timeline

> Каждый закрытый спринт — новая запись в этом разделе. Заполняется на phase CLOSE.

### Pre-MVP (2026-04-25)

- Documentation finalized: 13 ADRs, JTBD with ~75 user stories, Dev-Cycle adapted from Ratanote
- Seed data prepared: 236 iGaming metrics, normalized tags 103→39 canonical
- Catalog prototype from Claude Design ready as starting point for src/

### Sprint 1 — Build Foundation (closed 2026-04-25)

**Цель:** превратить прототип Catalog в нормальный Vite-проект, без визуальной регрессии. Плюс точечный фикс контраста заголовков карточек.

**Что сделано:**
- Vite + React 18.3.1 + `@vitejs/plugin-react` setup в корне проекта
- Все 4 JSX-файла (`app.jsx`, `graph-view.jsx`, `tweaks-panel.jsx`, `tweaks-ui.jsx`) переведены из глобальных функций в ES-модули с явными `import`/`export`
- `data.js`: `window.METRICS_SEED` → `export const METRICS_SEED`
- `Catalog.html` → `src/index.html` (удалены CDN-теги React/ReactDOM/Babel-standalone)
- Создан `src/main.jsx` как bootstrap entry-point
- Контрастный фикс `.card__name` в каталоге (`var(--fg)` → `var(--l1)`, font-weight 600 → 700)
- Fix-cycle: один пропущенный `React.useState` в `FilterGroup` (роняло CATALOG view), плюс контраст в drawer

**Артефакты:** `sprint-1-prompt.md`, `sprint-report-1.md`, `code-review-sprint-1.md`, `test-cases-sprint-1.md`, `sprint-1-fix-prompt.md`.

**QA:** 11 тест-кейсов пройдены (после fix-цикла). Build (`npm run build`), dev (`npm run dev`), preview (`npm run preview`) работают.

**Параллельно (миграция и инфраструктура):**
- Документация мигрирована из Obsidian, зависимости от Стратегического Claude и Obsidian-as-источник-истины убраны
- ADR-006 (формальная атрибуция метрик) отозван по решению автора — `attribution.md` удалён
- Канал `communication` подключён (Obsidian/Activity/Odin/communication, синкается с телефоном)
- `git init` + private remote на GitHub (`cosmiksoul/odin`)
- Native Claude Code installer (миграция с npm-версии)

**Уроки и tech debt:**
- Дубликат функции `cx` в `graph-view.jsx` (compromise для избежания circular import). Кандидат на `lib/util.js` когда появится 2-3 общих утилиты.
- Дубликаты `gSparkPath`/`gFakeValue`/`gFakeDelta` в `graph-view.jsx` vs `app.jsx` — артефакт script-tag-режима, унифицируется в Sprint 2.
- Инлайн `__TWEAKS_STYLE` в `tweaks-panel.jsx` — выпиливается целиком в Sprint 2 (tweaks-panel = рудимент Claude Design).
- `@import url('https://fonts.googleapis.com/...')` в `styles.css` — будущее нарушение ADR-008 при упаковке в Electron. Фиксить до M3.
- Saved/watchlist хранится в `localStorage` (`odin.saved`) — для Electron нужен другой механизм (file-based store / DuckDB / config). Отложено до M3 либо отдельного спринта.

## Open Questions

См. `docs/context/open-questions.md`.