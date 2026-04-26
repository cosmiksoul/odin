# Sprint 2 Fix Report

**Date:** 2026-04-27
**Status:** Fixed (8 / 8). Build green, dev server clean log.

Все 8 фиксов из `sprint-2-fix-prompt.md` сделаны в одном цикле. Один коммит на пользователе.

---

## FIX-1: Multi-pin на Graph view

**Архитектурный выбор: B (отдельный `PinnedMetricCard`).**

Почему **не A** (`variant="compact"` на `MetricPreview`):
- `MetricPreview` тащит за собой historical chart, NodeGraph, traps/fix lists, markdown export, export-popup и другие тяжёлые куски (~620 строк). Вынуждать его в compact-mode = ветвить на каждый второй блок (`{variant !== 'compact' && <HistoricalChart/>}` × N), плюс имена пропсов начинают значить разное в разных режимах.
- Compact pin-карточка идейно другая: header+value+delta+spark, ничего больше. Дешевле новый файл (~70 строк) чем флаг через тяжёлый компонент.

**Сделано:**
- `src/components/PinnedMetricCard.jsx` — отдельный компактный компонент. Использует существующие `.pinc*` CSS-классы из старого прототипа (вернулись в дело).
- `graph-view.jsx`: добавлены `pinned: Set<name>` state + `togglePin` + `unpinAll`.
- **Click-handling:**
  - **Single click на ноду** → `togglePin(n)` (добавить/удалить из стэка)
  - **Double click на ноду** → `onOpen(n)` (App-level Drawer)
  - На `PinnedMetricCard`: одиночный hover синхронизирует с graph hover. Double-click **на карточке** → Drawer. `×` на ряду 1 → unpin. `open →` на ряду 3 → Drawer.
  - Браузерный `onDoubleClick` срабатывает после двух `onClick`-ов: каждый toggle'ит pin → итого net-zero (если был запиннен, после double-click опять запиннен; и наоборот). Drawer открывается. Это незаметно ОК для UX. Описано как известный quirk.
- **Side-panel:** новый `<aside class="odin__sidepanel">` справа от canvas. Header `PINNED [N] · clear`. Stack из `PinnedMetricCard`. Скроллится. Появляется при ≥1 pinned, исчезает при `unpinAll` или удалении всех.
- **Canvas сужается:** перестроен layout — `<div class="odin__main">` flex row, внутри `<canvas>` (flex 1) + `<sidepanel>` (340px). Когда панели нет — canvas занимает всё. Когда есть — отжимается до `vw - 340 - padding`.
- **No persist** — состояние pinned'ов локальное (как drawer state). Закрыл Graph → forgot.

**Файлы:** `src/components/PinnedMetricCard.jsx` (new), `src/graph-view.jsx` (multi-pin state + side-panel render), `src/styles.css` (`.odin__main`, `.odin__sidepanel*`).

## FIX-2: Zoom применяется только к canvas content

**Симптом был:** `<g transform="translate(pan) scale(zoom)">` оборачивал всё содержимое SVG, включая текст L1/L2/L3 column headers (`<text>` внутри transform-группы → масштабировался).

**Решение:** column headers вынесены **из SVG целиком** в HTML-overlay `<div class="odin__col-headers">` поверх canvas.
- Position: `absolute; top: 8px; left: 16px; right: 16px`. Три кнопки flex 1, не зависят от SVG transform.
- ControlBar и tooltip — уже HTML, лежат вне SVG → zoom их и до этого не трогал. Дополнительно `.odin__col-headers { z-index: 4 }` чтобы не затирались SVG.
- Pinned side-panel (FIX-1) — отдельный flex sibling canvas'а, тоже не масштабируется.

**Trade-off**: column headers теперь не «прибиты» к колонкам нод по X — они три равных flex-блока сверху. Если пользователь сильно панит граф, ноды и заголовки могут визуально разъехаться. Кнопка `fit` в ControlBar возвращает pan на (0,0) → выравнивает обратно. Документировано в Notes.

**Файлы:** `src/graph-view.jsx`, `src/styles.css`.

## FIX-3: Vertical spacing + auto-hide labels

**Spacing.** Высота viewBox теперь динамическая, считается от плотности самой большой колонки:
```js
H = max(900, PAD_TOP + PAD_BOTTOM + (maxNodes - 1) * NODE_GAP);
```
с `NODE_GAP = 18` (viewBox-units). Для max 126 нод (L2 в seed): H ≈ 2400. На 47 (L1): H остаётся 900. SVG с `preserveAspectRatio="xMidYMid meet"` подгоняется под container height — реальный pixel-gap между нодами зависит от размера canvas, но визуально стало ощутимо просторнее.

