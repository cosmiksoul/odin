# Sprint 2 — Fix Prompt

## Overview

QA Sprint 2 нашёл 8 пунктов для фикса (детали — `docs/project/test-cases-sprint-2.md`, `docs/project/code-review-sprint-2.md`). Все 8 в одном цикле, один коммит в конце.

**Состояние:** Pass 2 уже закоммичен (`git log` покажет коммит «Sprint 2 Pass 2: ...»). Этот fix — **поверх** уже коммитнутого Pass 2. После завершения — пользователь делает один коммит «Sprint 2 fix-cycle: ...».

**Скоуп — 8 фиксов:**

1. FIX-1: Multi-pin на Graph вернуть
2. FIX-2: Zoom только canvas content (не UI)
3. FIX-3: Разнести ноды графа + (опц.) auto-hide labels at low zoom
4. FIX-4: Счётчики **внутри** FiltersDrawer пересчитываются при последовательной фильтрации
5. FIX-5: Default состояние секций — L1 expanded, L2/L3 collapsed (только при первом запуске)
6. FIX-6: L1/L2/L3 расшифровки — убрать из Graph (короткие), добавить на Catalog в перебивки
7. FIX-7: Compact number formatter (50000000 → 50M, 1500 → 1.5K, $120.50, 45.32%)
8. FIX-8: ControlBar — выровнять отступы между Catalog и Graph

**Порядок:** делай в таком порядке. Pass 1 — критичные (1-2). Pass 2 — UX-полировка (3-7). Pass 3 — косметика (8). Все коммитим вместе.

---

## FIX-1: Multi-pin на Graph view

**Симптом (TC-6 FAIL):** на Graph клик на ноду открывает full Drawer (как в Catalog) вместо стэка pinned-карточек справа. Пользователь подтвердил: multi-pin критичен для investigation use case (закрепить 3-4 связанные метрики side-by-side при анализе аномалии).

**Что вернуть:** при клике на ноду — добавить метрику в **стек pinned-карточек** в side-panel справа. Можно держать N штук одновременно. Use case: закрепил GGR + FTD Count + Bonus Cost % для сравнения.

**Архитектурные варианты (обоснуй выбор в fix-report):**

- **A. Compact-mode у `MetricPreview`** — добавить prop `variant="compact"`. Compact = header (level/cat/name) + status badge + current value + sparkline. Без полной spec (ловушки/формула — только при разворачивании или открытии full Drawer). Стек compact-карточек в side-panel.
- **B. Отдельный компонент `PinnedMetricCard`** — новый компонент для compact pinned-карточек. Не пересекается с MetricPreview. Меньше логики в MetricPreview, но дублирует header/status/sparkline разметку.

**Рекомендую A** — единая точка для всех metric-cards. Если в коде MetricPreview слишком много контекстного (`buildMetricMarkdown`, history chart, NodeGraph) — может оказаться чище **B**. Решение твоё.

**UX-требования:**
- Side-panel справа в Graph (как было в прототипе до Sprint 2)
- Single click на ноду → добавляется в стек
- Если та же метрика уже закреплена → ничего не делаем (или unpin — на твоё усмотрение)
- Кнопка `×` на каждой pinned-карточке для unpin
- Кнопка `clear all` сверху панели (если ≥1 pinned)
- **Двойной клик** на ноду или pinned-карточку → открывается **full Drawer** (тот же что в Catalog)
- Ширина side-panel ~320-360px (на твоё усмотрение)
- Когда панель открыта (≥1 pinned) — canvas сужается на ширину панели

**Persist:** не нужен. Pinned state локальный (как drawer).

---

## FIX-2: Zoom применяется только к canvas content

**Симптом (TC-11 FAIL):** при zoom in/out на Graph масштабируется **всё** включая ControlBar, кнопки fit/+/-, подписи L1/L2/L3, тултипы. По стандарту (Figma, Miro, Obsidian Graph) zoom применяется только к canvas content.

**Что должно масштабироваться** при zoom:
- Ноды (кружки)
- Edges (линии связей)
- Node-labels (подписи метрик у нод)
- Section headers L1/L2/L3 над колонками — **на твоё усмотрение**: либо тоже в transform-слое, либо вынести наверх и фиксировать. Логичнее фиксировать, тогда они всегда читаются.

**Что НЕ должно** масштабироваться:
- ControlBar и его контент (Filters btn, counter, alert-counter, zoom controls)
- Hover-tooltip
- Pinned side-panel (FIX-1)
- FiltersDrawer

**Реализация (на твоё усмотрение):**
- Transform на дочернем `<g>` SVG-content, не на корневом element
- SVG `viewBox` пересчёт без CSS transform
- Decoupled layout: HTML-overlay (UI) поверх SVG (canvas)

**UX-требование:** при zoom in/out tooltip и ControlBar **визуально не меняются** — пользователь zoom'ит чтобы лучше видеть граф, не чтобы уменьшить UI.

---

