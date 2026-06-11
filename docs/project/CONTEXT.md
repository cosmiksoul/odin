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

### Sprint 2 — Cleanup + Real Data + UX Consistency (closed 2026-04-27)

**Цель:** перейти от прототипа на 47 захардкоженных метриках к работающему UI на 236 реальных метриках из seed JSON, унифицировать UI-компоненты между Catalog и Graph, починить семантику и UX-долги.

**Структура:** двух-проходный спринт + два fix-cycles по результатам QA.

**Pass 1 (commit `280baf7`) — Cleanup + Real Data:**
- Полный выпил tweaks-panel: удалены `tweaks-panel.jsx`, `tweaks-ui.jsx`, очищена `tw`-props chain в `app.jsx`
- Дубликаты функций → новый `src/lib/util.js`: `cx`, `sparkPath`, `fakeValue`, `fakeDelta`, `sevBadge` (выбран канон из `app.jsx`)
- 236 метрик из `default-vault/_seed/igaming_metrics.json` через `adaptMetric()` адаптер в `data.js` (русские колонки → UI-shape)

**Pass 2 (commit `22981d2`) — UX Consistency:**
- `src/components/ControlBar.jsx` — общий компонент для Catalog и Graph: Filters btn + counter X/Y + alerts-counter + view-specific (Size/Layout vs Zoom)
- `src/components/FiltersDrawer.jsx` — унифицированный фильтр-drawer, порядок: Alerts → Level → Priority → Owner → Freq → Category. Alerts radio → multi-select Set
- `src/components/MetricPreview.jsx` — один компонент для drawer в Catalog и в Graph (без `Catalog /` префикса)
- Правильная семантика L1/L2/L3 (Стратегические / Операционные / Диагностические) с collapsible секциями + persist в localStorage
- Постоянные подписи всех нод графа (не только L1)
- Контентный hover-tooltip: status badge + value + WoW delta + meta
- Z-index hover-preview через структурное решение (убрана floating Filters-кнопка)

**Fix-cycle 1 — 8 UX-фиксов по итогам QA:**
- Multi-pin восстановлен (Code выбрал `PinnedMetricCard.jsx` — отдельный компонент, не compact-mode у MetricPreview)
- Zoom применяется только к canvas content (UI overlay decoupled)
- Node spacing увеличен
- Cascading filter counts (счётчики внутри FiltersDrawer пересчитываются при последовательной фильтрации)
- Default state: L1 expanded, L2/L3 collapsed (при первом запуске)
- L1/L2/L3 subtitles — убраны из Graph, добавлены в Catalog
- Compact number formatter (`formatCompactNumber`: 50000000 → 50M)
- ControlBar margins выровнены между Catalog и Graph

**Fix-cycle 2 — 3 multi-pin полировки:**
- Pin highlight остаётся постоянным (через `anyFocus` state, объединяет hover ∪ pinned)
- Tooltip следует за нодой (SVG `getScreenCTM()` projection + auto-flip у краёв)
- `pinc__open` кнопка всегда видна + restyle под `.fbtn`/`.cbar` стиль

**Артефакты Sprint 2** (10 документов): `sprint-2-prompt.md`, `sprint-report-2.md`, `code-review-sprint-2.md`, `test-cases-sprint-2.md`, `sprint-2-fix-prompt.md`, `sprint-2-fix-report.md`, `sprint-2-fix-2-prompt.md`, `sprint-2-fix-2-report.md`, `gemini-research-prompt-metrics.md` (для параллельной работы), `roadmap` HTML-артефакт (визуальная схема MVP-1 → MVP-2).

**QA:** 16 тест-кейсов (TC-1..TC-16), все PASS после двух fix-cycles. Build green, dev/preview работают. Bundle size 582KB (warn — допустим для прототипа).

**Параллельные процессные изменения:**
- Согласован двух-этапный MVP (MVP-1 read-only catalog → MVP-2 + WYSIWYG/sync/LLM). ADR-014 формально не написан, в голове устаканен. Roadmap-артефакт визуализирует.
- ADR-006 (атрибуция) отозван (Sprint 1 close — но финализировано в Sprint 2): `attribution.md` удалён, секции вычищены.
- Зона Cowork расширена: может редактировать `docs/context/` по итогам диалога, формирует ADR (ранее это было «эскалация страт. Claude», который уволен).
- `.gitignore` += `.obsidian/`, `.claude/settings.local.json` — локальный шум не попадает в репо.

**Уроки и tech debt:**
- **Скоуп прототипа меняется при росте данных:** 47 → 236 метрик вскрыло проблемы которые были невидимы (Graph layout перегружается, Catalog scroll слепой). UX-валидация на маленьких данных не репрезентативна.
- **Multi-pin было ошибочно удалено в Pass 2** (Code решил «single source of truth», убрал side-panel). Восстановлено в fix-cycle 1. Урок: продуктовые решения уровня «удалить функциональность» — зона пользователя, не Code.
- **Filter-driven Graph** — рекомендация Cowork для Sprint 3 как замена force-directed/clustering. Сворачивание отдельных нод обсуждено и отклонено (state hell, конфликт с pin).
- **Tolaria** ([tolaria.md](https://tolaria.md/), AGPL-3.0) обнаружен как близкий референс: MD + git + MCP + BlockNote WYSIWYG. Изучить для M-EDIT и MCP-bridge паттернов в Sprint 4+ (не копировать код — лицензия copyleft).
- **Темп выше прогноза.** Sprint 2 + два fix-cycle закрыты за один продуктивный сеанс. Реалистичная переоценка: MVP-1 ≈ 1 месяц, MVP-2 ≈ 3-4 месяца (вместо изначальных 6).

**Параллельная work-in-progress:**
- Gemini Deep Research для переработки seed-каталога метрик (промпт готов, ждёт запуска пользователем). После — возможно отдельный Content-Cowork инстанс для доводки JSON. Workflow задокументирован в `communication/2026-04-26-content-cowork-workflow.md`.

## Open Questions

См. `docs/context/open-questions.md`.