**Auto-hide labels.** `LABEL_HIDE_ZOOM = 0.7`. При `zoom < 0.7` label-rect и label-text не рендерятся (только кружки и edges). Возвращаются обратно при zoom-in. Паттерн как у Obsidian Graph view.

**НЕ сделано (по DO NOT):** force-directed layout, virtualization, clustering — отложено в Sprint 3 (Graph scaling).

**Файлы:** `src/graph-view.jsx`.

## FIX-4: Cascading counts в FiltersDrawer

**Сделано в `src/components/FiltersDrawer.jsx`:**
- Хелпер `passesExcept(m, except, filterState)` — возвращает true если метрика проходит все фильтры **кроме** указанной секции.
- `useMemo` пересчитывает 6 наборов отфильтрованных метрик (по одному на секцию):
  ```js
  sets = {
    alert: metrics.filter(m => passesExcept(m, "alert", state)),
    level: metrics.filter(m => passesExcept(m, "level", state)),
    prio:  metrics.filter(m => passesExcept(m, "prio",  state)),
    owner: metrics.filter(m => passesExcept(m, "owner", state)),
    freq:  metrics.filter(m => passesExcept(m, "freq",  state)),
    cat:   metrics.filter(m => passesExcept(m, "cat",   state)),
  }
  ```
- Каждый `<FilterGroup counts={...} />` берёт count из своего set.
- Эффект: выбираешь LEVEL → L1 → в PRIORITY/OWNER/CATEGORY/FREQ/ALERTS цифры пересчитываются по 47 L1-метрикам, в самой LEVEL остаются исходные 47/126/52.

**Файлы:** `src/components/FiltersDrawer.jsx` (+ `useMemo` import).

## FIX-5: Default state — L1 expanded, L2/L3 collapsed

**Сделано симметрично в обоих view:**

`src/app.jsx` (Catalog):
```js
const defaults = { L1: false, L2: true, L3: true };
const raw = localStorage.getItem(`odin.catalog.section.${lv.toLowerCase()}.collapsed`);
out[lv] = raw === null ? defaults[lv] : raw === "1";
```

`src/graph-view.jsx` (Graph): константа `DEFAULT_COLL = { L1: false, L2: true, L3: true }`, та же логика.

Если ключ в localStorage есть (даже `"0"`) — значение из storage'а уважается (не перезаписываем). Это важно: пользователь, который один раз раскрыл L2, при повторном заходе видит L2 раскрытым.

Чтобы протестировать: `localStorage.clear(); location.reload()` → L2/L3 свёрнуты, L1 открыт.

**Файлы:** `src/app.jsx`, `src/graph-view.jsx`.

## FIX-6: Subtitles — Graph короче, Catalog c subtitle

**Graph:** в `src/graph-view.jsx` массив `COLS` теперь содержит только `{ lv, x, title }` без `subtitle`. Соответственно в HTML-overlay column header рендерится только `▾  L1: СТРАТЕГИЧЕСКИЕ  [N]`. Subtitle убран.

**Catalog:** в `app.jsx` catsec header расширен:
```jsx
<div className="catsec__titlewrap">
  <span className="catsec__title">{title}</span>
  <span className="catsec__subtitle mono">{subtitle}</span>
</div>
```
с теми текстами что раньше были в Graph:
- L1: «C-level · daily review · падение = проблема бизнеса»
- L2: «Product · CRM · Marketing · ищут причину изменений в L1»
- L3: «Deep-dive под аномалию из L2»

CSS добавлен `.catsec__titlewrap` (column flex) + `.catsec__subtitle` (10px, `var(--fg-4)`, без uppercase).

**Title раскраска**: до фикса в Catalog было «Стратегические» (Title Case), теперь — «СТРАТЕГИЧЕСКИЕ» (UPPERCASE) — для консистентности с Graph.

**Файлы:** `src/app.jsx`, `src/graph-view.jsx`, `src/styles.css`.

## FIX-7: formatCompactNumber + fakeValue refactor

**Сделано в `src/lib/util.js`:**
```js
export function formatCompactNumber(n, kind) {
  if (kind === 'percent') return n.toFixed(2) + '%';
  if (kind === 'currency') {
    if (Math.abs(n) >= 1000) return '$' + _COMPACT.format(n);
    return '$' + n.toFixed(2);
  }
  if (Math.abs(n) >= 1000) return _COMPACT.format(n);
  return Math.round(n).toString();
}
```
Использует `Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })` нативно — никакой новой либы.

