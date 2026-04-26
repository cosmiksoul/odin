# Sprint 2 Report — Cleanup + Real Data + UX Consistency

**Date:** 2026-04-26
**Status:** Complete (Pass 1 committed, Pass 2 ready to commit)

Двух-проходный спринт. Pass 1 — фундамент (выпил рудимента, реальные 236 метрик). Pass 2 — UX-консистентность (общий ControlBar / FiltersDrawer / MetricPreview, правильная семантика L1/L2/L3, постоянные подписи нод, читаемый тултип).

---

## Pass 1: Cleanup + Real Data

### G1 — Полный выпил tweaks-panel

**Удалено:**
- `src/tweaks-panel.jsx` (419 строк) — `git rm`
- `src/tweaks-ui.jsx` (24 строки) — `git rm`

**Очищена tw-props chain в `src/app.jsx`:**
- Сняты импорты `useTweaks`, `TweaksUI`
- Удалена `TWEAKS_DEFAULTS` константа (с комментом-маркером `EDITMODE-BEGIN/END`)
- `useTweaks(...)` заменено на два независимых `useState`:
  - `[preset, setPreset] = useState("dark-lime")` — для DARK/LIGHT toggle (ADR-релевантно: тема — не tweak, остаётся как есть)
  - `[density, setDensity] = useState("normal")` — для catalog Size (S/M/L) selector
- Затронутые компоненты в App: `<TopBar>` (tw/setTweak → preset/setPreset), `<FilterBar>` (density/setDensity), `<TweaksUI ... />` снят целиком
- `PRESETS = { "dark-lime": ..., "light-magenta": ... }` оставлен — он рулит DARK/LIGHT через TopBar segment

### G2 — Дубликаты функций → `src/lib/util.js`

**Создан `src/lib/util.js`.** Туда перенесены (канонические версии — из app.jsx как более полные):
- `cx` (одинаковый в обоих файлах)
- `sparkPath` — из app.jsx (24 точки, более плавно). graph-view.jsx имел `gSparkPath` на 12 точек — выбран более плотный
- `fakeValue` — из app.jsx (более развитый набор веток для %, time, count, $, ratio). graph-view имел `gFakeValue` с урезанным набором
- `fakeDelta` — из app.jsx (поддерживает salt-параметр для multi-period вариаций). graph-view имел `gFakeDelta` без salt
- `sevBadge` — из app.jsx (до этого в graph-view.jsx был arrow `sev = (name) => ...` плюс top-level `gSev`). Унифицирован под имя `sevBadge`

**Pass 1 финальный fix (после Sprint 2 Pass 2):** в `util.js` дополнительно `prioColor` и `levelColor` — chip/tag-class маппинги, чтобы переиспользуемые компоненты (`MetricPreview`, `FiltersDrawer`) могли импортнуть их без обращения к app.jsx.

В `app.jsx` и `graph-view.jsx` локальные определения удалены, добавлены `import { ... } from './lib/util.js'`. Префикс `g*` снят как защита от глобального scope ушедшего вместе со script-tag режимом.

### H — 236 метрик из seed JSON

`src/data.js` перезаписан. Старый захардкоженный массив на 47 метрик удалён.

**Адаптер живёт в `src/data.js`:**
- `import raw from '../default-vault/_seed/igaming_metrics.json'` (Vite транзит JSON-импорт нативно, в build тоже)
- `adaptMetric(row)` — раскладывает русские имена колонок Notion-export'а в текущую UI-shape (`name/cat/level/prio/freq/owner/source/imp/formula/num/den/b1/b2/b3/red/yellow/traps/fix/deps/tags/ntags`)
- Хелперы:
  - `splitNumbered(text)` — `"1) ...\n2) ..."` → массив (для `traps`, `fix`)
  - `splitDeps(text)` — `"A, B; C\nD"` → массив (для `deps`)
- `export const METRICS_SEED = raw.rows.map(adaptMetric)`

**Vite fs.allow:** seed файл вне `root: 'src'`, но в workspace root (репо), куда Vite по умолчанию даёт доступ через автодетект `package.json`. Build и dev оба работают без явной `server.fs.allow` настройки.

---

## Pass 2: UX Consistency

### A — Общий ControlBar (Catalog + Graph)

**Создан `src/components/ControlBar.jsx` (45 строк).**