## FIX-3: Разнести ноды графа + (опц.) auto-hide labels

**Симптом (TC-10 ОК но в каше):** на 236 нодах подписи **читаемы**, но **перекрываются** друг с другом — визуально каша. Особенно в L1 (58 нод) и L2 (126 нод).

**Что сделать (обязательно):**
- Увеличить **vertical spacing между нодами** в колонках. Сейчас они почти впритык. Нужно дать им «дышать» — например, было `gap: Xpx`, сделать `gap: X*1.5px` или `X*2px`. На твоё усмотрение, оценивай визуально на dev-сервере.

**Опционально (если простая правка spacing не достаточна):**
- **Auto-hide labels at low zoom** — при zoom level < 0.7 (или другой порог) скрывать node-labels, показывать только кружки. При zoom in появляются. Паттерн как у Obsidian Graph view.

**НЕ делать в этом фиксе:**
- Force-directed layout, virtualization, clustering — это Sprint 3 (Graph scaling)
- Filter-driven graph (показывать только отфильтрованные) — тоже Sprint 3

---

## FIX-4: Счётчики внутри FiltersDrawer пересчитываются при последовательной фильтрации

**Симптом (TC-4 PASS с замечанием):** ControlBar counter (`X / 236`) обновляется live — это работает. Но **счётчики внутри самого FiltersDrawer** (типа `LEVEL [3]`, `PRIORITY [3]`, `OWNER [23]`, `CATEGORY [31]`, и индивидуальные значения типа `red 34`, `L1 58`, `Must 27` и т.д.) — **не пересчитываются** при последовательной фильтрации.

**Use case:** пользователь выбрал `LEVEL → L1` → ожидает что в `PRIORITY` цифры теперь покажут только Priority среди L1-метрик (например, было `Must 27`, стало `Must 14` — потому что только 14 из 58 L1-метрик имеют priority Must).

**Что сделать:** счётчики в FiltersDrawer (рядом с каждым chip и в заголовке секции) пересчитываются на основе **уже-отфильтрованного** набора метрик (тех, что прошли все остальные активные фильтры), а не от полного 236.

**Tricky bit:** для каждой секции при пересчёте надо **исключать фильтр самой этой секции**. Иначе если выбрал `L1`, в секции LEVEL цифры станут `L1 58 / L2 0 / L3 0` — это не информативно. Должно быть `L1 58 / L2 126 / L3 52` (как было), а вот в **других** секциях счётчики уже учитывают L1-фильтр.

Это стандартный pattern «cascading filters» / «counts as if this filter wasn't applied».

---

## FIX-5: Default состояние секций L1/L2/L3

**Симптом (TC-9 PASS с замечанием):** сейчас по дефолту все три секции (L1/L2/L3) развёрнуты. Пользователь хочет: L1 раскрыт, L2 свёрнут, L3 свёрнут.

**Что сделать:**
- При **первом** заходе пользователя (нет ключа в localStorage) → начальное состояние:
  - `odin.catalog.section.l1.collapsed` = `false` (показано)
  - `odin.catalog.section.l2.collapsed` = `true` (свёрнуто)
  - `odin.catalog.section.l3.collapsed` = `true` (свёрнуто)
  - То же для `odin.graph.section.lN.collapsed`
- Если ключи в localStorage уже есть — использовать их (не переопределять)
- Применяется к **обоим view** (Catalog и Graph)

---

## FIX-6: L1/L2/L3 расшифровки — Graph короче, Catalog добавить

**Симптом (TC-8 PASS с замечанием):**
- На **Graph** сейчас под подписью колонки идёт subtitle типа `C-level · daily review · падение = проблема бизнеса` — пользователь говорит **убрать**. Оставить только `L1: СТРАТЕГИЧЕСКИЕ`.
- На **Catalog** перебивки секций сейчас **без** этих расшифровок. Пользователь говорит **добавить** — то есть `▾ L1: СТРАТЕГИЧЕСКИЕ` + ниже мелким шрифтом `C-level · daily review · падение = проблема бизнеса`.