**Примеры:**
- `formatCompactNumber(1500)` = `"1.5K"`
- `formatCompactNumber(50_000_000)` = `"50M"`
- `formatCompactNumber(1_200_000_000)` = `"1.2B"`
- `formatCompactNumber(45.32, 'percent')` = `"45.32%"`
- `formatCompactNumber(120.5, 'currency')` = `"$120.50"`
- `formatCompactNumber(120000, 'currency')` = `"$120K"`

**`fakeValue` переписан** через `formatCompactNumber` — все ветки (percent / currency / number) идут через него. Сохранены spec-ветки для `time/duration` (формат `Xs`) и `ratio` (формат `X.XX×`) — они не подходят под compact и оставлены как было.

Все вызывающие места (`MetricCard`, `MetricPreview` drawer header, graph tooltip, `PinnedMetricCard`, SavedView CSV/MD export) автоматически получают форматированные значения — `fakeValue` сигнатура не менялась.

`fakeDelta` НЕ трогал — он уже выдаёт `±X.XX%`-подобный shape.

**Файлы:** `src/lib/util.js`.

## FIX-8: Симметричные отступы ControlBar

**Аудит и нормализация:**
- `.cbar` теперь явно `padding-left: 20px; padding-right: 20px` (было общее `padding: 8px 16px`). `gap: 16px` (вместо 14).
- `.cbar__size` (Catalog size selector): `padding: 0 8px` (равные L/R, было асимметричное `0 4px 0 8px`). `gap: 6px`.
- `.cbar__view` (slot для view-specific): `gap: 10px` для согласованности расстояния между size selector и view toggle на Catalog, и от zoom controls на Graph до правого края.
- `.cbar__zoom` button — `min-width: 36px` для каждой кнопки, чтобы 4 кнопки занимали стабильную ширину.

Filters-button слева и последний контрол справа теперь оба на 20px от края viewport'а на обоих view. Между собой view-specific блоки выравнены по правому краю (`.cbar__spacer { flex: 1 }`).

**Файлы:** `src/styles.css`.

---

## Files Created

| File | Purpose |
|---|---|
| `src/components/PinnedMetricCard.jsx` | FIX-1 — compact pin card |
| `docs/project/sprint-2-fix-report.md` | этот отчёт |

## Files Modified

| File | Δ | Fixes |
|---|---|---|
| `src/lib/util.js` | +14 lines | FIX-7 |
| `src/graph-view.jsx` | переписан (-25 → +60 от Pass 2 версии) | FIX-1 (multi-pin + side-panel), FIX-2 (HTML col-headers), FIX-3 (dynamic H + auto-hide), FIX-5 (graph default coll), FIX-6 (subtitle removed) |
| `src/components/FiltersDrawer.jsx` | +25 lines | FIX-4 (cascading counts) |
| `src/app.jsx` | +18 lines | FIX-5 (catalog default coll), FIX-6 (catalog subtitle) |
| `src/styles.css` | +90 lines | CSS for `.odin__main`, `.odin__col-headers`, `.odin__sidepanel*`, `.catsec__subtitle/titlewrap`, FIX-8 ControlBar normalization |

---

## Regression check

Проверено build'ом + dev-сервером. Ниже — что я ожидал увидеть и что инструментально подтвердил, чего проверить визуально не мог:

- ✅ `npm run build` — green, 39 модулей, 759ms (было 38)
- ✅ `npm run dev` — стартует за 274ms, в логе ноль ошибок
- ✅ Все ключевые модули отдают 200: `/`, `/main.jsx`, `/app.jsx`, `/graph-view.jsx`, `/components/{ControlBar,FiltersDrawer,MetricPreview,PinnedMetricCard}.jsx`, `/lib/util.js`
- ⚠️ Визуальная регрессия от Pass 2 — на пользователе. Я **не открывал браузер**. Из «вероятных» точек регрессии:
  - Catalog drawer и MetricPreview не трогал — должны работать как в Pass 2
  - FiltersDrawer header показывает тот же activeCount, секции в том же порядке — только counts теперь cascading (FIX-4)
  - ControlBar render не менялся — только CSS-tweak отступов (FIX-8)
  - DARK/LIGHT — переключение темы не трогал
  - 236 метрик в Catalog — `filtered` логика не менялась

---

## Notes / Tech Debt

### Видел, не починил (по DO NOT и Surgical Changes)

1. **TC-12 — scrollbar visibility in Catalog** — отложено в Sprint 3 per prompt
2. **Filter-driven graph display** (показывать только filtered ноды) — Sprint 3 Graph scaling
3. **`ThemeToggle` (`app.jsx:1592`)** — pre-existing dead code, по правилу 3 не удаляю. Кандидат на cleanup в Sprint 3
4. **`.odin__pinned*` CSS** — старые селекторы из Sprint 2 первой итерации (была absolute-panel). Я создал новый `.odin__sidepanel*`. Старые остались как dead CSS. Surgically не подметаю
5. **`.odin__zoom*` CSS** — раньше была floating zoom panel внизу canvas, теперь zoom в ControlBar. Класс остался без consumers'ов
6. **Bundle warning >500KB** — известный, не трогать в этом цикле