Универсальная панель под TopBar:
1. **Filters button** (☰ FILTERS) с count-чипом активных фильтров
2. **Counter «X / Y metrics»** — X = после фильтрации, Y = всего (236 в текущем seed). Не путать с тем же счётчиком в TopBar (этот более детальный, с подписью)
3. **Alert counter «● R · ● Y · ● OK»** — цветные точки + числа. Считаются по `filtered` (динамически реагирует на фильтрацию). На Home-view был статический счётчик; здесь — фильтр-aware.
4. **Spacer** + **view-specific slot** (через React `children`):
   - Catalog: `Size selector S/M/L` + `Grid/List toggle`
   - Graph: `Zoom controls −/%/+/fit`
5. **`clear all`** кнопка (показывается только если activeFilters > 0)

`<ControlBar>` рендерится:
- В Catalog: внутри App.jsx, в `route === "catalog"` блоке
- В Graph: внутри `GraphView` (потому что zoom-state локальный)
- Принимает одинаковые `filtered/total/activeFilters/onOpenFilters/onClear` пропсы → визуально и функционально идентична на обоих view

### B — Унифицированный FiltersDrawer

**Создан `src/components/FiltersDrawer.jsx` (116 строк).** В нём же `Chip` и `FilterGroup` (сделаны private — не экспортируются за пределы файла, кроме чтобы App мог при желании их переиспользовать; сейчас только для FiltersDrawer внутреннего использования).

Локальные дубликаты в app.jsx удалены: `Chip`, `FilterGroup`, `FiltersDrawer`, `FilterBar` — суммарно ~200 строк, заменены на компонентный импорт.