**Что сделать:**
- В Graph: section header — только `L1: СТРАТЕГИЧЕСКИЕ {N}` без subtitle. Иконка collapse слева, count справа.
- В Catalog: section header — `▾ L1: СТРАТЕГИЧЕСКИЕ {N}` (как сейчас) + одна строка subtitle мелким шрифтом ниже (используй текст из текущих Graph subtitle'ов).

**Тексты subtitle (брать из существующих):**
- L1: `C-level · daily review · падение = проблема бизнеса`
- L2: `Product · CRM · Marketing · ищут причину изменений в L1`
- L3: `Deep-dive под аномалию из L2`

---

## FIX-7: Compact number formatter

**Симптом (новый, из чата):** сейчас в карточках current value показывается «как есть» через `fakeValue()`. Дизайнер прототипа подставил удобные короткие значения, но в реальности у некоторых метрик значения могут быть длинными (например, `50000000` = 50 миллионов) — это сломает layout карточки.

**Что сделать:**
- Создать функцию `formatCompactNumber(n, kind?)` в `src/lib/util.js`
- Поведение:
  - `1500` → `1.5K`
  - `50000000` → `50M`
  - `1200000000` → `1.2B`
  - `45.32` (если `kind === 'percent'`) → `45.32%`
  - `120.50` (если `kind === 'currency'`) → `$120.50`
  - `120000` (если `kind === 'currency'`) → `$120K`
- Использовать `Intl.NumberFormat('en', { notation: 'compact' })` нативно — без новых либ
- Применить везде где сейчас рендерится `m.current` или `fakeValue(m)` напрямую: card current value, drawer header value, tooltip value, pinned-карточка value (FIX-1)

**Не трогать:** delta-значения (`fakeDelta`) — они уже в формате `+8.7%` / `-2.5%`, оставить как есть.

---

## FIX-8: ControlBar — выровнять отступы Catalog/Graph

**Симптом (TC-3 PASS minor):** ControlBar выглядит почти одинаково на Catalog и Graph, но **отступы слева/справа** у кнопок разные (Filters button с одной стороны, view-specific controls — с другой). Пользователь зафлагал как minor.

**Что сделать:**
- Проверить CSS `.cbar` и view-specific блоки (`size-selector`, `zoom-controls`)
- Padding/margin должны быть **симметричны** между Catalog и Graph
- На обоих view левый край Filters-button и правый край последнего control должны быть на одинаковом расстоянии от краёв вьюпорта

Это косметика — 1-2 правки CSS.

---

## ADR Constraints

- **CLAUDE.md, Правило 3 (Surgical Changes):** все правки ограничены 8 пунктами. Не «улучшать» соседнее.
- **DO NOT touch:** не менять архитектуру FilterDrawer/ControlBar/MetricPreview сверх FIX-1 (где может потребоваться `variant` prop).

## DO NOT

- ❌ **Не делать Catalog scrollbar visibility** (TC-12) — это Sprint 3
- ❌ **Не делать filter-driven graph** или другие scaling-решения для 236 нод (force-directed, clustering, virtualization) — Sprint 3
- ❌ **Не трогать структуру `default-vault/_seed/igaming_metrics.json`** или адаптер в `data.js` — пользователь делает параллельную работу через Gemini Deep Research, мы не вмешиваемся
- ❌ **Не TypeScript, не Tailwind, не shadcn/ui, не новые либы** (`Intl.NumberFormat` нативный, OK)
- ❌ **Не трогать темы DARK/LIGHT** — работают
- ❌ **Не делать commit** — пользователь сам коммитит после твоего сигнала «готов»
- ❌ **Не пытаться чинить console warnings или dead CSS** — отложено
- ❌ **Не закрывать issues которых нет в этом prompt'е** даже если заметил «по дороге» — заносишь в Notes / Tech Debt

## Sanity checks

После всех 8 фиксов:

1. `npm run dev` запускается, нет красных Error
2. `npm run build` собирается
3. **FIX-1 multi-pin:** клик на ноду → метрика в стэк side-panel; ещё клик → второй pin; `×` убирает; `clear all` сбрасывает; double-click → full Drawer
4. **FIX-2 zoom:** zoom in/out — ноды и edges меняют размер, ControlBar/tooltip/side-panel **не меняются**
5. **FIX-3 spacing:** ноды визуально разнесены, подписи не накладываются (или auto-hide при low zoom)
6. **FIX-4 cascading filters:** выбираешь L1 → в PRIORITY/OWNER/CATEGORY цифры обновились (учитывают L1-фильтр); в самом LEVEL цифры остались как были
7. **FIX-5 default state:** на чистом localStorage (можно проверить через `localStorage.clear()` + reload) — L1 раскрыт, L2/L3 свёрнуты
8. **FIX-6 расшифровки:** Graph headers короткие (`L1: СТРАТЕГИЧЕСКИЕ`), Catalog headers с subtitle
9. **FIX-7 numbers:** искусственно (можно временно через console) подставить большое значение в `current` — карточка не разваливается, видно `50M`
10. **FIX-8 отступы:** ControlBar симметричен между Catalog/Graph

## Sprint 2 Fix Report

После завершения создать `docs/project/sprint-2-fix-report.md`. Минимально:

- **Status:** Fixed / Partial / Failed
- **FIX-1 — FIX-8** (по каждому): краткое «что сделано», изменённые файлы, обоснование архитектурных выборов где они есть (особенно FIX-1 A vs B)
- **Regression:** что проверил из Pass 2 — Catalog, drawer, фильтры PASS, темы, console
- **Notes / Tech Debt:** найденные мелочи которые **не починил** (по правилу DO NOT)

После репорта — стоп. Пользователь коммитит, делает короткий re-test (не полный QA по всем TC, только проверка что 8 фиксов работают), Cowork делает мини re-review. Если всё ОК — CLOSE Sprint 2.