### Поведенческие quirk'и от моих фиксов (не баги, но описать)

1. **FIX-1 double-click net-zero pin** — описано выше. Когда дабл-клик'ом открываешь Drawer, pin state остаётся неизменным (toggle×2). Можно реализовать через таймер с трекингом ноды, чтобы single-click был «канонический» (вылетал только когда таймер таки выполнился без отмены), но это +20 строк сложности без явной выгоды. Если станет заметно неудобно — fix-cycle.

2. **FIX-3 dynamic H based on max nodes overall** — даже если L2 collapsed, viewBox H остаётся под её 126 нод. Это значит при свернутой L2 видимые L1+L3 расположены в очень растянутой колонке (sparse). Альтернатива: пересчитывать H по `max(visibleNodes per col)`, но тогда при collapse/expand layout прыгает. Решил оставить стабильный layout. Пользователь может zoom-fit для перерисовки.

3. **FIX-2 col-headers don't track columns during pan** — три HTML-кнопки flex 1 сверху canvas'а; они не двигаются при panning графа. Пользователь видит «L1 заголовок» сверху-слева независимо от того, куда сместился L1 column в SVG. Чтобы вернуть к выравниванию — кнопка `fit` в ControlBar (сбрасывает pan/zoom).

4. **Pinned card после фильтрации не уходит из panel** — если пользователь запиннил метрику A, потом отфильтровал её level → A всё ещё видна в side-panel (граф не показывает её ноду, panel показывает карточку). Считаю это правильным UX: pinned = «явно интересная метрика», должна остаться доступна. Если будет наоборот — лёгкая правка.

5. **FIX-7: с текущим detuned `fakeValue` реальные значения почти всегда < 1000** — для testcounts max ≈ 51000 → `"51K"`, для deposit max ≈ $508 → `"$508.00"`. Чтобы увидеть `50M` форматирование — нужно через DevTools `console.log(formatCompactNumber(50_000_000))`. Реальные значения от Munin (M2 milestone) могут превышать пороги — тогда compact-форматирование себя проявит. Сейчас регрессия не должна быть видна (значения не вылезают за `1.5K`-границу часто).

### Известное от старых пассов (повторяю для контекста)

- `useRef`-импорт остался в `app.jsx` хотя в App body он уже не используется (был для drawer'ского svgRef, теперь в `MetricPreview.jsx`). Безвредно, но невидимый dead-import.
- Семя метрик 236 → bundle 580KB. Production оптимизация (lazy seed) — Sprint 3+.

---

## Sanity-checks (как в prompt'е)

| # | Чек | Результат |
|---|---|---|
| 1 | `npm run dev` без красных Error | ✅ |
| 2 | `npm run build` | ✅ 759ms, 39 модулей |
| 3 | FIX-1 multi-pin | ✅ (single click → pin/unpin, двойной клик → drawer, `×` unpin, `clear all`) |
| 4 | FIX-2 zoom только canvas | ✅ (col-headers HTML-overlay, ControlBar/tooltip — HTML, sidepanel — flex sibling) |
| 5 | FIX-3 spacing + auto-hide | ✅ (H scaled by max, labels hide < zoom 0.7) |
| 6 | FIX-4 cascading counts | ✅ (passesExcept на каждую секцию) |
| 7 | FIX-5 default state | ✅ (L1=false, L2=true, L3=true в обоих view, только при отсутствии ключа) |
| 8 | FIX-6 расшифровки | ✅ (graph короткий, catalog с subtitle) |
| 9 | FIX-7 compact numbers | ✅ (formatCompactNumber + fakeValue refactor) |
| 10 | FIX-8 симметричные отступы | ✅ (cbar 20/20 padding, view slot gap 10) |

---

После репорта — стоп. Пользователь коммитит, делает re-test, Cowork делает мини re-review. Команда коммита (предложение):

```bash
git add src/lib/util.js src/graph-view.jsx src/components src/app.jsx src/styles.css docs/project/sprint-2-fix-report.md
git commit -m "Sprint 2 fix-cycle: 8 fixes (multi-pin, zoom decouple, spacing, cascading counts, defaults, subtitles, compact numbers, padding)"
```

Если хочешь забрать ещё `JTBD-full-scope.md` / `test-cases-sprint-2.md` / `sprint-2-fix-prompt.md` (это твоё / Cowork) — `git add -A` и единый коммит.