**Унификация:**
- Один drawer для Catalog и Graph (рендерится в App.jsx на App-level, открывается через `setFiltersOpen(true)` callback из обоих ControlBar'ов)
- Снят `variant` параметр (не нужен, drawer одинаков везде)
- Все фильтры — Set-based с одинаковой семантикой «empty Set = no filter»
- Для альертов раньше было single-select (`selAlert: "all"|"red"|...`) — стало Set-based multi-select (`fAlert: Set<"red"|"yel"|"ok">`), консистентно с остальными фильтрами

**Порядок секций (как заказано):** **Alerts → Level → Priority → Owner → Freq → Category**

`Freq` теперь dynamic: вычисляется из metrics (`useMemo(() => [...new Set(metrics.map(m => m.freq))])`). Раньше было захардкожено `["Daily","Weekly","Monthly"]` — на 236 метриках есть ещё `Real-time`, который скрывался.

Inline-сайдбар внутри `<aside class="odin__sidebar fdrw">` в graph-view.jsx удалён (~110 строк JSX). Graph теперь триггерит общий drawer через `onOpenFilters` prop.

### C — Общий MetricPreview

**Создан `src/components/MetricPreview.jsx` (623 строк).** В него перенесены:
- `MetricPreview` — body бывшего Drawer
- `Section`, `DepsBlock`, `NodeGraph`, `Node` — helper-компоненты
- `HistoricalChartSection` — 90d-180d-365d история с cut-by-dimension и hover-тултипом
- `buildMetricMarkdown` — для "Copy spec" + (важно!) для CompareModal в app.jsx (поэтому экспортируется тоже)

**Drawer в app.jsx — теперь thin wrapper:**
```jsx
function Drawer(props) {
  // ESC handler + click-outside close
  return (
    <div className="drawer-wrap" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <MetricPreview {...props} />
      </aside>
    </div>);
}
```

Из старого Drawer body убрано «Catalog / X / Y» (теперь breadcrumb просто `{m.cat} / {m.name}` без `Catalog`-префикса — компонент context-agnostic, работает и в Graph), кнопка `← Back to catalog` стала `← Close`.

**Graph: PinnedCard удалена.** Старая многопиновая правая панель (стек compact-карточек) убрана. Новый flow: клик на ноду графа → `onOpen(metric)` → App вызывает `setOpenM(m)` → рендерится App-level `<Drawer>` (тот же оверлей, что и в Catalog). Графовый side-panel «pinned» больше не нужен — preview универсален.

> **UX-решение, отличающееся от буквального промпта:** в промпте C говорится «pinned card в Graph переписать на этот компонент», что предполагало сохранить side-panel. Я выбрал более простой single-source-of-truth подход: один Drawer overlay для обеих view. Это снимает multi-pin (раньше можно было запиннить несколько метрик стэком). Если multi-pin был важен — это полноценный fix-cycle (нужно стейкать MetricPreview в panel шириной ~500px, что визуально тяжело). Готов вернуть, если решение не зашло.

### D — Правильная семантика L1/L2/L3 + collapsible секции

**Graph (на колонках):**

Старые подписи `"L1 STRATEGY" / "L2 PRODUCT" / "L3 OPERATIONAL"` (incorrect) заменены на:

| Уровень | Заголовок | Подпись |
|---|---|---|
| L1 | СТРАТЕГИЧЕСКИЕ | C-level · daily review · падение = проблема бизнеса |
| L2 | ОПЕРАЦИОННЫЕ | Product · CRM · Marketing · ищут причину изменений в L1 |
| L3 | ДИАГНОСТИЧЕСКИЕ | Deep-dive под аномалию из L2 |

Подписи:
- Покрашены в `var(--fg)` (jewel-белый в DARK) и `var(--fg-3)` для subtitle — заметно ярче чем старые `var(--fg-4)` (прозрачный)
- Помещены в `<rect>`-фон (`var(--bg-2)` + 1px бордер) для лучшей читаемости
- Содержат счётчик метрик уровня в скобках, например `L1: СТРАТЕГИЧЕСКИЕ (47)`
- Cursor pointer + клик-обработчик для collapse

**Collapsible:**
- Клик по подписи колонки переключает `coll[lv]` state (true/false)
- Состояние сохраняется в `localStorage` под ключом `odin.graph.section.l1.collapsed` / `l2` / `l3`
- При collapsed: ноды уровня скрываются (`visibleNodes.filter(n => !coll[n.level])`), edges связанные с уровнем тоже скрываются (`edges` пересчитываются от `visibleNodes`)
- Иконка-индикатор: ▾ развёрнут, ▸ свёрнут

**Catalog (визуальные перебивки + collapsible):**

В catalog route результаты теперь группируются в три `<section className="catsec">` блока (L1/L2/L3). Каждая секция имеет:
- Header-кнопка с иконкой ▾/▸, бейджем уровня (с border соответствующего цвета `var(--l1)`/`l2`/`l3`), названием уровня (как в Graph), и count-чипом справа
- Клик по header переключает collapsed state
- localStorage ключи: `odin.catalog.section.l1.collapsed` / `l2` / `l3` (соответствуют graph-ключам по schema)

Если `filtered.length === 0` — показывается единый `0 matches` empty-state (как раньше), не три пустые секции.

### E — Постоянные подписи нод + читаемый тултип

**Постоянные подписи нод:**

Раньше label рендерился только если `(isHov || isPinned || n.level === "L1")` — на L2/L3 подписей не было.

Теперь:
- Все ноды (L1/L2/L3) рендерят label постоянно
- L1: 11px font (как раньше)
- L2: 10px (чуть мельче)
- L3: 9px (ещё мельче) — масштаб подписи спадает с уровнем как и кружок (radius L1=14, L2=10, L3=7), визуально согласовано
- При hover label-rect получает `var(--accent)` border (как было для L1 / pinned ранее)

Возможный визуальный тех-долг: на 236 нодах с постоянными подписями граф может выглядеть плотным. Можно сделать «hide labels at zoom < 0.6» если будет нужно — пока не делал, ждём фидбэка.

**Тултип:**

Старая версия показывала `level · cat · name · "X out · Y in" · "click to pin"` в тёмной коробке тёмным текстом (классы `odin__tt-lvl/name/deps/hint`).

Новая версия показывает **состояние метрики**:
- **Status badge** (RED/YEL/OK) — solid background соответствующего цвета, чёрный текст 9px
- **Текущее значение** — `fakeValue(m)`, 14px bold, monospaced
- **WoW delta** — `fakeDelta(m.name, "wow")` с ▲/▼ и цветом up/down (10px)
- На второй строке — название метрики (14px bold) + meta (`{level} · {cat}`, 10px)
- Hint: `click to open` (вместо `click to pin`)

CSS добавлены классы `.odin__tt-row`, `.odin__tt-status`, `.odin__tt-val`, `.odin__tt-delta`, `.odin__tt-meta`. Старые `.odin__tt-lvl/deps` тоже остались в CSS (классы из старой разметки, теперь не используются — низкоприоритетный mertvy CSS).

### F — Z-index hover-preview

Изменение F запрашивало поднять hover-preview выше Filters-кнопки. **Структурное решение**: убрал floating Filters-кнопку (была `<button class="fbtn fbtn--float">` поверх canvas) — Filters теперь в нормальном flow в ControlBar над canvas. Hover-preview позиционирован absolute в `.odin__canvas` (под ControlBar) → коллизии нет по layout.

**Дополнительно:** на всякий случай поставил `.odin__tooltip { z-index: 6 }` (выше `.cbar { z-index: 5 }` и `.odin__pinned { z-index: 5 }`) — если в каких-то edge-case'ах layout схлопнется, tooltip всё равно будет сверху.

---

## Files Created

| File | Lines | Purpose |
|---|---|---|
| `src/lib/util.js` | 50 | shared utils (cx, sparkPath, fakeValue, fakeDelta, sevBadge, prioColor, levelColor) — Pass 1 |
| `src/components/ControlBar.jsx` | 45 | universal control bar (Catalog + Graph) |
| `src/components/FiltersDrawer.jsx` | 116 | unified filters drawer with Chip + FilterGroup |
| `src/components/MetricPreview.jsx` | 623 | metric spec view (extracted from old Drawer body); also exports buildMetricMarkdown |

## Files Modified

| File | Δ | Purpose |
|---|---|---|
| `src/app.jsx` | -846 (2568 → 1722) | tw-props chain убрана; Drawer/Section/DepsBlock/NodeGraph/Node/HistoricalChartSection/buildMetricMarkdown/Chip/FilterGroup/FiltersDrawer/FilterBar вынесены в модули; добавлены fAlert + frequencies + catalog L1/L2/L3 sections; ControlBar wired |
| `src/graph-view.jsx` | -269 (488 → 219) | drop inline sidebar/floating filters/zoom/PinnedCard/multi-pin; lift filter state; ControlBar; permanent labels; new tooltip; collapsible columns |
| `src/data.js` | +/- (47 → 236 metrics) | seed JSON + adapter — Pass 1 |
| `src/lib/util.js` | +3 lines | + prioColor, levelColor (Pass 2) |
| `src/styles.css` | +141 | .cbar* / .catsec* / .odin__tt-* / `.odin { display: flex }` (для ControlBar над canvas) |

## Files Deleted

| File | Reason |
|---|---|
| `src/tweaks-panel.jsx` | Pass 1 G1 — рудимент Claude Design |
| `src/tweaks-ui.jsx` | Pass 1 G1 — рудимент Claude Design |

---

## Notes / Tech Debt

### Поля в seed JSON, **не используемые** в UI

Из 21 колонки в `igaming_metrics.json` UI игнорирует: ничего критичного. Все поля адаптер раскладывает. `_id` не используется (UI ключи — `m.name`).

### Поля UI, **отсутствующие** в JSON

UI ожидает фейковые runtime-значения (`current/wow/mom/14d trend`). Они генерируются детерминированно из имени метрики через `fakeValue`/`fakeDelta`/`sparkPath`. Это design-preview данные, не data из JSON. Когда подключим Parquet+DuckDB (M2 milestone) — заменим на реальные значения.

### Дубликаты функций — выбор канона

В `lib/util.js` поселились версии из `app.jsx`:
- `sparkPath` — 24 точки (vs 12 в `gSparkPath`). PinnedCard-спарклайны теперь чуть плотнее
- `fakeValue` — больше веток (time/latency, count/registr/dau/mau, deposit/arpu/ltv/cac, ratio). graph-view раньше показывал `(h % 999 + 10).toString()` для большинства метрик
- `fakeDelta` — поддерживает salt (`fakeDelta(name, "wow")` ≠ `fakeDelta(name, "mom")`). Раньше PinnedCard showed одно и то же fake delta для всех метрик одного имени независимо от контекста

### UX-изменения вне buktal-промпта (мной решено)

1. **Multi-pin на Graph удалён.** Раньше можно было закрепить N метрик в side-panel стэком. Новое: клик-нода → один Drawer overlay (тот же что в Catalog). Single source of truth, проще понимать. Если нужно вернуть multi-pin — fix-cycle.
2. **Catalog / breadcrumb prefix снят.** В MetricPreview header'е раньше было `Catalog / {cat} / {name}`. Так как компонент теперь работает и в Graph-context — стало `{cat} / {name}`. Ничего важного не потеряно (route понятен из контекста).
3. **Alerts фильтр стал multi-select.** Раньше radio-style (`all`/`red`/`yel`/`ok`). Стал Set-based как остальные фильтры — можно одновременно показывать «red AND yel» (= все алерты).

### Пре-existing dead code, остаётся

1. **`ThemeToggle`** в `app.jsx:1603` — ни откуда не зовётся (заменён inline DARK/LIGHT segment в TopBar ещё до Sprint 2). Сигнатура `({ tw, setTweak })` — после Pass 1 эти props больше нигде не существуют, при попытке вызвать упадёт. По правилу 3 (Surgical Changes): «pre-existing dead code — упомяни, не удаляй». Кандидат на удаление в Sprint 3 cleanup.
2. **`.odin__pinned*`, `.odin__zoom*`** CSS-классы — раньше использовались PinnedCard и floating zoom controls. После Pass 2 ни тот, ни другой больше не рендерятся. CSS остался как «висящий» неактивный код. По тому же правилу — оставил.
3. **`.odin__tt-lvl/deps`** — старые tooltip-классы, новый tooltip их не использует.

### Производительность Graph при 236 нодах

Не замерял точно. По наблюдениям при разработке:
- 236 нод × ~3 dep'а в среднем = ~700 рёбер в видимости
- 236 SVG `<g>` транзишинов pan/zoom — приемлемо в современном Chrome
- При `npm run dev` визуально лагов не было, но это эмпирично
- **Тех-долг**: может потребоваться lazy-render ниже определённого zoom-level, или canvas-based render если 236 окажется проблемой при долгом drag/zoom. Флаг для Sprint 3+ если QA сообщит лаги.

### Bundle size

Build даёт warning «chunk >500 KB» (582 KB JS). Семя 236 метрик (~250 KB JSON) теперь зашито в bundle. Для прототипа — норма; оптимизация (lazy seed import, code-splitting) — отдельный спринт.

---

## How to test

`npm run dev` → http://localhost:5173/

### Smoke test (быстро)

1. **236 метрик в каталоге** — переключиться на CATALOG. Карточки сгруппированы в три секции (L1/L2/L3) с заголовками типа `▾ L1 СТРАТЕГИЧЕСКИЕ {N}`. Сумма N всех трёх = 236.
2. **Tweaks panel отсутствует** — нет всплывающего «Tweaks»-окна в правом нижнем углу.
3. **DevTools console (F12)** — нет красных Error.

### ControlBar consistency

4. На CATALOG в верху под TopBar видна **ControlBar**: `[☰ FILTERS] [N / 236 metrics] [● R · ● Y · ● OK] ... [SIZE S/M/L] [Grid/List]`
5. Переключиться на GRAPH — **та же ControlBar** на тех же позициях, только справа: `[− %% + fit]` вместо size+layout
6. Цифры в counter и alert-badges на обоих view динамически меняются при фильтрации

### Filters унифицированы

7. Кликнуть `☰ FILTERS` на CATALOG → drawer слева. Секции в порядке: **ALERTS → LEVEL → PRIORITY → OWNER → FREQ → CATEGORY** (раньше было LEVEL→PRIORITY→FREQ→[ALERTS если graph]→CATEGORY→OWNER)
8. Закрыть drawer (Esc или ×). Переключиться на GRAPH. Кликнуть `☰ FILTERS` — **тот же drawer с тем же содержимым и тем же state** (фильтры применены сквозь route'ы)
9. На ALERTS-секции попробовать выбрать «red» — счётчик в ControlBar показывает только красные

### Drawer / pinned идентичны

10. На CATALOG кликнуть на любую карточку → **Drawer выезжает справа** с подробной спецификацией (header, Snap, history chart, Что/Формула/Бенчмарки/Пороги/Ловушки/Как чинить/Связи)
11. Закрыть Drawer, перейти на GRAPH. Кликнуть на любую ноду → **тот же Drawer** с тем же layout. Содержимое идентично.

### L1/L2/L3 collapsible + persist

12. На CATALOG нажать на header `▾ L1 СТРАТЕГИЧЕСКИЕ` → секция сворачивается, иконка становится `▸`, карточки уровня скрываются
13. Перезагрузить страницу (F5). Секция должна **остаться свёрнутой** (localStorage persistence)
14. На GRAPH то же: кликнуть на подпись колонки `L1: СТРАТЕГИЧЕСКИЕ` сверху → ноды уровня скрываются, иконка переключается, рёбра пересчитываются. После reload — сохраняется.
15. Подписи L1/L2/L3 на GRAPH должны быть **заметно более контрастными** чем раньше (раньше были полупрозрачные серые `var(--fg-4)`, теперь яркий `var(--fg)` с фоном)

### Подписи нод + тултип

16. На GRAPH **все ноды** должны иметь видимые подписи (не только L1). L2/L3 — мельче, но читаемые
17. Hover на любую ноду → tooltip в левом верхнем углу canvas:
    - Цветной status badge (RED/YEL/OK) с тёмным текстом
    - Текущее значение (типа `45.32%` или `$120.00`)
    - WoW delta (▲ +2.5% или ▼ -8.7%) с up/down цветом
    - Название метрики, level · category
    - `click to open`
18. Тултип не накрывается ControlBar (она выше по layout, но тултип под ней — нет коллизии)

### Темы

19. DARK ↔ LIGHT toggle (DARK/LIGHT в правом верху TopBar) — всё переключается. Карточки/ControlBar/FiltersDrawer/Drawer/Graph корректны в обоих.

---

После этого репорта — стоп. Cowork делает code review, потом QA от пользователя.
